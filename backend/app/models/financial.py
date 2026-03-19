import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, Enum, ForeignKey, Integer, Numeric, JSON, LargeBinary, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TransactionDirection(str, enum.Enum):
    incoming = "incoming"
    outgoing = "outgoing"


class TransactionType(str, enum.Enum):
    payroll = "payroll"
    withdrawal = "withdrawal"
    deposit = "deposit"
    fee = "fee"


class TransactionPool(str, enum.Enum):
    orchard = "orchard"
    sapling = "sapling"
    transparent = "transparent"


class TaxEventType(str, enum.Enum):
    income = "income"
    disposal = "disposal"
    fee = "fee"


class CostBasisMethod(str, enum.Enum):
    fifo = "fifo"
    lifo = "lifo"
    hifo = "hifo"
    acb = "acb"
    specific_id = "specific_id"


class HoldingPeriod(str, enum.Enum):
    short_term = "short_term"
    long_term = "long_term"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    contributor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("contributors.id"), nullable=True)
    tx_id: Mapped[str] = mapped_column(String(255))
    direction: Mapped[TransactionDirection] = mapped_column(Enum(TransactionDirection))
    amount_zec: Mapped[Decimal] = mapped_column(Numeric(18, 8))
    amount_usd: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    zec_rate_usd: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    tx_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType))
    block_height: Mapped[int] = mapped_column(Integer)
    confirmations: Mapped[int] = mapped_column(Integer, default=0)
    pool: Mapped[TransactionPool] = mapped_column(Enum(TransactionPool), default=TransactionPool.orchard)
    memo_raw: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    memo_decoded: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="transactions")
    contributor = relationship("Contributor", back_populates="transactions")
    tax_events = relationship("TaxEvent", back_populates="transaction")


class TaxEvent(Base):
    __tablename__ = "tax_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contributor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contributors.id"))
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id"))
    tax_year: Mapped[int] = mapped_column(Integer)
    event_type: Mapped[TaxEventType] = mapped_column(Enum(TaxEventType))
    amount_zec: Mapped[Decimal] = mapped_column(Numeric(18, 8))
    cost_basis_usd: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    fair_value_usd: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    gain_loss_usd: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    cost_basis_method: Mapped[CostBasisMethod] = mapped_column(Enum(CostBasisMethod), default=CostBasisMethod.fifo)
    holding_period: Mapped[HoldingPeriod] = mapped_column(Enum(HoldingPeriod), default=HoldingPeriod.short_term)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    contributor = relationship("Contributor", back_populates="tax_events")
    transaction = relationship("Transaction", back_populates="tax_events")


class ZecPriceHistory(Base):
    __tablename__ = "zec_price_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    price_usd: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    source: Mapped[str] = mapped_column(String(50), default="coingecko")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
