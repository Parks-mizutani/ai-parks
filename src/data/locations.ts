import type { Location } from '@/types';

// =====================================
// 東京の街 - ロケーションデータ
// =====================================

// 渋谷駅前
export const shibuya: Location = {
  id: 'shibuya',
  name: '渋谷駅前',
  type: 'commercial',
  description: '若者の街、渋谷。スクランブル交差点を中心に賑わう商業地区。',
  width: 900,
  height: 700,
  backgroundColor: '#D3D3D3',
  connectedTo: ['shibuya-station', 'residential-meguro'],
  buildings: [
    {
      id: 'shibuya-109',
      type: 'shop',
      name: 'SHIBUYA109',
      position: { x: 150, y: 200 },
      size: { width: 100, height: 120 },
      color: '#FF69B4',
      openHours: { open: 10, close: 21 },
    },
    {
      id: 'starbucks-shibuya',
      type: 'cafe',
      name: 'スターバックス 渋谷店',
      position: { x: 350, y: 150 },
      size: { width: 60, height: 50 },
      color: '#00704A',
      openHours: { open: 7, close: 22 },
    },
    {
      id: 'family-mart-shibuya',
      type: 'convenience_store',
      name: 'ファミリーマート',
      position: { x: 500, y: 300 },
      size: { width: 50, height: 40 },
      color: '#00A040',
      openHours: { open: 0, close: 24 },
    },
    {
      id: 'ramen-shop',
      type: 'restaurant',
      name: '一蘭 渋谷店',
      position: { x: 700, y: 200 },
      size: { width: 55, height: 45 },
      color: '#C41E3A',
      openHours: { open: 11, close: 23 },
    },
    {
      id: 'tsutaya-shibuya',
      type: 'shop',
      name: 'TSUTAYA',
      position: { x: 600, y: 500 },
      size: { width: 80, height: 60 },
      color: '#FFD700',
      openHours: { open: 10, close: 22 },
    },
  ],
  features: [
    { id: 'hachiko', type: 'sign', position: { x: 400, y: 400 }, name: 'ハチ公像' },
    { id: 'bench-1', type: 'bench', position: { x: 300, y: 450 } },
    { id: 'bench-2', type: 'bench', position: { x: 500, y: 450 } },
    { id: 'vending-1', type: 'vending_machine', position: { x: 250, y: 300 } },
    { id: 'lamp-1', type: 'lamp', position: { x: 400, y: 350 } },
    { id: 'lamp-2', type: 'lamp', position: { x: 200, y: 350 } },
    { id: 'lamp-3', type: 'lamp', position: { x: 600, y: 350 } },
  ],
};

// 渋谷駅
export const shibuyaStation: Location = {
  id: 'shibuya-station',
  name: '渋谷駅',
  type: 'station',
  description: 'JR・東急・メトロが乗り入れる巨大ターミナル駅。',
  width: 600,
  height: 400,
  backgroundColor: '#E8E8E8',
  connectedTo: ['shibuya', 'shinjuku-station', 'meguro-station'],
  buildings: [
    {
      id: 'station-building',
      type: 'station',
      name: '渋谷駅',
      position: { x: 300, y: 200 },
      size: { width: 200, height: 150 },
      color: '#4A4A4A',
    },
  ],
  features: [
    { id: 'bench-s1', type: 'bench', position: { x: 150, y: 300 } },
    { id: 'bench-s2', type: 'bench', position: { x: 450, y: 300 } },
    { id: 'vending-s1', type: 'vending_machine', position: { x: 100, y: 200 } },
    { id: 'sign-s1', type: 'sign', position: { x: 300, y: 100 }, name: '改札口' },
  ],
};

