mod config;
mod error;
mod sync;
mod transaction;
mod types;
mod wallet;
mod wallet_manager;

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use actix_web::{get, web, App, HttpResponse, HttpServer, middleware::Logger};

use config::ServiceConfig;
use types::*;
use wallet_manager::WalletManager;

#[get("/health")]
async fn health() -> HttpResponse {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        network: "testnet".to_string(),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // Install rustls crypto provider for TLS connections to lightwalletd
    if let Err(e) = rustls::crypto::ring::default_provider().install_default() {
        log::warn!("Failed to install rustls crypto provider (may already be installed): {e:?}");
    }

    let service_config = ServiceConfig::from_env().expect("Failed to load service config");

    let db_path = PathBuf::from(
        std::env::var("ZCASH_DB_PATH").unwrap_or_else(|_| "zcash_wallets.db".to_string()),
    );

    let manager = WalletManager::new(service_config.clone(), &db_path)
        .expect("Failed to initialize wallet manager");
    let manager = Arc::new(manager);

    // Spawn background sync task
    let sync_interval = Duration::from_secs(service_config.sync_interval_secs);
    let _sync_handle = sync::spawn_background_sync(Arc::clone(&manager), sync_interval);

    let manager_data = web::Data::from(manager);
    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".to_string());

    log::info!("Starting Zcash service on {bind_addr}");
    log::info!("Network: testnet");
    log::info!(
        "Lightwalletd: {}",
        std::env::var("ZCASH_LIGHTWALLETD_URL")
            .unwrap_or_else(|_| "https://testnet.zec.rocks:443".to_string())
    );
    log::info!("Wallet directory: {}", service_config.wallet_dir.display());

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(manager_data.clone())
            .service(health)
            .service(wallet::generate_wallet)
            .service(wallet::get_balance)
            .service(wallet::sync_wallet)
            .service(wallet::shield_funds)
            .service(wallet::rescan_wallet)
            .service(wallet::export_viewing_key)
            .service(wallet::view_transactions)
            .service(transaction::send_transaction)
            .service(transaction::get_transaction)
            .service(transaction::get_memo)
    })
    .bind(&bind_addr)?
    .run()
    .await
}
