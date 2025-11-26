const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API calls
export const api = {
  // Auth
  register: async (data) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  login: async (data) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Emotions
  recordEmotion: async (data) => {
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

  getProfile: async () => {
    const res = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return res.json();
  },

  updateProfile: async (data) => {
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

  updateCareMode: async (careMode) => {
    const res = await fetch(`${API_URL}/user/care-mode`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ careMode })
    });
    return res.json();
  },

  getAlerts: async (resolved = false) => {
    const res = await fetch(`${API_URL}/alerts?resolved=${resolved}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return res.json();
  },

  resolveAlert: async (alertId, caregiverResponse) => {
    const res = await fetch(`${API_URL}/alerts/${alertId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ caregiverResponse })
    });
    return res.json();
  },

  detectEmotion: async (imageFile, scanMode) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('scanMode', scanMode);

    const res = await fetch(`${API_URL}/ai/detect-emotion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    return res.json();
  }
};