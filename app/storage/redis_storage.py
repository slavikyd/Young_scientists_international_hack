import redis.asyncio as aioredis
from typing import Optional, Any, List
import json
import logging

from app.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()

# Global Redis connection
_redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    """Initialize Redis connection."""
    global _redis_client
    try:
        _redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=settings.REDIS_DECODE_RESPONSES,
            encoding="utf8"
        )
        await _redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        logger.info("Redis connection closed")


def get_redis() -> aioredis.Redis:
    """Get Redis client instance."""
    if _redis_client is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis_client


class RedisStorage:
    """Redis storage wrapper for participants, templates, and session data."""
    
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis
    
    async def set_json(self, key: str, value: Any, expire: Optional[int] = None):
        """Store JSON data in Redis."""
        json_str = json.dumps(value, default=str)
        await self.redis.set(key, json_str, ex=expire)
    
    async def get_json(self, key: str) -> Optional[Any]:
        """Retrieve JSON data from Redis."""
        data = await self.redis.get(key)
        if data is None:
            return None
        return json.loads(data)
    
    async def delete(self, key: str) -> bool:
        """Delete a key from Redis."""
        result = await self.redis.delete(key)
        return result > 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        return await self.redis.exists(key) > 0
    
    async def get_all_keys(self, pattern: str) -> List[str]:
        """Get all keys matching pattern."""
        cursor = 0
        keys = []
        while True:
            cursor, batch_keys = await self.redis.scan(cursor, match=pattern)
            keys.extend(batch_keys)
            if cursor == 0:
                break
        return keys
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter."""
        return await self.redis.incrby(key, amount)
    
    async def decrement(self, key: str, amount: int = 1) -> int:
        """Decrement counter."""
        return await self.redis.decrby(key, amount)
    
    async def set_expiration(self, key: str, seconds: int) -> bool:
        """Set expiration time for a key."""
        return await self.redis.expire(key, seconds)
    
    async def get_ttl(self, key: str) -> int:
        """Get time to live for a key."""
        return await self.redis.ttl(key)


class ParticipantRedisStorage:
    """Storage for participants in Redis."""
    
    KEY_PREFIX = "participants"
    
    def __init__(self, redis: aioredis.Redis):
        self.storage = RedisStorage(redis)
    
    @staticmethod
    def _get_key(participant_id: str) -> str:
        return f"{ParticipantRedisStorage.KEY_PREFIX}:{participant_id}"
    
    @staticmethod
    def _get_list_key() -> str:
        return f"{ParticipantRedisStorage.KEY_PREFIX}:list"
    
    async def save(self, participant_id: str, data: dict, expire: Optional[int] = None):
        """Save participant data."""
        key = self._get_key(participant_id)
        await self.storage.set_json(key, data, expire or settings.SESSION_EXPIRATION)
        # Also store in list index
        await self.storage.redis.sadd(self._get_list_key(), participant_id)
    
    async def get(self, participant_id: str) -> Optional[dict]:
        """Get participant data."""
        key = self._get_key(participant_id)
        return await self.storage.get_json(key)
    
    async def delete(self, participant_id: str) -> bool:
        """Delete participant."""
        key = self._get_key(participant_id)
        await self.storage.redis.srem(self._get_list_key(), participant_id)
        return await self.storage.delete(key)
    
    async def get_all(self) -> List[dict]:
        """Get all participants."""
        ids = await self.storage.redis.smembers(self._get_list_key())
        participants = []
        for pid in ids:
            data = await self.get(pid)
            if data:
                participants.append(data)
        return participants
    
    async def clear_all(self):
        """Delete all participants."""
        ids = await self.storage.redis.smembers(self._get_list_key())
        for pid in ids:
            await self.delete(pid)


class TemplateRedisStorage:
    """Storage for templates in Redis."""
    
    KEY_PREFIX = "templates"
    
    def __init__(self, redis: aioredis.Redis):
        self.storage = RedisStorage(redis)
    
    @staticmethod
    def _get_key(template_id: str) -> str:
        return f"{TemplateRedisStorage.KEY_PREFIX}:{template_id}"
    
    @staticmethod
    def _get_list_key() -> str:
        return f"{TemplateRedisStorage.KEY_PREFIX}:list"
    
    async def save(self, template_id: str, data: dict):
        """Save template metadata (content in file)."""
        key = self._get_key(template_id)
        await self.storage.set_json(key, data)
        await self.storage.redis.sadd(self._get_list_key(), template_id)
    
    async def get(self, template_id: str) -> Optional[dict]:
        """Get template metadata."""
        key = self._get_key(template_id)
        return await self.storage.get_json(key)
    
    async def delete(self, template_id: str) -> bool:
        """Delete template."""
        key = self._get_key(template_id)
        await self.storage.redis.srem(self._get_list_key(), template_id)
        return await self.storage.delete(key)
    
    async def get_all(self) -> List[dict]:
        """Get all template metadata."""
        ids = await self.storage.redis.smembers(self._get_list_key())
        templates = []
        for tid in ids:
            data = await self.get(tid)
            if data:
                templates.append(data)
        return templates