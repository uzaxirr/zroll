from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "zroll",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "sync-zec-price": {
            "task": "app.workers.tasks.sync_zec_price",
            "schedule": 60.0,
        },
        "sync-wallet-balances": {
            "task": "app.workers.tasks.sync_wallet_balances",
            "schedule": 300.0,
        },
        "check-confirmations": {
            "task": "app.workers.tasks.check_confirmations",
            "schedule": 75.0,
        },
        "check-test-confirmations": {
            "task": "app.workers.tasks.check_test_confirmations",
            "schedule": 75.0,
        },
        "check-payout-schedule": {
            "task": "app.workers.tasks.check_payout_schedule",
            "schedule": 3600.0,  # hourly
        },
        "check-cross-pay-swaps": {
            "task": "app.workers.tasks.check_cross_pay_swaps",
            "schedule": 60.0,
        },
    },
)
