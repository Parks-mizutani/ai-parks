import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Agent, Park, Message, Position, SimulationState, Conversation } from '@/types';

interface AppState {
  // 現在のパーク
  currentPark: Park | null;
  parks: Park[];

  // エージェント
  agents: Agent[];

  // 会話
  conversations: Conversation[];
  chatLog: Message[];

  // シミュレーション
  simulation: SimulationState;

  // 選択中のエージェント
  selectedAgentId: string | null;

  // アクション
  setCurrentPark: (park: Park) => void;
  addPark: (park: Park) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgentPosition: (agentId: string, position: Position) => void;
  updateAgentStatus: (agentId: string, status: Agent['status'], action?: string) => void;
  addMessage: (message: Message) => void;
  clearChatLog: () => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  selectAgent: (agentId: string | null) => void;
  startConversation: (agentIds: string[], location: Position) => string;
  endConversation: (conversationId: string) => void;
}

// デフォルトのパーク
const defaultPark: Park = {
  id: 'central-park',
  name: '中央公園',
  description: '緑豊かな憩いの場。ベンチや噴水があり、エージェントたちが集まる人気スポット。',
  width: 800,
  height: 600,
  backgroundColor: '#90EE90',
  features: [
    { id: 'bench-1', type: 'bench', position: { x: 150, y: 200 }, name: '木陰のベンチ' },
    { id: 'bench-2', type: 'bench', position: { x: 600, y: 400 }, name: '噴水前のベンチ' },
    { id: 'fountain-1', type: 'fountain', position: { x: 400, y: 300 }, name: '中央噴水' },
    { id: 'tree-1', type: 'tree', position: { x: 100, y: 150 } },
    { id: 'tree-2', type: 'tree', position: { x: 700, y: 100 } },
    { id: 'tree-3', type: 'tree', position: { x: 200, y: 500 } },
    { id: 'cafe-1', type: 'cafe', position: { x: 650, y: 150 }, name: 'Park Cafe' },
    { id: 'lamp-1', type: 'lamp', position: { x: 300, y: 250 } },
    { id: 'lamp-2', type: 'lamp', position: { x: 500, y: 350 } },
    { id: 'flower-1', type: 'flower', position: { x: 350, y: 450 } },
    { id: 'flower-2', type: 'flower', position: { x: 450, y: 200 } },
  ],
};

// サンプルエージェント
const sampleAgents: Agent[] = [
  {
    id: uuidv4(),
    persona: {
      name: 'サクラ',
      age: 25,
      personality: '明るく社交的で、誰とでもすぐに仲良くなれる。好奇心旺盛で新しいことが大好き。',
      background: '地方から上京してきたカフェ店員。休日は公園で読書をするのが趣味。',
      goals: ['新しい友達を作る', '美味しいコーヒーの淹れ方を極める', '小説を書く'],
      speakingStyle: '元気で明るい話し方。「〜だよね！」「すごい！」をよく使う。',
    },
    position: { x: 200, y: 250 },
    color: '#FF69B4',
    status: 'idle',
    createdBy: 'system',
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    persona: {
      name: 'ケンジ',
      age: 32,
      personality: '落ち着いていて思慮深い。少し内向的だが、一度心を開くと温かい。',
      background: 'IT企業で働くエンジニア。仕事のストレス解消に公園を散歩するのが日課。',
      goals: ['プログラミングスキルを向上させる', '健康的な生活を送る', 'いつか起業する'],
      speakingStyle: '丁寧で論理的な話し方。「なるほど」「確かに」をよく使う。',
    },
    position: { x: 550, y: 350 },
    color: '#4169E1',
    status: 'idle',
    createdBy: 'system',
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    persona: {
      name: 'ミドリ',
      age: 68,
      personality: '穏やかで知恵がある。若者を見守るおばあちゃん的存在。',
      background: '元学校の先生。今は引退して、毎日公園で鳩に餌をやるのが楽しみ。',
      goals: ['健康に過ごす', '若い人と交流する', '孫に会う'],
      speakingStyle: 'ゆっくりとした優しい話し方。「〜じゃのう」「昔はね」をよく使う。',
    },
    position: { x: 400, y: 450 },
    color: '#228B22',
    status: 'idle',
    createdBy: 'system',
    createdAt: new Date(),
  },
];

export const useStore = create<AppState>((set, get) => ({
  currentPark: defaultPark,
  parks: [defaultPark],
  agents: sampleAgents,
  conversations: [],
  chatLog: [],
  simulation: {
    isRunning: false,
    speed: 1,
    currentTime: new Date(),
  },
  selectedAgentId: null,

  setCurrentPark: (park) => set({ currentPark: park }),

  addPark: (park) => set((state) => ({ parks: [...state.parks, park] })),

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

  addMessage: (message) =>
    set((state) => ({
      chatLog: [...state.chatLog, message].slice(-100), // 最新100件を保持
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

  selectAgent: (agentId) => set({ selectedAgentId: agentId }),

  startConversation: (agentIds, location) => {
    const conversationId = uuidv4();
    set((state) => ({
      conversations: [
        ...state.conversations,
        {
          id: conversationId,
          participants: agentIds,
          messages: [],
          location,
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
}));
