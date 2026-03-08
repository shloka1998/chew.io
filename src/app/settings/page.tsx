'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, updateSettings } from '@/lib/db';
import type { UserSettings } from '@/lib/types';

const dietaryOptions = [
  'Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'No Beef', 'No Pork', 'Jain',
];

const healthOptions = [
  'Diabetes', 'Hypertension', 'High Cholesterol', 'Thyroid', 'Heart Disease', 'Kidney Disease',
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getSettings();
    setSettings(s);
    setLoading(false);
  }

  async function save(updates: Partial<UserSettings>) {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await updateSettings(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleDietary(pref: string) {
    if (!settings) return;
    const current = settings.dietaryPreferences;
    const updated = current.includes(pref)
      ? current.filter(p => p !== pref)
      : [...current, pref];
    save({ dietaryPreferences: updated });
  }

  function toggleHealth(condition: string) {
    if (!settings) return;
    const current = settings.healthConditions;
    const updated = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    save({ healthConditions: updated });
  }

  if (loading || !settings) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-10 w-32 skeleton" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white border border-primary-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-stone-800">Settings</h1>
        {saved && (
          <span className="text-sm text-green-600 font-medium ml-auto">Saved!</span>
        )}
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100 space-y-4">
        <h2 className="font-semibold text-stone-700">Profile</h2>

        <div>
          <label className="block text-sm text-stone-500 mb-1">Name</label>
          <input
            type="text"
            value={settings.name}
            onChange={e => save({ name: e.target.value })}
            placeholder="Your name"
            className="w-full bg-stone-50 rounded-xl px-4 py-3 text-stone-700 border border-stone-200 outline-none focus:border-primary-300 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-stone-500 mb-1">Age</label>
            <input
              type="number"
              value={settings.age}
              onChange={e => save({ age: parseInt(e.target.value) || 60 })}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-stone-700 border border-stone-200 outline-none text-base"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-500 mb-1">Gender</label>
            <select
              value={settings.gender}
              onChange={e => save({ gender: e.target.value as 'male' | 'female' })}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-stone-700 border border-stone-200 outline-none text-base"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-stone-500 mb-1">Weight (kg)</label>
            <input
              type="number"
              value={settings.weight}
              onChange={e => save({ weight: parseInt(e.target.value) || 70 })}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-stone-700 border border-stone-200 outline-none text-base"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-500 mb-1">Height (cm)</label>
            <input
              type="number"
              value={settings.height}
              onChange={e => save({ height: parseInt(e.target.value) || 170 })}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-stone-700 border border-stone-200 outline-none text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-stone-500 mb-1">Activity Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['sedentary', 'moderate', 'active'] as const).map(level => (
              <button
                key={level}
                onClick={() => save({ activityLevel: level })}
                className={`py-3 rounded-xl text-sm font-medium capitalize ${
                  settings.activityLevel === level
                    ? 'bg-primary-600 text-white'
                    : 'bg-stone-50 text-stone-600 border border-stone-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <h2 className="font-semibold text-stone-700 mb-3">Dietary Preferences</h2>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map(pref => (
            <button
              key={pref}
              onClick={() => toggleDietary(pref)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                settings.dietaryPreferences.includes(pref)
                  ? 'bg-primary-600 text-white'
                  : 'bg-stone-50 text-stone-600 border border-stone-200'
              }`}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      {/* Health Conditions */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <h2 className="font-semibold text-stone-700 mb-3">Health Conditions</h2>
        <p className="text-xs text-stone-400 mb-3">
          Select any that apply for personalized recommendations
        </p>
        <div className="flex flex-wrap gap-2">
          {healthOptions.map(condition => (
            <button
              key={condition}
              onClick={() => toggleHealth(condition)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                settings.healthConditions.includes(condition)
                  ? 'bg-red-500 text-white'
                  : 'bg-stone-50 text-stone-600 border border-stone-200'
              }`}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <h2 className="font-semibold text-stone-700 mb-2">About chew.io</h2>
        <p className="text-sm text-stone-500">
          Your AI-powered nutrition bridge. Built with love for Indian food traditions
          and backed by ICMR-NIN dietary guidelines.
        </p>
        <p className="text-xs text-stone-400 mt-2">
          Version 1.0.0 | Data stored locally on your device
        </p>
      </div>
    </div>
  );
}
