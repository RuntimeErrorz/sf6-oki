import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Bookmark } from 'lucide-react';
import { CharacterProfile } from '../../types';
import { getSpecialRulesForCharacter } from '../../data/specialRules';

interface FrameDataExplorerProps {
  character: CharacterProfile;
}

const cleanMoveNameZh = (nameZh: string): string => {
  // Strip trailing parenthesized input if present (e.g. "站轻拳 (5LP)" -> "站轻拳", "三重冲击 (5LP > 5MP)" -> "三重冲击")
  return nameZh.replace(/\s*\(([0-9A-Za-z+\s>/[\]~.*-]+)\)$/, (match, inner) => {
    if (/[0-9LP|MP|HP|LK|MK|HK|PP|KK]/.test(inner) && !/[\u4e00-\u9fa5]/.test(inner)) {
      return '';
    }
    return match;
  }).trim();
};

export const FrameDataExplorer: React.FC<FrameDataExplorerProps> = ({
  character,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const specialRules = useMemo(() => {
    return getSpecialRulesForCharacter(character.id, character.moves);
  }, [character.id, character.moves]);

  const filteredMoves = character.moves.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameZh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.input.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'all' || 
      (selectedCategory === 'kd' && (m.kdAdvantage || m.kdAdvantagePC)) ||
      (selectedCategory === 'normal' && (m.category === 'normal' || m.category === 'command_normal')) ||
      m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate category move statistics
  const countAll = character.moves.length;
  const countNormals = character.moves.filter(m => m.category === 'normal' || m.category === 'command_normal').length;
  const countTCs = character.moves.filter(m => m.category === 'target_combo').length;
  const countSpecials = character.moves.filter(m => m.category === 'special').length;
  const countSupers = character.moves.filter(m => m.category === 'super').length;
  const countKDs = character.moves.filter(m => m.kdAdvantage || m.kdAdvantagePC).length;
  const countThrows = character.moves.filter(m => m.category === 'throw').length;

  return (
    <div className="space-y-3">

      {/* User Custom / Oral Special Rules Section */}
      {specialRules && specialRules.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-50 dark:from-amber-950/20 via-slate-50 dark:via-slate-900/40 to-orange-50 dark:to-orange-950/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>底层实战微机制与输入时序特例 ({character.nameZh})</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-mono">
              已启用 {specialRules.length} 项实战机制
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specialRules.map((rule) => (
              <div key={rule.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-amber-300 dark:border-amber-500/20 hover:border-amber-500/40 transition-all space-y-2 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                      {rule.moveNameZh}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rule.ruleTitleZh}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rule.descriptionZh}</p>
                {rule.frameBreakdownZh && (
                  <div className="flex items-center gap-2 text-[11px] font-mono bg-slate-100 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">最速构成:</span>
                    <span className="text-amber-600 dark:text-amber-300 font-bold">{rule.frameBreakdownZh}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400">⚡ 引擎影响: {rule.engineImpactZh}</span>
                  <span className="text-slate-400 dark:text-slate-500">{rule.recordedBy} · {rule.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索招式名或指令 (如 2LP, 236P, 5HK...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Category buttons */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'all' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            全部招式 ({countAll})
          </button>
          <button
            onClick={() => setSelectedCategory('normal')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'normal' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            普通攻击 ({countNormals})
          </button>
          {countTCs > 0 && (
            <button
              onClick={() => setSelectedCategory('target_combo')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'target_combo' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              目标连段 TC ({countTCs})
            </button>
          )}
          <button
            onClick={() => setSelectedCategory('special')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'special' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            必杀技 ({countSpecials})
          </button>
          {countSupers > 0 && (
            <button
              onClick={() => setSelectedCategory('super')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'super' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              超必杀技 SA ({countSupers})
            </button>
          )}
          <button
            onClick={() => setSelectedCategory('kd')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'kd' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            击倒起手技 KD ({countKDs})
          </button>
          <button
            onClick={() => setSelectedCategory('throw')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedCategory === 'throw' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            投技 ({countThrows})
          </button>
        </div>
      </div>

      {/* Frame Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold min-w-[180px] whitespace-nowrap">招式指令 / 名称</th>
                <th className="py-3 px-2 font-bold text-center min-w-[85px] whitespace-nowrap">发生 (Startup)</th>
                <th className="py-3 px-2 font-bold text-center min-w-[85px] whitespace-nowrap">持续 (Active)</th>
                <th className="py-3 px-2 font-bold text-center min-w-[85px] whitespace-nowrap">收招 (Rec)</th>
                <th className="py-3 px-2 font-bold text-center min-w-[95px] whitespace-nowrap">挥空总帧 (Total)</th>
                <th className="py-3 px-2 font-bold text-center min-w-[85px] whitespace-nowrap">被防 (Block)</th>
                <th className="py-3 px-2 font-bold text-center min-w-[85px] whitespace-nowrap">命中 (Hit)</th>
                <th className="py-3 px-2 font-bold text-center min-w-[95px] whitespace-nowrap text-rose-600 dark:text-rose-400">击倒帧差 (KD)</th>
                <th className="py-3 px-4 font-bold min-w-[180px]">公式校验与特性</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {filteredMoves.map((move) => {
                const effectiveRec = move.recoveryWhiff || move.recovery;
                const isFormulaExact = ((move.startup > 0 ? move.startup - 1 : 0) + (move.active || 1) + effectiveRec) === move.total;
                return (
                  <tr key={move.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Name & Input */}
                    <td className="py-2.5 px-4 min-w-[180px] whitespace-nowrap">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 whitespace-nowrap shrink-0">
                          {move.input}
                        </span>
                        <span className="font-sans font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {cleanMoveNameZh(move.nameZh)}
                        </span>
                        {move.category === 'target_combo' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold font-mono shrink-0">
                            TC
                          </span>
                        )}
                        {move.category === 'super' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold font-mono shrink-0">
                            SA
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Startup */}
                    <td className="py-2.5 px-2 text-center text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap">
                      {move.startup}f
                    </td>

                    {/* Active */}
                    <td className="py-2.5 px-2 text-center text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                      {move.active || 1}f
                    </td>

                    {/* Recovery */}
                    <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {move.recoveryWhiff ? (
                        <div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{move.recovery}f</span>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">空挥 {move.recoveryWhiff}f</div>
                        </div>
                      ) : (
                        <span>{move.recovery}f</span>
                      )}
                    </td>

                    {/* Whiff Total */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {move.totalHit ? (
                        <div>
                          <span>{move.total}f</span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">命中 {move.totalHit}f</div>
                        </div>
                      ) : (
                        <span>{move.total}f</span>
                      )}
                    </td>

                    {/* On Block */}
                    <td className={`py-2.5 px-2 text-center font-bold whitespace-nowrap ${
                      move.onBlock > 0 ? 'text-emerald-600 dark:text-emerald-400' : move.onBlock === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {move.onBlock >= 0 ? `+${move.onBlock}` : move.onBlock}f
                    </td>

                    {/* On Hit */}
                    <td className="py-2.5 px-2 text-center font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      +{move.onHit}f
                    </td>

                    {/* KD Adv */}
                    <td className="py-2.5 px-2 text-center font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {move.kdAdvantage ? `+${move.kdAdvantage}f` : move.kdAdvantagePC ? `+${move.kdAdvantagePC}f(PC)` : '-'}
                    </td>

                    {/* Notes & Verification Badge */}
                    <td className="py-2.5 px-4 font-sans text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-2">
                        {move.recoveryWhiff && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-[10px] font-mono font-bold">
                            <span>空挥惩罚 (+{move.recoveryWhiff - move.recovery}f)</span>
                          </span>
                        )}
                        {isFormulaExact ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>公式对齐</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                            多段/特殊判定
                          </span>
                        )}
                        <span>
                          {move.notes || (
                            move.active && move.active > 1 
                              ? `持续判定 ${move.active} 帧` 
                              : '标准单判定帧打击'
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
