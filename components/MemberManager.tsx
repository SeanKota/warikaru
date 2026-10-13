'use client';

import React, { useState } from 'react';
import { Users, Plus, X, UserPlus, Sparkles } from 'lucide-react';

interface MemberManagerProps {
  members: string[];
  onAddMember: (name: string) => void;
  onRemoveMember: (name: string) => void;
  onSetMembers: (names: string[]) => void;
}

export function MemberManager({
  members,
  onAddMember,
  onRemoveMember,
  onSetMembers,
}: MemberManagerProps) {
  const [inputName, setInputName] = useState('');

  const handleAdd = () => {
    const trimmed = inputName.trim();
    if (trimmed && !members.includes(trimmed)) {
      onAddMember(trimmed);
      setInputName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleQuickAddABC = () => {
    const defaultList = ['Aさん', 'Bさん', 'Cさん'];
    const merged = Array.from(new Set([...members, ...defaultList]));
    onSetMembers(merged);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">参加メンバー</h2>
            <p className="text-xs text-slate-500">割り勘に参加する全員の名前を入力</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {members.length} 名
        </span>
      </div>

      {/* Member Tags */}
      <div className="flex flex-wrap gap-2 mb-4 min-h-[38px] p-2 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
        {members.length === 0 ? (
          <div className="w-full text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <span>メンバーがまだ登録されていません</span>
            <button
              onClick={handleQuickAddABC}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              A, B, Cさんを追加
            </button>
          </div>
        ) : (
          members.map((member, idx) => {
            const colors = [
              'bg-blue-50 text-blue-700 border-blue-200',
              'bg-indigo-50 text-indigo-700 border-indigo-200',
              'bg-violet-50 text-violet-700 border-violet-200',
              'bg-emerald-50 text-emerald-700 border-emerald-200',
              'bg-amber-50 text-amber-700 border-amber-200',
              'bg-rose-50 text-rose-700 border-rose-200',
            ];
            const colorClass = colors[idx % colors.length];

            return (
              <span
                key={member}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-2xs transition animate-in fade-in-50 zoom-in-95 ${colorClass}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                <span>{member}</span>
                <button
                  type="button"
                  onClick={() => onRemoveMember(member)}
                  className="hover:opacity-75 focus:outline-hidden ml-0.5"
                  title={`${member} を削除`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メンバー名を入力 (例: 田中、Dさん)"
            className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputName.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>追加</span>
        </button>
      </div>
    </div>
  );
}
