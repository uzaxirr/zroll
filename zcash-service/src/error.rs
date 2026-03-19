use actix_web::{HttpResponse, ResponseError};
use std::fmt;

use crate::types::ErrorResponse;

#[derive(Debug)]
pub enum ServiceError {
    WalletCreation(String),
    WalletNotFound(String),
    Sync(String),
    Send(String),
    InsufficientFunds,
    InvalidAddress(String),
    Database(String),
    Internal(String),
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::WalletCreation(msg) => write!(f, "Wallet creation failed: {msg}"),
            Self::WalletNotFound(id) => write!(f, "Wallet not found: {id}"),
            Self::Sync(msg) => write!(f, "Sync failed: {msg}"),
            Self::Send(msg) => write!(f, "Send failed: {msg}"),
            Self::InsufficientFunds => write!(f, "Insufficient funds"),
            Self::InvalidAddress(addr) => write!(f, "Invalid address: {addr}"),
            Self::Database(msg) => write!(f, "Database error: {msg}"),
            Self::Internal(msg) => write!(f, "Internal error: {msg}"),
        }
    }
}

impl ResponseError for ServiceError {
    fn error_response(&self) -> HttpResponse {
        let (status, message) = match self {
            Self::WalletNotFound(_) => (actix_web::http::StatusCode::NOT_FOUND, self.to_string()),
            Self::InsufficientFunds => (actix_web::http::StatusCode::BAD_REQUEST, self.to_string()),
            Self::InvalidAddress(_) => (actix_web::http::StatusCode::BAD_REQUEST, self.to_string()),
            _ => (
                actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                self.to_string(),
            ),
        };
        HttpResponse::build(status).json(ErrorResponse { error: message })
    }
}

impl From<rusqlite::Error> for ServiceError {
    fn from(e: rusqlite::Error) -> Self {
        Self::Database(e.to_string())
    }
}

impl From<std::io::Error> for ServiceError {
    fn from(e: std::io::Error) -> Self {
        Self::Internal(e.to_string())
    }
}
