from fastapi import APIRouter, Depends
from app.core.auth import AuthContext, require_role

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/payroll")
async def get_payroll_settings(
    auth: AuthContext = Depends(require_role("admin")),
):
    # In production, these would be stored per-org in the database
    return {
        "schedule": "monthly",
        "pay_day": 1,
        "auto_convert": False,
        "tax_withholding": True,
    }


@router.get("/tax")
async def get_tax_settings(
    auth: AuthContext = Depends(require_role("admin")),
):
    return {
        "cost_basis_method": "fifo",
        "tax_year_start": "january",
        "jurisdiction": auth.organization.country or "US",
    }
