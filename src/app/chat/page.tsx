'use client';

import { useEffect, useState, useRef } from 'react';
import { db, getSettings } from '@/lib/db';
import type { ChatMessage, Meal } from '@/lib/types';
import { formatTimeIST, todayIST, startOfDayIST, endOfDayIST } from '@/lib/date-utils';

const starterPrompts = [
  'What should I eat more of?',
  'Set a protein goal for me',
  'How balanced is my diet?',
  'Suggest healthy Mangalorean meals',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const msgs = await db.chatMessages.orderBy('timestamp').toArray();
      setMessages(msgs);
    } finally {
      setInitialLoading(false);
    }
  }

  async function buildContext(): Promise<string> {
    const settings = await getSettings();
    const today = todayIST();
    const dayStart = startOfDayIST(today);
    const dayEnd = endOfDayIST(today);

    const todayMeals = await db.meals
      .where('timestamp')
      .between(dayStart, dayEnd, true, true)
      .toArray();

    // Get last 7 days of meals for weekly context
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekMeals = await db.meals
      .where('timestamp')
      .above(weekAgo)
      .toArray();

    const goals = await db.goals.toArray();
    const scoreHistory = await db.scoreHistory.orderBy('date').reverse().limit(7).toArray();

    let context = `User Profile: ${settings.name || 'User'}, Age: ${settings.age}, Gender: ${settings.gender}, Activity: ${settings.activityLevel}`;

    if (settings.dietaryPreferences.length > 0) {
      context += `\nDietary preferences: ${settings.dietaryPreferences.join(', ')}`;
    }
    if (settings.healthConditions.length > 0) {
      context += `\nHealth conditions: ${settings.healthConditions.join(', ')}`;
    }

    if (todayMeals.length > 0) {
      context += `\n\nToday's meals (${todayMeals.length}):`;
      todayMeals.forEach((m: Meal) => {
        const items = m.items.map(i => `${i.name} (${i.quantity})`).join(', ');
        context += `\n- ${m.mealType}: ${items} [${Math.round(m.nutrients.calories)} kcal, P:${Math.round(m.nutrients.protein)}g, C:${Math.round(m.nutrients.carbs)}g, F:${Math.round(m.nutrients.fat)}g]`;
        if (m.notes) context += ` Notes: ${m.notes}`;
        if (m.feelingNotes) context += ` Feeling: ${m.feelingNotes}`;
      });

      const totalCals = todayMeals.reduce((s: number, m: Meal) => s + m.nutrients.calories, 0);
      const totalProtein = todayMeals.reduce((s: number, m: Meal) => s + m.nutrients.protein, 0);
      context += `\nToday's totals: ${Math.round(totalCals)} kcal, ${Math.round(totalProtein)}g protein`;
    } else {
      context += '\n\nNo meals logged today yet.';
    }

    if (weekMeals.length > 0) {
      context += `\n\nThis week: ${weekMeals.length} meals logged over the past 7 days.`;
      const avgCals = weekMeals.reduce((s: number, m: Meal) => s + m.nutrients.calories, 0) / Math.max(weekMeals.length, 1);
      context += ` Average meal calories: ${Math.round(avgCals)}.`;
    }

    if (scoreHistory.length > 0) {
      context += `\n\nRecent nutrition scores: ${scoreHistory.map(s => `${s.date}: ${s.score}`).join(', ')}`;
    }

    if (goals.length > 0) {
      context += `\n\nActive goals:`;
      goals.forEach(g => {
        context += `\n- ${g.title}: ${g.current}/${g.target} ${g.unit} (${g.period})`;
      });
    }

    return context;
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    await db.chatMessages.add(userMsg);
    setLoading(true);

    try {
      const context = await buildContext();
      const allMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          userContext: context,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Chat failed');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      await db.chatMessages.add(assistantMsg);

      // Check for goal suggestions in response
      const goalMatch = data.response.match(/GOAL:\s*({[^}]+})/);
      if (goalMatch) {
        try {
          const goalData = JSON.parse(goalMatch[1]);
          await db.goals.add({
            id: crypto.randomUUID(),
            ...goalData,
            current: 0,
            createdAt: Date.now(),
          });
        } catch {
          // Ignore parse errors for goals
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Sorry, I could not respond. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      await db.chatMessages.add(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    await db.chatMessages.clear();
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between bg-primary-50 border-b border-primary-100">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Nutrition Chat</h1>
          <p className="text-sm text-stone-400">Ask me about your diet & goals</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-stone-400 px-3 py-1.5 rounded-lg bg-white border border-stone-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36">
        {initialLoading ? (
          <div className="space-y-3">
            <div className="h-16 skeleton rounded-2xl w-3/4" />
            <div className="h-12 skeleton rounded-2xl w-2/3 ml-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center pt-8">
            <div className="text-5xl mb-4">🥗</div>
            <h2 className="text-lg font-semibold text-stone-700 mb-2">
              Your Nutrition Assistant
            </h2>
            <p className="text-stone-400 text-sm mb-6 max-w-xs mx-auto">
              Ask me about your diet, set goals, or get meal suggestions based on your eating patterns
            </p>
            <div className="space-y-2">
              {starterPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="block w-full text-left bg-white rounded-xl px-4 py-3 text-stone-600 border border-primary-100 active:bg-primary-50 text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white text-stone-700 border border-primary-100 rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content.replace(/GOAL:\s*{[^}]+}/g, '').trim()}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-stone-300'}`}>
                  {formatTimeIST(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 border border-primary-100 rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-[72px] left-0 right-0 bg-white border-t border-primary-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about nutrition..."
            className="flex-1 bg-stone-50 rounded-xl px-4 py-3 text-stone-700 border border-stone-200 outline-none focus:border-primary-300 text-base"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
