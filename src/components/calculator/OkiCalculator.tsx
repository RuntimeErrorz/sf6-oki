import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, Copy, Check, RefreshCw 
} from 'lucide-react';
import { CharacterProfile, MoveData, FrameKillAction, FrameKillSolution } from '../../types';
import { calculateMeaty, solveOkiFrameKills, calculateSequenceSpentFrames } from '../../utils/okiEngine';
import { FrameVisualizer } from '../visualizer/FrameVisualizer';

interface OkiCalculatorProps {
  character: CharacterProfile;
}

export const OkiCalculator: React.FC<OkiCalculatorProps> = ({
  character,
}) => {
  // Current Knockdown selection
  const [selectedKdId, setSelectedKdId] = useState<string>(
    character.knockdowns[0]?.id || ''
  );
  const [currentKdAdv, setCurrentKdAdv] = useState<number>(
    character.knockdowns[0]?.adv || 28
  );

  // Selected Target Meaty Move
  const [selectedMoveId, setSelectedMoveId] = useState<string>(
    character.moves.find(m => m.input === '2MP')?.id || character.moves[0]?.id || '5lp'
  );

  // Custom Frame Kill Sequence
  const [customFrameKills, setCustomFrameKills] = useState<FrameKillAction[]>([]);
  
  // Track whether user explicitly loaded a scheme
  const [hasLoadedSolution, setHasLoadedSolution] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Auto Solver Filters (3 Core Pillars)
  const [solverFilter, setSolverFilter] = useState<'meaty_stealth' | 'golden_plus' | 'safe_jump'>('meaty_stealth');
  const [stealthSortBy, setStealthSortBy] = useState<'block_desc' | 'hit_desc'>('block_desc');
  const [goldenSortOrder, setGoldenSortOrder] = useState<'desc' | 'asc'>('desc');
  const [safeJumpAdv, setSafeJumpAdv] = useState<number>(42);
  
  // Single-Row Toggle Switches
  const [includeSpecials, setIncludeSpecials] = useState<boolean>(true);
  const [includeResources, setIncludeResources] = useState<boolean>(true);
  const [prioritizeForwardMovement, setPrioritizeForwardMovement] = useState<boolean>(true);

  // Effective Knockdown Object
  const currentKdSituation = useMemo(() => {
    return character.knockdowns.find(k => k.id === selectedKdId);
  }, [selectedKdId, character]);

  // Target Move
  const currentTargetMove = useMemo(() => {
    return character.moves.find(m => m.id === selectedMoveId) || character.moves[0];
  }, [selectedMoveId, character]);

  // Accurate spent frames calculation with rapid-cancel awareness
  const customSeqInfo = useMemo(() => {
    return calculateSequenceSpentFrames(customFrameKills, character.id);
  }, [customFrameKills, character.id]);

  const totalSpentFrames = customSeqInfo.totalSpent;

  // Live Meaty Calculation Result with Distance and Practicality
  const calculation = useMemo(() => {
    return calculateMeaty(
      currentKdAdv,
      totalSpentFrames,
      currentTargetMove,
      customFrameKills,
      currentKdSituation?.distance || 'close',
      'midscreen'
    );
  }, [currentKdAdv, totalSpentFrames, currentTargetMove, customFrameKills, currentKdSituation]);

  // Auto Solver Solutions with Spacing and Rating
  const solutions = useMemo(() => {
    return solveOkiFrameKills(character, currentKdAdv, undefined, {
      requireMeatyActiveBonus: solverFilter === 'meaty_stealth',
      requirePlusAdvantage: solverFilter === 'golden_plus',
      requireSafeJump: solverFilter === 'safe_jump',
      safeJumpAdv,
      requireMeterless: !includeResources,
      resourceFilter: includeResources ? 'all' : 'meterless_only',
      moveCategoryFilter: includeSpecials ? 'all' : 'normals_only',
      kdDistance: currentKdSituation?.distance || 'close',
      screenPosition: 'midscreen',
    });
  }, [character, currentKdAdv, solverFilter, safeJumpAdv, includeResources, includeSpecials, currentKdSituation]);

  // Sorted Solutions according to user selection (Forward Movement prioritized: 66 Dash + 9 Forward Jump)
  const sortedSolutions = useMemo(() => {
    const list = [...solutions];

    const compareForwardMovement = (a: FrameKillSolution, b: FrameKillSolution) => {
      if (!prioritizeForwardMovement) return 0;
      const scoreDiff = (b.calculation.forwardMovementScore || 0) - (a.calculation.forwardMovementScore || 0);
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
      return 0;
    };

    if (solverFilter === 'meaty_stealth') {
      if (stealthSortBy === 'block_desc') {
        list.sort((a, b) => {
          const moveDiff = compareForwardMovement(a, b);
          if (moveDiff !== 0) return moveDiff;
          if (b.calculation.effectiveOnBlock !== a.calculation.effectiveOnBlock) {
            return b.calculation.effectiveOnBlock - a.calculation.effectiveOnBlock;
          }
          return b.calculation.effectiveOnHit - a.calculation.effectiveOnHit;
        });
      } else {
        list.sort((a, b) => {
          const moveDiff = compareForwardMovement(a, b);
          if (moveDiff !== 0) return moveDiff;
          if (b.calculation.effectiveOnHit !== a.calculation.effectiveOnHit) {
            return b.calculation.effectiveOnHit - a.calculation.effectiveOnHit;
          }
          return b.calculation.effectiveOnBlock - a.calculation.effectiveOnBlock;
        });
      }
    } else if (solverFilter === 'golden_plus') {
      list.sort((a, b) => {
        const moveDiff = compareForwardMovement(a, b);
        if (moveDiff !== 0) return moveDiff;
        if (goldenSortOrder === 'desc') {
          return b.calculation.remainingAdvantage - a.calculation.remainingAdvantage;
        } else {
          return a.calculation.remainingAdvantage - b.calculation.remainingAdvantage;
        }
      });
    } else if (solverFilter === 'safe_jump') {
      list.sort((a, b) => {
        const moveDiff = compareForwardMovement(a, b);
        if (moveDiff !== 0) return moveDiff;
        if (a.actions.length !== b.actions.length) return a.actions.length - b.actions.length;
        return a.driveCost - b.driveCost;
      });
    } else {
      // 'all' or default
      list.sort((a, b) => {
        const moveDiff = compareForwardMovement(a, b);
        if (moveDiff !== 0) return moveDiff;
        return (b.calculation.score ?? 0) - (a.calculation.score ?? 0);
      });
    }
    return list;
  }, [solutions, solverFilter, stealthSortBy, goldenSortOrder, prioritizeForwardMovement]);

  // Handle Loading a Solution
  const handleLoadSolution = (solution: FrameKillSolution, overrideTargetMove?: MoveData) => {
    setCustomFrameKills([...solution.actions]);
    const target = overrideTargetMove || solution.calculation.targetMove;
    if (target) {
      setSelectedMoveId(target.id);
    }
    setHasLoadedSolution(true);
  };

  return (
    <div className="space-y-3">
      {/* Top Section: 击倒起手与帧数设置卡片 (Knockdown & Frame Slider Card) */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-xl bg-white/90 dark:bg-slate-900/90 space-y-2.5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>击倒起手与有利帧数设置</span>
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 px-3 py-1 rounded-xl font-black text-sm shadow-sm">
              +{currentKdAdv}f 击倒有利
            </span>
            <button
              onClick={() => {
                setCustomFrameKills([]);
                setHasLoadedSolution(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              title="清空当前消帧序列"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置消帧</span>
            </button>
          </div>
        </div>

        {/* Controls Row: Knockdown selector (left) & Interactive Frame Slider (right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Knockdown Select (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>击倒招式预设</span>
            </label>
            <select
              value={selectedKdId || 'custom'}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedKdId(newId);
                if (newId !== 'custom') {
                  const found = character.knockdowns.find(k => k.id === newId);
                  if (found) setCurrentKdAdv(found.adv);
                }
                setCustomFrameKills([]);
                setHasLoadedSolution(false);
              }}
              className="w-full h-10 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner cursor-pointer"
            >
              <optgroup label="预设击倒招式">
                {character.knockdowns.map((kd) => {
                  const cleanName = kd.nameZh.replace(/\s*击倒$/i, '').trim();
                  const hasInputInName = cleanName.endsWith(')') || cleanName.includes(kd.input);
                  const label = hasInputInName 
                    ? `+${kd.adv}f - ${cleanName}`
                    : `+${kd.adv}f - ${cleanName} (${kd.input})`;
                  return (
                    <option key={kd.id} value={kd.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {label}
                    </option>
                  );
                })}
              </optgroup>
              <option value="custom" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                自定义 (+{currentKdAdv}f 击倒有利)
              </option>
            </select>
          </div>

          {/* Interactive Frame Slider (7 cols) */}
          <div className="md:col-span-7 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>有利帧数微调</span>
            </label>
            <div className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center">
              <input
                type="range"
                min="1"
                max="85"
                value={currentKdAdv}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentKdAdv(val);
                  setSelectedKdId('custom');
                  setCustomFrameKills([]);
                  setHasLoadedSolution(false);
                }}
                className="w-full accent-rose-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Section: 智能卡帧 (Top Priority) */}
      <div className="glass-panel-glow rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>智能卡帧</span>
            </h3>
          </div>

          {/* 3 Core Pillars Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setSolverFilter('meaty_stealth')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${solverFilter === 'meaty_stealth' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              偷帧压制 (防守+1及以上)
            </button>
            <button
              onClick={() => setSolverFilter('golden_plus')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${solverFilter === 'golden_plus' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              有利帧二择 (+1f~+5f)
            </button>
            <button
              onClick={() => setSolverFilter('safe_jump')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${solverFilter === 'safe_jump' ? 'bg-purple-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              自定义 ({safeJumpAdv}f)
            </button>
          </div>
        </div>

        {/* Single-Row Unified Filter & Mode-Specific Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 p-2.5 bg-slate-100/90 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-inner">
          {/* Left / Main Section: 3 Toggle Switches */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Switch 1: 包含必杀技压制 */}
            <div 
              onClick={() => setIncludeSpecials(!includeSpecials)}
              className="flex items-center gap-1.5 cursor-pointer select-none group"
              title="开启后方案包含必杀技压制；关闭后仅显示普通技与特殊技方案"
            >
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                包含必杀技
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={includeSpecials}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeSpecials ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    includeSpecials ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[11px] font-mono font-bold ${includeSpecials ? 'text-purple-600 dark:text-purple-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {includeSpecials ? '含必杀' : '仅普通技'}
              </span>
            </div>

            {/* Switch 2: 允许消耗资源 */}
            <div 
              onClick={() => setIncludeResources(!includeResources)}
              className="flex items-center gap-1.5 cursor-pointer select-none group"
              title="开启后允许消耗斗气/OD/强化资源；关闭后仅显示0气纯无消耗方案"
            >
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                允许消耗资源
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={includeResources}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeResources ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    includeResources ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[11px] font-mono font-bold ${includeResources ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {includeResources ? '含资源' : '纯0气'}
              </span>
            </div>

            {/* Switch 3: 前移优先排序 */}
            <div 
              onClick={() => setPrioritizeForwardMovement(!prioritizeForwardMovement)}
              className="flex items-center gap-1.5 cursor-pointer select-none group"
              title="开启后将包含前冲(66)、前空跳(9)等前移贴身消帧方案优先置顶排序（压身与二择均生效）"
            >
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                前移优先
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prioritizeForwardMovement}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prioritizeForwardMovement ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    prioritizeForwardMovement ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[11px] font-mono font-bold ${prioritizeForwardMovement ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {prioritizeForwardMovement ? '前移优先' : '默认排序'}
              </span>
            </div>
          </div>

          {/* Right / Mode-Specific Controls (In the Same Toolbar Row) */}
          <div className="flex items-center gap-2 pl-0 sm:pl-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-1.5 sm:pt-0">
            {solverFilter === 'meaty_stealth' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mr-0.5">偷帧排序:</span>
                <button
                  onClick={() => setStealthSortBy('block_desc')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    stealthSortBy === 'block_desc' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  防守加帧最高 (On Block ↓)
                </button>
                <button
                  onClick={() => setStealthSortBy('hit_desc')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    stealthSortBy === 'hit_desc' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  命中加帧最高 (On Hit ↓)
                </button>
              </div>
            )}

            {solverFilter === 'golden_plus' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold mr-0.5">二择排序:</span>
                <button
                  type="button"
                  onClick={() => setGoldenSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-rose-200 dark:border-slate-700 text-[11px] font-semibold transition-all shadow-sm"
                  title="点击切换顺序 / 逆序"
                >
                  <span className="text-slate-500 dark:text-slate-400">按加帧排序:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {goldenSortOrder === 'desc' ? '从大到小 (+5f → +1f) ↓' : '从小到大 (+1f → +5f) ↑'}
                  </span>
                </button>
              </div>
            )}

            {solverFilter === 'safe_jump' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-purple-800 dark:text-purple-300 font-semibold">目标帧数:</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 font-bold bg-white dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm text-xs">
                  +{safeJumpAdv}f
                </span>
                <div className="w-24 sm:w-32 flex items-center">
                  <input
                    type="range"
                    min="10"
                    max="70"
                    value={safeJumpAdv}
                    onChange={(e) => setSafeJumpAdv(Number(e.target.value))}
                    className="w-full accent-purple-600 h-1.5 bg-purple-200/80 dark:bg-slate-800 rounded-lg cursor-pointer transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

            {/* Solution List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {sortedSolutions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
                  {solverFilter === 'safe_jump' ? (
                    <div>当前击倒 (+{currentKdAdv}f) 暂无凑成 +{safeJumpAdv}f 的消帧组合</div>
                  ) : solverFilter === 'meaty_stealth' ? (
                    <div>暂无防守 +1f 及以上的偷持续帧配方</div>
                  ) : (
                    <div>未找到符合条件的配方，可尝试调整帧数或筛选。</div>
                  )}
                </div>
              ) : (
                sortedSolutions.map((sol, index) => {
                  const calc = sol.calculation;
                  const isPlusMode = solverFilter === 'golden_plus';
                  const isSafeJumpMode = solverFilter === 'safe_jump';
                  const isPureKillSequenceMode = isPlusMode || isSafeJumpMode;

                  return (
                    <div
                      key={`sol-${index}`}
                      className="p-2.5 sm:p-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group border bg-white hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm"
                    >
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1">
                        {/* Compact Horizontal Frame Advantage Badge for Mixup & Safe Jump Modes */}
                        {isPlusMode && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-500/50 text-rose-600 dark:text-rose-300 font-mono shadow-inner shrink-0">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">有利</span>
                            <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400">
                              +{calc.remainingAdvantage}f
                            </span>
                          </div>
                        )}

                        {isSafeJumpMode && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/90 border border-purple-200 dark:border-purple-500/50 text-purple-600 dark:text-purple-300 font-mono shadow-inner shrink-0">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">卡帧</span>
                            <span className="text-sm sm:text-base font-extrabold text-purple-600 dark:text-purple-300">
                              +{calc.remainingAdvantage}f
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Special Move Meaty Badge */}
                            {!isPureKillSequenceMode && calc.targetMove && (calc.targetMove.category === 'special' || (calc.targetMove.category === 'throw' && (calc.targetMove.id.includes('spd') || calc.targetMove.id.includes('grab') || calc.targetMove.id.includes('command') || calc.targetMove.id.includes('throw_od') || calc.targetMove.id.includes('manon_command')))) && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
                                必杀技压制
                              </span>
                            )}

                            {/* Resource cost only if actually consumed */}
                            {calc.usesAnyResource && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
                                {calc.resourceBadgeZh}
                              </span>
                            )}

                            {(() => {
                              const solSeq = calculateSequenceSpentFrames(sol.actions, character.id);
                              if (isPureKillSequenceMode) {
                                if (sol.actions.length === 0) {
                                  return (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                                      {isSafeJumpMode ? '直接前跳 (耗0帧)' : '直接二择 (耗0帧)'}
                                    </span>
                                  );
                                }
                                return (
                                  <>
                                    {sol.actions.map((act, aIdx) => {
                                      const duration = solSeq.durations[aIdx] || act.totalFrames;
                                      const isRapid = solSeq.isRapidCancelled[aIdx];
                                      return (
                                        <React.Fragment key={`act-${aIdx}`}>
                                          <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-semibold ${
                                            isRapid
                                              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-600/60 text-amber-800 dark:text-amber-300'
                                              : isSafeJumpMode
                                              ? 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800/60 text-purple-800 dark:text-purple-300'
                                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300'
                                          }`}>
                                            {act.nameZh} ({duration}f{isRapid ? ' 连打' : ''})
                                          </span>
                                          {aIdx < sol.actions.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600 inline" />}
                                        </React.Fragment>
                                      );
                                    })}
                                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 ml-1">
                                      (共耗 {sol.totalFrames}f)
                                    </span>
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    {sol.actions.length === 0 ? (
                                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                                        直接出招
                                      </span>
                                    ) : (
                                      sol.actions.map((act, aIdx) => {
                                        const duration = solSeq.durations[aIdx] || act.totalFrames;
                                        const isRapid = solSeq.isRapidCancelled[aIdx];
                                        return (
                                          <React.Fragment key={`act-${aIdx}`}>
                                            <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-semibold ${
                                              isRapid
                                                ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-600/60 text-amber-800 dark:text-amber-300'
                                                : 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800/60 text-purple-800 dark:text-purple-300'
                                            }`}>
                                              {act.nameZh} ({duration}f{isRapid ? ' 连打' : ''})
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600 inline" />
                                          </React.Fragment>
                                        );
                                      })
                                    )}
                                    {(() => {
                                      const targetName = calc.targetMove.nameZh.includes(calc.targetMove.input)
                                        ? calc.targetMove.nameZh
                                        : `${calc.targetMove.nameZh} (${calc.targetMove.input})`;
                                      const startup = calc.targetMove.startup;
                                      const active = calc.targetMove.active || 1;
                                      const frameStr = active > 1 
                                        ? `发生${startup}f/持续${active}f` 
                                        : `发生${startup}f`;
                                      return (
                                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800/60 text-[11px] text-rose-800 dark:text-rose-300 font-mono font-bold">
                                          {targetName} ({frameStr})
                                        </span>
                                      );
                                    })()}
                                  </>
                                );
                              }
                            })()}
                          </div>

                          {/* Details line for attacks */}
                          {!isPureKillSequenceMode && (
                            <div className="text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-2">
                              {calc.targetMove.category === 'throw' ? (
                                <>
                                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                    破防抓取 (无法防御)
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-amber-600 dark:text-amber-300 font-medium">
                                    伤害: {calc.targetMove.damage || 1200}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-purple-600 dark:text-purple-300 font-mono">
                                    抓取: 发生{calc.targetMove.startup}f / 第{calc.activeFrameHit}判定帧
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    第 {calc.activeFrameHit} 判定帧命中
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span>
                                    防守: <strong className={calc.effectiveOnBlock > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold text-sm' : calc.effectiveOnBlock === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}>
                                      {calc.effectiveOnBlock >= 0 ? `+${calc.effectiveOnBlock}` : calc.effectiveOnBlock}f
                                    </strong>
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span>
                                    命中: <strong className="text-rose-600 dark:text-rose-400 font-bold">
                                      {calc.isCrumpleOnHit 
                                        ? `蹒跚 +${calc.effectiveOnHit}f`
                                        : calc.isKnockdownOnHit 
                                        ? `击倒 (+${calc.kdAdvantageOnHit || calc.targetMove.kdAdvantage || 'KD'}f)` 
                                        : `${calc.effectiveOnHit >= 0 ? '+' : ''}${calc.effectiveOnHit}f`}
                                    </strong>
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleLoadSolution(sol)}
                          className={`px-3 py-1.5 rounded-xl border text-white text-xs font-bold transition-all whitespace-nowrap shadow-md hover:scale-105 ${
                            isSafeJumpMode
                              ? 'border-purple-500/40 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 shadow-purple-950/40'
                              : isPlusMode
                              ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-900/30'
                              : 'border-rose-500/40 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-900/30'
                          }`}
                          title="在下方时间轴中预览此方案"
                        >
                          {isPureKillSequenceMode ? '载入消帧' : '载入方案'}
                        </button>
                        <button
                          onClick={() => {
                            const sequenceStr = sol.actions.length > 0 
                              ? sol.actions.map(k => `${k.nameZh} (${k.totalFrames}f)`).join(' + ') 
                              : '原地无动作直接二择';
                            let text = '';
                            if (isSafeJumpMode) {
                              text = `【${character.nameZh} 安全跳配方】\n击倒起手: +${currentKdAdv}f (${currentKdSituation?.nameZh || '自定义'})\n消帧动作: ${sequenceStr}\n剩余有利: +${calc.remainingAdvantage}f 安全跳`;
                            } else if (isPlusMode) {
                              text = `【${character.nameZh} 有利帧二择配方】\n击倒起手: +${currentKdAdv}f (${currentKdSituation?.nameZh || '自定义'})\n消帧动作: ${sequenceStr}\n剩余有利: +${calc.remainingAdvantage}f`;
                            } else {
                              const targetNameStr = sol.calculation.targetMove.nameZh.includes(sol.calculation.targetMove.input) 
                                ? sol.calculation.targetMove.nameZh 
                                : `${sol.calculation.targetMove.nameZh} (${sol.calculation.targetMove.input})`;
                              text = `【${character.nameZh} 压身套路】\n击倒起手: +${currentKdAdv}f (${currentKdSituation?.nameZh || '自定义'})\n消帧动作: ${sequenceStr}\n压制招式: ${targetNameStr}\n判定结算: 第 ${sol.calculation.activeFrameHit} 判定帧命中 | 防守 ${sol.calculation.effectiveOnBlock >= 0 ? '+' + sol.calculation.effectiveOnBlock : sol.calculation.effectiveOnBlock}f | 命中 +${sol.calculation.effectiveOnHit}f`;
                            }
                            navigator.clipboard.writeText(text);
                            setCopiedIndex(index);
                            setTimeout(() => setCopiedIndex(null), 1500);
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
                          title="复制此配方"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

      {/* Frame Visualizer Component */}
      <FrameVisualizer
        kdAdvantage={currentKdAdv}
        frameKills={customFrameKills}
        targetMove={currentTargetMove}
        calculation={calculation}
        character={character}
        knockdownSituation={currentKdSituation}
        isMixupMode={solverFilter === 'golden_plus'}
        isLoaded={hasLoadedSolution}
      />
    </div>
  );
};
