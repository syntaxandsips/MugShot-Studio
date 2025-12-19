"""
Referral system endpoint for MugShot Studio API.

Handles referral codes, application, and rewards.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from core.security import get_current_user
from db.supabase import get_supabase
import logging
import random
import string

logger = logging.getLogger(__name__)

router = APIRouter()


class ReferralCodeResponse(BaseModel):
    """Referral code response model."""
    code: str
    uses_count: int = 0
    max_uses: Optional[int] = None
    reward_credits: int = 50
    created_at: datetime


class ReferralStatsResponse(BaseModel):
    """Referral statistics response model."""
    code: str
    total_referrals: int = 0
    total_credits_earned: int = 0
    pending_rewards: int = 0


class ReferralRewardItem(BaseModel):
    """Referral reward history item."""
    id: str
    referred_username: Optional[str] = None
    credits_earned: int
    created_at: datetime


class ReferralRewardsResponse(BaseModel):
    """Referral rewards history response."""
    rewards: List[ReferralRewardItem]
    total_earned: int


def generate_referral_code(length: int = 8) -> str:
    """Generate a unique referral code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))


@router.get("/code", response_model=ReferralCodeResponse)
async def get_referral_code(current_user: dict = Depends(get_current_user)):
    """
    Get or create user's referral code.
    """
    supabase = get_supabase()
    
    try:
        # Check if user already has a referral code
        response = supabase.table("referral_codes").select("*").eq("user_id", current_user["id"]).execute()
        
        if response.data:
            code_data = response.data[0]
            return ReferralCodeResponse(
                code=code_data["code"],
                uses_count=code_data.get("uses_count", 0),
                max_uses=code_data.get("max_uses"),
                reward_credits=code_data.get("reward_credits", 50),
                created_at=code_data["created_at"]
            )
        
        # Generate a new unique code
        max_attempts = 10
        for _ in range(max_attempts):
            code = generate_referral_code()
            
            # Check if code already exists
            existing = supabase.table("referral_codes").select("id").eq("code", code).execute()
            if not existing.data:
                break
        else:
            raise HTTPException(status_code=500, detail="Failed to generate unique referral code")
        
        # Create new referral code
        code_data = {
            "user_id": current_user["id"],
            "code": code,
            "uses_count": 0,
            "reward_credits": 50
        }
        
        insert_response = supabase.table("referral_codes").insert(code_data).execute()
        
        if insert_response.data:
            created = insert_response.data[0]
            return ReferralCodeResponse(
                code=created["code"],
                uses_count=0,
                max_uses=None,
                reward_credits=50,
                created_at=created["created_at"]
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create referral code")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting/creating referral code: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get referral code")


