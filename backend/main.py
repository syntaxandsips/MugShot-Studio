"""
Main entry point for the MugShot Studio API.

This file is placed at the root level for Vercel serverless deployment compatibility.
It imports and exposes the FastAPI application from the app package.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from datetime import datetime
import os

# Import settings and routers
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.endpoints import projects, jobs, assets, auth, chat, profile

# Setup logging
setup_logging()

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(assets.router, prefix=f"{settings.API_V1_STR}/assets", tags=["assets"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(profile.router, prefix=f"{settings.API_V1_STR}/profile", tags=["profile"])


def get_landing_page_html() -> str:
    """Generate the landing page HTML."""
    return f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{settings.PROJECT_NAME} API</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f7d70 0%, #0a5d50 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }}
        .container {{
            text-align: center;
            padding: 2rem;
            max-width: 500px;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: rgba(255,255,255,0.2);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .logo svg {{ width: 40px; height: 40px; fill: white; }}
        h1 {{ font-size: 2rem; margin-bottom: 0.5rem; }}
        .subtitle {{ opacity: 0.9; margin-bottom: 2rem; }}
        .links {{ display: flex; flex-direction: column; gap: 0.75rem; }}
        .link {{
            display: block;
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            text-decoration: none;
            color: white;
            font-weight: 500;
            transition: background 0.2s;
        }}
        .link:hover {{ background: rgba(255,255,255,0.25); }}
        .version {{ margin-top: 2rem; opacity: 0.7; font-size: 0.875rem; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
        </div>
        <h1>{settings.PROJECT_NAME}</h1>
        <p class="subtitle">AI-Powered Thumbnail Generation API</p>
        <div class="links">
            <a href="{settings.API_V1_STR}/docs" class="link">📚 API Documentation</a>
            <a href="{settings.API_V1_STR}/redoc" class="link">📖 ReDoc</a>
            <a href="/health" class="link">💚 Health Check</a>
        </div>
        <p class="version">Version 1.0.0</p>
    </div>
</body>
</html>
'''


def get_health_page_html(status: str = "healthy") -> str:
    """Generate the health check page HTML."""
    color = "#10b981" if status == "healthy" else "#ef4444"
    return f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health - {settings.PROJECT_NAME}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }}
        .container {{ text-align: center; padding: 2rem; }}
        .status {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            color: {color};
            font-weight: 500;
        }}
        .dot {{
            width: 10px;
            height: 10px;
            background: {color};
            border-radius: 50%;
        }}
        h1 {{ margin-top: 2rem; font-size: 1.5rem; }}
        .time {{ opacity: 0.6; margin-top: 0.5rem; }}
        a {{ color: #a5b4fc; margin-top: 2rem; display: block; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="status">
            <span class="dot"></span>
            {"All Systems Operational" if status == "healthy" else "Issues Detected"}
        </div>
        <h1>{settings.PROJECT_NAME}</h1>
        <p class="time">{datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC</p>
        <a href="/">← Back to Home</a>
    </div>
</body>
</html>
'''


@app.get("/", response_class=HTMLResponse)
def root():
    """Root endpoint - Landing page."""
    return get_landing_page_html()


@app.get("/health", response_class=HTMLResponse)
def health_check():
    """Health check endpoint - HTML page."""
    return get_health_page_html("healthy")


@app.get("/api/health")
async def api_health_check():
    """JSON health check endpoint for programmatic access."""
    redis_status = {"healthy": False, "provider": "upstash", "status": "not_configured"}
    try:
        from app.core.redis import check_redis_health
        redis_status = await check_redis_health()
    except Exception as e:
        redis_status = {"healthy": False, "error": str(e)}
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": settings.PROJECT_NAME,
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "api": {"healthy": True},
            "redis": redis_status
        }
    }


# For Vercel serverless, expose the ASGI handler
handler = app
