"""
Users endpoint for MugShot Studio API.

Handles public user profiles, follow system, and user discovery.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from core.security import get_current_user, get_current_user_optional
from db.supabase import get_supabase
from core.storage import StorageConfig
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class PublicProfileResponse(BaseModel):
    """Public profile response model (excludes sensitive data)."""
    id: str
    username: str
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool = False
    followers_count: int = 0
    following_count: int = 0
    thumbnails_count: int = 0
    is_public: bool = True
    is_following: Optional[bool] = None  # Only set when authenticated


class UserListItem(BaseModel):
    """User list item for followers/following lists."""
    id: str
    username: str
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    is_verified: bool = False
    is_following: Optional[bool] = None


class PaginatedUserList(BaseModel):
    """Paginated list of users."""
    users: List[UserListItem]
    total: int
    page: int
    limit: int
    has_more: bool


def get_profile_photo_url(supabase, user_data: dict) -> Optional[str]:
    """Helper to get profile photo URL from user data."""
    if user_data.get("profile_photo_asset_id"):
        try:
            asset_res = supabase.table("assets").select("storage_path").eq("id", user_data["profile_photo_asset_id"]).execute()
            if asset_res.data:
                path = asset_res.data[0]["storage_path"]
                return supabase.storage.from_(StorageConfig.PROFILE_PHOTOS_BUCKET).get_public_url(path)
        except:
            pass
    return None


def get_follow_counts(supabase, user_id: str) -> tuple:
    """Get followers and following counts for a user."""
    try:
        followers = supabase.table("user_follows").select("id", count="exact").eq("following_id", user_id).execute()
        following = supabase.table("user_follows").select("id", count="exact").eq("follower_id", user_id).execute()
        return (followers.count or 0, following.count or 0)
    except:
        return (0, 0)


def get_thumbnails_count(supabase, user_id: str) -> int:
    """Get count of public projects for a user."""
    try:
        response = supabase.table("projects").select("id", count="exact").eq("user_id", user_id).execute()
        return response.count or 0
    except:
        return 0


def check_is_following(supabase, follower_id: str, following_id: str) -> bool:
    """Check if follower_id is following following_id."""
    try:
        response = supabase.table("user_follows").select("id").eq("follower_id", follower_id).eq("following_id", following_id).execute()
        return len(response.data) > 0
    except:
        return False


@router.get("/@{username}", response_model=PublicProfileResponse)
async def get_public_profile(
    username: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get a user's public profile by username.
    Returns limited info for private profiles.
    """
    supabase = get_supabase()
    
    # Fetch user by username
    response = supabase.table("users").select("*").eq("username", username).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = response.data[0]
    
    # Get profile photo URL
    profile_photo_url = get_profile_photo_url(supabase, user_data)
    
    # Get follow counts
    followers_count, following_count = get_follow_counts(supabase, user_data["id"])
    
    # Get thumbnails count
    thumbnails_count = get_thumbnails_count(supabase, user_data["id"])
    
    # Check if current user is following this user
    is_following = None
    if current_user and current_user["id"] != user_data["id"]:
        is_following = check_is_following(supabase, current_user["id"], user_data["id"])
    
    # If profile is private and not the current user, return limited info
    is_public = user_data.get("is_public", True)
    if not is_public and (not current_user or current_user["id"] != user_data["id"]):
        return PublicProfileResponse(
            id=user_data["id"],
            username=user_data["username"],
            full_name=None,
            profile_photo_url=profile_photo_url,
            bio=None,
            is_verified=user_data.get("is_verified", False),
            followers_count=followers_count,
            following_count=following_count,
            thumbnails_count=0,
            is_public=False,
            is_following=is_following
        )
    
    return PublicProfileResponse(
        id=user_data["id"],
        username=user_data["username"],
        full_name=user_data.get("full_name"),
        profile_photo_url=profile_photo_url,
        bio=user_data.get("bio"),
        is_verified=user_data.get("is_verified", False),
        followers_count=followers_count,
        following_count=following_count,
        thumbnails_count=thumbnails_count,
        is_public=is_public,
        is_following=is_following
    )


