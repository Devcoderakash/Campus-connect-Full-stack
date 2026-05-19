# API Reference Document

## 1. Authentication Endpoints
All endpoints are prefix-managed under `/api/auth`.

*   **POST `/api/auth/signup`**:
    *   Creates a student profile.
    *   Payload: `{ name, email, password, role, branch, year }`
*   **POST `/api/auth/login`**:
    *   Authenticates credentials and returns a JWT token.
    *   Payload: `{ email, password }`
*   **POST `/api/auth/google`**:
    *   Verifies Google SSO access tokens.
    *   Payload: `{ token }`

---

## 2. User & Profile Endpoints
All endpoints are prefix-managed under `/api/users`.

*   **GET `/api/users/profile`** *(Protected)*:
    *   Retrieves the logged-in user's profile details.
*   **PUT `/api/users/profile`** *(Protected)*:
    *   Updates bio, skills, and social links.
*   **POST `/api/users/upload`** *(Protected)*:
    *   Uploads profile photo and college ID cards to Google Drive / Cloudinary.
    *   Payload: `FormData` with a single file parameter.

---

## 3. Mentorship & Directory Endpoints
All endpoints are prefix-managed under `/api/mentorship`.

*   **GET `/api/mentorship/seniors`** *(Protected)*:
    *   Queries active senior mentors. Supports branch, search, and page queries.
*   **POST `/api/mentorship/request`** *(Protected)*:
    *   Dispatches a connection request from a Junior to a Senior.
    *   Payload: `{ seniorId, message }`
*   **PUT `/api/mentorship/status/:id`** *(Protected, Senior/Admin Only)*:
    *   Approves or rejects an incoming mentorship request.
    *   Payload: `{ status }`

---

## 4. Study Resource Endpoints
All endpoints are prefix-managed under `/api/resources`.

*   **GET `/api/resources`** *(Protected)*:
    *   Searches notes/PYQs by branch, sem, keyword, and unit.
*   **POST `/api/resources`** *(Protected, Senior/Admin Only)*:
    *   Uploads academic files to Google Drive.
    *   Payload: `FormData` with files and metadata.

---

## 5. Socket.io Real-Time Events
*   **Connection**: Establish a connection passing the JWT under `auth.token`.
*   **`joinChat`** *(Emit)*: Joins a specific conversation room ID.
*   **`sendMessage`** *(Emit)*: Sends a real-time message payload.
*   **`receiveMessage`** *(On)*: Fires on incoming private messages.
*   **`typing`** & **`stopTyping`** *(Emit/On)*: Real-time user typing feedback indicators.
