import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 60; // Allow up to 60s for vision analysis

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please ask the app developer to set ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }

    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: FOOD_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this meal photo. Identify all food items, estimate portions and nutritional content. Return the JSON response.',
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = textBlock.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonStr);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';

    if (message.includes('invalid_api_key') || message.includes('authentication')) {
      return NextResponse.json({ error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.' }, { status: 401 });
    }
    if (message.includes('rate_limit')) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }
    if (message.includes('credit') || message.includes('billing') || message.includes('payment')) {
      return NextResponse.json({ error: 'API billing issue. Please add credits at console.anthropic.com.' }, { status: 402 });
    }
    if (message.includes('not_found') || message.includes('model')) {
      return NextResponse.json({ error: 'AI model not available. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 });
  }
}
