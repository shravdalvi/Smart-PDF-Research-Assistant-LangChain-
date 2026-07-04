"""
Centralised application logger.
Import `logger` from this module anywhere in the backend.
"""

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("smart_pdf_api")
