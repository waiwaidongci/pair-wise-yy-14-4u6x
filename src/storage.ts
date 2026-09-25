import { ComponentRecord, uid } from "./types";

const STORAGE_KEY = "gjch-component-ledger-v1";

/** 首次启动时的示例台账，帮助测绘队快速熟悉页面 */
function seedRecords(): ComponentRecord[] {
  const now = Date.now();
  return [
    {
      id: uid() + "a",
      building: "太和殿",
      componentId: "梁架A-03",
      componentType: "梁",
      wood: "楠木",
      jointType: "透榫",
      sectionWidth: "180",
      sectionHeight: "240",
      deformation: "跨中轻微下挠",
      damages: [
        { id: uid() + "d1", type: "开裂", x: 82, y: 38 },
        { id: uid() + "d2", type: "虫蛀", x: 24, y: 60 },
      ],
      repairSuggestion: "端部裂缝灌浆加固，榫头处加设铁箍，半年后复查。",
      needsRepair: true,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: uid() + "b",
      building: "太和殿",
      componentId: "柱网C-12",
      componentType: "柱",
      wood: "楠木",
      jointType: "管脚榫",
      sectionWidth: "240",
      sectionHeight: "240",
      deformation: "柱身侧弯约 8mm",
      damages: [
        { id: uid() + "d3", type: "糟朽", x: 50, y: 88 },
        { id: uid() + "d4", type: "腐朽", x: 44, y: 70 },
      ],
      repairSuggestion: "柱脚糟朽部分剔除后局部墩接，做好防潮隔离。",
      needsRepair: true,
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: uid() + "c",
      building: "文华殿",
      componentId: "斗拱D-07",
      componentType: "斗拱",
      wood: "柏木",
      jointType: "半榫",
      sectionWidth: "120",
      sectionHeight: "180",
      deformation: "轻微变形",
      damages: [{ id: uid() + "d5", type: "变形", x: 30, y: 50 }],
      repairSuggestion: "暂不影响结构安全，继续监测，每季度记录变形量。",
      needsRepair: false,
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
    },
  ];
}

export function loadRecords(): ComponentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seed = seedRecords();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ComponentRecord[];
  } catch {
    return [];
  }
}

export function saveRecords(records: ComponentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 存储失败（如隐私模式）时静默降级，页面内数据仍可用
  }
}
