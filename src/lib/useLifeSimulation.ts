'use client';

import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/stores/useStore';
import type { Agent, Position, Message, Location, AgentStatus, ConversationRecord, Memory } from '@/types';
import { getLocationById } from '@/data/locations';

// 2点間の距離を計算
function distance(p1: Position, p2: Position): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// 目標に向かって移動
function moveTowards(current: Position, target: Position, speed: number): Position {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < speed) return target;
  return {
    x: current.x + (dx / dist) * speed,
    y: current.y + (dy / dist) * speed,
  };
}

// ランダムな位置を生成
function randomPosition(location: Location): Position {
  return {
    x: Math.random() * (location.width - 100) + 50,
    y: Math.random() * (location.height - 100) + 50,
  };
}

// エージェントの目標
interface AgentGoal {
  type: 'move_to_agent' | 'move_to_building' | 'move_to_position' | 'change_location' | 'none';
  targetPosition?: Position;
  targetAgentId?: string;
  targetBuildingId?: string;
  targetLocationId?: string;
  description?: string;
}

export function useLifeSimulation() {
  const {
    simulation,
    agents,
    currentLocation,
    locations,
    chatLog,
    aiMode,
    updateAgentPosition,
    updateAgentStatus,
    updateAgentLocation,
    updateAgentEnergy,
    updateAgentMood,
    addMessage,
    advanceTime,
    recordConversation,
    processNewDay,
    getAgentContext,
  } = useStore();

  // エージェントの目標
  const agentGoals = useRef<Map<string, AgentGoal>>(new Map());
  // アクションタイマー
  const actionTimers = useRef<Map<string, number>>(new Map());
  // 会話クールダウン
  const pairCooldown = useRef<Map<string, number>>(new Map());
  // 会話中フラグ
  const isConversing = useRef<Set<string>>(new Set());
  // 時間進行カウンター
  const timeCounter = useRef(0);
  // 前回の日付（日付変更検出用）
  const lastDay = useRef(1);
  // 記憶抽出処理中フラグ
  const processingMemories = useRef<Set<string>>(new Set());

  const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join('-');

  // 日が変わった時の記憶抽出処理
  const extractMemories = useCallback(async (agent: Agent, day: number) => {
    if (processingMemories.current.has(agent.id)) return;
    processingMemories.current.add(agent.id);

    try {
      const context = getAgentContext(agent.id);
      if (context.todayConversations.length === 0) {
        processingMemories.current.delete(agent.id);
        return;
      }

      const response = await fetch('/api/agents/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.persona.name,
          persona: agent.persona,
          conversations: context.todayConversations,
          currentDay: day,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const memories: Memory[] = data.memories || [];
        processNewDay(agent.id, memories, data.summary || '');
        console.log(`${agent.persona.name}の記憶を抽出:`, memories.length, '件');
      }
    } catch (error) {
      console.error('Memory extraction error:', error);
    } finally {
      processingMemories.current.delete(agent.id);
    }
  }, [getAgentContext, processNewDay]);

  // 時間に基づいてエージェントが何をすべきか決定
  const decideActivity = useCallback((agent: Agent, hour: number): { status: AgentStatus; locationId: string; description: string } => {
    const { life } = agent;

    // 深夜〜早朝（0-6時）: 睡眠
    if (hour >= 0 && hour < 6) {
      return { status: 'sleeping', locationId: life.homeLocationId, description: '自宅で睡眠中' };
    }

    // 仕事がある場合
    if (life.workLocationId && life.workStartHour !== undefined && life.workEndHour !== undefined) {
      // 通勤時間（仕事開始1時間前）
      if (hour === life.workStartHour - 1) {
        return { status: 'commuting', locationId: life.workLocationId, description: '通勤中' };
      }

      // 仕事時間
      if (hour >= life.workStartHour && hour < life.workEndHour) {
        return { status: 'working', locationId: life.workLocationId, description: '仕事中' };
      }

      // 帰宅時間（仕事終了後）
      if (hour === life.workEndHour) {
        return { status: 'commuting', locationId: life.homeLocationId, description: '帰宅中' };
      }
    }

    // 昼食時間（12-13時）
    if (hour === 12 || hour === 13) {
      if (Math.random() < 0.6) {
        return { status: 'eating', locationId: agent.currentLocationId, description: 'ランチ中' };
      }
    }

    // 夕食時間（19-20時）
    if (hour === 19 || hour === 20) {
      if (Math.random() < 0.5) {
        return { status: 'eating', locationId: agent.currentLocationId, description: '夕食中' };
      }
    }

    // 買い物（夕方、ランダム）
    if (hour >= 17 && hour <= 21 && Math.random() < 0.2) {
      return { status: 'shopping', locationId: 'residential-meguro', description: '買い物中' };
    }

    // 夜（22時以降）: 帰宅
    if (hour >= 22) {
      return { status: 'idle', locationId: life.homeLocationId, description: '帰宅してリラックス中' };
    }

    // それ以外: 自由時間
    if (life.favoriteSpots.length > 0 && Math.random() < 0.3) {
      const spot = life.favoriteSpots[Math.floor(Math.random() * life.favoriteSpots.length)];
      return { status: 'idle', locationId: spot, description: 'お出かけ中' };
    }

    return { status: 'idle', locationId: agent.currentLocationId, description: '自由時間' };
  }, []);

  // AI会話生成（コンテキスト付き）
  const generateAIConversation = useCallback(
    async (agent1: Agent, agent2: Agent) => {
      try {
        const loc = getLocationById(agent1.currentLocationId);

        // エージェントの記憶とコンテキストを取得
        const context1 = getAgentContext(agent1.id);
        const context2 = getAgentContext(agent2.id);

        // 記憶をコンテキストテキストに変換
        const memories1 = context1.memories.slice(-5).map(m => m.content).join('. ');
        const memories2 = context2.memories.slice(-5).map(m => m.content).join('. ');

        // 今日の会話サマリー
        const todayConvs1 = context1.todayConversations.length;
        const todayConvs2 = context2.todayConversations.length;

        const response = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agents: [agent1, agent2],
            park: loc,
            recentMessages: chatLog.slice(-10),
            situation: `${agent1.persona.name}（${agent1.persona.occupation}）と${agent2.persona.name}（${agent2.persona.occupation}）が${loc?.name || '街'}で出会いました。`,
            context: {
              agent1Memories: memories1,
              agent2Memories: memories2,
              agent1TodayConvCount: todayConvs1,
              agent2TodayConvCount: todayConvs2,
            },
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
    [chatLog, getAgentContext]
  );

  // シンプル会話生成
  const generateSimpleConversation = useCallback(
    (agent1: Agent, agent2: Agent) => {
      const conversations = [
        [
          { agent: agent1, content: `あ、${agent2.persona.name}さん！` },
          { agent: agent2, content: `${agent1.persona.name}さん、お疲れ様です！` },
          { agent: agent1, content: `今日も${agent1.status === 'working' ? '仕事' : 'いい天気'}ですね` },
          { agent: agent2, content: `そうですね！${agent2.persona.goals[0] || '最近忙しくて'}...` },
        ],
        [
          { agent: agent2, content: `${agent1.persona.name}さんじゃないですか！` },
          { agent: agent1, content: `おお！久しぶり！` },
          { agent: agent2, content: `元気してました？` },
          { agent: agent1, content: `うん、${agent1.persona.occupation}の仕事頑張ってるよ` },
        ],
      ];
      const selected = conversations[Math.floor(Math.random() * conversations.length)];
      return selected.map((item) => ({ agentId: item.agent.id, content: item.content }));
    },
    []
  );

  // 会話実行（コンテキストに記録）
  const executeConversation = useCallback(
    async (agent: Agent, partner: Agent, useAI: boolean) => {
      if (isConversing.current.has(agent.id) || isConversing.current.has(partner.id)) return;

      isConversing.current.add(agent.id);
      isConversing.current.add(partner.id);

      const loc = getLocationById(agent.currentLocationId);
      const conversationId = uuidv4();
      const conversationStartTime = new Date();

      // 会話記録用
      const conversationMessages: { speakerId: string; speakerName: string; content: string; timestamp: Date }[] = [];

      const meetMsg: Message = {
        id: uuidv4(),
        agentId: agent.id,
        agentName: agent.persona.name,
        content: `${partner.persona.name}に話しかけた`,
        timestamp: new Date(),
        locationId: agent.currentLocationId,
        type: 'action',
      };
      addMessage(meetMsg);

      updateAgentStatus(agent.id, 'talking');
      updateAgentStatus(partner.id, 'talking');

      let conversation: { agentId: string; content: string }[] = [];

      if (useAI) {
        const aiResp = await generateAIConversation(agent, partner);
        if (aiResp && aiResp.length > 0) {
          conversation = aiResp
            .map((r: { agentId: string; speech?: string }) => ({ agentId: r.agentId, content: r.speech || '' }))
            .filter((c: { content: string }) => c.content);
        }
      }

      if (conversation.length === 0) {
        conversation = generateSimpleConversation(agent, partner);
      }

      const speed = useStore.getState().simulation.speed;
      const interval = 1500 / speed;

      conversation.forEach((msg, i) => {
        setTimeout(() => {
          const speaker = [agent, partner].find((a) => a.id === msg.agentId) || agent;
          const speechMsg: Message = {
            id: uuidv4(),
            agentId: msg.agentId,
            agentName: speaker.persona.name,
            content: msg.content,
            timestamp: new Date(),
            locationId: agent.currentLocationId,
            type: 'speech',
          };
          addMessage(speechMsg);
          updateAgentStatus(msg.agentId, 'talking', msg.content);

          // 会話記録に追加
          conversationMessages.push({
            speakerId: msg.agentId,
            speakerName: speaker.persona.name,
            content: msg.content,
            timestamp: new Date(),
          });
        }, i * interval);
      });

      const duration = conversation.length * interval + 500;

      setTimeout(() => {
        updateAgentStatus(agent.id, 'idle');
        updateAgentStatus(partner.id, 'idle');
        isConversing.current.delete(agent.id);
        isConversing.current.delete(partner.id);

        // 会話で気分UP
        updateAgentMood(agent.id, 5);
        updateAgentMood(partner.id, 5);

        // 会話をデイリーコンテキストに記録
        const record: ConversationRecord = {
          id: conversationId,
          participants: [agent.id, partner.id],
          participantNames: [agent.persona.name, partner.persona.name],
          messages: conversationMessages,
          locationId: agent.currentLocationId,
          locationName: loc?.name || '不明な場所',
          startedAt: conversationStartTime,
          endedAt: new Date(),
        };
        recordConversation(record);
      }, duration);

      const pairKey = getPairKey(agent.id, partner.id);
      pairCooldown.current.set(pairKey, 20000 / speed);
      actionTimers.current.set(agent.id, duration + 1000);
      actionTimers.current.set(partner.id, duration + 1000);
    },
    [generateAIConversation, generateSimpleConversation, addMessage, updateAgentStatus, updateAgentMood, recordConversation]
  );

  // メインループ
  useEffect(() => {
    if (!simulation.isRunning) return;

    const intervalMs = 50 / simulation.speed;

    const loop = setInterval(() => {
      const state = useStore.getState();
      const { gameTime } = state.simulation;
      const currentAgents = state.agents;
      const currentAIMode = state.aiMode;

      // 日付変更チェック
      if (gameTime.day > lastDay.current) {
        console.log(`日が変わりました: Day ${lastDay.current} → Day ${gameTime.day}`);
        // 全エージェントの記憶抽出
        currentAgents.forEach((agent) => {
          extractMemories(agent, gameTime.day);
        });
        lastDay.current = gameTime.day;
      }

      // 時間進行（1秒 = 1分）
      timeCounter.current += intervalMs;
      if (timeCounter.current >= 1000 / simulation.speed) {
        timeCounter.current = 0;
        advanceTime(1);
      }

      // ペアクールダウン更新
      pairCooldown.current.forEach((v, k) => {
        if (v > 0) pairCooldown.current.set(k, v - intervalMs);
      });

      currentAgents.forEach((agent) => {
        if (isConversing.current.has(agent.id)) return;

        // タイマー更新
        const timer = actionTimers.current.get(agent.id) || 0;
        if (timer > 0) {
          actionTimers.current.set(agent.id, timer - intervalMs);
          return;
        }

        // 時間に基づく活動決定
        const activity = decideActivity(agent, gameTime.hour);

        // ロケーション移動が必要な場合
        if (agent.currentLocationId !== activity.locationId) {
          const targetLoc = getLocationById(activity.locationId);
          if (targetLoc) {
            const actionMsg: Message = {
              id: uuidv4(),
              agentId: agent.id,
              agentName: agent.persona.name,
              content: `${targetLoc.name}へ移動`,
              timestamp: new Date(),
              locationId: agent.currentLocationId,
              type: 'action',
            };
            addMessage(actionMsg);

            updateAgentLocation(agent.id, activity.locationId);
            updateAgentPosition(agent.id, randomPosition(targetLoc));
            updateAgentStatus(agent.id, activity.status, activity.description);
            updateAgentEnergy(agent.id, -5);
            actionTimers.current.set(agent.id, 3000 / simulation.speed);
          }
          return;
        }

        // 睡眠中
        if (activity.status === 'sleeping') {
          updateAgentStatus(agent.id, 'sleeping', '睡眠中');
          updateAgentEnergy(agent.id, 2);
          actionTimers.current.set(agent.id, 5000 / simulation.speed);
          return;
        }

        // 仕事中
        if (activity.status === 'working') {
          updateAgentStatus(agent.id, 'working', '仕事中');
          updateAgentEnergy(agent.id, -1);
          actionTimers.current.set(agent.id, 5000 / simulation.speed);
          return;
        }

        // 現在のロケーションにいる他のエージェント
        const nearbyAgents = currentAgents.filter(
          (other) =>
            other.id !== agent.id &&
            other.currentLocationId === agent.currentLocationId &&
            !isConversing.current.has(other.id) &&
            distance(agent.position, other.position) < 80 &&
            (pairCooldown.current.get(getPairKey(agent.id, other.id)) || 0) <= 0
        );

        // 近くに誰かいれば会話
        if (nearbyAgents.length > 0 && Math.random() < 0.7) {
          const partner = nearbyAgents[0];
          executeConversation(agent, partner, currentAIMode);
          return;
        }

        // 移動または待機
        const goal = agentGoals.current.get(agent.id);
        const loc = getLocationById(agent.currentLocationId);

        if (!goal || goal.type === 'none') {
          const otherAgents = currentAgents.filter(
            (o) => o.id !== agent.id && o.currentLocationId === agent.currentLocationId && !isConversing.current.has(o.id)
          );
          if (otherAgents.length > 0 && Math.random() < 0.5) {
            const target = otherAgents[Math.floor(Math.random() * otherAgents.length)];
            agentGoals.current.set(agent.id, {
              type: 'move_to_agent',
              targetAgentId: target.id,
              targetPosition: target.position,
            });
          } else if (loc) {
            agentGoals.current.set(agent.id, {
              type: 'move_to_position',
              targetPosition: randomPosition(loc),
            });
          }
          return;
        }

        // 目標に向かって移動
        if (goal.targetPosition) {
          if (goal.type === 'move_to_agent' && goal.targetAgentId) {
            const targetAgent = currentAgents.find((a) => a.id === goal.targetAgentId);
            if (targetAgent && targetAgent.currentLocationId === agent.currentLocationId) {
              goal.targetPosition = targetAgent.position;
            } else {
              agentGoals.current.delete(agent.id);
              return;
            }
          }

          const dist = distance(agent.position, goal.targetPosition);
          if (dist < 10) {
            agentGoals.current.delete(agent.id);
            updateAgentStatus(agent.id, 'idle');
            actionTimers.current.set(agent.id, 1000 / simulation.speed);
          } else {
            const newPos = moveTowards(agent.position, goal.targetPosition, 3 * simulation.speed);
            updateAgentPosition(agent.id, newPos);
            updateAgentStatus(agent.id, 'walking');
          }
        }
      });
    }, intervalMs);

    return () => clearInterval(loop);
  }, [
    simulation.isRunning,
    simulation.speed,
    advanceTime,
    decideActivity,
    executeConversation,
    extractMemories,
    updateAgentPosition,
    updateAgentStatus,
    updateAgentLocation,
    updateAgentEnergy,
    addMessage,
  ]);

  return { executeConversation };
}
