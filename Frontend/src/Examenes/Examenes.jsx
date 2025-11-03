import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import DocxPrintPreview from "../components/DocxPrintPreview";

function Examenes() {
  const [examenesRealizados, setExamenesRealizados] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [previewDocxBlob, setPreviewDocxBlob] = useState(null);
  const [showDocxPreview, setShowDocxPreview] = useState(false);

  // Filters/search/pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipoExamen, setFilterTipoExamen] = useState(""); // id_examen or ''
  // default date range: start = today - 10 days, end = today (YYYY-MM-DD)
  const getYMD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = new Date();
  const ymdToday = getYMD(today);
  const ymdMinus10 = getYMD(new Date(today.getTime() - 10 * 24 * 3600 * 1000));
  const [filterStartDate, setFilterStartDate] = useState(ymdMinus10);
  const [filterEndDate, setFilterEndDate] = useState(ymdToday);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    // Cargar exámenes realizados
    axios
      .get("http://localhost:5000/api/examenes_realizados", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        setExamenesRealizados(res.data || []);
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

  // reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTipoExamen, filterStartDate, filterEndDate, examenesRealizados]);

  // Helpers
  const parseYMDToLocalDate = (ymd) => {
    if (!ymd) return null;
    const parts = String(ymd).split("-");
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    return new Date(y, m, d);
  };

  const formatFecha = (val) => {
    if (!val && val !== 0) return '';
    try {
      // accept Date or string; if string, try to use first 10 chars (YYYY-MM-DD)
      let dt = null;
      if (val instanceof Date) {
        dt = val;
      } else if (typeof val === 'string') {
        const ymd = val.slice(0,10);
        const d = parseYMDToLocalDate(ymd);
        dt = d || new Date(val);
      } else {
        dt = new Date(val);
      }
      const dd = String(dt.getDate()).padStart(2,'0');
      const mm = String(dt.getMonth()+1).padStart(2,'0');
      const yyyy = String(dt.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    } catch(e) {
      return String(val);
    }
  };

  // Helpers para mostrar nombre y tipo
  const getPacienteNombre = (id) => {
    const p = pacientes.find((x) => x.id_paciente === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  };

  const getExamenNombre = (id) => {
    const ex = examenes.find((x) => x.id_examen === id);
    return ex ? ex.titulo_examen : id;
  };

  // Derived list: search, filter by tipo and date, sort by date desc
  const filteredSorted = useMemo(() => {
    let list = Array.isArray(examenesRealizados) ? [...examenesRealizados] : [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((ex) => {
        const pac = getPacienteNombre(ex.id_paciente).toLowerCase();
        const tipo = getExamenNombre(ex.id_examen).toLowerCase();
        return pac.includes(q) || tipo.includes(q);
      });
    }
    if (filterTipoExamen) {
      list = list.filter((ex) => String(ex.id_examen) === String(filterTipoExamen));
    }
    // date filter using YYYY-MM-DD lexicographic compare
    const start = filterStartDate || '';
    const end = filterEndDate || '';
    list = list.filter((ex) => {
      const ymd = String(ex.created_at || '').slice(0,10);
      if (start && ymd < start) return false;
      if (end && ymd > end) return false;
      return true;
    });
    // sort by created_at desc (most recent first)
    list.sort((a,b) => {
      const ay = String(a.created_at||'').slice(0,19);
      const by = String(b.created_at||'').slice(0,19);
      return by.localeCompare(ay);
    });
    return list;
  }, [examenesRealizados, searchQuery, filterTipoExamen, filterStartDate, filterEndDate, pacientes, examenes]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / perPage));
  const currentData = filteredSorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Delete handler
  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar este examen?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      showClass: { popup: 'animate__animated animate__swing' },
      hideClass: { popup: 'animate__animated animate__fadeOut' }
    }).then((result) => {
      if (!result.isConfirmed) return;
      axios
        .delete(`http://localhost:5000/api/examenes_realizados/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then(() => {
          setExamenesRealizados((prev) => prev.filter((x) => x.id_examen_realizado !== id));
          Swal.fire({
            title: 'Eliminado',
            text: 'El examen fue eliminado correctamente',
            icon: 'success',
            timer: 1400,
            showConfirmButton: false
          });
        })
        .catch(() => {
          Swal.fire({ title: 'Error', text: 'No se pudo eliminar el examen', icon: 'error' });
        });
    });
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
      // Usar el nombre sugerido por el servidor en Content-Disposition o X-Filename si está disponible
      const headers = res.headers || {};
      let cd = headers['content-disposition'] || headers['Content-Disposition'];
      let suggested = headers['x-filename'] || headers['X-Filename'];
      if (!suggested && cd) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
        const fname = match ? (match[1] || match[2]) : '';
        if (fname) suggested = decodeURIComponent(fname);
      }
      if (!suggested) {
        // Fallback: armar nombre con datos locales
        const ex = examenesRealizados.find((e) => e.id_examen_realizado === id);
        const nombre = ex ? getPacienteNombre(ex.id_paciente) : `examen_${id}`;
        const tipo = ex ? getExamenNombre(ex.id_examen) : '';
        const d = ex ? new Date(ex.created_at) : new Date();
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const yyyy = String(d.getFullYear());
        suggested = `${nombre} - ${tipo} - ${dd}-${mm}-${yyyy}.docx`;
      }
      a.download = suggested;
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

  // Imprimir PDF generado desde la misma plantilla de Word (requiere LibreOffice en servidor)
  const printExamen = async (id) => {
    // Intento 1: PDF por backend (LibreOffice). Si falla, fallback a vista DOCX en el navegador con opción de imprimir.
    try {
      const res = await axios.get(
        `http://localhost:5000/api/examenes_realizados/${id}/export-pdf`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) throw new Error('Bloqueado por el navegador');
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
      return;
    } catch (err) {
      // Fallback: obtener DOCX y mostrar previsualización con impresión integrada (sin LibreOffice)
      try {
        const resDocx = await axios.get(
          `http://localhost:5000/api/examenes_realizados/${id}/export`,
          {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        const blob = new Blob([resDocx.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        setPreviewDocxBlob(blob);
        setShowDocxPreview(true);
      } catch (e2) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo mostrar el documento para imprimir. Intente exportar a .docx o contacte al administrador.' });
      }
    }
  };

  return (
    <div style={{ marginLeft: 250, padding: 20, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="container py-4" style={{ maxWidth: 1100, margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #eee", minHeight: "70vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0" style={{ color: "#00C2CC" }}>Exámenes Realizados</h2>
          <div className="d-flex gap-2">
            <button className="btn btn-info text-white" onClick={() => navigate("/realizar-examen")}>
              Registrar examen a paciente
            </button>
            <button className="btn btn-outline-info" onClick={() => navigate("/crud-examenes")}>
              Catálogo de exámenes
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="card mb-3">
          <div className="card-body py-3">
            <div className="d-flex flex-wrap gap-3 align-items-end">
              <div className="d-flex flex-column" style={{ minWidth: 260 }}>
                <label className="form-label small mb-1">Buscar</label>
                <input
                  className="form-control"
                  placeholder="Paciente o tipo de examen"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="d-flex flex-column" style={{ width: 240 }}>
                <label className="form-label small mb-1">Tipo de examen</label>
                <select className="form-select" value={filterTipoExamen} onChange={(e) => setFilterTipoExamen(e.target.value)}>
                  <option value="">— Todos —</option>
                  {examenes.map((x) => (
                    <option key={x.id_examen} value={x.id_examen}>{x.titulo_examen}</option>
                  ))}
                </select>
              </div>
              <div className="d-flex flex-column">
                <label className="form-label small mb-1">Desde</label>
                <DatePicker
                  selected={filterStartDate ? parseYMDToLocalDate(filterStartDate) : null}
                  onChange={(date) => setFilterStartDate(date ? getYMD(date) : '')}
                  className="form-control form-control-sm border-info"
                  placeholderText="Seleccionar fecha"
                  dateFormat="dd-MM-yyyy"
                  isClearable
                />
              </div>
              <div className="d-flex flex-column">
                <label className="form-label small mb-1">Hasta</label>
                <DatePicker
                  selected={filterEndDate ? parseYMDToLocalDate(filterEndDate) : null}
                  onChange={(date) => setFilterEndDate(date ? getYMD(date) : '')}
                  className="form-control form-control-sm border-info"
                  placeholderText="Seleccionar fecha"
                  dateFormat="dd-MM-yyyy"
                  isClearable
                />
              </div>
              <div className="ms-auto">
                <button
                  className="btn btn-sm btn-info text-white"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterTipoExamen('');
                    setFilterStartDate(ymdMinus10);
                    setFilterEndDate(ymdToday);
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th style={{ width: 220 }}>Paciente</th>
                  <th style={{ width: 220 }}>Examen</th>
                  <th style={{ width: 140 }}>Fecha</th>
                  <th style={{ width: 180 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">No hay exámenes realizados.</td>
                  </tr>
                ) : (
                  currentData.map((ex) => (
                    <tr key={ex.id_examen_realizado}>
                      <td>{ex.id_examen_realizado}</td>
                      <td>{getPacienteNombre(ex.id_paciente)}</td>
                      <td>{getExamenNombre(ex.id_examen)}</td>
                      <td>{formatFecha(ex.created_at)}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-info text-white"
                            onClick={() =>
                              navigate('/realizar-examen', { state: { editId: ex.id_examen_realizado } })
                            }
                            title="Ver/Editar"
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Ver/Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => exportExamen(ex.id_examen_realizado)}
                            title="Exportar a .docx"
                          >
                            <i className="bi bi-file-earmark-arrow-down me-1"></i>
                            Exportar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => printExamen(ex.id_examen_realizado)}
                            title="Imprimir"
                          >
                            <i className="bi bi-printer me-1"></i>
                            Imprimir
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(ex.id_examen_realizado)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash me-1"></i>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <nav>
          <ul className="pagination pagination-sm justify-content-end m-3">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Anterior</button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Siguiente</button>
            </li>
          </ul>
        </nav>
      </div>
      {showDocxPreview && (
        <DocxPrintPreview
          blob={previewDocxBlob}
          onClose={() => setShowDocxPreview(false)}
        />
      )}
    </div>
  );
}

export default Examenes;
