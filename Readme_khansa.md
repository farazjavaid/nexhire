# NexHire - Hiring & Recruitment Platform

## 📋 Overview

NexHire is a comprehensive hiring and recruitment platform built with modern web technologies. It provides organizations with tools to manage hiring workflows, conduct interviews, and track candidate progress. The platform includes role-based access control, multi-factor authentication, and complete organization management capabilities.

### Key Features
- **Authentication**: Email/password registration, Google OAuth, JWT-based sessions
- **Multi-Factor Authentication (MFA)**: TOTP (Google Authenticator) and Email OTP support
- **Role-Based Access Control (RBAC)**: Platform admin, organization admin, interviewer, and candidate roles
- **Organization Management**: Create and manage organizations, invite members, set up interviewers
- **Interviewer Approval Workflow**: Platform admins approve interviewers before they can conduct interviews
- **Password Reset**: Secure token-based password reset functionality
- **Session Management**: Multi-session support with expiration handling

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, Passport.js strategies (Google OAuth, JWT)
- **MFA**: Speakeasy (TOTP generation), QRCode (QR code generation)
- **Email**: Nodemailer/SMTP integration
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **UI Components**: Custom + shadcn/ui components

### Database
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Migrations**: Prisma Migrate

---

## 📦 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v14 or higher
- **Git**: For version control

### Required Environment
- Google OAuth credentials (from Google Cloud Console)
- SMTP email service credentials (Gmail, SendGrid, etc.)
- A frontend URL (for password reset links)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/farazjavaid/nexhire.git
cd nexyr
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Dependencies are auto-installed for apps/backend and apps/frontend
```

### 3. Setup Database

#### Create PostgreSQL Database
```bash
# Create database (adjust connection string as needed)
createdb nexhire_db

# Or via psql:
psql -U postgres
CREATE DATABASE nexhire_db;
\q
```

#### Configure Database Connection
Create or update `.env` file in `apps/backend/`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexhire_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Platform Admin Email (user with this email gets platform_admin role)
PLATFORM_ADMIN_EMAIL="admin@example.com"

# Frontend URL (for password reset links)
FRONTEND_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback"

# Email Configuration (SMTP)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-specific-password"
MAIL_FROM="noreply@nexhire.com"
MAIL_FROM_NAME="NexHire"
```

#### Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate --schema=packages/db/prisma/schema.prisma

# Run migrations to create tables
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma

# Or reset database (WARNING: deletes all data)
bash reset-db.sh
```

### 4. Setup Frontend Environment

Create `.env.local` in `apps/frontend/`:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit `apps/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## ▶️ Running the Application

### Development Mode

#### Terminal 1 - Backend
```bash
npm run dev:backend
# Runs on http://localhost:3001
```

#### Terminal 2 - Frontend
```bash
npm run dev:frontend
# Runs on http://localhost:3000
```

#### Terminal 3 - Database (optional, if using docker)
```bash
docker-compose up postgres
```

### Production Build

```bash
# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Start backend
npm run start:backend

# Start frontend
npm run start:frontend
```

---

## 📁 Project Structure

```
nexyr/
├── apps/
│   ├── backend/              # NestJS backend application
│   │   ├── src/
│   │   │   ├── auth/         # Authentication (register, login, logout, password reset)
│   │   │   ├── mfa/          # Multi-Factor Authentication (TOTP, Email OTP)
│   │   │   ├── organisations/# Organization management and member workflows
│   │   │   ├── users/        # User management and profiles
│   │   │   ├── common/       # Shared guards, utilities, decorators
│   │   │   ├── lib/          # External services (mail, etc.)
│   │   │   ├── db/           # Prisma service and database connection
│   │   │   ├── app.module.ts # Root module
│   │   │   └── main.ts       # Application entry point
│   │   ├── .env.example      # Environment variables template
│   │   ├── package.json      # Backend dependencies
│   │   └── tsconfig.json     # TypeScript configuration
│   │
│   └── frontend/             # Next.js frontend application
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/   # Authentication pages (login, register, etc.)
│       │   │   ├── (DashboardLayout)/ # Dashboard pages
│       │   │   ├── api/      # API route handlers
│       │   │   └── layout.tsx# Root layout
│       │   ├── components/   # Reusable React components
│       │   ├── lib/          # Frontend utilities and API client
│       │   └── styles/       # Global styles
│       ├── public/           # Static assets
│       ├── next.config.js    # Next.js configuration
│       ├── tailwind.config.js# Tailwind CSS configuration
│       ├── .env.example      # Environment variables template
│       └── package.json      # Frontend dependencies
│
└── packages/
    └── db/                   # Shared database schema and Prisma
        ├── prisma/
        │   └── schema.prisma # Database schema definition
        └── src/
            └── lib/          # Prisma service for backend/frontend
```

