"use client";
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

const nav = [
  ["⌂", "Inici"],
  ["◫", "Preinscripcions"],
  ["▣", "Matrícules"],
  ["◷", "Reserves"],
  ["◎", "Places i vacants"],
  ["◌", "Llistes d’espera"],
  ["♙", "Famílies"],
  ["□", "Documents"],
  ["↗", "Comunicacions"],
];
const money = (value: any) =>
  `${Number(value || 0)
    .toFixed(2)
    .replace(".", ",")} €`;
const initials = (value = "") =>
  value
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const months = [
  "2026-09",
  "2026-10",
  "2026-11",
  "2026-12",
  "2027-01",
  "2027-02",
  "2027-03",
  "2027-04",
  "2027-05",
  "2027-06",
];
const dueDate = (month: string) => {
  const date = new Date(`${month}-01T12:00:00`);
  date.setDate(0);
  while (date.getDay() !== 2) date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("ca-ES", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T12:00:00`),
  );
const autoTotal = (record: any) =>
  Math.max(
    0,
    Number(record.base_amount || 0) -
      Number(record.member_discount_amount || 0) -
      Number(record.sibling_discount_amount || 0),
  ) + Number(record.complements_amount || 0);

export default function Gestio() {
  const [secret, setSecret] = useState("");
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  const [view, setView] = useState("Preinscripcions");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tots");
  const [selected, setSelected] = useState<any>();
  const [saving, setSaving] = useState(false);
  const [commActivity, setCommActivity] = useState("Totes");
  const [commStatus, setCommStatus] = useState("Tots");
  const [commCourse, setCommCourse] = useState("Tots");
  const [commSubject, setCommSubject] = useState("Recordatori de pagament");
  const [commMessage, setCommMessage] = useState("Us recordem que {{activitat}} té una quota pendent de {{import}} € abans del {{data_limit_pagament}}.");
  const commTargets = useMemo(() => {
    const filtered = (data?.registrations || []).filter((record: any) =>
      (commActivity === "Totes" || record.activity_name === commActivity) &&
      (commStatus === "Tots" || record.status === commStatus) &&
      (commCourse === "Tots" || record.course === commCourse),
    );
    return Array.from(new Map(filtered.map((record: any) => [record.representative_name, record])).values());
  }, [data, commActivity, commStatus, commCourse]);
  function communicationPreview(){
    const record:any=commTargets[0];
    if(!record)return "No hi ha famílies amb aquests filtres.";
    return commMessage.replaceAll("{{nom_alumne}}",record.student_name).replaceAll("{{nom_familia}}",record.representative_name).replaceAll("{{activitat}}",record.activity_name).replaceAll("{{curs}}",record.course||"—").replaceAll("{{import}}",money(record.total_amount)).replaceAll("{{data}}",new Date().toLocaleDateString("ca-ES")).replaceAll("{{data_limit_pagament}}","l’últim dimarts del mes anterior");
  }
  async function load() {
    setError("");
    const response = await fetch("/api/admin/dashboard", {
      headers: { "x-activat-admin-secret": secret },
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "No autoritzat");
      return;
    }
    setData(json);
  }
  function open(record: any) {
    setSelected({
      ...record,
      fees: record.fees || [],
      authorized_people: record.authorized_people || [],
      emergency_contacts: record.emergency_contacts || [],
      special_tariff_enabled: Boolean(record.special_tariff_enabled),
    });
  }
  function setField(key: string, value: any) {
    setSelected((current: any) => ({ ...current, [key]: value }));
  }
  function setFee(index: number, key: string, value: any) {
    setSelected((current: any) => ({
      ...current,
      fees: current.fees.map((fee: any, i: number) =>
        i === index ? { ...fee, [key]: value } : fee,
      ),
    }));
  }
  function generateFees() {
    setSelected((current: any) => {
      const startMonth =
        current.start_month ||
        months[
          Math.min(
            months.length - 1,
            Math.max(0, months.indexOf(new Date().toISOString().slice(0, 7))),
          )
        ] ||
        months[0];
      const total = current.special_tariff_enabled
        ? Number(current.special_tariff_amount || 0)
        : autoTotal(current);
      const paid = Number(current.paid_amount || 0);
      const fees = months
        .filter((month) => month >= startMonth)
        .map((month) => {
          const old = current.fees.find(
            (fee: any) => String(fee.month).slice(0, 7) === month,
          );
          if (old) return old;
          const isFirst = month === startMonth;
          return {
            month: `${month}-01`,
            amount: total,
            discount: 0,
            total,
            due_date: dueDate(month),
            status: isFirst && paid >= total ? "pagada" : "pendent",
            paid_at:
              isFirst && paid >= total
                ? current.payment_date || new Date().toISOString()
                : null,
          };
        });
      return { ...current, fees };
    });
  }
  async function save(markPaid = false) {
    if (!selected) return;
    const activity = (data?.activities || []).find(
      (item: any) =>
        item.id === selected.activity_id ||
        item.name === selected.activity_name,
    );
    const capacity = Number(activity?.capacity_override ?? activity?.capacity ?? 0);
    const occupied = (data?.registrations || []).filter(
      (record: any) =>
        record.id !== selected.id &&
        record.activity_id === selected.activity_id &&
        ["admesa", "matriculada"].includes(String(record.status || "").toLowerCase()),
    ).length;
    const targetStatus = String(selected.status || "").trim().toLowerCase();
    if (capacity > 0 && ["admesa", "matriculada"].includes(targetStatus) && occupied >= capacity) {
      setError("No hi ha places disponibles per a aquesta activitat. Posaria l’expedient a llista d’espera o revisa la capacitat.");
      return;
    }

    setSaving(true);
    const payload = { ...selected, mark_paid: markPaid, fees: selected.fees };
    const response = await fetch(`/api/admin/registrations/${selected.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-activat-admin-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(json.error || "No s’ha pogut desar");
      return;
    }
    setData((current: any) => ({
      ...current,
      registrations: current.registrations.map((item: any) =>
        item.id === json.id ? json : item,
      ),
    }));
    setSelected({ ...json, fees: json.fees || selected.fees });
  }
  async function placementAction(record: any, action: "assign_place" | "matriculate" | "waitlist") {
    setError("");
    const response = await fetch(`/api/admin/registrations/${record.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-activat-admin-secret": secret,
      },
      body: JSON.stringify({ action }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "No s’ha pogut actualitzar la plaça.");
      return;
    }
    setData((current: any) => ({
      ...current,
      registrations: current.registrations.map((item: any) =>
        item.id === json.id ? { ...item, ...json } : item,
      ),
    }));
    if (selected?.id === record.id) {
      setSelected({ ...json, fees: json.fees || selected.fees || [] });
    }
  }
  function downloadList(format: "csv" | "pdf") {
    const title = view === "Llistes d’espera" ? "Llista d’espera" : view === "Matrícules" ? "Matrícules" : "Places i vacants";
    if (format === "csv") {
      const header = ["Posició", "Codi", "Alumne/a", "Activitat", "Família", "Estat", "Plaça"];
      const lines = rows.map((record: any, index: number) => [index + 1, record.code, record.student_name, record.activity_name, record.representative_name, record.status, record.place || ""]).map((line: any[]) => line.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","));
      const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${title.toLowerCase().replaceAll(" ", "-")}.csv`; link.click(); URL.revokeObjectURL(url);
      return;
    }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(`ACTIVA’T · ${title}`, 16, 20);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(`Generat el ${new Date().toLocaleDateString("ca-ES")}`, 16, 27);
    let y = 38;
    rows.forEach((record: any, index: number) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.text(`${index + 1}. ${record.student_name || "—"}`, 16, y);
      doc.setFont("helvetica", "normal"); doc.text(`${record.code} · ${record.activity_name} · ${record.status}${record.place ? ` · plaça ${record.place}` : ""}`, 22, y + 5);
      y += 13;
    });
    doc.save(`${title.toLowerCase().replaceAll(" ", "-")}.pdf`);
  }
  const rows = useMemo(() => {
    const all = data?.registrations || [];
    return all
      .filter((record: any) => {
        const text =
          `${record.code} ${record.student_name} ${record.activity_name} ${record.representative_name}`.toLowerCase();
        const section =
          view === "Matrícules"
            ? ["admesa", "matriculada"].includes(record.status)
            : view === "Llistes d’espera"
              ? record.status === "llista d’espera"
                : view === "Places i vacants"
                  ? !["admesa", "matriculada", "eliminada"].includes(String(record.status || "").toLowerCase())
              : true;
        return (
          section &&
          text.includes(query.toLowerCase()) &&
          (status === "Tots" || record.status === status)
        );
      })
      .sort((a: any, b: any) =>
        String(a.payment_date || "9999").localeCompare(
          String(b.payment_date || "9999"),
        ),
      );
  }, [data, view, query, status]);
  const families = useMemo(
    () =>
      Array.from(
        new Map(
          (data?.registrations || []).map((record: any) => [
            record.representative_name,
            record,
          ]),
        ).values(),
      ),
    [data],
  );
  const activityStats = useMemo(() => {
    const registrations = data?.registrations || [];
    return (data?.activities || []).map((activity: any) => {
      const related = registrations.filter(
        (record: any) => record.activity_name === activity.name,
      );
      const paid = related.reduce(
        (sum: number, record: any) => sum + Number(record.paid_amount || 0),
        0,
      );
      return {
        ...activity,
        total: related.length,
        paid,
        pending: related.reduce(
          (sum: number, record: any) =>
            sum +
            Math.max(
              0,
              Number(record.total_amount || 0) -
                Number(record.paid_amount || 0),
            ),
          0,
        ),
        matriculated: related.filter(
          (record: any) => record.status === "matriculada",
        ).length,
      };
    });
  }, [data]);
  function receipt(record: any) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const received = Number(record.paid_amount || 0);
    const total = Number(record.total_amount || 0);
    const change = Math.max(0, received - total);
    const today = new Date().toISOString().slice(0, 10);
    const deadline = record.start_month
      ? dueDate(record.start_month)
      : dueDate(months[0]);
    const late = record.payment_date && record.payment_date > deadline;
    doc.setTextColor(23, 19, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("AFA Escola Sant Salvador", 18, 25);
    doc.setFontSize(16);
    doc.text("REBUT DE PAGAMENT", 18, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Número: ${record.code}`, 18, 52);
    doc.text(`Data: ${record.payment_date || today}`, 18, 59);
    doc.text(`Activitat: ${record.activity_name}`, 18, 66);
    doc.line(18, 72, 192, 72);
    doc.setFontSize(11);
    doc.text(`Alumne/a: ${record.student_name}`, 18, 85);
    doc.text(`Representant: ${record.representative_name}`, 18, 93);
    doc.line(18, 100, 192, 100);
    doc.setFont("helvetica", "bold");
    doc.text(`Primera quota / import rebut: ${money(total)}`, 18, 114);
    doc.text(`Import rebut: ${money(received)}`, 18, 124);
    doc.text(`Canvi: ${money(change)}`, 18, 134);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Mitjà de pagament: ${record.payment_method || "Efectiu"}`,
      18,
      146,
    );
    doc.text(`Data límit del període: ${deadline}`, 18, 154);
    if (late) {
      doc.setTextColor(161, 33, 33);
      doc.setFont("helvetica", "bold");
      doc.text("AVÍS: pagament registrat fora de termini.", 18, 164);
    }
    doc.setTextColor(113, 107, 124);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Rebut oficial ACTIVA’T · Conserva aquest document com a justificant.",
      18,
      280,
    );
    doc.save(`rebut-${record.code}.pdf`);
  }
  if (!data)
    return (
      <main className="container">
        <div className="card loginCard">
          <div className="adminLock">⌁</div>
          <span className="eyebrow">Àrea interna</span>
          <h1 style={{ fontSize: 30, margin: "8px 0" }}>Secretaria ACTIVA’T</h1>
          <p className="muted">
            Accés reservat a l’equip autoritzat de l’AFA Escola Sant Salvador.
          </p>
          <div className="field" style={{ marginTop: 20 }}>
            <label>Clau interna</label>
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && load()}
            />
          </div>
          <button
            className="btn primary"
            style={{ width: "100%", marginTop: 12 }}
            onClick={load}
          >
            Entrar a Secretaria →
          </button>
          {error && (
            <p className="pill bad" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
        </div>
      </main>
    );
  const updateActivity = async (activity: any) => {
    const response = await fetch(`/api/admin/activities/${activity.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-activat-admin-secret": secret,
      },
      body: JSON.stringify({
        capacity_override: activity.capacity_override ?? activity.capacity,
        vacancies_open: activity.vacancies_open === false,
      }),
    });
    if (response.ok) load();
  };
  function registrationPdf(record: any) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 18;
    doc.setTextColor(23, 19, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text("AFA Escola Sant Salvador", margin, 25);
    doc.setFontSize(16);
    doc.text("FULL DE PREINSCRIPCIÓ", margin, 39);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Codi: ${record.code}`, margin, 49);
    doc.text(
      `Data: ${String(record.created_at || new Date().toISOString()).slice(0, 10)}`,
      margin,
      56,
    );
    doc.line(margin, 63, 192, 63);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dades de l’alumne/a", margin, 76);
    doc.setFont("helvetica", "normal");
    doc.text(`Nom: ${record.student_name || "—"}`, margin, 86);
    doc.text(`Data de naixement: ${record.birth_date || "—"}`, margin, 94);
    doc.text(
      `Curs / grup: ${record.course || "—"} · ${record.group_name || "—"}`,
      margin,
      102,
    );
    doc.text(`Activitat: ${record.activity_name || "—"}`, margin, 110);
    doc.setFont("helvetica", "bold");
    doc.text("Representant legal", margin, 126);
    doc.setFont("helvetica", "normal");
    doc.text(`Nom: ${record.representative_name || "—"}`, margin, 136);
    doc.text(`DNI/NIE: ${record.dni || "—"}`, margin, 144);
    doc.text(`Telèfon: ${record.phone || "—"}`, margin, 152);
    doc.text(`Correu: ${record.email || "—"}`, margin, 160);
    doc.setFont("helvetica", "bold");
    doc.text("Persones autoritzades i emergències", margin, 178);
    doc.setFont("helvetica", "normal");
    let y = 188;
    for (const [title, people] of [
      ["Recollida", record.authorized_people || []],
      ["Emergència", record.emergency_contacts || []],
    ] as any[]) {
      doc.setFont("helvetica", "bold");
      doc.text(`${title}:`, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const person of people) {
        doc.text(
          `• ${person.name || "—"} · ${person.phone || "—"} · ${person.relation || "—"}`,
          margin + 4,
          y,
        );
        y += 5;
      }
    }
    doc.setFont("helvetica", "bold");
    doc.text("Condicions", margin, y + 8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Soci/a: ${record.is_member ? "Sí" : "No"} · Ordre germà/na: ${record.child_order || 1}`,
      margin,
      y + 18,
    );
    doc.text(
      `Import estimat: ${money(record.total_amount)} · Estat: ${record.status || "—"}`,
      margin,
      y + 26,
    );
    doc.setFontSize(8);
    doc.setTextColor(113, 107, 124);
    doc.text(
      "Document generat per ACTIVA’T · AFA Escola Sant Salvador · contacte@afaescolasantsalvador.org",
      margin,
      280,
    );
    doc.save(`preinscripcio-${record.code}.pdf`);
  }
  return (
    <main className="adminShell">
      <aside className="adminSide">
        <div className="adminBrand">
          <strong>ACTIVA’T</strong>
          <span>Secretaria Virtual</span>
        </div>
        <div className="sideLabel">Gestió</div>
        {nav.map(([icon, label]) => (
          <a
            href={`#${label}`}
            className={`sideLink ${view === label ? "active" : ""}`}
            key={label}
            onClick={(event) => {
              event.preventDefault();
              setView(label);
              setStatus("Tots");
            }}
          >
            <span className="sideDot">{icon}</span>
            {label}
            {label === "Preinscripcions" && (
              <span style={{ marginLeft: "auto" }} className="pill purple">
                {data.registrations.length}
              </span>
            )}
          </a>
        ))}
        <div className="sideLabel">Sistema</div>
        <a
          href="#configuracio"
          className={`sideLink ${view === "Configuració" ? "active" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            setView("Configuració");
          }}
        >
          <span className="sideDot">⚙</span>Configuració
        </a>
        <a href="/" className="sideLink">
          <span className="sideDot">↩</span>Tornar al web
        </a>
      </aside>
      <section className="adminMain">
        <div className="adminTop">
          <div>
            <span className="eyebrow">Panell de Secretaria · {view}</span>
            <h1>{view === "Inici" ? "Bon dia. Què gestionem avui?" : view}</h1>
            <p>
              Controla preinscripcions, places, cobraments i quotes des d’un
              únic espai.
            </p>
          </div>
          <div className="adminActions">
            <button className="btn secondary" onClick={load}>
              ↻ Actualitzar
            </button>
            <a className="btn primary" href="/preinscripcio">
              ＋ Nou tràmit
            </a>
          </div>
        </div>
        <div className="notice" style={{ marginBottom: 18 }}>
          <b>Pagament:</b> s’ha de realitzar immediatament a l’AFA els dimarts
          de 14:45 a 16:00 h. La data registrada per Secretaria fixa l’ordre de
          plaça.
        </div>
        <div className="kpis">
          <div className="card kpi">
            <div className="kpiTop">Preinscripcions</div>
            <strong>{data.kpis.Preinscripcions}</strong>
          </div>
          <div className="card kpi">
            <div className="kpiTop">Actives</div>
            <strong>{data.kpis.Actives}</strong>
          </div>
          <div className="card kpi">
            <div className="kpiTop">Places ocupades</div>
            <strong>{data.kpis["Places ocupades"]}</strong>
          </div>
          <div className="card kpi">
            <div className="kpiTop">Pendent de cobrament</div>
            <strong>{data.kpis.Pendent}</strong>
          </div>
        </div>
        <section className="card activityStats" style={{ marginBottom: 18 }}>
          <div className="panelTitle">
            <div>
              <h2>Resum per activitat</h2>
              <span className="muted small">
                Ocupació, matrícules i cobrament actual.
              </span>
            </div>
          </div>
          <div className="statsGrid">
            {activityStats.map((activity: any) => (
              <div className="statTile" key={activity.id || activity.name}>
                <b>{activity.name}</b>
                <span>
                  {activity.total} expedients · {activity.matriculated}{" "}
                  matriculats
                </span>
                <strong>{money(activity.paid)}</strong>
                <small>cobrats · {money(activity.pending)} pendents</small>
                <div className="bar">
                  <i
                    style={{
                      width: `${Math.min(100, Math.round(((activity.occupied || 0) / ((activity.capacity_override ?? activity.capacity) || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        {view === "Famílies" && (
          <section className="card" style={{ marginBottom: 18 }}>
            <div className="panelTitle">
              <h2>Famílies</h2>
              <span className="pill purple">{families.length}</span>
            </div>
            <div className="miniList">
              {families.map((record: any) => (
                <div className="miniItem" key={record.representative_name}>
                  <div>
                    <b>{record.representative_name}</b>
                    <small className="muted" style={{ display: "block" }}>
                      {record.email} · {record.phone || "Sense telèfon"}
                    </small>
                  </div>
                  <button
                    className="btn secondary"
                    onClick={() => open(record)}
                  >
                    Obrir expedient
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
        {view === "Documents" && (
          <section className="card" style={{ marginBottom: 18 }}>
            <div className="panelTitle">
              <h2>Documents</h2>
              <span className="muted small">
                Revisa cada expedient i genera els documents des de la seva
                fitxa.
              </span>
            </div>
            <div className="miniList">
              {data.registrations.map((record: any) => (
                <div className="miniItem" key={record.id}>
                  <span>
                    <b>{record.code}</b>
                    <small className="muted" style={{ display: "block" }}>
                      {record.student_name}
                    </small>
                  </span>
                  <div className="row"><button className="btn secondary" onClick={() => open(record)}>Revisar</button><button className="btn secondary" onClick={() => registrationPdf(record)}>↓ PDF</button></div>
                </div>
              ))}
            </div>
          </section>
        )}
        {view === "Comunicacions" && (
          <section className="card" style={{ marginBottom: 18 }}>
            <div className="panelTitle"><div><h2>Nova comunicació</h2><span className="muted small">Selecciona destinataris i previsualitza el missatge abans de generar-lo.</span></div></div>
            <div className="communicationFilters"><div className="detailItem"><small>Activitat</small><select className="select" value={commActivity} onChange={event=>setCommActivity(event.target.value)}><option>Totes</option>{Array.from(new Set((data.registrations||[]).map((record:any)=>record.activity_name))).map((item:any)=><option key={item}>{item}</option>)}</select></div><div className="detailItem"><small>Estat</small><select className="select" value={commStatus} onChange={event=>setCommStatus(event.target.value)}><option>Tots</option>{Array.from(new Set((data.registrations||[]).map((record:any)=>record.status))).map((item:any)=><option key={item}>{item}</option>)}</select></div><div className="detailItem"><small>Curs</small><select className="select" value={commCourse} onChange={event=>setCommCourse(event.target.value)}><option>Tots</option>{Array.from(new Set((data.registrations||[]).map((record:any)=>record.course).filter(Boolean))).map((item:any)=><option key={item}>{item}</option>)}</select></div></div>
            <div className="communicationCount"><b>{commTargets.length} famílies seleccionades</b><span>Les comunicacions s’agrupen per contacte familiar.</span></div>
            <div className="detailItem"><small>Assumpte</small><input className="fieldInput" value={commSubject} onChange={event=>setCommSubject(event.target.value)}/></div>
            <div className="detailItem" style={{marginTop:12}}><small>Missatge</small><textarea className="fieldInput" rows={6} value={commMessage} onChange={event=>setCommMessage(event.target.value)}/><span className="muted small">Variables disponibles: nom de l’alumne, activitat, curs, import i data límit.</span></div><div className="communicationPreview"><b>Previsualització</b><p><strong>Benvolguda família,</strong></p><p>{communicationPreview()}</p><small>AFA Escola Sant Salvador · Av. Sant Salvador, 13 · contacte@afaescolasantsalvador.org</small></div><div className="row" style={{marginTop:14}}><button className="btn secondary" onClick={() => setView("Comunicacions")}>Revisar missatge</button><button className="btn primary" disabled={!commTargets.length}>Generar comunicacions</button></div></section>)}
        {view === "Reserves" && (
          <section className="card" style={{ marginBottom: 18 }}>
            <h2>Reserves</h2>
            <p className="muted">
              No hi ha reserves separades dels expedients actuals.
            </p>
            <button
              className="btn secondary"
              onClick={() => setView("Places i vacants")}
            >
              Gestionar places
            </button>
          </section>
        )}
        {view === "Configuració" && (
          <section className="card" style={{ marginBottom: 18 }}>
            <h2>Configuració</h2>
            <div className="detailGrid">
              <div className="detailItem">
                <small>Horari de pagament</small>
                <b>Dimarts · 14:45–16:00 h</b>
              </div>
              <div className="detailItem">
                <small>Calendari de quotes</small>
                <b>Mes següent · últim dimarts anterior</b>
              </div>
            </div>
          </section>
        )}
        <div className="adminGrid">
          <section className="card">
            <div className="panelTitle">
              <div>
                <h2>
                  {view === "Matrícules"
                    ? "Matrícules"
                    : view === "Llistes d’espera"
                      ? "Llistes d’espera"
                      : "Preinscripcions"}
                </h2>
                <span className="muted small">
                  {rows.length} expedients visibles
                </span>
              </div>
            </div>
            <div className="toolbar">
              <div className="search">
                <span>⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cerca per codi, alumne o família…"
                />
              </div>
              <select
                className="select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Tots</option>
                {Array.from(
                  new Set(
                    data.registrations.map((record: any) => record.status),
                  ),
                ).map((item: any) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              {(view === "Places i vacants" || view === "Matrícules" || view === "Llistes d’espera") && (
                <div className="row" style={{ marginLeft: "auto" }}>
                  <button className="btn secondary" onClick={() => downloadList("csv")}>CSV</button>
                  <button className="btn secondary" onClick={() => downloadList("pdf")}>PDF</button>
                </div>
              )}
            </div>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ordre</th>
                    <th>Alumne/a</th>
                    <th>Activitat</th>
                    <th>Estat</th>
                    <th>Import</th>
                    <th>Plaça</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((record: any, index: number) => (
                    <tr key={record.id}>
                      <td>
                        {record.payment_date ? `#${index + 1}` : "—"}
                        <small className="muted" style={{ display: "block" }}>
                          {record.payment_date || "No pagat"}
                        </small>
                      </td>
                      <td>
                        <div className="person">
                          <span className="avatar">
                            {initials(record.student_name)}
                          </span>
                          <span>
                            <b>{record.student_name}</b>
                            <small
                              className="muted"
                              style={{ display: "block" }}
                            >
                              {record.representative_name}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>{record.activity_name}</td>
                      <td>
                        <span className="pill wait">{record.status}</span>
                      </td>
                      <td>
                        <b>{money(record.total_amount)}</b>
                      </td>
                      <td>
                        {record.place ? <b>#{record.place}</b> : <span className="muted">—</span>}
                      </td>
                      <td>
                        <div className="row" style={{ flexWrap: "wrap" }}>
                          <button className="btn secondary" onClick={() => open(record)}>Obrir</button>
                          {!["admesa", "matriculada", "eliminada"].includes(String(record.status || "").toLowerCase()) && (
                            <button className="btn primary" onClick={() => placementAction(record, "assign_place")}>Assignar</button>
                          )}
                          {String(record.status || "").toLowerCase() === "admesa" && (
                            <button className="btn primary" onClick={() => placementAction(record, "matriculate")}>Matricular</button>
                          )}
                          {String(record.status || "").toLowerCase() !== "llista d’espera" && !["admesa", "matriculada", "eliminada"].includes(String(record.status || "").toLowerCase()) && (
                            <button className="btn secondary" onClick={() => placementAction(record, "waitlist")}>Espera</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7}>
                        <div
                          className="muted"
                          style={{ padding: 25, textAlign: "center" }}
                        >
                          No hi ha resultats.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          +{" "}
          <aside>
            <section className="card">
              <h2>Activitats</h2>
              <div className="miniList">
                {(data.activities || []).map((activity: any) => (
                  <div className="miniItem" key={activity.id}>
                    <div>
                      <b>{activity.name}</b>
                      <small className="muted" style={{ display: "block" }}>
                        {activity.occupied || 0} ocupades · {activity.available ?? Math.max(0, Number(activity.capacity_override ?? activity.capacity ?? 0) - Number(activity.occupied || 0))} lliures · límit{" "}
                        {activity.capacity_override ?? activity.capacity}
                      </small>
                    </div>
                    <div className="row">
                      <input
                        className="fieldInput capacityInput"
                        type="number"
                        min="0"
                        value={activity.capacity_override ?? activity.capacity}
                        onChange={(event) =>
                          setData((current: any) => ({
                            ...current,
                            activities: current.activities.map((item: any) =>
                              item.id === activity.id
                                ? {
                                    ...item,
                                    capacity_override: Number(
                                      event.target.value,
                                    ),
                                  }
                                : item,
                            ),
                          }))
                        }
                      />
                      <button
                        className="btn secondary"
                        onClick={() => updateActivity(activity)}
                      >
                        {activity.vacancies_open === false ? "Obrir" : "Tancar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
        {selected && (
          <div
            className="drawerOverlay"
            onMouseDown={(event) =>
              event.target === event.currentTarget && setSelected(undefined)
            }
          >
            <aside className="drawer">
              <div className="drawerHeader">
                <div>
                  <span className="eyebrow">Expedient {selected.code}</span>
                  <h2>{selected.student_name}</h2>
                </div>
                <button
                  className="btn secondary"
                  onClick={() => setSelected(undefined)}
                >
                  Tancar
                </button>
              </div>
              <h3>Dades personals</h3>
              <div className="detailGrid">
                {[
                  ["student_name", "Alumne/a"],
                  ["representative_name", "Representant legal"],
                  ["phone", "Telèfon"],
                  ["email", "Correu"],
                  ["dni", "DNI / NIE"],
                  ["birth_date", "Data de naixement"],
                ].map(([key, label]) => (
                  <div className="detailItem" key={key}>
                    <small>{label}</small>
                    <input
                      className="fieldInput"
                      value={selected[key] || ""}
                      onChange={(event) => setField(key, event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="discountBox" style={{ marginTop: 18 }}>
                <div className="discountLine">
                  <span>Persones autoritzades</span>
                  <textarea
                    className="fieldInput"
                    rows={3}
                    value={selected.authorized_people
                      .map((person: any) => person.name || "")
                      .join("\n")}
                    onChange={(event) =>
                      setField(
                        "authorized_people",
                        event.target.value
                          .split("\n")
                          .filter(Boolean)
                          .map((name) => ({ name })),
                      )
                    }
                  />
                </div>
                <div className="discountLine">
                  <span>Contactes d’emergència</span>
                  <textarea
                    className="fieldInput"
                    rows={3}
                    value={selected.emergency_contacts
                      .map((person: any) => person.name || "")
                      .join("\n")}
                    onChange={(event) =>
                      setField(
                        "emergency_contacts",
                        event.target.value
                          .split("\n")
                          .filter(Boolean)
                          .map((name) => ({ name })),
                      )
                    }
                  />
                </div>
                <div className="discountLine">
                  <span>Firma virtual</span>
                  <input
                    className="fieldInput"
                    value={selected.signature_data || ""}
                    onChange={(event) =>
                      setField("signature_data", event.target.value)
                    }
                  />
                </div>
                <div className="discountLine">
                  <span>Accepta textos legals</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selected.rules_accepted)}
                    onChange={(event) =>
                      setField("rules_accepted", event.target.checked)
                    }
                  />
                </div>
              </div>
              <section className="paymentEditor">
                <div className="row space">
                  <div>
                    <h3>Pagament i rebut</h3>
                    <small className="muted">
                      Import rebut i canvi calculat per Secretaria.
                    </small>
                  </div>
                  <button
                    className="btn secondary"
                    onClick={() => receipt(selected)}
                  >
                    Generar rebut PDF
                  </button>
                </div>
                <div className="detailGrid">
                  <div className="detailItem">
                    <small>Import de la preinscripció</small>
                    <b>{money(selected.total_amount)}</b>
                  </div>
                  <div className="detailItem">
                    <small>Import rebut</small>
                    <input
                      className="fieldInput"
                      type="number"
                      min="0"
                      step="0.01"
                      value={selected.paid_amount || 0}
                      onChange={(event) =>
                        setField("paid_amount", Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="detailItem">
                    <small>Canvi</small>
                    <b>
                      {money(
                        Math.max(
                          0,
                          Number(selected.paid_amount || 0) -
                            Number(selected.total_amount || 0),
                        ),
                      )}
                    </b>
                  </div>
                  <div className="detailItem">
                    <small>Mitjà</small>
                    <select
                      className="select"
                      value={selected.payment_method || ""}
                      onChange={(event) =>
                        setField("payment_method", event.target.value)
                      }
                    >
                      <option value="">No especificat</option>
                      <option>Efectiu</option>
                      <option>Transferència</option>
                      <option>Targeta</option>
                      <option>Altres</option>
                    </select>
                  </div>
                </div>
              </section>
              <h3 style={{ marginTop: 22 }}>Tarifa i quotes</h3>
              <div className="detailGrid">
                <div className="detailItem">
                  <small>Soci/a</small>
                  <select
                    className="select"
                    value={selected.is_member ? "si" : "no"}
                    onChange={(event) =>
                      setField("is_member", event.target.value === "si")
                    }
                  >
                    <option value="si">Soci/a</option>
                    <option value="no">No soci/a</option>
                  </select>
                </div>
                <div className="detailItem">
                  <small>Ordre del fill/a</small>
                  <input
                    className="fieldInput"
                    type="number"
                    min="1"
                    value={selected.child_order || 1}
                    onChange={(event) =>
                      setField("child_order", Number(event.target.value))
                    }
                  />
                </div>
                <div className="detailItem">
                  <small>Descompte manual</small>
                  <input
                    className="fieldInput"
                    type="number"
                    step="0.01"
                    value={selected.discount_amount || 0}
                    onChange={(event) =>
                      setField("discount_amount", Number(event.target.value))
                    }
                  />
                </div>
                <div className="detailItem">
                  <small>Estat</small>
                  <select
                    className="select"
                    value={selected.status}
                    onChange={(event) => setField("status", event.target.value)}
                  >
                    <option>pendent de pagament</option>
                    <option>Pendent d’assignació de plaça</option>
                    <option>admesa</option>
                    <option>matriculada</option>
                    <option>llista d’espera</option>
                    <option>eliminada</option>
                  </select>
                </div>
              </div>
              <section className="card" style={{ marginTop: 18 }}>
                <div className="row space">
                  <h3>Quotes mensuals</h3>
                  <button className="btn secondary" onClick={generateFees}>
                    Generar
                  </button>
                </div>
                {selected.fees.map((fee: any, index: number) => (
                  <div className="discountLine" key={fee.id || fee.month}>
                    <span>
                      {String(fee.month).slice(0, 7)} ·{" "}
                      {fee.due_date || "sense límit"}
                    </span>
                    <input
                      className="fieldInput"
                      style={{ width: 95 }}
                      type="number"
                      value={fee.total || 0}
                      disabled={fee.status === "Nula"}
                      onChange={(event) =>
                        setFee(index, "total", Number(event.target.value))
                      }
                    />
                    <button
                      className="btn secondary"
                      onClick={() =>
                        setFee(
                          index,
                          "status",
                          fee.status === "Nula" ? "pendent" : "Nula",
                        )
                      }
                    >
                      {fee.status === "Nula" ? "Reactivar" : "Nula"}
                    </button>
                  </div>
                ))}
              </section>
              <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
                <button
                  className="btn primary"
                  onClick={() => save(false)}
                  disabled={saving}
                >
                  {saving ? "Desant…" : "Desar canvis"}
                </button>
                {!selected.payment_date && (
                  <button
                    className="btn secondary"
                    onClick={() => save(true)}
                    disabled={saving}
                  >
                    Registrar pagament
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}
        +{" "}
      </section>
      +{" "}
    </main>
  );
}
