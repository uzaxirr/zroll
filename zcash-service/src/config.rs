use std::path::PathBuf;

use crate::error::ServiceError;

#[derive(Clone)]
pub struct ServiceConfig {
    pub lightwalletd_url: String,
    pub wallet_dir: PathBuf,
    pub sync_interval_secs: u64,
}

impl ServiceConfig {
    pub fn from_env() -> Result<Self, ServiceError> {
        let lightwalletd_url = std::env::var("ZCASH_LIGHTWALLETD_URL")
            .unwrap_or_else(|_| "https://testnet.zec.rocks:443".to_string());

        let wallet_dir = PathBuf::from(
            std::env::var("ZCASH_WALLET_DIR")
                .unwrap_or_else(|_| "./wallets".to_string()),
        );

        let sync_interval_secs: u64 = std::env::var("ZCASH_SYNC_INTERVAL")
            .unwrap_or_else(|_| "120".to_string())
            .parse()
            .unwrap_or(120);

        std::fs::create_dir_all(&wallet_dir).map_err(|e| {
            ServiceError::Internal(format!("Failed to create wallet directory: {e}"))
        })?;

        Ok(Self {
            lightwalletd_url,
            wallet_dir,
            sync_interval_secs,
        })
    }

    /// Build a ZingoConfig for a specific wallet directory.
    /// Each wallet gets its own subdirectory and LightClient instance.
    pub fn wallet_path(&self, wallet_id: &str) -> PathBuf {
        self.wallet_dir.join(wallet_id)
    }
}
