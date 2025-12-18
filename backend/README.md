# MugShot Studio Backend

FastAPI backend for MugShot Studio, handling authentication, image generation jobs, and chat sessions.

## Features

- **Serverless-Ready**: Optimized for deployment on Vercel, AWS Lambda, and other serverless platforms
- **Upstash Redis**: Uses Upstash Redis REST API for rate limiting and token storage (serverless-compatible)
- **Background Tasks**: Uses FastAPI's BackgroundTasks instead of Celery for job processing
- **Multi-Provider AI**: Supports Gemini, ByteDance Seedream, and Fal.ai for image generation

## Setup

1.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in the values.
    ```bash
    cp .env.example .env
    ```
    Required variables:
    - `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - `PROFILE_PHOTOS_BUCKET`, `USER_ASSETS_BUCKET`, `RENDERS_BUCKET` (optional, defaults provided)
    - `JWT_SECRET` (Generate a secure random string)
    - `GEMINI_API_KEY`, `BYTEDANCE_API_KEY`, `FAL_KEY`
    - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (from Upstash Console)

    To generate a secure JWT secret, you can use:
    ```bash
    openssl rand -hex 32
    ```
    Or in Python:
    ```bash
    python -c "import secrets; print(secrets.token_hex(32))"
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run Migrations**:
    Apply the SQL schema to your Supabase database.
    ```bash
    ./migrations/apply_migrations.sh
    ```
    Or copy the content of `migrations/001_initial_schema.sql` and run it in the Supabase SQL Editor.

4.  **Configure Supabase Storage**:
    The storage buckets can be created automatically using the setup script:
    ```bash
    python scripts/setup_storage_buckets.py
    ```
    
    This will create the following storage buckets with the correct configurations:
    - `profile_photos` - for user profile pictures (public read, owner write)
    - `user_assets` - for general user assets (references, selfies, etc.) (private read/write for owners)
    - `renders` - for generated thumbnail images (public read, backend write only)

    You can customize these bucket names by setting the corresponding environment variables:
    - `PROFILE_PHOTOS_BUCKET`
    - `USER_ASSETS_BUCKET`
    - `RENDERS_BUCKET`

    Alternatively, you can create the buckets manually:
    1. Go to your Supabase Dashboard
    2. Navigate to Storage → Buckets
    3. Click "New Bucket" and create each bucket with the appropriate settings:
       - `profile_photos`: Public bucket
       - `user_assets`: Private bucket
       - `renders`: Public bucket
    4. Apply the storage policies from `migrations/002_storage_buckets_setup.sql` in the SQL Editor
    
    Helper scripts are also available in the `scripts/` directory:
    ```bash
    # For guidance on setting up buckets
    python scripts/setup_storage_buckets.py
    
    # To get SQL commands for RLS policies (Unix/MacOS)
    chmod +x scripts/apply_storage_policies.sh
    scripts/apply_storage_policies.sh
    
    # To get SQL commands for RLS policies (Windows)
    scripts\apply_storage_policies.bat
    ```

## Running Locally

### Quick Start (Recommended)
```bash
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
The API will start on port 8000. Background tasks run in the same process.

### Using Docker Compose
```bash
docker-compose up --build
```
This starts the API on port 8000.

## Deployment

### Vercel (Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Configure environment variables in Vercel dashboard
3. Deploy: `vercel --prod`

The `vercel.json` configuration is already set up for Python serverless functions.

### Traditional Server
For traditional server deployments, you can still use uvicorn:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```


## Upstash Redis Setup

1. Create a free Redis database at [console.upstash.com](https://console.upstash.com)
2. Copy the REST API credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Add them to your environment variables

## Testing

```bash
pytest
```

## API Documentation

Once running, visit `http://localhost:8000/api/v1/docs` for Swagger UI.

## API Endpoints

### Authentication

#### POST `/api/v1/auth/start`
Check if user exists by email.
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "exists": true/false, "next": "password/create_account/social_login" }`
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/auth/start" \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com"}'
  ```

#### POST `/api/v1/auth/signup`
Create a new user account.
- **Request Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "confirm_password": "securepassword",
    "username": "uniqueusername",
    "full_name": "User Name",
    "dob": "1990-01-01"
  }
  ```
- **Response**: `{ "user_id": "uuid", "next": "confirm_email" }`
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "securepassword",
      "confirm_password": "securepassword",
      "username": "uniqueusername",
      "full_name": "User Name",
      "dob": "1990-01-01"
    }'
  ```

