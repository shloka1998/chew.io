'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { Meal } from '@/lib/types';
import { formatDateReadable, formatDateIST } from '@/lib/date-utils';
import MealCard, { MealCardSkeleton } from '@/components/MealCard';

export default function HistoryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      const allMeals = await db.meals.orderBy('timestamp').reverse().toArray();
      setMeals(allMeals);
    } catch (err) {
      console.error('Failed to load meals:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group meals by date
  const groupedMeals: Record<string, Meal[]> = {};
  meals.forEach(meal => {
    const dateKey = formatDateIST(new Date(meal.timestamp));
    if (!groupedMeals[dateKey]) groupedMeals[dateKey] = [];
    groupedMeals[dateKey].push(meal);
  });

  const dateKeys = Object.keys(groupedMeals);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Meal History</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          {meals.length} meal{meals.length !== 1 ? 's' : ''} logged
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <MealCardSkeleton />
          <MealCardSkeleton />
          <MealCardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!loading && meals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-stone-600 font-medium text-lg">No meals logged yet</p>
          <p className="text-stone-400 text-sm mt-1">
            Your meal history will appear here
          </p>
        </div>
      )}

      {/* Grouped meals */}
      {dateKeys.map(dateKey => {
        const dayMeals = groupedMeals[dateKey];
        const totalCals = dayMeals.reduce((s, m) => s + m.nutrients.calories, 0);

        return (
          <div key={dateKey}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-stone-600">
                {formatDateReadable(dayMeals[0].timestamp)}
              </h2>
              <span className="text-sm text-stone-400">
                {Math.round(totalCals)} kcal total
              </span>
            </div>
            <div className="space-y-2">
              {dayMeals.map(meal => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
