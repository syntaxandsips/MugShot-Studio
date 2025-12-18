from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from main import app

client = TestClient(app)

def test_auth_start_exists():
    with patch("app.api.v1.endpoints.auth.get_supabase") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock response for existing user
        mock_response = MagicMock()
        mock_response.data = [{"id": "123", "password_hash": "hashed"}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        response = client.post("/api/v1/auth/start", json={"email": "test@example.com"})
        assert response.status_code == 200
        assert response.json() == {"exists": True, "next": "password"}

def test_auth_start_new():
    with patch("app.api.v1.endpoints.auth.get_supabase") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock response for non-existing user
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        response = client.post("/api/v1/auth/start", json={"email": "new@example.com"})
        assert response.status_code == 200
        assert response.json() == {"exists": False, "next": "create_account"}

def test_signup_success():
    with patch("app.api.v1.endpoints.auth.get_supabase") as mock_get_supabase, \
         patch("app.api.v1.endpoints.auth.get_password_hash") as mock_hash:
        
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        mock_hash.return_value = "hashed_secret"
        
        # Mock username check (empty = unique)
        mock_user_check = MagicMock()
        mock_user_check.data = []
        
        # Mock insert response
        mock_insert_res = MagicMock()
        mock_insert_res.data = [{"id": "new_user_uuid"}]
        
        # Setup chain for select (username check) and insert
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_user_check
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_res
        
        payload = {
            "email": "new@example.com",
            "password": "secretpassword",
            "confirm_password": "secretpassword",
            "username": "newuser",
            "full_name": "New User",
            "dob": "2000-01-01"
        }
        
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 201
        assert response.json() == {"user_id": "new_user_uuid", "next": "confirm_email"}
