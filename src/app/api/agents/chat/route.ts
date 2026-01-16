import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agents, park, recentMessages, situation } = body;

    if (!process.env.GEMINI_API_KEY) {
      // APIキーがない場合はモックレスポンスを返す
      return NextResponse.json({
        responses: agents.map((agent: { id: string; persona: { name: string } }) => ({
          agentId: agent.id,
          speech: `（${agent.persona.name}が何か考えています...）`,
          thought: '周りを見回している',
          action: 'idle',
        })),
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const agentDescriptions = agents.map((a: {
      persona: { name: string; age: number; personality: string; background: string; speakingStyle: string; goals: string[] }
    }) => `
【${a.persona.name}】
年齢: ${a.persona.age}歳
性格: ${a.persona.personality}
背景: ${a.persona.background}
話し方: ${a.persona.speakingStyle}
目標: ${a.persona.goals.join(', ')}
`).join('\n');

    const prompt = `以下のキャラクターたちが「${park.name}」（${park.description}）で過ごしています。

${agentDescriptions}

【最近の出来事】
${recentMessages?.slice(-10).map((m: { agentName: string; content: string }) => `${m.agentName}: ${m.content}`).join('\n') || 'まだ何も起きていません'}

【現在の状況】
${situation || 'キャラクターたちは公園で自由に過ごしています'}

各キャラクターの次の行動を生成してください。自然な会話や行動を心がけ、各キャラクターの性格を反映してください。

以下のJSON形式で応答してください：
[
  {
    "name": "キャラクター名",
    "speech": "発言内容（話さない場合はnull）",
    "thought": "心の中の考え",
    "action": "行動の説明"
  },
  ...
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const responses = parsed.map((item: { name: string; speech?: string; thought?: string; action?: string }) => {
        const agent = agents.find((a: { persona: { name: string } }) => a.persona.name === item.name);
        return {
          agentId: agent?.id || agents[0].id,
          speech: item.speech || null,
          thought: item.thought || '',
          action: item.action || 'idle',
        };
      });

      return NextResponse.json({ responses });
    }

    return NextResponse.json({ responses: [] });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
