use serde::{Deserialize, Serialize};

// --- Request types ---

#[derive(Debug, Deserialize)]
pub struct SendRequest {
    pub outputs: Vec<TransactionOutput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionOutput {
    pub address: String,
    pub amount_zec: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memo_bytes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ViewingKeyRequest {
    pub key_type: String,
}

// --- Response types ---

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub wallet_id: String,
    pub unified_address: String,
    pub full_viewing_key: String,
    pub incoming_viewing_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed_phrase: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BalanceResponse {
    pub balance_zec: f64,
    pub last_synced: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SendResponse {
    pub tx_id: String,
}

#[derive(Debug, Serialize)]
pub struct TransactionStatusResponse {
    pub tx_id: String,
    pub confirmations: i64,
    pub block_height: Option<i64>,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct MemoResponse {
    pub memo_decoded: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ViewingKeyResponse {
    pub viewing_key: String,
}

// --- View-only (UFVK) types ---

#[derive(Debug, Deserialize)]
pub struct ViewOnlyRequest {
    pub ufvk: String,
    #[serde(default = "default_birthday")]
    pub birthday: u32,
}

fn default_birthday() -> u32 {
    3860000
}

#[derive(Debug, Serialize)]
pub struct ViewOnlyTransfer {
    pub tx_id: String,
    pub block_height: u32,
    pub amount_zec: f64,
    pub memo: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct ViewOnlyResponse {
    pub balance_zec: f64,
    pub transactions: Vec<ViewOnlyTransfer>,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub network: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct SyncResponse {
    pub status: String,
    pub wallet_id: String,
}
