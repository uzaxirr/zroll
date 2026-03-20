import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, Integer, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ScheduleType(str, enum.Enum):
    none = "none"
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    tax_id: Mapped[str | None] = mapped_column(String(500), nullable=True)  # encrypted
    country: Mapped[str] = mapped_column(String(100), default="US")
    default_currency: Mapped[str] = mapped_column(String(10), default="USD")
    # Payout schedule
    schedule_type: Mapped[str] = mapped_column(String(20), default="none")
    pay_day: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-6 for weekly/biweekly, 1-28 for monthly
    schedule_anchor: Mapped[date | None] = mapped_column(Date, nullable=True)  # reference date for cycle start
    next_payout_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="organization")
    contributors = relationship("Contributor", back_populates="organization")
    wallets = relationship("OrgWallet", back_populates="organization")
    payroll_runs = relationship("PayrollRun", back_populates="organization")
    transactions = relationship("Transaction", back_populates="organization")
