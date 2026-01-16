import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Agent,
  Location,
  Message,
  Position,
  SimulationState,
  Conversation,
  GameTime,
  TimeOfDay,
  AgentStatus,
  Memory,
  DailyContext,
  ConversationRecord,
} from '@/types';
import { allLocations, shibuya } from '@/data/locations';

// 時間帯を判定
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

interface AppState {
  // ロケーション
  currentLocation: Location;
  locations: Location[];

  // エージェント
  agents: Agent[];

  // 会話
  conversations: Conversation[];
  chatLog: Message[];

  // シミュレーション
  simulation: SimulationState;

  // 選択中のエージェント
  selectedAgentId: string | null;

  // AIモード
  aiMode: boolean;

  // アクション
  setCurrentLocation: (location: Location) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgentPosition: (agentId: string, position: Position) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus, action?: string) => void;
  updateAgentLocation: (agentId: string, locationId: string) => void;
  updateAgentEnergy: (agentId: string, delta: number) => void;
  updateAgentMood: (agentId: string, delta: number) => void;
  addMessage: (message: Message) => void;
  clearChatLog: () => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  advanceTime: (minutes: number) => void;
  toggleAIMode: () => void;
  selectAgent: (agentId: string | null) => void;
  startConversation: (agentIds: string[], location: Position, locationId: string) => string;
  endConversation: (conversationId: string) => void;
  getAgentsInLocation: (locationId: string) => Agent[];
  // 記憶システム
  addMemory: (agentId: string, memory: Memory) => void;
  recordConversation: (record: ConversationRecord) => void;
  getAgentContext: (agentId: string) => { memories: Memory[]; todayConversations: ConversationRecord[] };
  processNewDay: (agentId: string, newMemories: Memory[], summary: string) => void;
}

// 初期の空DailyContext
const createEmptyDailyContext = (day: number): DailyContext => ({
  day,
  conversations: [],
});

