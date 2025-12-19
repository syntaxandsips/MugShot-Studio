"""
User Preferences endpoint for MugShot Studio API.

Handles user preferences CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from core.security import get_current_user
from db.supabase import get_supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class UserPreferencesResponse(BaseModel):
    """Response model for user preferences."""
    # Appearance
    dark_mode: bool = False
    language: str = "en-US"
    font_size: int = 16
    high_contrast: bool = False
    
    # Generation Settings
    hd_generation: bool = True
    default_ai_model: str = "nano_banana"
    generation_variants: int = 4
    nsfw_filter: bool = True
    watermark: bool = False
    offline_mode: bool = False
    
    # Notifications
    job_complete_notify: bool = True
    low_credit_notify: bool = True
    updates_notify: bool = True
    newsletter_opt_in: bool = False
    billing_alerts: bool = True
    sound_enabled: bool = True
    vibration_enabled: bool = True
    
    # Privacy
    analytics_sharing: bool = True
    
    # Security
    two_factor_enabled: bool = False
    biometric_enabled: bool = False
    
    # Subscription
    auto_renew: bool = True
    credit_alert_threshold: int = 10


class UserPreferencesUpdate(BaseModel):
    """Update model for user preferences. All fields optional for partial updates."""
    # Appearance
    dark_mode: Optional[bool] = None
    language: Optional[str] = None
    font_size: Optional[int] = Field(None, ge=12, le=20)
    high_contrast: Optional[bool] = None
    
    # Generation Settings
    hd_generation: Optional[bool] = None
    default_ai_model: Optional[str] = None
    generation_variants: Optional[int] = Field(None, ge=2, le=6)
    nsfw_filter: Optional[bool] = None
    watermark: Optional[bool] = None
    offline_mode: Optional[bool] = None
    
    # Notifications
    job_complete_notify: Optional[bool] = None
    low_credit_notify: Optional[bool] = None
    updates_notify: Optional[bool] = None
    newsletter_opt_in: Optional[bool] = None
    billing_alerts: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    vibration_enabled: Optional[bool] = None
    
    # Privacy
    analytics_sharing: Optional[bool] = None
    
    # Security
    two_factor_enabled: Optional[bool] = None
    biometric_enabled: Optional[bool] = None
    
    # Subscription
    auto_renew: Optional[bool] = None
    credit_alert_threshold: Optional[int] = Field(None, ge=5, le=50)


def get_default_preferences() -> dict:
    """Return default preferences as a dictionary."""
    return {
        "dark_mode": False,
        "language": "en-US",
        "font_size": 16,
        "high_contrast": False,
        "hd_generation": True,
        "default_ai_model": "nano_banana",
        "generation_variants": 4,
        "nsfw_filter": True,
        "watermark": False,
        "offline_mode": False,
        "job_complete_notify": True,
        "low_credit_notify": True,
        "updates_notify": True,
        "newsletter_opt_in": False,
        "billing_alerts": True,
        "sound_enabled": True,
        "vibration_enabled": True,
        "analytics_sharing": True,
        "two_factor_enabled": False,
        "biometric_enabled": False,
        "auto_renew": True,
        "credit_alert_threshold": 10
    }


@router.get("/", response_model=UserPreferencesResponse)
async def get_preferences(user: dict = Depends(get_current_user)):
    """
    Get user preferences. Creates default preferences if none exist.
    """
    supabase = get_supabase()
    
    try:
        # Try to fetch existing preferences
        response = supabase.table("user_preferences").select("*").eq("user_id", user["id"]).execute()
        
        if response.data:
            prefs = response.data[0]
            # Return preferences (excluding id, user_id, timestamps)
            return UserPreferencesResponse(
                dark_mode=prefs.get("dark_mode", False),
                language=prefs.get("language", "en-US"),
                font_size=prefs.get("font_size", 16),
                high_contrast=prefs.get("high_contrast", False),
                hd_generation=prefs.get("hd_generation", True),
                default_ai_model=prefs.get("default_ai_model", "nano_banana"),
                generation_variants=prefs.get("generation_variants", 4),
                nsfw_filter=prefs.get("nsfw_filter", True),
                watermark=prefs.get("watermark", False),
                offline_mode=prefs.get("offline_mode", False),
                job_complete_notify=prefs.get("job_complete_notify", True),
                low_credit_notify=prefs.get("low_credit_notify", True),
                updates_notify=prefs.get("updates_notify", True),
                newsletter_opt_in=prefs.get("newsletter_opt_in", False),
                billing_alerts=prefs.get("billing_alerts", True),
                sound_enabled=prefs.get("sound_enabled", True),
                vibration_enabled=prefs.get("vibration_enabled", True),
                analytics_sharing=prefs.get("analytics_sharing", True),
                two_factor_enabled=prefs.get("two_factor_enabled", False),
                biometric_enabled=prefs.get("biometric_enabled", False),
                auto_renew=prefs.get("auto_renew", True),
                credit_alert_threshold=prefs.get("credit_alert_threshold", 10)
            )
        else:
            # Create default preferences for user
            defaults = get_default_preferences()
            defaults["user_id"] = user["id"]
            
            insert_response = supabase.table("user_preferences").insert(defaults).execute()
            
            if insert_response.data:
                return UserPreferencesResponse(**get_default_preferences())
            else:
                # Table might not exist yet, return defaults
                return UserPreferencesResponse(**get_default_preferences())
                
    except Exception as e:
        logger.error(f"Error fetching preferences: {str(e)}")
        # Return defaults if table doesn't exist or other error
        return UserPreferencesResponse(**get_default_preferences())


@router.put("/", response_model=UserPreferencesResponse)
async def update_preferences(
    preferences: UserPreferencesUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Update user preferences (partial update supported).
    """
    supabase = get_supabase()
    
    # Build update dict from non-None values
    update_data = {k: v for k, v in preferences.model_dump().items() if v is not None}
    
    if not update_data:
        # No updates, just return current preferences
        return await get_preferences(user)
    
    try:
        # Check if preferences exist
        existing = supabase.table("user_preferences").select("id").eq("user_id", user["id"]).execute()
        
        if existing.data:
            # Update existing
            response = supabase.table("user_preferences").update(update_data).eq("user_id", user["id"]).execute()
        else:
            # Create new with updates
            defaults = get_default_preferences()
            defaults.update(update_data)
            defaults["user_id"] = user["id"]
            response = supabase.table("user_preferences").insert(defaults).execute()
        
        if response.data:
            prefs = response.data[0]
            return UserPreferencesResponse(
                dark_mode=prefs.get("dark_mode", False),
                language=prefs.get("language", "en-US"),
                font_size=prefs.get("font_size", 16),
                high_contrast=prefs.get("high_contrast", False),
                hd_generation=prefs.get("hd_generation", True),
                default_ai_model=prefs.get("default_ai_model", "nano_banana"),
                generation_variants=prefs.get("generation_variants", 4),
                nsfw_filter=prefs.get("nsfw_filter", True),
                watermark=prefs.get("watermark", False),
                offline_mode=prefs.get("offline_mode", False),
                job_complete_notify=prefs.get("job_complete_notify", True),
                low_credit_notify=prefs.get("low_credit_notify", True),
                updates_notify=prefs.get("updates_notify", True),
                newsletter_opt_in=prefs.get("newsletter_opt_in", False),
                billing_alerts=prefs.get("billing_alerts", True),
                sound_enabled=prefs.get("sound_enabled", True),
                vibration_enabled=prefs.get("vibration_enabled", True),
                analytics_sharing=prefs.get("analytics_sharing", True),
                two_factor_enabled=prefs.get("two_factor_enabled", False),
                biometric_enabled=prefs.get("biometric_enabled", False),
                auto_renew=prefs.get("auto_renew", True),
                credit_alert_threshold=prefs.get("credit_alert_threshold", 10)
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to update preferences")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")


@router.patch("/{key}")
async def update_single_preference(
    key: str,
    value: bool | int | str,
    user: dict = Depends(get_current_user)
):
    """
    Update a single preference value.
    """
    # Validate key is a valid preference field
    valid_keys = list(get_default_preferences().keys())
    if key not in valid_keys:
        raise HTTPException(status_code=400, detail=f"Invalid preference key. Valid keys: {valid_keys}")
    
    supabase = get_supabase()
    
    try:
        # Check if preferences exist
        existing = supabase.table("user_preferences").select("id").eq("user_id", user["id"]).execute()
        
        if existing.data:
            # Update existing
            response = supabase.table("user_preferences").update({key: value}).eq("user_id", user["id"]).execute()
        else:
            # Create new with this update
            defaults = get_default_preferences()
            defaults[key] = value
            defaults["user_id"] = user["id"]
            response = supabase.table("user_preferences").insert(defaults).execute()
        
        return {"message": f"Preference '{key}' updated successfully", "key": key, "value": value}
        
    except Exception as e:
        logger.error(f"Error updating single preference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update preference: {str(e)}")
