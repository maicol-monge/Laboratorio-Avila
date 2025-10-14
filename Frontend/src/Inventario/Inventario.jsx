import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Inventario() {
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Agregar Producto");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para validaciones
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // token/headers
  const token = localStorage.getItem("token");
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  // form state
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre_insumo: "",
    descripcion: "",
    stock: 0,
    stock_minimo: 0,
    unidad_medida: "",
    fecha_vencimiento: "",
  });

  // fetch insumos
  const fetchInsumos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/inventario/insumos", {
        headers,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  // Convert various date formats to yyyy-mm-dd for input[type=date] value
  const toInputDate = (iso) => {
    if (!iso) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    try {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      return (iso && iso.split ? iso.split("T")[0] : "") || "";
    }
  };

  useEffect(() => {
    fetchInsumos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProductos = productos.filter(
    (p) =>
      (p.nombre_insumo &&
        p.nombre_insumo.toLowerCase().includes(search.toLowerCase())) ||
      (p.descripcion &&
        p.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  // Función de validación
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre del producto
    if (!form.nombre_insumo.trim()) {
      newErrors.nombre_insumo = "El nombre del producto es obligatorio";
    }

    // Validar stock
    if (form.stock === "" || form.stock === null) {
      newErrors.stock = "El stock es obligatorio";
    } else if (parseInt(form.stock) < 0) {
      newErrors.stock = "El stock no puede ser negativo";
    }

    // Validar stock mínimo
    if (form.stock_minimo === "" || form.stock_minimo === null) {
      newErrors.stock_minimo = "El stock mínimo es obligatorio";
    } else if (parseInt(form.stock_minimo) < 0) {
      newErrors.stock_minimo = "El stock mínimo no puede ser negativo";
    } else if (parseInt(form.stock_minimo) > parseInt(form.stock)) {
      newErrors.stock_minimo = "El stock mínimo no puede ser mayor al stock";
    }

    // Validar fecha de vencimiento
    if (form.fecha_vencimiento) {
      const fechaVencimiento = new Date(form.fecha_vencimiento);
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0); // Establecemos la hora a 00:00 para comparar solo fechas

      if (fechaVencimiento < fechaActual) {
        newErrors.fecha_vencimiento =
          "La fecha de vencimiento no puede ser anterior a la fecha actual";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar campo individual cuando pierde el foco
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "nombre_insumo":
        if (!value.trim()) {
          newErrors.nombre_insumo = "El nombre del producto es obligatorio";
        } else {
          delete newErrors.nombre_insumo;
        }
        break;

      case "stock":
        if (value === "" || value === null) {
          newErrors.stock = "El stock es obligatorio";
        } else if (parseInt(value) < 0) {
          newErrors.stock = "El stock no puede ser negativo";
        } else {
          delete newErrors.stock;
        }
        break;

      case "stock_minimo":
        if (value === "" || value === null) {
          newErrors.stock_minimo = "El stock mínimo es obligatorio";
        } else if (parseInt(value) < 0) {
          newErrors.stock_minimo = "El stock mínimo no puede ser negativo";
        } else if (parseInt(value) > parseInt(form.stock)) {
          newErrors.stock_minimo =
            "El stock mínimo no puede ser mayor al stock";
        } else {
          delete newErrors.stock_minimo;
        }
        break;

      case "fecha_vencimiento":
        if (value) {
          const fechaVencimiento = new Date(value);
          const fechaActual = new Date();
          fechaActual.setHours(0, 0, 0, 0);

          if (fechaVencimiento < fechaActual) {
            newErrors.fecha_vencimiento =
              "La fecha de vencimiento no puede ser anterior a la fecha actual";
          } else {
            delete newErrors.fecha_vencimiento;
          }
        } else {
          delete newErrors.fecha_vencimiento;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleAgregar = () => {
    setModalTitle("Agregar Producto");
    setEditingId(null);
    setForm({
      nombre_insumo: "",
      descripcion: "",
      stock: 0,
      stock_minimo: 0,
      unidad_medida: "",
      fecha_vencimiento: "",
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };
  const handleEditar = (producto) => {
    setModalTitle("Editar Producto");
    setEditingId(producto.id_insumo || producto.id);
    setForm({
      nombre_insumo: producto.nombre_insumo || producto.nombre || "",
      descripcion: producto.descripcion || "",
      // use strings for controlled inputs
      stock: producto.stock != null ? String(producto.stock) : "",
      stock_minimo: producto.stock_minimo != null ? String(producto.stock_minimo) : "",
      unidad_medida: producto.unidad_medida || "",
      fecha_vencimiento: producto.fecha_vencimiento
        ? toInputDate(producto.fecha_vencimiento)
        : "",
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/inventario/insumos/${id}`,
          {
            method: "DELETE",
            headers,
          }
        );
        if (!res.ok) throw new Error("Error al eliminar insumo");

        await fetchInsumos();

        // Mostrar mensaje de éxito
        Swal.fire("¡Eliminado!", "El producto ha sido eliminado.", "success");
      } catch (err) {
        setError(err.message || "Error al eliminar");

        // Mostrar mensaje de error
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Validar el campo si ya fue tocado
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    validateField(name, value);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Marcar todos los campos como tocados
    const allTouched = {
      nombre_insumo: true,
      stock: true,
      stock_minimo: true,
      fecha_vencimiento: true,
    };
    setTouched(allTouched);

    // Validar todo el formulario
    if (!validateForm()) {
      return; // Detener el envío si hay errores
    }

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

      if (!editingId) {
        const res = await fetch(
          "http://localhost:5000/api/inventario/insumos",
          {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) throw new Error("Error al crear insumo");
      } else {
        const res = await fetch(
          `http://localhost:5000/api/inventario/insumos/${editingId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) throw new Error("Error al actualizar insumo");
      }

      await fetchInsumos();
      setShowModal(false);
    } catch (err) {
      setError(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // PAGINACIÓN (igual a la imagen)
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.ceil(filteredProductos.length / perPage);
  const currentData = filteredProductos.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Alertas dinámicas (manteniendo diseño actual)
  const daysUntil = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const diff = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      // dd/mm/yyyy
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}`;
    } catch (e) {
      // try to fallback to common formats
      const t = iso.split('T')[0] || iso;
      // if already yyyy-mm-dd, convert to dd/mm/yyyy
      const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
      return t;
    }
  };

  // Expiration groups
  const expired = productos.filter((p) => {
    const d = daysUntil(p.fecha_vencimiento);
    return d !== null && d < 0;
  });

  const critical = productos.filter(
    (p) => typeof p.stock !== "undefined" && Number(p.stock) <= 0
  );
  const lowStock = productos.filter(
    (p) =>
      typeof p.stock !== "undefined" &&
      typeof p.stock_minimo !== "undefined" &&
      Number(p.stock) > 0 &&
      Number(p.stock) <= Number(p.stock_minimo)
  );
  const expiring = productos.filter((p) => {
    const d = daysUntil(p.fecha_vencimiento);
    return d !== null && d <= 30 && d >= 0;
  });

  return (
    <div
      className="d-flex"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Sidebar ya está en otra vista */}

      <div
        className="flex-grow-1"
        style={{ marginLeft: "250px", padding: "20px" }}
      >
        {/* Header */}
        <div className="d-flex align-items-center mb-2">
          <h1 className="h4 mb-0">Inventario</h1>
          <div className="ms-auto d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "220px" }}
            />
            <button
              className="btn btn-info text-white fw-semibold"
              onClick={handleAgregar}
            >
              Agregar Producto
            </button>
          </div>
        </div>
        <p className="text-muted">Gestión de insumos</p>
        {/* Tabla de productos */}
        <div className="card mb-3" style={{ height: "390px" }}>
          <div className="row align-items-center mb-3">
            <div className="col">
              <h5 className="mb-0">Lista de productos</h5>
            </div>
      <div className="col text-end">
        <span className="badge bg-success me-2">Stock Normal</span>
        <span className="badge bg-warning text-dark me-2">Stock Bajo</span>
        <span className="badge bg-danger me-2">Sin Stock</span>
        <span className="badge me-2" style={{backgroundColor: '#0d6efd', color: 'white'}}>Vencimiento lejano</span>
        <span className="badge me-2" style={{backgroundColor: '#fd7e14', color: 'white'}}>Vence pronto</span>
        <span className="badge" style={{backgroundColor: '#6f4e37', color: 'white'}}>Vencido</span>
      </div>
          </div>
          <div className="card-body p-0">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Id</th>
                  <th>Producto</th>
                  <th>Descripción</th>
                  <th>Stock</th>
                  <th>Unidad</th>
                  <th>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-3">
                      Cargando...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-3">
                      No hay productos
                    </td>
                  </tr>
                ) : (
                  currentData.map((p) => (
                    <tr key={p.id_insumo}>
                      <td>{p.id_insumo}</td>
                      <td>
                        <strong>{p.nombre_insumo}</strong>
                      </td>
                      <td>{p.descripcion}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-2`} style={{
                          backgroundColor:
                            Number(p.stock) <= 0
                              ? '#dc3545' // red
                              : Number(p.stock) <= Number(p.stock_minimo)
                              ? '#ffc107' // yellow (bootstrap warning)
                              : '#198754', // green (bootstrap success darker)
                          color: Number(p.stock) <= 0 ? 'white' : Number(p.stock) <= p.stock_minimo ? '#212529' : 'white'
                        }}>
                          {p.stock}
                        </span>
                      </td>
                      <td>{p.unidad_medida}</td>
                      <td>
                        <span className="badge rounded-pill px-3 py-2" style={{
                          backgroundColor: (() => {
                            const d = daysUntil(p.fecha_vencimiento);
                            if (d === null) return '#0d6efd'; // blue default
                            if (d < 0) return '#6f4e37'; // brown for expired
                            if (d <= 30) return '#fd7e14'; // orange for warning
                            return '#0d6efd'; // blue for far
                          })(),
                          color: '#fff'
                        }}>
                          {formatDate(p.fecha_vencimiento)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() =>
                            navigate("/producto", {
                              state: { id: p.id_insumo },
                            })
                          }
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEditar(p)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(p.id_insumo)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        <nav>
          <ul className="pagination pagination-sm justify-content-end">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i + 1}
                className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>

        {/* Alertas y advertencias (dinámicas, mismo diseño) */}
        <div className="alertas mt-3 card">
          <div className="row g-3 p-3">
            <div className="col-md-6">
              <h6 className="fw-bold" style={{color: ' #00C2CC'}}>Alertas de Stock</h6>
              {critical.length === 0 && lowStock.length === 0 ? (
                <div className="bg-light p-2 rounded text-muted">
                  No hay alertas de stock
                </div>
              ) : (
                <>
                  {critical.slice(0, 3).map((p) => (
                    <div
                      key={`crit-${p.id_insumo}`}
                      className="p-2 rounded mb-2"
                      style={{backgroundColor: 'rgba(220,53,69,0.08)', color: '#dc3545'}}
                    >
                      <strong>{p.nombre_insumo}</strong>
                      <br />
                      Stock agotado: {p.stock}
                    </div>
                  ))}
                  {lowStock
                    .slice(0, 3 - Math.min(critical.length, 3))
                    .map((p) => (
                      <div
                        key={`low-${p.id_insumo}`}
                        className="p-2 rounded mb-2"
                        style={{backgroundColor: 'rgba(255,193,7,0.08)', color: '#856404'}}
                      >
                        <strong>{p.nombre_insumo}</strong>
                        <br />
                        Stock bajo: {p.stock} (mín {p.stock_minimo})
                      </div>
                    ))}
                  {critical.length + lowStock.length > 3 && (
                    <div className="small text-muted">
                      y {critical.length + lowStock.length - 3} más...
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="col-md-6">
              <h6 className="fw-bold" style={{color: ' #00C2CC'}}>Alertas de Caducidad</h6>
              {/* Mostrar vencidos primero */}
              {expired.length > 0 && (
                <>
                  <div className="small mb-1" style={{color: '#6f4e37'}}><strong>Vencidos</strong></div>
                  {expired.slice(0, 3).map((p) => (
                    <div
                      key={`expd-${p.id_insumo}`}
                      className="p-2 rounded mb-2"
                      style={{backgroundColor: 'rgba(111,78,55,0.08)', color: '#6f4e37'}}
                    >
                      <strong>{p.nombre_insumo}</strong>
                      <br />
                      Vencido: {formatDate(p.fecha_vencimiento)}
                    </div>
                  ))}
                  {expired.length > 3 && (
                    <div className="small text-muted mb-2">y {expired.length - 3} más...</div>
                  )}
                </>
              )}

              {/* Luego items próximos a vencer */}
              {expiring.length === 0 ? (
                expiring.length === 0 && expired.length === 0 ? (
                  <div className="p-2 rounded" style={{backgroundColor: 'rgba(13,110,253,0.08)', color: '#0d6efd'}}>
                    Sin alertas de caducidad
                  </div>
                ) : null
              ) : (
                <>
                  <div className="small mb-1" style={{color: '#fd7e14'}}><strong>Próximos a vencer</strong></div>
                  {expiring.slice(0, 3).map((p) => (
                    <div
                      key={`exp-${p.id_insumo}`}
                      className="p-2 rounded mb-2"
                      style={{backgroundColor: 'rgba(253,126,20,0.08)', color: '#fd7e14'}}
                    >
                      <strong>{p.nombre_insumo}</strong>
                      <br />
                      Vence en {daysUntil(p.fecha_vencimiento)} días
                    </div>
                  ))}
                  {expiring.length > 3 && (
                    <div className="small text-muted">y {expiring.length - 3} más...</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`modal fade ${showModal ? "show d-block" : ""}`}
        tabIndex="-1"
        style={{
          backgroundColor: showModal ? "rgba(0,0,0,0.5)" : "transparent",
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalTitle}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleFormSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Producto</label>
                  <input
                    name="nombre_insumo"
                    value={form.nombre_insumo}
                    onChange={handleFormChange}
                    onBlur={handleBlur}
                    type="text"
                    className={`form-control ${
                      errors.nombre_insumo ? "is-invalid" : ""
                    }`}
                    required
                  />
                  {errors.nombre_insumo && (
                    <div className="invalid-feedback">
                      {errors.nombre_insumo}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <input
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleFormChange}
                    type="text"
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Stock</label>
                  <input
                    name="stock"
                    value={form.stock}
                    onChange={handleFormChange}
                    onBlur={handleBlur}
                    type="number"
                    className={`form-control ${
                      errors.stock ? "is-invalid" : ""
                    }`}
                    required
                    disabled={editingId !== null}
                    min="0"
                  />
                  {errors.stock && (
                    <div className="invalid-feedback">{errors.stock}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Stock mínimo</label>
                  <input
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={handleFormChange}
                    onBlur={handleBlur}
                    type="number"
                    className={`form-control ${
                      errors.stock_minimo ? "is-invalid" : ""
                    }`}
                    required
                    min="0"
                  />
                  {errors.stock_minimo && (
                    <div className="invalid-feedback">
                      {errors.stock_minimo}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Unidad</label>
                  <input
                    name="unidad_medida"
                    value={form.unidad_medida}
                    onChange={handleFormChange}
                    type="text"
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fecha de Vencimiento</label>
                  <input
                    name="fecha_vencimiento"
                    value={form.fecha_vencimiento}
                    onChange={handleFormChange}
                    onBlur={handleBlur}
                    type="date"
                    className={`form-control ${
                      errors.fecha_vencimiento ? "is-invalid" : ""
                    }`}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.fecha_vencimiento && (
                    <div className="invalid-feedback">
                      {errors.fecha_vencimiento}
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFormSubmit}
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
