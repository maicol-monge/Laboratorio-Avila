import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import logoUrl from '../assets/lab-avila-logo.png';

const fmtDMY = (val) => {
  try {
    const d = new Date(String(val).replace(' ', 'T'));
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch { return String(val || ''); }
};

const PagosAvila = () => {
  const [comprobantes, setComprobantes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('0'); // 0: pendientes, 1: pagados, '' todos
  const [seleccionado, setSeleccionado] = useState(null); // objeto de comprobante + detalles
  const [metodoPago, setMetodoPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // filtros avanzados
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, []);
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [filtroExamen, setFiltroExamen] = useState('');
  const [detailsCache, setDetailsCache] = useState({}); // id_comprobante -> detalles
  const [examOptions, setExamOptions] = useState([]); // opciones únicas de tipos de examen/consumo
  const [stats, setStats] = useState({ totalCaja: 0, totalPagado: 0, totalPendiente: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  const loadComprobantes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroEstado === '0' || filtroEstado === '1') params.estado = filtroEstado;
      const { data } = await axios.get('http://localhost:5000/api/comprobantes', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setComprobantes(data || []);
    } catch (_) {
      setComprobantes([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadComprobantes(); }, [filtroEstado]);

  const seleccionar = async (c) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/comprobantes/${c.id_comprobante}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSeleccionado(data);
      setMetodoPago('');
      // cachear detalles
      if (data && data.id_comprobante) {
        setDetailsCache(prev => ({ ...prev, [data.id_comprobante]: data.detalles || [] }));
      }
    } catch (_) { /* ignore */ }
  };

  const procesarPago = async () => {
    if (!seleccionado) return;
    if (!metodoPago) {
      Swal.fire({ icon:'warning', title:'Seleccione método de pago' });
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/comprobantes/${seleccionado.id_comprobante}/pagar`,
        { metodoPago },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      Swal.fire({ icon:'success', title:'Pago procesado', timer: 1400, showConfirmButton: false });
      setMetodoPago('');
      // recargar lista y detalle
      await loadComprobantes();
      await seleccionar({ id_comprobante: seleccionado.id_comprobante });
    } catch (e) {
      Swal.fire({ icon:'error', title:'No se pudo procesar el pago' });
    }
  };

  const exportarPdf = async () => {
    if (!seleccionado || seleccionado.estado !== '1') return;
    try {
      const res = await axios.get(`http://localhost:5000/api/comprobantes/${seleccionado.id_comprobante}/export-pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const headers = res.headers || {};
      let cd = headers['content-disposition'] || headers['Content-Disposition'];
      let suggested = headers['x-filename'] || headers['X-Filename'];
      if (!suggested && cd) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
        const fname = match ? (match[1] || match[2]) : '';
        if (fname) suggested = decodeURIComponent(fname);
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = suggested || `Comprobante_${seleccionado.id_comprobante}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      Swal.fire({ icon:'error', title:'No se pudo exportar el PDF' });
    }
  };

  // limpiar filtros a valores predeterminados
  const limpiarFiltros = () => {
    setFiltroEstado('0');
    setDateStart(today);
    setDateEnd(today);
    setFiltroPaciente('');
    setFiltroExamen('');
  };

  // helpers para filtrar por fecha
  const getYMD = (val) => {
    try {
      if (!val) return '';
      const s = String(val);
      const m = s.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
      const d = new Date(s.replace(' ', 'T'));
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return `${y}-${mm}-${dd}`;
    } catch { return ''; }
  };

  // on-demand cargar detalles para filtrar por examen
  const ensureDetailsFor = async (list) => {
    const missing = list.filter(c => !detailsCache[c.id_comprobante]).map(c => c.id_comprobante);
    if (missing.length === 0) return;
    setLoadingDetails(true);
    try {
      const results = await Promise.all(missing.map(id => axios.get(`http://localhost:5000/api/comprobantes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).then(r => ({ id, detalles: (r.data && r.data.detalles) || [] })).catch(() => ({ id, detalles: [] }))));
      setDetailsCache(prev => {
        const copy = { ...prev };
        for (const it of results) copy[it.id] = it.detalles;
        return copy;
      });
    } finally { setLoadingDetails(false); }
  };

  // construir listado filtrado
  const listAfterEstado = useMemo(() => {
    if (filtroEstado === '') return comprobantes;
    return comprobantes.filter(c => String(c.estado) === String(filtroEstado));
  }, [comprobantes, filtroEstado]);

  const listAfterFecha = useMemo(() => {
    const start = dateStart || '';
    const end = dateEnd || '';
    return listAfterEstado.filter(c => {
      const ymd = getYMD(c.fecha_emision);
      if (!ymd) return false;
      if (start && ymd < start) return false;
      if (end && ymd > end) return false;
      return true;
    });
  }, [listAfterEstado, dateStart, dateEnd]);

  const listAfterPaciente = useMemo(() => {
    const q = (filtroPaciente || '').trim().toLowerCase();
    if (!q) return listAfterFecha;
    return listAfterFecha.filter(c => {
      const name = `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [listAfterFecha, filtroPaciente]);

  const [listAfterExamen, setListAfterExamen] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const q = (filtroExamen || '').trim().toLowerCase();
      if (!q) { setListAfterExamen(listAfterPaciente); return; }
      // asegurar detalles y filtrar por examen
      await ensureDetailsFor(listAfterPaciente);
      if (!active) return;
      setListAfterExamen(listAfterPaciente.filter(c => {
        const dets = detailsCache[c.id_comprobante] || [];
        return dets.some(d => {
          const concepto = `${d.concepto_pago || d.titulo_examen || ''}`.trim().toLowerCase();
          return concepto === q;
        });
      }));
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listAfterPaciente, filtroExamen, detailsCache]);

  // construir opciones de examen ignorando Estado (respeta fecha y paciente)
  useEffect(() => {
    let active = true;
    (async () => {
      // base: comprobantes filtrados por fecha y paciente, sin considerar estado
      const start = dateStart || '';
      const end = dateEnd || '';
      const byDate = (comprobantes || []).filter(c => {
        const ymd = getYMD(c.fecha_emision);
        if (!ymd) return false;
        if (start && ymd < start) return false;
        if (end && ymd > end) return false;
        return true;
      });
      const q = (filtroPaciente || '').trim().toLowerCase();
      const base = q
        ? byDate.filter(c => {
            const name = `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase();
            return name.includes(q);
          })
        : byDate;

      await ensureDetailsFor(base);
      if (!active) return;

      const set = new Set();
      for (const c of base) {
        const dets = detailsCache[c.id_comprobante] || [];
        for (const d of dets) {
          const concepto = (d.concepto_pago || d.titulo_examen || '').trim();
          if (concepto) set.add(concepto);
        }
      }
      setExamOptions(Array.from(set).sort((a,b)=>a.localeCompare(b)));
    })();
    return () => { active = false; };
  }, [comprobantes, dateStart, dateEnd, filtroPaciente, detailsCache]);

  const listaFinal = listAfterExamen;

  // Cargar estadísticas desde backend (ignoran Estado; respetan fecha/paciente/examen)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingStats(true);
        const params = {};
        if (dateStart) params.from = dateStart;
        if (dateEnd) params.to = dateEnd;
        const pac = (filtroPaciente || '').trim();
        if (pac) params.paciente = pac;
        const ex = (filtroExamen || '').trim();
        if (ex) params.examen = ex;
        const { data } = await axios.get('http://localhost:5000/api/comprobantes/stats', {
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!active) return;
        setStats({
          totalCaja: Number((data && data.totalCaja) || 0),
          totalPagado: Number((data && data.totalPagado) || 0),
          totalPendiente: Number((data && data.totalPendiente) || 0),
        });
      } catch (_) {
        if (!active) return;
        setStats({ totalCaja: 0, totalPagado: 0, totalPendiente: 0 });
      } finally {
        if (active) setLoadingStats(false);
      }
    })();
    return () => { active = false; };
  }, [dateStart, dateEnd, filtroPaciente, filtroExamen]);

  return (
    <div style={{ marginLeft: 250, padding: 20, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container py-4" style={{ maxWidth: 1200, margin: '24px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Header y filtros */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3" style={{ padding: '8px 12px' }}>
          <div className="d-flex align-items-center gap-3">
            <h2 className="mb-0" style={{ color: '#00C2CC' }}>Pagos</h2>
            <span className="badge text-bg-light border" title="Registros visibles">{listaFinal.length} registros</span>
          </div>
        </div>

        <div className="row g-3 px-3">
          {/* Filtros avanzados */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-2">
                    <label className="form-label small">Estado</label>
                    <select className="form-select" value={filtroEstado} onChange={(e)=>setFiltroEstado(e.target.value)}>
                      <option value="0">Pendientes</option>
                      <option value="1">Pagados</option>
                      <option value="">Todos</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-2">
                    <label className="form-label small">Desde</label>
                    <input type="date" className="form-control" value={dateStart} onChange={e=>setDateStart(e.target.value)} />
                  </div>
                  <div className="col-12 col-md-2">
                    <label className="form-label small">Hasta</label>
                    <input type="date" className="form-control" value={dateEnd} onChange={e=>setDateEnd(e.target.value)} />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small">Paciente</label>
                    <input className="form-control" placeholder="Buscar por nombre" value={filtroPaciente} onChange={e=>setFiltroPaciente(e.target.value)} />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small">Tipo de examen</label>
                    <select className="form-select" value={filtroExamen} onChange={e=>setFiltroExamen(e.target.value)}>
                      <option value="">Todos</option>
                      {examOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {loadingDetails && <small className="text-muted"> Cargando detalles…</small>}
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </button>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-3 mt-3">
                  <div className="card border-0" style={{ background: '#E8F4FF' }}>
                    <div className="card-body py-2 px-3">
                      <div className="small text-muted">Ingesos</div>
                      <div className="h5 mb-0" style={{ color: '#0b5ed7' }}>$ {stats.totalCaja.toFixed(2)}</div>
                      {loadingStats && <div className="small text-muted">Actualizando…</div>}
                    </div>
                  </div>
                  
                  <div className="card border-0" style={{ background: '#E8FFF5' }}>
                    <div className="card-body py-2 px-3">
                      <div className="small text-muted">Pagado</div>
                      <div className="h5 mb-0" style={{ color: '#0a8754' }}>$ {stats.totalPagado.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="card border-0" style={{ background: '#FFF5E8' }}>
                    <div className="card-body py-2 px-3">
                      <div className="small text-muted">Pendiente</div>
                      <div className="h5 mb-0" style={{ color: '#b86b00' }}>$ {stats.totalPendiente.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de comprobantes */}
          <div className="col-12 col-lg-5">
            <div className="d-grid" style={{ gridTemplateColumns: '1fr', gap: 12, maxHeight: '65vh', overflowY: 'auto', paddingRight: 6 }}>
              {loading ? (
                <div className="text-center text-muted py-4">Cargando…</div>
              ) : (
                listaFinal.map(c => (
                  <div key={c.id_comprobante} className="card border-0 shadow-sm" style={{ cursor: 'pointer', transition: 'transform .08s' }} onClick={()=>seleccionar(c)}>
                    <div className="card-body d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="fw-semibold">#{c.id_comprobante}</div>
                          <span className={`badge ${c.estado==='1' ? 'text-bg-success' : 'text-bg-warning'}`}>
                            {c.estado==='1' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {c.paciente_nombre} {c.paciente_apellido} · {fmtDMY(c.fecha_emision)}
                        </div>
                        {c.estado==='1' && (
                          <div className="small text-muted mt-1">
                            Método: {c.tipo_pago==='E'?'Efectivo':c.tipo_pago==='T'?'Tarjeta':c.tipo_pago==='B'?'Transferencia':'—'}
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="fw-bold" style={{ fontSize: 18 }}>$ {Number(c.total||0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!loading && listaFinal.length === 0 && (
                <div className="text-center text-muted">Sin resultados</div>
              )}
            </div>
          </div>

          {/* Detalle tipo factura */}
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                {!seleccionado ? (
                  <div className="text-muted">Seleccione un comprobante para ver los detalles</div>
                ) : (
                  <div>
                    {/* Encabezado estilo factura */}
                    <div className="d-flex justify-content-between align-items-center mb-3" style={{ borderBottom: '2px solid #eee', paddingBottom: 8 }}>
                      <div className="d-flex align-items-center gap-3">
                        <img src={logoUrl} alt="Laboratorio Avila" style={{ height: 56, width: 'auto' }} />
                        <div>
                          <div className="fw-bold" style={{ fontSize: 18 }}>Laboratorio Ávila</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>Servicios de Análisis Clínicos</div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold" style={{ fontSize: 18 }}>Comprobante #{seleccionado.id_comprobante}</div>
                        <div className="text-muted">Fecha: {fmtDMY(seleccionado.fecha_emision)}</div>
                        {seleccionado.estado==='1' && (
                          <div className="text-success">Pagado ({seleccionado.tipo_pago==='E'?'Efectivo':seleccionado.tipo_pago==='T'?'Tarjeta':'Transferencia'})</div>
                        )}
                      </div>
                    </div>

                    {/* Datos del cliente */}
                    <div className="mb-3" style={{ background: '#f9fafb', border: '1px solid #eef0f2', borderRadius: 8 }}>
                      <div className="row g-0">
                        <div className="col-12 col-md-6 p-3">
                          <div className="text-muted small">Paciente</div>
                          <div className="fw-semibold">{seleccionado.paciente_nombre} {seleccionado.paciente_apellido}</div>
                        </div>
                        <div className="col-12 col-md-6 p-3 border-top border-md-top-0 border-start-md">
                          <div className="text-muted small">Estado</div>
                          <div>{seleccionado.estado==='1'?'Pagado':'Pendiente'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '70%' }}>Concepto</th>
                            <th className="text-end" style={{ width: '30%' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(seleccionado.detalles||[]).map(d => (
                            <tr key={d.id_detalle_comprobante}>
                              <td>{d.concepto_pago || d.titulo_examen}</td>
                              <td className="text-end">$ {Number(d.total||0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td className="text-end fw-bold">Total</td>
                            <td className="text-end fw-bold">$ {Number(seleccionado.total||0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">Gracias por su preferencia</small>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm" onClick={exportarPdf} disabled={!seleccionado || seleccionado.estado !== '1'}>
                          Exportar PDF
                        </button>
                      </div>
                    </div>

                    {/* Pago */}
                    {seleccionado.estado === '0' && (
                      <div className="d-flex align-items-end gap-2 flex-wrap mt-3">
                        <div style={{ minWidth: 240 }}>
                          <label className="form-label small">Método de pago</label>
                          <select className="form-select" value={metodoPago} onChange={(e)=>setMetodoPago(e.target.value)}>
                            <option value="">Seleccione método</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                            <option value="transferencia">Transferencia Bancaria</option>
                          </select>
                        </div>
                        <button className="btn btn-info text-white" onClick={procesarPago}>Procesar pago</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagosAvila;