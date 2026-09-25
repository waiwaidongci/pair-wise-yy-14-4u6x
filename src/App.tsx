import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

/* ---------- 数据模型 ---------- */

type Status = "待修缮" | "观察中" | "已修缮";

interface DamagePoint {
  id: string;
  x: number; // 病害图坐标 0-600
  y: number; // 病害图坐标 0-220
  disease: string;
}

interface ComponentRecord {
  id: string;
  building: string; // 建筑名称
  code: string; // 构件编号
  wood: string; // 木材种类
  jointType: string; // 榫卯类型
  width: string; // 截面宽 mm
  height: string; // 截面高 mm
  deformation: string; // 变形情况
  repair: string; // 修缮建议
  status: Status;
  damages: DamagePoint[];
  updatedAt: number;
}

const WOODS = ["杉木", "松木", "柏木", "楠木", "榆木", "樟木", "硬杂木", "其他"];
const JOINTS = ["燕尾榫", "透榫", "半榫", "箍头榫", "馒头榫", "管脚榫", "银锭榫", "十字搭交榫"];
const DISEASES = ["糟朽", "虫蛀", "开裂", "弯垂", "拔榫", "歪闪", "霉变"];
const REPAIRS = ["局部墩接", "剔补嵌补", "灌浆加固", "更换构件", "防腐防虫处理", "铁件拉结", "继续监测", "无需处理"];
const STATUSES: Status[] = ["待修缮", "观察中", "已修缮"];

const STORAGE_KEY = "gujian-ledger-records-v1";

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

/* ---------- 示例数据（首次启动写入，之后以本地存储为准） ---------- */

function seedRecords(): ComponentRecord[] {
  const now = Date.now();
  return [
    {
      id: uid(),
      building: "大成殿",
      code: "梁架A-03",
      wood: "杉木",
      jointType: "透榫",
      width: "180",
      height: "240",
      deformation: "跨中下垂约12mm",
      repair: "灌浆加固",
      status: "待修缮",
      damages: [
        { id: uid(), x: 96, y: 110, disease: "开裂" },
        { id: uid(), x: 300, y: 168, disease: "弯垂" },
      ],
      updatedAt: now - 86400000 * 2,
    },
    {
      id: uid(),
      building: "大成殿",
      code: "柱网C-12",
      wood: "楠木",
      jointType: "管脚榫",
      width: "220",
      height: "220",
      deformation: "柱脚轻微歪闪",
      repair: "局部墩接",
      status: "待修缮",
      damages: [{ id: uid(), x: 512, y: 186, disease: "糟朽" }],
      updatedAt: now - 86400000,
    },
    {
      id: uid(),
      building: "大成殿",
      code: "斗拱D-07",
      wood: "松木",
      jointType: "半榫",
      width: "120",
      height: "150",
      deformation: "轻微变形",
      repair: "继续监测",
      status: "观察中",
      damages: [{ id: uid(), x: 300, y: 60, disease: "拔榫" }],
      updatedAt: now - 3600000 * 5,
    },
    {
      id: uid(),
      building: "东西配殿",
      code: "檐枋B-01",
      wood: "柏木",
      jointType: "燕尾榫",
      width: "140",
      height: "200",
      deformation: "无明显变形",
      repair: "防腐防虫处理",
      status: "已修缮",
      damages: [{ id: uid(), x: 210, y: 130, disease: "虫蛀" }],
      updatedAt: now - 3600000,
    },
  ];
}

function loadRecords(): ComponentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ComponentRecord[];
  } catch {
    /* 忽略损坏的缓存 */
  }
  return seedRecords();
}

/* ---------- 表单草稿 ---------- */

interface Draft {
  building: string;
  code: string;
  wood: string;
  jointType: string;
  width: string;
  height: string;
  deformation: string;
  repair: string;
  status: Status;
  damages: DamagePoint[];
}

const emptyDraft = (): Draft => ({
  building: "",
  code: "",
  wood: WOODS[0],
  jointType: JOINTS[0],
  width: "",
  height: "",
  deformation: "",
  repair: REPAIRS[0],
  status: "待修缮",
  damages: [],
});

