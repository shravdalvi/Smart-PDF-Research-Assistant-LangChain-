"""
MongoDB async connection management using Motor.
Call connect_to_mongo() at app startup, close_mongo_connection() at shutdown.
Use get_database() to obtain a handle to the configured database.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings
from utils.logger import logger


class _Database:
    client: AsyncIOMotorClient = None


_db = _Database()


async def connect_to_mongo() -> None:
    """Open the Motor connection pool."""
    _db.client = AsyncIOMotorClient(settings.MONGO_URI)
    logger.info("Connected to MongoDB at %s", settings.MONGO_URI)


async def close_mongo_connection() -> None:
    """Close the Motor connection pool."""
    if _db.client:
        _db.client.close()
        logger.info("MongoDB connection closed.")


def get_database():
    """Return the configured Motor database instance."""
    return _db.client[settings.DATABASE_NAME]
