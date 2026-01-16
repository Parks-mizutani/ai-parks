'use client';

import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/stores/useStore';
import type { Agent, Position, Message } from '@/types';

// 2点間の距離を計算
function distance(p1: Position, p2: Position): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// ランダムな位置を生成
function randomPosition(width: number, height: number, margin = 50): Position {
  return {
    x: Math.random() * (width - margin * 2) + margin,
    y: Math.random() * (height - margin * 2) + margin,
  };
}

// 目標に向かって移動
function moveTowards(current: Position, target: Position, speed: number): Position {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < speed) {
    return target;
  }

  return {
    x: current.x + (dx / dist) * speed,
    y: current.y + (dy / dist) * speed,
  };
}

export function useSimulation() {
  const {
    simulation,
    agents,
    currentPark,
    chatLog,
    aiMode,
    updateAgentPosition,
    updateAgentStatus,
    addMessage,
  } = useStore();

  // エージェントごとの目標位置
  const targetPositions = useRef<Map<string, Position>>(new Map());
  // 次のアクションまでの待機時間
  const actionTimers = useRef<Map<string, number>>(new Map());
  // 会話クールダウン
  const conversationCooldown = useRef<Map<string, number>>(new Map());
  // 会話中フラグ（重複防止）
  const isConversing = useRef<Set<string>>(new Set());

  // AIを使った会話生成
  const generateAIConversation = useCallback(
    async (agent1: Agent, agent2: Agent, recentMessages: Message[]) => {
      try {
        const response = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agents: [agent1, agent2],
            park: currentPark,
            recentMessages: recentMessages.slice(-10),
            situation: `${agent1.persona.name}と${agent2.persona.name}が公園で出会い、会話を始めます。お互いのペルソナに基づいて自然な会話をしてください。`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.responses;
        }
      } catch (error) {
        console.error('AI conversation error:', error);
      }
      return null;
    },
    [currentPark]
  );

  // シンプルな会話生成（APIがない場合のフォールバック）
  const generateSimpleConversation = useCallback(
    (agent1: Agent, agent2: Agent): { agentId: string; content: string }[] => {
      const greetings = [
        'こんにちは！',
        'やあ！',
        'おはようございます！',
        'いい天気ですね！',
      ];

      const responses = [
        'そうですね！',
        '本当ですね！',
        'いい日ですね！',
        '気持ちいいですね！',
      ];

      const topics = [
        `最近${agent1.persona.goals[0] || '色々なこと'}に興味があって...`,
        `${currentPark?.name || 'この公園'}はいいところですね`,
        '何かおすすめはありますか？',
        'お散歩ですか？',
      ];

      return [
        {
          agentId: agent1.id,
          content: greetings[Math.floor(Math.random() * greetings.length)],
        },
        {
          agentId: agent2.id,
          content: responses[Math.floor(Math.random() * responses.length)],
        },
        {
          agentId: agent1.id,
          content: topics[Math.floor(Math.random() * topics.length)],
        },
      ];
    },
    [currentPark]
  );

  // AI思考生成
  const generateAIThought = useCallback(
    async (agent: Agent) => {
      try {
        const response = await fetch('/api/agents/think', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent,
            park: currentPark,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.thought;
        }
      } catch (error) {
        console.error('AI thought error:', error);
      }
      return null;
    },
    [currentPark]
  );

  // 会話を実行する関数
  const executeConversation = useCallback(
    async (agent: Agent, partner: Agent, useAI: boolean) => {
      // 既に会話中ならスキップ
      if (isConversing.current.has(agent.id) || isConversing.current.has(partner.id)) {
        return;
      }

      isConversing.current.add(agent.id);
      isConversing.current.add(partner.id);

      updateAgentStatus(agent.id, 'talking');
      updateAgentStatus(partner.id, 'talking');

      let conversation: { agentId: string; content: string; thought?: string }[] = [];

      if (useAI) {
        // AI会話を試行
        const aiResponses = await generateAIConversation(agent, partner, chatLog);
        if (aiResponses && aiResponses.length > 0) {
          conversation = aiResponses.map((resp: { agentId: string; speech?: string; thought?: string }) => ({
            agentId: resp.agentId,
            content: resp.speech || '',
            thought: resp.thought,
          })).filter((c: { content: string }) => c.content);
        }
      }

      // AI会話が取得できなかった場合はシンプル会話
      if (conversation.length === 0) {
        conversation = generateSimpleConversation(agent, partner);
      }

      const speed = useStore.getState().simulation.speed;
      const messageInterval = 2500 / speed;

      // 会話を順番に表示
      conversation.forEach((msg, index) => {
        setTimeout(() => {
          const speaker = [agent, partner].find((a) => a.id === msg.agentId) || agent;

          // 思考があれば先に表示
          if (msg.thought) {
            const thoughtMessage: Message = {
              id: uuidv4(),
              agentId: speaker.id,
              agentName: speaker.persona.name,
              content: msg.thought,
              timestamp: new Date(),
              type: 'thought',
            };
            addMessage(thoughtMessage);
          }

          // 発言を表示
          if (msg.content) {
            const speechMessage: Message = {
              id: uuidv4(),
              agentId: msg.agentId,
              agentName: speaker.persona.name,
              content: msg.content,
              timestamp: new Date(),
              type: 'speech',
            };
            addMessage(speechMessage);
            updateAgentStatus(msg.agentId, 'talking', msg.content);
          }
        }, index * messageInterval);
      });

      // 会話終了後の処理
      const conversationDuration = conversation.length * messageInterval + 1000;

      setTimeout(() => {
        updateAgentStatus(agent.id, 'idle');
        updateAgentStatus(partner.id, 'idle');
        isConversing.current.delete(agent.id);
        isConversing.current.delete(partner.id);
      }, conversationDuration);

      // クールダウン設定
      actionTimers.current.set(agent.id, conversationDuration + 2000);
      actionTimers.current.set(partner.id, conversationDuration + 2000);
      conversationCooldown.current.set(agent.id, conversationDuration + 8000);
      conversationCooldown.current.set(partner.id, conversationDuration + 8000);
    },
    [generateAIConversation, generateSimpleConversation, chatLog, updateAgentStatus, addMessage]
  );

  // メインのシミュレーションループ
  useEffect(() => {
    if (!simulation.isRunning || !currentPark) return;

    const intervalMs = 100 / simulation.speed;

    const interval = setInterval(() => {
      const currentAgents = useStore.getState().agents;
      const currentAIMode = useStore.getState().aiMode;

      currentAgents.forEach((agent) => {
        // 会話中ならスキップ
        if (isConversing.current.has(agent.id)) return;

        // アクションタイマーを更新
        const timer = actionTimers.current.get(agent.id) || 0;
        if (timer > 0) {
          actionTimers.current.set(agent.id, timer - intervalMs);
          return;
        }

        // 会話クールダウンを更新
        const cooldown = conversationCooldown.current.get(agent.id) || 0;
        if (cooldown > 0) {
          conversationCooldown.current.set(agent.id, cooldown - intervalMs);
        }

        // 近くのエージェントを探す
        const nearbyAgents = currentAgents.filter(
          (other) =>
            other.id !== agent.id &&
            !isConversing.current.has(other.id) &&
            distance(agent.position, other.position) < 100 &&
            (conversationCooldown.current.get(other.id) || 0) <= 0
        );

        // 行動を決定
        const action = Math.random();

        if (nearbyAgents.length > 0 && action < 0.25 && cooldown <= 0) {
          // 会話を開始
          const partner = nearbyAgents[Math.floor(Math.random() * nearbyAgents.length)];
          executeConversation(agent, partner, currentAIMode);
        } else if (action < 0.6) {
          // 移動
          const target = targetPositions.current.get(agent.id);
          if (target && distance(agent.position, target) > 5) {
            const newPos = moveTowards(agent.position, target, 2.5 * simulation.speed);
            updateAgentPosition(agent.id, newPos);
            updateAgentStatus(agent.id, 'walking');
          } else {
            // 新しい目標を設定
            const newTarget = randomPosition(currentPark.width, currentPark.height);
            targetPositions.current.set(agent.id, newTarget);
            updateAgentStatus(agent.id, 'idle');
          }
        } else if (action < 0.75) {
          // 思考
          updateAgentStatus(agent.id, 'thinking');

          // AIモードなら非同期でAI思考を試行
          if (currentAIMode) {
            generateAIThought(agent).then((thought) => {
              const content = thought || getRandomThought(agent);
              const message: Message = {
                id: uuidv4(),
                agentId: agent.id,
                agentName: agent.persona.name,
                content,
                timestamp: new Date(),
                type: 'thought',
              };
              addMessage(message);
            });
          } else {
            const thought = getRandomThought(agent);
            const message: Message = {
              id: uuidv4(),
              agentId: agent.id,
              agentName: agent.persona.name,
              content: thought,
              timestamp: new Date(),
              type: 'thought',
            };
            addMessage(message);
          }

          actionTimers.current.set(agent.id, 4000 / simulation.speed);
          setTimeout(() => {
            updateAgentStatus(agent.id, 'idle');
          }, 3000 / simulation.speed);
        } else {
          // 待機
          updateAgentStatus(agent.id, 'idle');
          actionTimers.current.set(agent.id, 2500 / simulation.speed);
        }
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    simulation.isRunning,
    simulation.speed,
    currentPark,
    updateAgentPosition,
    updateAgentStatus,
    addMessage,
    executeConversation,
    generateAIThought,
  ]);

  return { executeConversation };
}

// ランダムな思考を生成（ペルソナベース）
function getRandomThought(agent: Agent): string {
  const thoughts = [
    `${agent.persona.goals[0] || '目標'}について考えてる...`,
    'いい天気だな...',
    'お腹すいたかも',
    '誰かと話したいな',
    `${agent.persona.background.slice(0, 10)}...のことを思い出した`,
    'のんびりできていいな',
    '何か面白いことないかな',
    'ちょっと疲れたかも',
  ];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}
