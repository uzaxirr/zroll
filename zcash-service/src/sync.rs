use std::sync::Arc;
use std::time::Duration;

use tokio::task::JoinHandle;

use crate::wallet_manager::WalletManager;

/// Spawn a background task that syncs all known wallets with the
/// testnet lightwalletd server at a fixed interval. This keeps
/// wallet balances and transaction confirmations up to date.
pub fn spawn_background_sync(
    manager: Arc<WalletManager>,
    interval: Duration,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        log::info!(
            "Background sync started (interval: {}s)",
            interval.as_secs()
        );

        loop {
            tokio::time::sleep(interval).await;

            let wallet_ids = match manager.all_wallet_ids() {
                Ok(ids) => ids,
                Err(e) => {
                    log::error!("Failed to list wallets for sync: {e}");
                    continue;
                }
            };

            if wallet_ids.is_empty() {
                continue;
            }

            log::info!("Syncing {} wallet(s)...", wallet_ids.len());

            for wallet_id in &wallet_ids {
                match manager.sync_wallet(wallet_id).await {
                    Ok(_) => log::debug!("Synced wallet {wallet_id}"),
                    Err(e) => log::warn!("Failed to sync wallet {wallet_id}: {e}"),
                }
            }

            log::info!("Background sync complete");
        }
    })
}
