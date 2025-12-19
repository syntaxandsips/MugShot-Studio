"""
Billing endpoint for MugShot Studio API.

Handles subscription plans, billing history, and payment management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from core.security import get_current_user
from db.supabase import get_supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class PlanFeature(BaseModel):
    """A single plan feature."""
    name: str
    included: bool = True


class PlanResponse(BaseModel):
    """Subscription plan response model."""
    id: str
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: float
    credits_per_month: int
    features: List[str] = []
    is_active: bool = True
    display_order: int = 0


class SubscriptionResponse(BaseModel):
    """User subscription response model."""
    plan_id: str
    plan_name: str
    status: str  # 'active', 'canceled', 'expired', 'past_due'
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    credits_remaining: int = 0
    credits_per_month: int = 0


class BillingHistoryItem(BaseModel):
    """Billing history item model."""
    id: str
    amount: float
    currency: str = "USD"
    description: Optional[str] = None
    invoice_url: Optional[str] = None
    status: str  # 'paid', 'pending', 'failed'
    created_at: datetime


class PaginatedBillingHistory(BaseModel):
    """Paginated billing history response."""
    items: List[BillingHistoryItem]
    total: int
    page: int
    limit: int
    has_more: bool


@router.get("/plans", response_model=List[PlanResponse])
async def get_plans():
    """
    Get all available subscription plans.
    """
    supabase = get_supabase()
    
    try:
        response = supabase.table("subscription_plans").select("*").eq("is_active", True).order("display_order").execute()
        
        plans = []
        for plan in response.data:
            features = plan.get("features", [])
            if isinstance(features, str):
                import json
                try:
                    features = json.loads(features)
                except:
                    features = []
            
            plans.append(PlanResponse(
                id=plan["id"],
                name=plan["name"],
                description=plan.get("description"),
                price_monthly=float(plan.get("price_monthly", 0)),
                price_yearly=float(plan.get("price_yearly", 0)),
                credits_per_month=plan.get("credits_per_month", 0),
                features=features,
                is_active=plan.get("is_active", True),
                display_order=plan.get("display_order", 0)
            ))
        
        return plans
        
    except Exception as e:
        logger.error(f"Error getting plans: {str(e)}")
        # Return default plans if table doesn't exist
        return [
            PlanResponse(
                id="free",
                name="Free",
                description="Get started with basic features",
                price_monthly=0,
                price_yearly=0,
                credits_per_month=100,
                features=["100 credits/month", "Standard quality", "Community support"],
                is_active=True,
                display_order=0
            ),
            PlanResponse(
                id="pro",
                name="Pro",
                description="For creators who need more power",
                price_monthly=9.99,
                price_yearly=99.99,
                credits_per_month=500,
                features=["500 credits/month", "HD quality", "Priority support", "No watermark"],
                is_active=True,
                display_order=1
            ),
            PlanResponse(
                id="enterprise",
                name="Enterprise",
                description="For teams and businesses",
                price_monthly=29.99,
                price_yearly=299.99,
                credits_per_month=2000,
                features=["2000 credits/month", "4K quality", "Dedicated support", "API access", "Custom models"],
                is_active=True,
                display_order=2
            )
        ]


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """
    Get user's current subscription details.
    """
    supabase = get_supabase()
    
    try:
        # Get user's subscription
        sub_response = supabase.table("user_subscriptions").select("*").eq("user_id", current_user["id"]).execute()
        
        if sub_response.data:
            sub = sub_response.data[0]
            
            # Get plan details
            plan_response = supabase.table("subscription_plans").select("*").eq("id", sub["plan_id"]).execute()
            plan = plan_response.data[0] if plan_response.data else {"name": "Unknown", "credits_per_month": 0}
            
            return SubscriptionResponse(
                plan_id=sub["plan_id"],
                plan_name=plan["name"],
                status=sub.get("status", "active"),
                current_period_start=sub.get("current_period_start"),
                current_period_end=sub.get("current_period_end"),
                cancel_at_period_end=sub.get("cancel_at_period_end", False),
                credits_remaining=current_user.get("credits", 0),
                credits_per_month=plan.get("credits_per_month", 0)
            )
        else:
            # User has no subscription, return free tier info
            return SubscriptionResponse(
                plan_id="free",
                plan_name="Free",
                status="active",
                credits_remaining=current_user.get("credits", 0),
                credits_per_month=100
            )
            
    except Exception as e:
        logger.error(f"Error getting subscription: {str(e)}")
        # Return free tier if error
        return SubscriptionResponse(
            plan_id="free",
            plan_name="Free",
            status="active",
            credits_remaining=current_user.get("credits", 0),
            credits_per_month=100
        )


@router.get("/history", response_model=PaginatedBillingHistory)
async def get_billing_history(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get user's billing history.
    """
    supabase = get_supabase()
    
    offset = (page - 1) * limit
    
    try:
        # Get total count
        count_response = supabase.table("billing_history").select("id", count="exact").eq("user_id", current_user["id"]).execute()
        total = count_response.count or 0
        
        # Get billing history with pagination
        response = supabase.table("billing_history").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        items = []
        for item in response.data:
            items.append(BillingHistoryItem(
                id=item["id"],
                amount=float(item.get("amount", 0)),
                currency=item.get("currency", "USD"),
                description=item.get("description"),
                invoice_url=item.get("invoice_url"),
                status=item.get("status", "paid"),
                created_at=item["created_at"]
            ))
        
        return PaginatedBillingHistory(
            items=items,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting billing history: {str(e)}")
        return PaginatedBillingHistory(
            items=[],
            total=0,
            page=page,
            limit=limit,
            has_more=False
        )


@router.post("/subscribe")
async def subscribe(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Subscribe to a plan.
    Note: This is a placeholder. In production, integrate with Stripe or another payment provider.
    """
    supabase = get_supabase()
    
    # Verify plan exists
    plan_response = supabase.table("subscription_plans").select("*").eq("id", plan_id).eq("is_active", True).execute()
    if not plan_response.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan = plan_response.data[0]
    
    try:
        # Check if user already has a subscription
        existing = supabase.table("user_subscriptions").select("id").eq("user_id", current_user["id"]).execute()
        
        from datetime import timedelta
        now = datetime.utcnow()
        period_end = now + timedelta(days=30)
        
        subscription_data = {
            "user_id": current_user["id"],
            "plan_id": plan_id,
            "status": "active",
            "current_period_start": now.isoformat(),
            "current_period_end": period_end.isoformat(),
            "cancel_at_period_end": False
        }
        
        if existing.data:
            # Update existing subscription
            supabase.table("user_subscriptions").update(subscription_data).eq("user_id", current_user["id"]).execute()
        else:
            # Create new subscription
            supabase.table("user_subscriptions").insert(subscription_data).execute()
        
        # Update user's plan in users table
        supabase.table("users").update({"plan": plan_id}).eq("id", current_user["id"]).execute()
        
        # Add billing history entry (for non-free plans)
        if float(plan.get("price_monthly", 0)) > 0:
            supabase.table("billing_history").insert({
                "user_id": current_user["id"],
                "amount": float(plan.get("price_monthly", 0)),
                "currency": "USD",
                "description": f"Subscription to {plan['name']} plan",
                "status": "paid"
            }).execute()
        
        return {
            "message": f"Successfully subscribed to {plan['name']} plan",
            "plan_id": plan_id,
            "status": "active"
        }
        
    except Exception as e:
        logger.error(f"Error subscribing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to subscribe to plan")


@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """
    Cancel subscription at end of billing period.
    """
    supabase = get_supabase()
    
    try:
        # Get current subscription
        sub_response = supabase.table("user_subscriptions").select("*").eq("user_id", current_user["id"]).execute()
        
        if not sub_response.data:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        sub = sub_response.data[0]
        
        if sub.get("plan_id") == "free":
            raise HTTPException(status_code=400, detail="Cannot cancel free plan")
        
        # Mark subscription to cancel at period end
        supabase.table("user_subscriptions").update({
            "cancel_at_period_end": True
        }).eq("user_id", current_user["id"]).execute()
        
        return {
            "message": "Subscription will be cancelled at the end of the billing period",
            "cancel_at": sub.get("current_period_end")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")
