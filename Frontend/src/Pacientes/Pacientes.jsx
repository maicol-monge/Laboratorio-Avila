import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

/**
 * Pacientes.jsx
 * - Requiere: Bootstrap + Bootstrap Icons en index.html (no se usan librerías externas)
 * - Ajusta URLs de fetch si tu API está en otra ruta/host.
 */

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // búsqueda
  const [query, setQuery] = useState("");

  // modal / panel
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "view" | "edit"
  const [editingId, setEditingId] = useState(null);

  // formulario
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    edad: "",
    sexo: "",
    dui: "",
    telefono: "",
  });

  // token y headers
  const token = localStorage.getItem("token");
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  // ---------- UTIL ----------
  const formatDateDDMMYYYY = (iso) => {
    if (!iso) return "-";
    const d = iso.split("T")[0];
    const [y, m, day] = d.split("-");
    return `${day}-${m}-${y}`;
  };

  const calcularEdad = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const f = new Date(fecha);
    let edad = hoy.getFullYear() - f.getFullYear();
    const mm = hoy.getMonth() - f.getMonth();
    if (mm < 0 || (mm === 0 && hoy.getDate() < f.getDate())) edad--;
    return edad;
  };

  const sexoLabel = (s) => {
    if (!s) return "-";
    const v = String(s).toUpperCase();
    if (v === "M") return "Masculino";
    if (v === "F") return "Femenino";
    if (v === "O") return "Otro";
    if (v === "U") return "No especificado";
    return s;
  };

  // ---------- FETCH ----------
  const fetchPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/pacientes/", {
        headers,
      });
      if (!res.ok) {
        let text;
        try {
          text = await res.text();
        } catch (e) {
          text = null;
        }
        throw new Error(text || "Error al cargar pacientes");
      }
      const data = await res.json();
      // normalizar sexo a mayúscula para uso consistente en UI
      const normalized = (Array.isArray(data) ? data : []).map((p) => ({
        ...p,
        sexo: p && p.sexo ? String(p.sexo).toUpperCase() : "U",
      }));
      setPacientes(normalized);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- HANDLERS FORM ----------
  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      edad: "",
      sexo: "",
      dui: "",
      telefono: "",
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // edad manual: cuando el usuario edita la edad, actualizarla y limpiar DUI (para forzar reingreso si aplica)
    if (name === "edad") {
      const val = value;
      setForm((f) => ({ ...f, edad: val, dui: "" }));
      return;
    }
    // telefono ####-####
    if (name === "telefono") {
      const formatted = value
        .replace(/\D/g, "")
        .slice(0, 8)
        .replace(/(\d{4})(\d{0,4})/, "$1-$2");
      setForm((f) => ({ ...f, telefono: formatted }));
      return;
    }

    // dui ########-#
    if (name === "dui") {
      const formatted = value
        .replace(/\D/g, "")
        .slice(0, 9)
        .replace(/(\d{8})(\d{0,1})/, "$1-$2");
      setForm((f) => ({ ...f, dui: formatted }));
      return;
    }

    // fecha_nacimiento -> cuando cambia la fecha, si hay fecha limpiamos el campo edad (backend calculará)
    if (name === "fecha_nacimiento") {
      setForm((f) => ({
        ...f,
        fecha_nacimiento: value,
        edad: value ? "" : f.edad,
      }));
      return;
    }

    // edad manual
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Calcula edad local ya sea por fecha o por campo edad
  const edadLocal = (() => {
    let edad = null;
    if (form.fecha_nacimiento) {
      const calc = calcularEdad(form.fecha_nacimiento);
      if (!Number.isNaN(calc)) edad = calc;
    } else if (
      form.edad !== "" &&
      form.edad !== null &&
      typeof form.edad !== "undefined"
    ) {
      const n = Number(form.edad);
      if (!Number.isNaN(n)) edad = n;
    }
    return edad;
  })();

  // Priorizar fecha_nacimiento: si hay fecha limpiamos edad; además limpiar DUI cuando la edad (calculada o manual) sea <18
  useEffect(() => {
    // limpiar campo edad si hay fecha
    if (form.fecha_nacimiento && form.edad) {
      setForm((f) => ({ ...f, edad: "" }));
    }

    // si es menor de 18 limpiar DUI (para ocultarlo y evitar validaciones)
    if (edadLocal !== null && edadLocal < 18 && form.dui) {
      setForm((f) => ({ ...f, dui: "" }));
    }

    // si se escribió edad manual y es menor a 18, asegurar que DUI se limpie
    if (!form.fecha_nacimiento && form.edad !== "" && form.edad !== null) {
      const n = Number(form.edad);
      if (!Number.isNaN(n) && n < 18 && form.dui) {
        setForm((f) => ({ ...f, dui: "" }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fecha_nacimiento, form.edad, edadLocal]);

  // valida antes de enviar
  const validarAntesDeEnviar = () => {
    if (!form.nombre || !form.apellido) {
      setError("Nombre y Apellido son obligatorios.");
      return false;
    }
    // sexo obligatorio (M/F/O/U)
    if (!form.sexo || !/^[MFOU]$/.test(String(form.sexo).toUpperCase())) {
      setError("Seleccione el sexo del paciente.");
      return false;
    }
    // debe existir fecha_nacimiento o edad (al menos una)
    if (
      !form.fecha_nacimiento &&
      (form.edad === "" ||
        form.edad === null ||
        typeof form.edad === "undefined")
    ) {
      setError("Ingrese Fecha de Nacimiento o Edad.");
      return false;
    }
    // DUI es opcional; si se proporciona, validar formato
    if (form.dui && !/^\d{8}-\d{1}$/.test(form.dui)) {
      setError("Formato de DUI inválido. Debe ser ########-#.");
      return false;
    }
    // teléfono opcional pero si hay verificar formato
    if (form.telefono && !/^\d{4}-\d{4}$/.test(form.telefono)) {
      setError("Teléfono con formato inválido. Debe ser ####-####.");
      return false;
    }
    return true;
  };

  // ---------- CREATE / UPDATE ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validarAntesDeEnviar()) return;

    setLoading(true);
    try {
      // preparar body (misma lógica que el backend esperaba)
      const body = {
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
      };

      // Siempre incluir fecha_nacimiento en el cuerpo: null si fue borrada
      body.fecha_nacimiento = form.fecha_nacimiento
        ? form.fecha_nacimiento
        : null;
      // Si no hay fecha, enviar edad (si existe)
      if (
        !body.fecha_nacimiento &&
        form.edad !== "" &&
        typeof form.edad !== "undefined"
      ) {
        body.edad = Number(form.edad);
      }

      // DUI es opcional: sólo enviarlo si el usuario lo puso
      if (form.dui) body.dui = form.dui;

      // sexo (obligatorio)
      body.sexo = form.sexo;

      if (mode === "add") {
        const res = await fetch("http://localhost:5000/api/pacientes/", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          let errText = "Error al crear paciente";
          try {
            const errBody = await res.json();
            errText = errBody.message || JSON.stringify(errBody);
          } catch (e) {
            try {
              errText = await res.text();
            } catch (e) {}
          }
          throw new Error(errText);
        }
      } else if (mode === "edit" && editingId) {
        const res = await fetch(
          `http://localhost:5000/api/pacientes/${editingId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) {
          let errText = "Error al actualizar paciente";
          try {
            const errBody = await res.json();
            errText = errBody.message || JSON.stringify(errBody);
          } catch (e) {
            try {
              errText = await res.text();
            } catch (e) {}
          }
          throw new Error(errText);
        }
      }

      await fetchPacientes();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- EDIT / VIEW OPENERS ----------
  const openAdd = () => {
    resetForm();
    setMode("add");
    setShowModal(true);
    setError(null);
  };

  const openView = (p) => {
    setForm({
      nombre: p.nombre || "",
      apellido: p.apellido || "",
      fecha_nacimiento: p.fecha_nacimiento
        ? p.fecha_nacimiento.split("T")[0]
        : "",
      edad: p.fecha_nacimiento ? "" : p.edad ?? "",
      sexo: p.sexo ? String(p.sexo).toUpperCase() : p.sexo ?? "",
      dui: p.dui ?? "",
      telefono: p.telefono ?? "",
    });
    setMode("view");
    setShowModal(true);
    setEditingId(p.id_paciente || null);
    setError(null);
  };

  const openEdit = (p) => {
    setForm({
      nombre: p.nombre || "",
      apellido: p.apellido || "",
      fecha_nacimiento: p.fecha_nacimiento
        ? p.fecha_nacimiento.split("T")[0]
        : "",
      edad: p.fecha_nacimiento ? "" : p.edad ?? "",
      sexo: p.sexo ? String(p.sexo).toUpperCase() : p.sexo ?? "",
      dui: p.dui ?? "",
      telefono: p.telefono ?? "",
    });
    setMode("edit");
    setShowModal(true);
    setEditingId(p.id_paciente || null);
    setError(null);
  };

  // ---------- DELETE ----------
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

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/pacientes/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        let errText = "Error al eliminar paciente";
        try {
          const errBody = await res.json();
          errText = errBody.message || JSON.stringify(errBody);
        } catch (e) {
          try {
            errText = await res.text();
          } catch (e) {}
        }
        throw new Error(errText);
      }
      await fetchPacientes();

      // Mostrar mensaje de éxito
      Swal.fire("¡Eliminado!", "El paciente ha sido eliminado.", "success");
    } catch (err) {
      setError(err.message);

      // Mostrar mensaje de error
      Swal.fire("Error", "No se pudo eliminar el paciente.", "error");
    } finally {
      setLoading(false);
    }
  };

  // filtrado por búsqueda (nombre o apellido)
  const listaFiltrada = pacientes.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    // Normalizar DUI para buscar tanto con guion como sin guion
    const duiRaw = p.dui ? String(p.dui).toLowerCase() : "";
    const duiDigits = duiRaw.replace(/\D/g, "");
    const qDigits = q.replace(/\D/g, "");

    return (
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.apellido && p.apellido.toLowerCase().includes(q)) ||
      (duiRaw && duiRaw.includes(q)) ||
      (qDigits && duiDigits && duiDigits.includes(qDigits))
    );
  });

  // cerrar modal con clic fuera
  const closeModal = () => {
    setShowModal(false);
    setMode("add");
    resetForm();
    setError(null);
  };

  return (
    <div
      style={{
        marginLeft: "250px",
        minHeight: "100vh",
        backgroundColor: "#F0F0F0",
        padding: "20px",
      }}
    >
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#111" }}>
            Gestión de Pacientes
          </h2>
          <p className="text-muted small mb-0">
            Administra la información de tus pacientes
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <input
            type="text"
            placeholder="Buscar paciente..."
            className="form-control form-control-sm"
            style={{ width: "260px" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn"
            style={{ backgroundColor: "#00C2CC", color: "#fff" }}
            onClick={openAdd}
          >
            <i className="bi bi-plus-lg me-2"></i> Nuevo Paciente
          </button>
        </div>
      </div>

      {/* ERROR GLOBAL */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* TARJETAS RESUMEN */}
      <div className="row mt-4 mb-4 g-3">
        <div className="col-md-4">
          <div className="card shadow-sm p-3 d-flex flex-row align-items-center">
            <i
              className="bi bi-people-fill text-info fs-2 me-3"
              style={{ color: "#00C2CC" }}
            ></i>
            <div>
              <p className="text-muted small mb-0">Pacientes</p>
              <h5 className="fw-bold mb-0">{pacientes.length}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm p-3 d-flex flex-row align-items-center">
            <i
              className="bi bi-calendar-event text-info fs-2 me-3"
              style={{ color: "#00C2CC" }}
            ></i>
            <div>
              <p className="text-muted small mb-0">Citas hoy</p>
              <h5 className="fw-bold mb-0">—</h5>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Sexo</th>
                <th>Edad</th>
                <th>Fecha Nac.</th>
                <th>DUI</th>
                <th>Tel</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    Cargando...
                  </td>
                </tr>
              ) : listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted">
                    No hay pacientes registrados
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((p) => (
                  <tr key={p.id_paciente}>
                    <td>{p.id_paciente}</td>
                    <td>{p.nombre}</td>
                    <td>{p.apellido}</td>
                    <td>{sexoLabel(p.sexo)}</td>
                    <td>{p.edad || p.edad === 0 ? p.edad : "-"}</td>
                    <td>
                      {p.fecha_nacimiento
                        ? formatDateDDMMYYYY(p.fecha_nacimiento)
                        : "-"}
                    </td>
                    <td>{p.dui || "-"}</td>
                    <td>{p.telefono || "-"}</td>
                    <td>
                      <div className="btn-group" role="group">
                        {/* Redirige a otra página usando window.location */}
                        <button
                          className="btn btn-sm btn-info text-white"
                          onClick={() =>
                            navigate("/fichaPaciente", {
                              state: { id: p.id_paciente },
                            })
                          }
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openEdit(p)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(p.id_paciente)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- MODAL CENTRADO (ADD / VIEW / EDIT) ---------- */}
      {showModal && (
        <>
          {/* overlay */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1040 }}
            onClick={closeModal}
          />

          <div
            className="position-fixed top-50 start-50 translate-middle bg-white shadow-lg"
            style={{
              zIndex: 1050,
              width: "min(720px, 95vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "8px",
              padding: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                {mode === "add" && "Agregar Paciente"}
                {mode === "view" && "Ver Paciente"}
                {mode === "edit" && "Editar Paciente"}
              </h5>
              <button className="btn btn-sm btn-light" onClick={closeModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* error en el modal */}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    name="nombre"
                    className="form-control"
                    value={form.nombre}
                    onChange={handleChange}
                    disabled={mode === "view"}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Apellido *</label>
                  <input
                    name="apellido"
                    className="form-control"
                    value={form.apellido}
                    onChange={handleChange}
                    disabled={mode === "view"}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Fecha de Nacimiento</label>
                  <input
                    name="fecha_nacimiento"
                    type="date"
                    className="form-control"
                    value={form.fecha_nacimiento}
                    onChange={handleChange}
                    disabled={mode === "view"}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Sexo *</label>
                  <select
                    name="sexo"
                    className="form-select"
                    value={form.sexo}
                    onChange={handleChange}
                    disabled={mode === "view"}
                    required
                  >
                    <option value="">-- Seleccione --</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="U">No especificado</option>
                  </select>
                </div>

                {/* Si no hay fecha, mostrar campo edad editable (solo en add/edit) */}
                {!form.fecha_nacimiento && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Edad</label>
                    <input
                      name="edad"
                      type="number"
                      className="form-control"
                      value={form.edad}
                      onChange={handleChange}
                      disabled={mode === "view"}
                    />
                  </div>
                )}

                {/* Si hay fecha y es menor de 18 mostramos edad calculada (readOnly) */}
                {form.fecha_nacimiento &&
                  edadLocal !== null &&
                  edadLocal < 18 && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Edad (calculada)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={edadLocal}
                        readOnly
                      />
                    </div>
                  )}

                {/* Mostrar DUI si la edad local es >= 18 (o si no hay fecha pero se ingresó edad >=18) */}
                {edadLocal !== null && edadLocal >= 18 && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      DUI{" "}
                      {mode !== "view" && (
                        <small className="text-muted"> (########-#)</small>
                      )}
                    </label>
                    <input
                      name="dui"
                      className="form-control"
                      value={form.dui}
                      onChange={handleChange}
                      placeholder="########-#"
                      disabled={mode === "view"}
                    />
                  </div>
                )}

                <div className="col-md-6 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    name="telefono"
                    className="form-control"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="####-####"
                    disabled={mode === "view"}
                  />
                </div>

                {/* Opcional: otros campos... */}
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cerrar
                </button>

                {mode !== "view" && (
                  <button
                    type="submit"
                    className="btn"
                    style={{ backgroundColor: "#00C2CC", color: "#fff" }}
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
