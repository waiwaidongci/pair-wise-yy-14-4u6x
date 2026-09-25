import { useMemo, useState } from "react";
import { ComponentRecord } from "../types";

interface Props {
  records: ComponentRecord[];
  onOpenDetail: (id: string) => void;
}

/** 竖向分层：自上而下 檩/椽 → 斗拱 → 梁 → 枋 → 柱 */
const LAYER_OF: Record<string, number> = {
  檩: 0,
  椽: 0,
  斗拱: 1,
  梁: 2,
  其他: 2,
  枋: 3,
  柱: 4,
};
const LAYER_NAMES = ["檩 / 椽", "斗拱", "梁", "枋", "柱"];

const CANVAS_W = 1000;
const LAYER_H = 88;
const TOP_PAD = 34;
const NODE_W = 158;
const NODE_H = 48;

interface Node {
  record: ComponentRecord;
  layer: number;
  cx: number;
  cy: number;
}

export default function BuildingView({ records, onOpenDetail }: Props) {
  const buildings = useMemo(
    () => Array.from(new Set(records.map((r) => r.building))).sort(),
    [records]
  );
  const [selected, setSelected] = useState<string>("");
  const current = buildings.includes(selected) ? selected : buildings[0] ?? "";

  const group = useMemo(
    () => records.filter((r) => r.building === current),
    [records, current]
  );

  const { nodes, edges, canvasH } = useMemo(() => {
    const layers: ComponentRecord[][] = LAYER_NAMES.map(() => []);
    group.forEach((r) => {
      const layer = LAYER_OF[r.componentType] ?? 2;
      layers[layer].push(r);
    });

    const nodes: Node[] = [];
    layers.forEach((list, layer) => {
      list.forEach((record, i) => {
        const cx = ((i + 1) * CANVAS_W) / (list.length + 1);
        const cy = TOP_PAD + layer * LAYER_H + NODE_H / 2;
        nodes.push({ record, layer, cx, cy });
      });
    });

    // 每个节点与上一层水平位置最近的节点连线，示意传力/搭接关系
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
    nodes.forEach((n) => {
      if (n.layer === 0) return;
      const above = nodes.filter((m) => m.layer === n.layer - 1);
      if (above.length === 0) return;
      const nearest = above.reduce((a, b) =>
        Math.abs(a.cx - n.cx) <= Math.abs(b.cx - n.cx) ? a : b
      );
      edges.push({ x1: n.cx, y1: n.cy - NODE_H / 2, x2: nearest.cx, y2: nearest.cy + NODE_H / 2 });
    });

    return { nodes, edges, canvasH: TOP_PAD * 2 + LAYER_H * (LAYER_NAMES.length - 1) + NODE_H };
  }, [group]);

  if (buildings.length === 0) {
    return (
      <section className="panel">
        <div className="empty">台账为空，请先在「录入」中登记构件，再按建筑查看构件关系。</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>单栋建筑 · 构件关系</p>
          <h2>{current}</h2>
        </div>
        <label className="building-picker">
          <span>选择建筑</span>
          <select value={current} onChange={(e) => setSelected(e.target.value)}>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}（{records.filter((r) => r.building === b).length} 件）
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="hint">
        按木构竖向传力分层展示：上层构件搭接于下层最近邻构件。橙色为待修缮构件，点击节点查看详情。
      </p>

      <div className="relation-canvas">
        <svg viewBox={`0 0 ${CANVAS_W} ${canvasH}`} width="100%" role="img" aria-label={`${current} 构件关系图`}>
          {LAYER_NAMES.map((name, i) => (
            <text key={name} x={8} y={TOP_PAD + i * LAYER_H + NODE_H / 2 + 4} fontSize={12} fill="#94a3b8">
              {name}
            </text>
          ))}
          {edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 4" />
          ))}
          {nodes.map((n) => (
            <g
              key={n.record.id}
              transform={`translate(${n.cx - NODE_W / 2}, ${n.cy - NODE_H / 2})`}
              onClick={() => onOpenDetail(n.record.id)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={n.record.needsRepair ? "#fef3c7" : "#ecfdf5"}
                stroke={n.record.needsRepair ? "#b45309" : "#0f766e"}
                strokeWidth={1.6}
              />
              <text x={12} y={20} fontSize={13} fontWeight={700} fill="#172033">
                {n.record.componentId}
              </text>
              <text x={12} y={38} fontSize={11} fill="#64748b">
                {n.record.componentType} · {n.record.jointType}
                {n.record.damages.length > 0 ? ` · ${n.record.damages.length}处病害` : ""}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="building-summary">
        {LAYER_NAMES.map((name, i) => {
          const list = group.filter((r) => (LAYER_OF[r.componentType] ?? 2) === i);
          if (list.length === 0) return null;
          return (
            <div key={name} className="layer-line">
              <b>{name}</b>
              {list.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`chip ${r.needsRepair ? "warn" : ""}`}
                  onClick={() => onOpenDetail(r.id)}
                >
                  {r.componentId} · {r.jointType}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
