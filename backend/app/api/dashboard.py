from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthContext, require_role
from app.core.database import get_db
from app.models.payroll import PayrollRun, PayrollRunStatus, PayrollItem
from app.models.contributor import Contributor, ContributorStatus
from app.services.price import PriceService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org_id = auth.organization.id

    # Total payroll amounts
    result = await db.execute(
        select(
            func.coalesce(func.sum(PayrollRun.total_usd), 0),
            func.coalesce(func.sum(PayrollRun.total_zec), 0),
        ).where(
            PayrollRun.organization_id == org_id,
            PayrollRun.status == PayrollRunStatus.completed,
        )
    )
    total_usd, total_zec = result.one()

    # Active contributor count
    result = await db.execute(
        select(func.count()).where(
            Contributor.organization_id == org_id,
            Contributor.status == ContributorStatus.active,
        )
    )
    contributor_count = result.scalar()

    # Current ZEC price
    price_service = PriceService()
    try:
        zec_rate = await price_service.get_zec_price()
    except Exception:
        zec_rate = 0
    finally:
        await price_service.close()

    # Check for pending approval payroll runs (notifications)
    result = await db.execute(
        select(func.count()).where(
            PayrollRun.organization_id == org_id,
            PayrollRun.status == PayrollRunStatus.pending_approval,
        )
    )
    pending_approval_count = result.scalar()

    org = auth.organization
    next_payroll_date = org.next_payout_date.isoformat() if org.next_payout_date else None

    return {
        "total_payroll_usd": float(total_usd),
        "total_payroll_zec": float(total_zec),
        "contributor_count": contributor_count,
        "next_payroll_date": next_payroll_date,
        "shielded_percentage": 100 if float(total_zec) > 0 else 0,
        "current_zec_rate": float(zec_rate),
        "pending_approval_count": pending_approval_count,
        "schedule_type": org.schedule_type,
    }
