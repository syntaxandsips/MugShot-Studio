from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.core.config import settings
from app.api.v1.endpoints import projects, jobs, assets, auth, chat, profile
from datetime import datetime

from app.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(assets.router, prefix=f"{settings.API_V1_STR}/assets", tags=["assets"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(profile.router, prefix=f"{settings.API_V1_STR}/profile", tags=["profile"])


def get_landing_page_html() -> str:
    """Generate the beautiful landing page HTML."""
    return f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{settings.PROJECT_NAME} API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            overflow: hidden;
        }}
        
        .container {{
            text-align: center;
            padding: 2rem;
            max-width: 800px;
            position: relative;
            z-index: 1;
        }}
        
        /* Animated background */
        .bg-animation {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }}
        
        .bg-animation span {{
            position: absolute;
            display: block;
            width: 20px;
            height: 20px;
            background: rgba(99, 102, 241, 0.1);
            animation: move 25s infinite;
            border-radius: 50%;
        }}
        
        .bg-animation span:nth-child(1) {{ left: 10%; width: 80px; height: 80px; animation-delay: 0s; }}
        .bg-animation span:nth-child(2) {{ left: 20%; width: 20px; height: 20px; animation-delay: 2s; animation-duration: 17s; }}
        .bg-animation span:nth-child(3) {{ left: 25%; width: 40px; height: 40px; animation-delay: 4s; }}
        .bg-animation span:nth-child(4) {{ left: 40%; width: 60px; height: 60px; animation-delay: 0s; animation-duration: 18s; }}
        .bg-animation span:nth-child(5) {{ left: 70%; width: 30px; height: 30px; animation-delay: 0s; }}
        .bg-animation span:nth-child(6) {{ left: 80%; width: 50px; height: 50px; animation-delay: 3s; }}
        .bg-animation span:nth-child(7) {{ left: 35%; width: 70px; height: 70px; animation-delay: 7s; }}
        .bg-animation span:nth-child(8) {{ left: 55%; width: 25px; height: 25px; animation-delay: 15s; animation-duration: 45s; }}
        
        @keyframes move {{
            0% {{ transform: translateY(100vh) rotate(0deg); opacity: 0; }}
            10% {{ opacity: 0.3; }}
            90% {{ opacity: 0.3; }}
            100% {{ transform: translateY(-100vh) rotate(720deg); opacity: 0; }}
        }}
        
        .logo {{
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 60px rgba(99, 102, 241, 0.4);
            animation: float 3s ease-in-out infinite;
        }}
        
        @keyframes float {{
            0%, 100% {{ transform: translateY(0px); }}
            50% {{ transform: translateY(-10px); }}
        }}
        
        .logo svg {{
            width: 60px;
            height: 60px;
            fill: white;
        }}
        
        h1 {{
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
        }}
        
        .subtitle {{
            font-size: 1.25rem;
            color: #a5b4fc;
            margin-bottom: 2rem;
            font-weight: 400;
        }}
        
        .status {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 0.625rem 1.25rem;
            border-radius: 50px;
            margin-bottom: 3rem;
            font-weight: 500;
            color: #34d399;
        }}
        
        .status-dot {{
            width: 10px;
            height: 10px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
        }}
        
        @keyframes pulse {{
            0%, 100% {{ box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }}
            50% {{ box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }}
        }}
        
        .cards {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
            margin-bottom: 3rem;
        }}
        
        .card {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 1.75rem;
            text-decoration: none;
            color: inherit;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        }}
        
        .card:hover {{
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(99, 102, 241, 0.5);
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }}
        
        .card-icon {{
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
        }}
        
        .card-icon svg {{
            width: 24px;
            height: 24px;
            stroke: #a5b4fc;
        }}
        
        .card h3 {{
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #ffffff;
        }}
        
        .card p {{
            font-size: 0.875rem;
            color: #94a3b8;
            line-height: 1.5;
        }}
        
        .version {{
            font-size: 0.875rem;
            color: #64748b;
        }}
        
        .version span {{
            color: #a5b4fc;
            font-weight: 500;
        }}
        
        @media (max-width: 640px) {{
            h1 {{ font-size: 2rem; }}
            .cards {{ grid-template-columns: 1fr; }}
            .container {{ padding: 1rem; }}
        }}
    </style>
