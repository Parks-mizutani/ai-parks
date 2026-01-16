'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/stores/useStore';
import type { Agent, Persona } from '@/types';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
];

export default function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const { addAgent, currentPark } = useStore();
  const [persona, setPersona] = useState<Persona>({
    name: '',
    age: 25,
    personality: '',
    background: '',
    goals: [''],
    speakingStyle: '',
  });
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!persona.name || !persona.personality) {
      alert('名前と性格は必須です');
      return;
    }

    const newAgent: Agent = {
      id: uuidv4(),
      persona: {
        ...persona,
        goals: persona.goals.filter((g) => g.trim() !== ''),
      },
      position: {
        x: Math.random() * ((currentPark?.width || 800) - 100) + 50,
        y: Math.random() * ((currentPark?.height || 600) - 100) + 50,
      },
      color: selectedColor,
      status: 'idle',
      createdBy: 'user',
      createdAt: new Date(),
    };

    addAgent(newAgent);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setPersona({
      name: '',
      age: 25,
      personality: '',
      background: '',
      goals: [''],
      speakingStyle: '',
    });
    setSelectedColor(colorOptions[0]);
  };

  const addGoal = () => {
    setPersona((p) => ({ ...p, goals: [...p.goals, ''] }));
  };

  const updateGoal = (index: number, value: string) => {
    setPersona((p) => ({
      ...p,
      goals: p.goals.map((g, i) => (i === index ? value : g)),
    }));
  };

  const removeGoal = (index: number) => {
    setPersona((p) => ({
      ...p,
      goals: p.goals.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">新しいエージェントを作成</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 名前と年齢 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名前 *
              </label>
              <input
                type="text"
                value={persona.name}
                onChange={(e) => setPersona((p) => ({ ...p, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: タロウ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年齢
              </label>
              <input
                type="number"
                value={persona.age}
                onChange={(e) => setPersona((p) => ({ ...p, age: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={1}
                max={120}
              />
            </div>
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テーマカラー
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 性格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性格 *
            </label>
            <textarea
              value={persona.personality}
              onChange={(e) => setPersona((p) => ({ ...p, personality: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="例: 明るく社交的で、誰とでもすぐに仲良くなれる。好奇心旺盛。"
              required
            />
          </div>

          {/* 背景 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              背景・経歴
            </label>
            <textarea
              value={persona.background}
              onChange={(e) => setPersona((p) => ({ ...p, background: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="例: 大学生で、アルバイトでカフェ店員をしている。"
            />
          </div>

          {/* 話し方 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              話し方の特徴
            </label>
            <textarea
              value={persona.speakingStyle}
              onChange={(e) => setPersona((p) => ({ ...p, speakingStyle: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="例: 元気で明るい話し方。「〜だよね！」をよく使う。"
            />
          </div>

          {/* 目標・興味 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標・興味
            </label>
            <div className="space-y-2">
              {persona.goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: 新しい友達を作る"
                  />
                  {persona.goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addGoal}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 目標を追加
              </button>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              作成して解き放つ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
