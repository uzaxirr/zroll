import json
from decimal import Decimal

MAX_MEMO_BYTES = 512

TYPE_MAP = {"SAL": "Salary", "BON": "Bonus", "COM": "Commission"}
REVERSE_TYPE_MAP = {v: k for k, v in TYPE_MAP.items()}


def encode_pay_stub(
    org_name: str,
    period_label: str,
    pay_type: str,
    gross_usd: Decimal,
    tax_withheld_usd: Decimal,
    net_usd: Decimal,
    zec_rate_usd: Decimal,
    reference_id: str,
) -> bytes:
    stub = {
        "v": 1,
        "org": org_name[:30],
        "per": period_label,
        "typ": REVERSE_TYPE_MAP.get(pay_type, "SAL"),
        "grs": float(gross_usd),
        "tax": float(-abs(tax_withheld_usd)),
        "net": float(net_usd),
        "rat": float(zec_rate_usd),
        "ref": reference_id,
    }
    encoded = json.dumps(stub, separators=(",", ":")).encode("utf-8")
    if len(encoded) > MAX_MEMO_BYTES:
        raise ValueError(f"Memo exceeds {MAX_MEMO_BYTES} bytes: {len(encoded)}")
    return encoded


def decode_pay_stub(memo_bytes: bytes) -> dict:
    raw = json.loads(memo_bytes.decode("utf-8"))
    return {
        "organization": raw["org"],
        "period": raw["per"],
        "type": TYPE_MAP.get(raw["typ"], raw["typ"]),
        "gross_usd": raw["grs"],
        "tax_withheld_usd": raw["tax"],
        "net_usd": raw["net"],
        "zec_rate": raw["rat"],
        "zec_amount": None,
        "reference": raw["ref"],
        "schema_version": raw["v"],
        "source": "memo",
    }
