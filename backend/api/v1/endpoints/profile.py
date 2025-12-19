from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from core.security import get_current_user
from db.supabase import get_supabase
from core.storage import StorageConfig
import uuid

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = Field(None, min_length=3, max_length=30, pattern="^[a-zA-Z0-9._-]+$")
    dob: Optional[date] = None
    bio: Optional[str] = Field(None, max_length=150)
    website_url: Optional[str] = None
    is_public: Optional[bool] = None

class ProfileResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    dob: Optional[date]
    profile_photo_url: Optional[str]
    plan: str
    credits: int
    created_at: str
    # New fields
    bio: Optional[str] = None
    website_url: Optional[str] = None
    is_public: bool = True
    is_verified: bool = False
    followers_count: int = 0
    following_count: int = 0
    thumbnails_count: int = 0

@router.get("/", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """
    Retrieve the authenticated user's profile information.
    """
    supabase = get_supabase()
    
    # Fetch latest user data to ensure we have up-to-date info
    response = supabase.table("users").select("*").eq("id", user["id"]).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = response.data[0]
    
    # Get profile photo URL if exists
    profile_photo_url = None
    if user_data.get("profile_photo_asset_id"):
        asset_res = supabase.table("assets").select("storage_path").eq("id", user_data["profile_photo_asset_id"]).execute()
        if asset_res.data:
            path = asset_res.data[0]["storage_path"]
            try:
                profile_photo_url = supabase.storage.from_(StorageConfig.PROFILE_PHOTOS_BUCKET).get_public_url(path)
            except:
                pass

    # Get follow counts
    followers_count = 0
    following_count = 0
    try:
        followers_res = supabase.table("user_follows").select("id", count="exact").eq("following_id", user["id"]).execute()
        followers_count = followers_res.count or 0
        following_res = supabase.table("user_follows").select("id", count="exact").eq("follower_id", user["id"]).execute()
        following_count = following_res.count or 0
    except:
        pass
    
    # Get thumbnails count (public projects)
    thumbnails_count = 0
    try:
        projects_res = supabase.table("projects").select("id", count="exact").eq("user_id", user["id"]).execute()
        thumbnails_count = projects_res.count or 0
    except:
        pass

    return {
        "id": user_data["id"],
        "email": user_data["email"],
        "username": user_data["username"],
        "full_name": user_data.get("full_name"),
        "dob": user_data.get("dob"),
        "profile_photo_url": profile_photo_url,
        "plan": user_data.get("plan", "free"),
        "credits": user_data.get("credits", 0),
        "created_at": user_data["created_at"],
        "bio": user_data.get("bio"),
        "website_url": user_data.get("website_url"),
        "is_public": user_data.get("is_public", True),
        "is_verified": user_data.get("is_verified", False),
        "followers_count": followers_count,
        "following_count": following_count,
        "thumbnails_count": thumbnails_count
    }

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Update the authenticated user's profile information.
    """
    supabase = get_supabase()
    
    # Check username uniqueness if updating
    if profile_update.username and profile_update.username != user["username"]:
        existing = supabase.table("users").select("id").eq("username", profile_update.username).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Username already taken")
    
    # Prepare update data
    update_data = {}
    if profile_update.full_name is not None:
        update_data["full_name"] = profile_update.full_name
    if profile_update.username is not None:
        update_data["username"] = profile_update.username
    if profile_update.dob is not None:
        update_data["dob"] = profile_update.dob.isoformat() if profile_update.dob else None
    if profile_update.bio is not None:
        update_data["bio"] = profile_update.bio
    if profile_update.website_url is not None:
        update_data["website_url"] = profile_update.website_url
    if profile_update.is_public is not None:
        update_data["is_public"] = profile_update.is_public
    
    if update_data:
        try:
            response = supabase.table("users").update(update_data).eq("id", user["id"]).execute()
            updated_user = response.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")
    else:
        # Just fetch current data if no updates
        response = supabase.table("users").select("*").eq("id", user["id"]).execute()
        updated_user = response.data[0]
    
    # Get profile photo URL if exists
    profile_photo_url = None
    if updated_user.get("profile_photo_asset_id"):
        asset_res = supabase.table("assets").select("storage_path").eq("id", updated_user["profile_photo_asset_id"]).execute()
        if asset_res.data:
            path = asset_res.data[0]["storage_path"]
            try:
                profile_photo_url = supabase.storage.from_(StorageConfig.PROFILE_PHOTOS_BUCKET).get_public_url(path)
            except:
                pass
    
    # Get follow counts
    followers_count = 0
    following_count = 0
    try:
        followers_res = supabase.table("user_follows").select("id", count="exact").eq("following_id", user["id"]).execute()
        followers_count = followers_res.count or 0
        following_res = supabase.table("user_follows").select("id", count="exact").eq("follower_id", user["id"]).execute()
        following_count = following_res.count or 0
    except:
        pass
    
    # Get thumbnails count
    thumbnails_count = 0
    try:
        projects_res = supabase.table("projects").select("id", count="exact").eq("user_id", user["id"]).execute()
        thumbnails_count = projects_res.count or 0
    except:
        pass
    
    return {
        "id": updated_user["id"],
        "email": updated_user["email"],
        "username": updated_user["username"],
        "full_name": updated_user.get("full_name"),
        "dob": updated_user.get("dob"),
        "profile_photo_url": profile_photo_url,
        "plan": updated_user.get("plan", "free"),
        "credits": updated_user.get("credits", 0),
        "created_at": updated_user["created_at"],
        "bio": updated_user.get("bio"),
        "website_url": updated_user.get("website_url"),
        "is_public": updated_user.get("is_public", True),
        "is_verified": updated_user.get("is_verified", False),
        "followers_count": followers_count,
        "following_count": following_count,
        "thumbnails_count": thumbnails_count
    }

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(user: dict = Depends(get_current_user)):
    """
    Delete the authenticated user's account.
    """
    supabase = get_supabase()
    
    try:
        # We might want to soft delete or just delete. 
        # Given requirements say "Delete", we'll attempt hard delete.
        # Note: This might fail if there are foreign key constraints without cascade.
        # Ideally, we should clean up assets first or rely on DB cascade.
        
        supabase.table("users").delete().eq("id", user["id"]).execute()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Upload a profile picture image for the user.
    """
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and GIF allowed.")
        
    # Validate file size (approximate, read chunks or check header if possible, but for now read content)
    # 5MB limit
    MAX_SIZE = 5 * 1024 * 1024
    content = await file.read()
    
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")
        
    supabase = get_supabase()
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_path = f"{user['id']}/avatar_{uuid.uuid4()}.{file_ext}"
    
    try:
        # Upload to Supabase Storage using centralized configuration
        supabase.storage.from_(StorageConfig.PROFILE_PHOTOS_BUCKET).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # Create Asset Record
        asset_data = {
            "user_id": user["id"],
            "type": "profile_photo",
            "storage_path": file_path,
            "width": 0, # We could use PIL to get dimensions if needed
            "height": 0,
            "md5": "" # Calculate if needed
        }
        
        asset_res = supabase.table("assets").insert(asset_data).execute()
        asset_id = asset_res.data[0]["id"]
        
        # Update User Profile
        supabase.table("users").update({"profile_photo_asset_id": asset_id}).eq("id", user["id"]).execute()
        
        return {"message": "Avatar uploaded successfully", "url": supabase.storage.from_(StorageConfig.PROFILE_PHOTOS_BUCKET).get_public_url(file_path)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/avatar")
async def delete_avatar(user: dict = Depends(get_current_user)):
    """
    Remove the user's profile picture.
    """
    supabase = get_supabase()
    
    if not user.get("profile_photo_asset_id"):
        raise HTTPException(status_code=404, detail="No avatar to delete")
        
    try:
        # Get asset to find path
        asset_res = supabase.table("assets").select("*").eq("id", user["profile_photo_asset_id"]).execute()
        if asset_res.data:
            path = asset_res.data[0]["storage_path"]
            
            # Remove from storage using centralized configuration
            supabase.storage.from_(StorageConfig.PROFILE_PHOTOS_BUCKET).remove([path])
            
            # Remove asset record (optional, or keep for history)
            supabase.table("assets").delete().eq("id", user["profile_photo_asset_id"]).execute()
            
        # Update user
        supabase.table("users").update({"profile_photo_asset_id": None}).eq("id", user["id"]).execute()
        
        return {"message": "Avatar removed successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))