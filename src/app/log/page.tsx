'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { processImage, blobToBase64, blobToUrl } from '@/lib/image-utils';
import { getMealTypeFromTime } from '@/lib/date-utils';
import type { MealType, AnalysisResponse } from '@/lib/types';

const mealTypes: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
];

type InputMode = 'choose' | 'photo' | 'text';

export default function LogMealPage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>('choose');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [fullImage, setFullImage] = useState<Blob | null>(null);
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [mealType, setMealType] = useState<MealType>(getMealTypeFromTime());
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [notes, setNotes] = useState('');
  const [feelingNotes, setFeelingNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setInputMode('photo');
    try {
      const processed = await processImage(file);
      setFullImage(processed.fullImage);
      setThumbnail(processed.thumbnail);
      setPhotoPreview(blobToUrl(processed.fullImage));
    } catch (err) {
      console.error('Image processing failed:', err);
      setError('Could not process the photo. Please try again.');
      setInputMode('choose');
    }
  }

  async function analyzePhoto() {
    if (!fullImage) return;
    setAnalyzing(true);
    setError('');

    try {
      const base64 = await blobToBase64(fullImage);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data: AnalysisResponse = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Could not analyze the photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzeText() {
    if (!textDescription.trim()) return;
    setAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textDescription: textDescription.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data: AnalysisResponse = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Could not analyze. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveMeal() {
    if (!analysis) return;
    // For photo mode, need fullImage; for text mode, need textDescription
    if (inputMode === 'photo' && !fullImage) return;
    if (inputMode === 'text' && !textDescription.trim()) return;
    setSaving(true);

    try {
      const meal: Record<string, unknown> = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mealType,
        items: analysis.items,
        nutrients: analysis.totalNutrients,
        notes,
        feelingNotes,
        score: analysis.mealScore,
        scoreExplanation: analysis.scoreExplanation,
        suggestions: analysis.suggestions,
      };

      if (inputMode === 'photo' && fullImage && thumbnail) {
        meal.photo = fullImage;
        meal.photoThumbnail = thumbnail;
      } else {
        meal.textDescription = textDescription.trim();
      }

      await db.meals.add(meal);
      router.push(`/meal/${meal.id}`);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Could not save the meal. Please try again.');
      setSaving(false);
    }
  }

  function resetInput() {
    setPhotoPreview('');
    setFullImage(null);
    setThumbnail(null);
    setTextDescription('');
    setAnalysis(null);
    setError('');
    setInputMode('choose');
  }

  const hasInput = inputMode === 'photo' ? !!photoPreview : inputMode === 'text' ? !!textDescription.trim() : false;

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white border border-primary-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-stone-800">Log a Meal</h1>
      </div>

      {/* Input Mode Selection */}
      {inputMode === 'choose' && (
        <div className="space-y-4">
          {/* Camera button */}
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full bg-primary-600 text-white text-lg font-semibold py-6 rounded-2xl shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Take a Photo
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />

          {/* Gallery button */}
          <button
            onClick={() => galleryRef.current?.click()}
            className="w-full bg-white text-primary-600 text-lg font-semibold py-6 rounded-2xl border-2 border-primary-200 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Choose from Gallery
          </button>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="hidden"
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-sm text-stone-400 font-medium">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Type it button */}
          <button
            onClick={() => setInputMode('text')}
            className="w-full bg-white text-stone-700 text-lg font-semibold py-6 rounded-2xl border-2 border-stone-200 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Type What You Ate
          </button>

          <p className="text-center text-stone-400 text-sm">
            Take a photo or describe your meal for nutrition analysis
          </p>
        </div>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && !analysis && (
        <>
          <div className="bg-white rounded-2xl p-4 border border-primary-100">
            <label className="block text-sm font-medium text-stone-500 mb-2">
              Describe what you ate
            </label>
            <textarea
              value={textDescription}
              onChange={e => setTextDescription(e.target.value)}
              placeholder="e.g., 2 neer dosa with coconut chutney and chicken curry, one glass of buttermilk..."
              rows={4}
              autoFocus
              className="w-full bg-stone-50 rounded-xl p-3 text-stone-700 border-none outline-none resize-none text-base"
            />
            <button
              onClick={resetInput}
              className="text-sm text-stone-400 mt-2 underline"
            >
              Use a photo instead
            </button>
          </div>

          {/* Meal type selector */}
          <div>
            <p className="text-sm font-medium text-stone-500 mb-2">What meal is this?</p>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map(mt => (
                <button
                  key={mt.value}
                  onClick={() => setMealType(mt.value)}
                  className={`py-3 rounded-xl text-center text-sm font-medium ${
                    mealType === mt.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-stone-600 border border-primary-100'
                  }`}
                >
                  <div className="text-lg">{mt.icon}</div>
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {!analyzing && (
            <button
              onClick={analyzeText}
              disabled={!textDescription.trim()}
              className="w-full bg-primary-600 text-white text-lg font-semibold py-5 rounded-2xl shadow-lg active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Analyze My Meal
            </button>
          )}

          {analyzing && (
            <div className="bg-white rounded-2xl p-8 text-center border border-primary-100">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
              <p className="text-stone-600 font-medium">Analyzing your meal...</p>
              <p className="text-stone-400 text-sm mt-1">Estimating nutrition from your description</p>
            </div>
          )}
        </>
      )}

      {/* Photo Mode */}
      {inputMode === 'photo' && photoPreview && !analysis && (
        <>
          {/* Photo preview */}
          <div className="relative">
            <img
              src={photoPreview}
              alt="Your meal"
              className="w-full rounded-2xl shadow-sm max-h-72 object-cover"
            />
            <button
              onClick={resetInput}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>

          {/* Meal type selector */}
          <div>
            <p className="text-sm font-medium text-stone-500 mb-2">What meal is this?</p>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map(mt => (
                <button
                  key={mt.value}
                  onClick={() => setMealType(mt.value)}
                  className={`py-3 rounded-xl text-center text-sm font-medium ${
                    mealType === mt.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-stone-600 border border-primary-100'
                  }`}
                >
                  <div className="text-lg">{mt.icon}</div>
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          {!analyzing && (
            <button
              onClick={analyzePhoto}
              className="w-full bg-primary-600 text-white text-lg font-semibold py-5 rounded-2xl shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Analyze My Meal
            </button>
          )}

          {/* Analyzing state */}
          {analyzing && (
            <div className="bg-white rounded-2xl p-8 text-center border border-primary-100">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
              <p className="text-stone-600 font-medium">Analyzing your meal...</p>
              <p className="text-stone-400 text-sm mt-1">Identifying food items and nutrition</p>
            </div>
          )}
        </>
      )}

      {/* Analysis Results (shared between photo and text modes) */}
      {analysis && (
        <div className="space-y-4">
          {/* Show photo preview if photo mode */}
          {inputMode === 'photo' && photoPreview && (
            <img src={photoPreview} alt="Your meal" className="w-full rounded-2xl shadow-sm max-h-48 object-cover" />
          )}

          {/* Show text description if text mode */}
          {inputMode === 'text' && textDescription && (
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <p className="text-sm text-stone-500 font-medium mb-1">You described:</p>
              <p className="text-stone-700">{textDescription}</p>
            </div>
          )}

          {/* Score */}
          <div className="bg-white rounded-2xl p-4 border border-primary-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-700">Meal Score</span>
              <span className={`text-2xl font-bold ${
                analysis.mealScore >= 70 ? 'text-green-600' :
                analysis.mealScore >= 50 ? 'text-amber-500' : 'text-orange-500'
              }`}>
                {analysis.mealScore}/100
              </span>
            </div>
            <p className="text-sm text-stone-500">{analysis.scoreExplanation}</p>
          </div>

          {/* Food items */}
          <div className="bg-white rounded-2xl p-4 border border-primary-100">
            <h3 className="font-semibold text-stone-700 mb-3">Food Items Found</h3>
            <div className="space-y-2">
              {analysis.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div>
                    <span className="font-medium text-stone-700">{item.name}</span>
                    {item.nameKannada && (
                      <span className="text-sm text-stone-400 ml-2">{item.nameKannada}</span>
                    )}
                    <p className="text-xs text-stone-400">{item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-primary-600">
                    {Math.round(item.calories)} kcal
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between">
              <span className="font-semibold text-stone-700">Total</span>
              <span className="font-bold text-primary-600">
                {Math.round(analysis.totalNutrients.calories)} kcal
              </span>
            </div>
          </div>

          {/* Suggestion */}
          {analysis.suggestions && (
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <p className="text-sm text-green-800">
                {analysis.suggestions}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl p-4 border border-primary-100">
            <label className="block text-sm font-medium text-stone-500 mb-2">
              Notes about this meal (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Homemade, used less oil today..."
              rows={2}
              className="w-full bg-stone-50 rounded-xl p-3 text-stone-700 border-none outline-none resize-none text-base"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-primary-100">
            <label className="block text-sm font-medium text-stone-500 mb-2">
              How do you feel after eating? (optional)
            </label>
            <textarea
              value={feelingNotes}
              onChange={e => setFeelingNotes(e.target.value)}
              placeholder="e.g., Feeling full and energetic..."
              rows={2}
              className="w-full bg-stone-50 rounded-xl p-3 text-stone-700 border-none outline-none resize-none text-base"
            />
          </div>

          {/* Save button */}
          <button
            onClick={saveMeal}
            disabled={saving}
            className="w-full bg-green-600 text-white text-lg font-semibold py-5 rounded-2xl shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Meal</>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-600 text-sm font-medium mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
