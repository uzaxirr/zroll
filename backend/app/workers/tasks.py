import asyncio
from decimal import Decimal
from datetime import datetime, timezone

from app.workers.celery_app import celery_app
from app.core.database import get_worker_session
from app.core.config import get_settings
from app.core.encryption import decrypt
from app.models.wallet import OrgWallet
from app.models.payroll import PayrollRun, PayrollItem, PayrollRunStatus, PayrollItemStatus
from app.models.financial import (
    Transaction, TransactionDirection, TransactionType, TransactionPool,
    TaxEvent, TaxEventType, CostBasisMethod, HoldingPeriod, ZecPriceHistory,
)
from app.services.zcash import ZcashService, PayrollOutput
from app.services.price import PriceService
from app.services.memo import encode_pay_stub

settings = get_settings()


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def sync_zec_price():
    async def _sync():
        price_service = PriceService()
        try:
            price = await price_service._fetch_from_coingecko()
            await price_service.set_price_cache(price)

            async with get_worker_session() as db:
                now = datetime.now(timezone.utc)
                history = ZecPriceHistory(
                    timestamp=now,
                    price_usd=price,
                    source="coingecko",
                )
                db.add(history)
                await db.commit()
        finally:
            await price_service.close()

    _run_async(_sync())


@celery_app.task
def sync_wallet_balances():
    async def _sync():
        zcash = ZcashService()
        try:
            async with get_worker_session() as db:
                from sqlalchemy import select
                result = await db.execute(select(OrgWallet))
                wallets = result.scalars().all()

                for wallet in wallets:
                    try:
                        # Use zcash_wallet_id instead of decrypted address
                        balance = await zcash.get_balance(wallet.zcash_wallet_id)
                        wallet.balance_zec = balance
                        wallet.last_synced_at = datetime.now(timezone.utc)
                    except Exception:
                        pass

                await db.commit()
        finally:
            await zcash.close()

    _run_async(_sync())


@celery_app.task
def check_confirmations():
    async def _check():
        zcash = ZcashService()
        try:
            async with get_worker_session() as db:
                from sqlalchemy import select
                result = await db.execute(
                    select(PayrollRun).where(
                        PayrollRun.status == PayrollRunStatus.processing,
                        PayrollRun.tx_id.isnot(None),
                    )
                )
                runs = result.scalars().all()

                for run in runs:
                    try:
                        tx_info = await zcash.get_transaction(run.tx_id)
                        run.confirmations = tx_info.confirmations
                        run.block_height = tx_info.block_height

                        if tx_info.confirmations >= 3 or tx_info.status == "confirmed":
                            run.status = PayrollRunStatus.completed
                            run.completed_at = datetime.now(timezone.utc)
                    except Exception:
                        pass

                await db.commit()
        finally:
            await zcash.close()

    _run_async(_check())


