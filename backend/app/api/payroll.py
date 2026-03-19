import uuid
import io
import csv
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthContext, require_role
from app.core.database import get_db
from app.models.payroll import PayrollRun, PayrollItem, PayrollRunStatus, PayrollItemStatus, CrossPaySwap, SwapStatus
from app.models.contributor import Contributor, PaymentPreference, DestinationChain
from app.core.encryption import decrypt, encrypt
from app.services.payroll import prepare_payroll, execute_payroll as exec_payroll
from app.services.price import PriceService
from app.services.memo import encode_pay_stub
from app.services.zip321 import generate_zip321_uri

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


class PayrollExecuteRequest(BaseModel):
    period_label: str
    period_start: str
    period_end: str
    items: list[dict]
    lock_zec_rate: bool = True


@router.get("/prepare")
async def payroll_prepare(
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    price_service = PriceService()
    try:
        result = await prepare_payroll(db, auth.organization.id, price_service)
        return result
    finally:
        await price_service.close()


@router.post("/execute")
async def payroll_execute(
    req: PayrollExecuteRequest,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    price_service = PriceService()
    try:
        if req.lock_zec_rate:
            zec_rate = await price_service.get_zec_price()
        else:
            zec_rate = Decimal("45.00")
    finally:
        await price_service.close()

    run = await exec_payroll(
        db=db,
        org_id=auth.organization.id,
        user_id=auth.user.id,
        period_label=req.period_label,
        period_start=req.period_start,
        period_end=req.period_end,
        items=req.items,
        zec_rate=zec_rate,
        org_name=auth.organization.name,
    )

    from app.workers.tasks import execute_payroll_task
    execute_payroll_task.delay(str(run.id))

    return {"payroll_run_id": str(run.id), "status": run.status.value}


class ConfirmTxRequest(BaseModel):
    tx_id: str


@router.post("/execute-zodl")
async def payroll_execute_zodl(
    req: PayrollExecuteRequest,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.near_intents import NearIntentsService
    from app.models.wallet import OrgWallet

    price_service = PriceService()
    try:
        if req.lock_zec_rate:
            zec_rate = await price_service.get_zec_price()
        else:
            zec_rate = Decimal("45.00")
    finally:
        await price_service.close()

    run = await exec_payroll(
        db=db,
        org_id=auth.organization.id,
        user_id=auth.user.id,
        period_label=req.period_label,
        period_start=req.period_start,
        period_end=req.period_end,
        items=req.items,
        zec_rate=zec_rate,
        org_name=auth.organization.name,
    )

    # Override status to pending_approval (exec_payroll sets processing)
    run.status = PayrollRunStatus.pending_approval

    # Build ZIP-321 outputs from run items
    await db.refresh(run, attribute_names=["items"])
    result = await db.execute(
        select(PayrollItem)
        .where(PayrollItem.payroll_run_id == run.id)
        .options(selectinload(PayrollItem.contributor))
    )
    items = result.scalars().all()

    # Get org wallet address for refund_address (NEAR Intents needs it)
    wallet_result = await db.execute(
        select(OrgWallet).where(OrgWallet.organization_id == auth.organization.id)
    )
    org_wallet = wallet_result.scalar_one_or_none()
    refund_address = decrypt(org_wallet.address) if org_wallet and org_wallet.address else ""

    outputs = []
    cross_pay_swaps = []

    near_intents = NearIntentsService()
    try:
        for item in items:
            contributor = item.contributor

            memo = encode_pay_stub(
                org_name=auth.organization.name,
                period_label=req.period_label,
                pay_type="Salary",
                gross_usd=item.gross_usd,
                tax_withheld_usd=item.tax_withheld_usd,
                net_usd=item.net_usd,
                zec_rate_usd=item.zec_rate_usd,
                reference_id=item.memo_data.get("ref", "") if item.memo_data else "",
            )

            if contributor.payment_preference == PaymentPreference.usdc:
                # USDC contributor: get NEAR Intents quote for ZEC->USDC swap
                dest_address = decrypt(contributor.destination_address) if contributor.destination_address else ""
                if not dest_address or not contributor.destination_chain:
                    continue

                quote = await near_intents.get_quote(
                    amount_zec=item.zec_amount,
                    destination_chain=contributor.destination_chain,
                    destination_address=dest_address,
                    refund_address=refund_address,
                )

                # The deposit_address is a regular Zcash address
                outputs.append({
                    "address": quote.deposit_address,
                    "amount_zec": item.zec_amount,
                    "memo_bytes": memo,
                })

                # Track the swap
                swap = CrossPaySwap(
                    payroll_run_id=run.id,
                    payroll_item_id=item.id,
                    contributor_id=contributor.id,
                    session_id=quote.session_id,
                    deposit_address=quote.deposit_address,
                    destination_chain=contributor.destination_chain.value,
                    destination_address=encrypt(dest_address),
                    amount_zec_in=item.zec_amount,
                    amount_usdc_out=quote.amount_out,
                    status=SwapStatus.pending_deposit,
                )
                db.add(swap)
                cross_pay_swaps.append(swap)
            else:
                # ZEC contributor: use their wallet address directly
                address = decrypt(contributor.wallet_address) if contributor.wallet_address else ""
                if not address:
                    continue

                outputs.append({
                    "address": address,
                    "amount_zec": item.zec_amount,
                    "memo_bytes": memo,
                })
    finally:
        await near_intents.close()

    payment_uri = generate_zip321_uri(outputs)
    run.payment_uri = payment_uri
    await db.commit()

    return {
        "payroll_run_id": str(run.id),
        "payment_uri": payment_uri,
        "status": "pending_approval",
        "cross_pay_count": len(cross_pay_swaps),
    }


@router.post("/{run_id}/confirm-tx")
async def payroll_confirm_tx(
    run_id: uuid.UUID,
    req: ConfirmTxRequest,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    from app.models.financial import (
        Transaction, TransactionDirection, TransactionType, TransactionPool,
        TaxEvent, TaxEventType, CostBasisMethod, HoldingPeriod,
    )

    result = await db.execute(
        select(PayrollRun)
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == auth.organization.id,
        )
        .options(selectinload(PayrollRun.items).selectinload(PayrollItem.contributor))
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    if run.status != PayrollRunStatus.pending_approval:
        raise HTTPException(status_code=400, detail="Payroll run is not pending approval")

    now = datetime.now(timezone.utc)
    run.tx_id = req.tx_id
    run.status = PayrollRunStatus.processing
    run.executed_at = now

    for i, item in enumerate(run.items):
        item.status = PayrollItemStatus.sent
        item.tx_output_index = i

        tx = Transaction(
            organization_id=run.organization_id,
            contributor_id=item.contributor_id,
            tx_id=req.tx_id,
            direction=TransactionDirection.outgoing,
            amount_zec=item.zec_amount,
            amount_usd=item.net_usd,
            zec_rate_usd=item.zec_rate_usd,
            tx_type=TransactionType.payroll,
            block_height=0,
            pool=TransactionPool.orchard,
        )
        db.add(tx)
        await db.flush()

        tax_event = TaxEvent(
            contributor_id=item.contributor_id,
            transaction_id=tx.id,
            tax_year=now.year,
            event_type=TaxEventType.income,
            amount_zec=item.zec_amount,
            cost_basis_usd=item.net_usd,
            fair_value_usd=item.net_usd,
            gain_loss_usd=Decimal("0"),
            cost_basis_method=CostBasisMethod.fifo,
            holding_period=HoldingPeriod.short_term,
        )
        db.add(tax_event)

    # Submit deposit info to NEAR Intents for any cross-pay swaps
    swap_result = await db.execute(
        select(CrossPaySwap).where(
            CrossPaySwap.payroll_run_id == run.id,
            CrossPaySwap.status == SwapStatus.pending_deposit,
        )
    )
    swaps = swap_result.scalars().all()

    if swaps:
        from app.services.near_intents import NearIntentsService
        near_intents = NearIntentsService()
        try:
            for swap in swaps:
                try:
                    await near_intents.submit_deposit(swap.session_id, req.tx_id)
                except Exception:
                    pass  # Non-fatal: NEAR Intents will detect the deposit on its own
        finally:
            await near_intents.close()

    await db.commit()

    return {
        "status": "confirmed",
        "payroll_run_id": str(run.id),
        "cross_pay_deposits_submitted": len(swaps),
    }


@router.get("/recent")
async def payroll_recent(
    limit: int = Query(5, ge=1, le=20),
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PayrollItem)
        .join(PayrollRun)
        .join(Contributor)
        .where(PayrollRun.organization_id == auth.organization.id)
        .options(selectinload(PayrollItem.contributor), selectinload(PayrollItem.payroll_run))
        .order_by(PayrollItem.created_at.desc())
        .limit(limit)
    )
    items = result.scalars().all()

    return [
        {
            "contributor_name": item.contributor.full_name,
            "amount_zec": float(item.zec_amount),
            "amount_usd": float(item.net_usd),
            "date": item.payroll_run.executed_at.isoformat() if item.payroll_run.executed_at else item.created_at.isoformat(),
            "status": item.status.value,
            "department": item.contributor.department,
        }
        for item in items
    ]


@router.get("/history")
async def payroll_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org_id = auth.organization.id

    count_result = await db.execute(
        select(func.count()).where(PayrollRun.organization_id == org_id)
    )
    total = count_result.scalar()
    total_pages = (total + limit - 1) // limit if total else 1

    offset = (page - 1) * limit
    result = await db.execute(
        select(PayrollRun)
        .where(PayrollRun.organization_id == org_id)
        .order_by(PayrollRun.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    runs = result.scalars().all()

    return {
        "runs": [
            {
                "id": str(r.id),
                "period_label": r.period_label,
                "executed_at": r.executed_at.isoformat() if r.executed_at else None,
                "recipient_count": r.recipient_count,
                "total_zec": float(r.total_zec),
                "total_usd": float(r.total_usd),
                "status": r.status.value,
            }
            for r in runs
        ],
        "total_pages": total_pages,
    }


@router.get("/history/export")
async def payroll_history_export(
    format: str = Query("csv"),
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PayrollRun)
        .where(PayrollRun.organization_id == auth.organization.id)
        .options(selectinload(PayrollRun.items).selectinload(PayrollItem.contributor))
        .order_by(PayrollRun.created_at.desc())
    )
    runs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Period", "Executed At", "Contributor", "Department",
        "Gross USD", "Tax USD", "Net USD", "ZEC Amount", "ZEC Rate", "Status",
    ])

    for run in runs:
        for item in run.items:
            writer.writerow([
                run.period_label,
                run.executed_at.isoformat() if run.executed_at else "",
                item.contributor.full_name,
                item.contributor.department,
                float(item.gross_usd),
                float(item.tax_withheld_usd),
                float(item.net_usd),
                float(item.zec_amount),
                float(item.zec_rate_usd),
                item.status.value,
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payroll_export.csv"},
    )


class ViewFromChainRequest(BaseModel):
    ufvk: str
    birthday: int = 3860000


@router.post("/view-from-chain")
async def payroll_view_from_chain(
    req: ViewFromChainRequest,
    auth: AuthContext = Depends(require_role("admin")),
):
    """Read transactions directly from Zcash chain via UFVK. No data is stored."""
    import httpx
    from app.core.config import get_settings

    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.zcash_service_url}/view/transactions",
            json={"ufvk": req.ufvk, "birthday": req.birthday},
            timeout=300.0,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Zcash service error: {resp.text}")
        return resp.json()


@router.get("/{run_id}")
async def payroll_detail(
    run_id: uuid.UUID,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PayrollRun)
        .where(
            PayrollRun.id == run_id,
            PayrollRun.organization_id == auth.organization.id,
        )
        .options(selectinload(PayrollRun.items).selectinload(PayrollItem.contributor))
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    return {
        "id": str(run.id),
        "period_label": run.period_label,
        "status": run.status.value,
        "total_zec": float(run.total_zec),
        "total_usd": float(run.total_usd),
        "recipient_count": run.recipient_count,
        "network_fee_zec": float(run.network_fee_zec),
        "tx_id": run.tx_id,
        "block_height": run.block_height,
        "confirmations": run.confirmations,
        "pool": "orchard",
        "payment_uri": run.payment_uri,
        "executed_at": run.executed_at.isoformat() if run.executed_at else None,
        "items": [
            {
                "contributor_name": item.contributor.full_name,
                "department": item.contributor.department,
                "gross_usd": float(item.gross_usd),
                "tax_withheld_usd": float(item.tax_withheld_usd),
                "net_usd": float(item.net_usd),
                "zec_amount": float(item.zec_amount),
                "status": item.status.value,
            }
            for item in run.items
        ],
    }