@router.get("/{user_id}", response_model=PublicProfileResponse)
async def get_public_profile_by_id(
    user_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get a user's public profile by ID.
    """
    supabase = get_supabase()
    
    # Fetch user by ID
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = response.data[0]
    
    # Get profile photo URL
    profile_photo_url = get_profile_photo_url(supabase, user_data)
    
    # Get follow counts
    followers_count, following_count = get_follow_counts(supabase, user_data["id"])
    
    # Get thumbnails count
    thumbnails_count = get_thumbnails_count(supabase, user_data["id"])
    
    # Check if current user is following this user
    is_following = None
    if current_user and current_user["id"] != user_data["id"]:
        is_following = check_is_following(supabase, current_user["id"], user_data["id"])
    
    # If profile is private and not the current user, return limited info
    is_public = user_data.get("is_public", True)
    if not is_public and (not current_user or current_user["id"] != user_data["id"]):
        return PublicProfileResponse(
            id=user_data["id"],
            username=user_data["username"],
            full_name=None,
            profile_photo_url=profile_photo_url,
            bio=None,
            is_verified=user_data.get("is_verified", False),
            followers_count=followers_count,
            following_count=following_count,
            thumbnails_count=0,
            is_public=False,
            is_following=is_following
        )
    
    return PublicProfileResponse(
        id=user_data["id"],
        username=user_data["username"],
        full_name=user_data.get("full_name"),
        profile_photo_url=profile_photo_url,
        bio=user_data.get("bio"),
        is_verified=user_data.get("is_verified", False),
        followers_count=followers_count,
        following_count=following_count,
        thumbnails_count=thumbnails_count,
        is_public=is_public,
        is_following=is_following
    )


@router.post("/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Follow a user.
    """
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    
    supabase = get_supabase()
    
    # Check if target user exists
    target_user = supabase.table("users").select("id").eq("id", user_id).execute()
    if not target_user.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if not already following
    existing = supabase.table("user_follows").select("id").eq("follower_id", current_user["id"]).eq("following_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Check if user is blocked
    blocked = supabase.table("user_blocks").select("id").eq("blocker_id", user_id).eq("blocked_id", current_user["id"]).execute()
    if blocked.data:
        raise HTTPException(status_code=403, detail="Cannot follow this user")
    
    try:
        supabase.table("user_follows").insert({
            "follower_id": current_user["id"],
            "following_id": user_id
        }).execute()
        
        return {"message": "Successfully followed user", "following": True}
        
    except Exception as e:
        logger.error(f"Error following user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to follow user")


@router.delete("/{user_id}/follow")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Unfollow a user.
    """
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot unfollow yourself")
    
    supabase = get_supabase()
    
    try:
        result = supabase.table("user_follows").delete().eq("follower_id", current_user["id"]).eq("following_id", user_id).execute()
        
        return {"message": "Successfully unfollowed user", "following": False}
        
    except Exception as e:
        logger.error(f"Error unfollowing user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unfollow user")


@router.get("/{user_id}/followers", response_model=PaginatedUserList)
async def get_followers(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get user's followers list.
    """
    supabase = get_supabase()
    
    offset = (page - 1) * limit
    
    try:
        # Get total count
        count_response = supabase.table("user_follows").select("id", count="exact").eq("following_id", user_id).execute()
        total = count_response.count or 0
        
        # Get followers with pagination
        followers_response = supabase.table("user_follows").select("follower_id").eq("following_id", user_id).range(offset, offset + limit - 1).execute()
        
        users = []
        for follow in followers_response.data:
            user_response = supabase.table("users").select("*").eq("id", follow["follower_id"]).execute()
            if user_response.data:
                user_data = user_response.data[0]
                profile_photo_url = get_profile_photo_url(supabase, user_data)
                
                is_following = None
                if current_user:
                    is_following = check_is_following(supabase, current_user["id"], user_data["id"])
                
                users.append(UserListItem(
                    id=user_data["id"],
                    username=user_data["username"],
                    full_name=user_data.get("full_name"),
                    profile_photo_url=profile_photo_url,
                    is_verified=user_data.get("is_verified", False),
                    is_following=is_following
                ))
        
        return PaginatedUserList(
            users=users,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting followers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get followers")


@router.get("/{user_id}/following", response_model=PaginatedUserList)
async def get_following(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get user's following list.
    """
    supabase = get_supabase()
    
    offset = (page - 1) * limit
    
    try:
        # Get total count
        count_response = supabase.table("user_follows").select("id", count="exact").eq("follower_id", user_id).execute()
        total = count_response.count or 0
        
        # Get following with pagination
        following_response = supabase.table("user_follows").select("following_id").eq("follower_id", user_id).range(offset, offset + limit - 1).execute()
        
        users = []
        for follow in following_response.data:
            user_response = supabase.table("users").select("*").eq("id", follow["following_id"]).execute()
            if user_response.data:
                user_data = user_response.data[0]
                profile_photo_url = get_profile_photo_url(supabase, user_data)
                
                is_following = None
                if current_user:
                    is_following = check_is_following(supabase, current_user["id"], user_data["id"])
                
                users.append(UserListItem(
                    id=user_data["id"],
                    username=user_data["username"],
                    full_name=user_data.get("full_name"),
                    profile_photo_url=profile_photo_url,
                    is_verified=user_data.get("is_verified", False),
                    is_following=is_following
                ))
        
        return PaginatedUserList(
            users=users,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting following: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get following")


@router.get("/{user_id}/is-following")
async def check_following_status(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Check if current user follows target user.
    """
    supabase = get_supabase()
    is_following = check_is_following(supabase, current_user["id"], user_id)
    return {"is_following": is_following}


@router.post("/{user_id}/block")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Block a user.
    """
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")
    
    supabase = get_supabase()
    
    # Check if target user exists
    target_user = supabase.table("users").select("id").eq("id", user_id).execute()
    if not target_user.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already blocked
    existing = supabase.table("user_blocks").select("id").eq("blocker_id", current_user["id"]).eq("blocked_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already blocked")
    
    try:
        # Block the user
        supabase.table("user_blocks").insert({
            "blocker_id": current_user["id"],
            "blocked_id": user_id
        }).execute()
        
        # Also unfollow them (both directions)
        supabase.table("user_follows").delete().eq("follower_id", current_user["id"]).eq("following_id", user_id).execute()
        supabase.table("user_follows").delete().eq("follower_id", user_id).eq("following_id", current_user["id"]).execute()
        
        return {"message": "User blocked successfully"}
        
    except Exception as e:
        logger.error(f"Error blocking user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to block user")


@router.delete("/{user_id}/block")
async def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Unblock a user.
    """
    supabase = get_supabase()
    
    try:
        supabase.table("user_blocks").delete().eq("blocker_id", current_user["id"]).eq("blocked_id", user_id).execute()
        
        return {"message": "User unblocked successfully"}
        
    except Exception as e:
        logger.error(f"Error unblocking user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unblock user")