// 目黒の住宅街
export const residentialMeguro: Location = {
  id: 'residential-meguro',
  name: '目黒 住宅街',
  type: 'residential',
  description: '閑静な住宅街。アパートやマンションが並ぶ静かなエリア。',
  width: 800,
  height: 600,
  backgroundColor: '#98FB98',
  connectedTo: ['meguro-station', 'shibuya'],
  buildings: [
    {
      id: 'apartment-sakura',
      type: 'apartment',
      name: 'サクラハイツ',
      position: { x: 150, y: 150 },
      size: { width: 100, height: 80 },
      color: '#DEB887',
      floors: 3,
    },
    {
      id: 'apartment-green',
      type: 'apartment',
      name: 'グリーンコート目黒',
      position: { x: 350, y: 200 },
      size: { width: 120, height: 100 },
      color: '#8FBC8F',
      floors: 5,
    },
    {
      id: 'apartment-hills',
      type: 'apartment',
      name: 'ヒルズ目黒',
      position: { x: 600, y: 150 },
      size: { width: 110, height: 90 },
      color: '#B0C4DE',
      floors: 8,
    },
    {
      id: 'supermarket-life',
      type: 'supermarket',
      name: 'ライフ 目黒店',
      position: { x: 400, y: 450 },
      size: { width: 100, height: 70 },
      color: '#FF6347',
      openHours: { open: 9, close: 22 },
    },
    {
      id: 'lawson-meguro',
      type: 'convenience_store',
      name: 'ローソン',
      position: { x: 650, y: 400 },
      size: { width: 45, height: 35 },
      color: '#00BFFF',
      openHours: { open: 0, close: 24 },
    },
  ],
  features: [
    { id: 'tree-m1', type: 'tree', position: { x: 100, y: 300 } },
    { id: 'tree-m2', type: 'tree', position: { x: 250, y: 350 } },
    { id: 'tree-m3', type: 'tree', position: { x: 500, y: 300 } },
    { id: 'lamp-m1', type: 'lamp', position: { x: 200, y: 250 } },
    { id: 'lamp-m2', type: 'lamp', position: { x: 450, y: 300 } },
    { id: 'bench-m1', type: 'bench', position: { x: 300, y: 380 } },
    { id: 'flower-m1', type: 'flower', position: { x: 150, y: 400 } },
  ],
};

// 目黒駅
export const meguroStation: Location = {
  id: 'meguro-station',
  name: '目黒駅',
  type: 'station',
  description: 'JR山手線と東急目黒線が通る駅。',
  width: 500,
  height: 350,
  backgroundColor: '#E0E0E0',
  connectedTo: ['residential-meguro', 'shibuya-station'],
  buildings: [
    {
      id: 'meguro-station-building',
      type: 'station',
      name: '目黒駅',
      position: { x: 250, y: 175 },
      size: { width: 150, height: 100 },
      color: '#5A5A5A',
    },
  ],
  features: [
    { id: 'bench-mg1', type: 'bench', position: { x: 100, y: 250 } },
    { id: 'vending-mg1', type: 'vending_machine', position: { x: 400, y: 250 } },
  ],
};

// 新宿オフィス街
export const shinjukuOffice: Location = {
  id: 'shinjuku-office',
  name: '新宿 西口オフィス街',
  type: 'office',
  description: '高層ビルが立ち並ぶオフィス街。多くのビジネスパーソンが働く場所。',
  width: 900,
  height: 700,
  backgroundColor: '#C0C0C0',
  connectedTo: ['shinjuku-station'],
  buildings: [
    {
      id: 'tokyo-building',
      type: 'office_building',
      name: '東京テックタワー',
      position: { x: 150, y: 150 },
      size: { width: 120, height: 150 },
      color: '#4682B4',
      floors: 30,
    },
    {
      id: 'shinjuku-center',
      type: 'office_building',
      name: '新宿センタービル',
      position: { x: 400, y: 100 },
      size: { width: 140, height: 180 },
      color: '#708090',
      floors: 45,
    },
    {
      id: 'ns-building',
      type: 'office_building',
      name: 'NSビル',
      position: { x: 650, y: 150 },
      size: { width: 100, height: 130 },
      color: '#5F9EA0',
      floors: 25,
    },
    {
      id: 'doutor-shinjuku',
      type: 'cafe',
      name: 'ドトール 新宿西口店',
      position: { x: 300, y: 400 },
      size: { width: 50, height: 40 },
      color: '#8B4513',
      openHours: { open: 7, close: 21 },
    },
    {
      id: 'yoshinoya-shinjuku',
      type: 'restaurant',
      name: '吉野家',
      position: { x: 500, y: 450 },
      size: { width: 55, height: 40 },
      color: '#FF8C00',
      openHours: { open: 5, close: 24 },
    },
    {
      id: 'seven-eleven-shinjuku',
      type: 'convenience_store',
      name: 'セブンイレブン',
      position: { x: 700, y: 400 },
      size: { width: 45, height: 35 },
      color: '#E60012',
      openHours: { open: 0, close: 24 },
    },
  ],
  features: [
    { id: 'bench-so1', type: 'bench', position: { x: 350, y: 550 } },
    { id: 'bench-so2', type: 'bench', position: { x: 550, y: 550 } },
    { id: 'tree-so1', type: 'tree', position: { x: 250, y: 500 } },
    { id: 'tree-so2', type: 'tree', position: { x: 600, y: 500 } },
    { id: 'lamp-so1', type: 'lamp', position: { x: 400, y: 350 } },
  ],
};

