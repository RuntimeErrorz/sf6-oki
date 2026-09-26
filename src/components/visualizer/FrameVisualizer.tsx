import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Info, HelpCircle, Compass } from 'lucide-react';
import { FrameKillAction, MeatyCalculation, MoveData, CharacterProfile, KnockdownSituation } from '../../types';
import { calculateSequenceSpentFrames } from '../../utils/okiEngine';

interface FrameVisualizerProps {
  kdAdvantage: number;
  frameKills: FrameKillAction[];
  targetMove: MoveData;
  calculation: MeatyCalculation;
  character?: CharacterProfile;
  knockdownSituation?: KnockdownSituation;
  isMixupMode?: boolean;
  isLoaded?: boolean;
}

export const FrameVisualizer: React.FC<FrameVisualizerProps> = ({
  kdAdvantage,
  frameKills,
  targetMove,
  calculation,
  character,
  knockdownSituation,
  isMixupMode = false,
  isLoaded = false,
}) => {
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1 = normal, 0.5 = slow mo
  const [cellWidth, setCellWidth] = useState<number>(18); // 18px (compact default), 24px (standard), 32px (spacious)
  const [hoveredFrame, setHoveredFrame] = useState<{ frame: number; text: string } | null>(null);
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false);

  const showMeatyAttack = Boolean(isLoaded) && !isMixupMode;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingScrollRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);

  // --- 1. Knockdown Move Resolution ---
  const hasKnockdownMove = Boolean(knockdownSituation);
  const kdMove = useMemo<MoveData | null>(() => {
    if (!character || !knockdownSituation) return null;
    const found = character.moves.find(
      (m) =>
        m.input === knockdownSituation.input ||
        m.id === knockdownSituation.id ||
        m.nameZh === knockdownSituation.nameZh ||
        (knockdownSituation.input && m.input && m.input.toLowerCase().includes(knockdownSituation.input.toLowerCase())) ||
        (knockdownSituation.nameZh && m.nameZh && knockdownSituation.nameZh.includes(m.nameZh))
    );
    return found || null;
  }, [character, knockdownSituation]);

  // --- 2. Frame Calculations for Merged Timeline ---
  const kdStartup = hasKnockdownMove && kdMove ? (kdMove.startup || 16) : 0;
  const kdStartupDuration = hasKnockdownMove ? Math.max(0, kdStartup - 1) : 0;
  const kdActive = hasKnockdownMove && kdMove ? (kdMove.active || 3) : 0;
  const kdRecovery = hasKnockdownMove && kdMove ? (kdMove.recovery || 31) : 0;
  const kdTotal = hasKnockdownMove ? (kdStartupDuration + kdActive + kdRecovery) : 0;

  // Sequence info for frame kills
  const seqInfo = useMemo(() => calculateSequenceSpentFrames(frameKills, character?.id), [frameKills, character?.id]);
  const totalSpentFrames = seqInfo.totalSpent;
  const remainingAdv = kdAdvantage - totalSpentFrames;

  const isJumpAttack = targetMove.id.includes('jump') || targetMove.input.toLowerCase().includes('j.');
  const jumpTotal = character?.jumpTotalFrames || 45;

  // Target move properties
  const targetStartup = targetMove.startup;
  const targetStartupDuration = targetStartup - 1;
  const targetActive = targetMove.active || 1;
  const targetRecovery = targetMove.recovery || 15;
  const targetTotal = isJumpAttack ? jumpTotal : (targetStartupDuration + targetActive + targetRecovery);

  // Key Milestone Timestamps (Absolute Frame Indices)
  const kdHitFrameIndex = hasKnockdownMove ? kdStartupDuration : -1;
  const p1RecoverAfterKdIndex = kdTotal; // 0 if custom, kdTotal if preset
  const p1RecoverAfterKillsIndex = kdTotal + totalSpentFrames;
  const p1MeatyStartIndex = kdTotal + totalSpentFrames;
  const p2WakeupIndex = kdTotal + kdAdvantage;
  const meatyHitMomentIndex = isJumpAttack 
    ? p2WakeupIndex 
    : (p1MeatyStartIndex + targetStartupDuration + (calculation.activeFrameHit - 1));
  
  // Accurate SF6 Blockstun duration: onBlock + (active - 1) + recovery
  const stunDuration = useMemo(() => {
    if (targetMove.category === 'throw') {
      return 12;
    }
    if (isJumpAttack) {
      return 12;
    }
    const baseOnBlock = targetMove.onBlock ?? 0;
    const baseBlockstun = baseOnBlock + (targetActive - 1) + targetRecovery;
    return Math.max(1, baseBlockstun);
  }, [targetMove, targetActive, targetRecovery, isJumpAttack]);

  // Total Yellow Duration for 2P on knockdown
  const opponentKnockdownYellowDuration = hasKnockdownMove
    ? (kdTotal - kdStartupDuration) + kdAdvantage
    : kdAdvantage;

  // Max Display Frames of the Merged Timeline (tightly bounded without excessive dead air padding)
  const maxDisplayFrames = useMemo(() => {
    if (!showMeatyAttack) {
      return Math.max(p1RecoverAfterKillsIndex, p2WakeupIndex) + 1;
    }
    const endP1 = p1MeatyStartIndex + targetTotal + (calculation.effectiveOnBlock > 0 ? calculation.effectiveOnBlock : 0);
    const endP2 = meatyHitMomentIndex + stunDuration;
    return Math.max(endP1, endP2) + 1;
  }, [
    showMeatyAttack,
    p1RecoverAfterKillsIndex,
    p2WakeupIndex,
    p1MeatyStartIndex,
    targetTotal,
    calculation.effectiveOnBlock,
    meatyHitMomentIndex,
    stunDuration
  ]);

  // High-Precision Playback Loop using requestAnimationFrame (Exact SF6 60fps clock)
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    // SF6 60fps timing: 16.667ms per frame at 1.0x
    const frameIntervalMs = (1000 / 60) / playSpeed;

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      accumulatedTime += Math.min(delta, 100);

      if (accumulatedTime >= frameIntervalMs) {
        const framesToAdvance = Math.floor(accumulatedTime / frameIntervalMs);
        accumulatedTime %= frameIntervalMs;

        setCurrentFrame((prev) => {
          const next = prev + framesToAdvance;
          if (next >= maxDisplayFrames) {
            setIsPlaying(false);
            return maxDisplayFrames;
          }
          // Smooth follow-scroll only when timeline overflows viewport
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            if (container.scrollWidth > container.clientWidth) {
              const cursorX = next * cellWidth + cellWidth / 2;
              const viewWidth = container.clientWidth;
              const targetScroll = cursorX - viewWidth / 2;
              container.scrollLeft = Math.max(0, targetScroll);
            }
          }
          return next;
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, maxDisplayFrames, playSpeed, cellWidth]);

  // Auto-scroll timeline to center the specified frame if overflowed
  const centerCurrentFrame = useCallback((frame: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollWidth > container.clientWidth) {
        const targetScroll = frame * cellWidth - container.clientWidth / 2 + cellWidth / 2;
        container.scrollLeft = Math.max(0, targetScroll);
      }
    }
  }, [cellWidth]);

  // Mouse Drag to Scroll Timeline Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingScrollRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScrollRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingScrollRef.current = false;
  };

  // =========================================================================
  // UNIFIED MERGED TIMELINE DATA BUILDER
  // (Phase 1: Knockdown -> Phase 2: Frame Kills -> Phase 3: Meaty / Mixup Window)
  // =========================================================================
  const mergedTimelineData = useMemo(() => {
    const attackerCells: Array<{
      index: number;
      phase: 'knockdown' | 'kills' | 'meaty' | 'idle';
      type: string;
      name: string;
      colorClass: string;
      badgeText?: string;
      badgeBorderClass?: string;
      label: string;
      isHitMoment?: boolean;
    }> = [];

    const defenderCells: Array<{
      index: number;
      type: string;
      name: string;
      colorClass: string;
      badgeText?: string;
      badgeBorderClass?: string;
      label: string;
    }> = [];

    // -------------------------------------------------------------
    // 1P ATTACKER TIMELINE
    // -------------------------------------------------------------
    let p1Cursor = 0;

    // --- Phase 1: 1P Knockdown Attack (0 to kdTotal, only when preset knockdown move selected) ---
    if (hasKnockdownMove && kdMove) {
      // 1. Startup (Mint green `#00c878`)
      for (let f = 0; f < kdStartupDuration; f++) {
        const isEnd = f === kdStartupDuration - 1;
        attackerCells.push({
          index: p1Cursor + f,
          phase: 'knockdown',
          type: 'kd_startup',
          name: kdMove.nameZh,
          colorClass: 'bg-[#00c878]',
          badgeText: isEnd && kdStartupDuration >= 2 ? `${kdStartupDuration}` : undefined,
          label: `【击倒招式】${kdMove.nameZh} 发生前摇 (${f + 1}/${kdStartupDuration}f)`,
        });
      }
      p1Cursor += kdStartupDuration;

      // 2. Active frames (Magenta red `#e11d48`)
      for (let a = 0; a < kdActive; a++) {
        const isHit = a === 0;
        attackerCells.push({
          index: p1Cursor + a,
          phase: 'knockdown',
          type: 'kd_active',
          name: kdMove.nameZh,
          colorClass: isHit
            ? 'bg-[#e11d48] ring-2 ring-yellow-300 shadow-[0_0_8px_#e11d48]'
            : 'bg-[#be123c]',
          label: isHit
            ? `【击倒招式】${kdMove.nameZh} 判定命中！对手进入倒地状态 (有利 +${kdAdvantage}f)`
            : `【击倒招式】${kdMove.nameZh} 攻击判定 (${a + 1}/${kdActive}f)`,
          isHitMoment: isHit,
        });
      }
      p1Cursor += kdActive;

      // 3. Recovery frames (Royal Blue `#0077d6`)
      for (let r = 0; r < kdRecovery; r++) {
        const isEnd = r === kdRecovery - 1;
        attackerCells.push({
          index: p1Cursor + r,
          phase: 'knockdown',
          type: 'kd_recovery',
          name: kdMove.nameZh,
          colorClass: 'bg-[#0077d6]',
          badgeText: isEnd ? `${kdRecovery}` : undefined,
          badgeBorderClass: isEnd ? 'ring-2 ring-sky-300' : undefined,
          label: `【击倒招式】${kdMove.nameZh} 收招确反硬直 (${r + 1}/${kdRecovery}f)`,
        });
      }
      p1Cursor += kdRecovery;
    }

    // --- Phase 2: 1P Frame Kills ---
    frameKills.forEach((kill, kIdx) => {
      const duration = seqInfo.durations[kIdx] || kill.totalFrames;
      const isChainedFollowup = kIdx > 0 && seqInfo.isRapidCancelled[kIdx];

      if (kill.actionType === 'whiff_normal' || (kill.startup && kill.active)) {
        const startup = isChainedFollowup ? 0 : (kill.startup ? kill.startup - 1 : 3);
        const active = kill.active ?? 2;
        const recovery = duration - startup - active;

        // Startup (Mint green)
        for (let s = 0; s < startup; s++) {
          const isEnd = s === startup - 1;
          attackerCells.push({
            index: p1Cursor + s,
            phase: 'kills',
            type: 'kill_startup',
            name: kill.nameZh,
            colorClass: 'bg-[#00c878]',
            badgeText: isEnd && startup >= 2 ? `${startup}` : undefined,
            label: `【消帧 #${kIdx + 1}】${kill.input} 发生前摇 (${s + 1}/${startup}f)`,
          });
        }
        p1Cursor += startup;

        // Active (Magenta red)
        for (let a = 0; a < active; a++) {
          attackerCells.push({
            index: p1Cursor + a,
            phase: 'kills',
            type: 'kill_active',
            name: kill.nameZh,
            colorClass: 'bg-[#e11d48]',
            label: `【消帧 #${kIdx + 1}】${kill.input} 空挥攻击判定 (${a + 1}/${active}f)`,
          });
        }
        p1Cursor += active;

        // Recovery (Royal blue)
        for (let r = 0; r < recovery; r++) {
          const isEnd = r === recovery - 1;
          attackerCells.push({
            index: p1Cursor + r,
            phase: 'kills',
            type: 'kill_recovery',
            name: kill.nameZh,
            colorClass: 'bg-[#0077d6]',
            badgeText: isEnd ? `${recovery}` : undefined,
            badgeBorderClass: isEnd ? 'ring-2 ring-sky-300' : undefined,
            label: `【消帧 #${kIdx + 1}】${kill.input} 收招硬直 (${r + 1}/${recovery}f)`,
          });
        }
        p1Cursor += recovery;
      } else {
        // System Action (Purple)
        for (let f = 0; f < duration; f++) {
          const isEnd = f === duration - 1;
          attackerCells.push({
            index: p1Cursor + f,
            phase: 'kills',
            type: 'kill_system',
            name: kill.nameZh,
            colorClass: 'bg-[#7c3aed]',
            badgeText: isEnd ? `${duration}` : undefined,
            badgeBorderClass: isEnd ? 'ring-1 ring-purple-300' : undefined,
            label: `【消帧 #${kIdx + 1}】${kill.nameZh} (${f + 1}/${duration}f)`,
          });
        }
        p1Cursor += duration;
      }
    });

    // --- Phase 3: 1P Target Meaty Move OR Pure Advantage Window ---
    if (!showMeatyAttack) {
      // ADVANTAGE WINDOW (Raw Knockdown Advantage OR Mixup Advantage)
      const advantageFrames = Math.max(0, p2WakeupIndex - p1Cursor);
      const isRawKnockdown = !isLoaded;
      const windowTitle = isRawKnockdown
        ? `击倒有利 +${kdAdvantage}f`
        : `二择有利 +${remainingAdv}f`;
      const badgeVal = isRawKnockdown ? `+${kdAdvantage}f` : `+${remainingAdv}f`;

      for (let adv = 0; adv < advantageFrames; adv++) {
        const isEnd = adv === advantageFrames - 1;
        attackerCells.push({
          index: p1Cursor + adv,
          phase: 'idle',
          type: 'mixup_window',
          name: windowTitle,
          colorClass: 'bg-emerald-600/35 border border-emerald-400/80 shadow-[inset_0_0_8px_rgba(16,185,129,0.4)]',
          badgeText: isEnd ? badgeVal : undefined,
          badgeBorderClass: isEnd ? 'ring-1 ring-emerald-300 text-emerald-200 font-bold' : undefined,
          label: isRawKnockdown
            ? `【击倒原生有利】1P 已恢复自由行动 (第 ${adv + 1}/${advantageFrames} 帧)，比对手提前 +${kdAdvantage}f 恢复！可在此自由进行消帧或起攻`
            : `【二择先手窗口】1P 已恢复自由行动 (第 ${adv + 1}/${advantageFrames} 帧)，比对手提前 +${remainingAdv}f 苏醒！可在此任意选择打/投/走拆`,
        });
      }
      p1Cursor += advantageFrames;
    } else if (isJumpAttack) {
      // -------------------------------------------------------------
      // Jump Attack / Safe Jump Timeline Modeling (45f total forward jump)
      // -------------------------------------------------------------
      const jumpAirborneBeforeHit = Math.max(0, p2WakeupIndex - p1Cursor);
      const prejumpFrames = Math.min(4, jumpAirborneBeforeHit);
      const airborneDescentFrames = Math.max(0, jumpAirborneBeforeHit - prejumpFrames);

      // 1. Pre-jump (4f, Mint green)
      for (let f = 0; f < prejumpFrames; f++) {
        const isEnd = f === prejumpFrames - 1;
        attackerCells.push({
          index: p1Cursor + f,
          phase: 'meaty',
          type: 'prejump',
          name: '起跳前摇 (Pre-jump)',
          colorClass: 'bg-[#00c878]',
          badgeText: isEnd ? '4' : undefined,
          label: `【起跳前摇】1P 起跳不可防御准备阶段 (${f + 1}/${prejumpFrames}f)`,
        });
      }
      p1Cursor += prejumpFrames;

      // 2. Airborne Descent (Purple action color)
      for (let f = 0; f < airborneDescentFrames; f++) {
        const isEnd = f === airborneDescentFrames - 1;
        attackerCells.push({
          index: p1Cursor + f,
          phase: 'meaty',
          type: 'jump_airborne',
          name: `${targetMove.nameZh} 空中下落`,
          colorClass: 'bg-[#7c3aed]',
          badgeText: isEnd ? `${airborneDescentFrames}` : undefined,
          label: `【空中下落】1P 前跳空中下落阶段 (${f + 1}/${airborneDescentFrames}f)`,
        });
      }
      p1Cursor += airborneDescentFrames;

      // 3. Jump Attack Active Hit (at p2WakeupIndex, Magenta red)
      const jumpActiveFrames = 3;
      for (let a = 0; a < jumpActiveFrames; a++) {
        const isHit = a === 0;
        attackerCells.push({
          index: p1Cursor + a,
          phase: 'meaty',
          type: isHit ? 'meaty_active_hit' : 'meaty_active',
          name: targetMove.nameZh,
          colorClass: isHit
            ? 'bg-[#e11d48] ring-2 ring-yellow-300 shadow-[0_0_10px_#e11d48]'
            : 'bg-[#be123c]',
          label: isHit
            ? (calculation.isSafeJump 
                ? `【安全跳】${targetMove.nameZh} 压对手苏醒第1帧 (防守+${calculation.effectiveOnBlock}f)` 
                : `【跳攻击命中】${targetMove.nameZh} 判定命中对手苏醒`)
            : `【跳攻击判定】${targetMove.nameZh} 空中攻击判定 (${a + 1}/${jumpActiveFrames}f)`,
          isHitMoment: isHit,
        });
      }
      p1Cursor += jumpActiveFrames;

      // 4. Landing Recovery (Royal blue, can block)
      const landingFrames = Math.max(1, (jumpTotal - jumpAirborneBeforeHit - jumpActiveFrames));
      for (let r = 0; r < landingFrames; r++) {
        const isEnd = r === landingFrames - 1;
        attackerCells.push({
          index: p1Cursor + r,
          phase: 'meaty',
          type: 'landing_recovery',
          name: '着地硬直 (可格挡)',
          colorClass: 'bg-[#0077d6]',
          badgeText: isEnd ? `${landingFrames}` : undefined,
          badgeBorderClass: isEnd ? 'ring-2 ring-sky-300' : undefined,
          label: `【着地硬直】1P 落地恢复阶段 (第 ${r + 1}/${landingFrames} 帧，可随时拉后自动格挡升龙/SA)`,
        });
      }
      p1Cursor += landingFrames;

      // 5. Post-Landing Plus Advantage Window
      if (calculation.effectiveOnBlock > 0) {
        const postHitAdvantageFrames = calculation.effectiveOnBlock;
        for (let adv = 0; adv < postHitAdvantageFrames; adv++) {
          const isEnd = adv === postHitAdvantageFrames - 1;
          attackerCells.push({
            index: p1Cursor + adv,
            phase: 'idle',
            type: 'post_hit_advantage',
            name: `防守有利 +${calculation.effectiveOnBlock}f`,
            colorClass: 'bg-emerald-600/35 border border-emerald-400/80 shadow-[inset_0_0_8px_rgba(16,185,129,0.4)]',
            badgeText: isEnd ? `+${calculation.effectiveOnBlock}f` : undefined,
            badgeBorderClass: isEnd ? 'ring-1 ring-emerald-300 text-emerald-200 font-bold' : undefined,
            label: `【安全跳大有利】1P 已落地自由行动 (第 ${adv + 1}/${postHitAdvantageFrames} 帧)，比对手提前 +${calculation.effectiveOnBlock}f 抢占先手！`,
          });
        }
        p1Cursor += postHitAdvantageFrames;
      }
    } else {
      // Ground Meaty Attack
      // Startup (Mint green)
      for (let f = 0; f < targetStartupDuration; f++) {
        const isEnd = f === targetStartupDuration - 1;
        attackerCells.push({
          index: p1Cursor + f,
          phase: 'meaty',
          type: 'meaty_startup',
          name: targetMove.nameZh,
          colorClass: 'bg-[#00c878]',
          badgeText: isEnd && targetStartupDuration >= 2 ? `${targetStartupDuration}` : undefined,
          label: `【压制起攻】${targetMove.nameZh} 发生前摇 (${f + 1}/${targetStartupDuration}f)`,
        });
      }
      p1Cursor += targetStartupDuration;

      // Active frames (Magenta red)
      for (let a = 1; a <= targetActive; a++) {
        const isHit = a === calculation.activeFrameHit;
        attackerCells.push({
          index: p1Cursor,
          phase: 'meaty',
          type: isHit ? 'meaty_active_hit' : 'meaty_active',
          name: targetMove.nameZh,
          colorClass: isHit
            ? 'bg-[#e11d48] ring-2 ring-yellow-300 shadow-[0_0_10px_#e11d48]'
            : 'bg-[#be123c]',
          label: isHit
            ? `【肉压命中！】${targetMove.nameZh} 第 ${a} 判定帧压中对手苏醒 (偷帧 +${calculation.activeFrameHit - 1}f)`
            : `【压制起攻】${targetMove.nameZh} 攻击判定 (${a}/${targetActive}f)`,
          isHitMoment: isHit,
        });
        p1Cursor += 1;
      }

      // Recovery frames (Royal blue)
      for (let r = 0; r < targetRecovery; r++) {
        const isEnd = r === targetRecovery - 1;
        attackerCells.push({
          index: p1Cursor + r,
          phase: 'meaty',
          type: 'meaty_recovery',
          name: targetMove.nameZh,
          colorClass: 'bg-[#0077d6]',
          badgeText: isEnd && targetRecovery >= 3 ? `${targetRecovery}` : undefined,
          badgeBorderClass: isEnd ? 'ring-2 ring-sky-300' : undefined,
          label: `【压制起攻】${targetMove.nameZh} 收招确反硬直 (${r + 1}/${targetRecovery}f)`,
        });
      }
      p1Cursor += targetRecovery;

      // Highlight Post-Meaty Advantage Window (+Nf) if 1P recovers before 2P
      if (calculation.effectiveOnBlock > 0) {
        const postHitAdvantageFrames = calculation.effectiveOnBlock;
        for (let adv = 0; adv < postHitAdvantageFrames; adv++) {
          const isEnd = adv === postHitAdvantageFrames - 1;
          attackerCells.push({
            index: p1Cursor + adv,
            phase: 'idle',
            type: 'post_hit_advantage',
            name: `防守有利 +${calculation.effectiveOnBlock}f`,
            colorClass: 'bg-emerald-600/35 border border-emerald-400/80 shadow-[inset_0_0_8px_rgba(16,185,129,0.4)]',
            badgeText: isEnd ? `+${calculation.effectiveOnBlock}f` : undefined,
            badgeBorderClass: isEnd ? 'ring-1 ring-emerald-300 text-emerald-200 font-bold' : undefined,
            label: `【起攻防守有利】1P 已恢复自由行动 (第 ${adv + 1}/${postHitAdvantageFrames} 帧)，比对手提前 +${calculation.effectiveOnBlock}f 抢占先手！对手仍处于第 ${p1Cursor + adv - meatyHitMomentIndex}/${stunDuration} 帧格挡硬直中`,
          });
        }
        p1Cursor += postHitAdvantageFrames;
      }
    }

    // Fill Idle frames
    while (attackerCells.length <= maxDisplayFrames) {
      attackerCells.push({
        index: attackerCells.length,
        phase: 'idle',
        type: 'idle',
        name: '自由行动',
        colorClass: 'bg-slate-200 dark:bg-[#181a20]',
        label: `1P 自由行动窗口 (第 ${attackerCells.length} 帧)`,
      });
    }

    // -------------------------------------------------------------
    // 2P DEFENDER TIMELINE
    // -------------------------------------------------------------
    if (hasKnockdownMove) {
      // 1. Idle neutral before hit
      for (let f = 0; f < kdStartupDuration; f++) {
        defenderCells.push({
          index: f,
          type: 'idle_prehit',
          name: '正常站立/受击前摇',
          colorClass: 'bg-slate-200 dark:bg-[#181a20]',
          label: `2P 击倒命中前正常状态 (${f + 1}/${kdStartupDuration}f)`,
        });
      }

      // 2. Knockdown Yellow duration (Starts at Frame kdStartupDuration, ends at p2WakeupIndex)
      for (let y = 0; y < opponentKnockdownYellowDuration; y++) {
        const isEnd = y === opponentKnockdownYellowDuration - 1;
        defenderCells.push({
          index: kdStartupDuration + y,
          type: 'down_stun',
          name: '受击倒地硬直',
          colorClass: 'bg-[#facc15]',
          badgeText: isEnd ? `${opponentKnockdownYellowDuration}` : undefined,
          badgeBorderClass: isEnd ? 'ring-2 ring-white shadow-[0_0_8px_#ffffff]' : undefined,
          label: `2P 受击倒地硬直无法行动期间 (${y + 1}/${opponentKnockdownYellowDuration}f)`,
        });
      }
    } else {
      // Custom mode: 2P in Knockdown Yellow from frame 0 to kdAdvantage
      for (let y = 0; y < kdAdvantage; y++) {
        const isEnd = y === kdAdvantage - 1;
        defenderCells.push({
          index: y,
          type: 'down_stun',
          name: '倒地硬直',
          colorClass: 'bg-[#facc15]',
          badgeText: isEnd ? `${kdAdvantage}` : undefined,
          badgeBorderClass: isEnd ? 'ring-2 ring-white shadow-[0_0_8px_#ffffff]' : undefined,
          label: `2P 倒地硬直无法行动期间 (${y + 1}/${kdAdvantage}f)`,
        });
      }
    }

    // 3. Wakeup Frame 1 (Throw Invulnerability Pattern)
    defenderCells.push({
      index: p2WakeupIndex,
      type: 'wakeup_1f_throw_invul',
      name: '起床1f纯摔投无敌',
      colorClass: 'sf6-throw-invul-stripe ring-1 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
      label: '【纯摔投无敌】2P 起床苏醒第 1 帧享有防投保护（免疫普通投与指令投，但仍可被打击技命中）',
    });

    // 4. Wakeup Frame 2+ & Meaty Reaction
    let defCursor = p2WakeupIndex + 1;
    while (defCursor <= maxDisplayFrames) {
      if (showMeatyAttack && defCursor > meatyHitMomentIndex && defCursor <= meatyHitMomentIndex + stunDuration) {
        const isEnd = defCursor === meatyHitMomentIndex + stunDuration;
        const currentStunFrame = defCursor - meatyHitMomentIndex;
        defenderCells.push({
          index: defCursor,
          type: 'stun_meaty',
          name: calculation.effectiveOnBlock >= 0 ? '受创/防御硬直' : '受击硬直',
          colorClass: 'bg-[#facc15]',
          badgeText: isEnd ? `${stunDuration}` : undefined,
          badgeBorderClass: isEnd ? 'ring-2 ring-white' : undefined,
          label: `2P 被压制命中/格挡硬直期间 (${currentStunFrame}/${stunDuration}f)`,
        });
      } else {
        defenderCells.push({
          index: defCursor,
          type: 'idle_woken',
          name: '苏醒自由行动',
          colorClass: 'bg-slate-200 dark:bg-[#181a20]',
          label: isMixupMode && !showMeatyAttack
            ? `2P 苏醒自由行动 (第 ${defCursor} 帧，处于被 1P 先手二择威胁)`
            : `2P 自由行动窗口 (第 ${defCursor} 帧)`,
        });
      }
      defCursor++;
    }

    return { attackerCells, defenderCells };
  }, [
    kdMove,
    kdStartupDuration,
    kdActive,
    kdRecovery,
    kdAdvantage,
    frameKills,
    seqInfo,
    showMeatyAttack,
    targetMove,
    targetStartupDuration,
    targetActive,
    targetRecovery,
    calculation,
    opponentKnockdownYellowDuration,
    p2WakeupIndex,
    meatyHitMomentIndex,
    stunDuration,
    maxDisplayFrames,
    remainingAdv,
    isMixupMode,
    isJumpAttack,
    jumpTotal,
    hasKnockdownMove,
    isLoaded
  ]);

  // Telemetry display values
  const telemetry = useMemo(() => {
    const effAdv = calculation.effectiveOnBlock;
    return {
      kdAdvFormatted: `+${kdAdvantage}帧`,
      finalAdvFormatted: `${effAdv >= 0 ? '+' : ''}${effAdv}帧`,
      finalAdvColor: effAdv > 0 ? 'text-sky-400' : effAdv === 0 ? 'text-slate-200' : 'text-rose-400',
      totalSpentFormatted: `${totalSpentFrames}帧`,
    };
  }, [kdAdvantage, calculation, totalSpentFrames]);

  const frameTicks = useMemo(
    () => Array.from({ length: maxDisplayFrames + 1 }, (_, i) => i),
    [maxDisplayFrames]
  );

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4 transition-colors">
      {/* ========================================================== */}
      {/* 1. TOP HEADER CONTROLS: PLAYBACK, DENSITY, QUICK MILESTONES */}
      {/* ========================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        {/* Title & Unified Timeline Badge */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            帧数计测表
          </h3>
        </div>

        {/* Playback Controls & Frame Display */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center justify-end">
          {/* Zoom Density Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setCellWidth(18)}
              className={`px-2 py-1 rounded-lg transition-all ${cellWidth === 18 ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
              title="紧凑视图 (18px/帧)"
            >
              紧凑
            </button>
            <button
              onClick={() => setCellWidth(24)}
              className={`px-2 py-1 rounded-lg transition-all ${cellWidth === 24 ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
              title="标准视图 (24px/帧)"
            >
              标准
            </button>
            <button
              onClick={() => setCellWidth(32)}
              className={`px-2 py-1 rounded-lg transition-all ${cellWidth === 32 ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
              title="宽裕视图 (32px/帧)"
            >
              宽裕
            </button>
          </div>

          {/* Step Backward */}
          <button
            onClick={() => {
              setIsPlaying(false);
              const prev = Math.max(0, currentFrame - 1);
              setCurrentFrame(prev);
              centerCurrentFrame(prev);
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all text-xs font-mono"
            title="后退 1 帧"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={() => {
              if (!isPlaying) {
                if (currentFrame >= maxDisplayFrames) {
                  setCurrentFrame(0);
                  centerCurrentFrame(0);
                }
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white transition-all shadow-md shadow-rose-950/40"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? '暂停' : '回放'}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={() => {
              setIsPlaying(false);
              const next = Math.min(maxDisplayFrames, currentFrame + 1);
              setCurrentFrame(next);
              centerCurrentFrame(next);
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all text-xs font-mono"
            title="前进 1 帧"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentFrame(0);
              centerCurrentFrame(0);
            }}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
            title="重置到第 0 帧"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector (1.0x / 0.5x / 0.25x) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 text-[10px] font-mono font-bold">
            <button
              onClick={() => setPlaySpeed(1)}
              className={`px-1.5 py-0.5 rounded transition-all ${playSpeed === 1 ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
              title="1.0x (60 FPS 街霸实战原速)"
            >
              1.0x
            </button>
            <button
              onClick={() => setPlaySpeed(0.5)}
              className={`px-1.5 py-0.5 rounded transition-all ${playSpeed === 0.5 ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
              title="0.5x (30 FPS 半速慢放)"
            >
              0.5x
            </button>
            <button
              onClick={() => setPlaySpeed(0.25)}
              className={`px-1.5 py-0.5 rounded transition-all ${playSpeed === 0.25 ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
              title="0.25x (15 FPS 逐帧慢放)"
            >
              0.25x
            </button>
          </div>

          {/* Current Frame Counter */}
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-extrabold shadow-inner">
            F: {currentFrame} / {maxDisplayFrames}
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. DEDICATED DRAG SCRUBBER BAR (左右拖动进度条) */}
      {/* ========================================================== */}
      <div className="bg-slate-100 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-rose-500" />
            <span>左右拖动进度条快速定位:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasKnockdownMove && kdMove ? (
              <>
                <button
                  onClick={() => {
                    setCurrentFrame(kdHitFrameIndex);
                    centerCurrentFrame(kdHitFrameIndex);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition-all font-sans"
                >
                  ① 击倒命中 (F{kdHitFrameIndex})
                </button>
                <button
                  onClick={() => {
                    setCurrentFrame(p1RecoverAfterKdIndex);
                    centerCurrentFrame(p1RecoverAfterKdIndex);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 transition-all font-sans"
                >
                  ② 1P可动/消帧 (F{p1RecoverAfterKdIndex})
                </button>
                {totalSpentFrames > 0 && (
                  <button
                    onClick={() => {
                      setCurrentFrame(p1RecoverAfterKillsIndex);
                      centerCurrentFrame(p1RecoverAfterKillsIndex);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 transition-all font-sans"
                  >
                    ③ 消帧完成 (F{p1RecoverAfterKillsIndex})
                  </button>
                )}
                <button
                  onClick={() => {
                    setCurrentFrame(p2WakeupIndex);
                    centerCurrentFrame(p2WakeupIndex);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition-all font-sans"
                >
                  {totalSpentFrames > 0 ? '④' : '③'} 2P苏醒 (F{p2WakeupIndex})
                </button>
                {showMeatyAttack && (
                  <button
                    onClick={() => {
                      setCurrentFrame(meatyHitMomentIndex);
                      centerCurrentFrame(meatyHitMomentIndex);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 transition-all font-sans"
                  >
                    {totalSpentFrames > 0 ? '⑤' : '④'} 肉压命中 (F{meatyHitMomentIndex})
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCurrentFrame(0);
                    centerCurrentFrame(0);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 transition-all font-sans"
                >
                  ① 1P起步/消帧 (F0)
                </button>
                {totalSpentFrames > 0 && (
                  <button
                    onClick={() => {
                      setCurrentFrame(p1RecoverAfterKillsIndex);
                      centerCurrentFrame(p1RecoverAfterKillsIndex);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 transition-all font-sans"
                  >
                    ② 消帧完成 (F{p1RecoverAfterKillsIndex})
                  </button>
                )}
                <button
                  onClick={() => {
                    setCurrentFrame(p2WakeupIndex);
                    centerCurrentFrame(p2WakeupIndex);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition-all font-sans"
                >
                  {totalSpentFrames > 0 ? '③' : '②'} 2P苏醒 (F{p2WakeupIndex})
                </button>
                {showMeatyAttack && (
                  <button
                    onClick={() => {
                      setCurrentFrame(meatyHitMomentIndex);
                      centerCurrentFrame(meatyHitMomentIndex);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 transition-all font-sans"
                  >
                    {totalSpentFrames > 0 ? '④' : '③'} 肉压命中 (F{meatyHitMomentIndex})
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Range Slider for scrubbing */}
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={maxDisplayFrames}
            value={currentFrame}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCurrentFrame(val);
              centerCurrentFrame(val);
            }}
            className="w-full h-2.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. AUTHENTIC SF6 FRAME METER CONTAINER (UNIFIED HORIZONTAL) */}
      {/* ========================================================== */}
      <div className="relative rounded-xl bg-slate-100 dark:bg-[#07080e] p-3 sm:p-4 border border-slate-300 dark:border-slate-800 shadow-md dark:shadow-2xl transition-colors">
        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="relative select-none overflow-x-auto cursor-grab active:cursor-grabbing pb-2"
        >
          <div
            className="relative select-none"
            style={{ width: `${(maxDisplayFrames + 1) * cellWidth}px`, minWidth: '100%' }}
          >
            {/* PHASE SEGMENT OVERVIEW BAR AT TOP */}
            <div className="flex h-5 w-full bg-slate-200/90 dark:bg-slate-900/80 rounded-t-[3px] overflow-hidden text-[10px] font-mono border-b border-slate-300 dark:border-slate-800/80 mb-1.5">
              {/* Phase 1 Marker: Knockdown Attack (only when preset knockdown move is selected) */}
              {hasKnockdownMove && kdMove && (
                <div
                  style={{ width: `${kdTotal * cellWidth}px` }}
                  className="h-full bg-rose-200/80 dark:bg-rose-950/40 border-r border-rose-400 dark:border-rose-600/40 flex items-center justify-between px-2 text-rose-800 dark:text-rose-300 truncate"
                  title={`阶段 1: 击倒招式 ${kdMove.nameZh} (0 ~ ${kdTotal} 帧)`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>击倒招式: {kdMove.input}</span>
                  </span>
                  <span className="text-[9px] opacity-75">{kdTotal}f</span>
                </div>
              )}

              {/* Phase 2 Marker: Frame Kills */}
              {totalSpentFrames > 0 && (
                <div
                  style={{ width: `${totalSpentFrames * cellWidth}px` }}
                  className="h-full bg-purple-200/80 dark:bg-purple-950/40 border-r border-purple-400 dark:border-purple-500/40 flex items-center justify-between px-2 text-purple-800 dark:text-purple-300 truncate"
                  title={`阶段 2: 空挥/消帧动作 (消耗 ${totalSpentFrames} 帧)`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>消帧序列: {frameKills.map((k) => k.input).join('>')}</span>
                  </span>
                  <span className="text-[9px] opacity-75">-{totalSpentFrames}f</span>
                </div>
              )}

              {/* Phase 3 Marker: Meaty Move OR Pure Mixup Advantage Window */}
              {showMeatyAttack ? (
                <div
                  style={{ width: `${targetTotal * cellWidth}px` }}
                  className="h-full bg-emerald-200/80 dark:bg-emerald-950/40 border-r border-emerald-400 dark:border-emerald-500/40 flex items-center justify-between px-2 text-emerald-800 dark:text-emerald-300 truncate"
                  title={`阶段 3: 肉压起攻 ${targetMove.nameZh} (第 ${calculation.activeFrameHit} 判定帧命中)`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>起攻: {targetMove.input} (发生{targetStartup}f)</span>
                  </span>
                  <span className="text-[9px] opacity-75">{targetTotal}f</span>
                </div>
              ) : !isLoaded ? (
                <div
                  style={{ width: `${Math.max(1, kdAdvantage) * cellWidth}px` }}
                  className="h-full bg-emerald-200/80 dark:bg-emerald-950/60 border-r border-emerald-400 dark:border-emerald-400/60 flex items-center justify-between px-2 text-emerald-800 dark:text-emerald-300 truncate"
                  title={`击倒原生有利窗口 (1P 提前 +${kdAdvantage}f 自由行动)`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>击倒有利: +{kdAdvantage}f 自由行动窗口</span>
                  </span>
                  <span className="text-[9px] opacity-75">+{kdAdvantage}f</span>
                </div>
              ) : (
                <div
                  style={{ width: `${Math.max(1, remainingAdv) * cellWidth}px` }}
                  className="h-full bg-emerald-200/80 dark:bg-emerald-950/60 border-r border-emerald-400 dark:border-emerald-400/60 flex items-center justify-between px-2 text-emerald-800 dark:text-emerald-300 truncate"
                  title={`阶段 3: 有利二择窗口 (1P 提前 +${remainingAdv}f 苏醒自由行动)`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>二择先手: +{remainingAdv}f 自由行动窗口</span>
                  </span>
                  <span className="text-[9px] opacity-75">+{remainingAdv}f</span>
                </div>
              )}
            </div>

            {/* PLAYER 1 HEADER LINE */}
            <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1 px-0.5">
              <div className="flex items-center gap-2">
                <span>击倒有利 <span className="text-sky-600 dark:text-sky-400 font-black">{telemetry.kdAdvFormatted}</span></span>
                <span className="text-slate-400 dark:text-slate-500">/</span>
                <span>消帧消费 <span className="text-purple-600 dark:text-purple-400 font-black">{telemetry.totalSpentFormatted}</span></span>
                <span className="text-slate-400 dark:text-slate-500">/</span>
                {showMeatyAttack ? (
                  <>
                    <span>
                      起攻最终有利 <span className={`${telemetry.finalAdvColor} font-black`}>{telemetry.finalAdvFormatted}</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1 hidden md:inline">
                      (招式: {targetMove.nameZh} 发生{targetStartup}f/持续{targetActive}f)
                    </span>
                  </>
                ) : !isLoaded ? (
                  <>
                    <span>
                      原生自由先手 <span className="text-emerald-600 dark:text-emerald-400 font-black">+{kdAdvantage}帧</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1 hidden md:inline">
                      (击倒原生有利：尚未载入方案，1P 提前 +{kdAdvantage} 帧自由可动)
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      二择剩余有利 <span className="text-emerald-600 dark:text-emerald-400 font-black">+{remainingAdv}帧 (先手)</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1 hidden md:inline">
                      (纯消帧二择模式：提前 {remainingAdv} 帧自由行动，可任意选择打/投/走拆)
                    </span>
                  </>
                )}
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-black tracking-widest text-xs uppercase flex items-center gap-1">
                {hasKnockdownMove && kdMove && (
                  <span className="text-slate-500 dark:text-slate-400 font-normal mr-2 hidden sm:inline">
                    击倒招式: <span className="text-rose-600 dark:text-rose-400 font-bold">{kdMove.nameZh} ({kdMove.input})</span>
                  </span>
                )}
                <span>PLAYER 1</span>
              </div>
            </div>

            {/* Scale Frame Number Ruler */}
            <div className="flex border-b border-slate-300 dark:border-slate-800 mb-1.5 pb-0.5 text-[9px] font-mono text-slate-500 dark:text-slate-400">
              {frameTicks.map((f) => {
                const isKdHit = f === kdHitFrameIndex;
                const isP1Recover = f === p1RecoverAfterKdIndex;
                const isP2Wakeup = f === p2WakeupIndex;
                const isMeatyHit = f === meatyHitMomentIndex;

                let specialColor = '';
                if (isKdHit) specialColor = 'text-rose-600 dark:text-rose-400 font-black';
                else if (isP1Recover) specialColor = 'text-sky-600 dark:text-sky-400 font-black';
                else if (isP2Wakeup) specialColor = 'text-cyan-600 dark:text-cyan-400 font-black underline';
                else if (isMeatyHit) specialColor = 'text-emerald-600 dark:text-emerald-400 font-black underline';

                return (
                  <div
                    key={`tick-${f}`}
                    style={{ width: `${cellWidth}px` }}
                    className={`shrink-0 text-center cursor-pointer hover:text-amber-500 dark:hover:text-amber-400 relative ${specialColor}`}
                    onClick={() => {
                      setCurrentFrame(f);
                      centerCurrentFrame(f);
                    }}
                  >
                    {isP2Wakeup ? (
                      <span className="text-[8px] bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 px-0.5 rounded font-mono font-bold">F{f}</span>
                    ) : isMeatyHit ? (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-0.5 rounded">中</span>
                    ) : f % 5 === 0 ? (
                      <span className="font-bold">{f}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-700">·</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Frame Playhead Vertical Cursor */}
            <div
              className="absolute top-0 bottom-0 z-30 w-[2px] bg-rose-500 shadow-[0_0_12px_#f43f5e] pointer-events-none will-change-transform"
              style={{
                left: `${currentFrame * cellWidth + cellWidth / 2}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="w-3.5 h-3.5 -ml-[6px] rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white"></div>
              </div>
            </div>

            {/* PLAYER 1 FRAME METER BAR */}
            <div className="relative mb-2">
              <div className="flex h-7 sm:h-8 w-full bg-slate-300 dark:bg-black border border-slate-400/80 dark:border-slate-800 rounded-[3px] overflow-hidden divide-x divide-black/35 dark:divide-black/90 shadow-inner">
                {mergedTimelineData.attackerCells.map((cell) => (
                  <div
                    key={`att-${cell.index}`}
                    style={{ width: `${cellWidth}px` }}
                    onClick={() => {
                      setCurrentFrame(cell.index);
                      centerCurrentFrame(cell.index);
                    }}
                    onMouseEnter={() =>
                      setHoveredFrame({
                        frame: cell.index,
                        text: `【PLAYER1】第 ${cell.index} 帧: ${cell.label}`,
                      })
                    }
                    onMouseLeave={() => setHoveredFrame(null)}
                    className={`shrink-0 h-full ${cell.colorClass} ${cell.badgeBorderClass || ''} cursor-pointer relative flex items-center justify-center select-none transition-transform hover:scale-105 hover:z-20`}
                    title={`第 ${cell.index} 帧: ${cell.label}`}
                  >
                    {cell.badgeText && (
                      <span className="font-mono text-[8px] sm:text-[9px] font-black leading-none text-slate-950 bg-white/95 rounded-[1px] px-[1px] py-[0.5px] shadow-sm">
                        {cell.badgeText}
                      </span>
                    )}
                    {cell.isHitMoment && !cell.badgeText && (
                      <span className="font-mono text-[7px] sm:text-[8px] font-black text-white drop-shadow">H</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PLAYER 2 FRAME METER BAR */}
            <div className="relative mb-1">
              <div className="flex h-7 sm:h-8 w-full bg-slate-300 dark:bg-black border border-slate-400/80 dark:border-slate-800 rounded-[3px] overflow-hidden divide-x divide-black/35 dark:divide-black/90 shadow-inner">
                {mergedTimelineData.defenderCells.map((cell) => (
                  <div
                    key={`def-${cell.index}`}
                    style={{ width: `${cellWidth}px` }}
                    onClick={() => {
                      setCurrentFrame(cell.index);
                      centerCurrentFrame(cell.index);
                    }}
                    onMouseEnter={() =>
                      setHoveredFrame({
                        frame: cell.index,
                        text: `【PLAYER2】第 ${cell.index} 帧: ${cell.label}`,
                      })
                    }
                    onMouseLeave={() => setHoveredFrame(null)}
                    className={`shrink-0 h-full ${cell.colorClass} ${cell.badgeBorderClass || ''} cursor-pointer relative flex items-center justify-center select-none transition-transform hover:scale-105 hover:z-20`}
                    title={`第 ${cell.index} 帧: ${cell.label}`}
                  >
                    {cell.badgeText && (
                      <span className="font-mono text-[8px] sm:text-[9px] font-black leading-none text-slate-950 bg-white/95 rounded-[1px] px-[1px] py-[0.5px] shadow-sm">
                        {cell.badgeText}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PLAYER 2 FOOTER LINE */}
            <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white pt-1 px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">倒地硬直总计: <span className="text-amber-600 dark:text-yellow-400 font-bold">{opponentKnockdownYellowDuration}帧</span></span>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <span className="text-slate-600 dark:text-slate-400">起床时刻: <span className="text-amber-600 dark:text-amber-300 font-bold">第 {p2WakeupIndex} 帧</span></span>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <span className="text-slate-600 dark:text-slate-400">
                  防守状态: <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {showMeatyAttack
                      ? (calculation.effectiveOnBlock >= 0 ? `被压防 (+${calculation.effectiveOnBlock}f)` : `被打断 (${calculation.effectiveOnBlock}f)`)
                      : !isLoaded
                      ? `落后 ${kdAdvantage} 帧处于倒地硬直`
                      : `落后 ${remainingAdv} 帧进入被二择`}
                  </span>
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-black tracking-widest text-xs uppercase">
                PLAYER 2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 4. HOVER INFO TOOLTIP & LEGEND TOGGLE */}
      {/* ========================================================== */}
      <div className="min-h-[32px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span>{hoveredFrame ? hoveredFrame.text : `当前位置: 第 ${currentFrame} 帧`}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">
            1个刻度 = 1帧 (1/60秒)
          </span>
          <button
            onClick={() => setShowLegendModal(!showLegendModal)}
            className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold"
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showLegendModal ? '收起帧数图例说明' : '查看帧数图例说明'}</span>
          </button>
        </div>
      </div>

      {/* Official SF6 Color Legend & Custom Legend Modal */}
      {showLegendModal && (
        <div className="p-4 bg-white dark:bg-[#070913] rounded-xl border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white space-y-3 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
              <span>街头霸王6 帧数计测表图例说明</span>
            </h4>
            <span className="text-xs text-slate-400">1帧 (F) = 1/60 秒</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="w-4 h-4 rounded-[2px] bg-[#00c878] shrink-0 border border-black"></span>
              <div>
                <strong className="text-emerald-300">发生前摇 / 打康状态 (Counter)</strong>
                <p className="text-[11px] text-slate-400">招式起手发生前摇期间，受击将触发打康</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="w-4 h-4 rounded-[2px] bg-[#0077d6] shrink-0 border border-black"></span>
              <div>
                <strong className="text-blue-300">收招硬直 / 确反状态 (Punish)</strong>
                <p className="text-[11px] text-slate-400">招式收招硬直期间，受击将触发确反破招</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="w-4 h-4 rounded-[2px] bg-[#e11d48] shrink-0 border border-black"></span>
              <div>
                <strong className="text-rose-300">攻击判定的期间 (Active)</strong>
                <p className="text-[11px] text-slate-400">招式产生攻击判定碰撞盒的活跃时间</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="w-4 h-4 rounded-[2px] bg-[#facc15] shrink-0 border border-black"></span>
              <div>
                <strong className="text-yellow-300">因伤害或格挡而无法行动 (Stun)</strong>
                <p className="text-[11px] text-slate-400">被击中倒地、受击硬直或防御硬直期间</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="w-4 h-4 rounded-[2px] sf6-invul-stripe shrink-0 border border-white"></span>
              <div>
                <strong className="text-slate-200">完全无敌时间 (Full Invul)</strong>
                <p className="text-[11px] text-slate-400">完全免疫打击、飞行道具与摔投 (如OD升龙/SA)</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="w-4 h-4 rounded-[2px] bg-[#7c3aed] shrink-0 border border-black"></span>
              <div>
                <strong className="text-purple-300">消费动作 / 招架判定 (Action)</strong>
                <p className="text-[11px] text-slate-400">前冲、空挥或特殊招式消帧持续时间</p>
              </div>
            </div>

            {/* Throw Invulnerability Legend */}
            <div className="sm:col-span-2 lg:col-span-3 flex items-start gap-2.5 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 shadow-inner">
              <span className="w-5 h-5 rounded-[2px] sf6-throw-invul-stripe shrink-0 border border-cyan-400 mt-0.5 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-cyan-300 font-bold">纯摔投无敌时间 (Throw Invulnerability Only)</strong>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  青白条纹图例专门标明角色<strong>倒地苏醒第 1 帧、受创/格挡硬直恢复后 2 帧以及离地起跳时享有的纯摔投无敌保护</strong>（此时打击技可正常命中，但直接按普通投/指令投会因投无敌而挥空）。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
