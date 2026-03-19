use actix_web::{get, post, web, HttpResponse};

use crate::error::ServiceError;
use crate::types::*;
use crate::wallet_manager::WalletManager;

#[post("/wallet/{id}/send")]
pub async fn send_transaction(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
    body: web::Json<SendRequest>,
) -> Result<HttpResponse, ServiceError> {
    let wallet_id = path.into_inner();

    if body.outputs.is_empty() {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "outputs array must not be empty".to_string(),
        }));
    }

    for output in &body.outputs {
        if output.amount_zec <= 0.0 {
            return Ok(HttpResponse::BadRequest().json(ErrorResponse {
                error: "amount_zec must be positive".to_string(),
            }));
        }
        if output.address.is_empty() {
            return Ok(HttpResponse::BadRequest().json(ErrorResponse {
                error: "address must not be empty".to_string(),
            }));
        }
    }

    let resp = manager
        .send_transaction(&wallet_id, &body.outputs)
        .await?;
    Ok(HttpResponse::Ok().json(resp))
}

#[get("/transaction/{tx_id}")]
pub async fn get_transaction(
    manager: web::Data<WalletManager>,
    path: web::Path<String>,
) -> Result<HttpResponse, ServiceError> {
    let tx_id = path.into_inner();
    let resp = manager.get_transaction(&tx_id).await?;
    Ok(HttpResponse::Ok().json(resp))
}

#[get("/transaction/{tx_id}/memo/{output_index}")]
pub async fn get_memo(
    manager: web::Data<WalletManager>,
    path: web::Path<(String, u32)>,
) -> Result<HttpResponse, ServiceError> {
    let (tx_id, output_index) = path.into_inner();
    let resp = manager.get_memo(&tx_id, output_index).await?;
    Ok(HttpResponse::Ok().json(resp))
}
