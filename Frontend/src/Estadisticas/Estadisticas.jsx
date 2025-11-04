import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Logo from '../assets/Lab Avila Logo.png';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const formatYMD = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate()-n); return d; };
const formatDMY = (date) => {
  if (date instanceof Date) {
    const dd = String(date.getDate()).padStart(2,'0');
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  // aceptar strings 'YYYY-MM-DD'
  const s = String(date||'');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
};

const tokenHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const palette = {
  primary: '#00C2CC',
  success: '#0a8754',
  warning: '#b86b00',
  danger: '#c0392b',
  gray: '#6c757d',
};

export default function Estadisticas() {
  const [tipo, setTipo] = useState('ingresos'); // ingresos | citas | examenes | inventario
  const [fromDate, setFromDate] = useState(daysAgo(29));
  const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const printRef = useRef(null);
  const lineRef = useRef(null);
  const breakdownRef = useRef(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const base = 'http://localhost:5000/api/stats';
      const url = `${base}/${tipo}`;
      const { data } = await axios.get(url, { params: { from: formatYMD(fromDate), to: formatYMD(toDate) }, headers: tokenHeader() });
      setData(data || {});
    } catch (_) {
      setData({});
    } finally { setLoading(false); }
  };

  useEffect(() => { loadStats(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tipo, fromDate, toDate]);

  // Common helpers to build chart datasets
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  };

  const lineData = useMemo(() => {
    if (tipo === 'ingresos') {
      const labels = (data.porDia || []).map(r => formatDMY(r.dia));
      const series = (data.porDia || []).map(r => r.total);
      return { labels, datasets: [{ label: 'Monto diario', data: series, tension: 0.3, fill: true, borderColor: palette.primary, backgroundColor: 'rgba(0,194,204,0.15)' }] };
    }
    if (tipo === 'citas') {
      const labels = (data.porDia || []).map(r => formatDMY(r.dia));
      const series = (data.porDia || []).map(r => r.cnt);
      return { labels, datasets: [{ label: 'Citas por día', data: series, tension: 0.3, fill: true, borderColor: palette.primary, backgroundColor: 'rgba(0,194,204,0.15)' }] };
    }
    if (tipo === 'examenes') {
      const labels = (data.porDia || []).map(r => formatDMY(r.dia));
      const series = (data.porDia || []).map(r => r.cnt);
      return { labels, datasets: [{ label: 'Exámenes por día', data: series, tension: 0.3, fill: true, borderColor: palette.primary, backgroundColor: 'rgba(0,194,204,0.15)' }] };
    }
    if (tipo === 'inventario') {
      const labelsRaw = Array.from(new Set([...(data.entradasPorDia||[]).map(x=>x.dia), ...(data.salidasPorDia||[]).map(x=>x.dia)])).sort();
      const labels = labelsRaw.map(formatDMY);
      const entradasMap = new Map((data.entradasPorDia||[]).map(x=>[x.dia, x.total]));
      const salidasMap = new Map((data.salidasPorDia||[]).map(x=>[x.dia, x.total]));
      return {
        labels,
        datasets: [
          { label: 'Entradas', data: labelsRaw.map(d=>entradasMap.get(d)||0), borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.15)', tension: 0.2, fill: true },
          { label: 'Salidas', data: labelsRaw.map(d=>salidasMap.get(d)||0), borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.15)', tension: 0.2, fill: true },
        ]
      };
    }
    return { labels: [], datasets: [] };
  }, [tipo, data]);

  const barData = useMemo(() => {
    if (tipo === 'ingresos') {
      const labels = (data.porMetodo || []).map(r => r.metodo === 'E' ? 'Efectivo' : r.metodo === 'T' ? 'Tarjeta' : r.metodo === 'B' ? 'Transferencia' : 'N/D');
      const vals = (data.porMetodo || []).map(r => r.total);
      return { labels, datasets: [{ label: 'Por método de pago', data: vals, backgroundColor: labels.map(() => palette.primary) }] };
    }
    if (tipo === 'examenes') {
      const labels = (data.porTipo || []).map(r => r.tipo);
      const vals = (data.porTipo || []).map(r => r.cnt);
      return { labels, datasets: [{ label: 'Exámenes por tipo', data: vals, backgroundColor: labels.map(() => palette.primary) }] };
    }
    if (tipo === 'inventario') {
      const labels = (data.topConsumo || []).map(r => r.insumo);
      const vals = (data.topConsumo || []).map(r => r.total);
      return { labels, datasets: [{ label: 'Top consumo (salidas)', data: vals, backgroundColor: labels.map(() => palette.primary) }] };
    }
    if (tipo === 'citas') {
      const labels = ['Activas', 'Canceladas'];
      const vals = [Number(data.activas||0), Number(data.canceladas||0)];
      return { labels, datasets: [{ label: 'Citas', data: vals, backgroundColor: [palette.success, palette.danger] }] };
    }
    return { labels: [], datasets: [] };
  }, [tipo, data]);

  const doughnutData = useMemo(() => {
    if (tipo === 'ingresos') {
      const labels = ['Pagado', 'Pendiente'];
      const vals = [Number(data.totalPagado||0), Number(data.totalPendiente||0)];
      return { labels, datasets: [{ data: vals, backgroundColor: [palette.success, palette.warning] }] };
    }
    return null;
  }, [tipo, data]);

  // Export helpers
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const addSheet = (name, rows) => {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    if (tipo === 'ingresos') {
      addSheet('Resumen', [{ desde: formatDMY(fromDate), hasta: formatDMY(toDate), totalCaja: data.totalCaja||0, totalPagado: data.totalPagado||0, totalPendiente: data.totalPendiente||0 }]);
      addSheet('Por día', (data.porDia||[]).map(x => ({ fecha: formatDMY(x.dia), total: x.total })));
      addSheet('Por método', (data.porMetodo||[]).map(x => ({ metodo: x.metodo, total: x.total })));
    } else if (tipo === 'citas') {
      addSheet('Resumen', [{ desde: formatDMY(fromDate), hasta: formatDMY(toDate), total: data.total||0, activas: data.activas||0, canceladas: data.canceladas||0 }]);
      addSheet('Por día', (data.porDia||[]).map(x => ({ fecha: formatDMY(x.dia), cantidad: x.cnt })));
    } else if (tipo === 'examenes') {
      addSheet('Resumen', [{ desde: formatDMY(fromDate), hasta: formatDMY(toDate), total: data.total||0 }]);
      addSheet('Por día', (data.porDia||[]).map(x => ({ fecha: formatDMY(x.dia), cantidad: x.cnt })));
      addSheet('Por tipo', (data.porTipo||[]).map(x => ({ tipo: x.tipo, cantidad: x.cnt })));
    } else if (tipo === 'inventario') {
      addSheet('Resumen', [{ desde: formatDMY(fromDate), hasta: formatDMY(toDate), stockBajo: data.stockBajo||0, proximosAVencer: data.proximosAVencer||0 }]);
      addSheet('Entradas por día', (data.entradasPorDia||[]).map(x => ({ fecha: formatDMY(x.dia), total: x.total })));
      addSheet('Salidas por día', (data.salidasPorDia||[]).map(x => ({ fecha: formatDMY(x.dia), total: x.total })));
      addSheet('Top consumo', (data.topConsumo||[]).map(x => ({ insumo: x.insumo, total: x.total })));
    }
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `reporte_${tipo}_${formatDMY(fromDate)}_a_${formatDMY(toDate)}.xlsx`);
  };

  const handleExportPdf = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 40; let y = 40;

    // Logo del laboratorio (si carga correctamente)
    try {
      const resp = await fetch(Logo);
      const blob = await resp.blob();
      const dataUrl = await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.readAsDataURL(blob); });
      // tamaño aproximado del logo
      const imgW = 140; const imgH = 40;
      doc.addImage(dataUrl, 'PNG', marginX, y, imgW, imgH);
      y += imgH + 6;
    } catch (_) { /* continuar sin logo */ }

    doc.setFontSize(16); doc.text(`Reporte de ${tipo}`, marginX, y); y += 20;
    doc.setFontSize(10); doc.text(`Desde ${formatDMY(fromDate)} hasta ${formatDMY(toDate)}`, marginX, y); y += 16;
    const addTable = (title, rows) => {
      if (!rows || rows.length === 0) return; y += 10; doc.setFontSize(12); doc.text(title, marginX, y); y += 6;
      doc.autoTable({ startY: y, head: [Object.keys(rows[0])], body: rows.map(r => Object.values(r)), styles: { fontSize: 9 }, margin: { left: marginX, right: marginX } });
      y = doc.lastAutoTable.finalY + 6;
    };
    if (tipo === 'ingresos') {
      addTable('Resumen', [{ totalCaja: data.totalCaja||0, totalPagado: data.totalPagado||0, totalPendiente: data.totalPendiente||0 }]);
      addTable('Por día', (data.porDia||[]).map(x => ({ fecha: x.dia, total: x.total })));
      addTable('Por método', (data.porMetodo||[]).map(x => ({ metodo: x.metodo, total: x.total })));
    } else if (tipo === 'citas') {
      addTable('Resumen', [{ total: data.total||0, activas: data.activas||0, canceladas: data.canceladas||0 }]);
      addTable('Por día', (data.porDia||[]).map(x => ({ fecha: x.dia, cantidad: x.cnt })));
    } else if (tipo === 'examenes') {
      addTable('Resumen', [{ total: data.total||0 }]);
      addTable('Por día', (data.porDia||[]).map(x => ({ fecha: x.dia, cantidad: x.cnt })));
      addTable('Por tipo', (data.porTipo||[]).map(x => ({ tipo: x.tipo, cantidad: x.cnt })));
    } else if (tipo === 'inventario') {
      addTable('Resumen', [{ stockBajo: data.stockBajo||0, proximosAVencer: data.proximosAVencer||0 }]);
      addTable('Entradas por día', (data.entradasPorDia||[]).map(x => ({ fecha: formatDMY(x.dia), total: x.total })));
      addTable('Salidas por día', (data.salidasPorDia||[]).map(x => ({ fecha: formatDMY(x.dia), total: x.total })));
      addTable('Top consumo', (data.topConsumo||[]).map(x => ({ insumo: x.insumo, total: x.total })));
    }

    // Agregar gráficas (manteniendo proporción)
    const addChart = (chartRef, title) => {
      const chart = chartRef.current;
      const img = chart?.toBase64Image?.();
      const canvas = chart?.canvas;
      if (!img || !canvas) return;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - marginX * 2;
      const ratio = canvas.height > 0 ? canvas.width / canvas.height : (16/9);
      const w = Math.min(maxW, 520);
      const h = w / ratio;
      y += 12; doc.setFontSize(12); doc.text(title, marginX, y); y += 6;
      if (y + h > pageH - 40) { doc.addPage(); y = 40; }
      doc.addImage(img, 'PNG', marginX, y, w, h);
      y += h + 6;
    };

    addChart(lineRef, 'Serie temporal');
    addChart(breakdownRef, 'Desglose');

    doc.save(`reporte_${tipo}_${formatDMY(fromDate)}_a_${formatDMY(toDate)}.pdf`);
  };

  const handlePrint = () => {
    try {
      const imageLine = lineRef.current?.toBase64Image?.() || '';
      const imageBreakdown = breakdownRef.current?.toBase64Image?.() || '';
      const summaryRows = (() => {
        if (tipo === 'ingresos') return [
          { label: 'Recaudado', value: `$ ${(Number(data.totalCaja||0)).toFixed(2)}` },
          { label: 'Pagado', value: `$ ${(Number(data.totalPagado||0)).toFixed(2)}` },
          { label: 'Pendiente', value: `$ ${(Number(data.totalPendiente||0)).toFixed(2)}` },
        ];
        if (tipo === 'citas') return [
          { label: 'Total', value: Number(data.total||0) },
          { label: 'Activas', value: Number(data.activas||0) },
          { label: 'Canceladas', value: Number(data.canceladas||0) },
        ];
        if (tipo === 'examenes') return [ { label: 'Exámenes realizados', value: Number(data.total||0) } ];
        if (tipo === 'inventario') return [
          { label: 'Stock bajo', value: Number(data.stockBajo||0) },
          { label: 'Próximos a vencer', value: Number(data.proximosAVencer||0) },
        ];
        return [];
      })();

      const w = window.open('', 'PRINT', 'width=1024,height=768');
      if (!w) return window.print();
      const title = `Estadísticas - ${tipo} (${formatDMY(fromDate)} a ${formatDMY(toDate)})`;
      const logoUrl = Logo; /* utilizar url procesada por Vite */
      const summaryRowsHtml = summaryRows.map(r => `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb"><strong>${r.label}</strong></td><td style="padding:6px 10px;border:1px solid #e5e7eb">${r.value}</td></tr>`).join('');
      w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>${title}</title>
        <style>
          body{ font-family: Arial, sans-serif; color:#111; }
          h1{ font-size:18px; margin:8px 0; color:#00C2CC; }
          .card{ border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin:10px 0; }
          table{ border-collapse: collapse; width:100%; }
          .charts{ display:block; }
          .chart-box{ width:100%; max-width:900px; margin:12px auto; }
          img.chart{ width:100%; height:auto; border:1px solid #f0f2f4; border-radius:8px; }
          .header{ display:flex; align-items:center; gap:12px; }
          .header img{ height:40px; }
        </style>
      </head><body>
        <div class='header'><img src='${logoUrl}' alt='Logo' /><h1>${title}</h1></div>
        <div class='card'>
          <table>${summaryRowsHtml}</table>
        </div>
        <div class='card charts'>
          ${imageLine ? `<div class='chart-box'><img class='chart' src='${imageLine}' /></div>` : ''}
          ${imageBreakdown ? `<div class='chart-box'><img class='chart' src='${imageBreakdown}' /></div>` : ''}
        </div>
        <script>setTimeout(function(){ window.print(); window.close(); }, 200);</script>
      </body></html>`);
      w.document.close();
      w.focus();
    } catch (_) {
      window.print();
    }
  };

  const summaryCards = () => {
    if (tipo === 'ingresos') return (
      <div className="d-flex flex-wrap gap-3">
        <SummaryCard title="Ingresos" value={`$ ${(Number(data.totalCaja||0)).toFixed(2)}`} color="#E8F4FF" />
        <SummaryCard title="Pagado" value={`$ ${(Number(data.totalPagado||0)).toFixed(2)}`} color="#E8FFF5" />
        <SummaryCard title="Pendiente" value={`$ ${(Number(data.totalPendiente||0)).toFixed(2)}`} color="#FFF5E8" />
      </div>
    );
    if (tipo === 'citas') return (
      <div className="d-flex flex-wrap gap-3">
        <SummaryCard title="Total" value={Number(data.total||0)} color="#E8F4FF" />
        <SummaryCard title="Activas" value={Number(data.activas||0)} color="#E8FFF5" />
        <SummaryCard title="Canceladas" value={Number(data.canceladas||0)} color="#FFE8E8" />
      </div>
    );
    if (tipo === 'examenes') return (
      <div className="d-flex flex-wrap gap-3">
        <SummaryCard title="Exámenes realizados" value={Number(data.total||0)} color="#E8F4FF" />
      </div>
    );
    if (tipo === 'inventario') return (
      <div className="d-flex flex-wrap gap-3">
        <SummaryCard title="Stock bajo" value={Number(data.stockBajo||0)} color="#FFF5E8" />
        <SummaryCard title="Próximos a vencer" value={Number(data.proximosAVencer||0)} color="#FFE8E8" />
      </div>
    );
    return null;
  };

  return (
    <div style={{ marginLeft: 250, padding: 20, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container py-4" style={{ maxWidth: 1280, margin: '24px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }} ref={printRef}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3" style={{ padding: '8px 12px' }}>
          <div className="d-flex align-items-center gap-3">
            <h2 className="mb-0" style={{ color: '#00C2CC' }}>Estadísticas</h2>
            {loading && <span className="badge text-bg-light border">Cargando…</span>}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}><i className="bi bi-printer me-1"/>Imprimir</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleExportPdf}><i className="bi bi-filetype-pdf me-1"/>PDF</button>
            <button className="btn btn-outline-success btn-sm" onClick={handleExportExcel}><i className="bi bi-file-earmark-excel me-1"/>Excel</button>
          </div>
        </div>

        <div className="row g-3 px-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-3">
                    <label className="form-label small">Tipo de reporte</label>
                    <select className="form-select" value={tipo} onChange={e=>setTipo(e.target.value)}>
                      <option value="ingresos">Ingresos</option>
                      <option value="citas">Citas</option>
                      <option value="examenes">Exámenes realizados</option>
                      <option value="inventario">Inventario</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small">Desde</label>
                    <DatePicker
                      selected={fromDate}
                      onChange={(d)=> d && setFromDate(d)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                      maxDate={toDate}
                      isClearable={false}
                    />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small">Hasta</label>
                    <DatePicker
                      selected={toDate}
                      onChange={(d)=> d && setToDate(d)}
                      dateFormat="dd-MM-yyyy"
                      className="form-control"
                      minDate={fromDate}
                      maxDate={new Date()}
                      isClearable={false}
                    />
                  </div>
                  <div className="col-12 col-md-5 d-flex gap-2 justify-content-end">
                    <button className="btn btn-sm btn-outline-primary" onClick={loadStats}><i className="bi bi-arrow-repeat me-1"/>Actualizar</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={()=>{ setFromDate(daysAgo(29)); setToDate(new Date()); }}><i className="bi bi-calendar-event me-1"/>Últimos 30 días</button>
                  </div>
                </div>
                <div className="mt-3">
                  {summaryCards()}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm" style={{ minHeight: 360 }}>
              <div className="card-body">
                <h6 className="text-muted">Serie temporal</h6>
                <div style={{ height: 300 }}>
                  <Line ref={lineRef} data={lineData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm" style={{ minHeight: 360 }}>
              <div className="card-body">
                <h6 className="text-muted">Desglose</h6>
                <div style={{ height: 300 }}>
                  {tipo === 'ingresos' && doughnutData ? (
                    <Doughnut ref={breakdownRef} data={doughnutData} options={{ ...chartOptions, scales: {} }} />
                  ) : (
                    <Bar ref={breakdownRef} data={barData} options={chartOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media print { body { background: #fff !important; } .btn, nav, aside { display: none !important; } .container { box-shadow: none !important; } }`}</style>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="card border-0" style={{ background: color }}>
      <div className="card-body py-2 px-3">
        <div className="small text-muted">{title}</div>
        <div className="h5 mb-0" style={{ color: '#111' }}>{value}</div>
      </div>
    </div>
  );
}
