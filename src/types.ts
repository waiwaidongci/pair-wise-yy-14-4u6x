export interface DamagePoint {
  id: string;
  type: string;
  /** 图上横向位置，0-100 百分比 */
  x: number;
  /** 图上纵向位置，0-100 百分比 */
  y: number;
}

export interface ComponentRecord {
  id: string;
  building: string;
  componentId: string;
  componentType: string;
  wood: string;
  jointType: string;
  /** 截面宽，mm */
  sectionWidth: string;
  /** 截面高，mm */
  sectionHeight: string;
  deformation: string;
  damages: DamagePoint[];
  repairSuggestion: string;
  needsRepair: boolean;
  createdAt: number;
  updatedAt: number;
}

/** 表单草稿（不含系统字段） */
export interface RecordDraft {
  building: string;
  componentId: string;
  componentType: string;
  wood: string;
  jointType: string;
  sectionWidth: string;
  sectionHeight: string;
  deformation: string;
  repairSuggestion: string;
  needsRepair: boolean;
}

export const JOINT_TYPES = [
  "燕尾榫",
  "透榫",
  "半榫",
  "箍头榫",
  "馒头榫",
  "管脚榫",
  "格肩榫",
  "搭扣榫",
];

export const WOOD_TYPES = ["楠木", "杉木", "松木", "柏木", "榆木", "樟木", "银杏木"];

export const COMPONENT_TYPES = ["柱", "梁", "枋", "檩", "斗拱", "椽", "其他"];

export const DAMAGE_TYPES = ["开裂", "腐朽", "虫蛀", "糟朽", "变形", "松动", "缺失"];

export const DAMAGE_COLORS: Record<string, string> = {
  开裂: "#b91c1c",
  腐朽: "#854d0e",
  虫蛀: "#a16207",
  糟朽: "#7c2d12",
  变形: "#1d4ed8",
  松动: "#0f766e",
  缺失: "#475569",
};

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
