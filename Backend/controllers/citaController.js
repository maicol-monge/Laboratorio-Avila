const db = require('../config/db');

// Listar todas las citas (estado <> '0') con info de paciente
exports.getCitas = (req, res) => {
	const query = `SELECT c.*, p.nombre, p.apellido, p.telefono FROM cita c LEFT JOIN paciente p ON c.id_paciente = p.id_paciente WHERE c.estado <> '0' ORDER BY c.fecha_cita, c.hora_cita`;
	db.query(query, (err, results) => {
		if (err) return res.status(500).json({ message: 'Error al recuperar citas', error: err });
		return res.status(200).json(results);
	});
};

// Obtener cita por id
exports.getCitaById = (req, res) => {
	const { id } = req.params;
	const query = `SELECT c.*, p.nombre, p.apellido, p.telefono FROM cita c LEFT JOIN paciente p ON c.id_paciente = p.id_paciente WHERE c.id_cita = ?`;
	db.query(query, [id], (err, results) => {
		if (err) return res.status(500).json({ message: 'Error al recuperar cita', error: err });
		if (results.length === 0) return res.status(404).json({ message: 'Cita no encontrada' });
		return res.status(200).json(results[0]);
	});
};

// Helper: validar disponibilidad de horario (no debe existir otra cita activa en mismo rango)
// Asumiremos que citas se guardan con fecha_cita y hora_cita como DATETIME; para simplicidad validamos exact match
function isHorarioDisponible(fechaHora, excludeId, callback) {
	// Espera fechaHora.fecha_cita: 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS'
	// fechaHora.hora_cita: 'HH:MM:SS' o 'YYYY-MM-DD HH:MM:SS'
	const makeFechaDB = (f) => {
		if (!f) return null;
		// si viene solo fecha 'YYYY-MM-DD' convertir a DATETIME a medianoche
		if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return `${f} 00:00:00`;
		return f; // ya es DATETIME
	};
	const makeHoraDB = (fecha, h) => {
		if (!h) return null;
		// si hora viene como 'HH:MM:SS' o 'HH:MM', combinar con la fecha
		if (/^\d{2}:\d{2}(:\d{2})?$/.test(h)) {
			const hh = h.length === 5 ? `${h}:00` : h;
			// fecha puede venir como 'YYYY-MM-DD' o DATETIME; extraer YYYY-MM-DD
			const datePart = (fecha && /^\d{4}-\d{2}-\d{2}/.test(fecha)) ? fecha.split('T')[0] : (fecha ? fecha.split(' ')[0] : null);
			if (datePart) return `${datePart} ${hh}`;
			return hh; // fallback
		}
		return h; // ya es DATETIME
	};

	const fechaDB = makeFechaDB(fechaHora.fecha_cita);
	const horaDB = makeHoraDB(fechaHora.fecha_cita, fechaHora.hora_cita);

	let query = `SELECT COUNT(*) AS cnt FROM cita WHERE fecha_cita = ? AND hora_cita = ? AND estado <> '0'`;
	const params = [fechaDB, horaDB];
	if (excludeId) {
		query = `SELECT COUNT(*) AS cnt FROM cita WHERE fecha_cita = ? AND hora_cita = ? AND id_cita <> ? AND estado <> '0'`;
		params.push(excludeId);
	}
	db.query(query, params, (err, results) => {
		if (err) return callback(err);
		const cnt = results[0].cnt || 0;
		return callback(null, cnt === 0);
	});
}

