"""
Data Export endpoint for MugShot Studio API.

Handles user data export requests for GDPR compliance.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from core.security import get_current_user
from db.supabase import get_supabase
from core.storage import StorageConfig
import logging
import json
import zipfile
import io

logger = logging.getLogger(__name__)

router = APIRouter()


class ExportRequestResponse(BaseModel):
    """Data export request response."""
    request_id: str
    status: str  # 'pending', 'processing', 'ready', 'expired'
    estimated_time_minutes: int = 5
    created_at: datetime


class ExportStatusResponse(BaseModel):
    """Data export status response."""
    request_id: str
    status: str
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


async def process_data_export(request_id: str, user_id: str):
    """
    Background task to process data export.
    Compiles all user data into a JSON file.
    """
    supabase = get_supabase()
    
    try:
        # Update status to processing
        supabase.table("data_export_requests").update({
            "status": "processing"
        }).eq("id", request_id).execute()
        
        # Collect all user data
        export_data = {
            "export_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "data": {}
        }
        
        # User profile
        user_res = supabase.table("users").select("*").eq("id", user_id).execute()
        if user_res.data:
            user_data = user_res.data[0]
            # Remove sensitive fields
            user_data.pop("password_hash", None)
            export_data["data"]["profile"] = user_data
        
        # User preferences
        prefs_res = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
        if prefs_res.data:
            export_data["data"]["preferences"] = prefs_res.data[0]
        
        # Projects
        projects_res = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        export_data["data"]["projects"] = projects_res.data
        
        # Jobs
        if projects_res.data:
            project_ids = [p["id"] for p in projects_res.data]
            for project_id in project_ids:
                jobs_res = supabase.table("jobs").select("*").eq("project_id", project_id).execute()
                if jobs_res.data:
                    if "jobs" not in export_data["data"]:
                        export_data["data"]["jobs"] = []
                    export_data["data"]["jobs"].extend(jobs_res.data)
        
        # Assets
        assets_res = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        export_data["data"]["assets"] = assets_res.data
        
        # Chats/Messages
        chats_res = supabase.table("chats").select("*").eq("user_id", user_id).execute()
        export_data["data"]["chats"] = chats_res.data
        
        if chats_res.data:
            chat_ids = [c["id"] for c in chats_res.data]
            for chat_id in chat_ids:
                messages_res = supabase.table("messages").select("*").eq("chat_id", chat_id).execute()
                if messages_res.data:
                    if "messages" not in export_data["data"]:
                        export_data["data"]["messages"] = []
                    export_data["data"]["messages"].extend(messages_res.data)
        
        # Audit log
        audit_res = supabase.table("audit").select("*").eq("user_id", user_id).execute()
        export_data["data"]["audit_log"] = audit_res.data
        
        # Follow relationships
        followers_res = supabase.table("user_follows").select("*").eq("following_id", user_id).execute()
        following_res = supabase.table("user_follows").select("*").eq("follower_id", user_id).execute()
        export_data["data"]["followers"] = followers_res.data
        export_data["data"]["following"] = following_res.data
        
        # Referral data
        referral_res = supabase.table("referral_codes").select("*").eq("user_id", user_id).execute()
        export_data["data"]["referral_code"] = referral_res.data[0] if referral_res.data else None
        
        # Billing history
        billing_res = supabase.table("billing_history").select("*").eq("user_id", user_id).execute()
        export_data["data"]["billing_history"] = billing_res.data
        
        # Subscription
        sub_res = supabase.table("user_subscriptions").select("*").eq("user_id", user_id).execute()
        export_data["data"]["subscription"] = sub_res.data[0] if sub_res.data else None
        
        # Create JSON file
        json_content = json.dumps(export_data, indent=2, default=str)
        
        # Upload to storage
        file_path = f"exports/{user_id}/data_export_{request_id}.json"
        supabase.storage.from_("user_assets").upload(
            path=file_path,
            file=json_content.encode(),
            file_options={"content-type": "application/json"}
        )
        
        # Get download URL (expires in 7 days)
        download_url = supabase.storage.from_("user_assets").create_signed_url(file_path, 604800)  # 7 days
        
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Update request status
        supabase.table("data_export_requests").update({
            "status": "ready",
            "download_url": download_url.get("signedURL") if isinstance(download_url, dict) else str(download_url),
            "expires_at": expires_at.isoformat(),
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", request_id).execute()
        
        logger.info(f"Data export completed for user {user_id}, request {request_id}")
        
    except Exception as e:
        logger.error(f"Error processing data export: {str(e)}")
        # Update status to failed
        supabase.table("data_export_requests").update({
            "status": "failed"
        }).eq("id", request_id).execute()


@router.post("/", response_model=ExportRequestResponse)
async def request_data_export(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Request a full data export.
    Queues a background job to compile user data.
    Returns immediately with a request_id.
    """
    supabase = get_supabase()
    
    try:
        # Check if there's already a pending/processing request
        existing = supabase.table("data_export_requests").select("*").eq("user_id", current_user["id"]).in_("status", ["pending", "processing"]).execute()
        
        if existing.data:
            # Return existing request
            req = existing.data[0]
            return ExportRequestResponse(
                request_id=req["id"],
                status=req["status"],
                estimated_time_minutes=5,
                created_at=req["created_at"]
            )
        
        # Create new export request
        request_data = {
            "user_id": current_user["id"],
            "status": "pending"
        }
        
        res = supabase.table("data_export_requests").insert(request_data).execute()
        
        if res.data:
            request = res.data[0]
            
            # Start background processing
            background_tasks.add_task(process_data_export, request["id"], current_user["id"])
            
            return ExportRequestResponse(
                request_id=request["id"],
                status="pending",
                estimated_time_minutes=5,
                created_at=request["created_at"]
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create export request")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating export request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create export request")


@router.get("/status", response_model=ExportStatusResponse)
async def get_export_status(current_user: dict = Depends(get_current_user)):
    """
    Check data export status.
    Returns the latest export request status.
    """
    supabase = get_supabase()
    
    try:
        # Get the latest export request
        res = supabase.table("data_export_requests").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).limit(1).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="No export request found")
        
        request = res.data[0]
        
        return ExportStatusResponse(
            request_id=request["id"],
            status=request["status"],
            download_url=request.get("download_url"),
            expires_at=request.get("expires_at"),
            created_at=request["created_at"],
            completed_at=request.get("completed_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting export status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get export status")


@router.get("/download")
async def download_export(current_user: dict = Depends(get_current_user)):
    """
    Get the download URL for the data export file.
    """
    supabase = get_supabase()
    
    try:
        # Get the latest ready export request
        res = supabase.table("data_export_requests").select("*").eq("user_id", current_user["id"]).eq("status", "ready").order("created_at", desc=True).limit(1).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="No ready export found. Please request an export first.")
        
        request = res.data[0]
        
        # Check if expired
        if request.get("expires_at"):
            expires_at = datetime.fromisoformat(request["expires_at"].replace("Z", "+00:00"))
            if expires_at < datetime.utcnow().replace(tzinfo=expires_at.tzinfo):
                # Update status to expired
                supabase.table("data_export_requests").update({
                    "status": "expired"
                }).eq("id", request["id"]).execute()
                raise HTTPException(status_code=410, detail="Export has expired. Please request a new export.")
        
        return {
            "download_url": request.get("download_url"),
            "expires_at": request.get("expires_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting download URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get download URL")
