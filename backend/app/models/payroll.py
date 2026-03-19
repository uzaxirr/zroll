import uuid
import enum
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, Date, Enum, ForeignKey, Integer, Numeric, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PayrollRunStatus(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PayrollItemStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    confirmed = "confirmed"
    failed = "failed"


class SwapStatus(str, enum.Enum):
    pending_deposit = "pending_deposit"
    processing = "processing"
    success = "success"
    failed = "failed"


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    initiated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    period_label: Mapped[str] = mapped_column(String(100))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    status: Mapped[PayrollRunStatus] = mapped_column(Enum(PayrollRunStatus), default=PayrollRunStatus.draft)
    total_usd: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    total_zec: Mapped[Decimal] = mapped_column(Numeric(18, 8), default=Decimal("0"))
    zec_rate_usd: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    network_fee_zec: Mapped[Decimal] = mapped_column(Numeric(18, 8), default=Decimal("0"))
    recipient_count: Mapped[int] = mapped_column(Integer, default=0)
    tx_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    block_height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confirmations: Mapped[int] = mapped_column(Integer, default=0)
    memo_template: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    payment_uri: Mapped[str | None] = mapped_column(String(8000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="payroll_runs")
    initiated_by_user = relationship("User", back_populates="initiated_payroll_runs")
    items = relationship("PayrollItem", back_populates="payroll_run")


class PayrollItem(Base):
    __tablename__ = "payroll_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("payroll_runs.id"))
    contributor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contributors.id"))
    gross_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tax_withheld_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    net_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    zec_amount: Mapped[Decimal] = mapped_column(Numeric(18, 8))
    zec_rate_usd: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    memo_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[PayrollItemStatus] = mapped_column(Enum(PayrollItemStatus), default=PayrollItemStatus.pending)
    tx_output_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    payroll_run = relationship("PayrollRun", back_populates="items")
    contributor = relationship("Contributor", back_populates="payroll_items")


class CrossPaySwap(Base):
    __tablename__ = "cross_pay_swaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("payroll_runs.id"))
    payroll_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("payroll_items.id"))
    contributor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contributors.id"))
    session_id: Mapped[str] = mapped_column(String(255))
    deposit_address: Mapped[str] = mapped_column(String(500))
    destination_chain: Mapped[str] = mapped_column(String(50))
    destination_address: Mapped[str] = mapped_column(String(500))  # encrypted
    amount_zec_in: Mapped[Decimal] = mapped_column(Numeric(18, 8))
    amount_usdc_out: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    status: Mapped[SwapStatus] = mapped_column(Enum(SwapStatus), default=SwapStatus.pending_deposit)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    payroll_run = relationship("PayrollRun")
    payroll_item = relationship("PayrollItem")
    contributor = relationship("Contributor")
