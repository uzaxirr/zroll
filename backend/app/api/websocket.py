import uuid
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import async_session
from app.models.payroll import PayrollRun

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/payroll/{run_id}/status")
async def payroll_status_ws(websocket: WebSocket, run_id: uuid.UUID):
    await websocket.accept()

    try:
        while True:
            async with async_session() as db:
                result = await db.execute(
                    select(PayrollRun).where(PayrollRun.id == run_id)
                )
                run = result.scalar_one_or_none()

                if not run:
                    await websocket.send_json({"error": "Payroll run not found"})
                    break

                status_data = {
                    "confirmations": run.confirmations,
                    "status": run.status.value,
                    "tx_id": run.tx_id,
                }
                await websocket.send_json(status_data)

                if run.status.value in ("completed", "failed"):
                    break

            await asyncio.sleep(10)
    except WebSocketDisconnect:
        pass
