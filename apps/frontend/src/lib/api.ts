const BASE = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include', // Include cookies in request
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 204) return null as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error?.message || 'Something went wrong');
  return data;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (res.status === 204) return null as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || data.message || 'Upload failed');
  return data;
}

export const authApi = {
  register: async (body: { firstName: string; lastName: string; email: string; password: string; role: string }) => {
    const res = await request<{ success: boolean; data: { id: string; email: string; name: string; token: string } }>('/auth/register', { method: 'POST', body: JSON.stringify({ ...body, name: `${body.firstName} ${body.lastName}` }) });
    return {
      token: res.data.token,
      user: { id: res.data.id, email: res.data.email, firstName: body.firstName, lastName: body.lastName, role: body.role },
    };
  },
  verifySignupOtp: (body: { verificationToken: string; otp: string }) =>
    request<{ token: string; user: Record<string, unknown> }>('/auth/verify-signup', { method: 'POST', body: JSON.stringify(body) }),
  resendSignupOtp: (body: { verificationToken: string }) =>
    request<{ verificationToken: string }>('/auth/resend-signup-otp', { method: 'POST', body: JSON.stringify(body) }),
  login: async (body: { email: string; password: string }) => {
    const res = await request<{ success: boolean; data: { id: string; email: string; name: string; token: string; sessionId: string } }>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
    const nameParts = res.data.name.split(' ');
    return {
      token: res.data.token,
      user: { id: res.data.id, email: res.data.email, firstName: nameParts[0], lastName: nameParts.slice(1).join(' ') || '', role: 'user' },
      mfaToken: undefined,
      mfaType: undefined,
    };
  },
  verifyMfa: (body: { mfaToken: string; code: string }) =>
    request<{ token: string; user: Record<string, unknown> }>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  me: async () => {
    const res = await request<{ success: boolean; data: { id: string; email: string; name: string; profile: any; roles: any[]; hasPassword?: boolean } }>('/auth/me');
    const nameParts = res.data.name.split(' ');
    return {
      user: { id: res.data.id, email: res.data.email, firstName: nameParts[0], lastName: nameParts.slice(1).join(' ') || '', role: res.data.roles?.[0]?.role?.name || 'user', profile: res.data.profile, hasPassword: res.data.hasPassword },
    };
  },
};

export interface UserProfile {
  id: number;
  email: string;
  phoneNumber: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: string;
  lastLoginAt: string | null;
  interestKeywords: string[];
  createdAt: string;
  roles: string[];
  profile: {
    firstName: string;
    lastName: string;
    preferredName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    experienceYears: number | null;
    linkedinUrl: string | null;
    timezone: string;
    profileVisibility: string;
    resumeDocumentId: number | null;
    resumeFileName: string | null;
  };
}

export interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  preferredName?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  linkedinUrl?: string | null;
  timezone?: string;
  profileVisibility?: 'private' | 'public' | 'organisation';
  phoneNumber?: string | null;
  interestKeywords?: string[] | null;
}

export const mfaApi = {
  getStatus: () =>
    request<{ enabled: boolean; factors: { factor_type: string; is_active: boolean; is_primary: boolean }[] }>('/mfa/status'),
  setupTotp: () =>
    request<{ qrDataUrl: string; secret: string }>('/mfa/totp/setup', { method: 'POST' }),
  activateTotp: (body: { code: string }) =>
    request<{ message: string }>('/mfa/totp/activate', { method: 'POST', body: JSON.stringify(body) }),
  setupEmail: () =>
    request<{ message: string }>('/mfa/email/setup', { method: 'POST' }),
  activateEmail: (body: { code: string }) =>
    request<{ message: string }>('/mfa/email/activate', { method: 'POST', body: JSON.stringify(body) }),
  disable: (body: { password?: string; code?: string; factorType?: 'totp' | 'email' }) =>
    request<{ message: string }>('/mfa/disable', { method: 'POST', body: JSON.stringify(body) }),
};

export interface Organisation {
  id: string;
  legalName: string;
  tradingName: string | null;
  organisationType: string;
  industry: string | null;
  countryCode: string | null;
  timezone: string;
  website: string | null;
  description: string | null;
  employeeRange: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
}

export interface OrgMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
  createdAt: string;
  approvalStatus: string | null;
}