// サンプルエージェント（東京で生活）
const sampleAgents: Agent[] = [
  {
    id: uuidv4(),
    persona: {
      name: 'サクラ',
      age: 25,
      personality: '明るく社交的で、誰とでもすぐに仲良くなれる。好奇心旺盛で新しいことが大好き。',
      background: '地方から上京してきて3年。渋谷のカフェで働いている。',
      goals: ['新しい友達を作る', '美味しいコーヒーの淹れ方を極める', '小説を書く'],
      speakingStyle: '元気で明るい話し方。「〜だよね！」「すごい！」をよく使う。',
      occupation: 'カフェ店員',
    },
    life: {
      homeLocationId: 'residential-meguro',
      homeBuildingId: 'apartment-sakura',
      workLocationId: 'shibuya',
      workBuildingId: 'starbucks-shibuya',
      workStartHour: 10,
      workEndHour: 19,
      favoriteSpots: ['yoyogi-park', 'tsutaya-shibuya'],
    },
    currentLocationId: 'shibuya',
    position: { x: 300, y: 200 },
    color: '#FF69B4',
    status: 'idle',
    energy: 80,
    mood: 75,
    createdBy: 'system',
    createdAt: new Date(),
    memories: [],
    dailyContext: createEmptyDailyContext(1),
  },
  {
    id: uuidv4(),
    persona: {
      name: 'ケンジ',
      age: 32,
      personality: '落ち着いていて思慮深い。少し内向的だが、一度心を開くと温かい。',
      background: '新宿のIT企業でエンジニアとして働いて5年目。仕事は充実しているが、出会いが少ないのが悩み。',
      goals: ['プログラミングスキルを向上させる', '健康的な生活を送る', 'いつか起業する'],
      speakingStyle: '丁寧で論理的な話し方。「なるほど」「確かに」をよく使う。',
      occupation: 'エンジニア',
    },
    life: {
      homeLocationId: 'residential-meguro',
      homeBuildingId: 'apartment-green',
      workLocationId: 'shinjuku-office',
      workBuildingId: 'tokyo-building',
      workStartHour: 9,
      workEndHour: 18,
      favoriteSpots: ['yoyogi-park', 'doutor-shinjuku'],
    },
    currentLocationId: 'shibuya',
    position: { x: 500, y: 350 },
    color: '#4169E1',
    status: 'idle',
    energy: 70,
    mood: 65,
    createdBy: 'system',
    createdAt: new Date(),
    memories: [],
    dailyContext: createEmptyDailyContext(1),
  },
  {
    id: uuidv4(),
    persona: {
      name: 'ミドリ',
      age: 68,
      personality: '穏やかで知恵がある。若者を見守るおばあちゃん的存在。散歩と人間観察が大好き。',
      background: '元小学校の先生。10年前に退職してからは、毎日近所を散歩するのが日課。',
      goals: ['健康に過ごす', '若い人と交流する', '孫に会う'],
      speakingStyle: 'ゆっくりとした優しい話し方。「〜じゃのう」「昔はね」をよく使う。',
      occupation: '無職（元教師）',
    },
    life: {
      homeLocationId: 'residential-meguro',
      homeBuildingId: 'apartment-hills',
      favoriteSpots: ['yoyogi-park', 'supermarket-life'],
    },
    currentLocationId: 'shibuya',
    position: { x: 400, y: 450 },
    color: '#228B22',
    status: 'idle',
    energy: 60,
    mood: 80,
    createdBy: 'system',
    createdAt: new Date(),
    memories: [],
    dailyContext: createEmptyDailyContext(1),
  },
  {
    id: uuidv4(),
    persona: {
      name: 'ユウト',
      age: 22,
      personality: '情熱的で夢追い人。音楽が大好きで、いつもヘッドホンをしている。',
      background: '大学を中退してミュージシャンを目指している。バイトをしながら音楽活動中。',
      goals: ['メジャーデビュー', 'ライブハウスでワンマンライブ', '曲を100曲作る'],
      speakingStyle: 'フランクでテンション高め。「マジで」「やばい」をよく使う。',
      occupation: 'フリーター（ミュージシャン志望）',
    },
    life: {
      homeLocationId: 'residential-meguro',
      homeBuildingId: 'apartment-sakura',
      workLocationId: 'shibuya',
      workBuildingId: 'family-mart-shibuya',
      workStartHour: 18,
      workEndHour: 23,
      favoriteSpots: ['shibuya-109', 'yoyogi-park'],
    },
    currentLocationId: 'shibuya',
    position: { x: 600, y: 250 },
    color: '#9932CC',
    status: 'idle',
    energy: 90,
    mood: 85,
    createdBy: 'system',
    createdAt: new Date(),
    memories: [],
    dailyContext: createEmptyDailyContext(1),
  },
  {
    id: uuidv4(),
    persona: {
      name: 'アヤ',
      age: 28,
      personality: 'クールで知的。仕事ができる女性。でも実は猫が大好きで、猫カフェによく行く。',
      background: '外資系コンサルティング会社で働くキャリアウーマン。仕事一筋だったが、最近は私生活も充実させたいと思っている。',
      goals: ['マネージャーに昇進', '趣味を見つける', '猫を飼う'],
      speakingStyle: '簡潔で的確な話し方。でもプライベートでは意外とお茶目。',
      occupation: 'コンサルタント',
    },
    life: {
      homeLocationId: 'residential-meguro',
      homeBuildingId: 'apartment-hills',
      workLocationId: 'shinjuku-office',
      workBuildingId: 'shinjuku-center',
      workStartHour: 8,
      workEndHour: 20,
      favoriteSpots: ['starbucks-shibuya', 'yoyogi-park'],
    },
    currentLocationId: 'shibuya',
    position: { x: 200, y: 400 },
    color: '#DC143C',
    status: 'idle',
    energy: 65,
    mood: 70,
    createdBy: 'system',
    createdAt: new Date(),
    memories: [],
    dailyContext: createEmptyDailyContext(1),
  },
];

// 初期時間（朝8時）
const initialGameTime: GameTime = {
  hour: 8,
  minute: 0,
  day: 1,
  timeOfDay: 'morning',
};

