// =====================================
// ロケーション（空間）関連
// =====================================

// ロケーションの種類
export type LocationType =
  | 'residential'    // 住宅街
  | 'commercial'     // 商業地区（渋谷、新宿など）
  | 'office'         // オフィス街
  | 'park'           // 公園
  | 'station';       // 駅

// 建物の種類
export type BuildingType =
  | 'apartment'      // アパート・マンション
  | 'office_building' // オフィスビル
  | 'convenience_store' // コンビニ
  | 'restaurant'     // レストラン
  | 'cafe'           // カフェ
  | 'supermarket'    // スーパー
  | 'station'        // 駅
  | 'park'           // 公園
  | 'shop';          // その他の店舗

// 建物
export interface Building {
  id: string;
  type: BuildingType;
  name: string;
  position: Position;
  size: { width: number; height: number };
  color: string;
  floors?: number;  // アパートやオフィスの階数
  openHours?: { open: number; close: number }; // 営業時間
}

// ロケーション（空間）
export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  buildings: Building[];
  features: LocationFeature[];
  connectedTo: string[]; // 接続している他のロケーションID
}

// 空間内のオブジェクト（装飾）
export interface LocationFeature {
  id: string;
  type: 'tree' | 'bench' | 'fountain' | 'lamp' | 'flower' | 'sign' | 'vending_machine' | 'trash_can';
  position: Position;
  name?: string;
}

// 2D位置
export interface Position {
  x: number;
  y: number;
}

// =====================================
// 時間関連
// =====================================

// 時間帯
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// ゲーム内時間
export interface GameTime {
  hour: number;      // 0-23
  minute: number;    // 0-59
  day: number;       // 日数
  timeOfDay: TimeOfDay;
}

// =====================================
// エージェント関連
// =====================================

// エージェントのペルソナ設定
export interface Persona {
  name: string;
  age: number;
  personality: string;
  background: string;
  goals: string[];
  speakingStyle: string;
  occupation: string;  // 職業
}

// エージェントの生活設定
export interface LifeSettings {
  homeLocationId: string;      // 自宅のロケーションID
  homeBuildingId: string;      // 自宅の建物ID
  workLocationId?: string;     // 職場のロケーションID
  workBuildingId?: string;     // 職場の建物ID
  workStartHour?: number;      // 仕事開始時間
  workEndHour?: number;        // 仕事終了時間
  favoriteSpots: string[];     // よく行く場所のID
}

// エージェントの状態
export type AgentStatus =
  | 'idle'       // 待機中
  | 'walking'    // 歩行中
  | 'talking'    // 会話中
  | 'thinking'   // 考え中
  | 'working'    // 仕事中
  | 'eating'     // 食事中
  | 'shopping'   // 買い物中
  | 'sleeping'   // 睡眠中
  | 'commuting'; // 通勤中

// エージェント
export interface Agent {
  id: string;
  persona: Persona;
  life: LifeSettings;
  currentLocationId: string;   // 現在いるロケーション
  position: Position;
  color: string;
  status: AgentStatus;
  currentAction?: string;
  energy: number;              // 体力 0-100
  mood: number;                // 気分 0-100
  createdBy: 'system' | 'user';
  createdAt: Date;
}

// =====================================
// 会話・メッセージ関連
// =====================================

// 会話メッセージ
export interface Message {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  locationId: string;
  type: 'speech' | 'thought' | 'action';
}

// 会話セッション
export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  location: Position;
  locationId: string;
  startedAt: Date;
}

// =====================================
// シミュレーション関連
// =====================================

// シミュレーション状態
export interface SimulationState {
  isRunning: boolean;
  speed: number;
  gameTime: GameTime;
}

// =====================================
// 後方互換性のためのエイリアス
// =====================================
export type Park = Location;
export type ParkFeature = LocationFeature;
