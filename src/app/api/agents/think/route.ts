import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent, park } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ thought: null });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `あなたは「${agent.persona.name}」というキャラクターです。

【プロフィール】
年齢: ${agent.persona.age}歳
性格: ${agent.persona.personality}
背景: ${agent.persona.background}
目標: ${agent.persona.goals?.join(', ') || '特になし'}

【現在の状況】
${park.name}（${park.description}）で過ごしています。

このキャラクターが今この瞬間に心の中で思っていることを、短い一言（20文字以内）で答えてください。
キャラクターの性格や背景を反映した自然な思考にしてください。
「」や思考を示す記号は不要です。思考の内容だけを返してください。`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const thought = response.text().trim().replace(/^[「『]|[」』]$/g, '');

    return NextResponse.json({ thought });
  } catch (error) {
    console.error('Think API error:', error);
    return NextResponse.json({ thought: null });
  }
}
