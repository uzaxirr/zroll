use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;

use chrono::Utc;
use rusqlite::{params, Connection};
use tokio::sync::Mutex as TokioMutex;
use uuid::Uuid;

use zcash_address::ZcashAddress;
use zcash_client_backend::zip321::{Payment, TransactionRequest};
use zcash_keys::keys::UnifiedFullViewingKey;
use zcash_protocol::consensus::BlockHeight;
use zcash_protocol::memo::Memo;
use zcash_protocol::value::Zatoshis;

use zingolib::config::{ChainType, ZingoConfig};
use zingolib::grpc_connector;
use zingolib::lightclient::LightClient;

use crate::config::ServiceConfig;
use crate::error::ServiceError;
use crate::types::*;

/// Manages real Zcash testnet wallets via zingolib LightClient instances.
/// Each wallet gets its own directory and LightClient. A SQLite database
/// maps wallet IDs to their on-disk paths and tracks tx_id -> wallet_id
/// for transaction lookups.
pub struct WalletManager {
    wallets: TokioMutex<HashMap<String, Arc<TokioMutex<LightClient>>>>,
    config: ServiceConfig,
    db: std::sync::Mutex<Connection>,
}

impl WalletManager {
    pub fn new(config: ServiceConfig, db_path: &Path) -> Result<Self, ServiceError> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS wallet_map (
                wallet_id TEXT PRIMARY KEY,
                wallet_dir TEXT NOT NULL,
                unified_address TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tx_wallet_map (
                tx_id TEXT PRIMARY KEY,
                wallet_id TEXT NOT NULL,
                FOREIGN KEY (wallet_id) REFERENCES wallet_map(wallet_id)
            );
            ",
        )?;

