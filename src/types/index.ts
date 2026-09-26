export type CharacterId =
  | 'luke'
  | 'jamie'
  | 'ryu'
  | 'ken'
  | 'chunli'
  | 'cammy'
  | 'juri'
  | 'deejay'
  | 'guile'
  | 'akuma'
  | 'ed'
  | 'rashid'
  | 'kimberly'
  | 'marisa'
  | 'manon'
  | 'lily'
  | 'jp'
  | 'zangief'
  | 'blanka'
  | 'ehonda'
  | 'dhalsim'
  | 'aki'
  | 'terry'
  | 'mai'
  | 'elena'
  | 'bison'
  | 'yasmine';

export type MoveCategory = 
  | 'normal' 
  | 'command_normal' 
  | 'target_combo'
  | 'special' 
  | 'super' 
  | 'throw' 
  | 'system';

export interface MoveData {
  id: string;
  name: string;
  nameZh: string;
  input: string;
  category: MoveCategory;
  startup: number;
  active: number;
  recovery: number; // recovery on hit/block (e.g. 14 for Luke 2MP)
  recoveryWhiff?: number; // recovery on whiff (e.g. 16 for Luke 2MP)
  total: number; // total whiff frames: (startup - 1) + active + (recoveryWhiff ?? recovery)
  totalHit?: number; // total frames on hit/block: (startup - 1) + active + recovery
  onBlock: number;
  onHit: number;
  onPC?: number; // Punish counter
  damage?: number;
  isCrumple?: boolean; // Causes Crumple (蹒跚软倒) on hit
  isKnockdown?: boolean; // Causes standard Knockdown (倒地) on hit
  kdAdvantage?: number; // normal wakeup KD adv
  kdAdvantagePC?: number; // PC KD adv
  kdAdvantageCorner?: number;
  driveCost?: number; // 2 for OD moves
  saCost?: number; // 1, 2, 3 for SA
  requiresResource?: boolean; // True if requires Denjin, Fuha, Drink, etc.
  resourceNameZh?: string; // e.g. "电刃练气", "风破存豆", "绝品酒"
  isRapidCancel?: boolean;
  chainWhiffCancelRecovery?: number; // Explicit recovery duration when cancelled on whiff into another light normal
  chainWhiffEarlyCancel?: boolean; // Set to false if move cannot cancel early on whiff (e.g. Ryu 2LK)
  isSpecialCancel?: boolean;
  isDriveRushCancel?: boolean;
  notes?: string;
  isSafeJumpStarter?: boolean;
}

export interface KnockdownSituation {
  id: string;
  characterId: CharacterId;
  name: string;
  nameZh: string;
  input: string;
  adv: number; // KD frame advantage
  type: 'normal' | 'corner' | 'pc' | 'super' | 'safejump' | 'throw' | 'custom';
  distance: 'point_blank' | 'close' | 'mid' | 'far';
  description: string;
  tags: string[];
}

export interface FrameKillAction {
  id: string;
  name: string;
  nameZh: string;
  input: string;
  totalFrames: number;
  actionType: 'dash' | 'backdash' | 'whiff_normal' | 'whiff_special' | 'whiff_throw' | 'jump' | 'drive_rush' | 'walk' | 'chain_whiff';
  startup?: number;
  active?: number;
  recovery?: number;
  recoveryWhiff?: number;
  isRapidCancel?: boolean;
  chainWhiffCancelRecovery?: number;
  chainWhiffEarlyCancel?: boolean;
  rapidCancelDuration?: number;
  note?: string;
}

export interface MeatyCalculation {
  targetMove: MoveData;
  kdAdvantage: number;
  spentFrames: number;
  remainingAdvantage: number; // kdAdv - spentFrames
  gapBeforeHit: number; // 0 = hits frame 1 on wakeup, > 0 = gap in frames
  activeFrameHit: number; // 1 = 1st active frame, 2 = 2nd active frame (偷1帧), etc.
  effectiveOnBlock: number; // onBlock + (activeFrameHit - 1)
  effectiveOnHit: number; // onHit + (activeFrameHit - 1)
  effectiveOnPC: number; // onPC or onHit + (activeFrameHit - 1) + 4
  isCrumpleOnHit: boolean; // Causes Crumple (蹒跚软倒) on hit
  isKnockdownOnHit: boolean; // Hits into Knockdown (倒地)
  kdAdvantageOnHit?: number; // Resulting KD adv if it knocks down
  