export interface OrgInvite {
  id: number;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface MyOrganisation {
  id: number;
  legalName: string;
  tradingName: string | null;
  organisationType: string;
  industry: string | null;
  logoUrl: string | null;
  myRole: string;
  myStatus: string;
  createdAt: string;
}

export const organisationsApi = {
  create: (body: Record<string, unknown>) =>
    request<Organisation>('/organisations', { method: 'POST', body: JSON.stringify(body) }),
  getMine: () =>
    request<MyOrganisation[]>('/organisations/mine'),
  getOne: (id: string) =>
    request<Organisation>(`/organisations/${id}`),
  update: (id: string, body: Record<string, unknown>) =>
    request<Organisation>(`/organisations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<void>(`/organisations/${id}`, { method: 'DELETE' }),
  getMembers: (id: string) =>
    request<OrgMember[]>(`/organisations/${id}/members`),
  updateMember: (id: string, userId: number, body: { role?: string; status?: string }) =>
    request<void>(`/organisations/${id}/members/${userId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  removeMember: (id: string, userId: number) =>
    request<void>(`/organisations/${id}/members/${userId}`, { method: 'DELETE' }),
  invite: (id: string, body: { email: string; role: string }) =>
    request<{ message: string }>(`/organisations/${id}/invite`, { method: 'POST', body: JSON.stringify(body) }),
  getInvites: (id: string) =>
    request<OrgInvite[]>(`/organisations/${id}/invites`),
  deleteInvite: (id: string, inviteId: number) =>
    request<void>(`/organisations/${id}/invites/${inviteId}`, { method: 'DELETE' }),
  acceptInvite: (token: string) =>
    request<Organisation>(`/organisations/invite/${token}/accept`, { method: 'POST' }),
  getInvitePreview: (token: string) =>
    request<{ email: string; orgName: string; role: string; expiresAt: string }>(`/organisations/invite/${token}/preview`),
};

export interface CreateOrgBody {
  legalName: string;
  tradingName?: string;
  organisationType: 'company' | 'startup' | 'enterprise' | 'ngo' | 'government' | 'other';
  industry?: string;
  countryCode?: string;
  timezone?: string;
  website?: string;
  description?: string;
  employeeRange?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
}

export interface AdminOrganisation {
  id: string;
  legalName: string;
  tradingName: string | null;
  organisationType: string;
  status: string;
  memberCount: number;
  createdAt: string;
  orgAdminEmail: string | null;
}

export interface AdminUserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

export interface PendingInterviewer {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  createdAt: string;
  appliedAt: string;
}

export const adminApi = {
  listOrganisations: () =>
    request<AdminOrganisation[]>('/organisations/admin'),
  approveOrganisation: (id: string) =>
    request<void>(`/organisations/${id}/approve`, { method: 'PATCH' }),
  rejectOrganisation: (id: string) =>
    request<void>(`/organisations/${id}/reject`, { method: 'PATCH' }),
  suspendOrganisation: (id: string) =>
    request<void>(`/organisations/${id}/suspend`, { method: 'PATCH' }),
  deleteOrganisation: (id: string) =>
    request<void>(`/organisations/${id}/admin-delete`, { method: 'DELETE' }),
  searchUser: (email: string) =>
    request<AdminUserSearchResult>(`/users/admin/search?email=${encodeURIComponent(email)}`),
  assignRole: (userId: string, role: string) =>
    request<void>(`/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ role }) }),
  revokeRole: (userId: number, role: string) =>
    request<void>(`/users/${userId}/roles/${role}`, { method: 'DELETE' }),
  getPendingInterviewers: () =>
    request<PendingInterviewer[]>('/users/admin/interviewers/pending'),
  approveInterviewer: (userId: number) =>
    request<void>(`/users/${userId}/interviewer/approve`, { method: 'PATCH' }),
  rejectInterviewer: (userId: number) =>
    request<void>(`/users/${userId}/interviewer/reject`, { method: 'PATCH' }),
};

export const usersApi = {
  getMe: () =>
    request<{ user: UserProfile }>('/users/me'),
  updateMe: (body: UpdateProfileBody) =>
    request<{ user: UserProfile }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  sendVerificationEmail: () =>
    request<{ message: string }>('/users/me/verify-email/send', { method: 'POST' }),
  verifyEmail: (token: string) =>
    request<{ message: string }>(`/users/verify-email?token=${token}`),
};

export const uploadsApi = {
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return uploadRequest<{ avatarUrl: string }>('/uploads/avatar', fd);
  },
  uploadResume: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return uploadRequest<{ documentId: number; fileName: string; fileSize: number }>('/uploads/resume', fd);
  },
  getDocumentUrl: (id: number) =>
    request<{ url: string }>(`/uploads/${id}/url`),
  deleteDocument: (id: number) =>
    request<void>(`/uploads/${id}`, { method: 'DELETE' }),
};
