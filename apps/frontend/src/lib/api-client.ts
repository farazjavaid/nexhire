const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthData {
  id: string;
  email: string;
  name: string;
  token: string;
  sessionId?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, name: string, role?: string) {
    return this.request<AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role: role || 'candidate' }),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  // Users endpoints
  async getProfile() {
    return this.request('/users/me', {
      method: 'GET',
    });
  }

  async updateProfile(data: any) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Organisations endpoints
  async createOrganisation(name: string, data?: any) {
    return this.request('/organisations', {
      method: 'POST',
      body: JSON.stringify({ name, ...data }),
    });
  }

  async getMyOrganisations() {
    return this.request('/organisations/mine', {
      method: 'GET',
    });
  }

  async getOrganisation(id: string) {
    return this.request(`/organisations/${id}`, {
      method: 'GET',
    });
  }

  // MFA endpoints
  async getMfaStatus() {
    return this.request('/mfa/status', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
