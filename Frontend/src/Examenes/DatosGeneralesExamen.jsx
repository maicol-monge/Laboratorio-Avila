import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';

export default function DatosGeneralesExamen({
  form,
  setForm,
  pacientes,
  selectedPaciente,
  setSelectedPaciente,
  onAddPaciente, // opcional: para recargar pacientes desde el padre
  lockPaciente = false,
}) {
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [pacienteQuery, setPacienteQuery] = useState("");
  const [tempPacientes, setTempPacientes] = useState([]); // opciones temporales para que aparezca seleccionado de inmediato
  const [quickForm, setQuickForm] = useState({
    nombre: "",
    apellido: "",
    sexo: "M",
    fecha_nacimiento: "",
    edad: "",
    telefono: "",
    dui: "",
  });

  // axios instance
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const api = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  // helpers: formatters and date utils
  const formatTelefonoInput = (value) =>
    value.replace(/\D/g, "").slice(0, 8).replace(/(\d{4})(\d{0,4})/, "$1-$2");

  const formatDuiInput = (value) =>
    value.replace(/\D/g, "").slice(0, 9).replace(/(\d{8})(\d{0,1})/, "$1-$2");

  const normalizeFechaToISO = (val) => {
    if (!val) return null;
    // accept DD/MM/YYYY or YYYY-MM-DD
    if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }
    return val;
  };

  // edad local a partir de fecha_nacimiento o campo edad ingresado
  const quickEdadLocal = (() => {
    if (!quickForm) return null;
    if (quickForm.fecha_nacimiento) {
      try {
        const iso = normalizeFechaToISO(quickForm.fecha_nacimiento);
        if (!iso) return null;
        const f = new Date(iso);
        if (isNaN(f.getTime())) return null;
        const hoy = new Date();
        let edad = hoy.getFullYear() - f.getFullYear();
        const mm = hoy.getMonth() - f.getMonth();
        if (mm < 0 || (mm === 0 && hoy.getDate() < f.getDate())) edad--;
        return edad;
      } catch (e) {
        return null;
      }
    }
    if (
      quickForm.edad !== "" &&
      quickForm.edad !== null &&
      typeof quickForm.edad !== "undefined"
    ) {
      const n = Number(quickForm.edad);
      if (Number.isFinite(n)) return n;
    }
    return null;
  })();

  // limpiar DUI cuando es menor de edad
  useEffect(() => {
    const isAdult =
      (quickEdadLocal !== null && quickEdadLocal >= 18) ||
      (!quickForm.fecha_nacimiento &&
        quickForm.edad !== "" &&
        Number(quickForm.edad) >= 18);
    if (!isAdult && quickForm.dui) {
      setQuickForm((q) => ({ ...q, dui: "" }));
    }
  }, [quickEdadLocal, quickForm.fecha_nacimiento, quickForm.edad]);

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

  // Cuando el padre ya incluye los temporales, limpiarlos para no duplicar
  useEffect(() => {
    if (!Array.isArray(tempPacientes) || tempPacientes.length === 0) return;
    const filtered = tempPacientes.filter(tp => !pacientes.some(p => Number(p.id_paciente) === Number(tp.id_paciente)));
    if (filtered.length !== tempPacientes.length) setTempPacientes(filtered);
  }, [pacientes]);

  const handleChange = (e, field) => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  // Lógica para agregar paciente rápido
  const handleQuickPaciente = async (e) => {
    e.preventDefault();
    try {
      // validaciones básicas
      if (!quickForm.nombre || !quickForm.apellido)
        return Swal.fire({
          icon: 'warning',
          title: 'Dato requerido',
          text: 'Nombre y Apellido son obligatorios.',
          confirmButtonColor: '#17a2b8'
        });
      if (!quickForm.sexo || !/^[MF]$/.test(String(quickForm.sexo).toUpperCase()))
        return Swal.fire({
          icon: 'warning',
          title: 'Dato requerido',
          text: 'Seleccione el sexo del paciente.',
          confirmButtonColor: '#17a2b8'
        });

      const fn = normalizeFechaToISO(quickForm.fecha_nacimiento);
      if (!fn && (quickForm.edad === "" || quickForm.edad === null))
        return Swal.fire({
          icon: 'warning',
          title: 'Dato requerido',
          text: 'Ingrese Fecha de Nacimiento o Edad.',
          confirmButtonColor: '#17a2b8'
        });
      if (fn) {
        const fnDate = (fn.split && fn.split("T")[0]) || fn;
        const today = new Date();
        const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        if (fnDate > todayYMD) return Swal.fire({
          icon: 'warning',
          title: 'Fecha inválida',
          text: 'La fecha de nacimiento no puede ser futura.',
          confirmButtonColor: '#17a2b8'
        });
      }
      if (quickForm.telefono && !/^\d{4}-\d{4}$/.test(quickForm.telefono))
        return Swal.fire({
          icon: 'warning',
          title: 'Formato inválido',
          text: 'Teléfono inválido. Debe ser ####-####.',
          confirmButtonColor: '#17a2b8'
        });
      if (quickForm.dui && !/^\d{8}-\d{1}$/.test(quickForm.dui))
        return Swal.fire({
          icon: 'warning',
          title: 'Formato inválido',
          text: 'DUI inválido. Debe ser ########-#.',
          confirmButtonColor: '#17a2b8'
        });

      // preparar body
      const body = {
        nombre: quickForm.nombre,
        apellido: quickForm.apellido,
        sexo: quickForm.sexo,
        telefono: quickForm.telefono,
        fecha_nacimiento: fn || null,
      };
      if (!body.fecha_nacimiento && quickForm.edad)
        body.edad = Number(quickForm.edad);

      // incluir DUI si es mayor de edad y se ingresó
      const isAdult =
        (quickEdadLocal !== null && quickEdadLocal >= 18) ||
        (!quickForm.fecha_nacimiento && quickForm.edad && Number(quickForm.edad) >= 18);
      if (isAdult && quickForm.dui) body.dui = quickForm.dui;

      const res = await api.post("/api/pacientes", body);
      const newId = res.data?.id_paciente || res.data?.insertId || null;
      if (!newId) throw new Error("No se pudo obtener el ID del paciente creado.");

      // seleccionar el nuevo paciente en el select
      setSelectedPaciente(String(newId));

      // agregar opción temporal para que aparezca inmediatamente en el select
      setTempPacientes(curr => {
        if (curr.some(tp => Number(tp.id_paciente) === Number(newId))) return curr;
        return [
          ...curr,
          {
            id_paciente: Number(newId),
            nombre: quickForm.nombre,
            apellido: quickForm.apellido,
            dui: isAdult ? (quickForm.dui || "") : "",
          },
        ];
      });

      // también setear campos locales del examen
      const edadCalc = quickForm.fecha_nacimiento
        ? quickEdadLocal
        : quickForm.edad
        ? Number(quickForm.edad)
        : "";
      setForm((f) => ({
        ...f,
        edad: edadCalc || "",
        sexo: quickForm.sexo || "",
      }));

      // pedir al padre recargar pacientes (si provee callback)
      if (onAddPaciente) {
        try { await onAddPaciente(); } catch (_) { /* opcional: ignorar */ }
      }

      // cerrar modal y limpiar
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

      // feedback de éxito
      Swal.fire({
        icon: 'success',
        title: 'Paciente creado',
        text: `${body.nombre} ${body.apellido}`.trim(),
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 409) {
        return Swal.fire({
          icon: 'warning',
          title: 'DUI duplicado',
          text: err.response?.data?.message || 'Ya existe un paciente activo con este DUI.',
          confirmButtonColor: '#17a2b8'
        });
      }
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Error al crear el paciente',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <div>
      {/* Selección de paciente */}
      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Paciente</label>
        {!lockPaciente && (
          <div className="d-flex align-items-end gap-2 mb-2">
            <div className="flex-grow-1">
              <label className="form-label small mb-1">Buscar</label>
              <input
                className="form-control"
                placeholder="Buscar por nombre o DUI"
                value={pacienteQuery}
                onChange={(e) => setPacienteQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label small mb-1">&nbsp;</label>
              <button
                className="btn btn-info text-white w-100"
                type="button"
                onClick={() => setShowPacienteModal(true)}
              >
                + Paciente rápido
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="form-select"
            value={selectedPaciente}
            onChange={(e) => setSelectedPaciente(e.target.value)}
            disabled={lockPaciente}
          >
            <option value="">Seleccione un paciente</option>
            {[
              // mezclar pacientes del padre con temporales sin duplicar
              ...pacientes,
              ...tempPacientes.filter(tp => !pacientes.some(p => Number(p.id_paciente) === Number(tp.id_paciente)))
            ]
              .filter((p) => {
                const q = pacienteQuery.trim().toLowerCase();
                if (!q) return true;
                const name = `${p.nombre || ""} ${p.apellido || ""}`.toLowerCase();
                const dui = (p.dui || "").toLowerCase();
                const qDigits = q.replace(/\D/g, "");
                return (
                  name.includes(q) ||
                  dui.includes(q) ||
                  (qDigits && (p.dui || "").replace(/\D/g, "").includes(qDigits))
                );
              })
              .map((p) => (
              <option key={p.id_paciente} value={`${p.id_paciente}`}>
                {p.nombre} {p.apellido} {p.dui ? `(${p.dui})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Datos generales */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Edad</label>
          {!quickForm.fecha_nacimiento ? (
            <input
              className="form-control"
              value={form.edad || ""}
              onChange={(e) => handleChange(e, "edad")}
            />
          ) : (
            <input
              className="form-control"
              value={quickEdadLocal ?? ""}
              readOnly
            />
          )}
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
        <div className="modal d-block" tabIndex={-1} onClick={() => setShowPacienteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar paciente rápido</h5>
                <button type="button" className="btn-close" onClick={() => setShowPacienteModal(false)}></button>
              </div>
              <form onSubmit={handleQuickPaciente}>
                <div className="modal-body">
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
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setQuickForm({ ...quickForm, fecha_nacimiento: e.target.value });
                  if (e.target.value) setQuickForm((q) => ({ ...q, edad: "" }));
                }}
              />
            </div>
            <div className="mb-2">
              <label>Edad</label>
              {!quickForm.fecha_nacimiento ? (
                <input
                  className="form-control"
                  value={quickForm.edad}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, edad: e.target.value })
                  }
                />
              ) : (
                <input className="form-control" value={quickEdadLocal ?? ""} readOnly />
              )}
            </div>
            <div className="mb-2">
              <label>Teléfono</label>
              <input
                className="form-control"
                value={quickForm.telefono}
                onChange={(e) =>
                  setQuickForm({
                    ...quickForm,
                    telefono: formatTelefonoInput(e.target.value),
                  })
                }
              />
            </div>
            {(((quickEdadLocal !== null) && quickEdadLocal >= 18) || (!quickForm.fecha_nacimiento && quickForm.edad !== '' && Number(quickForm.edad) >= 18)) && (
              <div className="mb-2">
                <label>DUI</label>
                <input
                  className="form-control"
                  value={quickForm.dui}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, dui: formatDuiInput(e.target.value) })
                  }
                  placeholder="########-#"
                />
              </div>
            )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPacienteModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-info text-white">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}