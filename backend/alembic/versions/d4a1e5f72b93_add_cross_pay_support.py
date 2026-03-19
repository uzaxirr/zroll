"""add_cross_pay_support

Revision ID: d4a1e5f72b93
Revises: cfcee84fc3a8
Create Date: 2026-03-19 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM


# revision identifiers, used by Alembic.
revision: str = 'd4a1e5f72b93'
down_revision: Union[str, None] = 'cfcee84fc3a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums via raw SQL to avoid SQLAlchemy double-creation issues
    op.execute("CREATE TYPE paymentpreference AS ENUM ('zec', 'usdc')")
    op.execute("CREATE TYPE destinationchain AS ENUM ('solana', 'ethereum', 'base', 'arbitrum')")
    op.execute("CREATE TYPE swapstatus AS ENUM ('pending_deposit', 'processing', 'success', 'failed')")

    # Add columns to contributors
    op.add_column('contributors', sa.Column(
        'payment_preference',
        ENUM('zec', 'usdc', name='paymentpreference', create_type=False),
        server_default='zec',
        nullable=False,
    ))
    op.add_column('contributors', sa.Column(
        'destination_chain',
        ENUM('solana', 'ethereum', 'base', 'arbitrum', name='destinationchain', create_type=False),
        nullable=True,
    ))
    op.add_column('contributors', sa.Column(
        'destination_address',
        sa.String(length=500),
        nullable=True,
    ))

    # Create cross_pay_swaps table
    op.create_table(
        'cross_pay_swaps',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('payroll_run_id', UUID(as_uuid=True), sa.ForeignKey('payroll_runs.id'), nullable=False),
        sa.Column('payroll_item_id', UUID(as_uuid=True), sa.ForeignKey('payroll_items.id'), nullable=False),
        sa.Column('contributor_id', UUID(as_uuid=True), sa.ForeignKey('contributors.id'), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('deposit_address', sa.String(length=500), nullable=False),
        sa.Column('destination_chain', sa.String(length=50), nullable=False),
        sa.Column('destination_address', sa.String(length=500), nullable=False),
        sa.Column('amount_zec_in', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('amount_usdc_out', sa.Numeric(precision=14, scale=2), server_default='0', nullable=False),
        sa.Column('status', ENUM('pending_deposit', 'processing', 'success', 'failed', name='swapstatus', create_type=False), server_default='pending_deposit', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('cross_pay_swaps')
    op.drop_column('contributors', 'destination_address')
    op.drop_column('contributors', 'destination_chain')
    op.drop_column('contributors', 'payment_preference')

    op.execute('DROP TYPE IF EXISTS swapstatus')
    op.execute('DROP TYPE IF EXISTS destinationchain')
    op.execute('DROP TYPE IF EXISTS paymentpreference')
