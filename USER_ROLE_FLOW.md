# User Role Assignment Flow

## Registration

### NexHire (Express) - Line 11 of auth.schema.ts:
```typescript
role: z.enum(['client', 'interviewer', 'candidate', 'internal_employee']),
```
✅ Role is **required field** during registration - user chooses their role

### Nexyr (NestJS) - AuthRegister.tsx Line 32:
```typescript
const res = await authApi.register({ ...payload, role: "candidate" });
```
❌ Frontend **hardcodes role as 'candidate'** - user cannot choose!

### Backend Default - auth.service.ts Line 52:
```typescript
where: { name: role || 'candidate' },
```
✅ If no role provided, defaults to **'candidate'**

---

## Flow Diagram

```
REGISTRATION:
┌─────────────┐
│   Frontend  │
│ hardcodes   │──> role: "candidate"
│ role        │
└─────────────┘
       │
       ▼
┌──────────────────┐
│     Backend      │
│ connectOrCreate  │──> Creates/links 'candidate' role
│   user_roles     │
└──────────────────┘
       │
       ▼
   USER CREATED
   with 'candidate' role
```

---

## Login Response

### Nexyr - Login Endpoint Returns:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "token": "jwt-token",
    "sessionId": "session-id"
  }
}
```
❌ **Role NOT included in login response!**

### To Get User's Role, Must Call:
```
GET /auth/me
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "profile": { ... },
    "roles": [
      {
        "id": "role-id",
        "role": { "name": "candidate" }
      }
    ]
  }
}
```
✅ Role information is here!

---

## Summary: What is User's Default Role?

| Aspect | Answer |
|--------|--------|
| **Default Role** | `candidate` |
| **Can User Choose?** | ❌ No (frontend hardcodes) |
| **Where Assigned?** | During registration |
| **Returned in Login?** | ❌ No |
| **How to Get Role?** | Call `GET /auth/me` endpoint |
| **How Many Roles?** | Can have multiple (via UserRole table) |

---

## Issue Found: Frontend Role Selection Missing

**Current Issue:**
- NexHire allows users to select their role (client, interviewer, candidate, internal_employee)
- Nexyr frontend hardcodes all registrations as 'candidate'
- Users cannot choose their role during registration

**Fix Needed:**
```typescript
// CURRENT (Line 32 AuthRegister.tsx):
const res = await authApi.register({ ...payload, role: "candidate" });

// SHOULD BE:
const roleSelect = /* get from user input */;
const res = await authApi.register({ ...payload, role: roleSelect });
```

---

## Also: Frontend Should Call GET /auth/me After Login

Current flow:
1. User logs in → receives token + sessionId
2. Frontend stores token in localStorage
3. ❌ Frontend doesn't fetch user roles

**Should be:**
1. User logs in → receives token
2. Frontend stores token
3. ✅ Frontend calls `GET /auth/me` → gets user profile + **roles**
4. Frontend stores role in AuthContext
5. Frontend can now check user role for conditional rendering

---

## Code Reference

| File | What | Line |
|------|------|------|
| `auth.service.ts` | Default role logic | 52 |
| `AuthRegister.tsx` | Hardcoded role | 32 |
| `auth.service.ts` | Login response | 134-144 |
| `auth.service.ts` | getMe endpoint | 159-185 |

---

## NexHire Comparison

**NexHire Frontend (React):**
```typescript
// Users can select their role
const roleSelect = watch("role"); // from form input
await authApi.register({ ...data, role: roleSelect });
```

**Nexyr Frontend (Next.js):**
```typescript
// Hardcoded as 'candidate'
await authApi.register({ ...payload, role: "candidate" });
```

**Issue:** Feature regression from NexHire to Nexyr! ⚠️
