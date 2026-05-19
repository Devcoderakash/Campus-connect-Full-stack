# Product Requirements Document (PRD)

## 1. Introduction
Campus Connect is a premium web platform designed to bridge the gap between junior and senior university students. It serves as a unified digital hub for sharing study resources (notes, PYQs, assignments), real-time peer mentorship, verified academic updates, and secure communication.

---

## 2. Target Audience
*   **Juniors (Year 1 Students)**: Looking for guidance, notes, past papers (PYQs), and mentorship to navigate their academic journey.
*   **Seniors (Year 2-4 Students)**: Willing to guide juniors, share notes, upload educational assets, and act as verified mentors.
*   **Admins**: University moderators responsible for verifying senior identities, managing study assets, and broadcasting verified updates.

---

## 3. Core Features
### 3.1 Authentication & Profile Completion
*   Secure Email & Password authentication.
*   Single Sign-On (SSO) via Google OAuth.
*   Comprehensive Profile Completion Wizard:
    *   Basic info (Name, Email, Role, Year, Department).
    *   College ID Card upload for Senior verification.
    *   Skills, Bio, and LinkedIn/GitHub social integration.

### 3.2 Mentorship & Senior Directory
*   Searchable Directory of seniors with advanced filtering by branch, year, and skills.
*   Request Mentorship modal enabling juniors to send connection requests with customizable intro notes.
*   Pending queue for Seniors to approve/reject incoming mentorship requests.
*   Live mentorship status tracking.

### 3.3 Study Resources Explorer
*   Aggregated search & filter system for Notes, PYQs, Assignments, and Syllabus.
*   Filter by Branch, Year, Semester, Unit, and Type.
*   Secure download/preview of PDF, DOCX, and PPT files streamed from Google Drive.
*   Dynamic upload modal for Seniors & Admins.

### 3.4 Real-time Peer Chat
*   Instant messaging between approved mentor-mentee connections.
*   Typing indicators, message read-receipts, and historical persistence.
*   Optimistic UI updates for ultra-low latency response feel.

### 3.5 Verification Queue (Admin Panel)
*   Visual queue of pending Senior verification applications.
*   College ID Card preview (Image/PDF support) with Zoom capabilities.
*   Single-click Accept or Rejection with custom feedback (e.g., "blurry photo, please re-upload").

---

## 4. User Experience & Aesthetics
*   **Glassmorphism & Modern UI**: Vibrant background meshes, dynamic shadows, borders, and smooth transitions.
*   **Vibrant Color Palette**: Harmonic, tailored dark/light theme supporting responsive layouts.
*   **Micro-Animations**: Hover animations on links and dashboard cards via Framer Motion to provide premium feel.
