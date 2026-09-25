import { useMemo, useState } from "react";
import { ComponentRecord, formatTime, JOINT_TYPES } from "../types";

interface Props {
  records: ComponentRecord[];
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

type RepairFilter = "all" | "pending" | "ok";

export default function RecordList({ records, onOpenDetail, onEdit, onDelete, onNew }: Props) {
  const [jointFilter, setJointFilter] = useState<string>("all");
  const [repairFilter, setRepairFilter] = useState<RepairFilter>("all");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((r) => {
      if (jointFilter !== "all" && r.jointType !== jointFilter) return false;
      if (repairFilter === "pending" && !r.needsRepair) return false;
      if (repairFilter === "ok" && r.needsRepair) return false;
      if (kw && !`${r.building} ${r.componentId}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [records, jointFilter, repairFilter, keyword]);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>构件清单</p>
          <h2>
            共 {filtered.length} 条
            {filtered.length !== records.length && <small className="muted">（全部 {records.length} 条）</small>}
          </h2>
        </div>
        <button type="button" className="primary" onClick={onNew}>
          + 录入构件
        </button>
      </div>

      <div className="filter-bar">
        <label>
          <span>榫卯类型</span>
          <select value={jointFilter} onChange={(e) => setJointFilter(e.target.value)}>
            <option value="all">全部类型</option>
            {JOINT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>修缮状态</span>
          <select value={repairFilter} onChange={(e) => setRepairFilter(e.target.value as RepairFilter)}>
            <option value="all">全部状态</option>
            <option value="pending">待修缮</option>
            <option value="ok">暂不需修缮</option>
          </select>
        </label>
        <label className="grow">
          <span>检索</span>
          <input
            value={keyword}
            placeholder="按建筑或编号检索"
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          {records.length === 0
            ? "台账为空，点击右上角「录入构件」开始登记。"
            : "当前筛选条件下没有构件，请调整筛选。"}
        </div>
      ) : (
        <div className="record-table">
          <div className="record-row record-head">
            <span>构件编号</span>
            <span>建筑</span>
            <span>榫卯 / 木材</span>
            <span>截面尺寸</span>
            <span>病害</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {filtered.map((r) => (
            <div className="record-row" key={r.id}>
              <span>
                <button type="button" className="link" onClick={() => onOpenDetail(r.id)} title="查看尺寸与病害图">
                  {r.componentId}
                </button>
                <small className="muted block">{r.componentType}</small>
              </span>
              <span>{r.building}</span>
              <span>
                {r.jointType}
                <small className="muted block">{r.wood}</small>
              </span>
              <span>{r.sectionWidth && r.sectionHeight ? `${r.sectionWidth}×${r.sectionHeight}mm` : "—"}</span>
              <span>
                {r.damages.length > 0 ? (
                  <b className="damage-count">{r.damages.length} 处</b>
                ) : (
                  <small className="muted">无</small>
                )}
              </span>
              <span>
                {r.needsRepair ? <i className="badge warn">待修缮</i> : <i className="badge ok">暂不需要</i>}
                <small className="muted block">更新 {formatTime(r.updatedAt)}</small>
              </span>
              <span className="row-actions">
                <button type="button" onClick={() => onOpenDetail(r.id)}>
                  详情
                </button>
                <button type="button" onClick={() => onEdit(r.id)}>
                  编辑
                </button>
                <button type="button" className="danger" onClick={() => onDelete(r.id)}>
                  移除
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
