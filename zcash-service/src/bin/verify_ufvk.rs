//! Verify a UFVK by importing it as a view-only wallet, syncing, and listing transactions.
//!
//!   cargo run --bin verify-ufvk

use std::num::NonZeroU32;
use std::path::PathBuf;

use zcash_protocol::consensus::BlockHeight;
use zingolib::config::{ChainType, ZingoConfig};
use zingolib::lightclient::LightClient;
use zingolib::wallet::{LightWallet, WalletBase, WalletSettings};

use pepper_sync::config::{PerformanceLevel, SyncConfig, TransparentAddressDiscovery};

#[tokio::main]
async fn main() {
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("warn"));

    eprintln!("=== UFVK Verification Tool ===");
    eprintln!();
    eprintln!("Paste your UFVK (uviewtest1... or uview1...):");

    let mut ufvk_input = String::new();
    std::io::stdin()
        .read_line(&mut ufvk_input)
        .expect("Failed to read input");
    let ufvk = ufvk_input.trim().to_string();

    if ufvk.is_empty() {
        eprintln!("Error: No UFVK provided.");
        std::process::exit(1);
    }

    eprintln!();
    eprintln!("Enter wallet birthday height (default: 3860000):");

    let mut birthday_input = String::new();
    std::io::stdin()
        .read_line(&mut birthday_input)
        .expect("Failed to read input");
    let birthday: u32 = birthday_input.trim().parse().unwrap_or(3860000);

    // Create temp directory for the view-only wallet
    let wallet_dir = PathBuf::from("/tmp/zroll-ufvk-verify");
    let _ = std::fs::remove_dir_all(&wallet_dir);
    std::fs::create_dir_all(&wallet_dir).expect("Failed to create temp dir");

    let server_uri: http::Uri = "https://testnet.zec.rocks:443"
        .parse()
        .expect("Invalid URI");

    let zingo_config = ZingoConfig::builder()
        .set_indexer_uri(server_uri)
        .set_network_type(ChainType::Testnet)
        .set_wallet_dir(wallet_dir)
        .build();

    eprintln!();
    eprintln!("Creating view-only wallet from UFVK...");

    let wallet_settings = WalletSettings {
        sync_config: SyncConfig {
            transparent_address_discovery: TransparentAddressDiscovery::minimal(),
            performance_level: PerformanceLevel::High,
        },
        min_confirmations: NonZeroU32::new(1).unwrap(),
    };

    let wallet = LightWallet::new(
        ChainType::Testnet,
        WalletBase::Ufvk(ufvk),
        BlockHeight::from_u32(birthday),
        wallet_settings,
    )
    .unwrap_or_else(|e| {
        eprintln!("Error creating view-only wallet: {e:?}");
        std::process::exit(1);
    });

    let mut client = LightClient::create_from_wallet(wallet, zingo_config, true)
        .unwrap_or_else(|e| {
            eprintln!("Error creating LightClient: {e}");
            std::process::exit(1);
        });

    eprintln!("Syncing with testnet (this may take a minute)...");
    client.sync_and_await().await.unwrap_or_else(|e| {
        eprintln!("Sync error: {e}");
        std::process::exit(1);
    });
    eprintln!("Sync complete.");

    // Show balance
    let balance = client
        .account_balance(zip32::AccountId::ZERO)
        .await
        .unwrap_or_else(|e| {
            eprintln!("Balance error: {e}");
            std::process::exit(1);
        });

    let orchard = balance.total_orchard_balance.map(u64::from).unwrap_or(0);
    let sapling = balance.total_sapling_balance.map(u64::from).unwrap_or(0);
    let transparent = balance
        .total_transparent_balance
        .map(u64::from)
        .unwrap_or(0);
    let total = orchard + sapling + transparent;

    eprintln!();
    eprintln!("=== Wallet Balance ===");
    eprintln!(
        "  Orchard:     {} zatoshis ({:.8} ZEC)",
        orchard,
        orchard as f64 / 1e8
    );
    eprintln!(
        "  Sapling:     {} zatoshis ({:.8} ZEC)",
        sapling,
        sapling as f64 / 1e8
    );
    eprintln!(
        "  Transparent: {} zatoshis ({:.8} ZEC)",
        transparent,
        transparent as f64 / 1e8
    );
    eprintln!(
        "  Total:       {} zatoshis ({:.8} ZEC)",
        total,
        total as f64 / 1e8
    );

    // List transactions
    eprintln!();
    eprintln!("=== Transactions ===");

    match client.transaction_summaries(false).await {
        Ok(summaries) => {
            if summaries.iter().count() == 0 {
                eprintln!("  No transactions found.");
            } else {
                for txn in summaries.iter() {
                    let status = if txn.status.is_confirmed() {
                        "confirmed"
                    } else {
                        "pending"
                    };
                    eprintln!(
                        "  TxID: {} | Block: {} | Status: {}",
                        txn.txid,
                        u32::from(txn.blockheight),
                        status
                    );
                }
            }
        }
        Err(e) => {
            eprintln!("  Error listing transactions: {e}");
        }
    }

    // List value transfers (includes memos)
    eprintln!();
    eprintln!("=== Value Transfers ===");
    match client.value_transfers(false).await {
        Ok(transfers) => {
            if transfers.iter().count() == 0 {
                eprintln!("  No transfers found.");
            } else {
                for t in transfers.iter() {
                    let amount_zec = t.value as f64 / 1e8;
                    let memo = if let Some(m) = t.memos.first() {
                        if m.is_empty() {
                            "none".to_string()
                        } else {
                            m.clone()
                        }
                    } else {
                        "none".to_string()
                    };
                    eprintln!("  TxID: {} | {:.8} ZEC | Memo: {}", t.txid, amount_zec, memo);
                }
            }
        }
        Err(e) => {
            eprintln!("  Error listing transfers: {e}");
        }
    }

    eprintln!();
    eprintln!("UFVK verification complete. If you see balance/transactions above,");
    eprintln!("the viewing key derivation is correct.");

    // Clean up
    let _ = std::fs::remove_dir_all("/tmp/zroll-ufvk-verify");
}
