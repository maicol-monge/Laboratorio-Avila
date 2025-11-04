import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function CrudExamenes() {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExamen, setEditExamen] = useState(null);
  const [form, setForm] = useState({
    titulo_examen: "",
    precio: "",
    descripcion: "",
    estado: "1",
  });
  // UI filters/search/sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortPrice, setSortPrice] = useState("none"); // none | asc | desc
  const [filterEstado, setFilterEstado] = useState(""); // '' | '1' | '0'
  const navigate = useNavigate();

  useEffect(() => {
    cargarExamenes();
  }, []);

  const cargarExamenes = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/examenes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        setExamenes(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleOpenModal = (examen) => {
    setEditExamen(examen);
    setForm({
      titulo_examen: examen.titulo_examen,
      precio: examen.precio,
      descripcion: examen.descripcion,
      estado: examen.estado,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditExamen(null);
    setForm({ titulo_examen: "", precio: "", descripcion: "", estado: "1" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "precio" ? Number(value) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editExamen) {
      axios
        .put(
          `http://localhost:5000/api/examenes/${editExamen.id_examen}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        .then(() => {
          cargarExamenes();
          handleCloseModal();
          Swal.fire({
            title: "Examen actualizado",
            text: `Se guardaron los cambios de "${form.titulo_examen}"`,
            icon: "success",
            timer: 1600,
            showConfirmButton: false,
            showClass: { popup: 'animate__animated animate__fadeInDown' },
            hideClass: { popup: 'animate__animated animate__fadeOutUp' }
          });
        })
        .catch(() => {
          Swal.fire({
            title: "Error",
            text: "Error al editar el examen",
            icon: "error",
          });
        });
    }
  };

  // Derived data: search, filter by estado, sort by price
  const filteredSorted = useMemo(() => {
    let list = Array.isArray(examenes) ? [...examenes] : [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((x) =>
        String(x.titulo_examen || "").toLowerCase().includes(q) ||
        String(x.descripcion || "").toLowerCase().includes(q)
      );
    }
    if (filterEstado === '1' || filterEstado === '0') {
      list = list.filter((x) => String(x.estado) === filterEstado);
    }
    if (sortPrice === 'asc') {
      list.sort((a, b) => Number(a.precio) - Number(b.precio));
    } else if (sortPrice === 'desc') {
      list.sort((a, b) => Number(b.precio) - Number(a.precio));
    }
    return list;
  }, [examenes, searchQuery, sortPrice, filterEstado]);

  return (
    <div
      style={{
        marginLeft: 250,
        padding: 20,
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      <div
        className="container py-4"
        style={{
          maxWidth: 1100,
          margin: "40px auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #eee",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
          <h2 className="mb-0" style={{ color: "#00C2CC" }}>
            Catálogo de Exámenes
          </h2>
          <div style={{ width: 110 }} />
        </div>

        {/* Filtros y buscador */}
        <div className="card mb-3">
          <div className="card-body py-3">
            <div className="d-flex flex-wrap gap-2 align-items-end">
              <div className="d-flex flex-column" style={{ minWidth: 260 }}>
                <label className="form-label small mb-1">Buscar</label>
                <input
                  className="form-control"
                  placeholder="Título o descripción"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="d-flex flex-column" style={{ width: 220 }}>
                <label className="form-label small mb-1">Ordenar por precio</label>
                <select
                  className="form-select"
                  value={sortPrice}
                  onChange={(e) => setSortPrice(e.target.value)}
                >
                  <option value="none">— Sin ordenar —</option>
                  <option value="asc">Menor a mayor</option>
                  <option value="desc">Mayor a menor</option>
                </select>
              </div>
              <div className="d-flex flex-column" style={{ width: 220 }}>
                <label className="form-label small mb-1">Estado</label>
                <select
                  className="form-select"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="">— Todos —</option>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>
              <div className="ms-auto">
                <button
                  className="btn btn-sm btn-info text-white"
                  onClick={() => {
                    setSearchQuery("");
                    setSortPrice("none");
                    setFilterEstado("");
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th style={{ width: 260 }}>Título</th>
                  <th style={{ width: 120 }}>Precio</th>
                  <th>Descripción</th>
                  <th style={{ width: 130 }}>Estado</th>
                  <th style={{ width: 120 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No hay plantillas registradas.
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map((ex) => (
                    <tr key={ex.id_examen}>
                      <td>{ex.id_examen}</td>
                      <td className="fw-semibold">{ex.titulo_examen}</td>
                      <td>${Number(ex.precio).toFixed(2)}</td>
                      <td>{ex.descripcion}</td>
                      <td>
                        {String(ex.estado) === '1' ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-secondary">Inactivo</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info text-white"
                          onClick={() => handleOpenModal(ex)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal solo para editar - estilo Bootstrap */}
        {showModal && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar plantilla</h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Título</label>
                      <input
                        type="text"
                        name="titulo_examen"
                        className="form-control"
                        value={form.titulo_examen}
                        onChange={handleChange}
                        required
                        disabled
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Precio</label>
                      <input
                        type="number"
                        name="precio"
                        className="form-control"
                        value={form.precio}
                        onChange={handleChange}
                        required
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Descripción</label>
                      <textarea
                        name="descripcion"
                        className="form-control"
                        value={form.descripcion}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Estado</label>
                      <select
                        name="estado"
                        className="form-select"
                        value={form.estado}
                        onChange={handleChange}
                      >
                        <option value="1">Activo</option>
                        <option value="0">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cerrar
                    </button>
                    <button type="submit" className="btn btn-info text-white">
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrudExamenes;