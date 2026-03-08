import type { Meal, NutritionScoreRecord, UserSettings } from './types';
import { getRDA, FOOD_GROUP_KEYWORDS, type FoodGroup } from './nutrition-data';

export function calculateDailyScore(
  meals: Meal[],
  settings: UserSettings
): NutritionScoreRecord {
  const rda = getRDA(settings.gender, settings.activityLevel);

  const variety = calculateVariety(meals);
  const balance = calculateBalance(meals, rda);
  const consistency = calculateConsistency(meals);
  const micronutrients = calculateMicronutrients(meals, rda, settings.gender);

  const today = new Date().toISOString().split('T')[0];

  return {
    date: today,
    score: Math.round(variety + balance + consistency + micronutrients),
    mealsLogged: meals.length,
    breakdown: {
      variety: Math.round(variety),
      balance: Math.round(balance),
      consistency: Math.round(consistency),
      micronutrients: Math.round(micronutrients),
    },
  };
}

function calculateVariety(meals: Meal[]): number {
  // Max 25 points: count unique food groups
  const groupsFound = new Set<FoodGroup>();

  for (const meal of meals) {
    for (const item of meal.items) {
      const name = item.name.toLowerCase();
      for (const [group, keywords] of Object.entries(FOOD_GROUP_KEYWORDS)) {
        if (keywords.some(kw => name.includes(kw))) {
          groupsFound.add(group as FoodGroup);
        }
      }
    }
  }

  const count = groupsFound.size;
  if (count >= 5) return 25;
  if (count === 4) return 20;
  if (count === 3) return 15;
  if (count === 2) return 10;
  if (count === 1) return 5;
  return 0;
}

function calculateBalance(
  meals: Meal[],
  rda: ReturnType<typeof getRDA>
): number {
  // Max 25 points: how close are macros to ICMR targets
  if (meals.length === 0) return 0;

  const totalCals = meals.reduce((s, m) => s + m.nutrients.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.nutrients.protein, 0);
  const totalFat = meals.reduce((s, m) => s + m.nutrients.fat, 0);

  let score = 0;

  // Calorie adequacy (0-8 points)
  const calRatio = totalCals / rda.calories;
  if (calRatio >= 0.7 && calRatio <= 1.3) score += 8;
  else if (calRatio >= 0.5 && calRatio <= 1.5) score += 5;
  else score += 2;

  // Protein adequacy (0-9 points) - critical for aging adults
  const proteinRatio = totalProtein / rda.protein;
  if (proteinRatio >= 0.8 && proteinRatio <= 1.5) score += 9;
  else if (proteinRatio >= 0.6 && proteinRatio <= 2.0) score += 5;
  else score += 2;

  // Fat balance (0-8 points)
  const fatCals = totalFat * 9;
  const fatPercent = totalCals > 0 ? (fatCals / totalCals) * 100 : 0;
  if (fatPercent >= 20 && fatPercent <= 30) score += 8;
  else if (fatPercent >= 15 && fatPercent <= 35) score += 5;
  else score += 2;

  return score;
}

function calculateConsistency(meals: Meal[]): number {
  // Max 25 points: regular meal timing
  if (meals.length === 0) return 0;

  let score = 0;
  const types = new Set(meals.map(m => m.mealType));

  // Points for having meals at regular times
  if (types.has('breakfast')) score += 8;
  if (types.has('lunch')) score += 8;
  if (types.has('dinner')) score += 7;

  // Bonus for logging all 3 main meals
  if (types.has('breakfast') && types.has('lunch') && types.has('dinner')) {
    score += 2;
  }

  return Math.min(score, 25);
}

function calculateMicronutrients(
  meals: Meal[],
  rda: ReturnType<typeof getRDA>,
  gender: 'male' | 'female'
): number {
  // Max 25 points: calcium, iron, fiber, vitamin C adequacy
  if (meals.length === 0) return 0;

  const totals = {
    calcium: meals.reduce((s, m) => s + m.nutrients.calcium, 0),
    iron: meals.reduce((s, m) => s + m.nutrients.iron, 0),
    fiber: meals.reduce((s, m) => s + m.nutrients.fiber, 0),
    vitaminC: meals.reduce((s, m) => s + m.nutrients.vitaminC, 0),
  };

  const targets = {
    calcium: rda.calcium,
    iron: rda.iron,
    fiber: gender === 'male' ? 30 : 25,
    vitaminC: rda.vitaminC,
  };

  let score = 0;
  for (const [key, total] of Object.entries(totals)) {
    const target = targets[key as keyof typeof targets];
    const ratio = total / target;
    if (ratio >= 0.7) score += 6.25;
    else if (ratio >= 0.4) score += 3;
    else score += 1;
  }

  return Math.min(score, 25);
}
