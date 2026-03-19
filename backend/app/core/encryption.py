import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import get_settings

settings = get_settings()


def _get_key() -> bytes:
    return bytes.fromhex(settings.wallet_encryption_key)


def encrypt(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt(token: str) -> str:
    try:
        key = _get_key()
        data = base64.b64decode(token)
        nonce = data[:12]
        ciphertext = data[12:]
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode("utf-8")
    except Exception:
        # Seed data or unencrypted values - return as-is
        return token
