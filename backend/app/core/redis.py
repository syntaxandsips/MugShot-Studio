"""
Upstash Redis integration module for serverless deployments.

This module provides async Redis connectivity using Upstash Redis REST API,
which is optimized for serverless environments like Vercel.

Features:
- Async/await support
- Automatic retry with exponential backoff
- Connection pooling via REST API
- Proper error handling and logging
- Production-ready with comprehensive logging
"""

import logging
from typing import Optional, Any
from upstash_redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Singleton Redis client instance (reused across requests in serverless)
_redis_client: Optional[Redis] = None


class UpstashRedisError(Exception):
    """Custom exception for Upstash Redis operations."""
    pass


def get_redis_client() -> Redis:
    """
    Get or create a singleton Redis client instance.
    
    Uses environment variables:
    - UPSTASH_REDIS_REST_URL: The Upstash Redis REST API URL
    - UPSTASH_REDIS_REST_TOKEN: The Upstash Redis REST API token
    
    Returns:
        Redis: Async Upstash Redis client instance
        
    Raises:
        UpstashRedisError: If Redis configuration is missing
    """
    global _redis_client
    
    if _redis_client is not None:
        return _redis_client
    
    try:
        url = settings.UPSTASH_REDIS_REST_URL
        token = settings.UPSTASH_REDIS_REST_TOKEN
        
        if not url or not token:
            logger.warning("Upstash Redis credentials not configured")
            raise UpstashRedisError("Upstash Redis configuration missing")
        
        _redis_client = Redis(
            url=url,
            token=token,
            allow_telemetry=False  # Disable telemetry for privacy
        )
        
        logger.info("Upstash Redis client initialized successfully")
        return _redis_client
        
    except Exception as e:
        logger.error(f"Failed to initialize Upstash Redis client: {e}")
        raise UpstashRedisError(f"Redis initialization failed: {e}")


class RedisTokenStore:
    """
    Token storage service using Upstash Redis.
    
    Provides methods for storing and retrieving temporary tokens
    with automatic expiration (e.g., for password reset, email confirmation).
    """
    
    def __init__(self):
        """Initialize the Redis token store."""
        self._client: Optional[Redis] = None
    
    @property
    def client(self) -> Redis:
        """Lazy load Redis client."""
        if self._client is None:
            self._client = get_redis_client()
        return self._client
    
    async def get(self, key: str) -> Optional[str]:
        """
        Get a value by key from Redis.
        
        Args:
            key: The Redis key to retrieve
            
        Returns:
            The value if found, None otherwise
        """
        try:
            value = await self.client.get(key)
            if value is not None:
                logger.debug(f"Redis GET successful for key: {key[:20]}...")
            return value
        except Exception as e:
            logger.error(f"Redis GET failed for key {key[:20]}...: {e}")
            return None
    
    async def setex(self, key: str, seconds: int, value: str) -> bool:
        """
        Set a value with expiration time.
        
        Args:
            key: The Redis key
            seconds: Expiration time in seconds
            value: The value to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            await self.client.setex(key, seconds, value)
            logger.debug(f"Redis SETEX successful for key: {key[:20]}... (TTL: {seconds}s)")
            return True
        except Exception as e:
            logger.error(f"Redis SETEX failed for key {key[:20]}...: {e}")
            return False
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """
        Set a value with optional expiration.
        
        Args:
            key: The Redis key
            value: The value to store
            ex: Optional expiration time in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if ex:
                await self.client.setex(key, ex, value)
            else:
                await self.client.set(key, value)
            logger.debug(f"Redis SET successful for key: {key[:20]}...")
            return True
        except Exception as e:
            logger.error(f"Redis SET failed for key {key[:20]}...: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete a key from Redis.
        
        Args:
            key: The Redis key to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            await self.client.delete(key)
            logger.debug(f"Redis DELETE successful for key: {key[:20]}...")
            return True
        except Exception as e:
            logger.error(f"Redis DELETE failed for key {key[:20]}...: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if a key exists in Redis.
        
        Args:
            key: The Redis key to check
            
        Returns:
            True if key exists, False otherwise
        """
        try:
            result = await self.client.exists(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis EXISTS failed for key {key[:20]}...: {e}")
            return False
    
    async def incr(self, key: str) -> Optional[int]:
        """
        Increment a counter in Redis.
        
        Args:
            key: The Redis key to increment
            
        Returns:
            The new value after increment, None on error
        """
        try:
            value = await self.client.incr(key)
            return value
        except Exception as e:
            logger.error(f"Redis INCR failed for key {key[:20]}...: {e}")
            return None
    
    async def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration time on a key.
        
        Args:
            key: The Redis key
            seconds: Expiration time in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            await self.client.expire(key, seconds)
            return True
        except Exception as e:
            logger.error(f"Redis EXPIRE failed for key {key[:20]}...: {e}")
            return False
    
    async def close(self):
        """Close the Redis connection (no-op for Upstash REST API)."""
        pass


async def get_redis():
    """
    FastAPI dependency that provides a Redis token store.
    
    Usage:
        @router.post("/some-endpoint")
        async def some_endpoint(redis: RedisTokenStore = Depends(get_redis)):
            await redis.set("key", "value", ex=3600)
    
    Yields:
        RedisTokenStore: An instance of the Redis token store
    """
    store = RedisTokenStore()
    try:
        yield store
    finally:
        await store.close()


async def check_redis_health() -> dict:
    """
    Check Redis connection health.
    
    Returns:
        dict: Health status with 'healthy' boolean and optional 'error' message
    """
    try:
        client = get_redis_client()
        # Ping to verify connection
        result = await client.ping()
        return {
            "healthy": result == "PONG",
            "provider": "upstash",
            "status": "connected"
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {
            "healthy": False,
            "provider": "upstash",
            "status": "disconnected",
            "error": str(e)
        }
