"""
Gemini Service for Image Generation.

This module provides async image generation using Google's Gemini API.
Optimized for serverless deployments with proper async/await patterns.
"""

from typing import List, Optional
import base64
import asyncio
from app.core.config import get_settings
from app.utils.logger import logger
from app.utils.exceptions import ModelGenerationException
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse

settings = get_settings()


class GeminiService:
    """
    Async service for generating images using Google Gemini.
    
    Supports both Nano Banana (Flash) and Nano Banana Pro models.
    Uses asyncio.to_thread to wrap synchronous Gemini SDK calls.
    """
    
    def __init__(self):
        """Initialize the Gemini service with API key."""
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
        # Default to Nano Banana models as specified
        self.model_flash = "gemini-2.0-flash"  # Using as Nano Banana
        self.model_pro = "gemini-2.0-pro"      # Using as Nano Banana Pro
    
    async def generate_image(
        self, 
        prompt: str, 
        aspect_ratio: str = "16:9", 
        model_type: str = "flash"
    ) -> List[str]:
        """
        Generate image using Gemini models (Nano Banana variants) asynchronously.
        
        Args:
            prompt: Text prompt for image generation
            aspect_ratio: Aspect ratio of the image (e.g., "16:9", "1:1", "9:16")
            model_type: "flash" for Nano Banana, "pro" for Nano Banana Pro
            
        Returns:
            List of base64 encoded images
        """
        if not settings.GEMINI_API_KEY:
            raise ModelGenerationException("Gemini API key not configured", "nano_banana")
            
        model_name = self.model_pro if model_type == "pro" else self.model_flash
        
        logger.info(f"Generating image with {model_name} model")
        
        try:
            # Run the synchronous Gemini SDK call in a thread pool
            response = await asyncio.to_thread(
                self._generate_content_sync,
                model_name,
                prompt
            )
            
            # Process response
            images = self._process_response(response)
            logger.info(f"Successfully generated {len(images)} images")
            return images
            
        except Exception as e:
            logger.error(f"Error generating image with {model_name}: {str(e)}")
            raise ModelGenerationException(f"Failed to generate image: {str(e)}", model_name)
    
    async def generate_with_references(
        self, 
        prompt: str, 
        reference_images: List[bytes], 
        aspect_ratio: str = "16:9", 
        model_type: str = "pro"
    ) -> List[str]:
        """
        Generate image using Gemini with reference images asynchronously.
        
        Args:
            prompt: Text prompt for image generation
            reference_images: List of image bytes for reference
            aspect_ratio: Aspect ratio of the image
            model_type: "flash" or "pro" model
            
        Returns:
            List of base64 encoded images
        """
        if not settings.GEMINI_API_KEY:
            raise ModelGenerationException("Gemini API key not configured", "nano_banana")
            
        model_name = self.model_pro if model_type == "pro" else self.model_flash
        
        logger.info(f"Generating image with references using {model_name} model")
        
        try:
            # Prepare content with prompt and reference images
            contents = [prompt]
            for img_bytes in reference_images:
                # Convert bytes to image part
                image_part = {
                    "mime_type": "image/jpeg",
                    "data": img_bytes
                }
                contents.append(image_part)
            
            # Run the synchronous Gemini SDK call in a thread pool
            response = await asyncio.to_thread(
                self._generate_content_with_refs_sync,
                model_name,
                contents
            )
            
            # Process response
            images = self._process_response(response)
            logger.info(f"Successfully generated {len(images)} images with references")
            return images
            
        except Exception as e:
            logger.error(f"Error generating image with references using {model_name}: {str(e)}")
            raise ModelGenerationException(f"Failed to generate image with references: {str(e)}", model_name)
    
    def _generate_content_sync(self, model_name: str, prompt: str) -> GenerateContentResponse:
        """
        Synchronous content generation (called in thread pool).
        
        Args:
            model_name: The Gemini model to use
            prompt: The text prompt
            
        Returns:
            Gemini API response
        """
        model = genai.GenerativeModel(model_name)
        return model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="image/png"
            )
        )
    
    def _generate_content_with_refs_sync(
        self, 
        model_name: str, 
        contents: list
    ) -> GenerateContentResponse:
        """
        Synchronous content generation with references (called in thread pool).
        
        Args:
            model_name: The Gemini model to use
            contents: List containing prompt and reference images
            
        Returns:
            Gemini API response
        """
        model = genai.GenerativeModel(model_name)
        return model.generate_content(contents)
    
    def _process_response(self, response: GenerateContentResponse) -> List[str]:
        """
        Process Gemini response and extract images as base64 strings.
        
        Args:
            response: Gemini API response
            
        Returns:
            List of base64 encoded images
        """
        images = []
        
        if not response.candidates:
            return images
            
        for candidate in response.candidates:
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # Handle inline data format
                        if hasattr(part.inline_data, 'data'):
                            image_data = part.inline_data.data
                            if isinstance(image_data, bytes):
                                b64_image = base64.b64encode(image_data).decode('utf-8')
                                images.append(b64_image)
        
        return images