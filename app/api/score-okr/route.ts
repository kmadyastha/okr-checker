// app/api/score-okr/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert OKR (Objectives and Key Results) coach.
Given a user's draft OKR, you will:
1. Score it from 0-10 on quality (0 = not an OKR at all / no measurability, 10 = textbook-perfect OKR)
2. Give a short one-line verdict (e.g. "Vague and unmeasurable", "Solid, but could be more ambitious", "Excellent OKR")
3. Give 2-3 short bullet points explaining the score, referencing OKR best practices (specificity, measurability, ambition, alignment to outcomes not tasks). Each bullet should be one concise sentence.
4. Provide exactly 3 improved, better-framed versions of the OKR. Each version must have ONE objective (a short qualitative statement) and exactly 3 key results (short quantitative, measurable statements). Do NOT merge them into one sentence.

Respond with ONLY valid JSON, no markdown formatting, no code fences, in exactly this shape:
{
  "score": <number 0-10>,
  "verdict": "<short phrase>",
  "reasoningPoints": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
  "improvedOKRs": [
    { "objective": "<objective text>", "keyResults": ["<kr1>", "<kr2>", "<kr3>"] },
    { "objective": "<objective text>", "keyResults": ["<kr1>", "<kr2>", "<kr3>"] },
    { "objective": "<objective text>", "keyResults": ["<kr1>", "<kr2>", "<kr3>"] }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { draftOKR } = await req.json();

    if (!draftOKR || typeof draftOKR !== 'string' || draftOKR.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a draft OKR to check.' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Here is my draft OKR:\n\n${draftOKR}` },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    const rawText = textBlock && 'text' in textBlock ? textBlock.text : '{}';

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('OKR scoring error:', err);
    return NextResponse.json(
      { error: 'Something went wrong scoring your OKR. Please try again.' },
      { status: 500 }
    );
  }
}