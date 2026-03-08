import Dexie, { type Table } from 'dexie';
import type { Meal, Goal, NutritionScoreRecord, ChatMessage, UserSettings } from './types';

class ChewDB extends Dexie {
  meals!: Table<Meal>;
  goals!: Table<Goal>;
  scoreHistory!: Table<NutritionScoreRecord>;
  chatMessages!: Table<ChatMessage>;
  settings!: Table<UserSettings>;

  constructor() {
    super('ChewDB');
    this.version(1).stores({
      meals: 'id, timestamp, mealType',
      goals: 'id, category, createdAt',
      scoreHistory: 'date',
      chatMessages: 'id, timestamp',
      settings: 'id',
    });
  }
}

export const db = new ChewDB();

export async function getSettings(): Promise<UserSettings> {
  const settings = await db.settings.get('default');
  if (settings) return settings;
  const defaults: UserSettings = {
    id: 'default',
    name: '',
    age: 60,
    gender: 'male',
    weight: 70,
    height: 170,
    activityLevel: 'sedentary',
    dietaryPreferences: [],
    healthConditions: [],
  };
  await db.settings.put(defaults);
  return defaults;
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...updates, id: 'default' });
}
