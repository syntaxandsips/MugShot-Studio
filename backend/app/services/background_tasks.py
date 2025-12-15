"""
Background Task Service for Thumbnail Generation.

This module replaces Celery with an async-compatible background task system
that works well with serverless deployments like Vercel.

Features:
- Fully async task execution using asyncio
- Proper error handling with automatic credit refund on failure
- Comprehensive logging for debugging
- Support for multiple AI providers
- Production-ready with proper async patterns
"""

import logging
import base64
import asyncio
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime

from app.core.config import get_settings
from app.db.supabase import get_supabase
from app.services.gemini_service import GeminiService
from app.services.bytedance_service import ByteDanceService
from app.services.fal_service import FalService
from app.utils.credit_calculator import calculate_job_credits, InsufficientCreditsException
from app.core.storage import StorageConfig

logger = logging.getLogger(__name__)
settings = get_settings()


class ThumbnailGenerationError(Exception):
    """Custom exception for thumbnail generation failures."""
    pass


class JobProcessor:
    """
    Async job processor for thumbnail generation.
    
    This class handles the complete workflow of generating thumbnails:
    1. Fetching job and project details
    2. Validating and deducting credits
    3. Generating images using the configured AI provider
    4. Storing results in Supabase storage
    5. Updating job status
    """
    
    def __init__(self, job_id: str):
        """
        Initialize the job processor.
        
        Args:
            job_id: The unique identifier for the job to process
        """
        self.job_id = job_id
        self.supabase = get_supabase()
        self.job: Optional[Dict[str, Any]] = None
        self.project: Optional[Dict[str, Any]] = None
        self.prompt_data: Optional[Dict[str, Any]] = None
        self.required_credits: int = 0
    
    async def _run_sync(self, func, *args, **kwargs):
        """
        Run a synchronous function in a thread pool.
        
        Args:
            func: The synchronous function to run
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            The result of the function
        """
        return await asyncio.to_thread(func, *args, **kwargs)
        
    async def _fetch_job(self) -> Dict[str, Any]:
        """Fetch job details from database asynchronously."""
        job_res = await self._run_sync(
            lambda: self.supabase.table("jobs").select("*").eq("id", self.job_id).execute()
        )
        if not job_res.data:
            raise ThumbnailGenerationError(f"Job {self.job_id} not found")
        return job_res.data[0]
    
    async def _update_job_status(self, status: str, **kwargs):
        """Update job status in database asynchronously."""
        update_data = {"status": status, **kwargs}
        await self._run_sync(
            lambda: self.supabase.table("jobs").update(update_data).eq("id", self.job_id).execute()
        )
        logger.info(f"Job {self.job_id} status updated to: {status}")
    
    async def _fetch_project_and_prompt(self, project_id: str) -> tuple:
        """Fetch project and prompt data asynchronously."""
        proj_res = await self._run_sync(
            lambda: self.supabase.table("projects").select("*").eq("id", project_id).execute()
        )
        if not proj_res.data:
            raise ThumbnailGenerationError(f"Project {project_id} not found")
        project = proj_res.data[0]
        
        prompt_res = await self._run_sync(
            lambda: self.supabase.table("prompts").select("*").eq("project_id", project_id).execute()
        )
        if not prompt_res.data:
            raise ThumbnailGenerationError(f"Prompt for project {project_id} not found")
        prompt_data = prompt_res.data[0]["raw"]
        
        return project, prompt_data
    
    async def _validate_and_deduct_credits(self, user_id: str, job_info: Dict) -> int:
        """Validate user has enough credits and deduct them asynchronously."""
        # Check user credits
        user_res = await self._run_sync(
            lambda: self.supabase.table("users").select("credits").eq("id", user_id).execute()
        )
        if not user_res.data:
            raise ThumbnailGenerationError(f"User {user_id} not found")
        
        user_credits = user_res.data[0].get("credits", 0)
        required_credits = calculate_job_credits(job_info)
        
        if user_credits < required_credits:
            raise InsufficientCreditsException(
                f"Need {required_credits} credits but only have {user_credits}"
            )
        
        # Deduct credits
        new_credits = user_credits - required_credits
        await self._run_sync(
            lambda: self.supabase.table("users").update({"credits": new_credits}).eq("id", user_id).execute()
        )
        
        # Log credit deduction
        await self._run_sync(
            lambda: self.supabase.table("audit").insert({
                "user_id": user_id,
                "action": "deduct_credits",
                "delta_credits": -required_credits,
                "meta": {"job_id": self.job_id, "reason": "thumbnail_generation"}
            }).execute()
        )
        
        logger.info(f"Deducted {required_credits} credits from user {user_id}")
        return required_credits
    
    async def _refund_credits(self, user_id: str, amount: int):
        """Refund credits to user on failure asynchronously."""
        try:
            user_res = await self._run_sync(
                lambda: self.supabase.table("users").select("credits").eq("id", user_id).execute()
            )
            current_credits = user_res.data[0].get("credits", 0) if user_res.data else 0
            refunded_credits = current_credits + amount
            
            await self._run_sync(
                lambda: self.supabase.table("users").update({"credits": refunded_credits}).eq("id", user_id).execute()
            )
            
            await self._run_sync(
                lambda: self.supabase.table("audit").insert({
                    "user_id": user_id,
                    "action": "refund_credits",
                    "delta_credits": amount,
                    "meta": {"job_id": self.job_id, "reason": "generation_failed"}
                }).execute()
            )
            
            logger.info(f"Refunded {amount} credits to user {user_id}")
        except Exception as e:
            logger.error(f"Failed to refund credits for job {self.job_id}: {e}")
    
    async def _download_reference_images(self, asset_ids: List[str]) -> tuple:
        """Download reference images from storage asynchronously."""
        ref_images = []
        ref_images_b64 = []
        
        for asset_id in asset_ids:
            try:
                asset_res = await self._run_sync(
                    lambda aid=asset_id: self.supabase.table("assets").select("*").eq("id", aid).execute()
                )
                if asset_res.data:
                    path = asset_res.data[0]["path"]
                    file_bytes = await self._run_sync(
                        lambda p=path: self.supabase.storage.from_(StorageConfig.USER_ASSETS_BUCKET).download(p)
                    )
                    ref_images.append(file_bytes)
                    ref_images_b64.append(base64.b64encode(file_bytes).decode('utf-8'))
            except Exception as e:
                logger.warning(f"Failed to download reference image {asset_id}: {e}")
        
        return ref_images, ref_images_b64
    
    async def _generate_with_gemini(
        self, 
        model: str, 
        prompt_data: Dict, 
        project: Dict, 
        ref_images: List
    ) -> List[str]:
        """Generate images using Gemini asynchronously."""
        gemini = GeminiService()
        model_type = "pro" if "pro" in model or model == "nano_banana_pro" else "flash"
        
        if ref_images:
            return await gemini.generate_with_references(
                prompt=str(prompt_data),
                reference_images=ref_images,
                model_type=model_type
            )
        else:
            final_prompt = f"""
            Create a {project['platform']} thumbnail.
            Title: {prompt_data.get('headline', '')}
            Subtext: {prompt_data.get('subtext', '')}
            Vibe: {prompt_data.get('vibe', '')}
            """
            return await gemini.generate_image(prompt=final_prompt, model_type=model_type)
    
    async def _generate_with_bytedance(
        self, 
        prompt_data: Dict, 
        project: Dict,
        ref_images_b64: List
    ) -> List[str]:
        """Generate images using ByteDance/Seedream asynchronously."""
        bytedance = ByteDanceService()
        final_prompt = f"""
        Create a {project['platform']} thumbnail.
        Title: {prompt_data.get('headline', '')}
        Subtext: {prompt_data.get('subtext', '')}
        Vibe: {prompt_data.get('vibe', '')}
        """
        
        return await bytedance.generate_image(
            prompt=final_prompt,
            model="seedream-4.0",
            width=project.get("width", 1024),
            height=project.get("height", 1024),
            reference_images=ref_images_b64 if ref_images_b64 else None
        )
    
    async def _generate_with_fal(self, prompt_data: Dict, project: Dict) -> List[str]:
        """Generate images using Fal.ai asynchronously."""
        fal = FalService()
        final_prompt = f"""
        Create a {project['platform']} thumbnail.
        Title: {prompt_data.get('headline', '')}
        Subtext: {prompt_data.get('subtext', '')}
        Vibe: {prompt_data.get('vibe', '')}
        """
        
        width = project.get("width", 16)
        height = project.get("height", 9)
        aspect_ratio = f"{width}:{height}"
        
        return await fal.generate_image(
            prompt=final_prompt,
            model="fal-ai/flux/dev",
            aspect_ratio=aspect_ratio
        )
    
    async def _save_results(self, images: List[str]) -> int:
        """Save generated images to storage and database asynchronously."""
        saved_count = 0
        
        for i, img_data in enumerate(images):
            try:
                # Handle both URLs and base64 strings
                if isinstance(img_data, str) and img_data.startswith('http'):
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(img_data, timeout=30.0)
                        img_bytes = resp.content
                else:
                    if isinstance(img_data, str):
                        img_bytes = base64.b64decode(img_data)
                    else:
                        img_bytes = img_data
                
                # Upload to storage (run in thread pool since Supabase SDK is sync)
                file_name = f"renders/{self.job_id}_{i}.png"
                await self._run_sync(
                    lambda fn=file_name, ib=img_bytes: self.supabase.storage.from_(
                        StorageConfig.RENDERS_BUCKET
                    ).upload(
                        path=fn,
                        file=ib,
                        file_options={"content-type": "image/png"}
                    )
                )
                
                # Save to database
                await self._run_sync(
                    lambda fn=file_name: self.supabase.table("renders").insert({
                        "job_id": self.job_id,
                        "variant": i,
                        "thumbnail_path": fn
                    }).execute()
                )
                
                saved_count += 1
                logger.debug(f"Saved render {i} for job {self.job_id}")
                
            except Exception as e:
                logger.error(f"Failed to save render {i} for job {self.job_id}: {e}")
        
        return saved_count
    
    async def process(self) -> Dict[str, Any]:
        """
        Process the thumbnail generation job asynchronously.
        
        This is the main entry point for job processing. It orchestrates
        the entire workflow from fetching data to saving results.
        
        Returns:
            dict: Result status with success/failure information
        """
        logger.info(f"Processing job: {self.job_id}")
        start_time = datetime.utcnow()
        
        try:
            # 1. Fetch job details
            self.job = await self._fetch_job()
            await self._update_job_status("running")
            
            # 2. Fetch project and prompt
            self.project, self.prompt_data = await self._fetch_project_and_prompt(
                self.job["project_id"]
            )
            
            # 3. Prepare job info and validate credits
            model = self.job.get("model", "nano_banana")
            job_info = {
                "quality": self.job.get("quality", "std"),
                "mode": self.project.get("mode", "design"),
                "model": model
            }
            
            self.required_credits = await self._validate_and_deduct_credits(
                self.project["user_id"],
                job_info
            )
            
            # 4. Download reference images
            ref_images, ref_images_b64 = [], []
            if self.prompt_data.get("refs"):
                ref_images, ref_images_b64 = await self._download_reference_images(
                    self.prompt_data["refs"]
                )
            
            # 5. Generate images based on model
            logger.info(f"Using model: {model} for job {self.job_id}")
            
            images: List[str] = []
            if "gemini" in model or "nano" in model:
                images = await self._generate_with_gemini(
                    model, self.prompt_data, self.project, ref_images
                )
            elif "seedream" in model or "bytedance" in model:
                images = await self._generate_with_bytedance(
                    self.prompt_data, self.project, ref_images_b64
                )
            elif "fal" in model:
                images = await self._generate_with_fal(self.prompt_data, self.project)
            
            if not images:
                raise ThumbnailGenerationError("No images generated")
            
            # 6. Save results
            saved_count = await self._save_results(images)
            
            if saved_count == 0:
                raise ThumbnailGenerationError("Failed to save any images")
            
            # 7. Update job status to succeeded
            duration = (datetime.utcnow() - start_time).total_seconds()
            await self._update_job_status(
                "succeeded",
                finished_at=datetime.utcnow().isoformat(),
                cost_credits=self.required_credits
            )
            
            logger.info(f"Job {self.job_id} completed successfully in {duration:.2f}s")
            return {
                "success": True,
                "job_id": self.job_id,
                "images_saved": saved_count,
                "duration_seconds": duration
            }
            
        except Exception as e:
            logger.error(f"Job {self.job_id} failed: {e}")
            
            # Update job status to failed
            await self._update_job_status(
                "failed",
                finished_at=datetime.utcnow().isoformat()
            )
            
            # Refund credits on failure
            if self.required_credits > 0 and self.project:
                await self._refund_credits(self.project["user_id"], self.required_credits)
            
            return {
                "success": False,
                "job_id": self.job_id,
                "error": str(e)
            }


async def process_thumbnail_job(job_id: str) -> Dict[str, Any]:
    """
    Process a thumbnail generation job asynchronously.
    
    This is the main entry point for processing jobs.
    
    Args:
        job_id: The unique identifier for the job to process
        
    Returns:
        dict: Result status with success/failure information
    """
    processor = JobProcessor(job_id)
    return await processor.process()


def process_thumbnail_job_sync(job_id: str) -> Dict[str, Any]:
    """
    Synchronous wrapper for thumbnail job processing.
    
    This is used with FastAPI's BackgroundTasks which expects
    a regular function (not async). It creates a new event loop
    and runs the async job processor.
    
    Args:
        job_id: The unique identifier for the job to process
        
    Returns:
        dict: Result status with success/failure information
    """
    try:
        # Try to get the current event loop if one exists
        loop = asyncio.get_running_loop()
        # If we're already in an async context, create a task
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(asyncio.run, process_thumbnail_job(job_id))
            return future.result()
    except RuntimeError:
        # No running event loop, safe to use asyncio.run
        return asyncio.run(process_thumbnail_job(job_id))