---

## 📝 Available Scripts

### Backend Scripts
```bash
npm run dev:backend      # Start backend in development mode with hot reload
npm run build:backend    # Build backend for production
npm run start:backend    # Start production backend
npm run lint:backend     # Run ESLint
```

### Frontend Scripts
```bash
npm run dev:frontend     # Start frontend in development mode
npm run build:frontend   # Build frontend for production
npm run start:frontend   # Start production frontend
npm run lint:frontend    # Run ESLint
```

### Database Scripts
```bash
bash reset-db.sh         # Reset database (drops all data and reruns migrations)
npx prisma studio       # Open Prisma Studio (visual database browser)
npx prisma migrate dev   # Create new migration
```

### Utility Scripts
```bash
npm run clean            # Remove node_modules and build artifacts
npm run install-all      # Install dependencies for all apps
```

---

## 🔐 Authentication Flows

### 1. Email/Password Registration

**Request**:
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "candidate"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-id-123",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "jwt-token-here"
  }
}
```

### 2. Email/Password Login

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user-id-123",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "jwt-token-here",
    "sessionId": "session-id-123"
  }
}
```

### 3. Google OAuth Login

**Request**:
```http
POST /api/auth/google
Content-Type: application/json

{
  "googleId": "google-id-here",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://example.com/photo.jpg"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "id": "user-id-123",
    "email": "user@gmail.com",
    "name": "John Doe",
    "token": "jwt-token-here",
    "sessionId": "session-id-123"
  }
}
```

### 4. Get Current User

**Request**:
```http
GET /api/auth/me
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-id-123",
    "email": "user@example.com",
    "name": "John Doe",
    "profile": { "bio": "Software Engineer", "phone": "+1234567890" },
    "hasPassword": true,
    "roles": [
      {
        "roleId": "role-id-1",
        "roleName": "candidate",
        "status": "approved"
      }
    ]
  }
}
```

### 5. Logout

**Request**:
```http
POST /api/auth/logout
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 6. Forgot Password

**Request**:
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "If that email is registered, a reset link has been sent."
}
```

### 7. Reset Password

**Request**:
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass456!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password updated. Please log in with your new password."
}
```

---

## 🔒 Multi-Factor Authentication (MFA)

### 1. Setup TOTP (Google Authenticator)

**Request**:
```http
POST /api/mfa/totp/setup
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

### 2. Activate TOTP

**Request**:
```http
POST /api/mfa/totp/activate
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "TOTP enabled successfully"
}
```

### 3. Setup Email OTP

**Request**:
```http
POST /api/mfa/email/setup
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### 4. Activate Email OTP

**Request**:
```http
POST /api/mfa/email/activate
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email OTP enabled successfully"
}
```

### 5. Disable MFA

**For password-auth users (send password)**:
```http
POST /api/mfa/disable
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "password": "YourCurrentPassword"
}
```

**For OAuth users (send OTP code)**:
```http
POST /api/mfa/disable
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

---

## 🏢 Organization Management

### 1. Create Organization

**Request**:
```http
POST /api/organisations
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "Tech Corp Inc",
  "legalName": "Tech Corporation Inc.",
  "description": "Leading tech company",
  "organisationType": "company",
  "industry": "Technology",
  "countryCode": "US"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "org-id-123",
    "name": "Tech Corp Inc",
    "status": "pending",
    "ownerId": "user-id-123"
  }
}
```

### 2. Get My Organizations

**Request**:
```http
GET /api/organisations/mine
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "org-id-123",
      "name": "Tech Corp Inc",
      "status": "approved",
      "ownerId": "user-id-123"
    }
  ]
}
```

### 3. Get Organization Details

**Request**:
```http
GET /api/organisations/:id
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "org-id-123",
    "name": "Tech Corp Inc",
    "description": "Leading tech company",
    "status": "approved",
    "ownerId": "user-id-123"
  }
}
```

### 4. Update Organization

**Request**:
```http
PATCH /api/organisations/:id
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "description": "Updated description",
  "name": "Tech Corp Updated"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Organization updated successfully"
}
```

### 5. Delete Organization

