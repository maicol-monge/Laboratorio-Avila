const db = require('../config/db');

exports.addExamen = (req, res) => {
    db.query('INSERT INTO examen SET ?', req.body, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al agregar el examen' });
        }
        res.json({ message: 'Examen agregado exitosamente' });
    });
};

exports.getExamenes = (req, res) => {
    db.query('SELECT * FROM examen', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los examenes' });
        }
        console.log("Resultados de examen:", results); // <-- Agrega esto
        res.json(results);
    });
};

exports.getExamenById = (req, res) => {
    db.query('SELECT * FROM examen WHERE id_examen = ?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el examen' });
        }
        res.json(results[0]);
    });
};

exports.updateExamen = (req, res) => {
    const data = { ...req.body, updated_at: new Date() };
    db.query(
        'UPDATE examen SET ? WHERE id_examen = ?',
        [data, req.params.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar el examen' });
            }
            res.json({ message: 'Examen actualizado exitosamente' });
        }
    );
};

exports.deleteExamen = (req, res) => {
    db.query('DELETE FROM examen WHERE id_examen = ?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el examen' });
        }
        res.json({ message: 'Examen eliminado exitosamente' });
    });
};

