import React, { useState, useMemo, useEffect } from "react";

// ---------- utilidades de fecha (UTC para evitar desfases) ----------
const DAY = 86400000;
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const toISO = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; };
const addDays = (ms, n) => ms + n * DAY;
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fmt = (ms) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`; };

const PALETTE = ["#4F46E5", "#0D9488", "#D97706", "#DB2777", "#059669", "#7C3AED", "#DC2626", "#0891B2", "#CA8A04", "#2563EB"];

const ROW_H = 46;

export default function Gantt({ project, onUpdate }) {
    const { start, team, tasks, title } = project;
    const [px, setPx] = useState(3.2);
    const [drag, setDrag] = useState(null);
    const [newRole, setNewRole] = useState("");

    const updateProject = (patch) => {
        onUpdate({ ...project, ...patch });
    };

    const projStart = parseISO(start);

    const colorOf = (whoId) => { const i = team.findIndex((m) => m.id === whoId); return i < 0 ? "#9A97A3" : PALETTE[i % PALETTE.length]; };
    const nameOf = (whoId) => { 
        const m = team.find((x) => x.id === whoId); 
        if (!m) return "Sin asignar";
        return m.personName ? `${m.role} (${m.personName})` : m.role; 
    };

    const schedule = useMemo(() => {
        const out = []; let prevEnd = 0;
        tasks.forEach((t, i) => {
            const s = (t.linked && i > 0) ? prevEnd : Math.max(0, t.off || 0);
            const e = s + t.dur; out.push({ s, e }); prevEnd = e;
        });
        return out;
    }, [tasks]);

    const maxEnd = Math.max(1, ...schedule.map((s) => s.e));
    const totalDays = maxEnd + 8;
    const W = totalDays * px;
    const projEnd = addDays(projStart, maxEnd);
    const todayOff = Math.round((Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) - projStart) / DAY);

    const updTask = (id, patch) => updateProject({ tasks: tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
    const delTask = (id) => updateProject({ tasks: tasks.length > 1 ? tasks.filter((t) => t.id !== id) : tasks });
    const addTask = () => updateProject({ tasks: [...tasks, { id: Date.now(), name: `Tarea ${tasks.length + 1}`, short: "Nueva tarea", desc: "", who: team[0]?.id, dur: 10, linked: true, off: 0, prog: 0 }] });
    const toggleLink = (id, i) => { if (tasks[i].linked) updTask(id, { linked: false, off: schedule[i].s }); else updTask(id, { linked: true }); };

    // ---- gestión del equipo ----
    const addMember = () => {
        const r = newRole.trim(); if (!r) return;
        updateProject({ team: [...team, { id: "r" + Date.now(), role: r, personName: "" }] }); 
        setNewRole("");
    };
    const renameRole = (id, role) => updateProject({ team: team.map((m) => (m.id === id ? { ...m, role } : m)) });
    const renamePerson = (id, personName) => updateProject({ team: team.map((m) => (m.id === id ? { ...m, personName } : m)) });
    
    const removeMember = (id) => {
        if (team.length <= 1) return;
        const fallback = team.find((m) => m.id !== id).id;
        updateProject({ 
            team: team.filter((m) => m.id !== id),
            tasks: tasks.map((t) => (t.who === id ? { ...t, who: fallback } : t))
        });
    };

    const onDown = (e, i, mode) => {
        e.preventDefault(); e.stopPropagation();
        setDrag({ id: tasks[i].id, mode, x0: e.clientX, off0: schedule[i].s, dur0: tasks[i].dur });
    };
    useEffect(() => {
        if (!drag) return;
        const move = (e) => {
            const dd = Math.round((e.clientX - drag.x0) / px);
            if (drag.mode === "move") updTask(drag.id, { linked: false, off: Math.max(0, drag.off0 + dd) });
            else updTask(drag.id, { dur: Math.max(1, drag.dur0 + dd) });
        };
        const up = () => setDrag(null);
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
        return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    }, [drag, px, tasks, schedule]); // eslint-disable-line

    const months = useMemo(() => {
        const cols = []; const d0 = new Date(projStart);
        let cur = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), 1);
        while ((cur - projStart) / DAY < totalDays) {
            const c = new Date(cur);
            const next = Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1);
            cols.push({ left: ((cur - projStart) / DAY) * px, w: ((next - cur) / DAY) * px, label: `${MES[c.getUTCMonth()]} ${String(c.getUTCFullYear()).slice(2)}` });
            cur = next;
        }
        return cols;
    }, [projStart, totalDays, px]);

    return (
        <div className="gz">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        .gz{font-family:Inter,system-ui,sans-serif;color:#22222C;background:#FBFAF9;border:1px solid #E7E5DF;border-radius:14px;overflow:hidden;max-width:100%}
        .gz *{box-sizing:border-box}
        .num{font-family:'Space Grotesk',sans-serif;font-variant-numeric:tabular-nums}
        .hd{background:#1E1B4B;color:#fff;padding:16px 20px;display:flex;flex-wrap:wrap;gap:18px;align-items:center}
        .hd h1{font-family:'Space Grotesk';font-size:17px;margin:0;font-weight:600}
        .hd .sub{font-size:12px;color:#A5A1D4;margin-top:2px}
        .stat{display:flex;flex-direction:column;line-height:1.1}
        .stat b{font-family:'Space Grotesk';font-size:15px}
        .stat span{font-size:10.5px;color:#A5A1D4;text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px}
        .ctl{margin-left:auto;display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}
        .ctl label{font-size:11px;color:#C7C4EC;display:flex;flex-direction:column;gap:3px}
        .ctl input[type=date], .ctl input[type=text]{font-family:'Space Grotesk';border:none;border-radius:7px;padding:5px 8px;font-size:13px; color: #222}
        .zoom{display:flex;gap:4px}
        .zoom button{width:26px;height:26px;border:none;border-radius:6px;background:#3A3580;color:#fff;font-size:15px;cursor:pointer;font-family:'Space Grotesk'}
        .zoom button:hover{background:#4F46E5}

        .team{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 20px;background:#fff;border-bottom:1px solid #E7E5DF}
        .team b{font-family:'Space Grotesk';font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;color:#8A8794}
        .member{display:flex;align-items:center;gap:6px;background:#F6F5F2;border:1px solid #E7E5DF;border-radius:20px;padding:3px 4px 3px 10px}
        .member .dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto}
        .member input{border:none;background:transparent;font-size:12.5px;font-family:inherit;width:auto;min-width:60px;max-width:170px;padding:2px 0}
        .member input:focus{outline:none;border-bottom:1px solid #4F46E5}
        .member .x{border:none;background:transparent;cursor:pointer;color:#B6B2BD;font-size:15px;line-height:1;padding:0 4px}
        .member .x:hover{color:#DC2626}
        .addmem{display:flex;align-items:center;gap:6px}
        .addmem input{border:1px solid #D8D5E0;border-radius:20px;padding:5px 12px;font-size:12.5px;font-family:inherit;width:160px}
        .addmem input:focus{outline:none;border-color:#4F46E5}
        .addmem button{border:none;background:#4F46E5;color:#fff;border-radius:20px;padding:6px 13px;font-size:12.5px;cursor:pointer;font-weight:600}
        .addmem button:hover{background:#3A33C8}

        .body{display:flex;overflow-x:auto}
        .left{flex:0 0 auto;min-width:440px;border-right:1px solid #E7E5DF;background:#fff}
        .colhd,.row{display:grid;grid-template-columns:150px 140px 52px 1fr;align-items:center}
        .colhd{height:38px;font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;color:#8A8794;border-bottom:1px solid #E7E5DF;background:#F6F5F2}
        .colhd>div,.row>div{padding:0 10px;overflow:hidden}
        .row{height:${ROW_H}px;border-bottom:1px solid #F0EEE9}
        .row:hover{background:#FAF9FF}
        .tname{font-weight:600;font-size:13px;white-space:nowrap;text-overflow:ellipsis}
        .tname small{display:block;font-weight:400;color:#9A97A3;font-size:10.5px}
        .who-sel{width:100%;border:1px solid transparent;background:transparent;font-size:12px;font-family:inherit;padding:4px 5px;border-radius:6px;cursor:pointer}
        .who-sel:hover{border-color:#E7E5DF}
        .who-sel:focus{outline:none;border-color:#4F46E5;background:#fff}
        .dur-in,.dt-in{width:100%;border:1px solid transparent;background:transparent;font-size:12px;font-family:'Space Grotesk';padding:3px 5px;border-radius:6px}
        .dur-in:hover,.dt-in:hover{border-color:#E7E5DF}
        .dur-in:focus,.dt-in:focus{outline:none;border-color:#4F46E5;background:#fff}
        .chip{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle}
        .linkcell{display:flex;align-items:center;gap:7px}
        .lk{border:1px solid #DDD;background:#fff;border-radius:6px;width:24px;height:24px;cursor:pointer;font-size:12px;line-height:1;flex:0 0 auto}
        .lk.on{background:#EEF;border-color:#4F46E5;color:#4F46E5}
        .del{margin-left:auto;border:none;background:transparent;color:#C7C3CC;cursor:pointer;font-size:15px}
        .del:hover{color:#DC2626}
        .chart{position:relative;flex:0 0 auto}
        .ghd{position:relative;height:38px;border-bottom:1px solid #E7E5DF;background:#F6F5F2}
        .mcol{position:absolute;top:0;height:38px;border-left:1px solid #E7E5DF;font-size:10.5px;color:#8A8794;padding:11px 0 0 6px;font-family:'Space Grotesk';white-space:nowrap}
        .grid{position:absolute;top:0;bottom:0;border-left:1px solid #F0EEE9}
        .grow{position:relative;height:${ROW_H}px;border-bottom:1px solid #F0EEE9}
        .bar{position:absolute;top:9px;height:26px;border-radius:6px;cursor:grab;display:flex;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,.12);user-select:none}
        .bar:active{cursor:grabbing}
        .barfill{position:absolute;left:0;top:0;bottom:0;border-radius:6px 0 0 6px;background:rgba(0,0,0,.22)}
        .barlbl{position:relative;font-size:11px;color:#fff;font-weight:600;padding:0 9px;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.25);pointer-events:none}
        .hnd{position:absolute;right:0;top:0;bottom:0;width:9px;cursor:ew-resize;border-radius:0 6px 6px 0}
        .today{position:absolute;top:0;bottom:0;width:0;border-left:2px dashed #D97706;z-index:5;pointer-events:none}
        .today span{position:absolute;top:-1px;left:3px;font-size:9px;color:#D97706;font-family:'Space Grotesk';background:#FBFAF9;padding:0 2px}
        .addbtn{margin:10px;border:1px dashed #C9C5D6;background:#fff;color:#4F46E5;border-radius:8px;padding:7px 12px;font-size:12.5px;cursor:pointer;font-weight:600}
        .addbtn:hover{background:#EEF;border-color:#4F46E5}
        .foot{padding:9px 20px;border-top:1px solid #E7E5DF;background:#fff;font-size:11px;color:#9A97A3;text-align:right}
      `}</style>

            <div className="hd">
                <div>
                    <h1>Cronograma · <input type="text" value={title} onChange={(e) => updateProject({ title: e.target.value })} style={{background: 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid #A5A1D4', fontSize: '17px', fontFamily: 'inherit', fontWeight: 'bold'}} /></h1>
                    <div className="sub">{tasks.length} productos · plazos desde la firma</div>
                </div>
                <div className="stat"><span>Firma</span><b className="num">{fmt(projStart)}</b></div>
                <div className="stat"><span>Entrega final</span><b className="num">{fmt(projEnd)}</b></div>
                <div className="stat"><span>Duración</span><b className="num">{maxEnd} d · {(maxEnd / 30).toFixed(1)} m</b></div>
                <div className="ctl">
                    <label>Fecha de firma<input type="date" value={start} onChange={(e) => updateProject({ start: e.target.value })} /></label>
                    <div className="zoom">
                        <button onClick={() => setPx((p) => Math.max(1, +(p - 0.8).toFixed(1)))}>−</button>
                        <button onClick={() => setPx((p) => Math.min(14, +(p + 0.8).toFixed(1)))}>+</button>
                    </div>
                </div>
            </div>

            {/* ---- roster del equipo ---- */}
            <div className="team">
                <b>Roles y Equipo</b>
                {team.map((m, i) => (
                    <div className="member" key={m.id}>
                        <span className="dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <input value={m.role} onChange={(e) => renameRole(m.id, e.target.value)}
                            style={{ width: Math.max(80, m.role.length * 7.5), fontWeight: '600' }} />
                        <span style={{ color: '#D8D5E0', margin: '0 2px' }}>|</span>
                        <input placeholder="Nombre persona..." value={m.personName || ""} onChange={(e) => renamePerson(m.id, e.target.value)}
                            style={{ width: Math.max(110, (m.personName?.length || 10) * 7.5) }} />
                        <button className="x" title="Quitar" onClick={() => removeMember(m.id)}>×</button>
                    </div>
                ))}
                <div className="addmem">
                    <input placeholder="Nuevo rol..." value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addMember()} />
                    <button onClick={addMember}>＋ Agregar</button>
                </div>
            </div>

            <div className="body">
                <div className="left">
                    <div className="colhd"><div>Producto</div><div>Responsable</div><div>Días</div><div>Inicio / dep.</div></div>
                    {tasks.map((t, i) => (
                        <div className="row" key={t.id}>
                            <div className="tname" title={t.desc}>
                                <span className="chip" style={{ background: colorOf(t.who) }} />
                                <input type="text" value={t.name} onChange={e => updTask(t.id, {name: e.target.value})} style={{background: 'transparent', border: 'none', borderBottom: '1px solid transparent', fontFamily: 'inherit', fontWeight: 'bold', width: '80%'}} />
                                <small><input type="text" value={t.short} onChange={e => updTask(t.id, {short: e.target.value})} style={{background: 'transparent', border: 'none', fontFamily: 'inherit', color: 'inherit', width: '100%', fontSize: '10.5px'}} /></small>
                            </div>
                            <div>
                                <select className="who-sel" value={t.who} onChange={(e) => updTask(t.id, { who: e.target.value })}>
                                    {team.map((m) => (<option key={m.id} value={m.id}>{m.role} {m.personName ? `(${m.personName})` : ''}</option>))}
                                </select>
                            </div>
                            <div><input className="dur-in" type="number" min="1" value={t.dur} onChange={(e) => updTask(t.id, { dur: Math.max(1, +e.target.value || 1) })} /></div>
                            <div className="linkcell">
                                <button className={"lk" + (t.linked ? " on" : "")} title={t.linked ? "Encadenada a la anterior" : "Inicio independiente"} onClick={() => toggleLink(t.id, i)}>{t.linked ? "🔗" : "⛓️‍💥"}</button>
                                {t.linked
                                    ? <span style={{ fontSize: 11, color: "#9A97A3" }} className="num">{fmt(addDays(projStart, schedule[i].s))}</span>
                                    : <input className="dt-in" type="date" value={toISO(addDays(projStart, schedule[i].s))} onChange={(e) => updTask(t.id, { linked: false, off: Math.max(0, Math.round((parseISO(e.target.value) - projStart) / DAY)) })} />}
                                <button className="del" title="Eliminar tarea" onClick={() => delTask(t.id)}>×</button>
                            </div>
                        </div>
                    ))}
                    <button className="addbtn" onClick={addTask}>＋ Agregar tarea</button>
                </div>

                <div className="chart" style={{ width: W }}>
                    <div className="ghd">
                        {months.map((m, k) => (<div key={k} className="mcol" style={{ left: m.left, width: m.w }}>{m.label}</div>))}
                    </div>
                    {months.map((m, k) => (<div key={"g" + k} className="grid" style={{ left: m.left, top: 38 }} />))}
                    {todayOff >= 0 && todayOff <= totalDays && (<div className="today" style={{ left: todayOff * px, top: 38 }}><span>hoy</span></div>)}
                    {tasks.map((t, i) => {
                        const sc = schedule[i];
                        return (
                            <div className="grow" key={t.id}>
                                <div className="bar" style={{ left: sc.s * px, width: t.dur * px, background: colorOf(t.who) }}
                                    onPointerDown={(e) => onDown(e, i, "move")}
                                    title={`${t.name} — ${nameOf(t.who)}\n${fmt(addDays(projStart, sc.s))} → ${fmt(addDays(projStart, sc.e))}\nPlazo acumulado: día ${sc.e}`}>
                                    {t.prog > 0 && <div className="barfill" style={{ width: `${Math.min(100, t.prog)}%` }} />}
                                    <span className="barlbl">{t.name} · {nameOf(t.who)} · {t.dur}d</span>
                                    <div className="hnd" onPointerDown={(e) => onDown(e, i, "resize")} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="foot">Arrastra una barra para mover · borde derecho para cambiar duración · 🔗 encadena tareas · edita o agrega responsables en «Equipo»</div>
        </div>
    );
}
