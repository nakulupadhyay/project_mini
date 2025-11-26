import React from 'react';

export type Emotion = 'Happy' | 'Sad' | 'Anxious' | 'Calm' | 'Excited' | 'Stressed' | 'Neutral' | 'Depressed' | 'Angry';
export type Category = 'normal' | 'moderate' | 'clinical';

export interface MoodEntry {
  date: string;
  emotion: Emotion;
  score: number;
  note: string;
  category: Category;
  context: string;
  time: string;
}

export interface EmotionState {
  emotion: Emotion;
  score: number;
  timestamp: string;
  context: string;
  voiceAnalysis: number;
  facialAnalysis: number;
  behaviorAnalysis: number;
}

export interface MusicTherapy {
  genre: string;
  track: string;
  color: string;
}

export interface AmbientMode {
  lights: string;
  music: string;
}

export interface CategoryItem {
  id: Category;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  careMode: Category;
  preferences?: any;
}