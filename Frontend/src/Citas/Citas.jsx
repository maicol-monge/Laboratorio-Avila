import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Citas() {
	const [citas, setCitas] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({ id_paciente: '', fecha_cita: '', hora_cita: '', observaciones: '' });
	const [pacientes, setPacientes] = useState([]);
	const [pacienteQuery, setPacienteQuery] = useState('');
	const [pacientesError, setPacientesError] = useState(null);
	const [quickForm, setQuickForm] = useState({ nombre: '', apellido: '', sexo: 'M', fecha_nacimiento: '', edad: '', telefono: '' });
	const [creatingQuick, setCreatingQuick] = useState(false);
	const [quickMode, setQuickMode] = useState(false);

	const token = localStorage.getItem('token');
	const [svMinDate, setSvMinDate] = useState(null);
	const [svMinTime, setSvMinTime] = useState(null);

	const [horaH, setHoraH] = useState('');
	const [horaM, setHoraM] = useState('');

	const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
	const api = axios.create({ baseURL: API_BASE, headers: { Authorization: token ? `Bearer ${token}` : '' } });

	const [editingId, setEditingId] = useState(null);
	const navigate = useNavigate();

	// Helper to consistently render only the time portion as HH:MM
	function formatHora(hora) {
		if (!hora && hora !== 0) return '-';
		try {
			// Prefer extracting a HH:MM pattern from strings to avoid Date timezone conversions
			if (typeof hora === 'string') {
				// Match first occurrence of HH:MM (optionally :SS) in the string
				const m = hora.match(/(\d{2}:\d{2})(?::\d{2})?/);
				if (m && m[1]) return m[1];
				// fallback to first 5 chars
				if (hora.length >= 5) return hora.slice(0,5);
				return '-';
			}
			// If it's a Date object, fall back to extracting its hours/minutes (local time)
			if (hora instanceof Date) {
				if (isNaN(hora.getTime())) return '-';
				return `${String(hora.getHours()).padStart(2,'0')}:${String(hora.getMinutes()).padStart(2,'0')}`;
			}
			// As a last resort, try to parse and extract UTC time components to avoid local TZ shifts
			const d = new Date(hora);
			if (!isNaN(d.getTime())) {
				// Use UTC hours/minutes to avoid converting an implicitly-UTC string into local time
				return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
			}
			return '-';
		} catch (e) {
			return '-';
		}
	}

	useEffect(() => {
		fetchCitas();
	}, []);

	function fetchCitas() {
		setLoading(true);
		api.get('/api/citas/')
				.then(res => {
					console.debug('GET /api/citas response:', res.data);
				// Asegurarnos de que citas es un array
				if (Array.isArray(res.data)) {
					setCitas(res.data);
				} else if (res.data && typeof res.data === 'object') {
					// Si el backend devolviera un objeto con propiedad 'results' o similar
					const maybe = res.data.results || res.data.data || res.data.citas;
					if (Array.isArray(maybe)) setCitas(maybe);
					else setCitas([]);
				} else {
					setCitas([]);
				}
			})
			.catch(err => console.error(err))
			.finally(() => setLoading(false));
	}

	// Cargar pacientes (para el select)
	async function fetchPacientes() {
		setPacientesError(null);
		try {
			// usar la instancia `api` para mantener Authorization y base uniforme
			const r = await api.get('/api/pacientes');
			console.debug('GET /api/pacientes response:', r.data);
			if (Array.isArray(r.data)) setPacientes(r.data);
			else setPacientes([]);
		} catch (err) {
			console.error('Error loading pacientes', err);
			setPacientes([]);
			setPacientesError(err.response?.data?.message || err.message || 'Error cargando pacientes');
		}
	}

	async function openNew() {
		setForm({ id_paciente: '', fecha_cita: '', hora_cita: '', observaciones: '' });
		// intentar cargar pacientes antes de abrir el modal para mostrar errores si los hay
		await fetchPacientes();
		// calcular fecha/hora mínima en zona El Salvador (UTC-6)
		const now = new Date();
		const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
		const svMs = utcMs + (-6 * 3600000);
		const svNow = new Date(svMs);
		const pad = (n) => String(n).padStart(2, '0');
		const svDate = `${svNow.getFullYear()}-${pad(svNow.getMonth() + 1)}-${pad(svNow.getDate())}`;
		const svTime = `${pad(svNow.getHours())}:${pad(svNow.getMinutes())}:${pad(svNow.getSeconds())}`;
		setSvMinDate(svDate);
		setSvMinTime(svTime);
		// por defecto, preseleccionar la fecha de hoy (SV) y hora actual (HH:MM)
		const defaultHM = svTime.slice(0,5);
		setForm(f => ({ ...f, fecha_cita: svDate, hora_cita: defaultHM }));
		setHoraH(defaultHM.slice(0,2));
		setHoraM(defaultHM.slice(3,5));
		setEditingId(null);
		setShowModal(true);
	}

	function openEdit(c) {
		// preparar datos para editar: normalizar fecha y hora a inputs
		const pad = (n) => String(n).padStart(2, '0');
		let fecha = '';
		let hora = '';
		if (c.fecha_cita) {
			if (typeof c.fecha_cita === 'string') fecha = c.fecha_cita.split('T')[0];
			else {
				const d = new Date(c.fecha_cita);
				fecha = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
			}
		}
		if (c.hora_cita) {
			if (typeof c.hora_cita === 'string') {
				const t = c.hora_cita.split('T').pop();
				hora = t ? t.split('.')[0].slice(0,5) : c.hora_cita.slice(0,5);
			} else {
				const dt = new Date(c.hora_cita);
				hora = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
			}
		}
		setForm({ id_paciente: c.id_paciente || '', fecha_cita: fecha, hora_cita: hora, observaciones: c.observaciones || '', estado: c.estado || '1' });
		if (hora) {
			const [hh, mm] = hora.split(':');
			setHoraH(hh);
			setHoraM(mm);
		} else {
			setHoraH('');
			setHoraM('');
		}
		setEditingId(c.id_cita);
		// calcular mínimos en SV por si edita hoy
		const now = new Date();
		const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
		const svMs = utcMs + (-6 * 3600000);
		const svNow = new Date(svMs);
		const svDate = `${svNow.getFullYear()}-${pad(svNow.getMonth() + 1)}-${pad(svNow.getDate())}`;
		const svTime = `${pad(svNow.getHours())}:${pad(svNow.getMinutes())}:${pad(svNow.getSeconds())}`;
		setSvMinDate(svDate);
		setSvMinTime(svTime);
		setShowModal(true);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			let pacienteId = form.id_paciente || null;
			// Si quickMode está activo, crear paciente primero
			if (quickMode) {
				setCreatingQuick(true);
				const body = {
					nombre: quickForm.nombre,
					apellido: quickForm.apellido,
					sexo: quickForm.sexo,
					telefono: quickForm.telefono,
					fecha_nacimiento: quickForm.fecha_nacimiento || null,
				};
				if (!body.fecha_nacimiento && quickForm.edad) body.edad = Number(quickForm.edad);
				const res = await api.post('/api/pacientes', body);
				pacienteId = res.data?.id_paciente || res.data?.insertId || null;
				setCreatingQuick(false);
				// recargar pacientes y seleccionar
				await fetchPacientes();
				if (pacienteId) setForm(f => ({ ...f, id_paciente: pacienteId }));
			}

			const payload = { ...form, id_paciente: pacienteId };
			if (typeof payload.estado === 'undefined' || payload.estado === null || payload.estado === '') payload.estado = '1';

			// Validar que la fecha no esté en el pasado (en zona SV)
			if (svMinDate) {
				const fecha = payload.fecha_cita;
				if (!fecha) throw new Error('Fecha de cita requerida');
				if (fecha < svMinDate) throw new Error('No puede seleccionar una fecha pasada');
				// si es hoy, validar hora >= svMinTime
				if (fecha === svMinDate && svMinTime && payload.hora_cita) {
					const horaNormalized = payload.hora_cita.length === 5 ? payload.hora_cita + ':00' : payload.hora_cita;
					if (horaNormalized < svMinTime) throw new Error('No puede seleccionar una hora pasada para hoy');
				}
			}

			// Normalizar hora para enviar al backend: backend espera HH:MM:SS
			if (payload.hora_cita && payload.hora_cita.length === 5) {
				payload.hora_cita = payload.hora_cita + ':00';
			}

			// Validar si el horario ya está tomado comparando con citas cargadas (simple comprobación local)
			const horarioT = (fechaCheck, horaCheck) => {
				if (!Array.isArray(citas)) return false;
				const pad = (n) => String(n).padStart(2, '0');
				const horaNorm = horaCheck ? (horaCheck.length === 5 ? horaCheck : horaCheck.slice(0,5)) : '';
				for (const c of citas) {
					try {
						// intentar leer fecha/hora de la cita; algunos backends guardan separado
						const dDate = c.fecha_cita ? new Date(c.fecha_cita) : null;
						const dTime = c.hora_cita ? new Date(c.hora_cita) : null;
						// preferir composición manual si las columnas vienen como strings
						let dateStr = null, timeStr = null;
						if (c.fecha_cita && typeof c.fecha_cita === 'string') {
							dateStr = c.fecha_cita.split('T')[0];
						}
						if (c.hora_cita && typeof c.hora_cita === 'string') {
							// hora_cita puede ser 'HH:MM:SS' o a veces full datetime
							const t = c.hora_cita.split('T').pop();
							timeStr = t ? t.split('.')[0].slice(0,8) : null;
						}
						if (!dateStr && dDate && !isNaN(dDate.getTime())) {
							dateStr = `${dDate.getFullYear()}-${pad(dDate.getMonth()+1)}-${pad(dDate.getDate())}`;
						}
						if (!timeStr && dTime && !isNaN(dTime.getTime())) {
							timeStr = `${pad(dTime.getHours())}:${pad(dTime.getMinutes())}:${pad(dTime.getSeconds())}`;
						}
						if (!dateStr || !timeStr) continue;
						if (dateStr === fechaCheck && timeStr.slice(0,5) === horaNorm) return true;
					} catch (e) {
						continue;
					}
				}
				return false;
			};

			if (horarioT(payload.fecha_cita, payload.hora_cita)) {
				throw new Error('Horario no disponible (según citas cargadas)');
			}
			if (editingId) {
				await api.put(`/api/citas/${editingId}`, payload);
				setEditingId(null);
			} else {
				await api.post('/api/citas', payload);
			}
			setShowModal(false);
			fetchCitas();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || err.message || 'Error');
		} finally {
			setLoading(false);
			setCreatingQuick(false);
		}
	}

	// crear paciente rapido desde modal
	function handleQuickCreate(e) {
		e.preventDefault();
		setCreatingQuick(true);
		const token = localStorage.getItem('token');
		const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
		// preparar body similar a Pacientes.jsx: enviar fecha_nacimiento o edad
		const body = {
			nombre: quickForm.nombre,
			apellido: quickForm.apellido,
			sexo: quickForm.sexo,
			telefono: quickForm.telefono,
			fecha_nacimiento: quickForm.fecha_nacimiento || null,
		};
		if (!body.fecha_nacimiento && quickForm.edad) body.edad = Number(quickForm.edad);

		api.post('/api/pacientes', body)
			.then(res => {
				// recargar lista de pacientes y seleccionar el creado
				fetchPacientes();
				// si backend devuelve id en res (como id_paciente) intentar usarlo
				const newId = res.data?.id_paciente || res.data?.insertId || null;
				if (newId) setForm(f => ({ ...f, id_paciente: newId }));
				// si no devuelve id, buscaremos por nombre/apellido e intentaremos seleccionar el más reciente
				setQuickForm({ nombre: '', apellido: '', sexo: 'M', fecha_nacimiento: '', edad: '', telefono: '' });
				alert('Paciente creado y seleccionado');
			})
			.catch(err => {
				console.error(err);
				alert('Error creando paciente: ' + (err.response?.data?.message || err.message));
			})
			.finally(() => setCreatingQuick(false));
	}

	function handleDelete(id) {
		if (!confirm('¿Cancelar esta cita?')) return;
		api.delete(`/api/citas/${id}`)
			.then(() => fetchCitas())
			.catch(err => alert(err.response?.data?.message || 'Error'));
	}

	return (
		<div style={{ marginLeft: 270, padding: 24 }}>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<div>
					<h2>Citas</h2>
					<small className="text-muted">Gestión y programación de citas</small>
				</div>
				<div>
					<input className="form-control d-inline-block me-3" style={{ width: 320 }} placeholder="Buscar paciente..." />
					<button className="btn btn-info text-white" onClick={openNew}>Nueva Cita</button>
				</div>
			</div>

			<div className="card mb-4">
				<div className="card-header">Lista de Pacientes</div>
				<div className="card-body p-0">
					<table className="table mb-0">
						<thead>
							<tr>
								<th>Id</th>
								<th>Paciente</th>
								<th>Fecha</th>
								<th>Hora</th>
								<th>Estado</th>
								<th>Acciones</th>
							</tr>
						</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={6}>Cargando...</td></tr>
								) : (!Array.isArray(citas) || citas.length === 0) ? (
									<tr><td colSpan={6}>No hay citas</td></tr>
								) : (
									citas.map(c => (
										<tr key={c.id_cita}>
											<td>{c.id_cita}</td>
											<td>{c.nombre ? `${c.nombre} ${c.apellido}` : '-'}</td>
											<td>{c.fecha_cita ? new Date(c.fecha_cita).toLocaleDateString() : '-'}</td>
											<td>{formatHora(c.hora_cita)}</td>
											<td>{c.estado === '1' ? 'Pendiente' : c.estado === '2' ? 'Atendida' : 'Cancelada'}</td>
											<td>
												<div className="btn-group" role="group">
													<button
														className="btn btn-sm btn-info text-white me-2"
														title="Ver expediente"
														onClick={() => {
															if (c.id_paciente) navigate('/fichaPaciente', { state: { id: c.id_paciente } });
															else alert('Esta cita no tiene paciente vinculado');
														}}
													>
														<i className="bi bi-file-earmark-person"></i>
													</button>
													<button className="btn btn-sm btn-primary me-2" onClick={() => openEdit(c)} title="Editar">
														<i className="bi bi-pencil"></i>
													</button>
													<button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id_cita)} title="Eliminar">
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

			{/* Modal (simplificado) */}
			{showModal && (
				<div className="modal d-block" tabIndex={-1}>
					<div className="modal-dialog">
						<div className="modal-content">
							<div className="modal-header">
								<h5 className="modal-title">{editingId ? 'Editar cita' : 'Nueva cita'}</h5>
								<button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
							</div>
							<form onSubmit={handleSubmit}>
								<div className="modal-body">
									<div className="mb-3 d-flex align-items-center justify-content-between">
										<div>
											<strong>Paciente</strong>
											<div className="small text-muted">Seleccione existente o cree uno rápido</div>
										</div>
										<div>
											<button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setQuickMode(q => !q); if (!quickMode) setPacienteQuery(''); }}>
												{quickMode ? 'Usar select' : 'Crear paciente rápido'}
											</button>
										</div>
									</div>

									{!quickMode && (
										<div className="mb-3">
											<label className="form-label">Buscar paciente por nombre o DUI</label>
											<input className="form-control mb-2" value={pacienteQuery} onChange={e => setPacienteQuery(e.target.value)} placeholder="Buscar..." />
											{pacientesError && (
												<div className="alert alert-warning mt-2">Error cargando pacientes: {pacientesError} <button className="btn btn-sm btn-link" onClick={fetchPacientes}>Reintentar</button></div>
											)}
											<label className="form-label">Seleccionar paciente (opcional)</label>
											{pacientes.length === 0 ? (
												<div className="text-muted">No hay pacientes disponibles</div>
											) : (
												<select className="form-select" value={form.id_paciente} onChange={e => setForm({ ...form, id_paciente: e.target.value })}>
													<option value="">-- Ninguno --</option>
													{pacientes
														.filter(p => {
															const q = pacienteQuery.trim().toLowerCase();
															if (!q) return true;
															const name = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
															const dui = (p.dui || '').toLowerCase();
															return name.includes(q) || dui.includes(q) || (q.replace(/\D/g, '') && (p.dui || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')));
														})
														.map(p => (
															<option key={p.id_paciente} value={p.id_paciente}>{p.id_paciente} - {p.nombre} {p.apellido} {p.dui ? `(${p.dui})` : ''}</option>
														))}
												</select>
											)}
										</div>
									)}

									{quickMode && (
										<div className="mb-3">
											<h6>Crear paciente rápido</h6>
											{/* quick form (reutilizado) */}
											<div className="row">
												<div className="col-md-6 mb-2">
													<input className="form-control" placeholder="Nombre" value={quickForm.nombre} onChange={e => setQuickForm({ ...quickForm, nombre: e.target.value })} required />
												</div>
												<div className="col-md-6 mb-2">
													<input className="form-control" placeholder="Apellido" value={quickForm.apellido} onChange={e => setQuickForm({ ...quickForm, apellido: e.target.value })} required />
												</div>
												<div className="col-md-4 mb-2">
													<select className="form-select" value={quickForm.sexo} onChange={e => setQuickForm({ ...quickForm, sexo: e.target.value })}>
														<option value="M">M</option>
														<option value="F">F</option>
														<option value="U">U</option>
													</select>
												</div>
												<div className="col-md-4 mb-2">
													<input className="form-control" placeholder="Fecha nac (YYYY-MM-DD)" value={quickForm.fecha_nacimiento} onChange={e => setQuickForm({ ...quickForm, fecha_nacimiento: e.target.value })} />
												</div>
												<div className="col-md-4 mb-2">
													<input className="form-control" placeholder="Edad" value={quickForm.edad} onChange={e => setQuickForm({ ...quickForm, edad: e.target.value })} />
												</div>
												<div className="col-md-6 mb-2">
													<input className="form-control" placeholder="Teléfono" value={quickForm.telefono} onChange={e => setQuickForm({ ...quickForm, telefono: e.target.value })} />
												</div>
											</div>
										</div>
									)}
									<div className="mb-3">
										<label className="form-label">Fecha</label>
										<input type="date" className="form-control" value={form.fecha_cita} min={svMinDate || undefined} onChange={e => setForm({ ...form, fecha_cita: e.target.value })} />
									</div>
									<div className="mb-3">
										<label className="form-label">Hora</label>
										<div className="d-flex align-items-center">
											<input
												type="number"
												className="form-control me-2"
												style={{ width: 100 }}
												min={0}
												max={23}
												value={horaH}
												onChange={e => {
													let v = e.target.value.replace(/[^0-9]/g, '');
													if (v === '') { setHoraH(''); setForm(prev => ({ ...prev, hora_cita: '' })); return; }
													v = Math.max(0, Math.min(23, Number(v))).toString().padStart(2, '0');
													setHoraH(v);
													const mm = horaM || '00';
													setForm(prev => ({ ...prev, hora_cita: `${v}:${mm}` }));
												}}
											/>
											<span className="mx-1">:</span>
											<input
												type="number"
												className="form-control"
												style={{ width: 100 }}
												min={0}
												max={59}
												value={horaM}
												onChange={e => {
													let v = e.target.value.replace(/[^0-9]/g, '');
													if (v === '') { setHoraM(''); setForm(prev => ({ ...prev, hora_cita: '' })); return; }
													v = Math.max(0, Math.min(59, Number(v))).toString().padStart(2, '0');
													setHoraM(v);
													const hh = horaH || '00';
													setForm(prev => ({ ...prev, hora_cita: `${hh}:${v}` }));
												}}
											/>
											<small className="text-muted ms-3">Usa las flechas o escribe (HH:MM)</small>
										</div>
									</div>
									<div className="mb-3">
										<label className="form-label">Observaciones</label>
										<textarea className="form-control" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
									</div>

									<div className="mb-3">
										<label className="form-label">Estado</label>
										<select className="form-select" value={form.estado || '1'} onChange={e => setForm({ ...form, estado: e.target.value })}>
											<option value="1">1 - Pendiente</option>
											<option value="2">2 - Finalizada</option>
											<option value="0">0 - Cancelada</option>
										</select>
									</div>
								</div>
								<div className="modal-footer">
									<button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
									<button type="submit" className="btn btn-primary">Guardar</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

