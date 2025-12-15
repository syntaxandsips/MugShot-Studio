from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.core.security import get_current_user
from app.db.supabase import get_supabase
from app.utils.credit_calculator import calculate_job_credits, get_model_info
from app.utils.exceptions import handle_exception, InsufficientCreditsException
from pydantic import BaseModel
from typing import Optional
from app.services.background_tasks import process_thumbnail_job_sync
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class JobCreate(BaseModel):
    project_id: str
    quality: str = "std"  # draft, std, 4k
    variants: int = 2
    model: Optional[str] = "nano_banana"  # Default to Nano Banana

class JobResponse(BaseModel):
    id: str
    status: str
    cost_credits: int

class JobStatusResponse(BaseModel):
    id: str
    status: str
    progress: Optional[float] = None
    cost_credits: Optional[int] = None
    provider: Optional[str] = None

@router.post("/", response_model=JobResponse)
async def create_job(
    job_in: JobCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = user.get("id")
    
    try:
        # Verify project ownership
        proj_res = supabase.table("projects").select("*").eq("id", job_in.project_id).eq("user_id", user_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = proj_res.data[0]
        
        # Determine model to use
        model = job_in.model or "nano_banana"
        
        # Validate model
        available_models = ["nano_banana", "nano_banana_pro", "seedream", "gemini_flash", "gemini_pro", "fal_flux"]
        if model not in available_models:
            model = "nano_banana"  # Default fallback
        
        # Calculate credits needed
        job_data = {
            "quality": job_in.quality,
            "mode": project.get("mode", "design"),
            "model": model
        }
        credits_needed = calculate_job_credits(job_data)
        
        # Check user credits
        profile_res = supabase.table("users").select("credits").eq("id", user_id).execute()
        if not profile_res.data:
            raise HTTPException(status_code=400, detail="User profile not found")
        
        current_credits = profile_res.data[0].get("credits", 0)
        if current_credits < credits_needed:
            raise InsufficientCreditsException(f"Need {credits_needed} credits but only have {current_credits}")
        
        # Create Job Record
        job_data = {
            "project_id": job_in.project_id,
            "model": model,
            "quality": job_in.quality,
            "status": "queued",
            "cost_credits": credits_needed,
            "provider": model
        }
        
        res = supabase.table("jobs").insert(job_data).execute()
        job = res.data[0]
        
        # Trigger background task (replaces Celery)
        logger.info(f"Queueing background task for job {job['id']}")
        background_tasks.add_task(process_thumbnail_job_sync, job["id"])
        
        return JobResponse(
            id=job["id"], 
            status="queued",
            cost_credits=credits_needed
        )
        
    except Exception as e:
        raise handle_exception(e)

@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    
    try:
        # Verify job ownership through project
        job_res = supabase.table("jobs").select("*, projects(user_id)").eq("id", job_id).execute()
        if not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_res.data[0]
        project = job.get("projects", {})
        
        if not project or project.get("user_id") != user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return JobStatusResponse(
            id=job["id"],
            status=job["status"],
            cost_credits=job.get("cost_credits"),
            provider=job.get("provider")
        )
    except Exception as e:
        raise handle_exception(e)

@router.get("/{job_id}/models", response_model=dict)
async def get_available_models(user: dict = Depends(get_current_user)):
    """Get information about all available models."""
    models_info = {}
    for model_name in ["nano_banana", "nano_banana_pro", "seedream", "gemini_flash", "gemini_pro"]:
        models_info[model_name] = get_model_info(model_name)
    
    return {"models": models_info}