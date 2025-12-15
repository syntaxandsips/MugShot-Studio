"""
Rate limiting middleware using Upstash Redis.

This module provides rate limiting functionality using Upstash Redis
REST API, which is compatible with serverless deployments.

Features:
- Configurable rate limits (requests per time window)
- User-based or IP-based limiting
- Proper error handling with fallback behavior
- Production-ready logging
"""

from fastapi import HTTPException, Request, Depends
from app.core.redis import get_redis, RedisTokenStore
from typing import Any
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter dependency for FastAPI endpoints.
    
    Uses a simple fixed-window algorithm with Redis counters.
    Falls back to allowing requests if Redis is unavailable.
    
    Usage:
        @router.post("/endpoint", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
        async def my_endpoint():
            ...
    """
    
    def __init__(self, times: int, seconds: int):
        """
        Initialize the rate limiter.
        
        Args:
            times: Maximum number of requests allowed within the time window
            seconds: Time window duration in seconds
        """
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request, redis: Any = Depends(get_redis)):
        """
        Check rate limit for the incoming request.
        
        Args:
            request: The incoming FastAPI request
            redis: Redis client instance from dependency injection
            
        Raises:
            HTTPException: 429 Too Many Requests if rate limit is exceeded
        """
        try:
            # Determine rate limit key based on user or IP
            key = self._get_rate_limit_key(request)
            
            # Increment counter in Redis
            current = await redis.incr(key)
            
            if current is None:
                # Redis operation failed, allow request (fail-open)
                logger.warning(f"Rate limit check failed for {key}, allowing request")
                return
            
            # Set expiration on first request in window
            if current == 1:
                await redis.expire(key, self.seconds)
            
            # Check if limit exceeded
            if current > self.times:
                logger.warning(f"Rate limit exceeded for {key}: {current}/{self.times}")
                raise HTTPException(
                    status_code=429, 
                    detail=f"Too many requests. Please try again in {self.seconds} seconds."
                )
                
            logger.debug(f"Rate limit check passed for {key}: {current}/{self.times}")
            
        except HTTPException:
            # Re-raise HTTP exceptions (rate limit exceeded)
            raise
        except Exception as e:
            # Log error but allow request (fail-open behavior)
            logger.error(f"Rate limiter error: {e}")
            # Allow the request to proceed even if rate limiting fails
    
    def _get_rate_limit_key(self, request: Request) -> str:
        """
        Generate a unique rate limit key for the request.
        
        Uses user ID if authenticated, otherwise falls back to client IP.
        
        Args:
            request: The incoming FastAPI request
            
        Returns:
            A unique rate limit key string
        """
        # Try to get user from request state (set by auth middleware)
        user = getattr(request.state, "user", None)
        
        if user and isinstance(user, dict) and "id" in user:
            identifier = f"user:{user['id']}"
        else:
            # Fall back to IP address
            client_ip = request.client.host if request.client else "unknown"
            identifier = f"ip:{client_ip}"
        
        # Include the endpoint path in the key for per-endpoint limiting
        path = request.url.path
        
        return f"rate_limit:{identifier}:{path}"
