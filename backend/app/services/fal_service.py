"""
Fal.ai Service for Image Generation.

This module provides async image generation using Fal.ai's API.
Optimized for serverless deployments with proper async/await patterns.
"""

import fal_client
import httpx
import base64
import asyncio
from typing import List, Optional
from app.core.config import get_settings
from app.utils.logger import logger
from app.utils.exceptions import ModelGenerationException

settings = get_settings()


class FalService:
    """
    Async service for generating images using Fal.ai.
    
    Uses fal-client for job submission and async httpx for downloading results.
    """
    
    def __init__(self):
        """Initialize the Fal service."""
        # FAL_KEY should be in environment variables
        pass
    
    async def generate_image(
        self, 
        prompt: str, 
        model: str = "fal-ai/flux/dev", 
        aspect_ratio: str = "16:9", 
        num_images: int = 1
    ) -> List[str]:
        """
        Generate image using Fal.ai service asynchronously.
        
        Args:
            prompt: Text prompt for image generation
            model: Model to use (default: fal-ai/flux/dev)
            aspect_ratio: Aspect ratio for generation
            num_images: Number of images to generate
            
        Returns:
            List of image data (base64 encoded strings or URLs)
        """
        # Map aspect ratio to image_size
        aspect_ratio_map = {
            "1:1": "square_hd",
            "16:9": "landscape_16_9",
            "9:16": "thumbnail_16_9",
            "3:2": "landscape_3_2",
            "2:3": "thumbnail_3_2"
        }
        
        image_size = aspect_ratio_map.get(aspect_ratio, "landscape_16_9")
        
        arguments = {
            "prompt": prompt,
            "image_size": image_size,
            "num_inference_steps": 28,
            "guidance_scale": 3.5,
            "num_images": num_images,
            "enable_safety_checker": True
        }
        
        logger.info(f"Generating image with Fal.ai model: {model}")
        
        try:
            # Run the synchronous fal_client in a thread pool to avoid blocking
            result = await asyncio.to_thread(
                self._submit_and_wait,
                model,
                arguments
            )
            
            # Process result
            images = await self._process_result(result)
            
            logger.info(f"Successfully generated {len(images)} images with Fal.ai")
            return images
            
        except Exception as e:
            logger.error(f"Fal generation failed: {str(e)}")
            raise ModelGenerationException(f"Failed to generate image with Fal: {str(e)}", model)
    
    def _submit_and_wait(self, model: str, arguments: dict) -> dict:
        """
        Submit job to Fal.ai and wait for result (sync operation).
        
        This is called in a thread pool to avoid blocking the event loop.
        """
        handler = fal_client.submit(model, arguments=arguments)
        return handler.get()
    
    async def _process_result(self, result: dict) -> List[str]:
        """
        Process Fal.ai result and download images asynchronously.
        
        Args:
            result: The result from Fal.ai API
            
        Returns:
            List of base64 encoded images or URLs
        """
        images = []
        
        if not result or "images" not in result:
            return images
        
        async with httpx.AsyncClient() as client:
            for img in result.get("images", []):
                if "url" in img:
                    try:
                        # Download image asynchronously
                        response = await client.get(img["url"], timeout=30.0)
                        response.raise_for_status()
                        b64_image = base64.b64encode(response.content).decode('utf-8')
                        images.append(b64_image)
                    except Exception as e:
                        logger.warning(f"Failed to download image from URL: {str(e)}")
                        # Fallback to URL if download fails
                        images.append(img["url"])
        
        return images