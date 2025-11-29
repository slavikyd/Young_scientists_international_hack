import redis.asyncio as redis
import json
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

_redis_client = None


async def init_redis(url: str = "redis://redis:6379/0") -> redis.Redis:
    """Initialize Redis connection."""
    global _redis_client
    try:
        _redis_client = await redis.from_url(url, decode_responses=True)
        await _redis_client.ping()
        logger.info("✅ Redis connected successfully")
        return _redis_client
    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")
        raise


async def get_redis() -> redis.Redis:
    """Get Redis client instance."""
    global _redis_client
    if _redis_client is None:
        await init_redis()
    return _redis_client


async def close_redis():
    """Close global Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("✅ Redis connection closed")


class RedisStorage:
    """Redis storage for templates and participants."""

    def __init__(self):
        self.client = None

    async def connect(self):
        """Connect to Redis."""
        self.client = await get_redis()

    async def save_template(self, template_id: str, metadata: Dict[str, Any]) -> bool:
        """Save template metadata to Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"template:{template_id}"
            await self.client.set(key, json.dumps(metadata))
            logger.info(f"Saved template: {template_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving template: {e}")
            raise

    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template metadata from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"template:{template_id}"
            data = await self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting template: {e}")
            raise

    async def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all templates from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            keys = await self.client.keys("template:*")
            templates = []
            for key in keys:
                data = await self.client.get(key)
                if data:
                    templates.append(json.loads(data))
            return templates
        except Exception as e:
            logger.error(f"Error getting all templates: {e}")
            return []

    async def delete_template(self, template_id: str) -> bool:
        """Delete template from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"template:{template_id}"
            await self.client.delete(key)
            logger.info(f"Deleted template: {template_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting template: {e}")
            raise

    async def save_participant(self, participant_id: str, data: Dict[str, Any], ttl: int = None) -> bool:
        """Save participant to Redis with optional TTL."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"participant:{participant_id}"
            if ttl:
                await self.client.set(key, json.dumps(data), ex=ttl)
            else:
                await self.client.set(key, json.dumps(data))
            logger.info(f"Saved participant: {participant_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving participant: {e}")
            raise

    async def get_participant(self, participant_id: str) -> Optional[Dict[str, Any]]:
        """Get participant from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"participant:{participant_id}"
            data = await self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting participant: {e}")
            raise

    async def get_all_participants(self) -> List[Dict[str, Any]]:
        """Get all participants from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            keys = await self.client.keys("participant:*")
            participants = []
            for key in keys:
                data = await self.client.get(key)
                if data:
                    participants.append(json.loads(data))
            return participants
        except Exception as e:
            logger.error(f"Error getting participants: {e}")
            return []

    async def delete_participant(self, participant_id: str) -> bool:
        """Delete participant from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"participant:{participant_id}"
            await self.client.delete(key)
            logger.info(f"Deleted participant: {participant_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting participant: {e}")
            raise

    async def save_batch(self, batch_id: str, data: Dict[str, Any]) -> bool:
        """Save batch metadata to Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"batch:{batch_id}"
            await self.client.set(key, json.dumps(data))
            logger.info(f"Saved batch: {batch_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving batch: {e}")
            raise

    async def get_batch(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """Get batch metadata from Redis."""
        try:
            if not self.client:
                await self.connect()
            
            key = f"batch:{batch_id}"
            data = await self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting batch: {e}")
            raise

    async def close(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()