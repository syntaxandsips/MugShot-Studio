from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from core.security import get_current_user, get_current_user_optional
from db.supabase import get_supabase
from utils.credit_calculator import calculate_job_credits, get_model_info
from utils.exceptions import handle_exception, InsufficientCreditsException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from services.background_tasks import process_thumbnail_job_sync
from core.ratelimit import RateLimiter
from core.storage import StorageConfig
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ProjectCreate(BaseModel):
    mode: str  # design, copy
    platform: str
    width: int
    height: int
    headline: Optional[str] = None
    subtext: Optional[str] = None
    vibe: Optional[str] = None
    model_pref: Optional[str] = "nano_banana"  # Default to Nano Banana
    refs: Optional[List[str]] = []  # List of asset IDs
    copy_target: Optional[str] = None  # Asset ID
    # New visibility fields
    title: Optional[str] = None
    description: Optional[str] = None
    visibility: str = "private"  # public, private, unlisted
    tags: Optional[List[str]] = []

class ProjectUpdate(BaseModel):
    mode: Optional[str] = None
    platform: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    headline: Optional[str] = None
    subtext: Optional[str] = None
    vibe: Optional[str] = None
    model_pref: Optional[str] = None
    refs: Optional[List[str]] = None
    copy_target: Optional[str] = None
    # New visibility fields
    title: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None
    tags: Optional[List[str]] = None

class ProjectResponse(BaseModel):
    id: str
    status: str
    mode: str
    platform: str
    width: int
    height: int
    # New fields
    title: Optional[str] = None
    description: Optional[str] = None
    visibility: str = "private"
    tags: List[str] = []
    thumbnail_url: Optional[str] = None
    likes_count: int = 0
    views_count: int = 0
    is_featured: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    owner_id: Optional[str] = None
    owner_username: Optional[str] = None


class ProjectVisibilityUpdate(BaseModel):
    visibility: str = Field(..., pattern="^(public|private|unlisted)$")


class PaginatedProjectList(BaseModel):
    projects: List[ProjectResponse]
    total: int
    page: int
    limit: int
    has_more: bool

class JobQueueRequest(BaseModel):
    quality: str = "std"
    variants: int = 2
    model: Optional[str] = None

class JobResponse(BaseModel):
    job_id: str
    status: str
    cost_credits: int

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_in: ProjectCreate,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = user.get("id")
    
    try:
        # Validate model preference
        available_models = ["nano_banana", "nano_banana_pro", "seedream", "gemini_flash", "gemini_pro", "fal_flux"]
        model_pref = project_in.model_pref or "nano_banana"
        if model_pref not in available_models:
            model_pref = "nano_banana"  # Default fallback
        
        # 1. Create Project
        project_data = {
            "user_id": user_id,
            "mode": project_in.mode,
            "platform": project_in.platform,
            "width": project_in.width,
            "height": project_in.height,
            "status": "draft"
        }
        
        res = supabase.table("projects").insert(project_data).execute()
        project = res.data[0]
        
        # 2. Save Prompt/Config
        prompt_data = {
            "project_id": project["id"],
            "raw": project_in.dict(),
            "model_pref": model_pref
        }
        supabase.table("prompts").insert(prompt_data).execute()
        
        return ProjectResponse(
            id=project["id"],
            status=project["status"],
            mode=project["mode"],
            platform=project["platform"],
            width=project["width"],
            height=project["height"]
        )
        
    except Exception as e:
        raise handle_exception(e)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    try:
        res = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", user["id"]).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        project = res.data[0]
        
        return ProjectResponse(
            id=project["id"],
            status=project["status"],
            mode=project["mode"],
            platform=project["platform"],
            width=project["width"],
            height=project["height"]
        )
    except Exception as e:
        raise handle_exception(e)

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    try:
        # Verify project ownership
        proj_res = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", user["id"]).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update project data
        update_data = project_update.dict(exclude_unset=True)
        
        # Handle model preference update
        if "model_pref" in update_data:
            available_models = ["nano_banana", "nano_banana_pro", "seedream", "gemini_flash", "gemini_pro", "fal_flux"]
            if update_data["model_pref"] not in available_models:
                update_data["model_pref"] = "nano_banana"
        
        if update_data:  # Only update if there's data to update
            supabase.table("projects").update(update_data).eq("id", project_id).execute()
        
        # Update prompt data if needed
        if any(field in update_data for field in ["headline", "subtext", "vibe", "refs", "copy_target"]):
            # Get existing prompt
            prompt_res = supabase.table("prompts").select("*").eq("project_id", project_id).execute()
            if prompt_res.data:
                prompt_id = prompt_res.data[0]["id"]
                existing_raw = prompt_res.data[0]["raw"] or {}
                
                # Merge updates
                updated_raw = {**existing_raw, **update_data}
                
                # Update prompt
                supabase.table("prompts").update({
                    "raw": updated_raw
                }).eq("id", prompt_id).execute()
        
        # Return updated project
        res = supabase.table("projects").select("*").eq("id", project_id).execute()
        project = res.data[0]
        
        return ProjectResponse(
            id=project["id"],
            status=project["status"],
            mode=project["mode"],
            platform=project["platform"],
            width=project["width"],
            height=project["height"]
        )
        
    except Exception as e:
        raise handle_exception(e)

