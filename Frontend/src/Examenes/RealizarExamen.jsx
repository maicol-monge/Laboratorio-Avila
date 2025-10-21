import { useState, useEffect } from "react";
import axios from "axios";
import ExamenOrina from "../components/TiposExamenes/ExamenOrina";
import ExamenQuimicaBasica from "../components/TiposExamenes/ExamenQuimicaBasica";
import ExamenHDLQuimica from "../components/TiposExamenes/ExamenHDLQuimica";
import ExamenHeces from "../components/TiposExamenes/ExamenHeces";
import ExamenHpEghSo from "../components/TiposExamenes/ExamenHpEghSo";
import ExamenHemograma from "../components/TiposExamenes/ExamenHemograma";
import DatosGeneralesExamen from "../Examenes/DatosGeneralesExamen";

const nombresExamenes = [
  "Hp + Egh",
  "sustan,ph+egh",
  "Hp + Egh+so",
  "hemograma",
  "Transas quimica",
  "heces+pam",
  "(Basi) quimica",
  "(HDL) quimica",
  "orina",
  "heces",
];

const componentesExamen = {
  orina: ExamenOrina,
  "(Basi) quimica": ExamenQuimicaBasica,
  "(HDL) quimica": ExamenHDLQuimica,
  heces: ExamenHeces,
  "Hp + Egh+so": ExamenHpEghSo,
  hemograma: ExamenHemograma,
};

export default function RealizarExamen() {
  const [selectedPlantilla, setSelectedPlantilla] = useState(nombresExamenes[0]);
  const [form, setForm] = useState({});
  const [examenes, setExamenes] = useState([]);
  const [selectedExamenId, setSelectedExamenId] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/examenes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setExamenes(res.data));
    axios
      .get("http://localhost:5000/api/pacientes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setPacientes(res.data));
  }, []);

  useEffect(() => {
    const ex = examenes.find((x) => x.titulo_examen === selectedPlantilla);
    setSelectedExamenId(ex ? ex.id_examen : "");
    setForm({});
  }, [selectedPlantilla, examenes]);

  const ComponenteExamen = componentesExamen[selectedPlantilla];

  return (
    <div style={{ marginLeft: 250, minHeight: "100vh", background: "#f4f4f4" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
        <h2 style={{ color: "#00C2CC" }}>Registrar Examen</h2>
        <div style={{ color: "#888", marginBottom: 16 }}>
          Complete los datos del examen
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {/* Selección de examen */}
          <div
            style={{
              minWidth: 280,
              background: "#fff",
              border: "2px solid #ccc",
              borderRadius: 10,
              padding: 24,
              marginBottom: 24,
              height: "fit-content",
            }}
          >
            <div className="mb-3 fw-bold">Seleccionar Examen</div>
            <label className="form-label">Tipo de examen</label>
            <select
              className="form-select"
              value={selectedPlantilla}
              onChange={(e) => setSelectedPlantilla(e.target.value)}
            >
              {nombresExamenes.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          {/* Formulario de datos */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 10,
              padding: 24,
              minWidth: 400,
            }}
          >
            {/* Componente del examen seleccionado */}
            {ComponenteExamen && (
              <ComponenteExamen
                form={form}
                setForm={setForm}
                pacientes={pacientes}
                selectedPaciente={selectedPaciente}
                setSelectedPaciente={setSelectedPaciente}
              />
            )}
            {/* Botones */}
            <div className="d-flex justify-content-end gap-3 mt-4">
              <button
                className="btn btn-success"
                type="button"
                onClick={() => handleSubmit("1")}
              >
                Guardar
              </button>
              <button
                className="btn btn-info"
                type="button"
                onClick={() => handleSubmit("2")}
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}