@celery_app.task
def execute_payroll_task(payroll_run_id: str):
    async def _execute():
        zcash = ZcashService()
        try:
            async with get_worker_session() as db:
                from sqlalchemy import select
                from sqlalchemy.orm import selectinload

                result = await db.execute(
                    select(PayrollRun)
                    .where(PayrollRun.id == payroll_run_id)
                    .options(
                        selectinload(PayrollRun.items).selectinload(PayrollItem.contributor),
                        selectinload(PayrollRun.organization),
                    )
                )
                run = result.scalar_one_or_none()
                if not run:
                    return

                # Get org wallet
                result = await db.execute(
                    select(OrgWallet).where(OrgWallet.organization_id == run.organization_id)
                )
                wallet = result.scalar_one_or_none()
                if not wallet:
                    run.status = PayrollRunStatus.failed
                    await db.commit()
                    return

                # Use zcash_wallet_id for sending. The Rust service manages
                # all key material internally, so no spending key is needed.
                wallet_id = wallet.zcash_wallet_id

                # Build outputs
                outputs = []
                for item in run.items:
                    contributor = item.contributor
                    address = decrypt(contributor.wallet_address) if contributor.wallet_address else ""
                    if not address:
                        continue

                    memo = encode_pay_stub(
                        org_name=run.organization.name,
                        period_label=run.period_label,
                        pay_type="Salary",
                        gross_usd=item.gross_usd,
                        tax_withheld_usd=item.tax_withheld_usd,
                        net_usd=item.net_usd,
                        zec_rate_usd=item.zec_rate_usd,
                        reference_id=item.memo_data.get("ref", "") if item.memo_data else "",
                    )

                    outputs.append(PayrollOutput(
                        address=address,
                        amount=item.zec_amount,
                        memo=memo,
                    ))

                # Send transaction via Rust service using wallet_id
                try:
                    tx_id = await zcash.send_payroll(wallet_id, outputs)
                    run.tx_id = tx_id
                    run.status = PayrollRunStatus.processing
                    run.executed_at = datetime.now(timezone.utc)

                    # Update items
                    for i, item in enumerate(run.items):
                        item.status = PayrollItemStatus.sent
                        item.tx_output_index = i

                    # Create transaction records
                    for item in run.items:
                        tx = Transaction(
                            organization_id=run.organization_id,
                            contributor_id=item.contributor_id,
                            tx_id=tx_id,
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

                        # Create income tax event
                        tax_event = TaxEvent(
                            contributor_id=item.contributor_id,
                            transaction_id=tx.id,
                            tax_year=datetime.now(timezone.utc).year,
                            event_type=TaxEventType.income,
                            amount_zec=item.zec_amount,
                            cost_basis_usd=item.net_usd,
                            fair_value_usd=item.net_usd,
                            gain_loss_usd=Decimal("0"),
                            cost_basis_method=CostBasisMethod.fifo,
                            holding_period=HoldingPeriod.short_term,
                        )
                        db.add(tax_event)

                except Exception as e:
                    run.status = PayrollRunStatus.failed

                await db.commit()
        finally:
            await zcash.close()

    _run_async(_execute())


@celery_app.task
def generate_tax_report(contributor_id: str, year: int, format: str = "csv"):
    # Placeholder: in production, this generates a PDF/CSV and uploads to storage
    pass


@celery_app.task
def send_test_transaction(contributor_id: str):
    """Send 0.0001 ZEC test transaction to verify a contributor's wallet."""
    async def _send():
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.contributor import Contributor

        zcash = ZcashService()
        try:
            async with get_worker_session() as db:
                result = await db.execute(
                    select(Contributor)
                    .where(Contributor.id == contributor_id)
                    .options(selectinload(Contributor.organization))
                )
                contributor = result.scalar_one_or_none()
                if not contributor or not contributor.wallet_address:
                    return

                if contributor.verification_status != "unverified":
                    return

                address = decrypt(contributor.wallet_address)
                if not address:
                    return

                # Get org wallet for sending
                result = await db.execute(
                    select(OrgWallet).where(OrgWallet.organization_id == contributor.organization_id)
                )
                wallet = result.scalar_one_or_none()
                if not wallet:
                    return

                test_amount = Decimal("0.0001")
                outputs = [PayrollOutput(address=address, amount=test_amount, memo=b"zroll test tx")]

                try:
                    tx_id = await zcash.send_payroll(wallet.zcash_wallet_id, outputs)
                    contributor.verification_status = "test_sent"
                    contributor.test_tx_id = tx_id
                    await db.commit()
                except Exception:
                    pass
        finally:
            await zcash.close()

    _run_async(_send())


@celery_app.task
def check_test_confirmations():
    """Check test transactions and mark contributors as verified when confirmed."""
    async def _check():
        from sqlalchemy import select
        from app.models.contributor import Contributor

        zcash = ZcashService()
        try:
            async with get_worker_session() as db:
                result = await db.execute(
                    select(Contributor).where(
                        Contributor.verification_status == "test_sent",
                        Contributor.test_tx_id.isnot(None),
                    )
                )
                contributors = result.scalars().all()

                for contributor in contributors:
                    try:
                        tx_info = await zcash.get_transaction(contributor.test_tx_id)
                        if tx_info.confirmations >= 3 or tx_info.status == "confirmed":
                            contributor.verification_status = "verified"
                            contributor.verified_at = datetime.now(timezone.utc)
                            contributor.status = "active"
                    except Exception:
                        pass

                await db.commit()
        finally:
            await zcash.close()

    _run_async(_check())


@celery_app.task
def check_cross_pay_swaps():
    """Poll NEAR Intents for cross-pay swap status updates."""
    async def _check():
        from sqlalchemy import select
        from app.models.payroll import CrossPaySwap, SwapStatus, PayrollItem, PayrollItemStatus
        from app.services.near_intents import NearIntentsService

        near_intents = NearIntentsService()
        try:
            async with get_worker_session() as db:
                result = await db.execute(
                    select(CrossPaySwap).where(
                        CrossPaySwap.status.in_([
                            SwapStatus.pending_deposit,
                            SwapStatus.processing,
                        ])
                    )
                )
                swaps = result.scalars().all()

                for swap in swaps:
                    try:
                        status = await near_intents.get_status(swap.session_id)

                        if status.status == "SUCCESS":
                            swap.status = SwapStatus.success
                            swap.completed_at = datetime.now(timezone.utc)
                            # Update the corresponding payroll item
                            item_result = await db.execute(
                                select(PayrollItem).where(PayrollItem.id == swap.payroll_item_id)
                            )
                            item = item_result.scalar_one_or_none()
                            if item:
                                item.status = PayrollItemStatus.confirmed
                                item.confirmed_at = datetime.now(timezone.utc)

                        elif status.status == "PROCESSING":
                            swap.status = SwapStatus.processing

                        elif status.status == "FAILED":
                            swap.status = SwapStatus.failed
                            item_result = await db.execute(
                                select(PayrollItem).where(PayrollItem.id == swap.payroll_item_id)
                            )
                            item = item_result.scalar_one_or_none()
                            if item:
                                item.status = PayrollItemStatus.failed

                    except Exception:
                        pass

                await db.commit()
        finally:
            await near_intents.close()

    _run_async(_check())


@celery_app.task
def check_payout_schedule():
    """Daily task: if today matches the org's payout schedule, create a pending_approval payroll run."""
    async def _check():
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.organization import Organization
        from app.models.contributor import Contributor

        async with get_worker_session() as db:
            today = datetime.now(timezone.utc).date()
            result = await db.execute(
                select(Organization).where(
                    Organization.schedule_type != "none",
                    Organization.next_payout_date <= today,
                )
            )
            orgs = result.scalars().all()

            for org in orgs:
                # Get verified, active contributors
                result = await db.execute(
                    select(Contributor).where(
                        Contributor.organization_id == org.id,
                        Contributor.status == "active",
                        Contributor.verification_status == "verified",
                    )
                )
                contributors = result.scalars().all()
                if not contributors:
                    _advance_next_payout(org)
                    continue

                # Get current ZEC price
                price_service = PriceService()
                try:
                    zec_price = await price_service.get_price()
                finally:
                    await price_service.close()

                if not zec_price or zec_price <= 0:
                    continue

                # Build payroll run
                total_usd = Decimal("0")
                total_zec = Decimal("0")
                items = []

                for c in contributors:
                    gross = c.monthly_rate_usd
                    if org.schedule_type == "weekly":
                        gross = (c.monthly_rate_usd * 12) / 52
                    elif org.schedule_type == "biweekly":
                        gross = (c.monthly_rate_usd * 12) / 26

                    net = gross  # simplified: no tax withholding for now
                    zec_amount = net / zec_price
                    total_usd += net
                    total_zec += zec_amount

                    items.append({
                        "contributor_id": c.id,
                        "gross_usd": gross,
                        "net_usd": net,
                        "zec_amount": zec_amount,
                        "zec_rate_usd": zec_price,
                    })

                period_label = f"{today.strftime('%b %Y')}"
                if org.schedule_type == "weekly":
                    period_label = f"Week of {today.strftime('%b %d, %Y')}"
                elif org.schedule_type == "biweekly":
                    period_label = f"Biweek of {today.strftime('%b %d, %Y')}"

                run = PayrollRun(
                    organization_id=org.id,
                    period_label=period_label,
                    total_usd=total_usd,
                    total_zec=total_zec,
                    recipient_count=len(items),
                    status=PayrollRunStatus.pending_approval,
                    network_fee_zec=Decimal("0.0001"),
                )
                db.add(run)
                await db.flush()

                for item_data in items:
                    item = PayrollItem(
                        payroll_run_id=run.id,
                        contributor_id=item_data["contributor_id"],
                        gross_usd=item_data["gross_usd"],
                        tax_withheld_usd=Decimal("0"),
                        net_usd=item_data["net_usd"],
                        zec_amount=item_data["zec_amount"],
                        zec_rate_usd=item_data["zec_rate_usd"],
                        status=PayrollItemStatus.pending,
                    )
                    db.add(item)

                _advance_next_payout(org)

            await db.commit()

    _run_async(_check())


def _advance_next_payout(org):
    """Move next_payout_date forward by one schedule period."""
    from datetime import timedelta
    from dateutil.relativedelta import relativedelta

    if not org.next_payout_date:
        return

    if org.schedule_type == "weekly":
        org.next_payout_date = org.next_payout_date + timedelta(weeks=1)
    elif org.schedule_type == "biweekly":
        org.next_payout_date = org.next_payout_date + timedelta(weeks=2)
    elif org.schedule_type == "monthly":
        org.next_payout_date = org.next_payout_date + relativedelta(months=1)
