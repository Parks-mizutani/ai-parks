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

  // AIを使った会話生成
  const generateAIConversation = useCallback(
    async (agent1: Agent, agent2: Agent) => {
      try {
        const response = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agents: [agent1, agent2],
            park: currentPark,
            recentMessages: [],
            situation: `${agent1.persona.name}と${agent2.persona.name}が公園で偶然出会いました。`,
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
        `最近${agent1.persona.goals[0]}に興味があって...`,
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

  // メインのシミュレーションループ
  useEffect(() => {
    if (!simulation.isRunning || !currentPark) return;

    const intervalMs = 100 / simulation.speed; // ベース100ms

    const interval = setInterval(() => {
      agents.forEach((agent) => {
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
        const nearbyAgents = agents.filter(
          (other) =>
            other.id !== agent.id &&
            distance(agent.position, other.position) < 80 &&
            (conversationCooldown.current.get(other.id) || 0) <= 0
        );

        // 行動を決定
        const action = Math.random();

        if (nearbyAgents.length > 0 && action < 0.3 && cooldown <= 0) {
          // 会話を開始
          const partner = nearbyAgents[Math.floor(Math.random() * nearbyAgents.length)];

          updateAgentStatus(agent.id, 'talking');
          updateAgentStatus(partner.id, 'talking');

          // 会話を生成（シンプル版）
          const conversation = generateSimpleConversation(agent, partner);

          conversation.forEach((msg, index) => {
            setTimeout(() => {
              const speaker = agents.find((a) => a.id === msg.agentId);
              if (speaker) {
                const message: Message = {
                  id: uuidv4(),
                  agentId: msg.agentId,
                  agentName: speaker.persona.name,
                  content: msg.content,
                  timestamp: new Date(),
                  type: 'speech',
                };
                addMessage(message);
                updateAgentStatus(msg.agentId, 'talking', msg.content);
              }
            }, index * 2000 / simulation.speed);
          });

          // 会話後のクールダウンを設定
          const conversationDuration = conversation.length * 2000 / simulation.speed;
          actionTimers.current.set(agent.id, conversationDuration + 1000);
          actionTimers.current.set(partner.id, conversationDuration + 1000);
          conversationCooldown.current.set(agent.id, conversationDuration + 5000);
          conversationCooldown.current.set(partner.id, conversationDuration + 5000);

          setTimeout(() => {
            updateAgentStatus(agent.id, 'idle');
            updateAgentStatus(partner.id, 'idle');
          }, conversationDuration);
        } else if (action < 0.6) {
          // 移動
          const target = targetPositions.current.get(agent.id);
          if (target && distance(agent.position, target) > 5) {
            const newPos = moveTowards(agent.position, target, 3 * simulation.speed);
            updateAgentPosition(agent.id, newPos);
            updateAgentStatus(agent.id, 'walking');
          } else {
            // 新しい目標を設定
            const newTarget = randomPosition(currentPark.width, currentPark.height);
            targetPositions.current.set(agent.id, newTarget);
            updateAgentStatus(agent.id, 'idle');
          }
        } else if (action < 0.8) {
          // 思考
          updateAgentStatus(agent.id, 'thinking');
          const thoughts = [
            'いい天気だな...',
            'お腹すいたかも',
            '何かしたいな',
            'のんびりするか',
            '誰かと話したいな',
          ];
          const thought = thoughts[Math.floor(Math.random() * thoughts.length)];

          const message: Message = {
            id: uuidv4(),
            agentId: agent.id,
            agentName: agent.persona.name,
            content: thought,
            timestamp: new Date(),
            type: 'thought',
          };
          addMessage(message);

          actionTimers.current.set(agent.id, 3000 / simulation.speed);
          setTimeout(() => {
            updateAgentStatus(agent.id, 'idle');
          }, 3000 / simulation.speed);
        } else {
          // 待機
          updateAgentStatus(agent.id, 'idle');
          actionTimers.current.set(agent.id, 2000 / simulation.speed);
        }
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    simulation.isRunning,
    simulation.speed,
    agents,
    currentPark,
    updateAgentPosition,
    updateAgentStatus,
    addMessage,
    generateSimpleConversation,
  ]);

  // AI会話を試行する関数（手動トリガー用）
  const triggerAIConversation = useCallback(
    async (agentIds: [string, string]) => {
      const [agent1, agent2] = agentIds.map((id) => agents.find((a) => a.id === id));
      if (!agent1 || !agent2) return;

      updateAgentStatus(agent1.id, 'talking');
      updateAgentStatus(agent2.id, 'talking');

      const responses = await generateAIConversation(agent1, agent2);

      if (responses) {
        responses.forEach(
          (resp: { agentId: string; speech?: string; thought?: string }, index: number) => {
            setTimeout(() => {
              const speaker = agents.find((a) => a.id === resp.agentId);
              if (speaker && resp.speech) {
                const message: Message = {
                  id: uuidv4(),
                  agentId: resp.agentId,
                  agentName: speaker.persona.name,
                  content: resp.speech,
                  timestamp: new Date(),
                  type: 'speech',
                };
                addMessage(message);
              }
            }, index * 2000);
          }
        );
      }

      setTimeout(() => {
        updateAgentStatus(agent1.id, 'idle');
        updateAgentStatus(agent2.id, 'idle');
      }, (responses?.length || 3) * 2000);
    },
    [agents, generateAIConversation, updateAgentStatus, addMessage]
  );

  return { triggerAIConversation };
}
