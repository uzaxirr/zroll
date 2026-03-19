"""add zcash_wallet_id columns

Revision ID: b3f8a2c91d57
Revises: 7def173f8d42
Create Date: 2026-03-19 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3f8a2c91d57'
down_revision: Union[str, None] = '7def173f8d42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add zcash_wallet_id to org_wallets (Rust service wallet reference)
    op.add_column('org_wallets', sa.Column('zcash_wallet_id', sa.String(255), nullable=True))

    # Make spending_key nullable (keys now managed by Rust service)
    op.alter_column('org_wallets', 'spending_key',
                    existing_type=sa.String(500),
                    nullable=True)

    # Add zcash_wallet_id to contributors (for service-managed contributor wallets)
    op.add_column('contributors', sa.Column('zcash_wallet_id', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('contributors', 'zcash_wallet_id')
    op.alter_column('org_wallets', 'spending_key',
                    existing_type=sa.String(500),
                    nullable=False)
    op.drop_column('org_wallets', 'zcash_wallet_id')