@router.post("/apply")
async def apply_referral_code(
    code: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Apply a referral code (during signup or first use).
    Rewards both the referrer and the referred user.
    """
    supabase = get_supabase()
    
    # Normalize code
    code = code.strip().upper()
    
    try:
        # Check if code exists
        code_response = supabase.table("referral_codes").select("*").eq("code", code).execute()
        
        if not code_response.data:
            raise HTTPException(status_code=404, detail="Referral code not found")
        
        code_data = code_response.data[0]
        
        # Check if user is trying to use their own code
        if code_data["user_id"] == current_user["id"]:
            raise HTTPException(status_code=400, detail="You cannot use your own referral code")
        
        # Check if max uses reached
        if code_data.get("max_uses") and code_data.get("uses_count", 0) >= code_data["max_uses"]:
            raise HTTPException(status_code=400, detail="This referral code has reached its maximum uses")
        
        # Check if user already used a referral code
        existing_use = supabase.table("referral_uses").select("id").eq("referred_user_id", current_user["id"]).execute()
        if existing_use.data:
            raise HTTPException(status_code=400, detail="You have already used a referral code")
        
        reward_credits = code_data.get("reward_credits", 50)
        
        # Apply the referral
        supabase.table("referral_uses").insert({
            "code_id": code_data["id"],
            "referred_user_id": current_user["id"],
            "reward_given": True
        }).execute()
        
        # Update uses count
        supabase.table("referral_codes").update({
            "uses_count": code_data.get("uses_count", 0) + 1
        }).eq("id", code_data["id"]).execute()
        
        # Give credits to referred user (current user)
        supabase.table("users").update({
            "credits": current_user.get("credits", 0) + reward_credits
        }).eq("id", current_user["id"]).execute()
        
        # Give credits to referrer
        referrer_response = supabase.table("users").select("credits").eq("id", code_data["user_id"]).execute()
        if referrer_response.data:
            referrer_credits = referrer_response.data[0].get("credits", 0)
            supabase.table("users").update({
                "credits": referrer_credits + reward_credits
            }).eq("id", code_data["user_id"]).execute()
        
        # Add audit log
        supabase.table("audit").insert({
            "user_id": current_user["id"],
            "action": "referral_applied",
            "delta_credits": reward_credits,
            "meta": {"code": code, "referrer_id": code_data["user_id"]}
        }).execute()
        
        return {
            "message": f"Referral code applied successfully! You received {reward_credits} credits.",
            "credits_received": reward_credits
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying referral code: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to apply referral code")


@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(current_user: dict = Depends(get_current_user)):
    """
    Get referral statistics.
    """
    supabase = get_supabase()
    
    try:
        # Get user's referral code
        code_response = supabase.table("referral_codes").select("*").eq("user_id", current_user["id"]).execute()
        
        if not code_response.data:
            # No referral code yet
            return ReferralStatsResponse(
                code="",
                total_referrals=0,
                total_credits_earned=0,
                pending_rewards=0
            )
        
        code_data = code_response.data[0]
        
        # Get referral uses
        uses_response = supabase.table("referral_uses").select("*").eq("code_id", code_data["id"]).execute()
        
        total_referrals = len(uses_response.data) if uses_response.data else 0
        reward_per_referral = code_data.get("reward_credits", 50)
        
        # Count completed rewards
        completed_rewards = sum(1 for use in (uses_response.data or []) if use.get("reward_given"))
        pending_rewards = total_referrals - completed_rewards
        
        return ReferralStatsResponse(
            code=code_data["code"],
            total_referrals=total_referrals,
            total_credits_earned=completed_rewards * reward_per_referral,
            pending_rewards=pending_rewards
        )
        
    except Exception as e:
        logger.error(f"Error getting referral stats: {str(e)}")
        return ReferralStatsResponse(
            code="",
            total_referrals=0,
            total_credits_earned=0,
            pending_rewards=0
        )


@router.get("/rewards", response_model=ReferralRewardsResponse)
async def get_referral_rewards(current_user: dict = Depends(get_current_user)):
    """
    Get referral rewards history.
    """
    supabase = get_supabase()
    
    try:
        # Get user's referral code
        code_response = supabase.table("referral_codes").select("*").eq("user_id", current_user["id"]).execute()
        
        if not code_response.data:
            return ReferralRewardsResponse(rewards=[], total_earned=0)
        
        code_data = code_response.data[0]
        reward_per_referral = code_data.get("reward_credits", 50)
        
        # Get referral uses with user info
        uses_response = supabase.table("referral_uses").select("*").eq("code_id", code_data["id"]).eq("reward_given", True).order("created_at", desc=True).execute()
        
        rewards = []
        total_earned = 0
        
        for use in (uses_response.data or []):
            # Get referred user's username
            referred_user = supabase.table("users").select("username").eq("id", use["referred_user_id"]).execute()
            username = referred_user.data[0]["username"] if referred_user.data else None
            
            rewards.append(ReferralRewardItem(
                id=use["id"],
                referred_username=username,
                credits_earned=reward_per_referral,
                created_at=use["created_at"]
            ))
            total_earned += reward_per_referral
        
        return ReferralRewardsResponse(
            rewards=rewards,
            total_earned=total_earned
        )
        
    except Exception as e:
        logger.error(f"Error getting referral rewards: {str(e)}")
        return ReferralRewardsResponse(rewards=[], total_earned=0)
