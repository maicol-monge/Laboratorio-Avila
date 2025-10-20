const db = require('../config/db');

// Crear un examen realizado
exports.addExamenRealizado = (req, res) => {
    const { id_paciente, id_examen, diagnostico, estado } = req.body;
    const diagnosticoStr = JSON.stringify(diagnostico); // Guardar como string JSON

    db.query(
        `INSERT INTO examen_realizado (id_paciente, id_examen, diagnostico, estado, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [id_paciente, id_examen, diagnosticoStr, estado],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al agregar el examen realizado' });
            }
            res.json({ message: 'Examen realizado agregado exitosamente' });
        }
    );
};

// Obtener exámenes realizados
exports.getExamenesRealizados = (req, res) => {
    db.query('SELECT * FROM examen_realizado', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los exámenes realizados' });
        }
        // Parsear el diagnóstico a objeto
        const data = results.map(r => ({
            ...r,
            diagnostico: r.diagnostico ? JSON.parse(r.diagnostico) : null
        }));
        res.json(data);
    });
};

// Obtener un examen realizado por ID
exports.getExamenRealizadoById = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM examen_realizado WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el examen realizado' });
        }
        if (!results || !results[0]) {
            return res.status(404).json({ error: 'Examen no encontrado' });
        }
        // Parsear el diagnóstico a objeto
        const data = {
            ...results[0],
            diagnostico: results[0].diagnostico ? JSON.parse(results[0].diagnostico) : null
        };
        res.json(data);
    });
};

// Actualizar un examen realizado
exports.updateExamenRealizado = (req, res) => {
    const { id } = req.params;
    const { id_paciente, id_examen, diagnostico, estado } = req.body;
    const diagnosticoStr = JSON.stringify(diagnostico); // Guardar como string JSON

    db.query(
        `UPDATE examen_realizado SET id_paciente = ?, id_examen = ?, diagnostico = ?, estado = ?, updated_at = NOW()
         WHERE id = ?`,
        [id_paciente, id_examen, diagnosticoStr, estado, id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar el examen realizado' });
            }
            res.json({ message: 'Examen realizado actualizado exitosamente' });
        }
    );
};

// Eliminar un examen realizado
exports.deleteExamenRealizado = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM examen_realizado WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el examen realizado' });
        }
        res.json({ message: 'Examen realizado eliminado exitosamente' });
    });
};