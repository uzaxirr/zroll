"""add_schedule_and_verification_fields

Revision ID: c6e7fee21129
Revises: b3f8a2c91d57
Create Date: 2026-03-19 11:11:15.210653

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6e7fee21129'
down_revision: Union[str, None] = 'b3f8a2c91d57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('contributors', sa.Column('verification_status', sa.String(length=20), server_default='unverified', nullable=False))
    op.add_column('contributors', sa.Column('test_tx_id', sa.String(length=255), nullable=True))
    op.add_column('contributors', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('organizations', sa.Column('schedule_type', sa.String(length=20), server_default='none', nullable=False))
    op.add_column('organizations', sa.Column('pay_day', sa.Integer(), nullable=True))
    op.add_column('organizations', sa.Column('schedule_anchor', sa.Date(), nullable=True))
    op.add_column('organizations', sa.Column('next_payout_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('organizations', 'next_payout_date')
    op.drop_column('organizations', 'schedule_anchor')
    op.drop_column('organizations', 'pay_day')
    op.drop_column('organizations', 'schedule_type')
    op.drop_column('contributors', 'verified_at')
    op.drop_column('contributors', 'test_tx_id')
    op.drop_column('contributors', 'verification_status')
