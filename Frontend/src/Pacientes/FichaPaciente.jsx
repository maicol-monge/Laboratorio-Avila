import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import mammoth from "mammoth";

export default function FichaPaciente() {
  const location = useLocation();
  const navigate = useNavigate();
  // Resolve paciente id from multiple possible sources: state.id, state.paciente, or query param ?id=
  const id = (() => {
    try {
      const fromState = location?.state?.id;
      if (fromState) return fromState;
      const p = location?.state?.paciente;
      if (p) return p.id_paciente || p.id || p.idPaciente || null;
      const qs = new URLSearchParams(location.search || '');
      const q = qs.get('id') || qs.get('pacienteId');
      if (q) return q;
      return null;
    } catch (e) {
      return null;
    }
  })();

  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // medical history state
  const [examenes, setExamenes] = useState([]);
  const [examenesRealizados, setExamenesRealizados] = useState([]); // lista completa de exámenes realizados del paciente
  const [tiposExamenes, setTiposExamenes] = useState([]); // catálogo de tipos
  const [citas, setCitas] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('examenes'); // 'examenes' | 'citas'
  // filtros para exámenes realizados
  const [filtroTipoExamen, setFiltroTipoExamen] = useState(''); // id_examen o ''
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  // citas filters
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState(''); // '' = todos, '1' = pendientes, '2' = finalizadas, '3' = canceladas
   const [showMode, setShowMode] = useState('all'); // 'all' | 'future' | 'past
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    edad: "",
    sexo: "",
    dui: "",
    telefono: "",
  });

  // helper to get auth headers or null if no token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  // Cargar catálogo de tipos de exámenes
  useEffect(() => {
    const loadTipos = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;
        const res = await axios.get('http://localhost:5000/api/examenes', { headers });
        setTiposExamenes(res.data || []);
      } catch (e) {
        console.error('Error loading examenes catalog', e);
      }
    };
    loadTipos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debug: show resolved id derived from location / query / state
  console.debug('[FichaPaciente] initial resolved id from location/query/state:', id);

  useEffect(() => {
    if (!id) return;
    const fetchPaciente = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setError('Token requerido');
          Swal.fire('Acceso denegado', 'Token requerido. Inicie sesión.', 'warning');
          setLoading(false);
          return;
        }
        const res = await fetch(`http://localhost:5000/api/pacientes/${id}`, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setPaciente(data);
        // After fetching paciente, try to fetch historial usando el id inside the paciente object
        try {
          const headers2 = getAuthHeaders();
          if (headers2) {
            const afterId = (data && (data.id_paciente || data.id || data.idPaciente)) || id;
            console.debug('[FichaPaciente] resolved id after fetching paciente:', afterId);
            if (afterId) {
              // fetch examenes realizados (nuevo endpoint)
              try {
                const reExReal = await axios.get(`http://localhost:5000/api/examenes_realizados`, { headers: headers2 });
                const allExReal = reExReal.data || [];
                // filtrar por paciente
                const filtered = allExReal.filter(ex => String(ex.id_paciente) === String(afterId));
                console.debug('[FichaPaciente] fetched examenes_realizados for patient:', filtered);
                setExamenesRealizados(filtered);
              } catch (e) {
                setExamenesRealizados([]);
              }
              // fetch examenes (legacy, mantener por compatibilidad)
              try {
                const re = await fetch(`http://localhost:5000/api/pacientes/${afterId}/examenes`, { headers: headers2 });
                if (re.ok) {
                  const ee = await re.json();
                  console.debug('[FichaPaciente] fetched examenes (post-paciente):', ee);
                  setExamenes(Array.isArray(ee) ? ee : []);
                }
              } catch (e) {
                setExamenes([]);
              }
              // fetch citas
              try {
                const rc = await fetch(`http://localhost:5000/api/pacientes/${afterId}/citas`, { headers: headers2 });
                if (rc.ok) {
                  const cc = await rc.json();
                  console.debug('[FichaPaciente] fetched citas (post-paciente):', cc);
                  setCitas(Array.isArray(cc) ? cc : []);
                }
              } catch (e) {
                setCitas([]);
              }
            }
          }
        } catch (err) {
          console.debug('Error fetching historial after paciente', err);
        }
      } catch (err) {
        setError("No se pudo cargar el paciente");
      } finally {
        setLoading(false);
      }
    };
    fetchPaciente();
    // when paciente changes (id), also load historial
    const fetchHistorial = async () => {
      setHistLoading(true);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setExamenesRealizados([]);
          setExamenes([]);
          setCitas([]);
          return;
        }
        // fetch examenes_realizados
        try {
          const r0 = await axios.get(`http://localhost:5000/api/examenes_realizados`, { headers });
          const all = r0.data || [];
          const filtered = all.filter(ex => String(ex.id_paciente) === String(id));
          setExamenesRealizados(filtered);
        } catch (e) {
          setExamenesRealizados([]);
        }
        // fetch examenes for paciente (legacy)
        try {
          const r1 = await fetch(`http://localhost:5000/api/pacientes/${id}/examenes`, { headers });
          if (r1.ok) {
            const e = await r1.json();
            console.debug('[FichaPaciente] fetched examenes:', e);
            setExamenes(Array.isArray(e) ? e : []);
          } else {
            setExamenes([]);
          }
        } catch (e) {
          setExamenes([]);
        }

        // fetch citas for paciente
        try {
          const r2 = await fetch(`http://localhost:5000/api/pacientes/${id}/citas`, { headers });
          if (r2.ok) {
            const c = await r2.json();
            console.debug('[FichaPaciente] fetched citas:', c);
            setCitas(Array.isArray(c) ? c : []);
          } else {
            setCitas([]);
          }
        } catch (e) {
          setCitas([]);
        }
      } finally {
        setHistLoading(false);
      }
    };
  fetchHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // refresh citas independently (useful after changes elsewhere)
  const refreshCitas = async () => {
    if (!id) return;
    try {
      setHistLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(`http://localhost:5000/api/pacientes/${id}/citas`, { headers });
      if (r.ok) {
        const c = await r.json();
        console.debug('[FichaPaciente] refreshed citas:', c);
        setCitas(Array.isArray(c) ? c : []);
      }
    } catch (e) {
      console.debug('Error refreshing citas', e);
    } finally {
      setHistLoading(false);
    }
  };

  // When user opens the 'citas' tab, refresh the list so it's dynamic
  useEffect(() => {
    if (activeTab === 'citas' && id) refreshCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // ---------- Edit handlers (inline modal) ----------
  // parse various incoming date formats into ISO YYYY-MM-DD when possible
  function parseDateToISO(val) {
    if (!val) return null;
    try {
      if (val instanceof Date) {
        const d = val;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      const s = String(val).trim();
      // YYYY-MM-DD
      let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      // DD/MM/YYYY
      m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      // Malformed like '24 00:00:00/05/2004' -> DD ... MM/YYYY
      m = s.match(/(\d{2}).*?(\d{2})\/(\d{4})/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      // try tokens
      const parts = s.split(/\s+/);
      for (const p of parts) {
        const r1 = p.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (r1) return `${r1[1]}-${r1[2]}-${r1[3]}`;
        const r2 = p.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (r2) return `${r2[3]}-${r2[2]}-${r2[1]}`;
      }
      // fallback to Date parse
      const d2 = new Date(s);
      if (!isNaN(d2.getTime())) {
        return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  const openEditModal = () => {
    if (!paciente) return;
  // try to normalize fecha_nacimiento to ISO (YYYY-MM-DD) for the date input
  const tryIso = parseDateToISO(paciente.fecha_nacimiento);
    setEditForm({
      nombre: paciente.nombre || "",
      apellido: paciente.apellido || "",
      fecha_nacimiento: tryIso || "",
      edad: tryIso ? "" : paciente.edad ?? "",
      sexo: paciente.sexo ? String(paciente.sexo).toUpperCase() : paciente.sexo ?? "",
      dui: paciente.dui ?? "",
      telefono: paciente.telefono ?? "",
    });
    setEditError(null);
    setShowEditModal(true);
  };


  // calcular edad helper (same logic used in Pacientes.jsx)
  const calcularEdad = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return null;
    let edad = hoy.getFullYear() - f.getFullYear();
    const mm = hoy.getMonth() - f.getMonth();
    if (mm < 0 || (mm === 0 && hoy.getDate() < f.getDate())) edad--;
    return edad;
  };

  // computed edad for editForm (similar to edadLocal in Pacientes.jsx)
  const editEdadLocal = (() => {
    let edad = null;
    if (editForm.fecha_nacimiento) {
      const calc = calcularEdad(editForm.fecha_nacimiento);
      if (!Number.isNaN(calc)) edad = calc;
    } else if (editForm.edad !== '' && editForm.edad !== null && typeof editForm.edad !== 'undefined') {
      const n = Number(editForm.edad);
      if (!Number.isNaN(n)) edad = n;
    }
    return edad;
  })();

  // keep DUI cleared when under 18 similar to list modal logic
  useEffect(() => {
    if (editForm.fecha_nacimiento && editForm.edad) {
      setEditForm((f) => ({ ...f, edad: '' }));
    }
    if (editEdadLocal !== null && editEdadLocal < 18 && editForm.dui) {
      setEditForm((f) => ({ ...f, dui: '' }));
    }
    if (!editForm.fecha_nacimiento && editForm.edad !== '' && editForm.edad !== null) {
      const n = Number(editForm.edad);
      if (!Number.isNaN(n) && n < 18 && editForm.dui) {
        setEditForm((f) => ({ ...f, dui: '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm.fecha_nacimiento, editForm.edad, editEdadLocal]);

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditLoading(false);
    setEditError(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      const formatted = value.replace(/\D/g, '').slice(0,8).replace(/(\d{4})(\d{0,4})/, '$1-$2');
      setEditForm(f => ({ ...f, telefono: formatted }));
      return;
    }
    if (name === 'dui') {
      const formatted = value.replace(/\D/g, '').slice(0,9).replace(/(\d{8})(\d{0,1})/, '$1-$2');
      setEditForm(f => ({ ...f, dui: formatted }));
      return;
    }
    if (name === 'fecha_nacimiento') {
      setEditForm(f => ({ ...f, fecha_nacimiento: value, edad: value ? '' : f.edad }));
      return;
    }
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const validateEditBeforeSubmit = () => {
    if (!editForm.nombre || !editForm.apellido) {
      setEditError('Nombre y Apellido son obligatorios.');
      return false;
    }
    if (!editForm.sexo || !/^[MFOU]$/.test(String(editForm.sexo).toUpperCase())) {
      setEditError('Seleccione el sexo del paciente.');
      return false;
    }
    if (editForm.dui && !/^\d{8}-\d{1}$/.test(editForm.dui)) {
      setEditError('Formato de DUI inválido. Debe ser ########-#.');
      return false;
    }
    if (editForm.telefono && !/^\d{4}-\d{4}$/.test(editForm.telefono)) {
      setEditError('Teléfono con formato inválido. Debe ser ####-####.');
      return false;
    }
    return true;
  }

  const submitEdit = async (ev) => {
    ev && ev.preventDefault();
    setEditError(null);
    if (!validateEditBeforeSubmit()) return;
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const body = {
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        telefono: editForm.telefono || null,
        fecha_nacimiento: editForm.fecha_nacimiento ? editForm.fecha_nacimiento : null,
        sexo: editForm.sexo,
      };
      if (!body.fecha_nacimiento && editForm.edad !== '' && typeof editForm.edad !== 'undefined') {
        body.edad = Number(editForm.edad);
      }
      if (editForm.dui) body.dui = editForm.dui;

      const res = await fetch(`http://localhost:5000/api/pacientes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Error ${res.status} ${txt}`);
      }
      // Re-fetch paciente to ensure ficha shows the authoritative data (some APIs return empty body on PUT)
      try {
        const token2 = localStorage.getItem('token');
        const headers2 = token2 ? { Authorization: `Bearer ${token2}` } : {};
        const r = await fetch(`http://localhost:5000/api/pacientes/${id}`, { headers: headers2 });
        if (r.ok) {
          const refreshed = await r.json();
          setPaciente(refreshed);
        }
      } catch (e) {
        console.warn('No se pudo refrescar paciente tras editar', e);
      }
      setShowEditModal(false);
      Swal.fire('Guardado', 'Paciente actualizado correctamente.', 'success');
    } catch (err) {
      console.error('Error updating paciente', err);
      setEditError(err.message || 'Error al actualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePaciente = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esta acción!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      // Resolve id from multiple possible fields
      const resolvedId = (paciente && (paciente.id_paciente || paciente.id)) || id;
      if (!resolvedId) throw new Error('ID de paciente desconocido para eliminar');

      const token = localStorage.getItem('token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      // Primary attempt: DELETE /api/pacientes/:id
      console.debug('[FichaPaciente] Deleting paciente via REST id=', resolvedId);
      let res = await fetch(`http://localhost:5000/api/pacientes/${resolvedId}`, {
        method: 'DELETE',
        headers: { ...authHeader },
      });

      // If server responds 405/404 or similar, try fallback: DELETE with JSON body to same endpoint
      if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 400)) {
        console.debug('[FichaPaciente] Primary DELETE failed, trying DELETE with JSON body fallback');
        try {
          res = await fetch(`http://localhost:5000/api/pacientes/${resolvedId}`, {
            method: 'DELETE',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: resolvedId }),
          });
        } catch (e) {
          console.debug('[FichaPaciente] fallback DELETE with body threw', e);
        }
      }

      // Another fallback: try DELETE via query param (some servers expect this)
      if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 400)) {
        console.debug('[FichaPaciente] Trying fallback DELETE via query param');
        try {
          res = await fetch(`http://localhost:5000/api/pacientes?id=${resolvedId}`, {
            method: 'DELETE',
            headers: { ...authHeader },
          });
        } catch (e) {
          console.debug('[FichaPaciente] fallback DELETE via query threw', e);
        }
      }

      if (!res.ok) {
        let errText = `Error al eliminar paciente (status ${res.status})`;
        try {
          const json = await res.json();
          errText = json.message || JSON.stringify(json) || errText;
        } catch (e) {
          try {
            const txt = await res.text();
            if (txt) errText = txt;
          } catch (e) {
            // ignore
          }
        }
        throw new Error(errText);
      }

      Swal.fire('¡Eliminado!', 'El paciente ha sido eliminado.', 'success');
      navigate(-1);
    } catch (err) {
      console.error('[FichaPaciente] Error deleting paciente', err);
      setError(err.message || 'No se pudo eliminar el paciente.');
      Swal.fire('Error', err.message || 'No se pudo eliminar el paciente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sexoLabel = (s) => {
    if (!s) return "-";
    const m = String(s).toUpperCase();
    if (m === 'M') return 'Masculino';
    if (m === 'F') return 'Femenino';
    if (m === 'O') return 'Otro';
    if (m === 'U') return 'No especificado';
    return s;
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch (e) {
      return iso;
    }
  };

  // Exportar examen realizado a DOCX
  const exportExamen = async (idExamen) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/examenes_realizados/${idExamen}/export`,
        {
          responseType: 'blob',
          headers: getAuthHeaders(),
        }
      );
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const headers = res.headers || {};
      let suggested = headers['x-filename'] || headers['X-Filename'];
      if (!suggested) {
        const cd = headers['content-disposition'] || headers['Content-Disposition'];
        if (cd) {
          const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
          const fname = match ? (match[1] || match[2]) : '';
          if (fname) suggested = decodeURIComponent(fname);
        }
      }
      if (!suggested) suggested = `examen_${idExamen}.docx`;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando examen:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo exportar el examen.' });
    }
  };

  // Imprimir examen realizado
  const printExamen = async (idExamen) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/examenes_realizados/${idExamen}/export`,
        {
          responseType: 'arraybuffer',
          headers: getAuthHeaders(),
        }
      );
      const result = await mammoth.convertToHtml(
        { arrayBuffer: res.data },
        {
          includeDefaultStyleMap: true,
          includeEmbeddedStyleMap: true,
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              return { src: "data:" + image.contentType + ";base64," + imageBuffer };
            });
          })
        }
      );
      const htmlContent = result.value;
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      if (!printWindow) {
        Swal.fire({ icon: 'warning', title: 'Ventana bloqueada', text: 'Permita ventanas emergentes para imprimir.' });
        return;
      }
      printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Examen - Impresión</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: letter; margin: 0; }
          body { font-family: Calibri, Arial, sans-serif; margin: 0; padding: 0; background: white; }
          table { border-collapse: collapse; }
          @media print { body { margin: 0; padding: 0; } @page { margin: 0; } }
        </style>
      </head><body>${htmlContent}<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script></body></html>`);
      printWindow.document.close();
    } catch (err) {
      console.error('Error al imprimir examen:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo preparar el documento para imprimir.' });
    }
  };

  // Obtener nombre del tipo de examen
  const getExamenNombre = (idExamen) => {
    const ex = tiposExamenes.find(t => Number(t.id_examen) === Number(idExamen));
    return ex ? ex.titulo_examen : `Examen ${idExamen}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F0F0" }}>
      <div className="d-flex">
        <div className="flex-grow-1" style={{ marginLeft: "250px", padding: "20px" }}>
          <div className="container-fluid">
            <button className="btn" style={{ backgroundColor: "#FF8789", color: "#fff" }} onClick={() => navigate(-1)}>Volver</button>
            <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
              <h1 className="h3 mb-0">Ficha del Paciente</h1>
              <div className="d-flex gap-2">
                <button className="btn" style={{ backgroundColor: "#00C2CC", color: "#fff" }} onClick={() => navigate('/citas', { state: { preselectPacienteId: id } })}>Crear Cita</button>
                <button className="btn" style={{ backgroundColor: "#00C2CC", color: "#fff" }} onClick={() => navigate('/realizar-examen', { state: { preselectedPacienteId: id } })}>Registrar Examen</button>
              </div>
            </div>

            <p className="text-muted mb-4">Información detallada e historial médico</p>

            {loading ? (
              <div className="alert alert-info">Cargando paciente...</div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : !paciente ? (
              <div className="alert alert-warning">Seleccione un paciente válido.</div>
            ) : (
              <div className="row">
                <div className="col-md-5 mb-4">
                  <div className="card">
                    <div className="card-header bg-white">
                      <h5 className="card-title mb-0">Datos</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Nombres</label>
                        <p className="mb-0">{paciente.nombre || '-'}</p>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Apellidos</label>
                        <p className="mb-0">{paciente.apellido || '-'}</p>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Sexo</label>
                        <p className="mb-0">{sexoLabel(paciente.sexo)}</p>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Edad</label>
                        <p className="mb-2">Fecha de Nacimiento</p>
                        <p className="mb-0">{paciente.edad ?? '-'} {paciente.fecha_nacimiento ? `(${formatDate(paciente.fecha_nacimiento)})` : ''}</p>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">DUI</label>
                        <p className="mb-0">{paciente.dui || '-'}</p>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Teléfono</label>
                        <p className="mb-0">{paciente.telefono || '-'}</p>
                      </div>

                      <hr />
                      <div className="mb-3 d-flex gap-3">
                        <button className="btn btn-outline-primary" onClick={openEditModal} title="Editar paciente">Editar</button>
                      <button className="btn btn-outline-danger" onClick={handleDeletePaciente} title="Eliminar paciente">Eliminar</button>
                      </div>
                      
                    </div>
                  </div>
                </div>

                <div className="col-md-7 mb-4">
                  <div className="card">
                    <div className="card-header bg-white">
                      <h5 className="card-title mb-0">Historial Médico</h5>
                    </div>
                    <div className="card-body">
                      <p className="text-muted">Registro completo de exámenes y consultas</p>
                      <div>
                        <ul className="nav nav-tabs">
                          <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'examenes' ? 'active' : ''}`} onClick={() => setActiveTab('examenes')}>Exámenes realizados</button>
                          </li>
                          <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'citas' ? 'active' : ''}`} onClick={() => setActiveTab('citas')}>Citas</button>
                          </li>
                        </ul>

                        <div className="mt-3">
                          {histLoading ? (
                            <div className="alert alert-info">Cargando historial...</div>
                          ) : activeTab === 'examenes' ? (
                            <div>
                              {/* Filtros para exámenes realizados */}
                              <div className="row g-2 mb-3">
                                <div className="col-md-4">
                                  <label className="form-label small">Tipo de examen</label>
                                  <select className="form-select form-select-sm" value={filtroTipoExamen} onChange={(e) => setFiltroTipoExamen(e.target.value)}>
                                    <option value="">— Todos —</option>
                                    {tiposExamenes.map(t => (
                                      <option key={t.id_examen} value={t.id_examen}>{t.titulo_examen}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small">Desde</label>
                                  <input type="date" className="form-control form-control-sm" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small">Hasta</label>
                                  <input type="date" className="form-control form-control-sm" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} />
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                  <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => { setFiltroTipoExamen(''); setFiltroFechaDesde(''); setFiltroFechaHasta(''); }}>Limpiar</button>
                                </div>
                              </div>

                              <div className="table-responsive">
                                <table className="table table-hover table-sm">
                                  <thead>
                                    <tr>
                                      <th>Fecha</th>
                                      <th>Tipo de Examen</th>
                                      <th>Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      let filtered = examenesRealizados.slice();
                                      // filtrar por tipo
                                      if (filtroTipoExamen) {
                                        filtered = filtered.filter(ex => String(ex.id_examen) === String(filtroTipoExamen));
                                      }
                                      // filtrar por fecha (created_at)
                                      if (filtroFechaDesde) {
                                        filtered = filtered.filter(ex => {
                                          const ymd = String(ex.created_at || '').slice(0,10);
                                          return ymd >= filtroFechaDesde;
                                        });
                                      }
                                      if (filtroFechaHasta) {
                                        filtered = filtered.filter(ex => {
                                          const ymd = String(ex.created_at || '').slice(0,10);
                                          return ymd <= filtroFechaHasta;
                                        });
                                      }
                                      // ordenar por fecha desc
                                      filtered.sort((a,b) => {
                                        const ay = String(a.created_at||'').slice(0,19);
                                        const by = String(b.created_at||'').slice(0,19);
                                        return by.localeCompare(ay);
                                      });

                                      if (filtered.length === 0) {
                                        return (<tr><td colSpan={3} className="text-center text-muted">No hay exámenes registrados.</td></tr>);
                                      }

                                      return filtered.map((ex) => (
                                        <tr key={ex.id_examen_realizado}>
                                          <td>{formatDate(ex.created_at)}</td>
                                          <td>{getExamenNombre(ex.id_examen)}</td>
                                          <td>
                                            <div className="btn-group btn-group-sm" role="group">
                                              <button className="btn btn-outline-secondary" onClick={() => exportExamen(ex.id_examen_realizado)} title="Exportar"><i className="bi bi-file-earmark-arrow-down"></i></button>
                                              <button className="btn btn-outline-dark" onClick={() => printExamen(ex.id_examen_realizado)} title="Imprimir"><i className="bi bi-printer"></i></button>
                                            </div>
                                          </td>
                                        </tr>
                                      ));
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="d-flex gap-2 align-items-end mb-3">
                                <div>
                                  <label className="form-label">Desde</label>
                                  <input type="date" className="form-control" value={desde} onChange={(e) => setDesde(e.target.value)} />
                                </div>
                                <div>
                                  <label className="form-label">Hasta</label>
                                  <input type="date" className="form-control" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                                </div>
                                <div>
                                  <label className="form-label">Estado</label>
                                  <select className="form-select" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="1">Pendiente</option>
                                    <option value="2">Finalizada</option>
                                    <option value="3">Cancelada</option>
                                  </select>
                                </div>
                                <div className="align-self-end">
                                  <button className="btn btn-outline-primary" onClick={() => { /* filters applied by derived list below */ }}>Filtrar</button>
                                </div>
                              </div>

                              <div className="table-responsive">
                                <table className="table table-hover">
                                  <thead>
                                    <tr>
                                      <th>Fecha</th>
                                      <th>Hora</th>
                                      <th>Estado</th>
                                      <th>Observaciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      // apply client-side filters
                                      let filtered = Array.isArray(citas) ? citas.slice() : [];
                                      if (desde) {
                                        filtered = filtered.filter(c => c.fecha >= desde || (c.fecha && c.fecha.slice(0,10) >= desde));
                                      }
                                      if (hasta) {
                                        filtered = filtered.filter(c => c.fecha <= hasta || (c.fecha && c.fecha.slice(0,10) <= hasta));
                                      }
                                      if (estadoFiltro) {
                                        filtered = filtered.filter(c => String(c.estado) === String(estadoFiltro));
                                      }
                                      if (filtered.length === 0) return (<tr><td colSpan={4} className="text-center text-muted">No hay citas con esos filtros.</td></tr>);
                                      return filtered.map((c) => {
                                        const dateVal = c.fecha || c.fecha_cita || c.fecha_hora || c.date || null;
                                        const horaVal = c.hora || c.hora_cita || (dateVal ? (String(dateVal).match(/(\d{2}:\d{2})/)||[''])[0] : '');
                                        const estadoVal = c.estado || c.estado_cita || c.id_estado || c.status || null;
                                        const obsVal = c.observaciones || c.descripcion || c.nota || c.notas || c.detalle || c.examen || c.nombre || null;
                                        const estadoLabel = (estadoVal === 1 || String(estadoVal) === '1') ? 'Pendiente' : (estadoVal === 2 || String(estadoVal) === '2') ? 'Finalizada' : (estadoVal === 3 || String(estadoVal) === '3') ? 'Cancelada' : (estadoVal || '-');
                                        return (
                                          <tr key={c.id_cita || c.id || JSON.stringify(c)}>
                                            <td>{dateVal ? formatDate(dateVal) : '-'}</td>
                                            <td>{horaVal || '-'}</td>
                                            <td>{estadoLabel}</td>
                                            <td>{obsVal || '-'}</td>
                                          </tr>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          body, html {
            margin: 0;
            padding: 0;
          }
          .table th {
            border-top: none;
            font-weight: 600;
            color: #6c757d;
            background-color: #f8f9fa;
          }
          .card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
          }
          .card-header {
            border-bottom: 1px solid #e0e0e0;
            padding: 15px 20px;
          }
          .card-body {
            padding: 20px;
          }
        `}
      </style>
      {/* Edit Modal (same layout/fields as Pacientes.jsx modal) */}
      {showEditModal && (
        <>
          {/* overlay */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1040 }}
            onClick={closeEditModal}
          />

          <div
            className="position-fixed top-50 start-50 translate-middle bg-white shadow-lg"
            style={{
              zIndex: 1050,
              width: 'min(720px, 95vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '8px',
              padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Editar Paciente</h5>
              <button className="btn btn-sm btn-light" onClick={closeEditModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* error en el modal */}
            {editError && <div className="alert alert-danger">{editError}</div>}

            <form onSubmit={submitEdit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    name="nombre"
                    className="form-control"
                    value={editForm.nombre}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Apellido *</label>
                  <input
                    name="apellido"
                    className="form-control"
                    value={editForm.apellido}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Fecha de Nacimiento</label>
                  <input
                    name="fecha_nacimiento"
                    type="date"
                    className="form-control"
                    value={editForm.fecha_nacimiento}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Sexo *</label>
                  <select
                    name="sexo"
                    className="form-select"
                    value={editForm.sexo}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">-- Seleccione --</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="U">No especificado</option>
                  </select>
                </div>

                {/* Si no hay fecha, mostrar campo edad editable (solo en edit) */}
                {!editForm.fecha_nacimiento && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Edad</label>
                    <input
                      name="edad"
                      type="number"
                      className="form-control"
                      value={editForm.edad}
                      onChange={handleEditChange}
                    />
                  </div>
                )}

                {/* Si hay fecha y es menor de 18 mostramos edad calculada (readOnly) */}
                {editForm.fecha_nacimiento && editEdadLocal !== null && editEdadLocal < 18 && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Edad (calculada)</label>
                    <input type="number" className="form-control" value={editEdadLocal} readOnly />
                  </div>
                )}

                {/* Mostrar DUI si la edad local es >= 18 (o si no hay fecha pero se ingresó edad >=18) */}
                {editEdadLocal !== null && editEdadLocal >= 18 && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      DUI{' '}
                      <small className="text-muted">(########-#)</small>
                    </label>
                    <input
                      name="dui"
                      className="form-control"
                      value={editForm.dui}
                      onChange={handleEditChange}
                      placeholder="########-#"
                    />
                  </div>
                )}

                <div className="col-md-6 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    name="telefono"
                    className="form-control"
                    value={editForm.telefono}
                    onChange={handleEditChange}
                    placeholder="####-####"
                  />
                </div>

                {/* Opcional: otros campos... */}
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                  Cerrar
                </button>

                <button type="submit" className="btn" style={{ backgroundColor: '#00C2CC', color: '#fff' }} disabled={editLoading}>
                  {editLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