export const useStore = create<AppState>((set, get) => ({
  currentLocation: shibuya,
  locations: allLocations,
  agents: sampleAgents,
  conversations: [],
  chatLog: [],
  simulation: {
    isRunning: false,
    speed: 1,
    gameTime: initialGameTime,
  },
  selectedAgentId: null,
  aiMode: true,

  setCurrentLocation: (location) => set({ currentLocation: location }),

  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),

  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
      selectedAgentId: state.selectedAgentId === agentId ? null : state.selectedAgentId,
    })),

  updateAgentPosition: (agentId, position) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, position } : a
      ),
    })),

  updateAgentStatus: (agentId, status, action) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, status, currentAction: action } : a
      ),
    })),

  updateAgentLocation: (agentId, locationId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, currentLocationId: locationId } : a
      ),
    })),

  updateAgentEnergy: (agentId, delta) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, energy: Math.max(0, Math.min(100, a.energy + delta)) }
          : a
      ),
    })),

  updateAgentMood: (agentId, delta) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, mood: Math.max(0, Math.min(100, a.mood + delta)) }
          : a
      ),
    })),

  addMessage: (message) =>
    set((state) => ({
      chatLog: [...state.chatLog, message].slice(-100),
    })),

  clearChatLog: () => set({ chatLog: [] }),

  toggleSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, isRunning: !state.simulation.isRunning },
    })),

  setSimulationSpeed: (speed) =>
    set((state) => ({
      simulation: { ...state.simulation, speed },
    })),

  advanceTime: (minutes) =>
    set((state) => {
      const { gameTime } = state.simulation;
      let newMinute = gameTime.minute + minutes;
      let newHour = gameTime.hour;
      let newDay = gameTime.day;

      while (newMinute >= 60) {
        newMinute -= 60;
        newHour += 1;
      }

      while (newHour >= 24) {
        newHour -= 24;
        newDay += 1;
      }

      return {
        simulation: {
          ...state.simulation,
          gameTime: {
            hour: newHour,
            minute: newMinute,
            day: newDay,
            timeOfDay: getTimeOfDay(newHour),
          },
        },
      };
    }),

  toggleAIMode: () => set((state) => ({ aiMode: !state.aiMode })),

  selectAgent: (agentId) => set({ selectedAgentId: agentId }),

  startConversation: (agentIds, location, locationId) => {
    const conversationId = uuidv4();
    set((state) => ({
      conversations: [
        ...state.conversations,
        {
          id: conversationId,
          participants: agentIds,
          messages: [],
          location,
          locationId,
          startedAt: new Date(),
        },
      ],
    }));
    return conversationId;
  },

  endConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    })),

  getAgentsInLocation: (locationId) => {
    const { agents } = get();
    return agents.filter((a) => a.currentLocationId === locationId);
  },

  // 記憶を追加
  addMemory: (agentId, memory) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, memories: [...a.memories, memory] }
          : a
      ),
    })),

  // 会話を今日のコンテキストに記録
  recordConversation: (record) =>
    set((state) => ({
      agents: state.agents.map((a) => {
        if (record.participants.includes(a.id)) {
          return {
            ...a,
            dailyContext: {
              ...a.dailyContext,
              conversations: [...a.dailyContext.conversations, record],
            },
          };
        }
        return a;
      }),
    })),

  // エージェントのコンテキストを取得（AI会話用）
  getAgentContext: (agentId) => {
    const { agents } = get();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      return { memories: [], todayConversations: [] };
    }
    return {
      memories: agent.memories,
      todayConversations: agent.dailyContext.conversations,
    };
  },

  // 新しい日を処理（記憶の抽出とコンテキストのリセット）
  processNewDay: (agentId, newMemories, summary) =>
    set((state) => ({
      agents: state.agents.map((a) => {
        if (a.id === agentId) {
          const newDay = state.simulation.gameTime.day;
          return {
            ...a,
            memories: [...a.memories, ...newMemories],
            dailyContext: {
              day: newDay,
              conversations: [],
              summary: summary,
            },
          };
        }
        return a;
      }),
    })),
}));

// 後方互換性のためのエイリアス
export const useStoreCompat = () => {
  const store = useStore();
  return {
    ...store,
    currentPark: store.currentLocation,
    parks: store.locations,
    setCurrentPark: store.setCurrentLocation,
  };
};
