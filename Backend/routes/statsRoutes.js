const express = require('express');
const authenticateToken = require('../middlewares/auth');
const {
  getCitasStats,
  getExamenesStats,
  getInventarioStats,
  getIngresosStats,
} = require('../controllers/statsController');

const router = express.Router();

router.get('/citas', authenticateToken, getCitasStats);
router.get('/examenes', authenticateToken, getExamenesStats);
router.get('/inventario', authenticateToken, getInventarioStats);
router.get('/ingresos', authenticateToken, getIngresosStats);

module.exports = router;
