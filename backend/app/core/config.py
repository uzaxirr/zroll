from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5434/zroll"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5434/zroll"

    # Auth
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Zcash
    zcash_service_url: str = "http://localhost:8080"
    zcash_network: str = "testnet"

    # Price Feed
    coingecko_api_key: str = ""

    # Encryption
    wallet_encryption_key: str = ""

    # App
    app_env: str = "development"
    backend_url: str = "http://localhost:8001"
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": "../.env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
