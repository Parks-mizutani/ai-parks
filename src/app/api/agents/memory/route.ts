import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { agentName, persona, conversations, currentDay } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      // AIキーがない場合はシンプルな抽出
      const memories = conversations.slice(0, 3).map((conv: { messages: { content: string }[] }, i: number) => ({
        id: `memory-${Date.now()}-${i}`,
        content: conv.messages[0]?.content?.slice(0, 50) + '...' || '会話をした',
        importance: 'normal',
        relatedAgentIds: [],
        createdAt: new Date(),
        dayNumber: currentDay - 1,
      }));

      return NextResponse.json({
        memories,
        summary: `${conversations.length}件の会話があった日だった。`,
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 会話履歴をテキスト化
    const conversationText = conversations.map((conv: {
      participantNames: string[];
      locationName: string;
      messages: { speakerName: string; content: string }[];
    }, i: number) => {
      const msgs = conv.messages.map((m) => `${m.speakerName}: ${m.content}`).join('\n');
      return `【会話${i + 1}】場所: ${conv.locationName}\n参加者: ${conv.participantNames.join(', ')}\n${msgs}`;
    }).join('\n\n');

    const prompt = `あなたは${agentName}です。
性格: ${persona.personality}
背景: ${persona.background}

以下は今日一日の会話記録です。この会話から、あなた（${agentName}）にとって重要な記憶を3つまで抽出してください。
記憶は短い一文で、あなたの視点から書いてください（「〜と話した」「〜だった」など）。
重要度は trivial（些細）, normal（普通）, important（重要）, critical（非常に重要）で評価してください。

会話記録:
${conversationText || '（会話なし）'}

以下のJSON形式で回答してください:
{
  "memories": [
    { "content": "記憶の内容", "importance": "重要度", "relatedAgents": ["関連する人の名前"] }
  ],
  "daySummary": "今日一日を一文でまとめる"
}

JSONのみを出力してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 記憶オブジェクトに変換
    const memories = (parsed.memories || []).map((m: { content: string; importance: string; relatedAgents?: string[] }, i: number) => ({
      id: `memory-${Date.now()}-${i}`,
      content: m.content,
      importance: m.importance || 'normal',
      relatedAgentIds: [], // 名前からIDへの変換は呼び出し側で行う
      relatedAgentNames: m.relatedAgents || [],
      createdAt: new Date(),
      dayNumber: currentDay - 1,
    }));

    return NextResponse.json({
      memories,
      summary: parsed.daySummary || '特に何もない日だった。',
    });
  } catch (error) {
    console.error('Memory extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract memories', memories: [], summary: '' },
      { status: 500 }
    );
  }
}
