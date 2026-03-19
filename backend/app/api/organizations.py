from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.auth import AuthContext, require_role
from app.core.database import get_db
from app.core.encryption import encrypt, decrypt

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


class OrgUpdateRequest(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    country: Optional[str] = None
    default_currency: Optional[str] = None
    schedule_type: Optional[str] = None
    pay_day: Optional[int] = None


@router.get("/me")
async def get_current_org(
    auth: AuthContext = Depends(require_role("admin")),
):
    org = auth.organization
    tax_id_masked = None
    if org.tax_id:
        try:
            raw = decrypt(org.tax_id)
            tax_id_masked = f"***-**-{raw[-4:]}" if len(raw) >= 4 else "****"
        except Exception:
            tax_id_masked = "****"

    return {
        "id": str(org.id),
        "name": org.name,
        "tax_id_masked": tax_id_masked,
        "country": org.country,
        "default_currency": org.default_currency,
        "schedule_type": org.schedule_type,
        "pay_day": org.pay_day,
        "next_payout_date": org.next_payout_date.isoformat() if org.next_payout_date else None,
    }


@router.put("/me")
async def update_current_org(
    req: OrgUpdateRequest,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org = auth.organization
    if req.name is not None:
        org.name = req.name
    if req.tax_id is not None:
        org.tax_id = encrypt(req.tax_id)
    if req.country is not None:
        org.country = req.country
    if req.default_currency is not None:
        org.default_currency = req.default_currency
    if req.schedule_type is not None:
        org.schedule_type = req.schedule_type
        # Compute next_payout_date when schedule is set
        if req.schedule_type != "none" and req.pay_day is not None:
            from datetime import date, timedelta
            org.pay_day = req.pay_day
            today = date.today()
            if req.schedule_type == "monthly":
                # Next occurrence of pay_day
                day = min(req.pay_day, 28)
                try:
                    next_date = today.replace(day=day)
                except ValueError:
                    next_date = today.replace(day=28)
                if next_date <= today:
                    month = next_date.month + 1
                    year = next_date.year
                    if month > 12:
                        month = 1
                        year += 1
                    next_date = next_date.replace(year=year, month=month)
                org.next_payout_date = next_date
            elif req.schedule_type in ("weekly", "biweekly"):
                # pay_day is 0=Mon..6=Sun
                days_ahead = req.pay_day - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                org.next_payout_date = today + timedelta(days=days_ahead)
            org.schedule_anchor = org.next_payout_date
        elif req.schedule_type == "none":
            org.pay_day = None
            org.next_payout_date = None
            org.schedule_anchor = None
    elif req.pay_day is not None:
        org.pay_day = req.pay_day

    db.add(org)
    return {"status": "updated"}