**Request**:
```http
DELETE /api/organisations/:id
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

---

## 👥 Organization Members & Interviewers

### 1. Get Organization Members

**Request**:
```http
GET /api/organisations/:id/members
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-id-123",
      "email": "john@example.com",
      "name": "John Doe",
      "roles": [
        {
          "id": "role-id-1",
          "name": "org_admin",
          "status": "approved"
        }
      ]
    },
    {
      "userId": "user-id-456",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "roles": [
        {
          "id": "role-id-2",
          "name": "interviewer",
          "status": "pending"
        }
      ]
    }
  ]
}
```

### 2. Invite Member to Organization

**Request**:
```http
POST /api/organisations/:id/invite
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "interviewer"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invitation sent to newmember@example.com"
}
```

### 3. Update Organization Member Role

**Request**:
```http
PATCH /api/organisations/:id/members/:userId
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "role": "interviewer",
  "status": "approved"
}
```

**Note**: The `status` field is used by platform admins to approve/reject pending interviewer roles.

**Response**:
```json
{
  "success": true
}
```

### 4. Remove Member from Organization

**Request**:
```http
DELETE /api/organisations/:id/members/:userId
Authorization: Bearer jwt-token-here
```

**Response**:
```json
{
  "success": true
}
```

---

## 🔍 Platform Admin Endpoints

### 1. List All Organizations

**Request**:
```http
GET /api/organisations/admin
Authorization: Bearer jwt-token-here
```

**Requires**: `platform_admin` role

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "org-id-123",
      "name": "Tech Corp",
      "status": "pending"
    }
  ]
}
```

### 2. List Pending Organizations

**Request**:
```http
GET /api/organisations/pending
Authorization: Bearer jwt-token-here
```