#### POST `/api/v1/auth/signin`
Sign in to an existing account.
- **Request Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: `{ "access_token": "jwt_token", "token_type": "bearer", "user": {user_object} }`
- **Authentication**: None (required for sign-in)
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "securepassword"
    }'
  ```

#### POST `/api/v1/auth/confirm`
Confirm email address.
- **Request Body**: `{ "token": "confirmation_token" }`
- **Response**: `{ "message": "Email confirmed" }`
- **Authentication**: None
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/auth/confirm" \
    -H "Content-Type: application/json" \
    -d '{"token": "confirmation_token"}'
  ```

### Projects

#### POST `/api/v1/projects/`
Create a new thumbnail project.
- **Request Body**: 
  ```json
  {
    "mode": "design",
    "platform": "youtube",
    "width": 1920,
    "height": 1080,
    "headline": "Title",
    "subtext": "Subtitle",
    "vibe": "professional",
    "model_pref": "nano_banana"
  }
  ```
- **Response**: Project object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/projects/" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "mode": "design",
      "platform": "youtube",
      "width": 1920,
      "height": 1080,
      "headline": "Title",
      "subtext": "Subtitle",
      "vibe": "professional",
      "model_pref": "nano_banana"
    }'
  ```

#### GET `/api/v1/projects/{project_id}`
Get project details.
- **Response**: Project object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X GET "http://localhost:8000/api/v1/projects/PROJECT_ID" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

#### PATCH `/api/v1/projects/{project_id}`
Update project details.
- **Request Body**: Partial project object with fields to update
- **Response**: Updated project object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X PATCH "http://localhost:8000/api/v1/projects/PROJECT_ID" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"headline": "Updated Title"}'
  ```

### Assets

#### POST `/api/v1/assets/upload`
Upload an asset (image).
- **Form Data**: 
  - `file`: Image file
  - `type`: Type of asset (selfie, ref, copy_target, profile_photo)
- **Response**: Asset object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/assets/upload" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "file=@image.jpg" \
    -F "type=profile_photo"
  ```

### Jobs

#### POST `/api/v1/jobs/`
Queue a thumbnail generation job.
- **Request Body**: 
  ```json
  {
    "project_id": "uuid",
    "quality": "std",
    "variants": 2,
    "model": "nano_banana"
  }
  ```
- **Response**: `{ "id": "job_id", "status": "queued", "cost_credits": 2 }`
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/jobs/" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "project_id": "project_uuid",
      "quality": "std",
      "variants": 2,
      "model": "nano_banana"
    }'
  ```

#### GET `/api/v1/jobs/{job_id}`
Get job status.
- **Response**: Job status object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X GET "http://localhost:8000/api/v1/jobs/JOB_ID" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

### Chat

#### POST `/api/v1/chat/new`
Create a new chat session.
- **Request Body**: `{ "session_name": "Chat Name" }` (optional)
- **Response**: `{ "chat_id": "uuid", "url": "https://localhost/c/{chat_id}" }`
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/chat/new" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"session_name": "My Chat"}'
  ```

#### GET `/api/v1/chat/{chat_id}`
Get chat details.
- **Response**: Chat object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X GET "http://localhost:8000/api/v1/chat/CHAT_ID" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

#### GET `/api/v1/chat/{chat_id}/messages`
Get chat messages.
- **Response**: Array of message objects
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X GET "http://localhost:8000/api/v1/chat/CHAT_ID/messages" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

#### POST `/api/v1/chat/{chat_id}/messages`
Send a message to a chat.
- **Request Body**: 
  ```json
  {
    "content": "Message content",
    "sender": "user"
  }
  ```
- **Response**: Message object
- **Authentication**: Required (JWT Bearer Token)
- **Example**:
  ```bash
  curl -X POST "http://localhost:8000/api/v1/chat/CHAT_ID/messages" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "content": "Hello!",
      "sender": "user"
    }'
  ```

## Project Structure

- `app/core`: Configuration, auth logic, Redis integration, and rate limiting.
- `app/api/v1/endpoints`: API Routes (Auth, Assets, Chat, Jobs, Projects, Profile).
- `app/services`: Provider integrations (Gemini, ByteDance, Fal) and background task processing.
- `app/services/background_tasks.py`: Async job processor for thumbnail generation.
- `migrations`: SQL migration files.

## Architecture Notes

### Serverless Compatibility
- Uses Upstash Redis REST API instead of traditional Redis (no persistent connections needed)
- Uses FastAPI BackgroundTasks instead of Celery (no separate worker process)
- Optimized dependencies to keep deployment package under 250MB

### Rate Limiting
Rate limiting uses Upstash Redis with a fail-open policy. If Redis is unavailable, requests are allowed through to prevent service disruption.