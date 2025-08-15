// API service for communicating with the Flask backend

const API_BASE_URL = 'https://60h5imc0n38m.manus.space/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  }

  async register(email, password) {
    const response = await this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  }

  async loginWithGitHub(code) {
    const response = await this.request('/auth/github/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  }

  async getCurrentUser() {
    return await this.request('/me');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Services methods
  async getServices() {
    return await this.request('/services');
  }

  async testServices() {
    return await this.request('/services/test', {
      method: 'POST',
    });
  }

  // Search sessions methods
  async getSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/sessions?${queryString}` : '/sessions';
    return await this.request(endpoint);
  }

  async createSession(sessionData) {
    return await this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getSession(sessionId) {
    return await this.request(`/sessions/${sessionId}`);
  }

  async startSession(sessionId) {
    return await this.request(`/sessions/${sessionId}/start`, {
      method: 'POST',
    });
  }

  async stopSession(sessionId) {
    return await this.request(`/sessions/${sessionId}/stop`, {
      method: 'POST',
    });
  }

  async deleteSession(sessionId) {
    return await this.request(`/sessions/${sessionId}/delete`, {
      method: 'DELETE',
    });
  }

  // Results methods
  async getSessionResults(sessionId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/sessions/${sessionId}/results?${queryString}` 
      : `/sessions/${sessionId}/results`;
    return await this.request(endpoint);
  }

  async getSessionLogs(sessionId, limit = 50) {
    return await this.request(`/sessions/${sessionId}/logs?limit=${limit}`);
  }

  // Dashboard methods
  async getDashboardStats() {
    return await this.request('/dashboard/stats');
  }

  async getRecentSessions() {
    return await this.request('/dashboard/recent-sessions');
  }

  // Export methods
  async exportSessionResults(sessionId, format = 'json') {
    return await this.request(`/export/session/${sessionId}?format=${format}`);
  }

  // Real-time updates (polling-based for now)
  async pollSessionStatus(sessionId, callback, interval = 2000) {
    const poll = async () => {
      try {
        const session = await this.getSession(sessionId);
        callback(session);
        
        if (session.status === 'running') {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
  }

  async pollSessionLogs(sessionId, callback, interval = 2000) {
    let lastLogCount = 0;

    const poll = async () => {
      try {
        const logs = await this.getSessionLogs(sessionId);
        
        if (logs.length > lastLogCount) {
          callback(logs);
          lastLogCount = logs.length;
        }

        // Continue polling if session is active
        const session = await this.getSession(sessionId);
        if (session.status === 'running') {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('Log polling error:', error);
      }
    };

    poll();
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

