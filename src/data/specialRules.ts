import { MoveData, SpecialRule } from '../types';

/**
 * 玩家自定义/口述特殊机制记录 (纯口述/用户显式录入的特例)
 * 仅当用户明确标定或录入特殊机制时才在此配置，不进行任何无依据的自动臆造或伪标定。
 */
export const USER_SPECIAL_RULES: SpecialRule[] = [];

/**
 * 获取角色的全部特殊规则（仅返回用户显式录入的真实规则）
 */
export function getSpecialRulesForCharacter(characterId: string, _moves?: MoveData[]): SpecialRule[] {
  return USER_SPECIAL_RULES.filter((r) => r.characterId === characterId || r.characterId === 'all');
}

