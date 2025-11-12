import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function DetalleProducto() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location?.state?.id;

  const [insumo, setInsumo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

  const [movForm, setMovForm] = useState({ tipo_movimiento: "E", cantidad: 0, observacion: "" });

  const fetchInsumo = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/inventario/insumos/${id}`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setInsumo(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimientos = async () => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/inventario/movimientos/insumo/${id}`, { headers });
      if (!res.ok) throw new Error('Error al cargar movimientos');
      const data = await res.json();
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore for now
    }
  };

  // helper to format ISO date to DD/MM/YYYY
  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}`;
    } catch (e) {
      const t = iso.split && iso.split('T') ? iso.split('T')[0] : iso;
      const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
      return t;
    }
  };

  // Convert various date formats to yyyy-mm-dd for input[type=date]
  const toInputDate = (iso) => {
    if (!iso) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    try {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      return (iso && iso.split ? iso.split('T')[0] : '') || '';
    }
  };

  // Modal / edit form state for in-place editing
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('Editar Producto');
  const [form, setForm] = useState({
    nombre_insumo: '',
    descripcion: '',
    stock: '',
    stock_minimo: '',
    unidad_medida: '',
    fecha_vencimiento: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});

  const openEditModal = () => {
    if (!insumo) return;
    setModalTitle('Editar Producto');
    setForm({
      nombre_insumo: insumo.nombre_insumo || '',
      descripcion: insumo.descripcion || '',
      stock: insumo.stock != null ? String(insumo.stock) : '',
      stock_minimo: insumo.stock_minimo != null ? String(insumo.stock_minimo) : '',
      unidad_medida: insumo.unidad_medida || '',
      fecha_vencimiento: insumo.fecha_vencimiento ? toInputDate(insumo.fecha_vencimiento) : '',
    });
    setFormErrors({});
    setFormTouched({});
    setShowModal(true);
  };

  const handleFormChangeLocal = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (formTouched[name]) validateFieldLocal(name, value);
  };

  const handleFormBlurLocal = (e) => {
    const { name, value } = e.target;
    setFormTouched(t => ({ ...t, [name]: true }));
    validateFieldLocal(name, value);
  };

  const validateFieldLocal = (name, value) => {
    const errs = { ...formErrors };
    switch (name) {
      case 'nombre_insumo':
        if (!value.trim()) errs.nombre_insumo = 'El nombre del producto es obligatorio';
        else delete errs.nombre_insumo;
        break;
      case 'stock':
        if (value === '' || value === null) errs.stock = 'El stock es obligatorio';
        else if (parseInt(value) < 0) errs.stock = 'El stock no puede ser negativo';
        else delete errs.stock;
        break;
      case 'stock_minimo':
        if (value === '' || value === null) errs.stock_minimo = 'El stock mínimo es obligatorio';
        else if (parseInt(value) < 0) errs.stock_minimo = 'El stock mínimo no puede ser negativo';
        else if (parseInt(value) > Number(form.stock || 0)) errs.stock_minimo = 'El stock mínimo no puede ser mayor al stock';
        else delete errs.stock_minimo;
        break;
      case 'fecha_vencimiento':
        if (value) {
          const fv = new Date(value);
          const hoy = new Date(); hoy.setHours(0,0,0,0);
          if (fv < hoy) errs.fecha_vencimiento = 'La fecha de vencimiento no puede ser anterior a la fecha actual';
          else delete errs.fecha_vencimiento;
        } else delete errs.fecha_vencimiento;
        break;
      default:
        break;
    }
    setFormErrors(errs);
  };

  const validateFormLocal = () => {
    const keys = ['nombre_insumo','stock','stock_minimo','fecha_vencimiento'];
    keys.forEach(k => { setFormTouched(t => ({ ...t, [k]: true })); validateFieldLocal(k, form[k]); });
    return Object.keys(formErrors).length === 0;
  };

  const submitEdit = async (e) => {
    e && e.preventDefault();
    // simple validation
    const errs = {};
    if (!form.nombre_insumo || !form.nombre_insumo.trim()) errs.nombre_insumo = 'El nombre del producto es obligatorio';
    if (form.stock === '' || form.stock === null) errs.stock = 'El stock es obligatorio';
    if (form.stock_minimo === '' || form.stock_minimo === null) errs.stock_minimo = 'El stock mínimo es obligatorio';
    if (Object.keys(errs).length) { setFormErrors(errs); setFormTouched({ nombre_insumo:true, stock:true, stock_minimo:true }); return; }

    setLoading(true);
    try {
      const body = {
        nombre_insumo: form.nombre_insumo,
        descripcion: form.descripcion,
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo),
        unidad_medida: form.unidad_medida,
        fecha_vencimiento: form.fecha_vencimiento || null,
      };
      const res = await fetch(`http://localhost:5000/api/inventario/insumos/${id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Error al actualizar insumo');
      await fetchInsumo();
      await fetchMovimientos();
      setShowModal(false);
      Swal.fire('¡Guardado!', 'El producto ha sido actualizado.', 'success');
    } catch (err) {
      setError(err.message || 'Error al guardar');
      Swal.fire('Error', 'No se pudo guardar el producto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // navigate to inventory and pass id to open edit modal there (consumer can use state)
    navigate('/inventario', { state: { editId: id } });
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inventario/insumos/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Error al eliminar');
      await Swal.fire('Eliminado', 'Producto eliminado correctamente', 'success');
      navigate('/inventario');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar');
      Swal.fire('Error', 'No se pudo eliminar el producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumo();
    fetchMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleMovChange = (e) => {
    const { name, value } = e.target;
    setMovForm(f => ({ ...f, [name]: value }));
  };

  const submitMovimiento = async (e) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      const body = { id_insumo: Number(id), tipo_movimiento: movForm.tipo_movimiento, cantidad: Number(movForm.cantidad), observacion: movForm.observacion };
      const res = await fetch('http://localhost:5000/api/inventario/movimientos', { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Error al registrar movimiento');
      setMovForm({ tipo_movimiento: 'E', cantidad: 0, observacion: '' });
      await fetchInsumo();
      await fetchMovimientos();
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F0F0" }}>
      <div className="d-flex">
        <div className="flex-grow-1" style={{ marginLeft: "250px", padding: "20px" }}>
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-0">{insumo ? insumo.nombre_insumo : 'Detalle del Producto'}</h1>
                <div className="d-flex">
                <p>Gestión detallada del productoㅤ</p>
                <p>{insumo ? insumo.id_insumo : 'Detalle del Producto'}</p>
                </div>
              </div>
              <div>
                <button className="btn btn-info me-2" onClick={() => navigate(-1)}>Volver</button>
              </div>
            </div>

            {loading ? <div className="alert alert-info">Cargando...</div> : null}
            {error ? <div className="alert alert-danger">{error}</div> : null}

            {insumo && (
              <div className="row">
                <div className="col-md-5 mb-4">
                  <div className="card mb-4">
                    <div className="card-header bg-white">
                      <h5 className="card-title mb-0">{insumo.nombre_insumo}</h5>
                    </div>
                    <div className="card-body">
                      <div className="card mb-3 p-2">
                        <label className="form-label fw-bold mb-1">ID:</label>
                        <p className="mb-0">{insumo.id_insumo}</p>
                      </div>
                      <div className="card mb-3 p-2">
                        <label className="form-label fw-bold">Stock Actual</label>
                        <p className="mb-0">{insumo.stock}</p>
                      </div>
                      <div className="card mb-3 p-2">
                        <label className="form-label fw-bold">Stock Mínimo</label>
                        <p className="mb-0">{insumo.stock_minimo ?? '-'}</p>
                      </div>
                      <div className="card mb-3 p-2">
                        <label className="form-label fw-bold">Fecha de Vencimiento</label>
                        <p className="mb-0">{formatDate(insumo.fecha_vencimiento)}</p>
                      </div>
                      <div className="card mb-3 p-2">
                        <label className="form-label fw-bold">Descripción</label>
                        <p className="mb-0">{insumo.descripcion}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Acciones de Stock</h5>
                      <form onSubmit={submitMovimiento}>
                        <div className="mb-3">
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="tipo_movimiento"
                              id="entrada"
                              value="E"
                              checked={movForm.tipo_movimiento === 'E'}
                              onChange={handleMovChange}
                              disabled={loading}
                            />
                            <label className="form-check-label" htmlFor="entrada">
                              Entrada
                            </label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="tipo_movimiento"
                              id="salida"
                              value="S"
                              checked={movForm.tipo_movimiento === 'S'}
                              onChange={handleMovChange}
                              disabled={loading}
                            />
                            <label className="form-check-label" htmlFor="salida">
                              Salida
                            </label>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Cantidad</label>
                          <input
                            type="number"
                            className="form-control"
                            name="cantidad"
                            min="1"
                            value={movForm.cantidad}
                            onChange={handleMovChange}
                            disabled={loading}
                            required
                          />
                          {movForm.tipo_movimiento === 'S' && insumo && Number(movForm.cantidad) > Number(insumo.stock) && (
                            <div className="form-text text-danger">La salida no puede superar el stock actual ({insumo.stock}).</div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Motivo</label>
                          <input
                            type="text"
                            className="form-control"
                            name="observacion"
                            placeholder="Ingrese el motivo"
                            value={movForm.observacion}
                            onChange={handleMovChange}
                            disabled={loading}
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-info"
                          disabled={
                            loading ||
                            !movForm.cantidad ||
                            Number(movForm.cantidad) <= 0 ||
                            (movForm.tipo_movimiento === 'S' && insumo && Number(movForm.cantidad) > Number(insumo.stock))
                          }
                        >
                          {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                      </form>
                    </div>
                  </div>
                        <div className="d-flex gap-2 mt-2">
                          <button className="btn btn-primary" onClick={openEditModal} type="button">Editar</button>
                          <button className="btn btn-danger" onClick={handleDelete} type="button">Eliminar</button>
                        </div>
                </div>

                <div className="col-md-7 mb-4">
                  <div className="card">
                    <div className="card-header bg-white">
                      <h5 className="card-title mb-0">Historial de Movimientos</h5>
                    </div>
                    <div className="card-body">
                      <p className="text-muted">Registro completo de entradas y salidas</p>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Fecha</th>
                              <th>Tipo</th>
                              <th>Cantidad</th>
                              <th>Observación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movimientos.map(m => (
                              <tr key={m.id_movimiento}>
                                <td>{m.id_movimiento}</td>
                                <td>{m.created_at ? formatDate(m.created_at) : ''}</td>
                                <td>{m.tipo_movimiento === 'E' ? 'Entrada' : 'Salida'}</td>
                                <td>{m.cantidad}</td>
                                <td>{m.observacion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (in-place) */}
      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1} style={{ backgroundColor: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalTitle}</h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitEdit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Producto</label>
                  <input name="nombre_insumo" value={form.nombre_insumo} onChange={handleFormChangeLocal} onBlur={handleFormBlurLocal} type="text" className={`form-control ${formErrors.nombre_insumo ? 'is-invalid' : ''}`} required />
                  {formErrors.nombre_insumo && <div className="invalid-feedback">{formErrors.nombre_insumo}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <input name="descripcion" value={form.descripcion} onChange={handleFormChangeLocal} type="text" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Stock</label>
                  <input name="stock" value={form.stock} onChange={handleFormChangeLocal} onBlur={handleFormBlurLocal} type="number" className={`form-control ${formErrors.stock ? 'is-invalid' : ''}`} required min="0" />
                  {formErrors.stock && <div className="invalid-feedback">{formErrors.stock}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Stock mínimo</label>
                  <input name="stock_minimo" value={form.stock_minimo} onChange={handleFormChangeLocal} onBlur={handleFormBlurLocal} type="number" className={`form-control ${formErrors.stock_minimo ? 'is-invalid' : ''}`} required min="0" />
                  {formErrors.stock_minimo && <div className="invalid-feedback">{formErrors.stock_minimo}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Unidad</label>
                  <input name="unidad_medida" value={form.unidad_medida} onChange={handleFormChangeLocal} type="text" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fecha de Vencimiento</label>
                  <input name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={handleFormChangeLocal} onBlur={handleFormBlurLocal} type="date" className={`form-control ${formErrors.fecha_vencimiento ? 'is-invalid' : ''}`} min={new Date().toISOString().split('T')[0]} />
                  {formErrors.fecha_vencimiento && <div className="invalid-feedback">{formErrors.fecha_vencimiento}</div>}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={submitEdit} disabled={loading || Object.keys(formErrors).length > 0}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        body, html { margin: 0; padding: 0; }
        .table th { border-top: none; font-weight: 600; color: #6c757d; background-color: #f8f9fa; }
        .card { border: 1px solid #e0e0e0; border-radius: 8px; }
        .card-header { border-bottom: 1px solid #e0e0e0; padding: 15px 20px; }
        .card-body { padding: 20px; }
        .form-label { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
