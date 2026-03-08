'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/db';
import type { Meal } from '@/lib/types';
import { formatTimeIST, formatDateReadable } from '@/lib/date-utils';
import { blobToUrl } from '@/lib/image-utils';
import NutritionBreakdown from '@/components/NutritionBreakdown';

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [feelingNotes, setFeelingNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadMeal();
  }, [id]);

  async function loadMeal() {
    try {
      const m = await db.meals.get(id);
      if (m) {
        setMeal(m);
        setNotes(m.notes || '');
        setFeelingNotes(m.feelingNotes || '');
        if (m.photo) {
          setPhotoUrl(blobToUrl(m.photo));
        }
      }
    } catch (err) {
      console.error('Failed to load meal:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    if (!meal) return;
    await db.meals.update(id, { notes, feelingNotes });
    setMeal({ ...meal, notes, feelingNotes });
  }

  async function deleteMeal() {
    await db.meals.delete(id);
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-10 w-10 skeleton rounded-full" />
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-8 w-48 skeleton" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-stone-500 text-lg">Meal not found</p>
        <button onClick={() => router.push('/')} className="text-primary-600 font-medium mt-4">
          Go Home
        </button>
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
        <div>
          <h1 className="text-xl font-bold text-stone-800">
            {mealTypeLabels[meal.mealType]}
          </h1>
          <p className="text-sm text-stone-400">
            {formatDateReadable(meal.timestamp)} at {formatTimeIST(meal.timestamp)}
          </p>
        </div>
      </div>

      {/* Photo */}
      {photoUrl && (
        <img src={photoUrl} alt="Meal" className="w-full rounded-2xl shadow-sm max-h-72 object-cover" />
      )}

      {/* Score */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-stone-700">Meal Score</span>
          <span className={`text-2xl font-bold ${
            meal.score >= 70 ? 'text-green-600' :
            meal.score >= 50 ? 'text-amber-500' : 'text-orange-500'
          }`}>
            {Math.round(meal.score)}/100
          </span>
        </div>
        <p className="text-sm text-stone-500">{meal.scoreExplanation}</p>
      </div>

      {/* Food Items */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <h3 className="font-semibold text-stone-700 mb-3">Food Items</h3>
        <div className="space-y-2">
          {meal.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
              <div>
                <span className="font-medium text-stone-700">{item.name}</span>
                {item.nameKannada && (
                  <span className="text-sm text-stone-400 ml-2">{item.nameKannada}</span>
                )}
                <p className="text-xs text-stone-400">{item.quantity}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-primary-600">{Math.round(item.calories)} kcal</span>
                <p className="text-xs text-stone-400">P:{Math.round(item.protein)}g F:{Math.round(item.fat)}g C:{Math.round(item.carbs)}g</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition Breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <h3 className="font-semibold text-stone-700 mb-3">Nutrition Breakdown</h3>
        <NutritionBreakdown nutrients={meal.nutrients} />
      </div>

      {/* Suggestions */}
      {meal.suggestions && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-sm text-green-800">💡 {meal.suggestions}</p>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <label className="block text-sm font-medium text-stone-500 mb-2">
          Meal Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Add notes about this meal..."
          rows={2}
          className="w-full bg-stone-50 rounded-xl p-3 text-stone-700 border-none outline-none resize-none text-base"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-primary-100">
        <label className="block text-sm font-medium text-stone-500 mb-2">
          How did you feel after eating?
        </label>
        <textarea
          value={feelingNotes}
          onChange={e => setFeelingNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="e.g., Feeling full and energetic..."
          rows={2}
          className="w-full bg-stone-50 rounded-xl p-3 text-stone-700 border-none outline-none resize-none text-base"
        />
      </div>

      {/* Delete */}
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full text-center text-red-400 text-sm py-3"
        >
          Delete this meal
        </button>
      ) : (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <p className="text-red-700 font-medium mb-3">Delete this meal?</p>
          <div className="flex gap-3">
            <button
              onClick={deleteMeal}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-white text-stone-600 py-3 rounded-xl font-medium border border-stone-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
