import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Examenes() {
  const [examenesRealizados, setExamenesRealizados] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar exámenes realizados
    axios
      .get("http://localhost:5000/api/examenes_realizados", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        setExamenesRealizados(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Cargar pacientes
    axios
      .get("http://localhost:5000/api/pacientes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => setPacientes(res.data));

    // Cargar exámenes plantilla
    axios
      .get("http://localhost:5000/api/examenes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => setExamenes(res.data));
  }, []);

  // Helpers para mostrar nombre y tipo
  const getPacienteNombre = (id) => {
    const p = pacientes.find((x) => x.id_paciente === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  };

  const getExamenNombre = (id) => {
    const ex = examenes.find((x) => x.id_examen === id);
    return ex ? ex.titulo_examen : id;
  };

  // Función para exportar examen realizado a .docx
  const exportExamen = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/examenes_realizados/${id}/export`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Crear blob y forzar descarga
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `examen_${id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando examen:", err);
      alert(
        "Error al exportar el examen. Revisa la consola del navegador y el servidor."
      );
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
          maxWidth: 1100,
          margin: "40px auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #eee",
          minHeight: "70vh",
        }}
      >
        <h2 className="mb-4 text-center" style={{ color: "#00C2CC" }}>
          Exámenes Realizados
        </h2>
        <div className="d-flex justify-content-center mb-4 gap-3">
          <button
            className="btn btn-success"
            onClick={() => navigate("/realizar-examen")}
          >
            Registrar examen a paciente
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/crud-examenes")}
          >
            Gestionar plantillas de exámenes
          </button>
        </div>
        {loading ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th style={{ width: 180 }}>Paciente</th>
                  <th style={{ width: 180 }}>Examen</th>
                  <th>Diagnóstico</th>
                  <th style={{ width: 100 }}>Estado</th>
                  <th style={{ width: 120 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {examenesRealizados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No hay exámenes realizados.
                    </td>
                  </tr>
                ) : (
                  examenesRealizados.map((ex) => (
                    <tr key={ex.id_examen_realizado}>
                      <td>{ex.id_examen_realizado}</td>
                      <td>{getPacienteNombre(ex.id_paciente)}</td>
                      <td>{getExamenNombre(ex.id_examen)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() =>
                              navigate(
                                `/editar-examen-realizado/${ex.id_examen_realizado}`
                              )
                            }
                          >
                            Ver/Editar
                          </button>
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => exportExamen(ex.id_examen_realizado)}
                          >
                            Exportar
                          </button>
                        </div>
                      </td>
                      <td>{ex.estado === "1" ? "Activo" : "Inactivo"}</td>
                      <td>{ex.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Examenes;
