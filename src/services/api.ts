// Determine API URL based on environment
let API_URL = 'http://localhost:5000/api'; // default for local dev

// Check if running in browser and on Vercel domain
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  console.log('🌐 Current hostname:', hostname);
  console.log('🔒 Protocol:', protocol);
  
  // If on Vercel or any non-localhost domain, use production backend
  if (hostname === 'health-care-mu-six.vercel.app' || 
      hostname.includes('vercel.app') || 
      (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
    API_URL = 'https://project-mini-te3w.onrender.com/api';
    console.log('✅ Auto-switched to production backend');
  }
}

// Allow override from environment variable (highest priority)
if (process.env.REACT_APP_API_URL) {
  API_URL = process.env.REACT_APP_API_URL;
  console.log('✅ Using environment variable override');
}

console.log('🔗 Environment:', process.env.NODE_ENV);
console.log('🔗 Final API URL:', API_URL);

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
    console.log('🔗 Requesting:', `${API_URL}/auth/login`);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      console.log('📥 Response status:', res.status, res.statusText);
      const result = await res.json();
      if (!res.ok) {
        console.error('❌ Login failed - Status:', res.status, 'Error:', result);
      } else {
        console.log('✅ Login successful');
      }
      return result;
    } catch (err) {
      console.error('❌ Login network error:', err);
      throw err;
    }
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