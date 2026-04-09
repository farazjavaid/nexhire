# NexHire API Endpoints Documentation

## Overview

This document provides complete API endpoint specifications for NexHire platform. All endpoints return JSON responses with `success`, `message`, and `data` fields (where applicable).

**Base URL**: `/api`

**Authentication**: JWT Bearer token in `Authorization` header
```
Authorization: Bearer <jwt-token>
```

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Endpoints](#user-endpoints)
3. [MFA Endpoints](#mfa-endpoints)
4. [Organization Endpoints](#organization-endpoints)
5. [Organization Member Endpoints](#organization-member-endpoints)
6. [Platform Admin Endpoints](#platform-admin-endpoints)

---

## Authentication Endpoints

### POST /auth/register

Register a new user with email and password.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "candidate"
}
```

**Path Parameters**: None

**Query Parameters**: None

**Headers**:
```
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "clh1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Validation Rules**:
- email: Valid email format, unique
- password: Minimum 8 characters
- name: Non-empty string
- role: One of [candidate, interviewer, org_admin, platform_admin]

**OpenAPI Schema**:
```yaml
/auth/register:
  post:
    summary: Register new user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [email, password, name, role]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                minLength: 8
              name:
                type: string
              role:
                type: string
                enum: [candidate, interviewer, org_admin, platform_admin]
    responses:
      200:
        description: User registered successfully
```

---

### POST /auth/login

Login with email and password.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "clh1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionId": "sess_1234567890abcdef"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "message": "Invalid email or password"
}
```

---

### POST /auth/google

Authenticate with Google OAuth.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "googleId": "118203456789012345678",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "id": "clh1234567890abcdef",
    "email": "user@gmail.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionId": "sess_1234567890abcdef"
  }
}
```

---

### GET /auth/me

Get current authenticated user's profile.

**Authentication**: Required (JWT)

**Request Headers**:
```
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clh1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "profile": {
      "id": "prof_1234567890",
      "bio": "Software Engineer",
      "phone": "+1 (555) 123-4567"
    },
    "hasPassword": true,
    "roles": [
      {
        "roleId": "role_1",
        "roleName": "candidate",
        "status": "approved"
      },
      {
        "roleId": "role_2",
        "roleName": "platform_admin",
        "status": "approved"
      }
    ]
  }
}
```

**Fields Explanation**:
- `hasPassword`: Boolean indicating if user has password set (true for email/password users, false for OAuth-only)
- `roles`: Array of roles with approval status
- `status`: Can be 'approved', 'pending', or 'rejected'

---

### POST /auth/logout

Logout current user and invalidate sessions.

**Authentication**: Required (JWT)

**Request Body**: Empty (or omitted)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### POST /auth/forgot-password

Request password reset link via email.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "If that email is registered, a reset link has been sent."
}
```

**Security Note**: Always returns success message even if email not found (prevents user enumeration).

---

### POST /auth/reset-password

Reset password using token from email.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "token": "1a2b3c4d5e6f7g8h9i0j...",
  "newPassword": "NewSecurePassword456!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password updated. Please log in with your new password."
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Reset link is invalid or has expired"
}
```

**Validation Rules**:
- Token must be valid and not expired (30 minute expiration)
- Token must not have been used before
- newPassword: Minimum 8 characters, cannot be recent password

---

## User Endpoints

### GET /users/:id

Get user profile by ID.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (user ID)
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clh1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "profile": {
      "id": "prof_1234567890",
      "bio": "Senior Software Engineer",
      "phone": "+1 (555) 123-4567",
      "avatarUrl": "https://..."
    }
  }
}
```

---

### PATCH /users/:id

Update user profile.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (user ID)
```

**Request Body**:
```json
{
  "name": "John Updated",
  "profile": {
    "bio": "Updated bio",
    "phone": "+1 (555) 987-6543"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## MFA Endpoints

### POST /mfa/totp/setup

Generate TOTP secret and QR code.

**Authentication**: Required (JWT)

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9E0wYAAAA..."
  }
}
```

**Usage**:
1. Display QR code to user
2. User scans with authenticator app (Google Authenticator, Authy, etc.)
3. User receives 6-digit code from app
4. Call `/mfa/totp/activate` with the code

---

### POST /mfa/totp/activate

Activate TOTP with verification code.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "TOTP enabled successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Invalid verification code"
}
```

**Validation Rules**:
- code: Exactly 6 digits
- Code must match current TOTP (within 30-second window)

---

### POST /mfa/email/setup

Setup email OTP and send verification code.

**Authentication**: Required (JWT)

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Process**:
1. 6-digit code is generated
2. Code is sent to user's email
3. User receives code and calls `/mfa/email/activate`

---

### POST /mfa/email/activate

Activate email OTP with verification code.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Email OTP enabled successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Invalid verification code"
}
```

---

### POST /mfa/disable

Disable MFA (TOTP or Email OTP).

