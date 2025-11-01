import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DatosGeneralesExamen from "./DatosGeneralesExamen";
import ExamenOrina from "../components/TiposExamenes/ExamenOrina";
import ExamenQuimicaBasica from "../components/TiposExamenes/ExamenQuimicaBasica";
import ExamenHDLQuimica from "../components/TiposExamenes/ExamenHDLQuimica";
import ExamenHeces from "../components/TiposExamenes/ExamenHeces";
import ExamenHpEghSo from "../components/TiposExamenes/ExamenHpEghSo";
import ExamenHemograma from "../components/TiposExamenes/ExamenHemograma";
import ExamenTransasQuimica from "../components/TiposExamenes/ExamenTransasQuimica";
import ExamenHecesPam from "../components/TiposExamenes/ExamenHecesPam";
import ExamenHpEgh from "../components/TiposExamenes/ExamenHpEgh";
import ExamenSustanPhEgh from "../components/TiposExamenes/ExamenSustanPhEgh";

const componentesExamen = {
  orina: ExamenOrina,
  "(Basi) quimica": ExamenQuimicaBasica,
  "(HDL) quimica": ExamenHDLQuimica,
  heces: ExamenHeces,
  "Hp + Egh+so": ExamenHpEghSo,
  hemograma: ExamenHemograma,
  "Transas quimica": ExamenTransasQuimica,
  "heces+pam": ExamenHecesPam,
  "Hp + Egh": ExamenHpEgh,
  "sustan,ph+egh": ExamenSustanPhEgh,
};

export default function EditarExamenRealizado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examen, setExamen] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [form, setForm] = useState({});
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedExamenTitulo, setSelectedExamenTitulo] = useState("");
  const [mode, setMode] = useState("view"); // 'view' o 'edit'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };

    // Cargar pacientes y plantillas
    axios
      .get("http://localhost:5000/api/pacientes", { headers })
      .then((r) => setPacientes(r.data));
    axios
      .get("http://localhost:5000/api/examenes", { headers })
      .then((r) => setExamenes(r.data));

    // Cargar examen realizado por id
    axios
      .get(`http://localhost:5000/api/examenes_realizados/${id}`, { headers })
      .then((res) => {
        const data = res.data;
        setExamen(data);
        // diagnostico ya viene como objeto desde backend
        setForm(data.diagnostico || {});
        setSelectedPaciente(data.id_paciente || "");
        // Encontrar título de la plantilla según id_examen
        axios
          .get("http://localhost:5000/api/examenes", { headers })
          .then((r) => {
            setExamenes(r.data);
            const match = r.data.find((e) => e.id_examen === data.id_examen);
            setSelectedExamenTitulo(match ? match.titulo_examen : "");
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [id]);

  const ComponenteExamen = componentesExamen[selectedExamenTitulo];

  const handleSave = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      await axios.put(
        `http://localhost:5000/api/examenes_realizados/${id}`,
        {
          id_paciente: Number(selectedPaciente),
          // buscar id_examen por titulo
          id_examen: examenes.find(
            (e) => e.titulo_examen === selectedExamenTitulo
          )?.id_examen,
          diagnostico: form,
          estado: examen?.estado || "1",
        },
        { headers }
      );
      alert("Examen actualizado");
      navigate("/examenes");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar");
    }
  };

  if (loading)
    return <div style={{ marginLeft: 250, padding: 20 }}>Cargando...</div>;

  if (!examen)
    return (
      <div style={{ marginLeft: 250, padding: 20 }}>Examen no encontrado</div>
    );

  return (
    <div style={{ marginLeft: 250, minHeight: "100vh", background: "#f4f4f4" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h2 style={{ color: "#00C2CC" }}>Ver / Editar Examen Realizado</h2>
          <div>
            {mode === "view" ? (
              <button
                className="btn btn-warning"
                onClick={() => setMode("edit")}
              >
                Editar
              </button>
            ) : (
              <>
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setMode("view");
                  }}
                >
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={handleSave}>
                  Guardar
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ color: "#888", marginBottom: 16 }}>
          Puede ver los datos o pasar a modo edición.
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          <div
            style={{
              minWidth: 320,
              background: "#fff",
              borderRadius: 10,
              padding: 24,
            }}
          >
            <div style={{ marginTop: 4 }}>
              <label className="form-label">Plantilla de examen</label>
              {mode === "view" ? (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f8f9fa",
                    borderRadius: 6,
                    color: "#333",
                  }}
                >
                  {selectedExamenTitulo || "Sin plantilla"}
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedExamenTitulo}
                  onChange={(e) => setSelectedExamenTitulo(e.target.value)}
                >
                  <option value="">Seleccione plantilla</option>
                  {examenes.map((ex) => (
                    <option key={ex.id_examen} value={ex.titulo_examen}>
                      {ex.titulo_examen}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 10,
              padding: 24,
            }}
          >
            <div style={{ marginTop: 16 }}>
              {ComponenteExamen ? (
                <ComponenteExamen
                  form={form}
                  setForm={setForm}
                  pacientes={pacientes}
                  selectedPaciente={selectedPaciente}
                  setSelectedPaciente={setSelectedPaciente}
                  readOnly={mode === "view"}
                />
              ) : (
                <div style={{ color: "#888" }}>
                  No hay componente específico para esta plantilla.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
