// エージェントのペルソナ設定
export interface Persona {
  name: string;
  age: number;
  personality: string; // 性格の説明
  background: string; // 背景・経歴
  goals: string[]; // 目標や興味
  speakingStyle: string; // 話し方の特徴
}

// エージェント
export interface Agent {
  id: string;
  persona: Persona;
  position: Position;
  color: string; // 表示色
  status: 'idle' | 'walking' | 'talking' | 'thinking';
  currentAction?: string;
  createdBy: 'system' | 'user';
  createdAt: Date;
}

// 2D位置
export interface Position {
  x: number;
  y: number;
}

// 空間（パーク）
export interface Park {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  features: ParkFeature[]; // ベンチ、木、噴水など
  backgroundColor: string;
}

// 空間内のオブジェクト
export interface ParkFeature {
  id: string;
  type: 'bench' | 'tree' | 'fountain' | 'cafe' | 'lamp' | 'flower';
  position: Position;
  name?: string;
}

// 会話メッセージ
export interface Message {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  type: 'speech' | 'thought' | 'action';
}

// 会話セッション
export interface Conversation {
  id: string;
  participants: string[]; // agent IDs
  messages: Message[];
  location: Position;
  startedAt: Date;
}

// シミュレーション状態
export interface SimulationState {
  isRunning: boolean;
  speed: number; // 1 = normal, 2 = fast, 0.5 = slow
  currentTime: Date;
}

// ストアの状態
export interface AppState {
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

  // アクション
  setCurrentPark: (park: Park) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgentPosition: (agentId: string, position: Position) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  addMessage: (message: Message) => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
}