/* ---------- 病害标记图 ---------- */

function DamageMap({
  damages,
  disease,
  editable,
  onAdd,
  onRemove,
}: {
  damages: DamagePoint[];
  disease: string;
  editable: boolean;
  onAdd?: (p: DamagePoint) => void;
  onRemove?: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editable || !onAdd || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 600);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 220);
    onAdd({ id: uid(), x, y, disease });
  };

  return (
    <div className="damage-map">
      <svg
        ref={svgRef}
        viewBox="0 0 600 220"
        className={editable ? "editable" : ""}
        onClick={handleClick}
        role="img"
        aria-label="病害标记图"
      >
        {/* 构件示意：梁身 + 两端榫头 */}
        <rect x="60" y="70" width="480" height="80" rx="4" fill="#f3e7d3" stroke="#854d0e" strokeWidth="2" />
        <rect x="20" y="85" width="40" height="50" fill="#ead9bd" stroke="#854d0e" strokeWidth="2" />
        <rect x="540" y="85" width="40" height="50" fill="#ead9bd" stroke="#854d0e" strokeWidth="2" />
        <line x1="60" y1="110" x2="540" y2="110" stroke="#d6c3a3" strokeDasharray="6 5" />
        <text x="300" y="200" textAnchor="middle" fontSize="12" fill="#8a6d3b">
          构件立面示意（点击图面标注病害位置）
        </text>
        {damages.map((p, i) => (
          <g key={p.id} onClick={(e) => { e.stopPropagation(); if (editable && onRemove) onRemove(p.id); }}>
            <circle cx={p.x} cy={p.y} r="11" fill="#dc2626" opacity="0.85" style={editable ? { cursor: "pointer" } : {}} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      {damages.length > 0 && (
        <ul className="damage-list">
          {damages.map((p, i) => (
            <li key={p.id}>
              <b>{i + 1}.</b> {p.disease}
              <span className="dim">（{p.x}, {p.y}）</span>
              {editable && onRemove && (
                <button type="button" className="link" onClick={() => onRemove(p.id)}>移除</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- 主应用 ---------- */

function App() {
  const [records, setRecords] = useState<ComponentRecord[]>(loadRecords);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ building?: string; code?: string }>({});
  const [notice, setNotice] = useState("");
  const [disease, setDisease] = useState(DISEASES[0]);

  const [jointFilter, setJointFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState<"全部" | Status>("全部");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [buildingView, setBuildingView] = useState<string | null>(null);

  /* 持久化：任何增删改都会写回 localStorage，重开页面数据还在 */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  /* 统计（由 records 派生，增删后自动同步） */
  const stats = useMemo(() => {
    const damageCount = records.reduce((n, r) => n + r.damages.length, 0);
    const jointKinds = new Set(records.map((r) => r.jointType)).size;
    const pending = records.filter((r) => r.status === "待修缮").length;
    return { total: records.length, damageCount, jointKinds, pending };
  }, [records]);

  const buildings = useMemo(
    () => Array.from(new Set(records.map((r) => r.building))).sort(),
    [records]
  );

  const jointTypes = useMemo(
    () => Array.from(new Set(records.map((r) => r.jointType))),
    [records]
  );

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (jointFilter === "全部" || r.jointType === jointFilter) &&
          (statusFilter === "全部" || r.status === statusFilter)
      ),
    [records, jointFilter, statusFilter]
  );

  const detail = records.find((r) => r.id === detailId) ?? null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2600);
  };

  /* 保存：新增或覆盖原记录 */
  const save = () => {
    const errs: { building?: string; code?: string } = {};
    if (!draft.building.trim()) errs.building = "请补全建筑名称";
    if (!draft.code.trim()) errs.code = "请补全构件编号";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      flash("建筑名称或构件编号缺失，请补全后再保存");
      return;
    }
    const payload = {
      ...draft,
      building: draft.building.trim(),
      code: draft.code.trim(),
      updatedAt: Date.now(),
    };
    if (editingId) {
      setRecords((rs) => rs.map((r) => (r.id === editingId ? { ...payload, id: editingId } : r)));
      flash(`已覆盖原记录「${payload.code}」`);
    } else {
      setRecords((rs) => [{ ...payload, id: uid() }, ...rs]);
      flash(`已录入构件「${payload.code}」`);
    }
    setDraft(emptyDraft());
    setEditingId(null);
    setErrors({});
  };

  const startEdit = (r: ComponentRecord) => {
    setEditingId(r.id);
    setDraft({
      building: r.building,
      code: r.code,
      wood: r.wood,
      jointType: r.jointType,
      width: r.width,
      height: r.height,
      deformation: r.deformation,
      repair: r.repair,
      status: r.status,
      damages: r.damages,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setErrors({});
  };

  const remove = (r: ComponentRecord) => {
    if (!window.confirm(`确认移除构件「${r.code}」（${r.building}）？统计将同步更新。`)) return;
    setRecords((rs) => rs.filter((x) => x.id !== r.id));
    if (detailId === r.id) setDetailId(null);
    if (editingId === r.id) cancelEdit();
    flash(`已移除「${r.code}」，统计已同步`);
  };

  const exportCsv = () => {
    const head = "建筑名称,构件编号,木材种类,榫卯类型,截面宽mm,截面高mm,病害点数,变形情况,修缮建议,状态";
    const rows = records.map((r) =>
      [r.building, r.code, r.wood, r.jointType, r.width, r.height, r.damages.length, r.deformation, r.repair, r.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [head, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "古建构件测绘台账.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="app">
      <section className="hero">
        <p>古建测绘队 · 木结构台账</p>
        <h1>木结构榫卯构件测绘台账</h1>
        <span>
          录入建筑、构件编号、木材、榫卯类型、截面尺寸、病害与修缮建议；保存后进入清单，
          可按榫卯类型与待修缮状态筛选，点开构件查看尺寸记录与病害标记图，并按单栋建筑查看构件关系。
        </span>
      </section>

      {notice && <div className="notice">{notice}</div>}

      <section className="metrics">
        <article><small>构件数量</small><strong>{stats.total}</strong></article>
        <article><small>病害点</small><strong>{stats.damageCount}</strong></article>
        <article><small>榫卯类型</small><strong>{stats.jointKinds}</strong></article>
        <article className="warn"><small>待修缮</small><strong>{stats.pending}</strong></article>
      </section>

      <div className="layout">
        {/* ---------- 录入 / 编辑表单 ---------- */}
        <section className="panel form-panel">
          <div className="heading">
            <div>
              <p>{editingId ? "编辑模式 · 保存将覆盖原记录" : "新构件登记"}</p>
              <h2>{editingId ? `编辑「${draft.code || "原记录"}」` : "录入构件"}</h2>
            </div>
            {editingId && <button onClick={cancelEdit}>取消编辑</button>}
          </div>

          <div className="field-grid">
            <label className={errors.building ? "invalid" : ""}>
              <span>建筑名称 *</span>
              <input
                list="building-list"
                placeholder="如：大成殿"
                value={draft.building}
                onChange={(e) => set("building", e.target.value)}
              />
              <datalist id="building-list">
                {buildings.map((b) => <option key={b} value={b} />)}
              </datalist>
              {errors.building && <em>{errors.building}</em>}
            </label>
            <label className={errors.code ? "invalid" : ""}>
              <span>构件编号 *</span>
              <input
                placeholder="如：梁架A-03"
                value={draft.code}
                onChange={(e) => set("code", e.target.value)}
              />
              {errors.code && <em>{errors.code}</em>}
            </label>
            <label>
              <span>木材种类</span>
              <select value={draft.wood} onChange={(e) => set("wood", e.target.value)}>
                {WOODS.map((w) => <option key={w}>{w}</option>)}
              </select>
            </label>
            <label>
              <span>榫卯类型</span>
              <select value={draft.jointType} onChange={(e) => set("jointType", e.target.value)}>
                {JOINTS.map((j) => <option key={j}>{j}</option>)}
              </select>
            </label>
            <label>
              <span>截面宽 (mm)</span>
              <input type="number" min="0" placeholder="如：180" value={draft.width} onChange={(e) => set("width", e.target.value)} />
            </label>
            <label>
              <span>截面高 (mm)</span>
              <input type="number" min="0" placeholder="如：240" value={draft.height} onChange={(e) => set("height", e.target.value)} />
            </label>
            <label>
              <span>变形情况</span>
              <input placeholder="如：跨中下垂约12mm" value={draft.deformation} onChange={(e) => set("deformation", e.target.value)} />
            </label>
            <label>
              <span>修缮建议</span>
              <select value={draft.repair} onChange={(e) => set("repair", e.target.value)}>
                {REPAIRS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label>
              <span>修缮状态</span>
              <select value={draft.status} onChange={(e) => set("status", e.target.value as Status)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <span>当前标注病害类型</span>
              <select value={disease} onChange={(e) => setDisease(e.target.value)}>
                {DISEASES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
          </div>

          <div className="map-block">
            <span className="map-title">病害位置标注（在图面点击打点，再点红点可移除）</span>
            <DamageMap
              damages={draft.damages}
              disease={disease}
              editable
              onAdd={(p) => set("damages", [...draft.damages, p])}
              onRemove={(id) => set("damages", draft.damages.filter((d) => d.id !== id))}
            />
          </div>

          <div className="form-actions">
            <button className="primary" onClick={save}>
              {editingId ? "保存（覆盖原记录）" : "保存记录"}
            </button>
            {!editingId && <button onClick={() => setDraft(emptyDraft())}>清空表单</button>}
          </div>
        </section>

        {/* ---------- 清单与筛选 ---------- */}
        <section className="panel">
          <div className="heading">
            <div>
              <p>构件清单 · {filtered.length}/{records.length} 条</p>
              <h2>台账清单</h2>
            </div>
            <button onClick={exportCsv}>导出CSV</button>
          </div>

          <div className="filters">
            <div className="chips">
              <button className={jointFilter === "全部" ? "active" : ""} onClick={() => setJointFilter("全部")}>全部榫卯</button>
              {jointTypes.map((j) => (
                <button key={j} className={jointFilter === j ? "active" : ""} onClick={() => setJointFilter(j)}>{j}</button>
              ))}
            </div>
            <div className="chips">
              {(["全部", ...STATUSES] as const).map((s) => (
                <button key={s} className={statusFilter === s ? "active accent" : ""} onClick={() => setStatusFilter(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="records">
            {filtered.length === 0 && <p className="empty">当前筛选条件下暂无构件记录。</p>}
            {filtered.map((r) => (
              <article key={r.id} className={r.status === "待修缮" ? "pending" : ""}>
                <button className="record-main" onClick={() => setDetailId(r.id)}>
                  <h3>{r.code} <small>{r.building}</small></h3>
                  <p>
                    {r.wood} · {r.jointType} · 截面{r.width || "?"}×{r.height || "?"}mm · 病害{r.damages.length}处 · {r.repair}
                  </p>
                </button>
                <span className={`badge s-${r.status}`}>{r.status}</span>
                <div className="row-actions">
                  <button onClick={() => startEdit(r)}>编辑</button>
                  <button className="danger" onClick={() => remove(r)}>移除</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- 单栋建筑构件关系 ---------- */}
      <section className="panel">
        <div className="heading">
          <div>
            <p>按栋查看</p>
            <h2>单栋建筑构件关系</h2>
          </div>
        </div>
        <div className="chips">
          {buildings.length === 0 && <span className="empty">暂无建筑，请先录入构件。</span>}
          {buildings.map((b) => (
            <button key={b} className={buildingView === b ? "active" : ""} onClick={() => setBuildingView(buildingView === b ? null : b)}>
              {b}（{records.filter((r) => r.building === b).length}）
            </button>
          ))}
        </div>
        {buildingView && <BuildingGraph building={buildingView} records={records.filter((r) => r.building === buildingView)} onOpen={setDetailId} />}
      </section>

      {/* ---------- 构件详情 ---------- */}
      {detail && (
        <div className="overlay" onClick={() => setDetailId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="heading">
              <div>
                <p>{detail.building}</p>
                <h2>{detail.code}</h2>
              </div>
              <button onClick={() => setDetailId(null)}>关闭</button>
            </div>

            <h3 className="sub">尺寸记录</h3>
            <table className="dim-table">
              <tbody>
                <tr><th>木材种类</th><td>{detail.wood}</td><th>榫卯类型</th><td>{detail.jointType}</td></tr>
                <tr><th>截面宽</th><td>{detail.width || "—"} mm</td><th>截面高</th><td>{detail.height || "—"} mm</td></tr>
                <tr>
                  <th>截面积</th>
                  <td>{detail.width && detail.height ? `${((Number(detail.width) * Number(detail.height)) / 100).toFixed(1)} cm²` : "—"}</td>
                  <th>最近更新</th>
                  <td>{new Date(detail.updatedAt).toLocaleString("zh-CN")}</td>
                </tr>
                <tr><th>变形情况</th><td colSpan={3}>{detail.deformation || "无明显变形"}</td></tr>
                <tr><th>修缮建议</th><td>{detail.repair}</td><th>状态</th><td>{detail.status}</td></tr>
              </tbody>
            </table>

            <h3 className="sub">病害标记图（{detail.damages.length} 处）</h3>
            <DamageMap damages={detail.damages} disease={disease} editable={false} />

            <div className="form-actions">
              <button className="primary" onClick={() => { setDetailId(null); startEdit(detail); }}>编辑此构件</button>
              <button className="danger" onClick={() => remove(detail)}>移除此记录</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- 单栋建筑构件关系图 ---------- */

function BuildingGraph({
  building,
  records,
  onOpen,
}: {
  building: string;
  records: ComponentRecord[];
  onOpen: (id: string) => void;
}) {
  const W = 1000;
  const top = 60;
  const rowH = 120;
  const cols = Math.min(records.length, 4);
  const rows = Math.ceil(records.length / cols);
  const H = top + rows * rowH + 30;
  const bx = W / 2;

  const pos = records.map((_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, records.length - row * cols);
    const col = i % cols;
    const span = W / (inRow + 1);
    return { x: span * (col + 1), y: top + row * rowH + 60 };
  });

  return (
    <div className="graph-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="graph">
        <rect x={bx - 110} y={20} width={220} height={48} rx={8} fill="#854d0e" />
        <text x={bx} y={50} textAnchor="middle" fill="#fff" fontWeight={700} fontSize={17}>{building}</text>
        {records.map((r, i) => (
          <g key={r.id}>
            <line x1={bx} y1={68} x2={pos[i].x} y2={pos[i].y - 26} stroke="#94a3b8" strokeWidth={1.5} />
            <text
              x={(bx + pos[i].x) / 2}
              y={(68 + pos[i].y - 26) / 2 - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#0f766e"
            >
              {r.jointType}
            </text>
            <g onClick={() => onOpen(r.id)} style={{ cursor: "pointer" }}>
              <rect
                x={pos[i].x - 90}
                y={pos[i].y - 26}
                width={180}
                height={56}
                rx={8}
                fill={r.status === "待修缮" ? "#fef2f2" : r.status === "观察中" ? "#fffbeb" : "#f0fdf4"}
                stroke={r.status === "待修缮" ? "#dc2626" : r.status === "观察中" ? "#d97706" : "#16a34a"}
                strokeWidth={1.5}
              />
              <text x={pos[i].x} y={pos[i].y - 4} textAnchor="middle" fontSize={14} fontWeight={700} fill="#172033">
                {r.code}
              </text>
              <text x={pos[i].x} y={pos[i].y + 16} textAnchor="middle" fontSize={11} fill="#526071">
                {r.wood} · {r.status} · 病害{r.damages.length}
              </text>
            </g>
          </g>
        ))}
      </svg>
      <p className="dim">连线标注为该构件的榫卯类型；节点颜色对应修缮状态（红=待修缮，黄=观察中，绿=已修缮），点击节点查看详情。</p>
    </div>
  );
}

export default App;