// 新宿駅
export const shinjukuStation: Location = {
  id: 'shinjuku-station',
  name: '新宿駅',
  type: 'station',
  description: '世界一の乗降客数を誇る巨大ターミナル。',
  width: 700,
  height: 450,
  backgroundColor: '#E5E5E5',
  connectedTo: ['shinjuku-office', 'shibuya-station', 'yoyogi-park'],
  buildings: [
    {
      id: 'shinjuku-station-building',
      type: 'station',
      name: '新宿駅',
      position: { x: 350, y: 225 },
      size: { width: 250, height: 180 },
      color: '#3A3A3A',
    },
  ],
  features: [
    { id: 'bench-sj1', type: 'bench', position: { x: 150, y: 350 } },
    { id: 'bench-sj2', type: 'bench', position: { x: 550, y: 350 } },
    { id: 'vending-sj1', type: 'vending_machine', position: { x: 100, y: 200 } },
    { id: 'vending-sj2', type: 'vending_machine', position: { x: 600, y: 200 } },
    { id: 'sign-sj1', type: 'sign', position: { x: 350, y: 100 }, name: '西口' },
  ],
};

// 代々木公園
export const yoyogiPark: Location = {
  id: 'yoyogi-park',
  name: '代々木公園',
  type: 'park',
  description: '都心のオアシス。広大な芝生と森が広がる憩いの場。',
  width: 1000,
  height: 800,
  backgroundColor: '#228B22',
  connectedTo: ['shinjuku-station', 'shibuya-station'],
  buildings: [
    {
      id: 'park-cafe',
      type: 'cafe',
      name: 'Park Side Cafe',
      position: { x: 800, y: 150 },
      size: { width: 70, height: 50 },
      color: '#D2691E',
      openHours: { open: 9, close: 18 },
    },
  ],
  features: [
    { id: 'fountain-y1', type: 'fountain', position: { x: 500, y: 400 }, name: '中央噴水' },
    { id: 'bench-y1', type: 'bench', position: { x: 200, y: 300 } },
    { id: 'bench-y2', type: 'bench', position: { x: 400, y: 500 } },
    { id: 'bench-y3', type: 'bench', position: { x: 700, y: 350 } },
    { id: 'bench-y4', type: 'bench', position: { x: 600, y: 600 } },
    { id: 'tree-y1', type: 'tree', position: { x: 150, y: 200 } },
    { id: 'tree-y2', type: 'tree', position: { x: 300, y: 150 } },
    { id: 'tree-y3', type: 'tree', position: { x: 100, y: 450 } },
    { id: 'tree-y4', type: 'tree', position: { x: 850, y: 300 } },
    { id: 'tree-y5', type: 'tree', position: { x: 750, y: 500 } },
    { id: 'tree-y6', type: 'tree', position: { x: 400, y: 250 } },
    { id: 'tree-y7', type: 'tree', position: { x: 600, y: 200 } },
    { id: 'flower-y1', type: 'flower', position: { x: 350, y: 350 } },
    { id: 'flower-y2', type: 'flower', position: { x: 550, y: 450 } },
    { id: 'flower-y3', type: 'flower', position: { x: 250, y: 550 } },
    { id: 'lamp-y1', type: 'lamp', position: { x: 300, y: 400 } },
    { id: 'lamp-y2', type: 'lamp', position: { x: 600, y: 400 } },
  ],
};

// 全ロケーション
export const allLocations: Location[] = [
  shibuya,
  shibuyaStation,
  residentialMeguro,
  meguroStation,
  shinjukuOffice,
  shinjukuStation,
  yoyogiPark,
];

// IDからロケーションを取得
export function getLocationById(id: string): Location | undefined {
  return allLocations.find((loc) => loc.id === id);
}
