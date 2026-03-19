from dataclasses import dataclass, field
from decimal import Decimal
from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial import TaxEvent, TaxEventType, CostBasisMethod, HoldingPeriod, Transaction


@dataclass
class CostLot:
    amount_zec: Decimal
    cost_per_zec: Decimal
    acquired_at: datetime
    remaining: Decimal = Decimal("0")

    def __post_init__(self):
        if self.remaining == Decimal("0"):
            self.remaining = self.amount_zec


@dataclass
class FIFOEngine:
    lots: list[CostLot] = field(default_factory=list)

    def add_lot(self, amount_zec: Decimal, cost_per_zec: Decimal, acquired_at: datetime):
        self.lots.append(CostLot(
            amount_zec=amount_zec,
            cost_per_zec=cost_per_zec,
            acquired_at=acquired_at,
        ))

    def consume(self, amount_zec: Decimal, disposed_at: datetime) -> tuple[Decimal, HoldingPeriod]:
        """Consume lots FIFO-style. Returns (total_cost_basis, holding_period)."""
        remaining = amount_zec
        total_cost = Decimal("0")
        earliest_lot_date: Optional[datetime] = None

        for lot in self.lots:
            if remaining <= Decimal("0"):
                break
            if lot.remaining <= Decimal("0"):
                continue

            consumed = min(lot.remaining, remaining)
            total_cost += consumed * lot.cost_per_zec
            lot.remaining -= consumed
            remaining -= consumed

            if earliest_lot_date is None:
                earliest_lot_date = lot.acquired_at

        # Clean up fully consumed lots
        self.lots = [lot for lot in self.lots if lot.remaining > Decimal("0")]

        # Determine holding period
        if earliest_lot_date and (disposed_at - earliest_lot_date).days > 365:
            holding = HoldingPeriod.long_term
        else:
            holding = HoldingPeriod.short_term

        return total_cost, holding


async def calculate_tax_event_for_income(
    db: AsyncSession,
    contributor_id: uuid.UUID,
    transaction: Transaction,
) -> TaxEvent:
    """For income (payroll received), cost_basis = fair_value (no gain)."""
    event = TaxEvent(
        contributor_id=contributor_id,
        transaction_id=transaction.id,
        tax_year=transaction.created_at.year,
        event_type=TaxEventType.income,
        amount_zec=transaction.amount_zec,
        cost_basis_usd=transaction.amount_usd,
        fair_value_usd=transaction.amount_usd,
        gain_loss_usd=Decimal("0"),
        cost_basis_method=CostBasisMethod.fifo,
        holding_period=HoldingPeriod.short_term,
    )
    db.add(event)
    return event


async def calculate_tax_event_for_disposal(
    db: AsyncSession,
    contributor_id: uuid.UUID,
    transaction: Transaction,
    engine: FIFOEngine,
) -> TaxEvent:
    """For disposal (sell/withdraw), calculate gain/loss using FIFO."""
    cost_basis, holding = engine.consume(transaction.amount_zec, transaction.created_at)
    fair_value = transaction.amount_usd
    gain_loss = fair_value - cost_basis

    event = TaxEvent(
        contributor_id=contributor_id,
        transaction_id=transaction.id,
        tax_year=transaction.created_at.year,
        event_type=TaxEventType.disposal,
        amount_zec=transaction.amount_zec,
        cost_basis_usd=cost_basis,
        fair_value_usd=fair_value,
        gain_loss_usd=gain_loss,
        cost_basis_method=CostBasisMethod.fifo,
        holding_period=holding,
    )
    db.add(event)
    return event
