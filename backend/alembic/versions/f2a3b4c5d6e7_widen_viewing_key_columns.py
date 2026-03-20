"""Widen viewing key columns to 2048

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("org_wallets", "viewing_key_full", type_=sa.String(2048))
    op.alter_column("org_wallets", "viewing_key_incoming", type_=sa.String(2048))


def downgrade():
    op.alter_column("org_wallets", "viewing_key_incoming", type_=sa.String(500))
    op.alter_column("org_wallets", "viewing_key_full", type_=sa.String(1024))
