import base64
from decimal import Decimal
from urllib.parse import quote


def generate_zip321_uri(outputs: list[dict]) -> str:
    """
    Build a zcash: URI per ZIP-321 spec.

    Each output dict has: address (str), amount_zec (Decimal), memo_bytes (bytes).

    First output uses bare zcash:<address>?amount=...&memo=...
    Subsequent outputs use indexed params: &address.1=...&amount.1=...&memo.1=...

    Memos are base64url encoded (no padding).
    Amounts are formatted as decimal strings, max 8 decimal places.
    """
    if not outputs:
        raise ValueError("At least one output is required")

    parts = []

    for i, output in enumerate(outputs):
        address = output["address"]
        amount = _format_amount(output["amount_zec"])
        memo = _encode_memo(output["memo_bytes"])

        if i == 0:
            parts.append(f"zcash:{quote(address, safe='')}")
            parts.append(f"amount={amount}")
            parts.append(f"memo={memo}")
        else:
            parts.append(f"address.{i}={quote(address, safe='')}")
            parts.append(f"amount.{i}={amount}")
            parts.append(f"memo.{i}={memo}")

    # Join first part with ?, rest with &
    uri = parts[0] + "?" + "&".join(parts[1:])
    return uri


def _format_amount(amount: Decimal) -> str:
    """Format ZEC amount as decimal string, max 8 decimal places, no trailing zeros."""
    quantized = amount.quantize(Decimal("0.00000001"))
    return f"{quantized:f}".rstrip("0").rstrip(".")


def _encode_memo(memo_bytes: bytes) -> str:
    """Base64url encode memo bytes without padding."""
    return base64.urlsafe_b64encode(memo_bytes).rstrip(b"=").decode("ascii")
