'use client';

import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/stores/useStore';
import type { Agent, Position, Message, Park } from '@/types';

// 2点間の距離を計算
function distance(p1: Position, p2: Position): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
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

// 目標の種類
type TargetType = 'agent' | 'feature' | 'wander';

interface AgentTarget {
  type: TargetType;
  position: Position;
  targetAgentId?: string;
  featureName?: string;
}

// 最も近いエージェントを見つける
function findNearestAgent(agent: Agent, agents: Agent[], excludeIds: Set<string>): Agent | null {
  let nearest: Agent | null = null;
  let minDist = Infinity;

  for (const other of agents) {
    if (other.id === agent.id || excludeIds.has(other.id)) continue;
    const dist = distance(agent.position, other.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = other;
    }
  }

  return nearest;
}

// パークの特徴的な場所からランダムに選ぶ
function getRandomFeaturePosition(park: Park): { position: Position; name: string } | null {
  if (!park.features || park.features.length === 0) return null;
  const feature = park.features[Math.floor(Math.random() * park.features.length)];
  return { position: feature.position, name: feature.name || feature.type };
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

  // エージェントごとの目標
  const agentTargets = useRef<Map<string, AgentTarget>>(new Map());
  // 次のアクションまでの待機時間
  const actionTimers = useRef<Map<string, number>>(new Map());
  // 会話クールダウン（特定ペアとの再会話防止）
  const pairCooldown = useRef<Map<string, number>>(new Map());
  // 会話中フラグ（重複防止）
  const isConversing = useRef<Set<string>>(new Set());

  // ペアのキーを生成
  const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join('-');

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
            situation: `${agent1.persona.name}と${agent2.persona.name}が${currentPark?.name || '公園'}で出会いました。お互いの性格や背景を踏まえて、自然で深みのある会話をしてください。`,
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
      // より自然な会話パターン
      const conversations = [
        // パターン1: 挨拶から始まる
        [
          { agent: agent1, content: `あ、${agent2.persona.name}さん！こんにちは！` },
          { agent: agent2, content: `${agent1.persona.name}さん！お久しぶりです` },
          { agent: agent1, content: `最近どうですか？` },
          { agent: agent2, content: `${agent2.persona.goals[0] || '色々'}に取り組んでますよ` },
          { agent: agent1, content: `へぇ、いいですね！私も${agent1.persona.goals[0] || '頑張って'}ます` },
        ],
        // パターン2: 場所について
        [
          { agent: agent1, content: `いい天気ですね！` },
          { agent: agent2, content: `本当に！${currentPark?.name || 'ここ'}は気持ちいいですね` },
          { agent: agent1, content: `よくここに来るんですか？` },
          { agent: agent2, content: `ええ、${agent2.persona.background.slice(0, 15)}...なので` },
          { agent: agent1, content: `なるほど！私は${agent1.persona.background.slice(0, 15)}...です` },
        ],
        // パターン3: 興味について
        [
          { agent: agent2, content: `${agent1.persona.name}さん、何してるんですか？` },
          { agent: agent1, content: `ちょっと散歩を...${agent2.persona.name}さんは？` },
          { agent: agent2, content: `私も！リフレッシュしたくて` },
          { agent: agent1, content: `最近${agent1.persona.goals[0] || '忙しくて'}...` },
          { agent: agent2, content: `わかります！お互い頑張りましょう` },
        ],
      ];

      const selected = conversations[Math.floor(Math.random() * conversations.length)];
      return selected.map((item) => ({
        agentId: item.agent.id,
        content: item.content,
      }));
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

      // 会話開始アクション
      const meetMessage: Message = {
        id: uuidv4(),
        agentId: agent.id,
        agentName: agent.persona.name,
        content: `${partner.persona.name}に話しかけた`,
        timestamp: new Date(),
        type: 'action',
      };
      addMessage(meetMessage);

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
      const messageInterval = 1800 / speed; // 少し早めに

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
      const conversationDuration = conversation.length * messageInterval + 500;

      setTimeout(() => {
        updateAgentStatus(agent.id, 'idle');
        updateAgentStatus(partner.id, 'idle');
        isConversing.current.delete(agent.id);
        isConversing.current.delete(partner.id);

        // 会話後、新しい目標を設定（別の人を探しに行く）
        agentTargets.current.delete(agent.id);
        agentTargets.current.delete(partner.id);
      }, conversationDuration);

      // このペアのクールダウン設定（同じ人とすぐには話さない）
      const pairKey = getPairKey(agent.id, partner.id);
      pairCooldown.current.set(pairKey, 15000 / speed);

      // アクションタイマー
      actionTimers.current.set(agent.id, conversationDuration + 500);
      actionTimers.current.set(partner.id, conversationDuration + 500);
    },
    [generateAIConversation, generateSimpleConversation, chatLog, updateAgentStatus, addMessage]
  );

  // 新しい目標を決定する
  const decideNewTarget = useCallback(
    (agent: Agent, allAgents: Agent[]): AgentTarget => {
      const park = useStore.getState().currentPark;
      if (!park) {
        return { type: 'wander', position: { x: 400, y: 300 } };
      }

      // 会話できる相手を探す（クールダウン中でない人）
      const availableAgents = allAgents.filter((other) => {
        if (other.id === agent.id) return false;
        if (isConversing.current.has(other.id)) return false;
        const pairKey = getPairKey(agent.id, other.id);
        if ((pairCooldown.current.get(pairKey) || 0) > 0) return false;
        return true;
      });

      // 70%の確率で誰かに向かう
      if (availableAgents.length > 0 && Math.random() < 0.7) {
        // 最も近い人か、ランダムな人を選ぶ
        const target = Math.random() < 0.6
          ? findNearestAgent(agent, availableAgents, isConversing.current) || availableAgents[0]
          : availableAgents[Math.floor(Math.random() * availableAgents.length)];

        return {
          type: 'agent',
          position: target.position,
          targetAgentId: target.id,
        };
      }

      // 25%の確率で特徴的な場所に向かう
      if (Math.random() < 0.8) {
        const feature = getRandomFeaturePosition(park);
        if (feature) {
          return {
            type: 'feature',
            position: feature.position,
            featureName: feature.name,
          };
        }
      }

      // ランダムに散策
      return {
        type: 'wander',
        position: {
          x: Math.random() * (park.width - 100) + 50,
          y: Math.random() * (park.height - 100) + 50,
        },
      };
    },
    []
  );

  // メインのシミュレーションループ
  useEffect(() => {
    if (!simulation.isRunning || !currentPark) return;

    const intervalMs = 50 / simulation.speed; // より細かい更新

    const interval = setInterval(() => {
      const currentAgents = useStore.getState().agents;
      const currentAIMode = useStore.getState().aiMode;

      // ペアクールダウンを更新
      pairCooldown.current.forEach((value, key) => {
        if (value > 0) {
          pairCooldown.current.set(key, value - intervalMs);
        }
      });

      currentAgents.forEach((agent) => {
        // 会話中ならスキップ
        if (isConversing.current.has(agent.id)) return;

        // アクションタイマーを更新
        const timer = actionTimers.current.get(agent.id) || 0;
        if (timer > 0) {
          actionTimers.current.set(agent.id, timer - intervalMs);
          return;
        }

        // 現在の目標を取得または設定
        let target = agentTargets.current.get(agent.id);
        if (!target) {
          target = decideNewTarget(agent, currentAgents);
          agentTargets.current.set(agent.id, target);

          // 目標に向かう時のアクションログ
          if (target.type === 'agent') {
            const targetAgent = currentAgents.find((a) => a.id === target!.targetAgentId);
            if (targetAgent) {
              const actionMsg: Message = {
                id: uuidv4(),
                agentId: agent.id,
                agentName: agent.persona.name,
                content: `${targetAgent.persona.name}の方に歩いていく`,
                timestamp: new Date(),
                type: 'action',
              };
              addMessage(actionMsg);
            }
          } else if (target.type === 'feature' && target.featureName) {
            const actionMsg: Message = {
              id: uuidv4(),
              agentId: agent.id,
              agentName: agent.persona.name,
              content: `${target.featureName}の方に向かう`,
              timestamp: new Date(),
              type: 'action',
            };
            addMessage(actionMsg);
          }
        }

        // 目標がエージェントの場合、その人の現在位置を追跡
        if (target.type === 'agent' && target.targetAgentId) {
          const targetAgent = currentAgents.find((a) => a.id === target!.targetAgentId);
          if (targetAgent && !isConversing.current.has(targetAgent.id)) {
            target.position = targetAgent.position;
          } else {
            // 目標のエージェントが会話中なら、新しい目標を探す
            agentTargets.current.delete(agent.id);
            return;
          }
        }

        const distToTarget = distance(agent.position, target.position);

        // 近くのエージェントをチェック
        const nearbyAgents = currentAgents.filter(
          (other) =>
            other.id !== agent.id &&
            !isConversing.current.has(other.id) &&
            distance(agent.position, other.position) < 60 &&
            (pairCooldown.current.get(getPairKey(agent.id, other.id)) || 0) <= 0
        );

        // 近くに誰かいれば高確率で話しかける
        if (nearbyAgents.length > 0) {
          const talkProbability = 0.8; // 80%の確率で話しかける
          if (Math.random() < talkProbability) {
            const partner = nearbyAgents[0]; // 最も近い人
            executeConversation(agent, partner, currentAIMode);
            return;
          }
        }

        // 目標に到達したら
        if (distToTarget < 10) {
          // 少し待機してから新しい目標
          updateAgentStatus(agent.id, 'idle');
          actionTimers.current.set(agent.id, 800 / simulation.speed);
          agentTargets.current.delete(agent.id);

          // たまに思考する
          if (Math.random() < 0.3) {
            updateAgentStatus(agent.id, 'thinking');
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
          }
          return;
        }

        // 目標に向かって移動
        const newPos = moveTowards(agent.position, target.position, 3 * simulation.speed);
        updateAgentPosition(agent.id, newPos);
        updateAgentStatus(agent.id, 'walking');
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
    decideNewTarget,
  ]);

  return { executeConversation };
}

// ランダムな思考を生成（ペルソナベース）
function getRandomThought(agent: Agent): string {
  const thoughts = [
    `${agent.persona.goals[0] || '目標'}のこと考えてた...`,
    '誰かと話したいな',
    'いい雰囲気だな',
    `${agent.persona.background.slice(0, 10)}...を思い出す`,
    'ちょっと休憩しよう',
    '面白い人いないかな',
    'のんびりできていいな',
  ];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}
