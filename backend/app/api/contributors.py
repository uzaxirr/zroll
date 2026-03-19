import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from decimal import Decimal

from app.core.auth import AuthContext, require_role
from app.core.database import get_db
from app.core.encryption import encrypt, decrypt
from app.models.contributor import Contributor, ContributorStatus, EmploymentType, PaymentPreference, DestinationChain

router = APIRouter(prefix="/api/contributors", tags=["contributors"])


class ContributorCreate(BaseModel):
    full_name: str
    email: str
    department: str
    monthly_rate_usd: float
    wallet_address: Optional[str] = None
    employment_type: str = "employee"
    tax_jurisdiction: str = "US"
    payment_preference: str = "zec"
    destination_chain: Optional[str] = None
    destination_address: Optional[str] = None


class ContributorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    monthly_rate_usd: Optional[float] = None
    wallet_address: Optional[str] = None
    status: Optional[str] = None
    employment_type: Optional[str] = None
    tax_jurisdiction: Optional[str] = None
    payment_preference: Optional[str] = None
    destination_chain: Optional[str] = None
    destination_address: Optional[str] = None


def _mask_address(addr: str) -> str:
    if not addr or len(addr) < 8:
        return addr or ""
    return f"{addr[:4]}...{addr[-4:]}"


@router.get("")
async def list_contributors(
    department: str = Query("all"),
    search: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org_id = auth.organization.id
    query = select(Contributor).where(Contributor.organization_id == org_id)

    if department != "all":
        query = query.where(Contributor.department == department)
    if search:
        query = query.where(
            or_(
                Contributor.full_name.ilike(f"%{search}%"),
                Contributor.email.ilike(f"%{search}%"),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Get department counts
    dept_query = select(
        Contributor.department,
        func.count().label("count"),
    ).where(
        Contributor.organization_id == org_id,
    ).group_by(Contributor.department)
    dept_result = await db.execute(dept_query)
    departments = [{"name": r.department, "count": r.count} for r in dept_result]

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit).order_by(Contributor.full_name)
    result = await db.execute(query)
    contributors = result.scalars().all()

    items = []
    for c in contributors:
        addr = ""
        if c.wallet_address:
            try:
                addr = decrypt(c.wallet_address)
            except Exception:
                addr = ""
        items.append({
            "id": str(c.id),
            "full_name": c.full_name,
            "email": c.email,
            "department": c.department,
            "wallet_address_masked": _mask_address(addr),
            "monthly_rate_usd": float(c.monthly_rate_usd),
            "status": c.status.value,
            "employment_type": c.employment_type.value,
            "verification_status": c.verification_status,
            "payment_preference": c.payment_preference.value,
            "destination_chain": c.destination_chain.value if c.destination_chain else None,
            "destination_address_masked": _mask_address(decrypt(c.destination_address)) if c.destination_address else None,
        })

    return {
        "total": total,
        "departments": departments,
        "contributors": items,
    }


@router.post("")
async def create_contributor(
    req: ContributorCreate,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    pref = PaymentPreference(req.payment_preference)
    if pref == PaymentPreference.usdc:
        if not req.destination_chain:
            raise HTTPException(status_code=400, detail="destination_chain is required for USDC payments")
        if not req.destination_address:
            raise HTTPException(status_code=400, detail="destination_address is required for USDC payments")

    contributor = Contributor(
        organization_id=auth.organization.id,
        full_name=req.full_name,
        email=req.email,
        department=req.department,
        monthly_rate_usd=Decimal(str(req.monthly_rate_usd)),
        wallet_address=encrypt(req.wallet_address) if req.wallet_address else None,
        status=ContributorStatus.pending,
        employment_type=EmploymentType(req.employment_type),
        tax_jurisdiction=req.tax_jurisdiction,
        payment_preference=pref,
        destination_chain=DestinationChain(req.destination_chain) if req.destination_chain else None,
        destination_address=encrypt(req.destination_address) if req.destination_address else None,
    )
    db.add(contributor)
    await db.flush()

    # Dispatch test transaction if wallet address was provided
    if req.wallet_address:
        from app.workers.tasks import send_test_transaction
        send_test_transaction.delay(str(contributor.id))

    return {"id": str(contributor.id), "status": "created"}


@router.put("/{contributor_id}")
async def update_contributor(
    contributor_id: uuid.UUID,
    req: ContributorUpdate,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contributor).where(
            Contributor.id == contributor_id,
            Contributor.organization_id == auth.organization.id,
        )
    )
    contributor = result.scalar_one_or_none()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")

    if req.full_name is not None:
        contributor.full_name = req.full_name
    if req.email is not None:
        contributor.email = req.email
    if req.department is not None:
        contributor.department = req.department
    if req.monthly_rate_usd is not None:
        contributor.monthly_rate_usd = Decimal(str(req.monthly_rate_usd))
    if req.wallet_address is not None:
        contributor.wallet_address = encrypt(req.wallet_address)
    if req.status is not None:
        contributor.status = ContributorStatus(req.status)
    if req.employment_type is not None:
        contributor.employment_type = EmploymentType(req.employment_type)
    if req.tax_jurisdiction is not None:
        contributor.tax_jurisdiction = req.tax_jurisdiction
    if req.payment_preference is not None:
        pref = PaymentPreference(req.payment_preference)
        contributor.payment_preference = pref
        if pref == PaymentPreference.usdc:
            if not (req.destination_chain or contributor.destination_chain):
                raise HTTPException(status_code=400, detail="destination_chain is required for USDC payments")
            if not (req.destination_address or contributor.destination_address):
                raise HTTPException(status_code=400, detail="destination_address is required for USDC payments")
    if req.destination_chain is not None:
        contributor.destination_chain = DestinationChain(req.destination_chain)
    if req.destination_address is not None:
        contributor.destination_address = encrypt(req.destination_address)

    db.add(contributor)
    return {"status": "updated"}


@router.delete("/{contributor_id}")
async def delete_contributor(
    contributor_id: uuid.UUID,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contributor).where(
            Contributor.id == contributor_id,
            Contributor.organization_id == auth.organization.id,
        )
    )
    contributor = result.scalar_one_or_none()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")

    await db.delete(contributor)
    return {"status": "deleted"}


class BulkContributorItem(BaseModel):
    full_name: str
    email: str
    department: str
    monthly_rate_usd: float
    wallet_address: Optional[str] = None
    employment_type: str = "employee"
    tax_jurisdiction: str = "US"


class BulkContributorCreate(BaseModel):
    contributors: list[BulkContributorItem]


@router.post("/bulk")
async def bulk_create_contributors(
    req: BulkContributorCreate,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Bulk import contributors from CSV. Skips duplicates by email."""
    org_id = auth.organization.id

    # Get existing emails to skip duplicates
    result = await db.execute(
        select(Contributor.email).where(Contributor.organization_id == org_id)
    )
    existing_emails = {r[0].lower() for r in result}

    created = []
    skipped = []
    errors = []

    for item in req.contributors:
        if item.email.lower() in existing_emails:
            skipped.append({"email": item.email, "reason": "already exists"})
            continue

        try:
            contributor = Contributor(
                organization_id=org_id,
                full_name=item.full_name,
                email=item.email,
                department=item.department,
                monthly_rate_usd=Decimal(str(item.monthly_rate_usd)),
                wallet_address=encrypt(item.wallet_address) if item.wallet_address else None,
                status=ContributorStatus.pending,
                employment_type=EmploymentType(item.employment_type),
                tax_jurisdiction=item.tax_jurisdiction,
                payment_preference=PaymentPreference.zec,
            )
            db.add(contributor)
            await db.flush()
            created.append({"id": str(contributor.id), "name": item.full_name, "email": item.email})
            existing_emails.add(item.email.lower())
        except Exception as e:
            errors.append({"email": item.email, "reason": str(e)})

    await db.commit()

    return {
        "created_count": len(created),
        "skipped_count": len(skipped),
        "error_count": len(errors),
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }


@router.get("/csv-template")
async def csv_template():
    """Download a CSV template for bulk import."""
    import io
    import csv
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "email", "department", "monthly_rate_usd", "wallet_address", "employment_type", "tax_jurisdiction"])
    writer.writerow(["Jane Smith", "jane@company.com", "Engineering", "5000", "utest1...", "employee", "US"])
    writer.writerow(["Bob Jones", "bob@company.com", "Marketing", "4500", "", "contractor", "US"])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contributors_template.csv"},
    )


@router.post("/{contributor_id}/verify")
async def send_test_tx(
    contributor_id: uuid.UUID,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contributor).where(
            Contributor.id == contributor_id,
            Contributor.organization_id == auth.organization.id,
        )
    )
    contributor = result.scalar_one_or_none()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")
    if not contributor.wallet_address:
        raise HTTPException(status_code=400, detail="Contributor has no wallet address")
    if contributor.verification_status == "verified":
        raise HTTPException(status_code=400, detail="Contributor already verified")

    from app.workers.tasks import send_test_transaction
    send_test_transaction.delay(str(contributor.id))

    return {"status": "test_transaction_queued"}
