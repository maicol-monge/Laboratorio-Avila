import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
        })
        .catch(() => {
          alert("Error al editar la plantilla");
        });
    }
  };

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
          maxWidth: 900,
          margin: "40px auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #eee",
        }}
      >
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>
        <h2 className="mb-4 text-center" style={{ color: "#00C2CC" }}>
          Plantillas de Exámenes
        </h2>
        {loading ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Precio</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {examenes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    No hay plantillas registradas.
                  </td>
                </tr>
              ) : (
                examenes.map((ex) => (
                  <tr key={ex.id_examen}>
                    <td>{ex.id_examen}</td>
                    <td>{ex.titulo_examen}</td>
                    <td>${ex.precio}</td>
                    <td>{ex.descripcion}</td>
                    <td>{ex.estado === "1" ? "Activo" : "Inactivo"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
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
        )}

        {/* Modal solo para editar */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={handleCloseModal}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              style={{
                background: "#fff",
                padding: 32,
                borderRadius: 12,
                minWidth: 320,
                boxShadow: "0 2px 8px #aaa",
              }}
            >
              <h4 className="mb-3">Editar plantilla</h4>
              <div className="mb-2">
                <label className="form-label">Título</label>
                <input
                  type="text"
                  name="titulo_examen"
                  className="form-control"
                  value={form.titulo_examen}
                  onChange={handleChange}
                  required
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
                <input
                  type="text"
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
                  className="form-control"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>
              <div className="d-flex justify-content-end mt-3 gap-2">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrudExamenes;