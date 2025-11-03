import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
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
  const [selectedPlantilla, setSelectedPlantilla] = useState(
    nombresExamenes[0]
  );
  const [form, setForm] = useState({});
  const [examenes, setExamenes] = useState([]);
  const [selectedExamenId, setSelectedExamenId] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [listado, setListado] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  // Modo edición de un examen ya realizado
  const location = useLocation();
  const editId = location?.state?.editId || null;
  const [isExistingEdit, setIsExistingEdit] = useState(!!editId);
  const [isFieldsEditable, setIsFieldsEditable] = useState(false); // bloquea campos al entrar
  const navigate = useNavigate();

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
    if (!isExistingEdit) {
      setForm({});
      setEditIndex(null);
    }
  }, [selectedPlantilla, examenes, isExistingEdit]);

  const ComponenteExamen = componentesExamen[selectedPlantilla];

  // Cargar examen realizado para edición existente
  useEffect(() => {
    let ignore = false;
    const loadExisting = async () => {
      if (!editId) return;
      try {
        // preferir endpoint directo
        const { data } = await axios.get(
          `http://localhost:5000/api/examenes_realizados/${editId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (ignore) return;
        const record = data;
        const id_paciente = String(record.id_paciente);
        const id_examen = record.id_examen;
        // mapear plantilla por id_examen
        let plantilla = selectedPlantilla;
        const ex = examenes.find((x) => Number(x.id_examen) === Number(id_examen));
        if (ex) plantilla = ex.titulo_examen;
        // diagnostico puede venir como string JSON
        let diag = record.diagnostico;
        if (typeof diag === "string") {
          try { diag = JSON.parse(diag); } catch (_) { /* leave as string */ }
        }
        const tipo_muestra = diag?.tipo_muestra || "";
        const formFromDiag = { ...diag };
        if (formFromDiag && typeof formFromDiag === 'object') delete formFromDiag.tipo_muestra;

        setSelectedPaciente(id_paciente);
        if (plantilla) setSelectedPlantilla(plantilla);
        setSelectedExamenId(id_examen);
        setForm({ ...formFromDiag, tipo_muestra });
        setIsExistingEdit(true);
        setIsFieldsEditable(false);
      } catch (e) {
        // Fallback: intentar cargar todos y buscar
        try {
          const { data: all } = await axios.get(
            `http://localhost:5000/api/examenes_realizados`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          const record = (all || []).find((r) => Number(r.id_examen_realizado) === Number(editId));
          if (!record) return;
          const id_paciente = String(record.id_paciente);
          const id_examen = record.id_examen;
          let plantilla = selectedPlantilla;
          const ex = examenes.find((x) => Number(x.id_examen) === Number(id_examen));
          if (ex) plantilla = ex.titulo_examen;
          let diag = record.diagnostico;
          if (typeof diag === "string") { try { diag = JSON.parse(diag); } catch (_) {} }
          const tipo_muestra = diag?.tipo_muestra || "";
          const formFromDiag = { ...diag };
          if (formFromDiag && typeof formFromDiag === 'object') delete formFromDiag.tipo_muestra;
          setSelectedPaciente(id_paciente);
          if (plantilla) setSelectedPlantilla(plantilla);
          setSelectedExamenId(id_examen);
          setForm({ ...formFromDiag, tipo_muestra });
          setIsExistingEdit(true);
          setIsFieldsEditable(false);
        } catch (_) {}
      }
    };
    loadExisting();
    return () => { ignore = true; };
  }, [editId, examenes]);

  const handleCancelar = () => {
    Swal.fire({
      title: "¿Cancelar y salir?",
      text: "Los cambios no guardados se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "No, continuar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/examenes");
      }
    });
  };

  // Guardar en el listado local
  const handleGuardar = () => {
    try {
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

      // Notificación de éxito
      Swal.fire({
        icon: "success",
        title: "Examen agregado",
        text: "El examen fue agregado al listado.",
        toast: true,
        position: "top-end",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: error?.message || "Ocurrió un error al guardar el examen.",
      });
    }
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
        // Asegurarse de incluir tipo_muestra dentro del objeto diagnostico
        const diagnosticoToSend = {
          ...(examen.diagnostico || {}),
          tipo_muestra: examen.tipo_muestra || "",
        };

        await axios.post(
          "http://localhost:5000/api/examenes_realizados",
          {
            id_paciente: examen.id_paciente,
            id_examen: examen.id_examen,
            // el backend guarda `diagnostico` como JSON string; meter ahí tipo_muestra
            diagnostico: JSON.stringify(diagnosticoToSend),
            estado: "1",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }
      await Swal.fire({
        icon: "success",
        title: "Exámenes guardados",
        text: "Todos los exámenes fueron guardados correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });
      setListado([]);
      setForm({});
      setEditIndex(null);
      // Redirigir a la vista de exámenes realizados
      navigate("/examenes");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al guardar los exámenes. Inténtelo nuevamente.",
      });
    }
  };

  const handleEnableEdit = () => {
    setIsFieldsEditable(true);
  };

  const handleActualizar = async () => {
    try {
      if (!editId) return;
      // empaquetar diagnostico con tipo_muestra adentro
      const { tipo_muestra = "", ...diagnosticoData } = form || {};
      const diagnosticoToSend = { ...diagnosticoData, tipo_muestra };
      await axios.put(
        `http://localhost:5000/api/examenes_realizados/${editId}`,
        {
          id_paciente: Number(selectedPaciente),
          id_examen: Number(selectedExamenId),
          diagnostico: JSON.stringify(diagnosticoToSend),
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      await Swal.fire({
        icon: 'success',
        title: 'Examen actualizado',
        timer: 1400,
        showConfirmButton: false
      });
      navigate('/examenes');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el examen.' });
    }
  };

  return (
    <div style={{ marginLeft: 250, minHeight: "100vh", background: "#f4f4f4" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
        {/* Barra superior con botón Volver */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/examenes")}
          >
            ← Volver
          </button>
        </div>
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
              disabled={isExistingEdit}
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
                <div style={{ color: "#888", fontSize: 14 }}>
                  No hay exámenes guardados.
                </div>
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
                    <b>{ex.plantilla}</b>{" "}
                    {ex.tipo_muestra && `| Muestra: ${ex.tipo_muestra}`}
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
            {/* Botón finalizar (solo para nueva captura, no edición existente) */}
            {!isExistingEdit && (
              <button
                className="btn btn-info mt-3 w-100"
                type="button"
                disabled={listado.length === 0}
                onClick={handleFinalizar}
              >
                Finalizar y guardar todos
              </button>
            )}
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
              <fieldset disabled={isExistingEdit && !isFieldsEditable} style={{ border: 'none', padding: 0, margin: 0 }}>
                <ComponenteExamen
                  form={form}
                  setForm={setForm}
                  pacientes={pacientes}
                  selectedPaciente={selectedPaciente}
                  setSelectedPaciente={setSelectedPaciente}
                  lockPaciente={isExistingEdit}
                />
              </fieldset>
            )}
            {/* Botón Guardar */}
            <div className="d-flex justify-content-end gap-3 mt-4">
              <button
                className="btn btn-danger"
                type="button"
                onClick={handleCancelar}
              >
                Cancelar
              </button>
              {!isExistingEdit ? (
                <>
                  <button
                    className="btn btn-success"
                    type="button"
                    onClick={handleGuardar}
                    disabled={!selectedPaciente}
                  >
                    Guardar en listado
                  </button>
                  {!selectedPaciente && (
                    <small className="text-muted align-self-center">Seleccione un paciente para habilitar el guardado</small>
                  )}
                </>
              ) : (
                <>
                  {!isFieldsEditable ? (
                    <button className="btn btn-warning" type="button" onClick={handleEnableEdit}>
                      Editar
                    </button>
                  ) : (
                    <button className="btn btn-success" type="button" onClick={handleActualizar}>
                      Actualizar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
