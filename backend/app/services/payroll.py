import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.payroll import PayrollRun, PayrollItem, PayrollRunStatus, PayrollItemStatus
from app.models.contributor import Contributor, ContributorStatus
from app.models.wallet import OrgWallet
from app.models.financial import Transaction, TransactionDirection, TransactionType, TransactionPool
from app.services.zcash import ZcashService, PayrollOutput
from app.services.memo import encode_pay_stub
from app.services.price import PriceService
from app.core.encryption import decrypt


async def prepare_payroll(
    db: AsyncSession,
    org_id: uuid.UUID,
    price_service: PriceService,
) -> dict:
    result = await db.execute(
        select(Contributor).where(
            Contributor.organization_id == org_id,
            Contributor.status == ContributorStatus.active,
        )
    )
    contributors = result.scalars().all()

    result = await db.execute(
        select(OrgWallet).where(OrgWallet.organization_id == org_id)
    )
    wallet = result.scalar_one_or_none()

    zec_rate = await price_service.get_zec_price()

    items = []
    total_usd = Decimal("0")
    for c in contributors:
        net = c.monthly_rate_usd  # simplified: no withholding in prepare
        total_usd += net
        items.append({
            "id": str(c.id),
            "name": c.full_name,
            "department": c.department,
            "monthly_rate_usd": float(c.monthly_rate_usd),
            "wallet_address_masked": _mask_address(decrypt(c.wallet_address) if c.wallet_address else ""),
            "tax_rate": 0.0,
        })

    total_zec = total_usd / zec_rate if zec_rate > 0 else Decimal("0")

    now = datetime.now(timezone.utc)
    period = now.strftime("%B %Y")

    return {
        "period": period,
        "contributors": items,
        "zec_rate_usd": float(zec_rate),
        "org_wallet_balance_zec": float(wallet.balance_zec) if wallet else 0,
        "estimated_total_usd": float(total_usd),
        "estimated_total_zec": float(total_zec),
        "estimated_network_fee": 0.012,
    }


async def execute_payroll(
    db: AsyncSession,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    period_label: str,
    period_start: str,
    period_end: str,
    items: list[dict],
    zec_rate: Decimal,
    org_name: str,
) -> PayrollRun:
    total_usd = Decimal("0")
    total_zec = Decimal("0")

    # Parse date strings to date objects if needed
    ps = period_start if isinstance(period_start, date) else date.fromisoformat(period_start)
    pe = period_end if isinstance(period_end, date) else date.fromisoformat(period_end)

    run = PayrollRun(
        organization_id=org_id,
        initiated_by=user_id,
        period_label=period_label,
        period_start=ps,
        period_end=pe,
        status=PayrollRunStatus.processing,
        zec_rate_usd=zec_rate,
        recipient_count=len(items),
    )
    db.add(run)
    await db.flush()

    payroll_items = []
    for item_data in items:
        gross = Decimal(str(item_data["gross_usd"]))
        tax = Decimal(str(item_data.get("tax_withheld_usd", 0)))
        net = gross - tax
        zec_amount = net / zec_rate if zec_rate > 0 else Decimal("0")

        total_usd += net
        total_zec += zec_amount

        ref_num = len(payroll_items) + 1
        reference = f"PAY-{period_label.replace(' ', '-')}-{ref_num:03d}"

        memo_data = {
            "org": org_name[:30],
            "period": period_label,
            "type": "Salary",
            "gross": float(gross),
            "tax": float(-abs(tax)),
            "net": float(net),
            "rate": float(zec_rate),
            "ref": reference,
        }

        pi = PayrollItem(
            payroll_run_id=run.id,
            contributor_id=uuid.UUID(item_data["contributor_id"]),
            gross_usd=gross,
            tax_withheld_usd=tax,
            net_usd=net,
            zec_amount=zec_amount,
            zec_rate_usd=zec_rate,
            memo_data=memo_data,
            status=PayrollItemStatus.pending,
        )
        db.add(pi)
        payroll_items.append(pi)

    run.total_usd = total_usd
    run.total_zec = total_zec
    run.network_fee_zec = Decimal("0.012")

    await db.flush()
    return run


def _mask_address(addr: str) -> str:
    if len(addr) < 8:
        return addr
    return f"{addr[:4]}...{addr[-4:]}"
