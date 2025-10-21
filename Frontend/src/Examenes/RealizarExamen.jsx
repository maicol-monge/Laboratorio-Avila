import { useState, useEffect } from "react";
import axios from "axios";
import ExamenOrina from "../components/TiposExamenes/ExamenOrina";
import ExamenQuimicaBasica from "../components/TiposExamenes/ExamenQuimicaBasica";
import ExamenHDLQuimica from "../components/TiposExamenes/ExamenHDLQuimica";
import ExamenHeces from "../components/TiposExamenes/ExamenHeces";
import ExamenHpEghSo from "../components/TiposExamenes/ExamenHpEghSo";
import ExamenHemograma from "../components/TiposExamenes/ExamenHemograma";
import ExamenTransasQuimica from "../components/TiposExamenes/ExamenTransasQuimica";
import ExamenHecesPam from "../components/TiposExamenes/ExamenHecesPam";
import DatosGeneralesExamen from "../Examenes/DatosGeneralesExamen";
import ExamenHpEgh from "../components/TiposExamenes/ExamenHpEgh";
import ExamenSustanPhEgh from "../components/TiposExamenes/ExamenSustanPhEgh";

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
  "Transas quimica": ExamenTransasQuimica,
  "heces+pam": ExamenHecesPam,
  "Hp + Egh": ExamenHpEgh,
  "sustan,ph+egh": ExamenSustanPhEgh,
};

export default function RealizarExamen() {
  const [selectedPlantilla, setSelectedPlantilla] = useState(nombresExamenes[0]);
  const [form, setForm] = useState({});
  const [examenes, setExamenes] = useState([]);
  const [selectedExamenId, setSelectedExamenId] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [listado, setListado] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

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
    setEditIndex(null);
  }, [selectedPlantilla, examenes]);

  const ComponenteExamen = componentesExamen[selectedPlantilla];

  // Guardar en el listado local
  const handleGuardar = () => {
    const tipo_muestra = form.tipo_muestra || "";
    const { tipo_muestra: _, ...diagnosticoData } = form;

    const examenData = {
      id_paciente: selectedPaciente,
      id_examen: selectedExamenId,
      tipo_muestra,
      diagnostico: { ...diagnosticoData },
      plantilla: selectedPlantilla,
    };

    if (editIndex !== null) {
      // Editar existente
      const nuevoListado = [...listado];
      nuevoListado[editIndex] = examenData;
      setListado(nuevoListado);
      setEditIndex(null);
    } else {
      // Agregar nuevo
      setListado([...listado, examenData]);
    }
    setForm({});
  };

  // Editar un examen del listado
  const handleEditar = (index) => {
    const examen = listado[index];
    setSelectedPlantilla(examen.plantilla);
    setSelectedPaciente(examen.id_paciente);
    setForm({ ...examen.diagnostico, tipo_muestra: examen.tipo_muestra });
    setEditIndex(index);
  };

  // Eliminar un examen del listado
  const handleEliminar = (index) => {
    const nuevoListado = listado.filter((_, i) => i !== index);
    setListado(nuevoListado);
    setEditIndex(null);
    setForm({});
  };

  // Enviar todos los exámenes del listado a la base de datos
  const handleFinalizar = async () => {
    try {
      for (const examen of listado) {
        await axios.post(
          "http://localhost:5000/api/examenes_realizados",
          {
            id_paciente: examen.id_paciente,
            id_examen: examen.id_examen,
            tipo_muestra: examen.tipo_muestra,
            diagnostico: JSON.stringify(examen.diagnostico),
            estado: "1",
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
      }
      alert("Todos los exámenes fueron guardados correctamente");
      setListado([]);
      setForm({});
      setEditIndex(null);
    } catch (err) {
      alert("Error al guardar los exámenes");
    }
  };

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
            {/* Listado de exámenes guardados */}
            <div style={{ marginTop: 32 }}>
              <h5 style={{ color: "#00C2CC" }}>Exámenes en listado</h5>
              {listado.length === 0 && (
                <div style={{ color: "#888", fontSize: 14 }}>No hay exámenes guardados.</div>
              )}
              {listado.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f7f7f7",
                    border: "1px solid #cce",
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <b>{ex.plantilla}</b> {ex.tipo_muestra && `| Muestra: ${ex.tipo_muestra}`}
                  </div>
                  <div>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEditar(idx)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleEliminar(idx)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Botón finalizar */}
            <button
              className="btn btn-info mt-3 w-100"
              type="button"
              disabled={listado.length === 0}
              onClick={handleFinalizar}
            >
              Finalizar y guardar todos
            </button>
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
            {/* Botón Guardar */}
            <div className="d-flex justify-content-end gap-3 mt-4">
              <button
                className="btn btn-success"
                type="button"
                onClick={handleGuardar}
              >
                Guardar en listado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}