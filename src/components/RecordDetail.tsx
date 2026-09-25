import { useState } from "react";
import {
  ComponentRecord,
  DAMAGE_COLORS,
  DAMAGE_TYPES,
  DamagePoint,
  formatTime,
  uid,
} from "../types";

interface Props {
  record: ComponentRecord;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddDamage: (recordId: string, point: DamagePoint) => void;
  onRemoveDamage: (recordId: string, pointId: string) => void;
}

export default function RecordDetail({
  record,
  onBack,
  onEdit,
  onDelete,
  onAddDamage,
  onRemoveDamage,
}: Props) {
  const [damageType, setDamageType] = useState(DAMAGE_TYPES[0]);

  const w = parseFloat(record.sectionWidth);
  const h = parseFloat(record.sectionHeight);
  const hasSection = !Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0;
  const area = hasSection ? w * h : null;

  /** 截面示意：按比例缩放到 160px 内 */
  const scale = hasSection ? 160 / Math.max(w, h) : 1;
  const rectW = hasSection ? Math.max(w * scale, 24) : 0;
  const rectH = hasSection ? Math.max(h * scale, 24) : 0;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onAddDamage(record.id, { id: uid(), type: damageType, x, y });
  };

  const handleMarkerClick = (e: React.MouseEvent, point: DamagePoint) => {
    e.stopPropagation();
    if (window.confirm(`移除该「${point.type}」病害点？`)) {
      onRemoveDamage(record.id, point.id);
    }
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>构件详情</p>
          <h2>
            {record.building} · {record.componentId}
            {record.needsRepair ? <i className="badge warn">待修缮</i> : <i className="badge ok">暂不需要</i>}
          </h2>
        </div>
        <div className="heading-actions">
          <button type="button" onClick={onBack}>
            ← 返回清单
          </button>
          <button type="button" onClick={() => onEdit(record.id)}>
            编辑
          </button>
          <button type="button" className="danger" onClick={() => onDelete(record.id)}>
            移除
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <h3 className="sub-title">尺寸记录</h3>
          <table className="data-table">
            <tbody>
              <tr>
                <th>构件类型</th>
                <td>{record.componentType}</td>
              </tr>
              <tr>
                <th>木材种类</th>
                <td>{record.wood}</td>
              </tr>
              <tr>
                <th>榫卯类型</th>
                <td>{record.jointType}</td>
              </tr>
              <tr>
                <th>截面宽 × 高</th>
                <td>{hasSection ? `${w} × ${h} mm` : "未记录"}</td>
              </tr>
              <tr>
                <th>截面面积</th>
                <td>{area !== null ? `${area.toLocaleString()} mm²（${(area / 100).toFixed(1)} cm²）` : "—"}</td>
              </tr>
              <tr>
                <th>高宽比</th>
                <td>{hasSection ? (h / w).toFixed(2) : "—"}</td>
              </tr>
              <tr>
                <th>变形情况</th>
                <td>{record.deformation || "未见明显变形"}</td>
              </tr>
              <tr>
                <th>最近更新</th>
                <td>{formatTime(record.updatedAt)}</td>
              </tr>
            </tbody>
          </table>

          {hasSection && (
            <div className="section-sketch">
              <svg width={rectW + 70} height={rectH + 56} role="img" aria-label="截面示意图">
                <rect x={35} y={10} width={rectW} height={rectH} fill="#f3e3c3" stroke="#854d0e" strokeWidth={2} />
                <line x1={35} y1={rectH + 26} x2={35 + rectW} y2={rectH + 26} stroke="#475569" />
                <line x1={35} y1={rectH + 20} x2={35} y2={rectH + 32} stroke="#475569" />
                <line x1={35 + rectW} y1={rectH + 20} x2={35 + rectW} y2={rectH + 32} stroke="#475569" />
                <text x={35 + rectW / 2} y={rectH + 44} textAnchor="middle" fontSize={12} fill="#475569">
                  宽 {w}mm
                </text>
                <line x1={rectW + 50} y1={10} x2={rectW + 50} y2={10 + rectH} stroke="#475569" />
                <line x1={rectW + 44} y1={10} x2={rectW + 56} y2={10} stroke="#475569" />
                <line x1={rectW + 44} y1={10 + rectH} x2={rectW + 56} y2={10 + rectH} stroke="#475569" />
                <text x={rectW + 58} y={10 + rectH / 2} fontSize={12} fill="#475569" transform={`rotate(90 ${rectW + 58} ${10 + rectH / 2})`} textAnchor="middle">
                  高 {h}mm
                </text>
              </svg>
            </div>
          )}

          <h3 className="sub-title">修缮建议</h3>
          <p className="suggestion">{record.repairSuggestion || "暂未填写修缮建议。"}</p>
        </div>

        <div>
          <h3 className="sub-title">病害标记图（{record.damages.length} 处）</h3>
          <div className="damage-toolbar">
            <span>病害类型：</span>
            {DAMAGE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${damageType === t ? "active" : ""}`}
                style={damageType === t ? { borderColor: DAMAGE_COLORS[t], color: DAMAGE_COLORS[t] } : undefined}
                onClick={() => setDamageType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="hint">选定类型后，在下方构件立面图上点击标注位置；点击已有标记可移除。</p>

          <div className="damage-map" onClick={handleMapClick} role="button" aria-label="病害标注图">
            <span className="map-tag left">左端</span>
            <span className="map-tag right">右端</span>
            {record.damages.map((d) => (
              <button
                key={d.id}
                type="button"
                className="damage-marker"
                style={{ left: `${d.x}%`, top: `${d.y}%`, background: DAMAGE_COLORS[d.type] ?? "#475569" }}
                title={`${d.type}（${d.x.toFixed(0)}%, ${d.y.toFixed(0)}%）· 点击移除`}
                onClick={(e) => handleMarkerClick(e, d)}
              >
                {d.type[0]}
              </button>
            ))}
            {record.damages.length === 0 && <span className="map-empty">暂无病害标注，点击图面添加</span>}
          </div>

          {record.damages.length > 0 && (
            <ul className="damage-list">
              {record.damages.map((d, i) => (
                <li key={d.id}>
                  <i className="dot" style={{ background: DAMAGE_COLORS[d.type] ?? "#475569" }} />
                  <b>{d.type}</b>
                  <span className="muted">
                    位置 {d.x.toFixed(0)}% , {d.y.toFixed(0)}%
                  </span>
                  <button type="button" className="danger" onClick={() => onRemoveDamage(record.id, d.id)}>
                    移除
                  </button>
                  <small className="muted">#{i + 1}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
