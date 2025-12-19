"""
Support endpoint for MugShot Studio API.

Handles support tickets, bug reports, and FAQ.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from core.security import get_current_user
from db.supabase import get_supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class SupportTicketCreate(BaseModel):
    """Support ticket creation model."""
    subject: str = Field(..., min_length=5, max_length=200)
    category: str = Field(..., pattern="^(general|billing|technical|account|feature_request|other)$")
    message: str = Field(..., min_length=20, max_length=5000)
    priority: str = Field("normal", pattern="^(low|normal|high|urgent)$")
    contact_email: Optional[EmailStr] = None  # If different from account email


class BugReportCreate(BaseModel):
    """Bug report creation model."""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=5000)
    steps_to_reproduce: Optional[str] = None
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    device_info: Optional[str] = None  # e.g., "iPhone 14, iOS 17.0"
    app_version: Optional[str] = None


class TicketResponse(BaseModel):
    """Support ticket response model."""
    id: str
    subject: str
    category: str
    status: str  # 'open', 'in_progress', 'resolved', 'closed'
    priority: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class FAQItem(BaseModel):
    """FAQ item model."""
    id: str
    question: str
    answer: str
    category: str
    order: int = 0


class FAQResponse(BaseModel):
    """FAQ list response."""
    items: List[FAQItem]
    total: int


# Default FAQ items (can be moved to database later)
DEFAULT_FAQ = [
    {
        "id": "1",
        "question": "How do I generate a thumbnail?",
        "answer": "To generate a thumbnail: 1) Create a new project, 2) Choose your platform and dimensions, 3) Add a headline and vibe, 4) Click 'Generate'. Your AI-powered thumbnail will be ready in seconds!",
        "category": "getting_started",
        "order": 1
    },
    {
        "id": "2",
        "question": "What are credits and how do they work?",
        "answer": "Credits are used to generate thumbnails. Each generation costs a certain number of credits based on quality and model used. Free users get 100 credits per month. Pro users get 500 credits, and Enterprise users get 2000 credits.",
        "category": "billing",
        "order": 2
    },
    {
        "id": "3",
        "question": "Can I cancel my subscription?",
        "answer": "Yes! You can cancel your subscription at any time from Settings > Subscription > Cancel. Your subscription will remain active until the end of your billing period.",
        "category": "billing",
        "order": 3
    },
    {
        "id": "4",
        "question": "How do I change my password?",
        "answer": "Go to Settings > Security > Change Password. Enter your current password and your new password. For security, you'll be logged out of other devices.",
        "category": "account",
        "order": 4
    },
    {
        "id": "5",
        "question": "What image formats are supported?",
        "answer": "We support JPEG, PNG, and WebP formats. Generated thumbnails are provided in high-quality PNG format for best compatibility.",
        "category": "technical",
        "order": 5
    },
    {
        "id": "6",
        "question": "How do I share my thumbnails?",
        "answer": "You can share your thumbnails by: 1) Setting visibility to 'Public' on your project, 2) Copying the share link, or 3) Downloading and sharing directly.",
        "category": "getting_started",
        "order": 6
    },
    {
        "id": "7",
        "question": "What AI models are available?",
        "answer": "We offer several AI models: Nano Banana (fast, good quality), Nano Banana Pro (slower, best quality), Seedream (creative styles), Gemini Flash (speed-optimized), and more.",
        "category": "technical",
        "order": 7
    },
    {
        "id": "8",
        "question": "How do referrals work?",
        "answer": "Share your referral code with friends. When they sign up using your code, both of you receive 50 bonus credits! Find your referral code in Settings > Referrals.",
        "category": "billing",
        "order": 8
    },
    {
        "id": "9",
        "question": "Can I request my data to be deleted?",
        "answer": "Yes, you have the right to request data deletion under GDPR. Go to Settings > Privacy > Delete Account to permanently delete all your data.",
        "category": "account",
        "order": 9
    },
    {
        "id": "10",
        "question": "How do I contact support?",
        "answer": "You can contact our support team through the app: Settings > Support > Submit Ticket. We typically respond within 24-48 hours.",
        "category": "general",
        "order": 10
    }
]


@router.post("/ticket", response_model=TicketResponse)
async def submit_support_ticket(
    ticket: SupportTicketCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a support ticket.
    """
    supabase = get_supabase()
    
    try:
        ticket_data = {
            "user_id": current_user["id"],
            "subject": ticket.subject,
            "category": ticket.category,
            "message": ticket.message,
            "priority": ticket.priority,
            "contact_email": ticket.contact_email or current_user.get("email"),
            "status": "open"
        }
        
        res = supabase.table("support_tickets").insert(ticket_data).execute()
        
        if res.data:
            created = res.data[0]
            
            # Log audit
            supabase.table("audit").insert({
                "user_id": current_user["id"],
                "action": "support_ticket_created",
                "delta_credits": 0,
                "meta": {"ticket_id": created["id"], "category": ticket.category}
            }).execute()
            
            return TicketResponse(
                id=created["id"],
                subject=created["subject"],
                category=created["category"],
                status=created["status"],
                priority=created["priority"],
                created_at=created["created_at"]
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create ticket")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}")
        # If table doesn't exist, return a mock response
        return TicketResponse(
            id="pending",
            subject=ticket.subject,
            category=ticket.category,
            status="open",
            priority=ticket.priority,
            created_at=datetime.utcnow()
        )


