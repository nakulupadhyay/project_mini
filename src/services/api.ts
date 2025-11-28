const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔗 API URL configured:', API_URL);

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API calls
export const api = {
  // Auth
  register: async (data: { email: string; password: string; name: string; careMode: string }) => {
    console.log('📤 Registering user:', data.email);
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      console.error('❌ Registration failed:', result);
    }
    return result;
  },

  login: async (data: { email: string; password: string }) => {
    console.log('📤 Logging in user:', data.email);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      console.error('❌ Login failed:', result);
    }
    return result;
  },

  // Emotions
  recordEmotion: async (data: any) => {
    const res = await fetch(`${API_URL}/emotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getEmotions: async () => {
    const res = await fetch(`${API_URL}/emotions`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return res.json();
  },

  getAnalytics: async (period = '7') => {
    const res = await fetch(`${API_URL}/emotions/analytics?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return res.json();
  },

  // User
  getProfile: async () => {
    const res = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return res.json();
  },

  updateProfile: async (data: any) => {
    const res = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateCareMode: async (careMode: string) => {
    const res = await fetch(`${API_URL}/user/care-mode`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ careMode })
    });
    return res.json();
  }
};