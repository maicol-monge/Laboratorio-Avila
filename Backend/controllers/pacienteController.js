const db = require("../config/db");

// Helper: calcular edad en años a partir de una fecha (YYYY-MM-DD o ISO)
function calcularEdadDesdeFecha(fechaStr) {
	if (!fechaStr) return null;
	const fecha = new Date(fechaStr);
	if (isNaN(fecha.getTime())) return null;
	const hoy = new Date();
	let edad = hoy.getFullYear() - fecha.getFullYear();
	const m = hoy.getMonth() - fecha.getMonth();
	if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
		edad--;
	}
	return edad;
}

// Crear un nuevo paciente
exports.createPaciente = (req, res) => {
	const { nombre, apellido, sexo, fecha_nacimiento, edad, dui, telefono, fecha_registro, estado } = req.body;

	// Campos obligatorios según la nueva definición: nombre, apellido, sexo y telefono
	if (!nombre || !apellido || !telefono || typeof sexo === 'undefined' || sexo === null || String(sexo).trim() === '') {
		return res.status(400).json({ message: 'Los campos nombre, apellido, sexo y telefono son requeridos' });
	}

	const estadoVal = typeof estado !== 'undefined' ? String(estado) : '1';
	const fechaRegistroVal = fecha_registro || new Date();

	// Normalizar y validar sexo (aceptamos M/F/O/U)
	const sexoValRaw = String(sexo).trim().toUpperCase();
	const allowedSexo = ['M', 'F', 'O', 'U'];
	if (!allowedSexo.includes(sexoValRaw)) {
		return res.status(400).json({ message: 'sexo inválido. Valores permitidos: M, F, O, U' });
	}
	const sexoVal = sexoValRaw;

	// Edad y DUI son opcionales. Si viene fecha_nacimiento, calculamos edad desde esa fecha.
	let edadVal = null;
	if (fecha_nacimiento) {
		// Si hay fecha_nacimiento, calculamos edad pero NO la guardamos en la columna 'edad' (se calculará en las consultas)
		const calc = calcularEdadDesdeFecha(fecha_nacimiento);
		if (calc === null) return res.status(400).json({ message: 'fecha_nacimiento inválida' });
		edadVal = calc; // edad calculada en memoria
	} else {
		// Si no viene fecha_nacimiento y se proporcionó edad, la tomamos; si viene vacía/undefined la dejamos null
		if (typeof edad !== 'undefined' && edad !== null && edad !== '') {
			const n = Number(edad);
			if (Number.isNaN(n) || n < 0) return res.status(400).json({ message: 'edad inválida' });
			edadVal = n;
		} else {
			edadVal = null;
		}
	}

	// DUI opcional: si viene vacío lo normalizamos a null
	let duiVal = (typeof dui !== 'undefined' && dui !== '') ? dui : null;

	// Si la edad calculada indica menor de 18, no guardamos DUI
	if (edadVal !== null && edadVal < 18) {
		duiVal = null;
	}

	const query = `INSERT INTO paciente (nombre, apellido, sexo, fecha_nacimiento, edad, dui, telefono, fecha_registro, estado, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
	// Si hay fecha_nacimiento no guardamos la edad en la columna 'edad' -> pasamos NULL. Si no, guardamos edadVal.
	const edadParaBD = fecha_nacimiento ? null : edadVal;
	db.query(query, [nombre, apellido, sexoVal, fecha_nacimiento || null, edadParaBD, duiVal, telefono, fechaRegistroVal, estadoVal], (err, result) => {
		if (err) return res.status(500).json({ message: 'Error al crear paciente', error: err });
		return res.status(201).json({ message: 'Paciente creado', id_paciente: result.insertId });
	});
};

// Obtener todos los pacientes
exports.getPacientes = (req, res) => {
	// Seleccionamos todas las columnas y además calculamos la edad a partir de fecha_nacimiento cuando exista
	const query = `SELECT p.*, CASE WHEN p.fecha_nacimiento IS NOT NULL THEN TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) ELSE p.edad END AS edad_calculada FROM paciente p WHERE p.estado <> '0'`;
	db.query(query, (err, results) => {
		if (err) return res.status(500).json({ message: 'Error al recuperar pacientes', error: err });
		// Normalizar respuesta: exponer 'edad' calculada cuando haya fecha_nacimiento
		const mapped = results.map(r => {
			const edadFinal = r.fecha_nacimiento ? r.edad_calculada : r.edad;
			return {
				id_paciente: r.id_paciente,
				nombre: r.nombre,
				apellido: r.apellido,
				sexo: r.sexo,
				fecha_nacimiento: r.fecha_nacimiento,
				edad: edadFinal,
				dui: r.dui,
				telefono: r.telefono,
				fecha_registro: r.fecha_registro,
				estado: r.estado,
				created_at: r.created_at,
				updated_at: r.updated_at
			};
		});
		return res.status(200).json(mapped);
	});
};

// Obtener paciente por id
exports.getPacienteById = (req, res) => {
	const { id } = req.params;
	const query = `SELECT p.*, CASE WHEN p.fecha_nacimiento IS NOT NULL THEN TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) ELSE p.edad END AS edad_calculada FROM paciente p WHERE p.id_paciente = ?`;
	db.query(query, [id], (err, results) => {
		if (err) return res.status(500).json({ message: 'Error al recuperar paciente', error: err });
		if (results.length === 0) return res.status(404).json({ message: 'Paciente no encontrado' });
		const r = results[0];
		const edadFinal = r.fecha_nacimiento ? r.edad_calculada : r.edad;
		return res.status(200).json({
			id_paciente: r.id_paciente,
			nombre: r.nombre,
			apellido: r.apellido,
			sexo: r.sexo,
			fecha_nacimiento: r.fecha_nacimiento,
			edad: edadFinal,
			dui: r.dui,
			telefono: r.telefono,
			fecha_registro: r.fecha_registro,
			estado: r.estado,
			created_at: r.created_at,
			updated_at: r.updated_at
		});
	});
};

// Actualizar paciente
exports.updatePaciente = (req, res) => {
	const { id } = req.params;
	const { nombre, apellido, sexo, fecha_nacimiento, edad, dui, telefono, fecha_registro, estado } = req.body;

	// Obtener valores actuales
	const selectQ = `SELECT * FROM paciente WHERE id_paciente = ?`;
	db.query(selectQ, [id], (err, results) => {
		if (err) return res.status(500).json({ message: 'Error en el servidor', error: err });
		if (results.length === 0) return res.status(404).json({ message: 'Paciente no encontrado' });

		const existing = results[0];

		// Mezclar valores: si el campo viene en el body lo usamos, si no, usamos el existente
		const newNombre = (typeof nombre !== 'undefined') ? nombre : existing.nombre;
		const newApellido = (typeof apellido !== 'undefined') ? apellido : existing.apellido;
		const newFechaNacimiento = (typeof fecha_nacimiento !== 'undefined') ? (fecha_nacimiento || null) : existing.fecha_nacimiento;

		// Sexo: si viene, validarlo; si no, mantener existente
		let newSexo;
		if (typeof sexo !== 'undefined') {
			if (sexo === null || (String(sexo).trim() === '')) {
				// no permitir sexo vacío porque la columna es NOT NULL; mantener existente
				newSexo = existing.sexo;
			} else {
				const s = String(sexo).trim().toUpperCase();
				const allowedSexo = ['M', 'F', 'O', 'U'];
				if (!allowedSexo.includes(s)) return res.status(400).json({ message: 'sexo inválido. Valores permitidos: M, F, O, U' });
				newSexo = s;
			}
		} else {
			newSexo = existing.sexo;
		}

		// Determinar edad final: si se proporciona fecha_nacimiento calculamos edad desde ella; else si se proporciona edad usamos esa; else usamos existente
		let newEdad;
		// Si el cliente envía edad explícitamente y/o fecha_nacimiento, resolver la prioridad:
		// - Si viene fecha_nacimiento con valor -> calcular edad desde fecha.
		// - Si viene fecha_nacimiento pero vacío/null y además viene edad -> usar la edad proporcionada (usuario quitó la fecha y puso edad).
		// - Si no viene fecha_nacimiento pero viene edad -> usar edad proporcionada.
		// - En caso contrario mantener existente.
		const edadProporcionada = typeof edad !== 'undefined' && edad !== null && edad !== '';
		if (typeof fecha_nacimiento !== 'undefined') {
			if (fecha_nacimiento) {
				const calc = calcularEdadDesdeFecha(fecha_nacimiento);
				if (calc === null) return res.status(400).json({ message: 'fecha_nacimiento inválida' });
				newEdad = calc;
			} else {
				// fecha_nacimiento enviado pero vacío/null -> si el cliente también envió edad, úsala; si no, mantén existente
				if (edadProporcionada) {
					const n = Number(edad);
					if (Number.isNaN(n) || n < 0) return res.status(400).json({ message: 'edad inválida' });
					newEdad = n;
				} else {
					newEdad = existing.edad;
				}
			}
		} else if (edadProporcionada) {
			const n = Number(edad);
			if (Number.isNaN(n) || n < 0) return res.status(400).json({ message: 'edad inválida' });
			newEdad = n;
		} else {
			newEdad = existing.edad;
		}

	let newDui = (typeof dui !== 'undefined') ? (dui || null) : existing.dui;
		const newTelefono = (typeof telefono !== 'undefined') ? telefono : existing.telefono;
		const newFechaRegistro = (typeof fecha_registro !== 'undefined') ? fecha_registro : existing.fecha_registro;
		const newEstado = (typeof estado !== 'undefined') ? String(estado) : existing.estado;

	// DUI es opcional; si viene vacío lo normalizamos a null (ya hecho más arriba)

		// Si la edad final es menor de 18, forzamos dui a NULL
		if (newEdad !== null && newEdad < 18) {
			newDui = null;
		}

		// Si existe fecha de nacimiento, no guardamos edad en la columna (guardamos NULL)
		// Si existe fecha de nacimiento, no guardamos edad en la columna (guardamos NULL)
		const edadParaBD = newFechaNacimiento ? null : newEdad;
		const query = `UPDATE paciente SET nombre = ?, apellido = ?, sexo = ?, fecha_nacimiento = ?, edad = ?, dui = ?, telefono = ?, fecha_registro = ?, estado = ?, updated_at = NOW() WHERE id_paciente = ?`;
		db.query(query, [newNombre, newApellido, newSexo, newFechaNacimiento, edadParaBD, newDui, newTelefono, newFechaRegistro, newEstado, id], (err2) => {
			if (err2) return res.status(500).json({ message: 'Error al actualizar paciente', error: err2 });
			return res.status(200).json({ message: 'Paciente actualizado' });
		});
	});
};

// Eliminar (soft delete) paciente
exports.deletePaciente = (req, res) => {
	const { id } = req.params;
	const query = `UPDATE paciente SET estado = '0', updated_at = NOW() WHERE id_paciente = ?`;
	db.query(query, [id], (err, result) => {
		if (err) return res.status(500).json({ message: 'Error al eliminar paciente', error: err });
		if (result.affectedRows === 0) return res.status(404).json({ message: 'Paciente no encontrado' });
		return res.status(200).json({ message: 'Paciente eliminado (estado=0)' });
	});
};

// Obtener exámenes realizados por paciente
exports.getExamenesByPaciente = (req, res) => {
	const { id } = req.params;
	// Unimos examen_realizado con examen para obtener título y diagnóstico
	const query = `SELECT er.id_examen_realizado, er.id_examen, er.id_paciente, er.diagnostico, er.estado AS estado_realizado, er.created_at, er.updated_at, e.titulo_examen, e.descripcion AS examen_descripcion
	FROM examen_realizado er
	LEFT JOIN examen e ON er.id_examen = e.id_examen
	WHERE er.id_paciente = ? AND er.estado <> '0' ORDER BY er.created_at DESC`;
	db.query(query, [id], (err, results) => {
		if (err) return res.status(500).json({ message: 'Error al recuperar examenes realizados', error: err });
		// Mapear a formato simple
		const mapped = results.map(r => ({
			id_examen_realizado: r.id_examen_realizado,
			id_examen: r.id_examen,
			id_paciente: r.id_paciente,
			titulo_examen: r.titulo_examen,
			examen_descripcion: r.examen_descripcion,
			diagnostico: r.diagnostico,
			estado: r.estado_realizado,
			created_at: r.created_at,
			updated_at: r.updated_at
		}));
		return res.status(200).json(mapped);
	});
};

// Obtener citas por paciente
exports.getCitasByPaciente = (req, res) => {
	const { id } = req.params;
	// La tabla cita tiene fecha_cita y hora_cita como DATETIME; devolver ambos
	const query = `SELECT id_cita, id_paciente, fecha_cita, hora_cita, observaciones, estado, created_at, updated_at FROM cita WHERE id_paciente = ? AND estado <> '0' ORDER BY fecha_cita DESC`;
	db.query(query, [id], (err, results) => {
		if (err) return res.status(500).json({ message: 'Error al recuperar citas', error: err });
		// Mapear en formato esperado por frontend
		const mapped = results.map(r => ({
			id_cita: r.id_cita,
			id_paciente: r.id_paciente,
			fecha: r.fecha_cita, // frontend busca 'fecha' o 'fecha_cita'
			hora: r.hora_cita, // frontend busca 'hora' o 'hora_cita'
			observaciones: r.observaciones,
			estado: r.estado,
			created_at: r.created_at,
			updated_at: r.updated_at
		}));
		return res.status(200).json(mapped);
	});
};