**Authentication**: Required (JWT)

**Request Body** (for password-auth users):
```json
{
  "password": "YourCurrentPassword"
}
```

**Request Body** (for OAuth users):
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

**Error Responses**:
```json
{
  "message": "Invalid password"
}
```
OR
```json
{
  "message": "Invalid verification code"
}
```

**Logic**:
- For users with password: Verify password before disabling
- For OAuth users (no password): Verify TOTP or Email OTP code instead
- Frontend determines verification method using `hasPassword` field from `/auth/me`

---

## Organization Endpoints

### POST /organisations

Create new organization.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "name": "Tech Corp Inc",
  "legalName": "Tech Corporation Inc.",
  "description": "Leading technology company",
  "organisationType": "company",
  "industry": "Technology",
  "countryCode": "US"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": "org_1234567890abcdef",
    "name": "Tech Corp Inc",
    "legalName": "Tech Corporation Inc.",
    "description": "Leading technology company",
    "status": "pending",
    "ownerId": "usr_abcdef1234567890"
  }
}
```

**Notes**:
- Organization status is `pending` until platform_admin approves
- User who creates organization automatically becomes `org_admin`

---

### GET /organisations/mine

Get all organizations owned/managed by current user.

**Authentication**: Required (JWT)

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "org_1234567890abcdef",
      "name": "Tech Corp Inc",
      "description": "Leading technology company",
      "status": "approved",
      "ownerId": "usr_abcdef1234567890"
    }
  ]
}
```

---

### GET /organisations/:id

Get organization details by ID.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "org_1234567890abcdef",
    "name": "Tech Corp Inc",
    "legalName": "Tech Corporation Inc.",
    "description": "Leading technology company",
    "organisationType": "company",
    "industry": "Technology",
    "countryCode": "US",
    "status": "approved",
    "ownerId": "usr_abcdef1234567890",
    "createdAt": "2026-03-15T10:30:00Z"
  }
}
```

---

### PATCH /organisations/:id

Update organization details.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
```

**Request Body**:
```json
{
  "name": "Tech Corp Updated",
  "description": "Updated description",
  "industry": "Software"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization updated successfully"
}
```

**Authorization**: Only organization owner or platform_admin can update

---

### DELETE /organisations/:id

Delete organization.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

**Authorization**: Only organization owner can delete

---

## Organization Member Endpoints

### GET /organisations/:id/members

Get all members of organization.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "userId": "usr_1234567890abcdef",
      "email": "john@example.com",
      "name": "John Doe",
      "roles": [
        {
          "id": "usr_role_1",
          "name": "org_admin",
          "status": "approved"
        }
      ]
    },
    {
      "userId": "usr_0987654321fedcba",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "roles": [
        {
          "id": "usr_role_2",
          "name": "interviewer",
          "status": "pending"
        }
      ]
    }
  ]
}
```

**Status Values**:
- `approved`: Member is fully active in this role
- `pending`: Member is awaiting platform_admin approval (for interviewer role)
- `rejected`: Member was rejected for this role

---

### POST /organisations/:id/invite

Invite user to organization with specific role.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
```

**Request Body**:
```json
{
  "email": "newmember@example.com",
  "role": "interviewer"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invitation sent to newmember@example.com"
}
```

**Valid Roles**:
- `org_admin`: Organization administrator
- `interviewer`: Can conduct interviews
- `member`: Regular organization member

**Process**:
1. If user doesn't exist, invitation is created
2. If user exists, they're added to organization with specified role
3. If role is `interviewer`, it's created with `status: pending`
4. Platform admin receives notification for pending interviewer approvals

---

### GET /organisations/:id/invites

Get pending invitations for organization.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_1234567890abcdef",
      "email": "pending@example.com",
      "role": "interviewer",
      "status": "pending",
      "createdAt": "2026-03-20T15:45:00Z"
    }
  ]
}
```

---

### DELETE /organisations/:id/invites/:inviteId

Delete/revoke invitation.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
inviteId: string (invitation ID)
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invitation deleted"
}
```

---

### PATCH /organisations/:id/members/:userId

