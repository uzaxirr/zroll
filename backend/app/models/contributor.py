import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ContributorStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    inactive = "inactive"


class VerificationStatus(str, enum.Enum):
    unverified = "unverified"
    test_sent = "test_sent"
    verified = "verified"


class EmploymentType(str, enum.Enum):
    employee = "employee"
    contractor = "contractor"


class PaymentPreference(str, enum.Enum):
    zec = "zec"
    usdc = "usdc"


class DestinationChain(str, enum.Enum):
    solana = "solana"
    ethereum = "ethereum"
    base = "base"
    arbitrum = "arbitrum"


USDC_ASSET_BY_CHAIN = {
    DestinationChain.solana: "sol:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    DestinationChain.ethereum: "eth:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DestinationChain.base: "base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    DestinationChain.arbitrum: "arb:0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
}


class Contributor(Base):
    __tablename__ = "contributors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(100))
    monthly_rate_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    zcash_wallet_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Rust service wallet ID
    wallet_address: Mapped[str | None] = mapped_column(String(500), nullable=True)  # encrypted unified address
    status: Mapped[ContributorStatus] = mapped_column(Enum(ContributorStatus), default=ContributorStatus.pending)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType), default=EmploymentType.employee)
    tax_jurisdiction: Mapped[str] = mapped_column(String(100), default="US")

    # Cross-pay: payment preference
    payment_preference: Mapped[PaymentPreference] = mapped_column(
        Enum(PaymentPreference), default=PaymentPreference.zec
    )
    destination_chain: Mapped[DestinationChain | None] = mapped_column(
        Enum(DestinationChain), nullable=True
    )
    destination_address: Mapped[str | None] = mapped_column(String(500), nullable=True)  # encrypted EVM/Solana address

    # Test transaction verification
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified")
    test_tx_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="contributors")
    user = relationship("User")
    payroll_items = relationship("PayrollItem", back_populates="contributor")
    transactions = relationship("Transaction", back_populates="contributor")
    tax_events = relationship("TaxEvent", back_populates="contributor")
