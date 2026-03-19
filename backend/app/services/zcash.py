from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
import httpx

from app.core.config import get_settings

settings = get_settings()


@dataclass
class WalletKeys:
    wallet_id: str
    unified_address: str
    full_viewing_key: str
    incoming_viewing_key: str


@dataclass
class PayrollOutput:
    address: str
    amount: Decimal
    memo: bytes


@dataclass
class TransactionInfo:
    tx_id: str
    block_height: int
    confirmations: int
    status: str


class ZcashService:
    def __init__(self):
        self.base_url = settings.zcash_service_url
        # Real blockchain operations need longer timeouts.
        # Sync can take 30-60s, sends up to 120s on testnet.
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=300.0)

    async def generate_wallet(self) -> WalletKeys:
        resp = await self.client.post("/wallet/generate")
        resp.raise_for_status()
        data = resp.json()
        return WalletKeys(
            wallet_id=data["wallet_id"],
            unified_address=data["unified_address"],
            full_viewing_key=data["full_viewing_key"],
            incoming_viewing_key=data["incoming_viewing_key"],
        )

    async def get_balance(self, wallet_id: str) -> Decimal:
        """Get balance for a wallet. The Rust service syncs before returning."""
        resp = await self.client.get(f"/wallet/{wallet_id}/balance")
        resp.raise_for_status()
        data = resp.json()
        return Decimal(str(data["balance_zec"]))

    async def sync_wallet(self, wallet_id: str) -> None:
        """Explicitly sync a wallet with the blockchain."""
        resp = await self.client.post(f"/wallet/{wallet_id}/sync")
        resp.raise_for_status()

    async def send_payroll(self, wallet_id: str, items: list[PayrollOutput]) -> str:
        """Send a batch shielded transaction from the given wallet.
        The Rust service manages all key material internally."""
        payload = {
            "outputs": [
                {
                    "address": item.address,
                    "amount_zec": float(item.amount),
                    "memo_bytes": item.memo.decode("utf-8", errors="replace")
                    if item.memo
                    else None,
                }
                for item in items
            ],
        }
        resp = await self.client.post(
            f"/wallet/{wallet_id}/send", json=payload, timeout=300.0
        )
        resp.raise_for_status()
        data = resp.json()
        return data["tx_id"]

    async def get_transaction(self, tx_id: str) -> TransactionInfo:
        resp = await self.client.get(f"/transaction/{tx_id}")
        resp.raise_for_status()
        data = resp.json()
        return TransactionInfo(
            tx_id=data["tx_id"],
            block_height=data.get("block_height", 0) or 0,
            confirmations=data.get("confirmations", 0),
            status=data.get("status", "unknown"),
        )

    async def export_viewing_key(self, wallet_id: str, key_type: str) -> str:
        resp = await self.client.post(
            f"/wallet/{wallet_id}/viewing-key",
            json={"key_type": key_type},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["viewing_key"]

    async def close(self):
        await self.client.aclose()