  // Tactical Evaluation
  isFrame1Meaty: boolean; // Exact wakeup frame 1 hit
  isMeatyActiveFrameBonus: boolean; // activeFrameHit > 1 (偷到帧)
  beats4fMash: boolean; // Gap <= 3 or Frame 1 Meaty
  beatsJump: boolean; // Frame 1 meaty or gap < 4
  beatsWakeupThrow: boolean; // Frame 1 meaty hits before throw startup
  isMeatyThrow: boolean; // Target is throw and connects on frame 3 (wake up 2f throw invul accounted for)
  isSafeJump: boolean; // For jump setups: safe against 9f/10f/11f reversals
  isPlusOnBlock: boolean; // effectiveOnBlock > 0
  hasRapidCancelChain?: boolean; // Sequence utilizes light rapid cancel chain
  
  // Resource Consumption
  driveCost: number; // 0 = Meterless, 1 = Drive Rush, 2 = OD Move, 3 = Drive Rush + OD
  saCost: number; // 0 = No SA, 1 = SA1, 2 = SA2, 3 = SA3
  requiresSpecialResource: boolean; // True if requires Denjin Charge, Fuha Stock, Drink Level, etc.
  specialResourceNameZh?: string; // e.g. "电刃练气", "风破存豆", "绝品酒"
  usesAnyResource: boolean; // driveCost > 0 || saCost > 0 || requiresSpecialResource
  resourceBadgeZh: string; // e.g. "🟢 0资源消耗", "⚡ 2格斗气", "⚡ 2格斗气 · 需电刃练气"

  // Practicality & Distance Analysis
  hasForwardDash: boolean; // Contains 66 dash to close midscreen knockback
  hasForwardJump: boolean; // Contains 9 forward empty jump
  hasForwardMovement: boolean; // Contains forward movement (66 dash, 9 forward jump, or drive rush)
  forwardMovementScore: number; // Cumulative displacement score (e.g. forward jump = 1.5, forward dash = 1.0 each)
  hasBackdash: boolean; // Contains 44 backdash
  isImpractical: boolean; // e.g. contains forward dash + backdash
  reachesInMidscreen: boolean; // False if mid/far knockback without dash
  positionSuitability: 'midscreen_and_corner' | 'corner_only';
  practicalityRating: 'S_PRO' | 'A_STABLE' | 'B_METER_EXPENSIVE' | 'CORNER_ONLY' | 'IMPRACTICAL';
  practicalityBadgeZh: string;
  practicalityReasonZh: string;

  // Tactical ratings
  score: number; // 0 to 100 recommendation rating
  tacticalType: 'frame1_meaty' | 'stealth_plus' | 'strike_throw' | 'safe_jump' | 'frame_trap' | 'loose';
  tacticalSummary: string;
  tacticalSummaryZh: string;
  risksZh: string[];
  strengthsZh: string[];
}

export interface FrameKillSolution {
  id: string;
  actions: FrameKillAction[];
  totalFrames: number;
  calculation: MeatyCalculation;
  driveCost: number;
  practicalityRating: 'S_PRO' | 'A_STABLE' | 'B_METER_EXPENSIVE' | 'CORNER_ONLY' | 'IMPRACTICAL';
  practicalityBadgeZh: string;
  hasRapidCancel?: boolean;
}

export interface OkiSetupRecipe {
  id: string;
  characterId: CharacterId;
  title: string;
  titleZh: string;
  kdStarterName: string;
  kdAdv: number;
  position: 'midscreen' | 'corner' | 'any';
  frameKillSequence: FrameKillAction[];
  meatyAttack: MoveData;
  meatyActiveFrame: number;
  resultingAdvOnBlock: number;
  resultingAdvOnHit: number;
  category: 'strike_throw' | 'plus_on_block' | 'safe_jump' | 'shimmy' | 'auto_time' | 'corner_carry';
  tags: string[];
  descriptionZh: string;
  detailedAnalysisZh: string;
  verifiedBy: string; // e.g. "FAT (Frame Assistant Tool) Verified"
}

export interface SpecialRule {
  id: string;
  characterId: CharacterId | 'all';
  moveId?: string;
  moveNameZh: string;
  ruleTitleZh: string;
  type: 'rapid_cancel_exception' | 'special_cancel_breakdown' | 'frame_override' | 'mechanic_note';
  descriptionZh: string;
  frameBreakdownZh?: string; // e.g. "23 + 10 + 16"
  engineImpactZh: string;
  recordedBy: string; // e.g. "玩家口述特殊记录 (User Custom Specification)"
  date: string;
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  nameZh: string;
  title: string;
  archetype: string;
  avatar: string;
  themeColor: string;
  gradient: string;
  dashFrames: number; // e.g. 19
  backdashFrames: number; // e.g. 23
  jumpTotalFrames: number; // e.g. 45 (4 prejump + 37 air + 4 landing)
  forwardWalkSpeed: number; // pixels/frames normalized
  backwardWalkSpeed: number;
  moves: MoveData[];
  knockdowns: KnockdownSituation[];
  systemKills: FrameKillAction[];
  recipes: OkiSetupRecipe[];
  specialRules?: SpecialRule[];
}
