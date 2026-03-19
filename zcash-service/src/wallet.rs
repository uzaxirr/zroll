use actix_web::{get, post, web, HttpResponse};

use crate::error::ServiceError;
use crate::types::*;
use crate::wallet_manager::WalletManager;

#[post("/wallet/generate")]
pub async fn generate_wallet(
    manager: web::Data<WalletManager>,
) -> Result<HttpResponse, ServiceError> {
    let resp = manager.create_wallet().await?;
    Ok(HttpResponse::Ok().json(resp))
}

#[get("/wallet/{id}/balance")]
pub async fn get_balance(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
) -> Result<HttpResponse, ServiceError> {
    let wallet_id = path.into_inner();
    let resp = manager.get_balance(&wallet_id).await?;
    Ok(HttpResponse::Ok().json(resp))
}

#[post("/wallet/{id}/sync")]
pub async fn sync_wallet(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
) -> Result<HttpResponse, ServiceError> {
    let wallet_id = path.into_inner();
    manager.sync_wallet(&wallet_id).await?;
    Ok(HttpResponse::Ok().json(SyncResponse {
        status: "synced".to_string(),
        wallet_id,
    }))
}

#[post("/wallet/{id}/shield")]
pub async fn shield_funds(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
) -> Result<HttpResponse, ServiceError> {
    let wallet_id = path.into_inner();
    let resp = manager.shield_funds(&wallet_id).await?;
    Ok(HttpResponse::Ok().json(resp))
}

#[post("/wallet/{id}/rescan")]
pub async fn rescan_wallet(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
) -> Result<HttpResponse, ServiceError> {
    let wallet_id = path.into_inner();
    manager.rescan_wallet(&wallet_id).await?;
    Ok(HttpResponse::Ok().json(SyncResponse {
        status: "rescanned".to_string(),
        wallet_id,
    }))
}

#[post("/view/transactions")]
pub async fn view_transactions(
    manager: web::Data<WalletManager>,
    body: web::Json<ViewOnlyRequest>,
) -> Result<HttpResponse, ServiceError> {
    let resp = manager
        .view_transactions_by_ufvk(&body.ufvk, body.birthday)
        .await?;
    Ok(HttpResponse::Ok().json(resp))
}

#[post("/wallet/{id}/viewing-key")]
pub async fn export_viewing_key(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
    body: web::Json<ViewingKeyRequest>,
) -> Result<HttpResponse, ServiceError> {
    let wallet_id = path.into_inner();
    let resp = manager.export_viewing_key(&wallet_id, &body.key_type).await?;
    Ok(HttpResponse::Ok().json(resp))
}
