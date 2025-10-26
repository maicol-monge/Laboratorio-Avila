import React, { useEffect, useState } from "react";

export default function DatosGeneralesExamen({
  form,
  setForm,
  pacientes,
  selectedPaciente,
  setSelectedPaciente,
  onAddPaciente, // opcional: para recargar pacientes desde el padre
}) {
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    nombre: "",
    apellido: "",
    sexo: "M",
    fecha_nacimiento: "",
    edad: "",
    telefono: "",
    dui: "",
  });

  // Precarga datos del paciente seleccionado
  useEffect(() => {
    if (!selectedPaciente) return;
    const paciente = pacientes.find(p => p.id_paciente === Number(selectedPaciente));
    if (paciente) {
      setForm(f => ({
        ...f,
        edad: paciente.edad || "",
        sexo: paciente.sexo || "",
        // ...otros campos si tienes...
      }));
    }
  }, [selectedPaciente, pacientes, setForm]);

  const handleChange = (e, field) => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  // Lógica para agregar paciente rápido
  const handleQuickPaciente = async (e) => {
    e.preventDefault();
    // Aquí tu lógica para guardar el paciente (puedes usar axios)
    // Ejemplo:
    // await axios.post("http://localhost:5000/api/pacientes", quickForm);
    setShowPacienteModal(false);
    setQuickForm({
      nombre: "",
      apellido: "",
      sexo: "M",
      fecha_nacimiento: "",
      edad: "",
      telefono: "",
      dui: "",
    });
    if (onAddPaciente) onAddPaciente(); // recargar pacientes si lo necesitas
  };

  return (
    <div>
      {/* Selección de paciente */}
      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Paciente</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="form-select"
            value={selectedPaciente}
            onChange={(e) => setSelectedPaciente(e.target.value)}
          >
            <option value="">Seleccione un paciente</option>
            {pacientes.map((p) => (
              <option key={p.id_paciente} value={p.id_paciente}>
                {p.nombre} {p.apellido} {p.dui ? `(${p.dui})` : ""}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-info"
            type="button"
            onClick={() => setShowPacienteModal(true)}
          >
            + Paciente rápido
          </button>
        </div>
      </div>
      {/* Datos generales */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Edad</label>
          <input
            className="form-control"
            value={form.edad || ""}
            onChange={(e) => handleChange(e, "edad")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Sexo</label>
          <input
            className="form-control"
            value={form.sexo || ""}
            onChange={(e) => handleChange(e, "sexo")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Tipo de muestra</label>
          <input
            className="form-control"
            value={form.tipo_muestra || ""}
            onChange={(e) => handleChange(e, "tipo_muestra")}
          />
        </div>
      </div>
      {/* Modal para paciente rápido */}
      {showPacienteModal && (
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
          onClick={() => setShowPacienteModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleQuickPaciente}
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 12,
              minWidth: 320,
              boxShadow: "0 2px 8px #aaa",
            }}
          >
            <h5>Agregar paciente rápido</h5>
            <div className="mb-2">
              <label>Nombre</label>
              <input
                className="form-control"
                value={quickForm.nombre}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, nombre: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label>Apellido</label>
              <input
                className="form-control"
                value={quickForm.apellido}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, apellido: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-2">
              <label>Sexo</label>
              <select
                className="form-select"
                value={quickForm.sexo}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, sexo: e.target.value })
                }
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="mb-2">
              <label>Fecha de nacimiento</label>
              <input
                className="form-control"
                type="date"
                value={quickForm.fecha_nacimiento}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, fecha_nacimiento: e.target.value })
                }
              />
            </div>
            <div className="mb-2">
              <label>Edad</label>
              <input
                className="form-control"
                value={quickForm.edad}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, edad: e.target.value })
                }
              />
            </div>
            <div className="mb-2">
              <label>Teléfono</label>
              <input
                className="form-control"
                value={quickForm.telefono}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, telefono: e.target.value })
                }
              />
            </div>
            <div className="mb-2">
              <label>DUI</label>
              <input
                className="form-control"
                value={quickForm.dui}
                onChange={(e) =>
                  setQuickForm({ ...quickForm, dui: e.target.value })
                }
              />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPacienteModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}