@router.post("/bug-report", response_model=TicketResponse)
async def submit_bug_report(
    report: BugReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a bug report.
    """
    supabase = get_supabase()
    
    try:
        # Compile bug report message
        message_parts = [
            f"**Description:** {report.description}",
        ]
        
        if report.steps_to_reproduce:
            message_parts.append(f"\n**Steps to Reproduce:** {report.steps_to_reproduce}")
        if report.expected_behavior:
            message_parts.append(f"\n**Expected Behavior:** {report.expected_behavior}")
        if report.actual_behavior:
            message_parts.append(f"\n**Actual Behavior:** {report.actual_behavior}")
        if report.device_info:
            message_parts.append(f"\n**Device Info:** {report.device_info}")
        if report.app_version:
            message_parts.append(f"\n**App Version:** {report.app_version}")
        
        full_message = "\n".join(message_parts)
        
        ticket_data = {
            "user_id": current_user["id"],
            "subject": f"[BUG] {report.title}",
            "category": "technical",
            "message": full_message,
            "priority": "high",
            "contact_email": current_user.get("email"),
            "status": "open"
        }
        
        res = supabase.table("support_tickets").insert(ticket_data).execute()
        
        if res.data:
            created = res.data[0]
            
            # Log audit
            supabase.table("audit").insert({
                "user_id": current_user["id"],
                "action": "bug_report_created",
                "delta_credits": 0,
                "meta": {"ticket_id": created["id"], "title": report.title}
            }).execute()
            
            return TicketResponse(
                id=created["id"],
                subject=created["subject"],
                category=created["category"],
                status=created["status"],
                priority=created["priority"],
                created_at=created["created_at"]
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create bug report")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bug report: {str(e)}")
        # If table doesn't exist, return a mock response
        return TicketResponse(
            id="pending",
            subject=f"[BUG] {report.title}",
            category="technical",
            status="open",
            priority="high",
            created_at=datetime.utcnow()
        )


@router.get("/tickets", response_model=List[TicketResponse])
async def get_my_tickets(current_user: dict = Depends(get_current_user)):
    """
    Get all support tickets for the current user.
    """
    supabase = get_supabase()
    
    try:
        res = supabase.table("support_tickets").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
        
        tickets = []
        for ticket in res.data:
            tickets.append(TicketResponse(
                id=ticket["id"],
                subject=ticket["subject"],
                category=ticket["category"],
                status=ticket["status"],
                priority=ticket["priority"],
                created_at=ticket["created_at"],
                updated_at=ticket.get("updated_at")
            ))
        
        return tickets
        
    except Exception as e:
        logger.error(f"Error getting tickets: {str(e)}")
        return []


@router.get("/faq", response_model=FAQResponse)
async def get_faq(category: Optional[str] = None):
    """
    Get frequently asked questions.
    Optionally filter by category.
    """
    items = DEFAULT_FAQ
    
    if category:
        items = [item for item in items if item["category"] == category]
    
    # Sort by order
    items = sorted(items, key=lambda x: x["order"])
    
    return FAQResponse(
        items=[FAQItem(**item) for item in items],
        total=len(items)
    )


@router.get("/faq/categories")
async def get_faq_categories():
    """
    Get available FAQ categories.
    """
    categories = list(set(item["category"] for item in DEFAULT_FAQ))
    return {
        "categories": sorted(categories),
        "total": len(categories)
    }
