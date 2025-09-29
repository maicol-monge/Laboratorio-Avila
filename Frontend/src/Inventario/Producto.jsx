import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
                        <label className="form-label fw-bold">Fecha de Vencimiento</label>
                        <p className="mb-0">{insumo.fecha_vencimiento ? insumo.fecha_vencimiento.split('T')[0] : '-'}</p>
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
                                <td>{m.created_at ? m.created_at.split('T')[0] : ''}</td>
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
