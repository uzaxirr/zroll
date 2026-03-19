from decimal import Decimal
from datetime import datetime, timezone
import httpx
import redis.asyncio as redis

from app.core.config import get_settings

settings = get_settings()

CACHE_KEY = "zec_price_usd"
CACHE_TTL = 120  # seconds


class PriceService:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        self.coingecko_url = "https://api.coingecko.com/api/v3"

    async def get_zec_price(self) -> Decimal:
        cached = await self.redis.get(CACHE_KEY)
        if cached:
            return Decimal(cached)

        price = await self._fetch_from_coingecko()
        await self.redis.setex(CACHE_KEY, CACHE_TTL, str(price))
        return price

    async def _fetch_from_coingecko(self) -> Decimal:
        headers = {}
        if settings.coingecko_api_key:
            headers["x-cg-demo-api-key"] = settings.coingecko_api_key

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.coingecko_url}/simple/price",
                params={"ids": "zcash", "vs_currencies": "usd"},
                headers=headers,
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return Decimal(str(data["zcash"]["usd"]))

    async def set_price_cache(self, price: Decimal) -> None:
        await self.redis.setex(CACHE_KEY, CACHE_TTL, str(price))

    async def close(self):
        await self.redis.aclose()
