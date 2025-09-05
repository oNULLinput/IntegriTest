# IntegriTest - Secure Online Examination Platform

A complete HTML/CSS/JavaScript examination system with instructor dashboard and student exam interface.

## 🚀 Quick Start

### Backend Setup (Supabase/PostgreSQL)
1. cd server && cp .env.example .env
2. Fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from your Supabase project
3. Create tables: run the SQL in `server/db/schema.sql` inside Supabase SQL editor
4. Seed at least one instructor in `instructors` with a bcrypt hash in `password_hash`
5. Optionally insert an exam row in `exams` with fields: code, title, duration, questions (JSON array)
6. Install and run: `npm install` then `npm run dev`

Server defaults to http://localhost:4000. Set CLIENT_ORIGIN if serving frontend from another origin.

### Frontend
Open `index.html` in a browser (or host via a static server). The login forms now call the backend:
- Instructor: POST /api/auth/instructor/login
- Student: POST /api/auth/student/access

### Setup Instructions

1. **Create Project Folder**