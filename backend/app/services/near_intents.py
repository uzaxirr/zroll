import httpx
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

from app.models.contributor import DestinationChain, USDC_ASSET_BY_CHAIN


# ZEC asset identifier for NEAR Intents
ZEC_ASSET = "zec:native"


@dataclass
class SwapQuote:
    session_id: str
    deposit_address: str
    amount_in: Decimal
    amount_out: Decimal
    expiry: datetime


@dataclass
class SwapStatus:
    session_id: str
    status: str  # PENDING_DEPOSIT, PROCESSING, SUCCESS, FAILED
    tx_hash: str | None = None


class NearIntentsService:
    BASE_URL = "https://1click.chaindefuser.com"

    def __init__(self, timeout: float = 30.0):
        self._client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=timeout,
        )

    async def get_quote(
        self,
        amount_zec: Decimal,
        destination_chain: DestinationChain,
        destination_address: str,
        refund_address: str,
    ) -> SwapQuote:
        """
        Call POST /v0/quote to get a deposit address for ZEC->USDC swap.

        The deposit address returned is a regular Zcash address that can be
        included in a ZIP-321 URI alongside direct ZEC payments.
        """
        dest_asset = USDC_ASSET_BY_CHAIN[destination_chain]

        payload = {
            "fromAsset": ZEC_ASSET,
            "toAsset": dest_asset,
            "amount": str(amount_zec),
            "toAddress": destination_address,
            "refundAddress": refund_address,
        }

        resp = await self._client.post("/v0/quote", json=payload)
        resp.raise_for_status()
        data = resp.json()

        expiry_str = data.get("expiry", "")
        if expiry_str:
            expiry = datetime.fromisoformat(expiry_str.replace("Z", "+00:00"))
        else:
            expiry = datetime.now(timezone.utc)

        return SwapQuote(
            session_id=data["sessionId"],
            deposit_address=data["depositAddress"],
            amount_in=Decimal(str(data.get("amountIn", amount_zec))),
            amount_out=Decimal(str(data.get("amountOut", "0"))),
            expiry=expiry,
        )

    async def submit_deposit(self, session_id: str, tx_id: str) -> None:
        """POST /v0/deposit/submit to speed up deposit detection."""
        payload = {
            "sessionId": session_id,
            "txId": tx_id,
        }
        resp = await self._client.post("/v0/deposit/submit", json=payload)
        resp.raise_for_status()

    async def get_status(self, session_id: str) -> SwapStatus:
        """GET /v0/status/{session_id} to check swap progress."""
        resp = await self._client.get(f"/v0/status/{session_id}")
        resp.raise_for_status()
        data = resp.json()

        return SwapStatus(
            session_id=session_id,
            status=data.get("status", "UNKNOWN"),
            tx_hash=data.get("txHash"),
        )

    async def close(self):
        await self._client.aclose()
