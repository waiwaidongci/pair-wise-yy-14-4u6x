import { useState } from "react";
import {
  COMPONENT_TYPES,
  ComponentRecord,
  JOINT_TYPES,
  RecordDraft,
  WOOD_TYPES,
} from "../types";

interface Props {
  /** 编辑时传入原记录，新增时为 null */
  initial: ComponentRecord | null;
  onSave: (draft: RecordDraft) => void;
  onCancel: () => void;
}

const emptyDraft: RecordDraft = {
  building: "",
  componentId: "",
  componentType: COMPONENT_TYPES[0],
  wood: WOOD_TYPES[0],
  jointType: JOINT_TYPES[0],
  sectionWidth: "",
  sectionHeight: "",
  deformation: "",
  repairSuggestion: "",
  needsRepair: true,
};

export default function RecordForm({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<RecordDraft>(() =>
    initial
      ? {
          building: initial.building,
          componentId: initial.componentId,
          componentType: initial.componentType,
          wood: initial.wood,
          jointType: initial.jointType,
          sectionWidth: initial.sectionWidth,
          sectionHeight: initial.sectionHeight,
          deformation: initial.deformation,
          repairSuggestion: initial.repairSuggestion,
          needsRepair: initial.needsRepair,
        }
      : emptyDraft
  );
  const [missing, setMissing] = useState<string[]>([]);

  const set = <K extends keyof RecordDraft>(key: K, value: RecordDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "building" || key === "componentId") {
      setMissing((m) =>
        m.filter((name) =>
          key === "building" ? name !== "建筑名称" : name !== "构件编号"
        )
      );
    }
  };

  const handleSubmit = () => {
    const lack: string[] = [];
    if (!draft.building.trim()) lack.push("建筑名称");
    if (!draft.componentId.trim()) lack.push("构件编号");
    if (lack.length > 0) {
      setMissing(lack);
      return;
    }
    onSave({ ...draft, building: draft.building.trim(), componentId: draft.componentId.trim() });
  };

  const fieldError = (name: string) => missing.includes(name);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>{initial ? "编辑模式 · 保存将覆盖原记录" : "新构件登记"}</p>
          <h2>{initial ? `编辑 ${initial.building} · ${initial.componentId}` : "录入构件"}</h2>
        </div>
        <div className="heading-actions">
          {initial && (
            <button type="button" onClick={onCancel}>
              取消编辑
            </button>
          )}
          <button type="button" className="primary" onClick={handleSubmit}>
            {initial ? "覆盖保存" : "保存记录"}
          </button>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="alert" role="alert">
          请补全必填项：{missing.join("、")}
        </div>
      )}

      <div className="field-grid">
        <label className={fieldError("建筑名称") ? "invalid" : ""}>
          <span>建筑名称 *</span>
          <input
            value={draft.building}
            placeholder="如：太和殿"
            onChange={(e) => set("building", e.target.value)}
          />
          {fieldError("建筑名称") && <em className="field-err">建筑名称缺失，请补全</em>}
        </label>

        <label className={fieldError("构件编号") ? "invalid" : ""}>
          <span>构件编号 *</span>
          <input
            value={draft.componentId}
            placeholder="如：梁架A-03"
            onChange={(e) => set("componentId", e.target.value)}
          />
          {fieldError("构件编号") && <em className="field-err">构件编号缺失，请补全</em>}
        </label>

        <label>
          <span>构件类型</span>
          <select value={draft.componentType} onChange={(e) => set("componentType", e.target.value)}>
            {COMPONENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          <span>木材种类</span>
          <select value={draft.wood} onChange={(e) => set("wood", e.target.value)}>
            {WOOD_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          <span>榫卯类型</span>
          <select value={draft.jointType} onChange={(e) => set("jointType", e.target.value)}>
            {JOINT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          <span>截面宽（mm）</span>
          <input
            type="number"
            min="0"
            value={draft.sectionWidth}
            placeholder="如：180"
            onChange={(e) => set("sectionWidth", e.target.value)}
          />
        </label>

        <label>
          <span>截面高（mm）</span>
          <input
            type="number"
            min="0"
            value={draft.sectionHeight}
            placeholder="如：240"
            onChange={(e) => set("sectionHeight", e.target.value)}
          />
        </label>

        <label>
          <span>变形情况</span>
          <input
            value={draft.deformation}
            placeholder="如：跨中下挠、柱身侧弯"
            onChange={(e) => set("deformation", e.target.value)}
          />
        </label>

        <label className="span-2">
          <span>修缮建议</span>
          <textarea
            rows={3}
            value={draft.repairSuggestion}
            placeholder="如：裂缝灌浆加固，墩接糟朽柱脚……"
            onChange={(e) => set("repairSuggestion", e.target.value)}
          />
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.needsRepair}
            onChange={(e) => set("needsRepair", e.target.checked)}
          />
          <span>列入待修缮</span>
        </label>
      </div>

      <p className="form-hint">保存后自动进入构件清单；病害位置可在清单中点开构件，于病害图上标注。</p>
    </section>
  );
}