**Requires**: `platform_admin` role

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "org-id-123",
      "name": "Tech Corp",
      "status": "pending"
    }
  ]
}
```

### 3. Approve Organization

**Request**:
```http
PATCH /api/organisations/:id/approve
Authorization: Bearer jwt-token-here
```

**Requires**: `platform_admin` role

**Response**:
```json
{
  "success": true,
  "message": "Organization approved"
}
```

### 4. Reject Organization

**Request**:
```http
PATCH /api/organisations/:id/reject
Authorization: Bearer jwt-token-here
```

**Requires**: `platform_admin` role

**Response**:
```json
{
  "success": true,
  "message": "Organization rejected"
}
```

### 5. Suspend Organization

**Request**:
```http
PATCH /api/organisations/:id/suspend
Authorization: Bearer jwt-token-here
```

**Requires**: `platform_admin` role

**Response**:
```json
{
  "success": true,
  "message": "Organization suspended"
}
```

### 6. Admin Delete Organization

**Request**:
```http
DELETE /api/organisations/:id/admin-delete
Authorization: Bearer jwt-token-here
```

**Requires**: `platform_admin` role

**Response**:
```json
{
  "success": true,
  "message": "Organization deleted"
}
```

---

## 📧 Role-Based Access Control (RBAC)

The platform uses 4 main roles:

| Role | Permissions |
|------|-------------|
| **platform_admin** | Manage all organizations, approve/reject interviewers, suspend organizations, view all data |
| **org_admin** | Manage organization members, invite interviewers, update organization settings |
| **interviewer** | Conduct interviews, view interview details (pending platform admin approval) |
| **candidate** | Apply for jobs, update profile, view interview status |

### Auto-Assignment Rules
- **platform_admin**: Automatically assigned to users whose email matches `PLATFORM_ADMIN_EMAIL` env var
- **org_admin**: Automatically assigned when creating an organization
- **interviewer**: Created with `status: "pending"` when org_admin assigns this role to a member
- **candidate**: Default role for new users

### Interviewer Approval Flow

1. **Org Admin invites member with interviewer role**
   - Creates `UserRole` record with `status: "pending"`
   - Sends notification to platform_admin

2. **Platform Admin reviews pending interviewers**
   - Calls `PATCH /organisations/members/:userId` with `status: "approved"`

3. **Interviewer gets JWT with `interviewer` role**
   - Only approved roles are included in JWT token

---

## 🔧 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `PLATFORM_ADMIN_EMAIL` | Email that automatically gets platform_admin role | `admin@example.com` |
| `FRONTEND_URL` | Frontend URL for password reset links | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `secret-key` |
| `GOOGLE_CALLBACK_URL` | Redirect URI for Google OAuth | `http://localhost:3001/auth/google/callback` |
| `MAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | `587` |
| `MAIL_USER` | SMTP authentication email | `your-email@gmail.com` |
| `MAIL_PASSWORD` | SMTP authentication password | `app-specific-password` |
| `MAIL_FROM` | Sender email address | `noreply@nexhire.com` |
| `MAIL_FROM_NAME` | Sender name | `NexHire` |

---

## 📊 Database Schema Overview

### Core Tables

**users**
- `id`: User identifier
- `email`: Unique email address
- `password`: Hashed password (nullable for OAuth-only users)
- `name`: User's full name
- `status`: User account status (active, suspended, etc.)
- `emailVerified`: Email verification date

**roles**
- `id`: Role identifier
- `name`: Role name (platform_admin, org_admin, interviewer, candidate)

**userRoles**
- `id`: User-role assignment identifier
- `userId`: Reference to user
- `roleId`: Reference to role
- `status`: Assignment status (approved, pending, rejected)

**organisations**
- `id`: Organization identifier
- `name`: Organization name
- `description`: Organization description
- `status`: Approval status (pending, approved, rejected, suspended)
- `ownerId`: User who created the organization

**authSessions**
- `id`: Session identifier
- `userId`: User identifier
- `expiresAt`: Session expiration time
- `createdAt`: Session creation time

**authFactors**
- `id`: MFA factor identifier
- `userId`: User identifier
- `type`: Factor type (totp, email_otp)
- `secret`: Encrypted secret or token
- `isVerified`: Whether factor is activated
- `createdAt`: Factor creation time

**passwordResetTokens**
- `id`: Token identifier
- `userId`: User identifier
- `token`: Hashed reset token
- `used`: Whether token has been used
- `expiresAt`: Token expiration time

---

## 🛡️ Security Considerations

### Password Security
- Minimum 8 characters required
- Hashed with bcrypt (12 rounds)
- Password history tracked (last 5 passwords)
- Cannot reuse recent passwords

### Session Management
- JWT tokens expire after 7 days
- Auth sessions tracked in database
- Logout deletes all user sessions
- Password reset clears all active sessions

### Password Reset Security
- Reset tokens are hashed SHA256
- Reset links expire after 30 minutes
- Tokens become invalid after first use
- Prevents user enumeration (silent failure)

### MFA Security
- TOTP uses SHA-1 with 30-second time window
- Email OTP codes are 6 digits, single use
- MFA disable requires password or OTP verification
- Pending roles excluded from JWT to prevent unauthorized access

### OAuth Security
- Google OAuth accounts verified automatically
- Email matching is case-insensitive
- OAuth users cannot reset password (no password field)
- OAuth users disable MFA with OTP instead of password

---

## 🐛 Troubleshooting

### Database Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running: `pg_isrunning`
- Check DATABASE_URL in `.env` file
- Verify postgres credentials

### Port Already in Use
```
Error: listen EADDRINUSE :::3001
```
```bash
# Kill process using port 3001
lsof -i :3001
kill -9 <PID>
```

### JWT Token Errors
```
Error: Invalid token
```
- Ensure `JWT_SECRET` matches in backend `.env`
- Check token hasn't expired
- Include `Authorization: Bearer <token>` header

### Email Not Sending
```
Error: SMTP authentication failed
```
- Verify SMTP credentials in `.env`
- For Gmail: Use app-specific password (not account password)
- Check MAIL_PORT matches server (usually 587 for TLS)

### Prisma Migration Errors
```
Error: P3019 Foreign key constraint failed
```
```bash
# Reset database and rerun migrations
bash reset-db.sh
```

### Google OAuth Issues
- Verify Google credentials in `.env`
- Check callback URL matches Google Console configuration
- Ensure frontend sends all required fields (googleId, email, firstName, lastName)

---

## 📚 Development Guidelines

### Code Organization
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and database operations
- **DTOs**: Data validation using class-validator
- **Guards**: Authentication and authorization
- **Utils**: Reusable utility functions (password hashing, JWT)

### Adding New Endpoints
1. Create DTO for request validation
2. Add method to service for business logic
3. Add route handler to controller
4. Apply appropriate guards (@UseGuards)
5. Document in ENDPOINTS_API.md

### Database Changes
1. Update schema in `packages/db/prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name <description>`
3. Test migration: `npx prisma migrate deploy`
4. Push changes: `git add . && git commit && git push`

### Testing Workflows
- Test email/password auth first
- Test Google OAuth after email auth
- Test MFA setup with QR code scanning
- Test MFA disable with password/OTP
- Test organization creation and member approval
- Test interviewer pending role workflow

---

## 🚀 Deployment

### Backend Deployment (Production)
```bash
# Set environment variables
export NODE_ENV=production
export DATABASE_URL="postgres://..."
export JWT_SECRET="production-secret-key"

# Build and start
npm run build:backend
npm run start:backend
```

### Frontend Deployment (Vercel)
```bash
# Vercel automatically deploys from Git
# Ensure environment variables are set in Vercel Dashboard
# NEXT_PUBLIC_API_URL must point to deployed backend
```

### Database Backups
```bash
# Backup PostgreSQL database
pg_dump -U postgres nexhire_db > backup.sql

# Restore from backup
psql -U postgres nexhire_db < backup.sql
```

---

## 📞 Support & Contribution

- **Issues**: Report bugs at GitHub
- **Documentation**: See ENDPOINTS_API.md for complete API reference
- **Database Diagram**: Check database schema in `packages/db/prisma/schema.prisma`

---

**Last Updated**: 2026-04-09
**Version**: 1.0.0
