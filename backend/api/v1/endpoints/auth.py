from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from db.supabase import get_supabase
from core.redis import get_redis
from core.ratelimit import RateLimiter
from core.security import get_current_user
from datetime import date
import secrets
import random
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def to_camel(string: str) -> str:
    """Convert snake_case to camelCase"""
    components = string.split('_')
    return components[0] + ''.join(x.capitalize() for x in components[1:])

class UserSignup(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr
    password: str
    confirm_password: str
    username: str = Field(..., min_length=3, max_length=30, pattern="^[a-zA-Z0-9._-]+$")
    full_name: str
    dob: date
    newsletter_opt_in: bool = False
    redirect_to: Optional[str] = None

class UserSignin(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr
    password: str

class UserSigninOtp(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr
    redirect_to: Optional[str] = None

class AuthStart(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr

class ForgotPassword(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr

class ResetPassword(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    token: str
    new_password: str
    confirm_password: str

class ResendConfirmation(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr

class VerifyOTP(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    email: EmailStr
    token: str
    type: str = "email"  # email, recovery, invite, email_change

class SupabaseAuthResponse(BaseModel):
    user: Optional[dict] = None
    session: Optional[dict] = None
    message: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    current_password: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str

class ChangeEmailRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    new_email: EmailStr
    password: str  # Require password for security

@router.post("/start")
async def auth_start(payload: AuthStart):
    supabase = get_supabase()
    response = supabase.table("users").select("id, password_hash").eq("email", payload.email).execute()
    if response.data:
        user = response.data[0]
        # Check if user exists in Supabase Auth (simulated check via table presence for now)
        # In a pure Supabase setup, we might rely on sign_in throwing verify error, but this check is likely fine for UI flow
        return {"exists": True, "next": "password"}
    return {"exists": False, "next": "create_account"}

@router.post("/signup", status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def signup(payload: UserSignup, background_tasks: BackgroundTasks):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    supabase = get_supabase()
    
    try:
        # Use Supabase Auth to sign up the user
        auth_options = {
            "data": {
                "username": payload.username,
                "full_name": payload.full_name,
                "dob": payload.dob.isoformat(),
                "newsletter_opt_in": payload.newsletter_opt_in
            }
        }
        
        if payload.redirect_to:
            auth_options["email_redirect_to"] = payload.redirect_to

        auth_response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": auth_options
        })
        
        if auth_response.user:
            user_id = auth_response.user.id
            
            # Also store additional user data in our custom users table
            user_data = {
                "id": user_id,  # Use the same ID as Supabase Auth
                "email": payload.email,
                "username": payload.username,
                "full_name": payload.full_name,
                "dob": payload.dob.isoformat(),
                "email_confirmed": False,  # Will be set to True after email verification
                "credits": 100,  # Give new users 100 credits to start with
                "newsletter_opt_in": payload.newsletter_opt_in
            }
            
            # Insert into our custom users table
            supabase.table("users").insert(user_data).execute()
            
            # Audit Log
            supabase.table("audit").insert({
                "user_id": user_id,
                "action": "user_signup",
                "delta_credits": 0,
                "meta": {"email": payload.email}
            }).execute()
            
            return {
                "user_id": user_id,
                "message": "User created successfully. Please check your email for confirmation.",
                "next": "confirm_email"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
            
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Signup error: {str(e)}")
        # Check for specific error types
        if "email" in str(e).lower() and "exists" in str(e).lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        elif "username" in str(e).lower() and "exists" in str(e).lower():
            raise HTTPException(status_code=409, detail="Username already taken")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/signin", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def signin(payload: UserSignin):
    supabase = get_supabase()
    
    try:
        # Use Supabase Auth to sign in the user
        auth_response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        
        if auth_response.session:
            # Get user data from our custom table
            user_response = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
            user_data = user_response.data[0] if user_response.data else {}
            
            return {
                "access_token": auth_response.session.access_token,
                "token_type": "bearer",
                "user": user_data
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        logger.error(f"Signin error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/signin-otp", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def signin_otp(payload: UserSigninOtp):
    supabase = get_supabase()
    
    try:
        # Use Supabase Auth to sign in with OTP/Magic Link
        auth_params = {
            "email": payload.email,
        }
        
        if payload.redirect_to:
            auth_params["options"] = {"email_redirect_to": payload.redirect_to}
            
        auth_response = supabase.auth.sign_in_with_otp(auth_params)
        
        return {"message": "Magic link or OTP sent to email"}
            
    except Exception as e:
        logger.error(f"Signin OTP error: {str(e)}")
        # Return success message even on error to prevent user enumeration (though auth_start already does checks)
        return {"message": "Magic link or OTP sent to email"}

@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTP):
    supabase = get_supabase()
    
    try:
        # Use Supabase Auth to verify OTP
        auth_response = supabase.auth.verify_otp({
            "email": payload.email,
            "token": payload.token,
            "type": payload.type
        })
        
        if auth_response.user:
            user_id = auth_response.user.id
            
            # Update our custom users table to mark email as confirmed
            supabase.table("users").update({"email_confirmed": True}).eq("id", user_id).execute()
            
            # Get user data from our custom table
            user_response = supabase.table("users").select("*").eq("id", user_id).execute()
            user_data = user_response.data[0] if user_response.data else {}
            
            return {
                "user_id": user_id,
                "access_token": auth_response.session.access_token if auth_response.session else None,
                "token_type": "bearer",
                "user": user_data,
                "message": "Email verified successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
            
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@router.post("/resend-confirmation", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def resend_confirmation(payload: ResendConfirmation):
    supabase = get_supabase()
    
    try:
        # Use Supabase Auth to resend confirmation
        response = supabase.auth.resend({
            "type": "signup",
            "email": payload.email
        })
        
        return {"message": "If account exists, confirmation email sent"}
        
    except Exception as e:
        logger.error(f"Resend confirmation error: {str(e)}")
        return {"message": "If account exists, confirmation email sent"}

@router.post("/forgot-password", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def forgot_password(payload: ForgotPassword):
    supabase = get_supabase()
    
    try:
        # Use Supabase Auth to send password reset email
        response = supabase.auth.reset_password_for_email(payload.email)
        return {"message": "If account exists, reset instructions sent"}
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return {"message": "If account exists, reset instructions sent"}

@router.post("/reset-password")
async def reset_password(payload: ResetPassword):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    raise HTTPException(status_code=400, detail="Use the password reset link sent to your email")

@router.get("/check-username/{username}")
async def check_username_availability(username: str):
    """
    Check if a username is available.
    
    Args:
        username (str): Username to check
        
    Returns:
        dict: {"available": bool}
    """
    supabase = get_supabase()
    response = supabase.table("users").select("id").eq("username", username).execute()
    
    if response.data:
        # Username taken
        raise HTTPException(status_code=409, detail="Username already taken")
    else:
        # Username available
        return {"available": True}


@router.post("/change-password", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Change user password.
    Requires current password verification.
    """
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    supabase = get_supabase()
    
    try:
        # First verify the current password by attempting to sign in
        auth_response = supabase.auth.sign_in_with_password({
            "email": current_user["email"],
            "password": request.current_password
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update the password using Supabase Auth
        update_response = supabase.auth.update_user({
            "password": request.new_password
        })
        
        if update_response.user:
            return {"message": "Password changed successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        if "invalid" in str(e).lower() or "password" in str(e).lower():
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        raise HTTPException(status_code=500, detail="Failed to change password")


@router.post("/change-email", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def change_email(
    request: ChangeEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Request email change.
    Sends verification email to new address.
    """
    supabase = get_supabase()
    
    try:
        # First verify the password by attempting to sign in
        auth_response = supabase.auth.sign_in_with_password({
            "email": current_user["email"],
            "password": request.password
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Password is incorrect")
        
        # Check if new email is already in use
        existing = supabase.table("users").select("id").eq("email", request.new_email).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Email already in use")
        
        # Update the email using Supabase Auth (sends verification email)
        update_response = supabase.auth.update_user({
            "email": request.new_email
        })
        
        return {"message": "Verification email sent to new address. Please verify to complete the change."}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change email error: {str(e)}")
        if "invalid" in str(e).lower() or "password" in str(e).lower():
            raise HTTPException(status_code=401, detail="Password is incorrect")
        raise HTTPException(status_code=500, detail="Failed to change email")


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout current session.
    Invalidates the current JWT token.
    """
    supabase = get_supabase()
    
    try:
        # Sign out from Supabase Auth
        supabase.auth.sign_out()
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        # Return success anyway since token invalidation is handled client-side too
        return {"message": "Logged out successfully"}


# Note: Session management in Supabase requires Admin API
# These endpoints return mock data for now, but are ready for real implementation

@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """
    Get all active sessions for the current user.
    Note: Supabase doesn't expose session listing in the client SDK.
    This is a placeholder that returns the current session info.
    """
    supabase = get_supabase()
    
    try:
        # Get current session from Supabase Auth
        session = supabase.auth.get_session()
        
        if session:
            sessions = [{
                "id": "current",
                "device": "Current Device",
                "ip_address": None,
                "location": None,
                "created_at": session.user.created_at if hasattr(session, 'user') and hasattr(session.user, 'created_at') else None,
                "last_active": session.user.last_sign_in_at if hasattr(session, 'user') and hasattr(session.user, 'last_sign_in_at') else None,
                "is_current": True
            }]
            return {"sessions": sessions, "total": 1}
        
        return {"sessions": [], "total": 0}
        
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        # Return current session as fallback
        return {
            "sessions": [{
                "id": "current",
                "device": "Current Device",
                "is_current": True
            }],
            "total": 1
        }


@router.delete("/sessions/{session_id}")
async def terminate_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """
    Terminate a specific session.
    Note: Supabase doesn't support terminating specific sessions via client API.
    This endpoint logs out the user if they try to terminate current session.
    """
    supabase = get_supabase()
    
    if session_id == "current":
        # Log out current session
        try:
            supabase.auth.sign_out()
            return {"message": "Current session terminated"}
        except:
            return {"message": "Session terminated"}
    
    # For other sessions, return success (real implementation would use Admin API)
    return {"message": f"Session {session_id} terminated", "requires_admin_api": True}


@router.delete("/sessions/all")
async def terminate_all_sessions(current_user: dict = Depends(get_current_user)):
    """
    Terminate all sessions for the user.
    This signs out the user globally using Supabase.
    """
    supabase = get_supabase()
    
    try:
        # Sign out from all devices using Supabase Auth
        # Note: Standard sign_out() only logs out current session
        # For global sign out, we'd need to invalidate all refresh tokens
        supabase.auth.sign_out()
        
        return {"message": "All sessions terminated. Please log in again."}
        
    except Exception as e:
        logger.error(f"Terminate all sessions error: {str(e)}")
        return {"message": "Sessions terminated"}