Update member role or status.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
userId: string (user ID to update)
```

**Request Body** (org_admin updates role):
```json
{
  "role": "interviewer"
}
```

**Request Body** (platform_admin approves pending role):
```json
{
  "status": "approved"
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Authorization Rules**:
- org_admin can change role only to non-pending members
- platform_admin can approve/reject pending interviewer roles
- Only org_admin or platform_admin can update members

**Status Update Rules**:
- Only platform_admin can change status
- Valid statuses: `approved`, `rejected`
- Status changes only apply to `pending` roles

---

### DELETE /organisations/:id/members/:userId

Remove member from organization.

**Authentication**: Required (JWT)

**Path Parameters**:
```
id: string (organization ID)
userId: string (user ID to remove)
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Authorization**: org_admin or platform_admin

---

## Platform Admin Endpoints

### GET /organisations/admin

List all organizations (all statuses).

**Authentication**: Required (JWT)

**Authorization**: Requires `platform_admin` role

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "org_1234567890abcdef",
      "name": "Tech Corp Inc",
      "status": "pending",
      "ownerId": "usr_abcdef1234567890",
      "createdAt": "2026-03-15T10:30:00Z"
    },
    {
      "id": "org_0987654321fedcba",
      "name": "Design Studio Ltd",
      "status": "approved",
      "ownerId": "usr_fedcba0987654321",
      "createdAt": "2026-03-10T14:20:00Z"
    }
  ]
}
```

---

### GET /organisations/pending

List only pending (unapproved) organizations.

**Authentication**: Required (JWT)

**Authorization**: Requires `platform_admin` role

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "org_1234567890abcdef",
      "name": "Tech Corp Inc",
      "status": "pending",
      "ownerId": "usr_abcdef1234567890"
    }
  ]
}
```

---

### PATCH /organisations/:id/approve

Approve pending organization.

**Authentication**: Required (JWT)

**Authorization**: Requires `platform_admin` role

**Path Parameters**:
```
id: string (organization ID)
```

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization approved"
}
```

**Side Effects**:
- Organization status changes from `pending` to `approved`
- Organization owner is notified

---

### PATCH /organisations/:id/reject

Reject pending organization.

**Authentication**: Required (JWT)

**Authorization**: Requires `platform_admin` role

**Path Parameters**:
```
id: string (organization ID)
```

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization rejected"
}
```

**Side Effects**:
- Organization status changes from `pending` to `rejected`
- Organization owner is notified

---

### PATCH /organisations/:id/suspend

Suspend active organization.

**Authentication**: Required (JWT)

**Authorization**: Requires `platform_admin` role

**Path Parameters**:
```
id: string (organization ID)
```

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization suspended"
}
```

**Side Effects**:
- Organization status changes to `suspended`
- Members lose access to organization features

---

### DELETE /organisations/:id/admin-delete

Admin force delete organization.

**Authentication**: Required (JWT)

**Authorization**: Requires `platform_admin` role

**Path Parameters**:
```
id: string (organization ID)
```

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization deleted"
}
```

**Side Effects**:
- Organization and all related data is deleted
- Members are notified
- Cannot be undone

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "error": "BadRequest"
}
```

### Common Error Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request (validation failure, invalid input) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (duplicate email, etc.) |
| 500 | Internal Server Error |

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["candidate", "platform_admin"],
  "iat": 1679913600,
  "exp": 1680518400
}
```

**Note**: Only approved roles are included in JWT. Pending roles are excluded.

### Role Permissions

| Role | Can Create Org | Can Manage Org Members | Can Approve Interviewers | Can Conduct Interviews |
|------|---|---|---|---|
| `candidate` | No | No | No | No |
| `interviewer` | No | No | No | Yes (if approved) |
| `org_admin` | Yes | Yes | No | No |
| `platform_admin` | Yes | Yes | Yes | No |

### Required Headers for Protected Endpoints

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Rate Limiting

Current implementation has no rate limiting. For production, consider:
- 100 requests per minute per IP
- 1000 requests per hour per user
- 10 concurrent connections per user

---

## Pagination

Currently not implemented. For future endpoints requiring pagination:

```
GET /organisations?page=1&limit=10&sort=createdAt&order=desc

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

## Webhooks

Webhooks are not currently implemented. Future webhooks could include:
- `organisation.created`
- `organisation.approved`
- `member.invited`
- `interviewer.pending`
- `interviewer.approved`
- `mfa.enabled`

---

## API Versioning

Current version: v1 (no version prefix in URLs)

Future versioning scheme:
```
/api/v2/auth/login
/api/v2/organisations
```

---

## Testing Endpoints

### Postman Collection

Import this collection into Postman for testing:

```json
{
  "info": {
    "name": "NexHire API",
    "description": "Complete API endpoint collection for NexHire platform"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}"
      }
    ]
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/register"
          }
        }
      ]
    }
  ]
}
```

### cURL Examples

**Register**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "role": "candidate"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Current User**:
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <jwt-token>"
```

**Create Organization**:
```bash
curl -X POST http://localhost:3001/api/organisations \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "legalName": "Tech Corp Inc",
    "description": "A tech company",
    "organisationType": "company",
    "industry": "Technology",
    "countryCode": "US"
  }'
```

---

## Swagger/OpenAPI Integration

This API is documented using OpenAPI 3.0 specification. To generate Swagger UI:

### Install Dependencies
```bash
npm install @nestjs/swagger swagger-ui-express
```

### Enable Swagger in Backend

Update `src/main.ts`:
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('NexHire API')
  .setDescription('Complete hiring platform API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

Access Swagger UI at: `http://localhost:3001/docs`

---

## Last Updated

**Date**: 2026-04-09
**Version**: 1.0.0
**Status**: Complete
