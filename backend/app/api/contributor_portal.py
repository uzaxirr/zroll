import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthContext, require_role
from app.core.config import get_settings
from app.core.database import get_db
from app.models.payroll import PayrollRun, PayrollItem
from app.models.contributor import Contributor
from app.models.financial import Transaction, TaxEvent, TaxEventType, ZecPriceHistory
from app.models.wallet import OrgWallet, SharedViewingKey
from app.models.organization import Organization
from app.services.price import PriceService
from app.services.memo import decode_pay_stub
import httpx

router = APIRouter(prefix="/api/contributor", tags=["contributor_portal"])


async def _get_contributor(auth: AuthContext, db: AsyncSession) -> Contributor:
    result = await db.execute(
        select(Contributor).where(Contributor.user_id == auth.user.id)
    )
    contributor = result.scalar_one_or_none()
    if not contributor and get_settings().app_env == "development":
        # Dev fallback: return first contributor in the org
        result = await db.execute(
            select(Contributor)
            .where(Contributor.organization_id == auth.organization.id)
            .limit(1)
        )
        contributor = result.scalar_one_or_none()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor profile not found")
    return contributor


@router.get("/stats")
async def contributor_stats(
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    # Total received
    result = await db.execute(
        select(
            func.coalesce(func.sum(PayrollItem.zec_amount), 0),
            func.coalesce(func.sum(PayrollItem.net_usd), 0),
        ).where(PayrollItem.contributor_id == contributor.id)
    )
    total_zec, total_usd = result.one()

    # Last payment
    result = await db.execute(
        select(PayrollItem)
        .where(PayrollItem.contributor_id == contributor.id)
        .order_by(PayrollItem.created_at.desc())
        .limit(1)
    )
    last_item = result.scalar_one_or_none()

    # Organization names
    result = await db.execute(
        select(Organization.name)
        .join(Contributor, Contributor.organization_id == Organization.id)
        .where(Contributor.user_id == auth.user.id)
    )
    org_names = [r[0] for r in result]

    return {
        "total_received_zec": float(total_zec),
        "total_received_usd": float(total_usd),
        "last_payment_zec": float(last_item.zec_amount) if last_item else 0,
        "last_payment_date": last_item.created_at.isoformat() if last_item else None,
        "organization_count": len(org_names),
        "organizations": org_names,
        "verification_status": contributor.verification_status,
        "test_tx_id": contributor.test_tx_id,
    }


@router.get("/viewing-key")
async def contributor_viewing_key(
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    result = await db.execute(
        select(OrgWallet).where(OrgWallet.organization_id == contributor.organization_id)
    )
    wallet = result.scalar_one_or_none()

    if not wallet:
        return {"has_key": False, "viewing_key": None, "key_type": None}

    return {
        "has_key": True,
        "viewing_key": wallet.viewing_key_full,
        "key_type": "full",
    }


CIPHERSCAN_API = "https://api.testnet.cipherscan.app/api"


@router.get("/tx-status/{tx_id}")
async def contributor_tx_status(
    tx_id: str,
    auth: AuthContext = Depends(require_role("contributor")),
):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{CIPHERSCAN_API}/tx/{tx_id}")
            resp.raise_for_status()
            data = resp.json()
            return {
                "tx_id": tx_id,
                "confirmations": data.get("confirmations", 0),
                "block_height": data.get("block_height"),
                "timestamp": data.get("timestamp"),
                "confirmed": data.get("confirmations", 0) >= 1,
            }
        except Exception:
            return {
                "tx_id": tx_id,
                "confirmations": None,
                "block_height": None,
                "timestamp": None,
                "confirmed": None,
            }


@router.get("/payments")
async def contributor_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    offset = (page - 1) * limit
    result = await db.execute(
        select(PayrollItem)
        .join(PayrollRun)
        .where(PayrollItem.contributor_id == contributor.id)
        .options(
            selectinload(PayrollItem.payroll_run).selectinload(PayrollRun.organization),
        )
        .order_by(PayrollItem.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()

    return {
        "payments": [
            {
                "date": item.created_at.isoformat(),
                "amount_zec": float(item.zec_amount),
                "amount_usd": float(item.net_usd),
                "from": item.payroll_run.organization.name if item.payroll_run.organization else "",
                "status": "shielded",
                "payroll_item_id": str(item.id),
                "tx_id": item.payroll_run.tx_id,
                "confirmations": item.payroll_run.confirmations,
                "memo": item.memo_data,
            }
            for item in items
        ]
    }


@router.get("/payments/{item_id}/stub")
async def contributor_pay_stub(
    item_id: uuid.UUID,
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    result = await db.execute(
        select(PayrollItem)
        .where(
            PayrollItem.id == item_id,
            PayrollItem.contributor_id == contributor.id,
        )
        .options(
            selectinload(PayrollItem.payroll_run).selectinload(PayrollRun.organization),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Pay stub not found")

    if item.memo_data:
        return {
            "organization": item.memo_data.get("org", ""),
            "period": item.memo_data.get("period", item.payroll_run.period_label),
            "type": item.memo_data.get("type", "Salary"),
            "gross_usd": float(item.gross_usd),
            "tax_withheld_usd": float(-abs(item.tax_withheld_usd)),
            "net_usd": float(item.net_usd),
            "zec_rate": float(item.zec_rate_usd),
            "zec_amount": float(item.zec_amount),
            "reference": item.memo_data.get("ref", ""),
            "source": "memo",
        }

    return {
        "organization": item.payroll_run.organization.name if item.payroll_run.organization else "",
        "period": item.payroll_run.period_label,
        "type": "Salary",
        "gross_usd": float(item.gross_usd),
        "tax_withheld_usd": float(-abs(item.tax_withheld_usd)),
        "net_usd": float(item.net_usd),
        "zec_rate": float(item.zec_rate_usd),
        "zec_amount": float(item.zec_amount),
        "reference": "",
        "source": "database",
    }


@router.get("/portfolio")
async def contributor_portfolio(
    period: str = Query("7d"),
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    # Calculate balance from transactions
    result = await db.execute(
        select(func.coalesce(func.sum(PayrollItem.zec_amount), 0))
        .where(PayrollItem.contributor_id == contributor.id)
    )
    balance_zec = Decimal(str(result.scalar()))

    price_service = PriceService()
    try:
        zec_rate = await price_service.get_zec_price()
    except Exception:
        zec_rate = Decimal("0")
    finally:
        await price_service.close()

    balance_usd = balance_zec * zec_rate

    # Get price history for chart
    from datetime import datetime, timedelta, timezone
    days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(ZecPriceHistory)
        .where(ZecPriceHistory.timestamp >= since)
        .order_by(ZecPriceHistory.timestamp)
    )
    prices = result.scalars().all()

    chart_data = [
        {
            "timestamp": p.timestamp.isoformat(),
            "value_usd": float(balance_zec * p.price_usd),
        }
        for p in prices
    ]

    change_usd = Decimal("0")
    change_pct = 0.0
    if len(chart_data) >= 2:
        first = Decimal(str(chart_data[0]["value_usd"]))
        last = Decimal(str(chart_data[-1]["value_usd"]))
        change_usd = last - first
        change_pct = float((change_usd / first * 100)) if first > 0 else 0.0

    return {
        "balance_zec": float(balance_zec),
        "balance_usd": float(balance_usd),
        "zec_rate": float(zec_rate),
        "change_usd": float(change_usd),
        "change_pct": change_pct,
        "chart_data": chart_data,
    }


@router.get("/transactions")
async def contributor_transactions(
    limit: int = Query(5, ge=1, le=50),
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    result = await db.execute(
        select(Transaction)
        .where(Transaction.contributor_id == contributor.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    txns = result.scalars().all()

    return [
        {
            "type": t.tx_type.value,
            "description": f"{t.tx_type.value.title()} - {auth.organization.name}",
            "date": t.created_at.isoformat(),
            "amount_zec": float(t.amount_zec),
            "amount_usd": float(t.amount_usd),
            "direction": t.direction.value,
        }
        for t in txns
    ]


@router.get("/tax-summary")
async def contributor_tax_summary(
    year: int = Query(2026),
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    # Income totals
    result = await db.execute(
        select(
            func.coalesce(func.sum(TaxEvent.fair_value_usd), 0),
            func.coalesce(func.sum(TaxEvent.amount_zec), 0),
            func.count(),
        ).where(
            TaxEvent.contributor_id == contributor.id,
            TaxEvent.tax_year == year,
            TaxEvent.event_type == TaxEventType.income,
        )
    )
    total_income_usd, total_income_zec, pay_periods = result.one()

    # Tax withheld from payroll items
    result = await db.execute(
        select(func.coalesce(func.sum(PayrollItem.tax_withheld_usd), 0))
        .where(PayrollItem.contributor_id == contributor.id)
    )
    tax_withheld = result.scalar()

    # Unrealized gain
    result = await db.execute(
        select(
            func.coalesce(func.sum(TaxEvent.gain_loss_usd), 0),
        ).where(
            TaxEvent.contributor_id == contributor.id,
            TaxEvent.tax_year == year,
            TaxEvent.event_type == TaxEventType.disposal,
        )
    )
    realized_gains = result.scalar()

    return {
        "total_income_usd": float(total_income_usd),
        "total_income_zec": float(total_income_zec),
        "tax_withheld_usd": float(tax_withheld),
        "pay_periods": pay_periods,
        "unrealized_gain_usd": 0,
        "cost_basis_method": "fifo",
        "estimated_tax_due": float(realized_gains) * 0.15 if realized_gains else 0,
    }


@router.get("/tax-events")
async def contributor_tax_events(
    year: int = Query(2026),
    type: str = Query("all"),
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    query = select(TaxEvent).where(
        TaxEvent.contributor_id == contributor.id,
        TaxEvent.tax_year == year,
    )
    if type != "all":
        query = query.where(TaxEvent.event_type == TaxEventType(type))

    query = query.order_by(TaxEvent.created_at.desc())
    result = await db.execute(query)
    events = result.scalars().all()

    return [
        {
            "date": e.created_at.isoformat(),
            "event_type": e.event_type.value,
            "amount_zec": float(e.amount_zec),
            "cost_basis_usd": float(e.cost_basis_usd),
            "fair_value_usd": float(e.fair_value_usd),
            "gain_loss_usd": float(e.gain_loss_usd),
        }
        for e in events
    ]


class TaxExportRequest(BaseModel):
    year: int
    format: str = "csv"


@router.post("/tax-export")
async def contributor_tax_export(
    req: TaxExportRequest,
    auth: AuthContext = Depends(require_role("contributor")),
    db: AsyncSession = Depends(get_db),
):
    contributor = await _get_contributor(auth, db)

    result = await db.execute(
        select(TaxEvent)
        .where(
            TaxEvent.contributor_id == contributor.id,
            TaxEvent.tax_year == req.year,
        )
        .order_by(TaxEvent.created_at)
    )
    events = result.scalars().all()

    import io
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Event Type", "Amount ZEC", "Cost Basis USD",
        "Fair Value USD", "Gain/Loss USD", "Holding Period",
    ])
    for e in events:
        writer.writerow([
            e.created_at.isoformat(),
            e.event_type.value,
            float(e.amount_zec),
            float(e.cost_basis_usd),
            float(e.fair_value_usd),
            float(e.gain_loss_usd),
            e.holding_period.value,
        ])

    output.seek(0)
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tax_report_{req.year}.csv"},
    )
