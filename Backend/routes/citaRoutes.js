const express = require('express');
const {
	getCitas,
	getCitaById,
	createCita,
	updateCita,
	deleteCita,
	checkDisponibilidad,
} = require('../controllers/citaController');

const authenticateToken = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticateToken, getCitas);
router.post('/', authenticateToken, createCita);
// comprobar disponibilidad (body: { fecha_cita, hora_cita })
router.post('/check', authenticateToken, checkDisponibilidad);
router.get('/:id', authenticateToken, getCitaById);
router.put('/:id', authenticateToken, updateCita);
router.delete('/:id', authenticateToken, deleteCita);

module.exports = router;

