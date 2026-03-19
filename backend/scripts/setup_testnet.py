"""Generate Zcash testnet wallets for development/testing.

Creates contributor wallets via the Rust zcash-service and displays
all addresses. The org wallet is hardcoded (already funded with test ZEC).
No database operations. Use the generated addresses with the API.

Prerequisites:
  1. Rust zcash-service running on localhost:8080

Usage:
  python scripts/setup_testnet.py
  python scripts/setup_testnet.py --send-test    # also send a test transaction
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
from app.core.config import get_settings

settings = get_settings()
ZCASH_SERVICE_URL = settings.zcash_service_url

# Hardcoded org wallet. This testnet address already has funded test ZEC.
# Do NOT regenerate it; reuse across all dev setups.
ORG_WALLET_ADDRESS = "utest1ypye2vv5xa3yrgkzl38audwxz5jka320f59eyzxjlhmrc47g6dhcx0hf8k8slgawquq2uvr388zn820qgm0rp6zlnp8lzhjkxu6j4zv2"


async def create_wallet(client: httpx.AsyncClient, label: str) -> dict:
    """Create a real wallet via the Rust service."""
    print(f"  Creating wallet for {label}...")
    resp = await client.post(f"{ZCASH_SERVICE_URL}/wallet/generate", timeout=120.0)
    resp.raise_for_status()
    data = resp.json()
    print(f"  Wallet ID: {data['wallet_id']}")
    print(f"  Address:   {data['unified_address']}")
    return data


async def setup():
    send_test = "--send-test" in sys.argv
    client = httpx.AsyncClient()

    # Step 1: Verify Zcash service is running
    print("\n=== Step 1: Verify Zcash service ===")
    try:
        resp = await client.get(f"{ZCASH_SERVICE_URL}/health", timeout=10.0)
        resp.raise_for_status()
        print(f"  Service healthy: {resp.json()}")
    except Exception as e:
        print(f"  ERROR: Zcash service not reachable at {ZCASH_SERVICE_URL}")
        print(f"  Start the Rust service first: cd zcash-service && cargo run")
        print(f"  Error: {e}")
        return

    # Step 2: Resolve org wallet
    print("\n=== Step 2: Organization wallet (pre-funded) ===")
    print(f"  Address: {ORG_WALLET_ADDRESS}")
    resp = await client.post(
        f"{ZCASH_SERVICE_URL}/wallet/resolve",
        json={"unified_address": ORG_WALLET_ADDRESS},
        timeout=120.0,
    )
    if resp.status_code == 200:
        org_wallet = resp.json()
        org_wallet_id = org_wallet["wallet_id"]
        print(f"  Wallet ID: {org_wallet_id}")
    else:
        print("  Could not resolve wallet ID (service may not track it yet).")
        print("  The address is still valid for receiving funds.")
        org_wallet_id = None

    # Check balance if we have a wallet ID
    balance = None
    if org_wallet_id:
        print("  Syncing...")
        await client.post(f"{ZCASH_SERVICE_URL}/wallet/{org_wallet_id}/sync", timeout=300.0)
        resp = await client.get(f"{ZCASH_SERVICE_URL}/wallet/{org_wallet_id}/balance", timeout=300.0)
        if resp.status_code == 200:
            balance = resp.json()["balance_zec"]
            print(f"  Balance: {balance} ZEC")

    # Step 3: Create contributor wallets
    print("\n=== Step 3: Create contributor wallets ===")
    contributors = ["Alice Kim", "Marcus Rivera", "Sarah Lee"]
    contributor_wallets = []
    for name in contributors:
        wallet = await create_wallet(client, name)
        contributor_wallets.append((name, wallet))

    # Step 4: Send test transaction (optional)
    tx_id = None
    if send_test and org_wallet_id and balance and balance > 0.001:
        print("\n=== Step 4: Send test transaction ===")
        recipient = contributor_wallets[0][1]["unified_address"]
        payload = {
            "outputs": [{
                "address": recipient,
                "amount_zec": 0.001,
                "memo_bytes": '{"org":"Acme Corp","period":"Test","type":"Test Payment"}',
            }]
        }
        print(f"  Sending 0.001 ZEC to {contributor_wallets[0][0]}...")
        resp = await client.post(
            f"{ZCASH_SERVICE_URL}/wallet/{org_wallet_id}/send",
            json=payload,
            timeout=300.0,
        )
        if resp.status_code == 200:
            tx_id = resp.json()["tx_id"]
            print(f"  Transaction ID: {tx_id}")
        else:
            print(f"  Send failed: {resp.status_code} {resp.text}")
    elif send_test:
        print("\n=== Step 4: Send test transaction ===")
        print("  Skipped: org wallet has no balance or could not be resolved.")

    # Summary
    print("\n" + "=" * 60)
    print("  TESTNET WALLETS")
    print("=" * 60)
    print(f"\n  Organization (pre-funded):")
    print(f"    {ORG_WALLET_ADDRESS}")
    if balance is not None:
        print(f"    Balance: {balance} ZEC")
    print(f"\n  Contributors:")
    for name, wallet in contributor_wallets:
        print(f"    {name}:")
        print(f"      {wallet['unified_address']}")
    if tx_id:
        print(f"\n  Test transaction: {tx_id}")
    print(f"\n  Use these addresses with the API to add contributors.")
    print(f"  Example: POST /api/contributors with wallet_address field.")
    print()

    await client.aclose()


if __name__ == "__main__":
    asyncio.run(setup())