        Ok(Self {
            wallets: TokioMutex::new(HashMap::new()),
            config,
            db: std::sync::Mutex::new(conn),
        })
    }

    /// Build a ZingoConfig for a specific wallet directory.
    fn build_zingo_config(&self, wallet_dir: &Path) -> Result<ZingoConfig, ServiceError> {
        let server_uri: http::Uri = self
            .config
            .lightwalletd_url
            .parse()
            .map_err(|e| ServiceError::Internal(format!("Invalid lightwalletd URI: {e}")))?;

        Ok(ZingoConfig::builder()
            .set_indexer_uri(server_uri)
            .set_network_type(ChainType::Testnet)
            .set_wallet_dir(wallet_dir.to_path_buf())
            .build())
    }

    /// Create a new wallet with fresh entropy. Returns wallet metadata
    /// including the unified address. The spending key stays inside the
    /// zingolib wallet file and never leaves the Rust service.
    pub async fn create_wallet(&self) -> Result<WalletResponse, ServiceError> {
        let wallet_id = Uuid::new_v4().to_string();
        let wallet_dir = self.config.wallet_path(&wallet_id);
        std::fs::create_dir_all(&wallet_dir)?;

        let zingo_config = self.build_zingo_config(&wallet_dir)?;

        // Query lightwalletd for current chain height so the wallet birthday
        // is recent and sync doesn't need to scan the entire chain history.
        let server_uri: http::Uri = self
            .config
            .lightwalletd_url
            .parse()
            .map_err(|e| ServiceError::Internal(format!("Invalid URI: {e}")))?;
        let chain_height = match grpc_connector::get_info(server_uri).await {
            Ok(info) => BlockHeight::from_u32(info.block_height as u32),
            Err(_) => BlockHeight::from_u32(0), // fallback to sapling activation
        };

        let mut client =
            LightClient::new(zingo_config, chain_height, false).map_err(|e| {
                ServiceError::WalletCreation(format!("Failed to create LightClient: {e}"))
            })?;

        // Extract unified address from the new wallet
        let addresses_json = client.unified_addresses_json().await;
        let unified_address = addresses_json[0]["encoded_address"]
            .as_str()
            .unwrap_or("")
            .to_string();

        if unified_address.is_empty() {
            return Err(ServiceError::WalletCreation(
                "Failed to derive unified address".to_string(),
            ));
        }

        // Extract UFVK from the wallet's key store
        let (full_viewing_key, incoming_viewing_key) = {
            let wallet = client.wallet.read().await;
            if let Some(key_store) = wallet.unified_key_store.get(&zip32::AccountId::ZERO) {
                let ufvk = UnifiedFullViewingKey::try_from(key_store)
                    .map_err(|e| ServiceError::Internal(format!("Failed to extract UFVK: {e:?}")))?;
                let encoded = ufvk.encode(&ChainType::Testnet);
                (encoded.clone(), encoded)
            } else {
                (String::new(), String::new())
            }
        };

        // Persist wallet to disk
        client.save_task().await;
        client.wait_for_save().await;

        // Store wallet_id -> path mapping in SQLite
        {
            let db = self
                .db
                .lock()
                .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
            db.execute(
                "INSERT INTO wallet_map (wallet_id, wallet_dir, unified_address, created_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![
                    wallet_id,
                    wallet_dir.to_str().unwrap_or(""),
                    unified_address,
                    Utc::now().to_rfc3339()
                ],
            )?;
        }

        // Cache the LightClient for subsequent operations
        let client = Arc::new(TokioMutex::new(client));
        self.wallets
            .lock()
            .await
            .insert(wallet_id.clone(), client);

        Ok(WalletResponse {
            wallet_id: wallet_id.clone(),
            unified_address,
            full_viewing_key,
            incoming_viewing_key,
        })
    }

    /// Get or lazily load a wallet's LightClient from disk.
    async fn get_client(
        &self,
        wallet_id: &str,
    ) -> Result<Arc<TokioMutex<LightClient>>, ServiceError> {
        // Check in-memory cache first
        {
            let wallets = self.wallets.lock().await;
            if let Some(client) = wallets.get(wallet_id) {
                return Ok(Arc::clone(client));
            }
        }

        // Load from disk
        let wallet_dir = {
            let db = self
                .db
                .lock()
                .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
            let mut stmt = db
                .prepare("SELECT wallet_dir FROM wallet_map WHERE wallet_id = ?1")
                .map_err(|e| ServiceError::Database(e.to_string()))?;
            let dir: String = stmt
                .query_row(params![wallet_id], |row| row.get(0))
                .map_err(|_| ServiceError::WalletNotFound(wallet_id.to_string()))?;
            std::path::PathBuf::from(dir)
        };

        let zingo_config = self.build_zingo_config(&wallet_dir)?;
        let client = LightClient::create_from_wallet_path(zingo_config).map_err(|e| {
            ServiceError::Internal(format!("Failed to load wallet {wallet_id} from disk: {e}"))
        })?;

        let client = Arc::new(TokioMutex::new(client));
        self.wallets
            .lock()
            .await
            .insert(wallet_id.to_string(), Arc::clone(&client));

        Ok(client)
    }

    /// Sync a wallet with the testnet lightwalletd server.
    pub async fn sync_wallet(&self, wallet_id: &str) -> Result<(), ServiceError> {
        let client = self.get_client(wallet_id).await?;
        let mut lc = client.lock().await;
        lc.sync_and_await()
            .await
            .map_err(|e| ServiceError::Sync(format!("{e}")))?;
        lc.save_task().await;
        lc.wait_for_save().await;
        Ok(())
    }

    /// Get balance for a wallet. Syncs first to ensure fresh data.
    pub async fn get_balance(&self, wallet_id: &str) -> Result<BalanceResponse, ServiceError> {
        // Sync before returning balance to avoid stale notes
        self.sync_wallet(wallet_id).await?;

        let client = self.get_client(wallet_id).await?;
        let lc = client.lock().await;
        let balance = lc
            .account_balance(zip32::AccountId::ZERO)
            .await
            .map_err(|e| ServiceError::Internal(format!("Balance error: {e}")))?;

        // AccountBalance fields are Option<Zatoshis>; sum all pools
        let orchard = balance
            .total_orchard_balance
            .map(u64::from)
            .unwrap_or(0);
        let sapling = balance
            .total_sapling_balance
            .map(u64::from)
            .unwrap_or(0);
        let transparent = balance
            .total_transparent_balance
            .map(u64::from)
            .unwrap_or(0);
        let total_zatoshis = orchard + sapling + transparent;
        let balance_zec = total_zatoshis as f64 / 100_000_000.0;

        log::info!(
            "Balance for {wallet_id}: orchard={orchard} sapling={sapling} transparent={transparent} total={total_zatoshis}"
        );

        Ok(BalanceResponse {
            balance_zec,
            last_synced: Some(Utc::now().to_rfc3339()),
        })
    }

    /// Send a shielded transaction from the given wallet.
    /// Syncs the wallet first to ensure spendable notes are up to date.
    /// Returns the real on-chain transaction ID.
    pub async fn send_transaction(
        &self,
        wallet_id: &str,
        outputs: &[TransactionOutput],
    ) -> Result<SendResponse, ServiceError> {
        // Sync before send to ensure spendable notes are current
        self.sync_wallet(wallet_id).await?;

        let client = self.get_client(wallet_id).await?;
        let mut lc = client.lock().await;

        // Build Payment objects for the TransactionRequest
        let payments: Vec<Payment> = outputs
            .iter()
            .map(|o| {
                let address = ZcashAddress::try_from_encoded(&o.address)
                    .map_err(|e| ServiceError::InvalidAddress(format!("{e}")))?;
                let zatoshis = Zatoshis::from_u64((o.amount_zec * 100_000_000.0) as u64)
                    .map_err(|_| ServiceError::Send("Invalid amount".to_string()))?;
                let memo = match &o.memo_bytes {
                    Some(text) => {
                        let memo: Memo = text
                            .parse()
                            .map_err(|e| ServiceError::Send(format!("Invalid memo: {e}")))?;
                        Some(memo.encode())
                    }
                    None => None,
                };
                Payment::new(address, zatoshis, memo, None, None, vec![]).ok_or_else(|| {
                    ServiceError::InvalidAddress(
                        "Cannot send memo to transparent address".to_string(),
                    )
                })
            })
            .collect::<Result<Vec<_>, ServiceError>>()?;

        let request = TransactionRequest::new(payments)
            .map_err(|e| ServiceError::Send(format!("Failed to build transaction request: {e}")))?;

        // quick_send proposes and broadcasts in one step
        let txids = lc
            .quick_send(request, zip32::AccountId::ZERO, false)
            .await
            .map_err(|e| {
                let msg = format!("{e}");
                if msg.contains("InsufficientFunds") || msg.contains("insufficient") {
                    ServiceError::InsufficientFunds
                } else {
                    ServiceError::Send(msg)
                }
            })?;

        // Save wallet state after send
        lc.save_task().await;
        lc.wait_for_save().await;

        // Get the first txid as hex string
        let tx_id = txids.head.to_string();

        // Map tx_id -> wallet_id for later lookups
        {
            let db = self
                .db
                .lock()
                .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
            db.execute(
                "INSERT OR REPLACE INTO tx_wallet_map (tx_id, wallet_id) VALUES (?1, ?2)",
                params![tx_id, wallet_id],
            )?;
        }

        Ok(SendResponse { tx_id })
    }

    /// Get transaction status by looking up which wallet owns it, then
    /// querying that wallet's LightClient for confirmation data.
    pub async fn get_transaction(
        &self,
        tx_id: &str,
    ) -> Result<TransactionStatusResponse, ServiceError> {
        // Find which wallet owns this transaction
        let wallet_id = {
            let db = self
                .db
                .lock()
                .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
            let mut stmt = db
                .prepare("SELECT wallet_id FROM tx_wallet_map WHERE tx_id = ?1")
                .map_err(|e| ServiceError::Database(e.to_string()))?;
            stmt.query_row(params![tx_id], |row| row.get::<_, String>(0))
                .map_err(|_| {
                    ServiceError::WalletNotFound(format!("No wallet found for tx {tx_id}"))
                })?
        };

        // Sync to get latest confirmations
        self.sync_wallet(&wallet_id).await?;

        let client = self.get_client(&wallet_id).await?;
        let lc = client.lock().await;

        // List transactions and find the one matching tx_id
        let summaries = lc
            .transaction_summaries(false)
            .await
            .map_err(|e| ServiceError::Internal(format!("Failed to list transactions: {e}")))?;

        for txn in summaries.iter() {
            if txn.txid.to_string() == tx_id {
                let block_height = Some(u32::from(txn.blockheight) as i64);

                let status = if txn.status.is_confirmed() {
                    "confirmed"
                } else {
                    "pending"
                };

                return Ok(TransactionStatusResponse {
                    tx_id: tx_id.to_string(),
                    confirmations: 0, // would need chain tip height to compute
                    block_height,
                    status: status.to_string(),
                });
            }
        }

        // Transaction not found in wallet history
        Ok(TransactionStatusResponse {
            tx_id: tx_id.to_string(),
            confirmations: 0,
            block_height: None,
            status: "pending".to_string(),
        })
    }

    /// Get decoded memo for a specific transaction output.
    pub async fn get_memo(
        &self,
        tx_id: &str,
        _output_index: u32,
    ) -> Result<MemoResponse, ServiceError> {
        let wallet_id = {
            let db = self
                .db
                .lock()
                .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
            let mut stmt = db
                .prepare("SELECT wallet_id FROM tx_wallet_map WHERE tx_id = ?1")
                .map_err(|e| ServiceError::Database(e.to_string()))?;
            stmt.query_row(params![tx_id], |row| row.get::<_, String>(0))
                .map_err(|_| {
                    ServiceError::WalletNotFound(format!("No wallet found for tx {tx_id}"))
                })?
        };

        let client = self.get_client(&wallet_id).await?;
        let lc = client.lock().await;

        // Use value_transfers to find memos associated with this tx
        let transfers = lc
            .value_transfers(false)
            .await
            .map_err(|e| ServiceError::Internal(format!("Failed to list transfers: {e}")))?;

        for transfer in transfers.iter() {
            if transfer.txid.to_string() == tx_id {
                if let Some(memo_text) = transfer.memos.first() {
                    if !memo_text.is_empty() {
                        return Ok(MemoResponse {
                            memo_decoded: Some(memo_text.clone()),
                        });
                    }
                }
            }
        }

        Ok(MemoResponse {
            memo_decoded: None,
        })
    }

    /// Export a viewing key from a wallet.
    /// Returns the Unified Full Viewing Key (UFVK) encoded as a bech32 string
    /// starting with `uviewtest` (testnet) or `uview` (mainnet).
    pub async fn export_viewing_key(
        &self,
        wallet_id: &str,
        _key_type: &str,
    ) -> Result<ViewingKeyResponse, ServiceError> {
        let client = self.get_client(wallet_id).await?;
        let lc = client.lock().await;

        let wallet = lc.wallet.read().await;
        let key_store = wallet
            .unified_key_store
            .get(&zip32::AccountId::ZERO)
            .ok_or_else(|| ServiceError::Internal("No key store for account 0".to_string()))?;

        let ufvk = UnifiedFullViewingKey::try_from(key_store)
            .map_err(|e| ServiceError::Internal(format!("Failed to extract UFVK: {e:?}")))?;

        let viewing_key = ufvk.encode(&ChainType::Testnet);

        Ok(ViewingKeyResponse { viewing_key })
    }

    /// Shield transparent funds into the Orchard pool so they can be spent
    /// in shielded transactions. Required when a faucet or exchange sends to
    /// the transparent component of a unified address.
    pub async fn shield_funds(&self, wallet_id: &str) -> Result<SendResponse, ServiceError> {
        self.sync_wallet(wallet_id).await?;

        let client = self.get_client(wallet_id).await?;
        let mut lc = client.lock().await;

        let txids = lc
            .quick_shield(zip32::AccountId::ZERO)
            .await
            .map_err(|e| ServiceError::Send(format!("Shield failed: {e}")))?;

        lc.save_task().await;
        lc.wait_for_save().await;

        let tx_id = txids.head.to_string();

        // Map tx_id -> wallet_id
        {
            let db = self
                .db
                .lock()
                .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
            db.execute(
                "INSERT OR REPLACE INTO tx_wallet_map (tx_id, wallet_id) VALUES (?1, ?2)",
                params![tx_id, wallet_id],
            )?;
        }

        Ok(SendResponse { tx_id })
    }

    /// Clear all cached sync data and rescan from wallet birthday.
    /// This fixes stale shard tree data after switching lightwalletd servers.
    pub async fn rescan_wallet(&self, wallet_id: &str) -> Result<(), ServiceError> {
        let client = self.get_client(wallet_id).await?;
        let mut lc = client.lock().await;
        log::info!("Starting full rescan for wallet {wallet_id}...");
        lc.rescan_and_await()
            .await
            .map_err(|e| ServiceError::Sync(format!("Rescan failed: {e}")))?;
        lc.save_task().await;
        lc.wait_for_save().await;
        log::info!("Rescan complete for wallet {wallet_id}");
        Ok(())
    }

    /// Get all wallet IDs for background sync.
    pub fn all_wallet_ids(&self) -> Result<Vec<String>, ServiceError> {
        let db = self
            .db
            .lock()
            .map_err(|e| ServiceError::Database(format!("Lock error: {e}")))?;
        let mut stmt = db
            .prepare("SELECT wallet_id FROM wallet_map")
            .map_err(|e| ServiceError::Database(e.to_string()))?;
        let ids = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|e| ServiceError::Database(e.to_string()))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(ids)
    }
}
