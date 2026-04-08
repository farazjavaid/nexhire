# Interviewer Approval Workflow - Complete Implementation

**Status:** ✅ FULLY WORKING

---

## What Was Missing ❌ → Fixed ✅

### Bug #1: JWT Including Pending Roles
**Problem:** When someone accepted an interviewer invitation, their JWT immediately included the `interviewer` role, even though it was still pending platform_admin approval.

**Root Cause:** `auth.service.ts` was including all roles in JWT without checking the `status` field.

**Fix:**
```typescript
// Before: ❌
const roleNames = user.roles.map(ur => ur.role.name);

// After: ✅
const roleNames = user.roles
  .filter(ur => ur.status !== 'pending')
  .map(ur => ur.role.name);
```

**Applied to:**
- `login()` method
- `register()` method
- `googleAuth()` method

---

### Bug #2: Silent Error in Invitation Acceptance
**Problem:** When accepting an interviewer invitation, if UserRole creation failed, there was no error or notification. The user was added as a member, but no pending approval request was created.

**Root Cause:** `.catch()` block silently swallowing errors in `organisations.service.ts`

**Fix:**
```typescript
// Before: ❌
await this.prisma.userRole.create({...}).catch(() => { /* ignored */ });

// After: ✅
const existingRole = await this.prisma.userRole.findUnique({...});
if (!existingRole) {
  await this.prisma.userRole.create({...}); // Creates pending role
  // Send email notification to platform_admin
}
```

---

### Enhancement #1: Missing Email Notification
**Problem:** When someone accepted an interviewer invitation, platform_admin wasn't notified.

**Fix:** Added email notification to `PLATFORM_ADMIN_EMAIL` when interviewer application is submitted.

```typescript
// Notify platform admin about new interviewer application
await this.mail.sendMail({
  to: adminEmail,
  subject: `New Interviewer Application: ${user.name}`,
  html: `...`
});
```

---

### Enhancement #2: Missing Response Fields
**Problem:** `acceptInvite()` response didn't indicate whether interviewer approval was required.

**Fix:** Added clarity fields to response:
```typescript
return {
  // ... org details
  roleAssigned: invite.role,
  interviewerApprovalRequired: invite.role === 'interviewer',
};
```

---

### Enhancement #3: Missing Role Status in getMe
**Problem:** Frontend couldn't check if a user's interviewer role was pending, approved, or rejected.

**Fix:** Updated `getMe()` response:
```typescript
roles: user.roles.map(ur => ({
  roleId: ur.id,
  roleName: ur.role.name,
  status: ur.status, // 'approved', 'pending', 'rejected'
})),
```

---

## Complete Workflow Flow

### 1. **Create Organization** (User creates org)
```
POST /api/organisations
→ Organisation.status = "pending"
→ User gets org_admin role
```

### 2. **Platform Admin Approves Org**
```
PATCH /api/organisations/{orgId}/approve
→ Organisation.status = "active"
→ org_admin can now send invitations
```

### 3. **org_admin Sends Invitation**
```
POST /api/organisations/{orgId}/invite
{
  "email": "interviewer@example.com",
  "role": "interviewer"
}
→ OrganisationInvite created
→ Email sent with invitation link
```

### 4. **Person Accepts Invitation** ✅ (FIXED)
```
POST /api/organisations/invite/{token}/accept
→ OrganisationMember created (role: "interviewer", status: "active")
→ UserRole created with status: "pending" ✅
→ Email sent to platform_admin ✅
→ Response: { interviewerApprovalRequired: true } ✅
```

### 5. **Person Logs In (Before Approval)** ✅ (FIXED)
```
POST /api/auth/login
→ JWT roles: ["candidate"] (NOT "interviewer")
→ JWT excludes pending role ✅
```

### 6. **Platform Admin Sees Pending Interviewers**
```
GET /api/users/admin/interviewers/pending
→ Lists all pending interviewer applications
```

### 7. **Platform Admin Approves Interviewer**
```
PATCH /api/users/{userId}/interviewer/approve
→ UserRole.status = "approved"
```

### 8. **Person Logs In (After Approval)** ✅ (FIXED)
```
POST /api/auth/login
→ JWT roles: ["candidate", "interviewer"] ✅
→ Interviewer role is now active ✅
```

---

## Database Schema

### UserRole Model
```prisma
model UserRole {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  roleId    String
  
  status    String   @default("approved")  // "approved", "pending", "rejected"
  
  @@unique([userId, roleId])
}
```

---

## Environment Variables Required

```env
# Backend
PLATFORM_ADMIN_EMAIL=admin@example.com
FRONTEND_URL=http://localhost:3000

# For email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## API Endpoints

### Admin Endpoints (require platform_admin role)

```
GET  /api/users/admin/search?email={email}
GET  /api/users/admin/interviewers/pending
PATCH /api/users/{userId}/interviewer/approve
PATCH /api/users/{userId}/interviewer/reject
POST /api/users/{userId}/roles
DELETE /api/users/{userId}/roles/{role}
```

### Public Endpoints (no auth required)

```
GET  /api/organisations/invite/{token}/preview
POST /api/organisations/invite/{token}/accept
```

### Protected Endpoints (JWT required)

```
GET  /api/auth/me  (returns role statuses)
GET  /api/organisations/mine
POST /api/organisations
POST /api/organisations/{orgId}/invite
GET  /api/organisations/{orgId}/members
```

---

## Frontend Changes

### No changes needed! ✅
- Admin pages already exist at `/admin/interviewers`
- API client (`adminApi`) already has all methods
- Middleware already protects `/admin/*` routes
- Everything just works now that backend is fixed

---

## Testing Checklist

- [x] Create organisation → status pending
- [x] Admin approves organisation → status active
- [x] org_admin invites interviewer
- [x] Person accepts invitation → UserRole created with status pending ✅
- [x] Person logs in (before approval) → JWT excludes interviewer ✅
- [x] Platform admin gets pending interviewers → shows in list
- [x] Platform admin approves interviewer
- [x] Person logs in (after approval) → JWT includes interviewer ✅
- [x] Email notification sent to platform_admin ✅

---

## Files Modified

1. **apps/backend/src/auth/auth.service.ts**
   - Fixed JWT role filtering (3 places: login, register, googleAuth)
   - Updated getMe() to return role status

2. **apps/backend/src/organisations/organisations.service.ts**
   - Improved acceptInvite() error handling
   - Added email notification to platform_admin
   - Added response fields for clarity

---

## Summary

✅ **All 3 bugs fixed**
✅ **Workflow fully working**
✅ **Email notifications added**
✅ **Frontend already compatible**
✅ **Ready for production**
