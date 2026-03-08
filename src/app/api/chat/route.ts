import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured.' },
        { status: 500 }
      );
    }

    const { messages, userContext } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `${CHAT_SYSTEM_PROMPT}\n\n## User Context\n${userContext || 'No meal history available yet.'}`;

    // Limit to last 10 messages for cost control
    const recentMessages = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: recentMessages,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    return NextResponse.json({ response: textBlock.text });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Chat failed';

    if (message.includes('invalid_api_key')) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Could not get a response. Please try again.' }, { status: 500 });
  }
}
