import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { ComponentRecord, DamagePoint, RecordDraft, uid } from "./types";
import { loadRecords, saveRecords } from "./storage";
import RecordForm from "./components/RecordForm";
import RecordList from "./components/RecordList";
import RecordDetail from "./components/RecordDetail";
import BuildingView from "./components/BuildingView";

type View = "form" | "list" | "detail" | "building";

function App() {
  const [records, setRecords] = useState<ComponentRecord[]>(loadRecords);
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // 任何变动立即落盘，重开页面数据仍在
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const damageCount = records.reduce((sum, r) => sum + r.damages.length, 0);
    const jointKinds = new Set(records.map((r) => r.jointType)).size;
    const pending = records.filter((r) => r.needsRepair).length;
    return { total: records.length, damageCount, jointKinds, pending };
  }, [records]);

  const editingRecord = editingId ? records.find((r) => r.id === editingId) ?? null : null;
  const detailRecord = detailId ? records.find((r) => r.id === detailId) ?? null : null;

  /** 保存：编辑态覆盖原记录；新增时若建筑+编号已存在，确认后覆盖，避免串位 */
  const handleSave = (draft: RecordDraft) => {
    const now = Date.now();
    if (editingId) {
      setRecords((rs) =>
        rs.map((r) => (r.id === editingId ? { ...r, ...draft, updatedAt: now } : r))
      );
      setToast(`已覆盖原记录「${draft.building} · ${draft.componentId}」`);
    } else {
      const dup = records.find(
        (r) => r.building === draft.building && r.componentId === draft.componentId
      );
      if (dup) {
        if (!window.confirm(`「${draft.building} · ${draft.componentId}」已存在，是否用新内容覆盖原记录？`)) {
          return;
        }
        setRecords((rs) => rs.map((r) => (r.id === dup.id ? { ...r, ...draft, updatedAt: now } : r)));
        setToast(`已覆盖同编号记录「${draft.componentId}」`);
      } else {
        setRecords((rs) => [
          { ...draft, id: uid(), damages: [], createdAt: now, updatedAt: now },
          ...rs,
        ]);
        setToast(`「${draft.componentId}」已保存，进入清单`);
      }
    }
    setEditingId(null);
    setView("list");
  };

  const handleDelete = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    if (!window.confirm(`确认移除「${target.building} · ${target.componentId}」？移除后统计将同步更新。`)) {
      return;
    }
    setRecords((rs) => rs.filter((r) => r.id !== id));
    if (detailId === id) {
      setDetailId(null);
      setView("list");
    }
    if (editingId === id) setEditingId(null);
    setToast("记录已移除，统计已同步");
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView("form");
  };

  const handleOpenDetail = (id: string) => {
    setDetailId(id);
    setView("detail");
  };

  const handleNew = () => {
    setEditingId(null);
    setView("form");
  };

  const patchRecord = (id: string, patch: (r: ComponentRecord) => ComponentRecord) => {
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...patch(r), updatedAt: Date.now() } : r)));
  };

  const handleAddDamage = (recordId: string, point: DamagePoint) => {
    patchRecord(recordId, (r) => ({ ...r, damages: [...r.damages, point] }));
  };

  const handleRemoveDamage = (recordId: string, pointId: string) => {
    patchRecord(recordId, (r) => ({ ...r, damages: r.damages.filter((d) => d.id !== pointId) }));
  };

  const tabs: { key: View; label: string }[] = [
    { key: "list", label: "构件清单" },
    { key: "form", label: editingId ? "编辑构件" : "录入构件" },
    { key: "building", label: "建筑关系" },
  ];

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p>古建测绘队 · 木结构台账</p>
          <h1>榫卯构件测绘登记</h1>
          <span>
            登记建筑、构件编号、木材、榫卯类型、截面尺寸、病害与修缮建议；支持清单筛选、病害图上标注与单栋建筑构件关系查看，数据本地保存，重开不丢失。
          </span>
        </div>
        <nav className="tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={view === t.key || (t.key === "list" && view === "detail") ? "active" : ""}
              onClick={() => (t.key === "form" ? handleNew() : setView(t.key))}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="metrics">
        <article>
          <small>构件数量</small>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <small>病害点</small>
          <strong>{stats.damageCount}</strong>
        </article>
        <article>
          <small>榫卯类型</small>
          <strong>{stats.jointKinds}</strong>
        </article>
        <article className="warn-card">
          <small>待修缮</small>
          <strong>{stats.pending}</strong>
        </article>
      </section>

      {view === "form" && (
        <RecordForm
          key={editingId ?? "new"}
          initial={editingRecord}
          onSave={handleSave}
          onCancel={() => {
            setEditingId(null);
            setView("list");
          }}
        />
      )}

      {view === "list" && (
        <RecordList
          records={records}
          onOpenDetail={handleOpenDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={handleNew}
        />
      )}

      {view === "detail" && detailRecord && (
        <RecordDetail
          record={detailRecord}
          onBack={() => setView("list")}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddDamage={handleAddDamage}
          onRemoveDamage={handleRemoveDamage}
        />
      )}

      {view === "building" && <BuildingView records={records} onOpenDetail={handleOpenDetail} />}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

export default App;
