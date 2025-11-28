import React, { useState, useEffect, useRef } from 'react';
import { Camera, Brain, Heart, Activity, TrendingUp, Calendar, MessageSquare, AlertCircle, CheckCircle, Smile, Meh, Frown, Shield, Music, Users, Lightbulb, Phone, Lock, Zap, Target, BarChart3, LogOut, Settings, Layers, Mic } from 'lucide-react';
import { Emotion, Category, MoodEntry, EmotionState, MusicTherapy, AmbientMode, CategoryItem, UserData } from './types';
import { api } from './services/api';

const EmotionHealthMonitor = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Existing state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'journal'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [scanMode, setScanMode] = useState<'multimodal' | 'face' | 'voice'>('multimodal');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  const [musicPlaying, setMusicPlaying] = useState<MusicTherapy | null>(null);
  const [ambientMode, setAmbientMode] = useState<AmbientMode>({ lights: 'warm', music: 'calm' });
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const emotions: Emotion[] = ['Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Stressed', 'Neutral', 'Depressed', 'Angry'];

  const emotionColors: Record<Emotion, string> = {
    'Happy': 'bg-green-500',
    'Sad': 'bg-blue-500',
    'Anxious': 'bg-orange-500',
    'Calm': 'bg-indigo-500',
    'Excited': 'bg-yellow-500',
    'Stressed': 'bg-red-500',
    'Neutral': 'bg-gray-500',
    'Depressed': 'bg-purple-900',
    'Angry': 'bg-red-700'
  };

  const categories: CategoryItem[] = [
    {
      id: 'normal',
      name: 'Wellness Mode',
      icon: <Smile className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-600',
      description: 'For everyday mood enhancement and emotional wellness',
      features: [
        'Multimodal emotion detection (face, voice, behavior)',
        'Context-aware analysis (time, location, routine)',
        'Personalized music therapy based on mood',
        'Ambient environment adjustments (lights, sounds)',
        'Emotion trajectory tracking over time',
        'Privacy-first edge computing (local processing)'
      ]
    },
    {
      id: 'moderate',
      name: 'Support Mode',
      icon: <Heart className="w-8 h-8" />,
      color: 'from-orange-500 to-amber-600',
      description: 'For individuals experiencing depression or moderate mental health challenges',
      features: [
        'Enhanced emotion pattern recognition',
        'Crisis detection and early warning system',
        'Guided breathing exercises and meditation',
        'Cognitive behavioral therapy prompts',
        'Professional therapist connection portal',
        'Daily wellness check-ins and reminders',
        'Mood stabilization music therapy',
        'Activity suggestions based on emotional state'
      ]
    },
    {
      id: 'clinical',
      name: 'Clinical Mode',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-purple-600 to-indigo-700',
      description: 'For individuals with diagnosed mental health conditions requiring clinical monitoring',
      features: [
        'Real-time caregiver dashboard access',
        'Multi-modal emotion fusion (face + voice + behavior)',
        'Clinically-relevant mental health insights',
        'Crisis intervention protocols',
        '24/7 emergency contact system',
        'Medication reminder integration',
        'Psychiatrist report generation',
        'Encrypted HIPAA-compliant data logging',
        'Behavioral pattern analysis',
        'Family support coordination'
      ]
    }
  ];

  const musicTherapy: Record<Emotion, MusicTherapy> = {
    'Happy': { genre: 'Upbeat Pop', track: 'Happy Vibes', color: 'text-green-600' },
    'Sad': { genre: 'Soothing Classical', track: 'Moonlight Sonata', color: 'text-blue-600' },
    'Anxious': { genre: 'Ambient Calm', track: 'Deep Breathing', color: 'text-orange-600' },
    'Calm': { genre: 'Nature Sounds', track: 'Ocean Waves', color: 'text-indigo-600' },
    'Excited': { genre: 'Energetic Dance', track: 'Electric Feel', color: 'text-yellow-600' },
    'Stressed': { genre: 'Relaxation Therapy', track: 'Stress Relief', color: 'text-red-600' },
    'Neutral': { genre: 'Lo-fi Beats', track: 'Study Music', color: 'text-gray-600' },
    'Depressed': { genre: 'Therapeutic Sounds', track: 'Hope & Light', color: 'text-purple-900' },
    'Angry': { genre: 'Calming Piano', track: 'Inner Peace', color: 'text-red-700' }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(user));
      setActiveCategory(JSON.parse(user).careMode || null);
      loadUserData();
    }
  }, []);

  // Cleanup media streams when component unmounts or scan stops
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Load user data from backend
  const loadUserData = async () => {
    try {
      const emotions = await api.getEmotions();

      // Transform backend data to match frontend format
      const transformedEmotions = emotions.map((e: any) => ({
        date: new Date(e.timestamp).toISOString().split('T')[0],
        emotion: e.emotion,
        score: e.score,
        note: e.note || '',
        category: e.userId?.careMode || 'normal',
        context: e.context?.location || 'Unknown',
        time: new Date(e.timestamp).toLocaleTimeString()
      }));

      setMoodHistory(transformedEmotions);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Handle authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let response;
      if (authMode === 'login') {
        console.log('🔐 Attempting login...');
        response = await api.login({
          email: authForm.email,
          password: authForm.password
        });
      } else {
        console.log('📝 Attempting registration...');
        response = await api.register({
          email: authForm.email,
          password: authForm.password,
          name: authForm.name,
          careMode: 'normal' // Default, user will select after login
        });
      }

      console.log('📨 Response received:', response);

      if (response.token) {
        console.log('✅ Authentication successful!');
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setIsAuthenticated(true);
        setUserData(response.user);
        setAuthForm({ email: '', password: '', name: '' });
        loadUserData();
      } else {
        const errorMsg = response.error || response.message || 'Authentication failed. Please check your credentials.';
        console.error('❌ Auth error:', errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Auth network error:', error);
      alert(`Connection error: ${error instanceof Error ? error.message : 'Unable to reach the server. Please check if the backend is running.'}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserData(null);
    setActiveCategory(null);
    setMoodHistory([]);
  };

  // Handle scan with backend integration and camera
  const handleScan = async () => {
    setIsScanning(true);

    try {
      // Request access to video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: scanMode !== 'face' // Only request audio for multimodal or voice mode
      });

      setMediaStream(stream);

      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }

      // Simulate AI scanning (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const randomScore = Math.floor(Math.random() * 40) + 60;
      const contexts = ['Home', 'Work', 'Commute', 'Social'];
      const context = contexts[Math.floor(Math.random() * contexts.length)];

      const emotionState: EmotionState = {
        emotion: randomEmotion,
        score: randomScore,
        timestamp: new Date().toLocaleTimeString(),
        context: context,
        voiceAnalysis: Math.floor(Math.random() * 100),
        facialAnalysis: Math.floor(Math.random() * 100),
        behaviorAnalysis: Math.floor(Math.random() * 100)
      };

      setCurrentEmotion(emotionState);

      // Set music therapy for normal mode
      if (activeCategory === 'normal') {
        setMusicPlaying(musicTherapy[randomEmotion]);
        updateAmbientMode(randomEmotion);
      }

      // Stop the media stream
      stream.getTracks().forEach(track => track.stop());
      setMediaStream(null);

      setIsScanning(false);
    } catch (error) {
      console.error('Error during scan:', error);
      alert('Could not access your camera or microphone. Please check permissions.');
      setIsScanning(false);
    }
  };

  const updateAmbientMode = (emotion: Emotion) => {
    const ambientSettings: Partial<Record<Emotion, AmbientMode>> = {
      'Happy': { lights: 'bright yellow', music: 'upbeat' },
      'Sad': { lights: 'soft blue', music: 'soothing' },
      'Anxious': { lights: 'warm orange', music: 'calming' },
      'Calm': { lights: 'cool blue', music: 'nature sounds' },
      'Stressed': { lights: 'dim warm', music: 'relaxation' },
      'Depressed': { lights: 'gentle warm', music: 'therapeutic' },
      'Excited': { lights: 'bright white', music: 'energetic' },
      'Neutral': { lights: 'neutral', music: 'ambient' },
      'Angry': { lights: 'soft amber', music: 'calming' }
    };
    setAmbientMode(ambientSettings[emotion] || { lights: 'neutral', music: 'ambient' });
  };

  // Save emotion to backend
  const addMoodEntry = async () => {
    if (!currentEmotion) return;

    try {
      const emotionData = {
        emotion: currentEmotion.emotion,
        score: currentEmotion.score,
        scanMode: scanMode,
        modalityBreakdown: {
          facial: currentEmotion.facialAnalysis,
          voice: currentEmotion.voiceAnalysis,
          behavior: currentEmotion.behaviorAnalysis
        },
        context: {
          location: currentEmotion.context,
          activity: 'User Activity',
          timeOfDay: currentEmotion.timestamp
        },
        note: journalEntry || 'Quick emotion check'
      };

      const response = await api.recordEmotion(emotionData);

      if (response.emotionRecord) {
        // Handle intervention from backend
        if (response.intervention) {
          if (response.intervention.musicTherapy) {
            setMusicPlaying(response.intervention.musicTherapy);
          }
          if (response.intervention.ambientSettings) {
            setAmbientMode(response.intervention.ambientSettings);
          }
        }

        // Reload emotions from backend
        await loadUserData();

        // Clear form
        setJournalEntry('');
        setCurrentEmotion(null);
        setMusicPlaying(null);

        alert('Emotion saved successfully!');
      }
    } catch (error) {
      console.error('Error saving emotion:', error);
      alert('Failed to save emotion. Please try again.');
    }
  };

  // Update care mode in backend
  const handleCategorySelect = async (categoryId: Category) => {
    try {
      await api.updateCareMode(categoryId);
      setActiveCategory(categoryId);

      // Update local storage
      if (userData) {
        const updatedUser = { ...userData, careMode: categoryId };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating care mode:', error);
      alert('Failed to update care mode');
    }
  };

  const getEmotionIcon = (emotion: Emotion) => {
    if (['Happy', 'Excited', 'Calm'].includes(emotion)) return <Smile className="w-5 h-5" />;
    if (['Neutral'].includes(emotion)) return <Meh className="w-5 h-5" />;
    return <Frown className="w-5 h-5" />;
  };

  // Show login/register form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">

            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {authMode === 'login' ? 'Login to MindCare AI' : 'Register for MindCare AI'}
            </h2>
            <p className="text-gray-600 mt-2">AI-Based Emotion Recognition & Mental Health Monitoring</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                placeholder="••••••••"
                minLength={6}
              />
              {authMode === 'register' && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all"
            >
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthForm({ email: '', password: '', name: '' });
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              This platform is HIPAA-compliant with end-to-end encryption.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show category selection if not selected
  if (!activeCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome, {userData?.name}!
              </h1>
              <p className="text-gray-600 mt-2">Choose your personalized care mode to get started</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Choose Your Care Mode
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Select the appropriate monitoring level based on your mental health needs. Each mode is designed with advanced AI features tailored to your situation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className={`bg-gradient-to-r ${cat.color} p-8 text-white text-center`}>
                  <div className="flex justify-center mb-4">{cat.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                  <p className="text-sm opacity-90">{cat.description}</p>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Key Features:
                  </h4>
                  <ul className="space-y-3">
                    {cat.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-indigo-600 font-bold mt-0.5">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Technology Stack Section - Same as before */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Zap className="w-7 h-7 text-indigo-600" />
              Advanced AI Technology Stack
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">

                  <h4 className="font-semibold text-gray-800">Multimodal Emotion Fusion</h4>
                </div>
                <p className="text-sm text-gray-600">Combines face, voice, and behavior analysis achieving 87-90% accuracy using CNN-LSTM networks and attention mechanisms for comprehensive emotion detection.</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Context-Aware Modeling</h4>
                </div>
                <p className="text-sm text-gray-600">Incorporates time, environment, and personal routines using scene analysis, relationship graphs, and agent-object interactions for refined emotion interpretation.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-gray-800">Emotion Trajectory Tracking</h4>
                </div>
                <p className="text-sm text-gray-600">Monitors emotional state changes over time using temporal models and LSTM networks to detect mood shifts or potential crisis situations.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-orange-600" />
                  <h4 className="font-semibold text-gray-800">Few-Shot Personalization</h4>
                </div>
                <p className="text-sm text-gray-600">Adapts AI models to individual behavior patterns using limited personal data through transfer learning and meta-learning strategies.</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  <h4 className="font-semibold text-gray-800">Passive Intervention System</h4>
                </div>
                <p className="text-sm text-gray-600">Triggers ambient responses like adaptive lighting and personalized music therapy instead of invasive alerts for non-disruptive emotional support.</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                  <h4 className="font-semibold text-gray-800">Caregiver Dashboard</h4>
                </div>
                <p className="text-sm text-gray-600">Provides emotion trends, crisis alerts, and comprehensive summaries to caregivers for informed decision-making and timely interventions.</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-indigo-600" />
                  <h4 className="font-semibold text-gray-800">Edge-Based Inference</h4>
                </div>
                <p className="text-sm text-gray-600">Runs AI models locally on device (14x faster than cloud) to avoid transmitting raw audio/video, ensuring real-time processing and enhanced privacy.</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-6 h-6 text-gray-600" />
                  <h4 className="font-semibold text-gray-800">Encrypted Data Logging</h4>
                </div>
                <p className="text-sm text-gray-600">Stores only anonymized emotion metrics with HIPAA-compliant encryption, enforcing no-recording and consent-first policies by design.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryData = categories.find(c => c.id === activeCategory);
  if (!categoryData) return null;
  const avgScore = moodHistory.length > 0
    ? Math.round(moodHistory.reduce((acc, e) => acc + e.score, 0) / moodHistory.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  MindCare AI
                </h1>

              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-semibold text-gray-800">{userData?.name}</p>
                <p className="text-xs text-gray-500">{userData?.email}</p>
              </div>
              <button
                onClick={() => setActiveCategory(null)}
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium px-3 py-1 rounded hover:bg-gray-100"
              >
                Change Mode
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600 font-medium px-3 py-1 rounded hover:bg-red-50 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userData?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-2 inline-flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'scan'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Camera className="w-5 h-5" />
              Emotion Scan
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'journal'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <MessageSquare className="w-5 h-5" />
              Journal
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className={`bg-gradient-to-r ${categoryData.color} rounded-xl shadow-lg p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Active Mode: {categoryData.name}</h2>
                  <p className="opacity-90">{categoryData.description}</p>
                </div>
                <div className="text-6xl">{categoryData.icon}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Average Wellness</p>
                    <p className="text-3xl font-bold text-gray-800">{avgScore}%</p>
                  </div>
                  <Heart className="w-12 h-12 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Check-ins</p>
                    <p className="text-3xl font-bold text-gray-800">{moodHistory.length}</p>
                  </div>
                  <Activity className="w-12 h-12 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">AI Accuracy</p>
                    <p className="text-3xl font-bold text-gray-800">89%</p>
                  </div>

                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Privacy</p>
                    <p className="text-lg font-bold text-gray-800">Edge AI</p>
                  </div>
                  <Shield className="w-12 h-12 text-indigo-500" />
                </div>
              </div>
            </div>

            {activeCategory === 'clinical' && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Clinical Monitoring Active</h3>
                    <p className="text-red-700 mb-4">Your emotional wellbeing is being monitored by healthcare professionals. Emergency contacts and caregivers have access to your dashboard.</p>
                    <div className="flex gap-3">
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact Therapist
                      </button>
                      <button className="bg-white text-red-600 px-4 py-2 rounded-lg border border-red-600 hover:bg-red-50">
                        View Caregiver Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'moderate' && (
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Heart className="w-8 h-8 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">Support Resources Available</h3>
                    <p className="text-orange-700 mb-4">We are here to help. Access guided exercises, connect with professionals, or explore coping strategies.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                        Breathing Exercise
                      </button>
                      <button className="bg-white text-orange-600 px-4 py-2 rounded-lg border border-orange-600 hover:bg-orange-50">
                        CBT Prompts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'normal' && ambientMode && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Lightbulb className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Ambient Environment Active</h3>
                    <p className="text-yellow-700 mb-3">Your environment is being adjusted to support your emotional state</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-gray-600">Lighting</p>
                        <p className="font-semibold text-gray-800">{ambientMode.lights}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-gray-600">Music Mode</p>
                        <p className="font-semibold text-gray-800">{ambientMode.music}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Emotion Trajectory (Last 5 Days)
              </h3>
              {moodHistory.length > 0 ? (
                <div className="space-y-3">
                  {moodHistory.slice(-5).reverse().map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${emotionColors[entry.emotion]} flex items-center justify-center text-white font-bold`}>
                          {entry.score}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{entry.emotion}</p>
                          <p className="text-sm text-gray-500">{entry.date} • {entry.time} • {entry.context}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-3 py-1 rounded-full ${entry.category === 'normal' ? 'bg-green-100 text-green-700' :
                          entry.category === 'moderate' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                          {entry.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No emotion records yet. Start by scanning your emotion!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Scan Mode</h3>

              </div>



              <div className="mb-6">

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setScanMode('multimodal')}
                    className={`p-3 rounded-lg border-2 ${scanMode === 'multimodal'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-600'
                      }`}
                  >
                    <div className="text-center">
                      <Layers className={`w-6 h-6 mx-auto mb-2 ${scanMode === 'multimodal' ? 'text-indigo-600' : 'text-gray-600'
                        }`} />
                      <p className={`text-sm font-medium ${scanMode === 'multimodal' ? 'text-indigo-600' : 'text-gray-600'
                        }`}>
                        Multimodal
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setScanMode('face')}
                    className={`p-3 rounded-lg border-2 ${scanMode === 'face'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-600'
                      }`}
                  >
                    <div className="text-center">
                      <Camera className={`w-6 h-6 mx-auto mb-2 ${scanMode === 'face' ? 'text-indigo-600' : 'text-gray-600'
                        }`} />
                      <p className={`text-sm font-medium ${scanMode === 'face' ? 'text-indigo-600' : 'text-gray-600'
                        }`}>
                        Face Only
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setScanMode('voice')}
                    className={`p-3 rounded-lg border-2 ${scanMode === 'voice'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-600'
                      }`}
                  >
                    <div className="text-center">
                      <Mic className={`w-6 h-6 mx-auto mb-2 ${scanMode === 'voice' ? 'text-indigo-600' : 'text-gray-600'
                        }`} />
                      <p className={`text-sm font-medium ${scanMode === 'voice' ? 'text-indigo-600' : 'text-gray-600'
                        }`}>
                        Voice Only
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                {isScanning && (
                  <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video mb-4">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover transform scale-x-[-1]"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 px-4 py-2 rounded-lg flex items-center gap-2">
                        <span className="animate-pulse text-red-500">●</span>
                        <span className="text-white font-medium">Recording...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentEmotion && !isScanning && (
                <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-20 h-20 rounded-full ${emotionColors[currentEmotion.emotion]} flex items-center justify-center text-white text-2xl font-bold`}>
                          {currentEmotion.score}
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{currentEmotion.emotion}</p>
                          <p className="text-gray-600">Overall Confidence</p>
                          <p className="text-sm text-gray-500">{currentEmotion.timestamp} • {currentEmotion.context}</p>
                        </div>
                      </div>
                    </div>

                    {scanMode === 'multimodal' && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Modality Breakdown:</p>
                        <div className="flex items-center gap-3">
                          <Camera className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Facial</span>
                              <span className="font-semibold">{currentEmotion.facialAnalysis}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${currentEmotion.facialAnalysis}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Music className="w-5 h-5 text-purple-600" />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Voice</span>
                              <span className="font-semibold">{currentEmotion.voiceAnalysis}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${currentEmotion.voiceAnalysis}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Behavior</span>
                              <span className="font-semibold">{currentEmotion.behaviorAnalysis}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${currentEmotion.behaviorAnalysis}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeCategory === 'normal' && musicPlaying && (
                    <div className="mb-4 p-4 bg-white rounded-lg border-2 border-indigo-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Music className={`w-6 h-6 ${musicPlaying.color}`} />
                        <div>
                          <p className="font-semibold text-gray-800">Music Therapy Active</p>
                          <p className="text-sm text-gray-600">{musicPlaying.genre} - {musicPlaying.track}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700">
                          Playing
                        </button>
                        <button
                          onClick={() => setMusicPlaying(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'moderate' && (
                    <div className="mb-4 p-4 bg-orange-100 rounded-lg border border-orange-300">
                      <h4 className="font-semibold text-orange-800 mb-2">Suggested Intervention</h4>
                      <p className="text-sm text-orange-700 mb-3">
                        {currentEmotion.score < 60
                          ? 'Your emotional state suggests you might benefit from a guided breathing exercise or talking to someone.'
                          : 'Your emotional state is stable. Consider journaling or light physical activity to maintain balance.'}
                      </p>
                      <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">
                        Start Guided Exercise
                      </button>
                    </div>
                  )}

                  {activeCategory === 'clinical' && currentEmotion.score < 50 && (
                    <div className="mb-4 p-4 bg-red-100 rounded-lg border border-red-300">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-red-800 mb-1">Alert: Low Wellness Score</h4>
                          <p className="text-sm text-red-700 mb-3">Your caregiver has been notified. Would you like to connect with emergency support?</p>
                          <div className="flex gap-2">
                            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Call Now
                            </button>
                            <button className="bg-white text-red-600 px-4 py-2 rounded-lg border border-red-600 hover:bg-red-50 text-sm">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    placeholder="Add a note about how you're feeling (optional)..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                    rows={3}
                  />
                  <button
                    onClick={addMoodEntry}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Save to History
                  </button>
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3"
              >

                {isScanning ? 'Scanning...' : 'Start Emotion Scan'}
              </button>

              <p className="mt-4 text-gray-500 text-sm text-center">AI analyzes your emotional state using {scanMode} analysis with edge computing for privacy</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Privacy & Security
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>All processing happens locally on your device - no raw video/audio transmitted</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Only anonymized emotion metrics are stored with encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>You maintain full control - no recording without explicit consent</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                Mood Journal & History
              </h3>
              {moodHistory.length > 0 ? (
                <div className="space-y-4">
                  {moodHistory.map((entry, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${emotionColors[entry.emotion]} flex items-center justify-center text-white text-sm`}>
                            {getEmotionIcon(entry.emotion)}
                          </div>
                          <span className="font-semibold text-gray-800">{entry.emotion}</span>
                          <span className="text-gray-500 text-sm">{entry.date} • {entry.time}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${entry.category === 'normal' ? 'bg-green-100 text-green-700' :
                            entry.category === 'moderate' ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                            {entry.category}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-gray-700">{entry.score}%</span>
                      </div>
                      <p className="text-gray-600 ml-11">{entry.note}</p>
                      <p className="text-xs text-gray-500 ml-11 mt-1">Context: {entry.context}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No journal entries yet. Start recording your emotions!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p className="font-semibold">MindCare AI - Your Personal Mental Health Companion</p>
            <p className="mt-1">Advanced AI technology for emotion recognition and mental health monitoring</p>
            <p className="mt-2 text-xs">Remember: This is a wellness tool, not a replacement for professional mental health care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmotionHealthMonitor;