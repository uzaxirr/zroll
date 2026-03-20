"""Remove Clerk IDs, add password_hash

Revision ID: e1f2a3b4c5d6
Revises: d4a1e5f72b93
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "e1f2a3b4c5d6"
down_revision = "d4a1e5f72b93"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("users", "clerk_user_id")
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))
    op.drop_column("organizations", "clerk_org_id")


def downgrade():
    op.add_column("organizations", sa.Column("clerk_org_id", sa.String(255), nullable=False))
    op.create_unique_constraint("uq_organizations_clerk_org_id", "organizations", ["clerk_org_id"])
    op.drop_column("users", "password_hash")
    op.add_column("users", sa.Column("clerk_user_id", sa.String(255), nullable=False))
    op.create_unique_constraint("uq_users_clerk_user_id", "users", ["clerk_user_id"])
