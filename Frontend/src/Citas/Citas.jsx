import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import axios from 'axios';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from 'sweetalert2';




export default function Citas() {	
	const [citas, setCitas] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({ id_paciente: '', fecha_cita: '', hora_cita: '', observaciones: '' });
	const [pacientes, setPacientes] = useState([]);
	const [pacienteQuery, setPacienteQuery] = useState('');
	const [pacientesError, setPacientesError] = useState(null);
	const [quickForm, setQuickForm] = useState({ nombre: '', apellido: '', sexo: 'M', fecha_nacimiento: '', edad: '', telefono: '', dui: '' });
	const [creatingQuick, setCreatingQuick] = useState(false);
	const [quickMode, setQuickMode] = useState(false);

	const token = localStorage.getItem('token');
		// helper to get YYYY-MM-DD from a Date (used by SV helpers)
		const getYMD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

		// helper to get current time in El Salvador (UTC-6)
		const getSVNow = (d = new Date()) => {
			const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
			const svMs = utcMs + (-6 * 3600000);
			return new Date(svMs);
		};

		// default SV today and one week ahead (YYYY-MM-DD)
		const svTodayYMD = getYMD(getSVNow());
		const svWeekYMD = getYMD(new Date(getSVNow().getTime() + 7 * 24 * 3600000));



	const [svMinDate, setSvMinDate] = useState(svTodayYMD);
	const [svMinTime, setSvMinTime] = useState(() => {
		const sv = getSVNow();
		const pad = n => String(n).padStart(2, '0');
		return `${pad(sv.getHours())}:${pad(sv.getMinutes())}:${pad(sv.getSeconds())}`;
	});

	const [horaH, setHoraH] = useState('');
	const [horaM, setHoraM] = useState('');

	const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
	const api = axios.create({ baseURL: API_BASE, headers: { Authorization: token ? `Bearer ${token}` : '' } });

	const [editingId, setEditingId] = useState(null);
	const [editingPacienteLabel, setEditingPacienteLabel] = useState('');

	const fechaInputRef = useRef(null);

	// filtros: fecha inicio, fecha fin, estado
	const weekYMD = getYMD(new Date(Date.now() + 7 * 24 * 3600 * 1000));
	// filtros: por defecto desde hoy (SV) hasta una semana en el futuro, estado Pendiente
	const [filterStartDate, setFilterStartDate] = useState(svTodayYMD);
	const [filterEndDate, setFilterEndDate] = useState(svWeekYMD);
	const [filterEstado, setFilterEstado] = useState('1'); // por defecto 1 - Pendiente

	const navigate = useNavigate();
	const location = useLocation();
	// If navigated from FichaPaciente, location.state.preselectPacienteId may be present
	const preselectPacienteIdFromLocation = location?.state?.preselectPacienteId || null;
	const openedFromLocationRef = useRef(false);

	useEffect(() => {
			// if navigation provided a preselected paciente id, prefill and open the modal once
			if (preselectPacienteIdFromLocation && !openedFromLocationRef.current) {
				openedFromLocationRef.current = true;
				(async () => {
					try {
						// try to fetch the paciente to show label
						const r = await api.get(`/api/pacientes/${preselectPacienteIdFromLocation}`);
						const pacienteData = r?.data;
						if (pacienteData) {
							setForm({ id_paciente: preselectPacienteIdFromLocation, fecha_cita: '', hora_cita: '', observaciones: '' });
							setEditingPacienteLabel(((pacienteData.nombre || '') + ' ' + (pacienteData.apellido || '')).trim());
						} else {
							// still set id so modal shows readonly patient id
							setForm(f => ({ ...f, id_paciente: preselectPacienteIdFromLocation }));
							setEditingPacienteLabel(`Paciente #${preselectPacienteIdFromLocation}`);
						}

						// calcular fecha/hora mínima en zona El Salvador (UTC-6) and default values
						const now = new Date();
						const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
						const svMs = utcMs + (-6 * 3600000);
						const svNow = new Date(svMs);
						const pad = (n) => String(n).padStart(2, '0');
						const svDate = `${svNow.getFullYear()}-${pad(svNow.getMonth() + 1)}-${pad(svNow.getDate())}`;
						const svTime = `${pad(svNow.getHours())}:${pad(svNow.getMinutes())}:${pad(svNow.getSeconds())}`;
						setSvMinDate(svDate);
						setSvMinTime(svTime);
						const defaultHM = svTime.slice(0,5);
						setForm(f => ({ ...f, fecha_cita: svDate, hora_cita: defaultHM }));
						setHoraH(defaultHM.slice(0,2));
						setHoraM(defaultHM.slice(3,5));
						setEditingId(null);
						setQuickMode(false);
						setShowModal(true);
					} catch (e) {
						console.warn('Error preselecting paciente for new cita', e);
					}
				})();
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [preselectPacienteIdFromLocation]);

	// Pagination state (similar behaviour to Inventario.jsx)
	const [currentPage, setCurrentPage] = useState(1);
	const perPage = 5;

	// Reset to first page when filters or data change
	useEffect(() => {
		setCurrentPage(1);
	}, [filterStartDate, filterEndDate, filterEstado, citas]);

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

	// parse a YYYY-MM-DD into a local Date object (avoid timezone shift)
	function parseYMDToLocalDate(ymd) {
		if (!ymd) return null;
		const parts = ymd.split('-');
		if (parts.length !== 3) return null;
		const y = Number(parts[0]);
		const m = Number(parts[1]) - 1;
		const d = Number(parts[2]);
		return new Date(y, m, d);
	}

	// render various date inputs as dd-MM-yyyy for display
	function formatFecha(val) {
		if (!val && val !== 0) return '-';
		try {
			const s = String(val);
			// prefer extracting YYYY-MM-DD if present
			const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
			if (m) return `${m[3]}-${m[2]}-${m[1]}`;
			const d = new Date(val);
			if (isNaN(d.getTime())) return '-';
			const dd = String(d.getDate()).padStart(2, '0');
			const mm = String(d.getMonth() + 1).padStart(2, '0');
			const yyyy = d.getFullYear();
			return `${dd}-${mm}-${yyyy}`;
		} catch (e) {
			return '-';
		}
	}

	// Helpers reused from Pacientes.jsx: format phone/dui and validate quick patient form
	function formatTelefonoInput(value) {
		return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{4})(\d{0,4})/, '$1-$2');
	}

	function formatDuiInput(value) {
		return value.replace(/\D/g, '').slice(0, 9).replace(/(\d{8})(\d{0,1})/, '$1-$2');
	}

	function normalizeFechaToISO(val) {
		if (!val) return null;
		// accept DD/MM/YYYY or YYYY-MM-DD
		if (val.includes('/')) {
			const parts = val.split('/');
			if (parts.length === 3) {
				const [d, m, y] = parts;
				return `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
			}
		}
		return val;
	}

	function validateQuickBeforeCreate() {
		// same rules as Pacientes.validarAntesDeEnviar
		if (!quickForm.nombre || !quickForm.apellido) return 'Nombre y Apellido son obligatorios.';
		if (!quickForm.sexo || !/^[MFOU]$/.test(String(quickForm.sexo).toUpperCase())) return 'Seleccione el sexo del paciente.';
		const fn = normalizeFechaToISO(quickForm.fecha_nacimiento);
		// si hay fecha, validar que no sea futura (solo permitir hoy o pasado)
		if (fn) {
			const fnDate = (fn.split && fn.split('T')[0]) || fn;
			const today = new Date();
			const todayYMD = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
			if (fnDate > todayYMD) return 'La fecha de nacimiento no puede ser futura.';
		}
		if (!fn && (quickForm.edad === '' || quickForm.edad === null || typeof quickForm.edad === 'undefined')) {
			return Swal.fire({
				icon: 'warning',
				title: 'Dato requerido',
				text: 'Ingrese Fecha de Nacimiento o Edad.',
				confirmButtonColor: '#17a2b8'
			});
		}
		if (quickForm.dui && !/^\d{8}-\d{1}$/.test(quickForm.dui)) return 'Formato de DUI inválido. Debe ser ########-#.';
		if (quickForm.telefono && !/^\d{4}-\d{4}$/.test(quickForm.telefono)) return 'Teléfono con formato inválido. Debe ser ####-####.';
		return null;
	}

	// calcular edad local para quickForm (similar a Pacientes.jsx)
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
		if (quickForm.edad !== '' && quickForm.edad !== null && typeof quickForm.edad !== 'undefined') {
			const n = Number(quickForm.edad);
			if (Number.isFinite(n)) return n;
		}
		return null;
	})();

	// Si el paciente es menor de 18 años, ocultamos el campo DUI y limpiamos su valor
	useEffect(() => {
		const isAdult = (quickEdadLocal !== null && quickEdadLocal >= 18) || (!quickForm.fecha_nacimiento && quickForm.edad !== '' && Number(quickForm.edad) >= 18);
		if (!isAdult && quickForm.dui) {
			setQuickForm(q => ({ ...q, dui: '' }));
		}
	}, [quickEdadLocal, quickForm.fecha_nacimiento, quickForm.edad]);

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

	// Computed filtered list using fecha and estado
	const filteredCitas = (Array.isArray(citas) ? citas : []).filter(c => {
		try {
			// extraer fecha YYYY-MM-DD de c.fecha_cita
			let dateStr = '';
			if (c && c.fecha_cita) {
				if (typeof c.fecha_cita === 'string') {
					const m = c.fecha_cita.match(/(\d{4}-\d{2}-\d{2})/);
					dateStr = m ? m[1] : c.fecha_cita.split('T')[0] || '';
				} else {
					const d = new Date(c.fecha_cita);
					if (!isNaN(d.getTime())) dateStr = getYMD(d);
				}
			}
			if (!dateStr) return false;
			if (filterStartDate && dateStr < filterStartDate) return false;
			if (filterEndDate && dateStr > filterEndDate) return false;
			if (filterEstado && String(filterEstado) !== '') {
				return String(c.estado) === String(filterEstado);
			}
			return true;
		} catch (e) {
			return false;
		}
	});

	// Pagination derived values
	const totalPages = Math.max(1, Math.ceil(filteredCitas.length / perPage));
	const currentData = filteredCitas.slice((currentPage - 1) * perPage, currentPage * perPage);

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

	// Autoseleccionar cuando la búsqueda produce exactamente una coincidencia
	useEffect(() => {
		// Solo aplicar autoselección si no estamos editando
		if (editingId) return;
		
		const q = (pacienteQuery || "").trim().toLowerCase();
		if (!q) return; // no modificar selección si no hay búsqueda

		const matches = pacientes.filter((p) => {
			const name = `${p.nombre || ""} ${p.apellido || ""}`.toLowerCase();
			const dui = (p.dui || "").toLowerCase();
			const qDigits = q.replace(/\D/g, "");
			return (
				name.includes(q) ||
				dui.includes(q) ||
				(qDigits && (p.dui || "").replace(/\D/g, "").includes(qDigits))
			);
		});

		if (matches.length === 1) {
			const m = matches[0];
			if (String(form.id_paciente) !== String(m.id_paciente)) {
				setForm(prev => ({ ...prev, id_paciente: String(m.id_paciente) }));
				// No establecer editingPacienteLabel aquí para que siga mostrando el select
			}
		} else if (matches.length > 1) {
			// si existen varias coincidencias y la selección actual no está entre ellas,
			// limpiar la selección para que el usuario elija explícitamente
			const inMatches = matches.some((m) => String(m.id_paciente) === String(form.id_paciente));
			if (!inMatches && !editingId) {
				setForm(prev => ({ ...prev, id_paciente: '' }));
			}
		} else if (matches.length === 0) {
			// Si no hay matches y había algo seleccionado por autoselección, limpiar
			if (form.id_paciente && !editingPacienteLabel) {
				setForm(prev => ({ ...prev, id_paciente: '' }));
			}
		}
	}, [pacienteQuery, pacientes, form.id_paciente, editingId, editingPacienteLabel]);

	async function openNew() {
		setForm({ id_paciente: '', fecha_cita: '', hora_cita: '', observaciones: '', estado: '1' });
		setEditingPacienteLabel('');
		setPacienteQuery(''); // Limpiar búsqueda al abrir modal nuevo
		// si venimos con preselectPacienteId, intentar cargar y fijar el paciente
		if (preselectPacienteIdFromLocation) {
			try {
				const r = await api.get(`/api/pacientes/${preselectPacienteIdFromLocation}`);
				if (r && r.data) {
					setForm(f => ({ ...f, id_paciente: preselectPacienteIdFromLocation }));
					setEditingPacienteLabel(((r.data.nombre || '') + ' ' + (r.data.apellido || '')).trim());
				}
			} catch (e) {
				console.warn('No se pudo precargar paciente preseleccionado', e);
			}
		}
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
		setForm(f => ({ ...f, fecha_cita: svDate, hora_cita: defaultHM, estado: '1' }));
		setHoraH(defaultHM.slice(0,2));
		setHoraM(defaultHM.slice(3,5));
		setEditingId(null);
		// if a paciente is preselected, ensure estado default is '1'
		setForm(f => ({ ...f, estado: f.id_paciente ? (f.estado || '1') : (f.estado || '1') }));
		setShowModal(true);
	}

	// autofocus fecha input when modal opens and a paciente is preselected
	useEffect(() => {
		if (showModal && form.id_paciente && fechaInputRef.current) {
			// small timeout to ensure modal is visible
			setTimeout(() => fechaInputRef.current.focus?.(), 50);
		}
	}, [showModal, form.id_paciente]);

	function openEdit(c) {
		console.debug('openEdit called for cita:', c);
		// preparar datos para editar: normalizar fecha y hora a inputs
		const pad = (n) => String(n).padStart(2, '0');
		let fecha = '';
		let hora = '';
		if (c.fecha_cita) {
				if (typeof c.fecha_cita === 'string') {
					// soportar 'YYYY-MM-DD', 'YYYY-MM-DDTHH:MM:SS' y 'YYYY-MM-DD HH:MM:SS'
					const m = c.fecha_cita.match(/(\d{4}-\d{2}-\d{2})/);
					fecha = m ? m[1] : '';
				} else {
					const d = new Date(c.fecha_cita);
					if (!isNaN(d.getTime())) fecha = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
				}
		}
		if (c.hora_cita) {
				if (typeof c.hora_cita === 'string') {
					// extraer primer HH:MM encontrado (soporta 'HH:MM:SS' o datetime con T/space)
					const mh = c.hora_cita.match(/(\d{2}:\d{2})(?::\d{2})?/);
					hora = mh ? mh[1] : '';
				} else {
					const dt = new Date(c.hora_cita);
					if (!isNaN(dt.getTime())) hora = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
				}
		}
		setForm({ id_paciente: c.id_paciente || '', fecha_cita: fecha, hora_cita: hora, observaciones: c.observaciones || '', estado: c.estado || '1' });
		console.debug('Parsed fecha/hora for edit:', { fecha, hora });
		setEditingPacienteLabel(((c.nombre || '') + ' ' + (c.apellido || '')).trim());
		if (hora) {
			const [hh, mm] = hora.split(':');
			setHoraH(hh);
			setHoraM(mm);
		} else {
			setHoraH('');
			setHoraM('');
		}
		setEditingId(c.id_cita);
		// desactivar modo quick si estaba activo
		setQuickMode(false);
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
				// Antes de crear paciente rapido, comprobar que la fecha/hora solicitada está disponible
				setCreatingQuick(true);
				try {
					// validate quick patient fields first
					const vErr = validateQuickBeforeCreate();
					if (vErr) throw new Error(vErr);
					if (!form.fecha_cita || !form.hora_cita) throw new Error('Debe indicar fecha y hora antes de crear el paciente');
					// Normalizar hora a HH:MM:SS si es necesario
					const horaToCheck = form.hora_cita.length === 5 ? form.hora_cita + ':00' : form.hora_cita;
					// Normalizar fecha quickForm a ISO si usuario la ingresó en formato DD/MM/YYYY
					const quickFechaISO = normalizeFechaToISO(quickForm.fecha_nacimiento) || quickForm.fecha_nacimiento || null;
					const checkRes = await api.post('/api/citas/check', { fecha_cita: form.fecha_cita, hora_cita: horaToCheck });
					if (!checkRes.data || checkRes.data.available !== true) {
    setCreatingQuick(false);
    return Swal.fire({
        icon: 'error',
        title: 'Horario no disponible',
        text: 'No se creó el paciente.',
        confirmButtonColor: '#17a2b8'
    });
}

					// Si está disponible, crear paciente y continuar
					const body = {
						nombre: quickForm.nombre,
						apellido: quickForm.apellido,
						sexo: quickForm.sexo,
						telefono: quickForm.telefono,
						fecha_nacimiento: quickFechaISO,
					};
					if (!body.fecha_nacimiento && quickForm.edad) body.edad = Number(quickForm.edad);
						// incluir DUI solo si el paciente es mayor de edad y se ingresó
						const isAdultQuick = (quickEdadLocal !== null && quickEdadLocal >= 18) || (!quickForm.fecha_nacimiento && quickForm.edad && Number(quickForm.edad) >= 18);
						if (isAdultQuick && quickForm.dui) body.dui = quickForm.dui;
					const res = await api.post('/api/pacientes', body);
					pacienteId = res.data?.id_paciente || res.data?.insertId || null;
					setCreatingQuick(false);
					// recargar pacientes y seleccionar
					await fetchPacientes();
					if (pacienteId) setForm(f => ({ ...f, id_paciente: pacienteId }));
				} catch (err) {
					setCreatingQuick(false);
					throw err; // bubble up to outer catch so user sees error
				}
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
if (horaNormalized < svMinTime) {
    return Swal.fire({
        icon: 'error',
        title: 'Hora inválida',
        text: 'No puede seleccionar una hora pasada para hoy.',
        confirmButtonColor: '#17a2b8'
    });
}
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
	const handleEditClick = (c) => {
  Swal.fire({
    title: 'Editando producto',
    text: `Estás por editar: ${c.nombre}`,
    icon: 'info',
    showConfirmButton: false,
    timer: 1500,
    showClass: {
      popup: 'animate__animated animate__swing'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  });

  openEdit(c);
};

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

			// incluir DUI si es mayor de edad y se ingresó
			const isAdultQuick2 = (quickEdadLocal !== null && quickEdadLocal >= 18) || (!quickForm.fecha_nacimiento && quickForm.edad && Number(quickForm.edad) >= 18);
			if (isAdultQuick2 && quickForm.dui) body.dui = quickForm.dui;

		api.post('/api/pacientes', body)
			.then(res => {
				// recargar lista de pacientes y seleccionar el creado
				fetchPacientes();
				// si backend devuelve id en res (como id_paciente) intentar usarlo
				const newId = res.data?.id_paciente || res.data?.insertId || null;
				if (newId) setForm(f => ({ ...f, id_paciente: newId }));
				// si no devuelve id, buscaremos por nombre/apellido e intentaremos seleccionar el más reciente
				setQuickForm({ nombre: '', apellido: '', sexo: 'M', fecha_nacimiento: '', edad: '', telefono: '', dui: '' });
				alert('Paciente creado y seleccionado');
			})
			.catch(err => {
				console.error(err);
				alert('Error creando paciente: ' + (err.response?.data?.message || err.message));
			})
			.finally(() => setCreatingQuick(false));
	}

function handleDelete(id) {
  Swal.fire({
    title: '¿Cancelar esta cita?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'No',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    showClass: {
      popup: 'animate__animated animate__swing'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      api.delete(`/api/citas/${id}`)
        .then(() => {
          fetchCitas();
          Swal.fire({
            title: 'Cita cancelada',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            showClass: {
              popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          });
        })
        .catch(err => {
          Swal.fire({
            title: 'Error',
            text: err.response?.data?.message || 'Ocurrió un error al cancelar la cita.',
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        });
    }
  });
}


async function handleFinalizar(id) {
  const result = await Swal.fire({
    title: '¿Finalizar esta cita?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, finalizar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0d6efd',
    cancelButtonColor: '#6c757d',
    showClass: {
      popup: 'animate__animated animate__swing'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    }
  });

  if (!result.isConfirmed) return;

  try {
    setLoading(true);
    await api.put(`/api/citas/${id}`, { estado: '2' });
    fetchCitas();

    Swal.fire({
      title: 'Cita finalizada',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || err.message || 'Error al finalizar la cita',
      icon: 'error',
      confirmButtonColor: '#d33'
    });
  } finally {
    setLoading(false);
  }
}

	return (
		<div style={{ marginLeft: 250, padding: 20, backgroundColor: "#f8f9fa" }}>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<div>
					<h2 className="fw-bold" style={{ color: "#111" }}>Citas</h2>
					<small className="text-muted">Gestión y programación de citas</small>
				</div>
				<div className="d-flex align-items-center gap-2">
					<input
						className="form-control"
						style={{ width: 320 }}
						placeholder="Buscar"
					/>
					<button
						className="btn btn-info text-white"
						style={{ width: 120, height: '38px' }}
						onClick={openNew}
					>
						Agregar
					</button>
				</div>
			</div>


			<div className="card-body py-2">
				<div className="d-flex flex-wrap gap-3 align-items-end mb-3">
					<div className="d-flex flex-column">
					<label className="form-label small mb-1">Desde</label>
					<DatePicker
						selected={filterStartDate ? parseYMDToLocalDate(filterStartDate) : null}
						onChange={date => setFilterStartDate(date ? getYMD(date) : '')}
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
						onChange={date => setFilterEndDate(date ? getYMD(date) : '')}
						className="form-control form-control-sm border-info"
						placeholderText="Seleccionar fecha"
						dateFormat="dd-MM-yyyy"
						isClearable
					/>
					</div>
					<div>
					<label className="form-label small mb-1">Estado</label>
					<select
						className="form-select form-select-sm border-info"
						value={filterEstado}
						onChange={e => setFilterEstado(e.target.value)}
					>
						<option value="">-- Todos --</option>
						<option value="1">1 - Pendiente</option>
						<option value="2">2 - Finalizada</option>
						<option value="0">0 - Cancelada</option>
					</select>
					</div>
					
				<div>
				<button
					className="btn btn-sm btn-info text-white"
					onClick={() => {
					setFilterStartDate(svTodayYMD);
					setFilterEndDate(svWeekYMD);
					setFilterEstado('1');
					}}
				>
					Limpiar
				</button>
				</div>
			</div>
			</div>
				
			<div className="card mb-4">
				<div className="mb-3">Lista de Pacientes</div>
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
								) : (!Array.isArray(currentData) || currentData.length === 0) ? (
									<tr><td colSpan={6}>No hay citas</td></tr>
								) : (
									currentData.map(c => (
										<tr key={c.id_cita}>
											<td>{c.id_cita}</td>
											<td>{c.nombre ? `${c.nombre} ${c.apellido}` : '-'}</td>
											<td>{c.fecha_cita ? formatFecha(c.fecha_cita) : '-'}</td>
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
													{c.estado !== '2' && (
														<>
															<button className="btn btn-sm btn-success me-2" onClick={() => handleFinalizar(c.id_cita)} title="Finalizar">
																<i className="bi bi-check2-square"></i>
															</button>
															<button
																className="btn btn-sm btn-primary me-2"
																onClick={() => handleEditClick(c)}
																title="Editar"
																>
																<i className="bi bi-pencil"></i>
															</button>
															<button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id_cita)} title="Eliminar">
																<i className="bi bi-trash"></i>
															</button>
														</>
													)}
													{c.estado === '2' && (
														<button className="btn btn-sm btn-outline-secondary" title="Finalizada" disabled>
															<i className="bi bi-check2-all"></i>
														</button>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
					</table>
				</div>

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

			{/* Citas hoy card (count) */}
						<div className="mt-3">
							<div className="card" style={{ width: 220 }}>
								<div className="card-body d-flex align-items-center">
									<div className="me-3">
										<i className="bi bi-calendar-check" style={{ fontSize: 28 }}></i>
									</div>
									<div>
										<div className="small text-muted">Citas hoy</div>
										<div className="h4 mb-0">{(Array.isArray(citas) ? citas : []).filter(x => {
											try { return x.fecha_cita && new Date(x.fecha_cita).toLocaleDateString() === new Date().toLocaleDateString() && x.estado === '1'; } catch (e) { return false; }
										}).length}</div>
									</div>
								</div>
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
                                            {/* ocultar toggle si ya hay paciente preseleccionado */}
                                            {!editingId && !form.id_paciente && (
                                                <button type="button" className="btn btn-info text-white w-100" onClick={() => { setQuickMode(q => !q); if (!quickMode) setPacienteQuery(''); }}>
                                                    {quickMode ? 'Seleccionar paciente' : '+ Crear paciente rápido'}
                                                </button>
                                            )}
                                        </div>
									</div>

							{editingId ? (
								// edición: mostrar paciente como etiqueta readonly
								<div className="mb-3">
									<label className="form-label">Paciente</label>
									<div className="form-control-plaintext">{editingPacienteLabel || (form.id_paciente ? `Paciente #${form.id_paciente}` : '—')}</div>
								</div>
							) : (editingPacienteLabel && form.id_paciente) ? (
								// preseleccionado desde ficha con label: mostrar como readonly
								<div className="mb-3">
									<label className="form-label">Paciente</label>
									<div className="form-control-plaintext">{editingPacienteLabel}</div>
								</div>
							) : (!quickMode && (
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
									))}

									{!editingId && quickMode && (
										<div className="mb-3">
											<h6>Crear paciente rápido</h6>
											<div className="row">
												<div className="col-md-6 mb-2">
													<input
														className="form-control"
														placeholder="Nombre"
														value={quickForm.nombre}
														onChange={e => setQuickForm({ ...quickForm, nombre: e.target.value })}
														required
													/>
												</div>
												<div className="col-md-6 mb-2">
													<input
														className="form-control"
														placeholder="Apellido"
														value={quickForm.apellido}
														onChange={e => setQuickForm({ ...quickForm, apellido: e.target.value })}
														required
													/>
												</div>
												<div className="col-md-6 mb-2">
													<select
														className="form-select"
														value={quickForm.sexo}
														onChange={e => setQuickForm({ ...quickForm, sexo: e.target.value })}
													>
														<option value="M">Masculino</option>
														<option value="F">Femenino</option>
													</select>
												</div>
												<div className="col-md-6 mb-2">
													<label className="form-label visually-hidden">Fecha de Nacimiento</label>
													<input
														type="date"
														className="form-control"
														value={quickForm.fecha_nacimiento}
														max={new Date().toISOString().slice(0,10)}
														onChange={e => {
															setQuickForm({ ...quickForm, fecha_nacimiento: e.target.value });
															// limpiar edad manual cuando se selecciona fecha
															if (e.target.value) setQuickForm(q => ({ ...q, edad: '' }));
														}}
													/>
												</div>
												{!quickForm.fecha_nacimiento && (
													<div className="col-md-6 mb-2">
														<input
															className="form-control"
															placeholder="Edad"
															value={quickForm.edad}
															onChange={e => setQuickForm({ ...quickForm, edad: e.target.value })}
														/>
													</div>
												)}

												{quickForm.fecha_nacimiento && quickEdadLocal !== null && quickEdadLocal < 18 && (
													<div className="col-md-6 mb-2">
														<input type="number" className="form-control" value={quickEdadLocal} readOnly />
													</div>
												)}
                                                
												{(((quickEdadLocal !== null) && quickEdadLocal >= 18) || (!quickForm.fecha_nacimiento && quickForm.edad !== '' && Number(quickForm.edad) >= 18)) && (
													<div className="col-md-6 mb-2">
														<input
															name="dui"
															className="form-control"
															placeholder="DUI (########-#)"
															value={quickForm.dui}
															onChange={e => setQuickForm({ ...quickForm, dui: formatDuiInput(e.target.value) })}
														/>
													</div>
												)}
												<div className="col-md-6 mb-2">
													<input
														className="form-control"
														placeholder="Teléfono (####-####)"
														value={quickForm.telefono}
														onChange={e => setQuickForm({ ...quickForm, telefono: formatTelefonoInput(e.target.value) })}
													/>
												</div>
											</div>
										</div>
									)}
									<div className="mb-3">
										<label className="form-label">Fecha</label>
										<DatePicker
											selected={form?.fecha_cita ? parseYMDToLocalDate(form.fecha_cita) : null}
											onChange={(date) => setForm({ ...form, fecha_cita: date ? getYMD(date) : '' })}
											dateFormat="dd-MM-yyyy"
											className="form-control"
											placeholderText="Seleccionar fecha"
											autoFocus={!editingId}
											minDate={!editingId ? (svMinDate ? parseYMDToLocalDate(svMinDate) : undefined) : undefined}
											filterDate={!editingId ? ((d) => d.getDay() !== 0) : undefined}
											isClearable={false}
										/>
										<div className="form-text">No se permiten domingos ni días pasados.</div>
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

									{!editingId && !form.id_paciente && (
										<div className="mb-3">
											<label className="form-label">Estado</label>
											<select className="form-select" value={form.estado || '1'} onChange={e => setForm({ ...form, estado: e.target.value })}>
												<option value="1">1 - Pendiente</option>
												<option value="2">2 - Finalizada</option>
												<option value="0">0 - Cancelada</option>
											</select>
										</div>
									)}
								</div>
								<div className="modal-footer">
									<button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
									<button type="submit" className="btn btn-info text-white">Guardar</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
			
		</div>
	);
}

