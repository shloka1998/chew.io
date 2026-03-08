import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please ask the app developer to set ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }

    const { imageBase64, mediaType, textDescription } = await request.json();

    if (!imageBase64 && !textDescription) {
      return NextResponse.json({ error: 'No image or description provided' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    // Build message content based on whether we have an image or text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = [];

    if (imageBase64) {
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType || 'image/jpeg',
          data: imageBase64,
        },
      });
      userContent.push({
        type: 'text',
        text: 'Analyze this meal photo. Identify all food items, estimate portions and nutritional content. Return the JSON response.',
      });
    } else {
      userContent.push({
        type: 'text',
        text: `The user described their meal as: "${textDescription}"\n\nBased on this description, identify all food items, estimate typical Indian portion sizes and nutritional content. Return the JSON response.`,
      });
    }

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: FOOD_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const textBlock = response.content.find((block: { type: string }) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jsonStr = (textBlock as any).text as string;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonStr);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error('Analysis error:', error);

    // Extract the most useful error info
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    // Anthropic SDK errors often have a status and error body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = (error as any)?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorBody = (error as any)?.error;

    if (statusCode === 401 || message.includes('invalid_api_key') || message.includes('authentication')) {
      return NextResponse.json({ error: 'Invalid API key. Please check your ANTHROPIC_API_KEY in Vercel settings.' }, { status: 401 });
    }
    if (statusCode === 429 || message.includes('rate_limit')) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }
    if (message.includes('credit') || message.includes('billing') || message.includes('payment') || message.includes('Could not resolve payment')) {
      return NextResponse.json({ error: 'No API credits. Please add credits at console.anthropic.com/settings/billing' }, { status: 402 });
    }
    if (statusCode === 400 && message.includes('Could not process image')) {
      return NextResponse.json({ error: 'Could not read the photo. Please try a different image.' }, { status: 400 });
    }

    // Return full error details so we can debug
    const detail = errorBody?.error?.message || errorBody?.message || message;
    return NextResponse.json({ error: `Analysis failed: ${detail}` }, { status: statusCode || 500 });
  }
}
