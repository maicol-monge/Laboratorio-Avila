import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

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

  const pendientes = useMemo(() => comprobantes.filter(c => c.estado === '0'), [comprobantes]);
  const pagados = useMemo(() => comprobantes.filter(c => c.estado === '1'), [comprobantes]);

  return (
    <div style={{ marginLeft: 250, padding: 20, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container py-4" style={{ maxWidth: 1100, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #eee', minHeight: '70vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-3" style={{ padding: '0 8px' }}>
          <h2 className="mb-0" style={{ color: '#00C2CC' }}>Pagos</h2>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label small mb-0 me-1 text-muted">Mostrar</label>
            <select className="form-select form-select-sm" value={filtroEstado} onChange={(e)=>setFiltroEstado(e.target.value)} style={{ width: 200 }}>
              <option value="0">Pendientes</option>
              <option value="1">Pagados</option>
              <option value="">Todos</option>
            </select>
          </div>
        </div>

        <div className="row g-3" style={{ padding: '0 8px 12px' }}>
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                {loading ? (
                  <div className="text-center text-muted py-4">Cargando...</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {(filtroEstado===''?comprobantes:(filtroEstado==='0'?pendientes:pagados)).map(c => (
                      <li
                        key={c.id_comprobante}
                        className="list-group-item d-flex justify-content-between align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={()=>seleccionar(c)}
                      >
                        <div>
                          <div className="fw-semibold">Comprobante #{c.id_comprobante}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {c.paciente_nombre} {c.paciente_apellido} · {fmtDMY(c.fecha_emision)} · {c.estado==='1'?'Pagado':'Pendiente'}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold">$ {Number(c.total||0).toFixed(2)}</div>
                          {c.estado==='1' && (
                            <small className="text-muted">{c.tipo_pago==='E'?'Efectivo':c.tipo_pago==='T'?'Tarjeta':c.tipo_pago==='B'?'Transferencia':''}</small>
                          )}
                        </div>
                      </li>
                    ))}
                    {((filtroEstado===''?comprobantes:(filtroEstado==='0'?pendientes:pagados))).length===0 && (
                      <li className="list-group-item text-center text-muted">Sin resultados</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                {!seleccionado ? (
                  <div className="text-muted">Seleccione un comprobante para ver los detalles</div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0" style={{ color:'#00C2CC' }}>Comprobante #{seleccionado.id_comprobante}</h5>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm" onClick={exportarPdf} disabled={!seleccionado || seleccionado.estado !== '1'}>
                          Exportar PDF
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 text-muted">Paciente: {seleccionado.paciente_nombre} {seleccionado.paciente_apellido} · Fecha: {fmtDMY(seleccionado.fecha_emision)}</div>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th className="text-end">Total</th>
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

                    {seleccionado.estado === '0' ? (
                      <div className="d-flex align-items-end gap-2 flex-wrap">
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
                    ) : (
                      <div className="text-success">Pago completado ({seleccionado.tipo_pago==='E'?'Efectivo':seleccionado.tipo_pago==='T'?'Tarjeta':'Transferencia'})</div>
                    )}
                  </>
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