'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, getSettings } from '@/lib/db';
import type { Meal, UserSettings, NutritionScoreRecord } from '@/lib/types';
import { getGreeting, todayIST, startOfDayIST, endOfDayIST } from '@/lib/date-utils';
import { calculateDailyScore } from '@/lib/scoring';
import NutritionScore from '@/components/NutritionScore';
import MealCard, { MealCardSkeleton } from '@/components/MealCard';

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [scoreRecord, setScoreRecord] = useState<NutritionScoreRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const s = await getSettings();
      setSettings(s);

      const today = todayIST();
      const dayStart = startOfDayIST(today);
      const dayEnd = endOfDayIST(today);

      const todayMeals = await db.meals
        .where('timestamp')
        .between(dayStart, dayEnd, true, true)
        .reverse()
        .sortBy('timestamp');

      setMeals(todayMeals);

      if (todayMeals.length > 0) {
        const score = calculateDailyScore(todayMeals, s);
        setScoreRecord(score);
        await db.scoreHistory.put(score);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  const greeting = getGreeting();
  const name = settings?.name || '';

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            {greeting}{name ? `, ${name}` : ''}!
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            How are you eating today?
          </p>
        </div>
        <Link
          href="/settings"
          className="w-10 h-10 rounded-full bg-white border border-primary-100 flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Nutrition Score */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-primary-100">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 skeleton rounded-full" />
            <div className="h-4 w-24 skeleton mt-3" />
          </div>
        ) : meals.length > 0 && scoreRecord ? (
          <>
            <NutritionScore score={scoreRecord.score} />
            <p className="text-center text-sm text-stone-500 mt-2">
              Today&apos;s Nutrition Score
            </p>
            <div className="grid grid-cols-4 gap-2 mt-4">
              <ScoreChip label="Variety" value={scoreRecord.breakdown.variety} max={25} />
              <ScoreChip label="Balance" value={scoreRecord.breakdown.balance} max={25} />
              <ScoreChip label="Timing" value={scoreRecord.breakdown.consistency} max={25} />
              <ScoreChip label="Micros" value={scoreRecord.breakdown.micronutrients} max={25} />
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-stone-600 font-medium text-lg">No meals logged yet today</p>
            <p className="text-stone-400 text-sm mt-1">
              Tap the button below to log your first meal
            </p>
          </div>
        )}
      </div>

      {/* Today's Meals */}
      {meals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-700 mb-3">
            Today&apos;s Meals ({meals.length})
          </h2>
          <div className="space-y-3">
            {meals.map(meal => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-5 w-32 skeleton" />
          <MealCardSkeleton />
          <MealCardSkeleton />
        </div>
      )}

      {/* Big Log Meal Button */}
      <Link href="/log" className="block">
        <button className="w-full bg-primary-600 text-white text-xl font-semibold py-5 rounded-2xl shadow-lg active:scale-[0.98] active:bg-primary-700 flex items-center justify-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Log a Meal
        </button>
      </Link>
    </div>
  );
}

function ScoreChip({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="text-center">
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-stone-500 mt-1">{value}/{max}</div>
    </div>
  );
}