// Crear cita
exports.createCita = (req, res) => {
	const { id_paciente, fecha_cita, hora_cita, observaciones, estado } = req.body;

	if (!fecha_cita || !hora_cita) return res.status(400).json({ message: 'fecha_cita y hora_cita son requeridos' });

	// Validar paciente existente si se envia
	const proceedCreate = () => {
		// preparar valores para DB: fecha_cita DATETIME a medianoche, hora_cita DATETIME = fecha + hora
		const fechaDB = (/^\d{4}-\d{2}-\d{2}$/.test(fecha_cita)) ? `${fecha_cita} 00:00:00` : fecha_cita;
		const horaTime = /^\d{2}:\d{2}(:\d{2})?$/.test(hora_cita) ? (hora_cita.length === 5 ? `${hora_cita}:00` : hora_cita) : hora_cita;
		const horaDB = (/^\d{2}:/.test(horaTime)) ? `${fecha_cita} ${horaTime}` : horaTime;

		// validar disponibilidad
		isHorarioDisponible({ fecha_cita: fecha_cita, hora_cita: hora_cita }, null, (err, disponible) => {
			if (err) return res.status(500).json({ message: 'Error al validar horario', error: err });
			if (!disponible) return res.status(409).json({ message: 'Horario no disponible' });

			const estadoVal = typeof estado !== 'undefined' ? String(estado) : '1';
			const query = `INSERT INTO cita (id_paciente, fecha_cita, hora_cita, observaciones, estado, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
			db.query(query, [id_paciente || null, fechaDB, horaDB, observaciones || null, estadoVal], (err2, result) => {
				if (err2) return res.status(500).json({ message: 'Error al crear cita', error: err2 });
				return res.status(201).json({ message: 'Cita creada', id_cita: result.insertId });
			});
		});
	};

	if (id_paciente) {
		db.query('SELECT id_paciente FROM paciente WHERE id_paciente = ? AND estado <> "0"', [id_paciente], (err, r) => {
			if (err) return res.status(500).json({ message: 'Error al verificar paciente', error: err });
			if (r.length === 0) return res.status(400).json({ message: 'Paciente no existe o está eliminado' });
			proceedCreate();
		});
	} else {
		// permitir citas sin paciente vinculado (según requerimiento podría ser obligatorio); aquí lo permitimos
		proceedCreate();
	}
};

// Actualizar cita
exports.updateCita = (req, res) => {
	const { id } = req.params;
	const { id_paciente, fecha_cita, hora_cita, observaciones, estado } = req.body;

	// Verificar existencia
	db.query('SELECT * FROM cita WHERE id_cita = ?', [id], (err, results) => {
		if (err) return res.status(500).json({ message: 'Error en el servidor', error: err });
		if (results.length === 0) return res.status(404).json({ message: 'Cita no encontrada' });

		const existing = results[0];
		const newFecha = typeof fecha_cita !== 'undefined' ? fecha_cita : existing.fecha_cita;
		const newHora = typeof hora_cita !== 'undefined' ? hora_cita : existing.hora_cita;

		// Si cambian fecha/hora validar disponibilidad
		const needValidate = (newFecha !== existing.fecha_cita) || (newHora !== existing.hora_cita);

		const finishUpdate = () => {
				const q = `UPDATE cita SET id_paciente = ?, fecha_cita = ?, hora_cita = ?, observaciones = ?, estado = ?, updated_at = NOW() WHERE id_cita = ?`;
				// preparar valores para DB
				const fechaDB = (/^\d{4}-\d{2}-\d{2}$/.test(newFecha)) ? `${newFecha} 00:00:00` : newFecha;
				const horaTime = /^\d{2}:\d{2}(:\d{2})?$/.test(newHora) ? (newHora.length === 5 ? `${newHora}:00` : newHora) : newHora;
				const horaDB = (/^\d{2}:/.test(horaTime)) ? `${newFecha} ${horaTime}` : horaTime;
				db.query(q, [id_paciente || existing.id_paciente, fechaDB, horaDB, typeof observaciones !== 'undefined' ? observaciones : existing.observaciones, typeof estado !== 'undefined' ? estado : existing.estado, id], (err2) => {
				if (err2) return res.status(500).json({ message: 'Error al actualizar cita', error: err2 });
				return res.status(200).json({ message: 'Cita actualizada' });
			});
		};

		const validateAndFinish = () => {
			isHorarioDisponible({ fecha_cita: newFecha, hora_cita: newHora }, id, (err3, disponible) => {
				if (err3) return res.status(500).json({ message: 'Error al validar horario', error: err3 });
				if (!disponible) return res.status(409).json({ message: 'Horario no disponible' });
				finishUpdate();
			});
		};

		if (needValidate) {
			validateAndFinish();
		} else {
			finishUpdate();
		}
	});
};

// Eliminar (soft delete) cita: cambiar estado a '0'
exports.deleteCita = (req, res) => {
	const { id } = req.params;
	const query = `UPDATE cita SET estado = '0', updated_at = NOW() WHERE id_cita = ?`;
	db.query(query, [id], (err, result) => {
		if (err) return res.status(500).json({ message: 'Error al eliminar cita', error: err });
		if (result.affectedRows === 0) return res.status(404).json({ message: 'Cita no encontrada' });
		return res.status(200).json({ message: 'Cita cancelada (estado=0)' });
	});
};