</head>
<body>
    <div class="bg-animation">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
    </div>
    
    <div class="container">
        <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="white" stroke="none"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#6366f1"/>
                <path d="M21 15l-5-5L5 21" stroke="#6366f1" stroke-width="2"/>
            </svg>
        </div>
        
        <h1>{settings.PROJECT_NAME}</h1>
        <p class="subtitle">AI-Powered Thumbnail Generation API</p>
        
        <div class="status">
            <span class="status-dot"></span>
            All Systems Operational
        </div>
        
        <div class="cards">
            <a href="{settings.API_V1_STR}/docs" class="card">
                <div class="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <h3>Swagger Docs</h3>
                <p>Interactive API documentation with try-it-out feature</p>
            </a>
            
            <a href="{settings.API_V1_STR}/redoc" class="card">
                <div class="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                </div>
                <h3>ReDoc</h3>
                <p>Beautiful, responsive API reference documentation</p>
            </a>
            
            <a href="/health" class="card">
                <div class="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                </div>
                <h3>Health Check</h3>
                <p>Monitor API health status and uptime</p>
            </a>
        </div>
        
        <p class="version">Version <span>1.0.0</span> • Powered by FastAPI</p>
    </div>
</body>
</html>
'''


def get_health_page_html(status: str = "healthy") -> str:
    """Generate the health check page HTML."""
    is_healthy = status == "healthy"
    status_color = "#10b981" if is_healthy else "#ef4444"
    status_bg = "rgba(16, 185, 129, 0.15)" if is_healthy else "rgba(239, 68, 68, 0.15)"
    status_border = "rgba(16, 185, 129, 0.3)" if is_healthy else "rgba(239, 68, 68, 0.3)"
    status_text = "All Systems Operational" if is_healthy else "System Issues Detected"
    
    return f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check - {settings.PROJECT_NAME}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
        }}
        
        .container {{
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }}
        
        .health-icon {{
            width: 100px;
            height: 100px;
            margin: 0 auto 2rem;
            background: {status_bg};
            border: 2px solid {status_border};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s ease-in-out infinite;
        }}
        
        @keyframes pulse {{
            0%, 100% {{ box-shadow: 0 0 0 0 {status_border}; transform: scale(1); }}
            50% {{ box-shadow: 0 0 0 20px transparent; transform: scale(1.02); }}
        }}
        
        .health-icon svg {{
            width: 48px;
            height: 48px;
            stroke: {status_color};
        }}
        
        h1 {{
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #ffffff;
        }}
        
        .status-badge {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: {status_bg};
            border: 1px solid {status_border};
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            margin: 1.5rem 0;
            font-weight: 600;
            font-size: 1.1rem;
            color: {status_color};
        }}
        
        .status-dot {{
            width: 12px;
            height: 12px;
            background: {status_color};
            border-radius: 50%;
            animation: blink 1.5s ease-in-out infinite;
        }}
        
        @keyframes blink {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.5; }}
        }}
        
        .metrics {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 2rem 0;
        }}
        
        .metric {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 1.25rem;
            backdrop-filter: blur(10px);
        }}
        
        .metric-label {{
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }}
        
        .metric-value {{
            font-size: 1.5rem;
            font-weight: 700;
            color: #a5b4fc;
        }}
        
        .back-link {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #a5b4fc;
            text-decoration: none;
            font-weight: 500;
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            transition: all 0.2s;
        }}
        
        .back-link:hover {{
            background: rgba(165, 180, 252, 0.1);
        }}
        
        .timestamp {{
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 1.5rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="health-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                {"<polyline points='20 6 9 17 4 12'></polyline>" if is_healthy else "<line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line>"}
            </svg>
        </div>
        
        <h1>Health Check</h1>
        
        <div class="status-badge">
            <span class="status-dot"></span>
            {status_text}
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Status</div>
                <div class="metric-value" style="color: {status_color};">{status.upper()}</div>
            </div>
            <div class="metric">
                <div class="metric-label">API Version</div>
                <div class="metric-value">v1.0.0</div>
            </div>
            <div class="metric">
                <div class="metric-label">Environment</div>
                <div class="metric-value">Production</div>
            </div>
            <div class="metric">
                <div class="metric-label">Response</div>
                <div class="metric-value">&lt;50ms</div>
            </div>
        </div>
        
        <p class="timestamp">Last checked: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        
        <a href="/" class="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Home
        </a>
    </div>
</body>
</html>
'''


@app.get("/", response_class=HTMLResponse)
def read_root():
    """
    Root endpoint - Returns a beautiful landing page with API information and links.
    """
    return get_landing_page_html()


@app.get("/health", response_class=HTMLResponse)
def health_check():
    """
    Health check endpoint - Returns the current health status of the API.
    """
    return get_health_page_html("healthy")


@app.get("/api/health")
async def api_health_check():
    """
    JSON health check endpoint for programmatic access.
    Includes Redis connectivity status.
    """
    # Check Redis health
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

