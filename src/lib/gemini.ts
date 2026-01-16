import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Agent, Park, Message } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateAgentResponse(
  agent: Agent,
  context: {
    park: Park;
    nearbyAgents: Agent[];
    recentMessages: Message[];
    situation: string;
  }
): Promise<{ speech?: string; thought?: string; action?: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `あなたは以下のペルソナを持つキャラクターです。このキャラクターになりきって応答してください。

【キャラクター情報】
名前: ${agent.persona.name}
年齢: ${agent.persona.age}歳
性格: ${agent.persona.personality}
背景: ${agent.persona.background}
目標・興味: ${agent.persona.goals.join(', ')}
話し方: ${agent.persona.speakingStyle}

【現在の場所】
${context.park.name}: ${context.park.description}

【近くにいる人】
${context.nearbyAgents.length > 0
  ? context.nearbyAgents.map(a => `- ${a.persona.name}（${a.persona.age}歳）: ${a.persona.personality.slice(0, 30)}...`).join('\n')
  : '周りに誰もいません'}

【最近の会話】
${context.recentMessages.length > 0
  ? context.recentMessages.slice(-5).map(m => `${m.agentName}: ${m.content}`).join('\n')
  : 'まだ会話はありません'}

【状況】
${context.situation}

上記の状況で、このキャラクターとして自然に行動してください。
以下のJSON形式で応答してください：
{
  "speech": "発言内容（話す場合のみ、なければnull）",
  "thought": "心の中の考え（短く）",
  "action": "行動の説明（例：ベンチに座る、散歩を始める、など）"
}

キャラクターの性格と話し方を忠実に再現し、自然な日本語で応答してください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        speech: parsed.speech || undefined,
        thought: parsed.thought || undefined,
        action: parsed.action || undefined,
      };
    }

    return { thought: 'うーん...' };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { thought: '...' };
  }
}

export async function generateConversation(
  agents: Agent[],
  park: Park,
  topic?: string
): Promise<{ agentId: string; content: string }[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const agentDescriptions = agents.map(a => `
【${a.persona.name}】
年齢: ${a.persona.age}歳
性格: ${a.persona.personality}
背景: ${a.persona.background}
話し方: ${a.persona.speakingStyle}
`).join('\n');

  const prompt = `以下の${agents.length}人のキャラクターが${park.name}で出会い、会話を始めます。
${topic ? `話題: ${topic}` : '自然な流れで会話を始めてください。'}

${agentDescriptions}

この${agents.length}人の自然な会話を生成してください。各キャラクターの性格と話し方を忠実に再現してください。
5〜8ターンの会話を以下のJSON形式で出力してください：
[
  { "name": "キャラクター名", "content": "発言内容" },
  ...
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: { name: string; content: string }) => {
        const agent = agents.find(a => a.persona.name === item.name);
        return {
          agentId: agent?.id || agents[0].id,
          content: item.content,
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Gemini API error:', error);
    return [];
  }
}

export async function generateAgentDecision(
  agent: Agent,
  park: Park,
  nearbyAgents: Agent[]
): Promise<'walk' | 'talk' | 'rest' | 'explore'> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `キャラクター「${agent.persona.name}」（${agent.persona.personality}）が${park.name}にいます。
近くには${nearbyAgents.length > 0 ? nearbyAgents.map(a => a.persona.name).join('、') + 'がいます' : '誰もいません'}。

このキャラクターが次にとりそうな行動を1つ選んでください：
- walk: 散歩する
- talk: 近くの人と話す
- rest: 休憩する
- explore: 周りを探索する

キャラクターの性格を考慮して、最も自然な選択を1単語で答えてください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().toLowerCase().trim();

    if (text.includes('walk')) return 'walk';
    if (text.includes('talk')) return 'talk';
    if (text.includes('rest')) return 'rest';
    if (text.includes('explore')) return 'explore';

    return 'walk';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'walk';
  }
}
