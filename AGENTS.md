# AI Agent 规范与数据权威性指南 (AGENTS.md)

## 核心准则：全量数据必须抓取自权威 FAT 数据库

1. **零虚构原则（Zero-Hallucination Policy）**
   - 严禁任何形式的推测、模拟或人工凭空生成帧数数据与击倒预设。
   - 所有角色的属性（前冲/后撤帧数、跳跃硬直、步行速度、碰撞判定）、普通技/必杀技/超必杀帧数（发生、持续、硬直、防守有利、命中硬直）、以及击倒后帧数优势（Knockdown Advantage），**必须 100% 从 FAT (Frame Assistant Tool - fullmeter.com/fatonline/) 权威数据库抓取**。

2. **数据抓取与同步流水线（Pipeline）**
   - **抓取脚本**：`scripts/scrape_all_fat.mjs`
     - 负责从 FAT master bundle 中抽取所有角色的完整 raw JSON，保存于 `src/data/fat_raw/{characterId}_sf6_fat.json`。
     - 新增角色时，必须首先在 `CHARACTER_MAPPINGS` 中配置其官方 hashtag（如 `#SF6_SAGAT`、`#SF6_ALEX`、`#SF6_Cviper`、`#SF6_INGRID` 等）并运行抓取。
   - **同步脚本**：`scripts/sync_from_fat.mjs`
     - 负责解析 `fat_raw` 数据并自动映射至 `src/data/characters/*.ts`。
     - 包含角色基本属性、各动作空挥硬直、取消属性、命中/防守帧数及所有击倒预设。

3. **击倒数据录入规范**
   - 所有击倒动作（`knockdowns`）的 `adv` 数值必须严格与 FAT 数据中的 `onHit` / `onPC`（包含 `KD +X` 或 `HKD +X`）保持完全一致。
   - 包含角色的普通技扫腿（2HK）、通常投（前投/后投）、必杀技轻/中/重/OD版、特殊技派生、目标连段（Target Combo）及超必杀（SA1/SA2/SA3/CA）。

4. **变更验证流程**
   - 任何涉及角色的代码修改，必须经过：
     1. `npm run data:scrape` / `npm run data:sync` 数据源对齐；
     2. `npm run build` TypeScript 类型编译校验；
     3. `npm run lint` 语法风格检查。
