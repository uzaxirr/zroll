import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WalletPool(str, enum.Enum):
    orchard = "orchard"
    sapling = "sapling"


class ViewingKeyType(str, enum.Enum):
    full = "full"
    incoming = "incoming"
    outgoing = "outgoing"


class OrgWallet(Base):
    __tablename__ = "org_wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    zcash_wallet_id: Mapped[str] = mapped_column(String(255))  # Rust service wallet ID
    address: Mapped[str] = mapped_column(String(500))  # encrypted unified address
    spending_key: Mapped[str] = mapped_column(String(500), nullable=True)  # deprecated: keys managed by Rust service
    viewing_key_full: Mapped[str] = mapped_column(String(2048))
    viewing_key_incoming: Mapped[str] = mapped_column(String(2048))
    pool: Mapped[WalletPool] = mapped_column(Enum(WalletPool), default=WalletPool.orchard)
    balance_zec: Mapped[Decimal] = mapped_column(Numeric(18, 8), default=Decimal("0"))
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="wallets")
    shared_viewing_keys = relationship("SharedViewingKey", back_populates="org_wallet")


class SharedViewingKey(Base):
    __tablename__ = "shared_viewing_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("org_wallets.id"))
    shared_with: Mapped[str] = mapped_column(String(255))
    key_type: Mapped[ViewingKeyType] = mapped_column(Enum(ViewingKeyType))
    key_value: Mapped[str] = mapped_column(String(500))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    org_wallet = relationship("OrgWallet", back_populates="shared_viewing_keys")