@router.post("/{project_id}/queue", response_model=JobResponse, dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def queue_generation(
    project_id: str,
    job_in: JobQueueRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = user.get("id")
    
    try:
        # Verify project ownership
        proj_res = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", user_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = proj_res.data[0]
        
        # Determine model to use (from request or project default)
        model = job_in.model
        if not model:
            # Fetch from prompt/config
            prompt_res = supabase.table("prompts").select("model_pref").eq("project_id", project_id).execute()
            if prompt_res.data:
                model = prompt_res.data[0].get("model_pref")
        
        if not model:
            model = "nano_banana"

        # Validate model
        available_models = ["nano_banana", "nano_banana_pro", "seedream", "gemini_flash", "gemini_pro", "fal_flux"]
        if model not in available_models:
            model = "nano_banana"
            
        # Calculate credits
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
            
        # Deduct credits (Optimistic locking or transaction would be better, but Supabase API is limited here without RPC)
        # We will assume single worker for now or accept race condition risk until RPC is implemented
        # Ideally: supabase.rpc('deduct_credits', {'user_id': user_id, 'amount': credits_needed})
        
        # Create Job Record
        new_job_data = {
            "project_id": project_id,
            "model": model,
            "quality": job_in.quality,
            "status": "queued",
            "cost_credits": credits_needed,
            "provider_meta": {"provider": model} # Store provider in meta
        }
        
        res = supabase.table("jobs").insert(new_job_data).execute()
        job = res.data[0]
        
        # Trigger background task (replaces Celery)
        logger.info(f"Queueing background task for job {job['id']}")
        background_tasks.add_task(process_thumbnail_job_sync, job["id"])
        
        # Update user credits
        supabase.table("users").update({"credits": current_credits - credits_needed}).eq("id", user_id).execute()
        
        # Log audit
        audit_data = {
            "user_id": user_id,
            "action": "job_queued",
            "delta_credits": -credits_needed,
            "meta": {"job_id": job["id"], "project_id": project_id}
        }
        supabase.table("audit").insert(audit_data).execute()
        
        return JobResponse(
            job_id=job["id"],
            status="queued",
            cost_credits=credits_needed
        )

    except Exception as e:
        raise handle_exception(e)


def get_project_thumbnail_url(supabase, project_id: str) -> Optional[str]:
    """Get the first render thumbnail URL for a project."""
    try:
        # Get the latest job for this project
        job_res = supabase.table("jobs").select("id").eq("project_id", project_id).eq("status", "succeeded").order("finished_at", desc=True).limit(1).execute()
        if not job_res.data:
            return None
        
        # Get the first render for this job
        render_res = supabase.table("renders").select("asset_id").eq("job_id", job_res.data[0]["id"]).limit(1).execute()
        if not render_res.data:
            return None
        
        # Get the asset storage path
        asset_res = supabase.table("assets").select("storage_path").eq("id", render_res.data[0]["asset_id"]).execute()
        if not asset_res.data:
            return None
        
        path = asset_res.data[0]["storage_path"]
        return supabase.storage.from_(StorageConfig.RENDERS_BUCKET).get_public_url(path)
    except:
        return None


def build_project_response(supabase, project: dict, include_owner: bool = False) -> ProjectResponse:
    """Build a ProjectResponse from a project dict."""
    thumbnail_url = get_project_thumbnail_url(supabase, project["id"])
    
    owner_username = None
    if include_owner:
        try:
            user_res = supabase.table("users").select("username").eq("id", project["user_id"]).execute()
            if user_res.data:
                owner_username = user_res.data[0]["username"]
        except:
            pass
    
    tags = project.get("tags", [])
    if isinstance(tags, str):
        import json
        try:
            tags = json.loads(tags)
        except:
            tags = []
    
    return ProjectResponse(
        id=project["id"],
        status=project["status"],
        mode=project["mode"],
        platform=project["platform"],
        width=project["width"],
        height=project["height"],
        title=project.get("title"),
        description=project.get("description"),
        visibility=project.get("visibility", "private"),
        tags=tags or [],
        thumbnail_url=thumbnail_url,
        likes_count=project.get("likes_count", 0),
        views_count=project.get("views_count", 0),
        is_featured=project.get("is_featured", False),
        created_at=project.get("created_at"),
        updated_at=project.get("updated_at"),
        owner_id=project.get("user_id"),
        owner_username=owner_username
    )


@router.patch("/{project_id}/visibility")
async def update_project_visibility(
    project_id: str,
    update: ProjectVisibilityUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Update project visibility (public, private, unlisted).
    """
    supabase = get_supabase()
    
    try:
        # Verify ownership
        proj_res = supabase.table("projects").select("*").eq("id", project_id).eq("user_id", user["id"]).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update visibility
        supabase.table("projects").update({"visibility": update.visibility}).eq("id", project_id).execute()
        
        return {"message": f"Project visibility updated to {update.visibility}", "visibility": update.visibility}
        
    except HTTPException:
        raise
    except Exception as e:
        raise handle_exception(e)


@router.get("/gallery/featured", response_model=PaginatedProjectList)
async def get_featured_gallery(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get featured public projects.
    """
    supabase = get_supabase()
    offset = (page - 1) * limit
    
    try:
        # Get total count
        count_res = supabase.table("projects").select("id", count="exact").eq("visibility", "public").eq("is_featured", True).execute()
        total = count_res.count or 0
        
        # Get featured projects
        projects_res = supabase.table("projects").select("*").eq("visibility", "public").eq("is_featured", True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        projects = [build_project_response(supabase, p, include_owner=True) for p in projects_res.data]
        
        return PaginatedProjectList(
            projects=projects,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting featured gallery: {str(e)}")
        return PaginatedProjectList(projects=[], total=0, page=page, limit=limit, has_more=False)


@router.get("/gallery/trending", response_model=PaginatedProjectList)
async def get_trending_gallery(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get trending public projects (ordered by views/likes).
    """
    supabase = get_supabase()
    offset = (page - 1) * limit
    
    try:
        # Get total count
        count_res = supabase.table("projects").select("id", count="exact").eq("visibility", "public").execute()
        total = count_res.count or 0
        
        # Get trending projects (ordered by views_count desc, then likes_count desc)
        projects_res = supabase.table("projects").select("*").eq("visibility", "public").order("views_count", desc=True).order("likes_count", desc=True).range(offset, offset + limit - 1).execute()
        
        projects = [build_project_response(supabase, p, include_owner=True) for p in projects_res.data]
        
        return PaginatedProjectList(
            projects=projects,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting trending gallery: {str(e)}")
        return PaginatedProjectList(projects=[], total=0, page=page, limit=limit, has_more=False)


@router.get("/gallery/recent", response_model=PaginatedProjectList)
async def get_recent_gallery(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get recent public projects.
    """
    supabase = get_supabase()
    offset = (page - 1) * limit
    
    try:
        # Get total count
        count_res = supabase.table("projects").select("id", count="exact").eq("visibility", "public").execute()
        total = count_res.count or 0
        
        # Get recent projects
        projects_res = supabase.table("projects").select("*").eq("visibility", "public").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        projects = [build_project_response(supabase, p, include_owner=True) for p in projects_res.data]
        
        return PaginatedProjectList(
            projects=projects,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting recent gallery: {str(e)}")
        return PaginatedProjectList(projects=[], total=0, page=page, limit=limit, has_more=False)


@router.get("/user/{user_id}/public", response_model=PaginatedProjectList)
async def get_user_public_projects(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get a user's public projects.
    """
    supabase = get_supabase()
    offset = (page - 1) * limit
    
    try:
        # Check if requesting own projects (show all) or others (show public only)
        visibility_filter = "public"
        if current_user and current_user["id"] == user_id:
            # Show all projects for the owner
            visibility_filter = None
        
        # Build query
        query = supabase.table("projects").select("*", count="exact").eq("user_id", user_id)
        if visibility_filter:
            query = query.eq("visibility", visibility_filter)
        
        count_res = query.execute()
        total = count_res.count or 0
        
        # Get projects
        query = supabase.table("projects").select("*").eq("user_id", user_id)
        if visibility_filter:
            query = query.eq("visibility", visibility_filter)
        
        projects_res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        projects = [build_project_response(supabase, p, include_owner=True) for p in projects_res.data]
        
        return PaginatedProjectList(
            projects=projects,
            total=total,
            page=page,
            limit=limit,
            has_more=(offset + limit) < total
        )
        
    except Exception as e:
        logger.error(f"Error getting user projects: {str(e)}")
        return PaginatedProjectList(projects=[], total=0, page=page, limit=limit, has_more=False)


@router.post("/{project_id}/like")
async def like_project(project_id: str, user: dict = Depends(get_current_user)):
    """
    Like a project.
    """
    supabase = get_supabase()
    
    try:
        # Check if project exists and is public
        proj_res = supabase.table("projects").select("id, user_id, visibility, likes_count").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = proj_res.data[0]
        
        # Can only like public projects (or your own)
        if project["visibility"] != "public" and project["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Cannot like private projects")
        
        # Check if already liked
        existing = supabase.table("project_likes").select("id").eq("project_id", project_id).eq("user_id", user["id"]).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Already liked this project")
        
        # Add like
        supabase.table("project_likes").insert({
            "project_id": project_id,
            "user_id": user["id"]
        }).execute()
        
        # Increment likes count
        new_count = (project.get("likes_count") or 0) + 1
        supabase.table("projects").update({"likes_count": new_count}).eq("id", project_id).execute()
        
        return {"message": "Project liked", "liked": True, "likes_count": new_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to like project")


@router.delete("/{project_id}/like")
async def unlike_project(project_id: str, user: dict = Depends(get_current_user)):
    """
    Unlike a project.
    """
    supabase = get_supabase()
    
    try:
        # Check if project exists
        proj_res = supabase.table("projects").select("id, likes_count").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = proj_res.data[0]
        
        # Remove like
        supabase.table("project_likes").delete().eq("project_id", project_id).eq("user_id", user["id"]).execute()
        
        # Decrement likes count
        new_count = max(0, (project.get("likes_count") or 0) - 1)
        supabase.table("projects").update({"likes_count": new_count}).eq("id", project_id).execute()
        
        return {"message": "Project unliked", "liked": False, "likes_count": new_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unliking project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unlike project")


@router.get("/{project_id}/is-liked")
async def check_project_liked(project_id: str, user: dict = Depends(get_current_user)):
    """
    Check if user has liked a project.
    """
    supabase = get_supabase()
    
    try:
        existing = supabase.table("project_likes").select("id").eq("project_id", project_id).eq("user_id", user["id"]).execute()
        return {"is_liked": len(existing.data) > 0}
        
    except Exception as e:
        logger.error(f"Error checking like status: {str(e)}")
        return {"is_liked": False}


@router.post("/{project_id}/view")
async def record_project_view(
    project_id: str,
    user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Record a view on a project.
    Increments view count for public/unlisted projects.
    """
    supabase = get_supabase()
    
    try:
        # Get project
        proj_res = supabase.table("projects").select("id, user_id, visibility, views_count").eq("id", project_id).execute()
        if not proj_res.data:
            return {"success": False}
        
        project = proj_res.data[0]
        
        # Only count views for public/unlisted projects
        if project["visibility"] == "private":
            # Check if user is owner
            if not user or project["user_id"] != user["id"]:
                return {"success": False}
        
        # Don't count owner's own views
        if user and project["user_id"] == user["id"]:
            return {"success": True, "views_count": project.get("views_count", 0)}
        
        # Increment view count
        new_count = (project.get("views_count") or 0) + 1
        supabase.table("projects").update({"views_count": new_count}).eq("id", project_id).execute()
        
        return {"success": True, "views_count": new_count}
        
    except Exception as e:
        logger.error(f"Error recording view: {str(e)}")
        return {"success": False}


@router.get("/public/{project_id}", response_model=ProjectResponse)
async def get_public_project(
    project_id: str,
    user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get a public project by ID.
    Also works for unlisted projects if the link is known.
    """
    supabase = get_supabase()
    
    try:
        proj_res = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = proj_res.data[0]
        
        # Check visibility
        if project["visibility"] == "private":
            # Only owner can view private projects
            if not user or project["user_id"] != user["id"]:
                raise HTTPException(status_code=404, detail="Project not found")
        
        return build_project_response(supabase, project, include_owner=True)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting public project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get project")