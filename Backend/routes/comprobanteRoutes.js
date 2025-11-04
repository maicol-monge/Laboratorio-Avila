const express = require("express");
const authenticateToken = require("../middlewares/auth");
const {
  createComprobante,
  getComprobantes,
  getComprobanteById,
  pagarComprobante,
  exportComprobantePdf,
  getComprobanteStats,
} = require("../controllers/comprobanteController");

const router = express.Router();

// Crear comprobante pendiente a partir de exámenes realizados
router.post("/", authenticateToken, createComprobante);

// Listar comprobantes (opcional ?estado=0|1)
router.get("/", authenticateToken, getComprobantes);

// Estadísticas (ignoran filtro de estado): ?from=YYYY-MM-DD&to=YYYY-MM-DD&paciente=...&examen=...
router.get("/stats", authenticateToken, getComprobanteStats);

// Obtener comprobante con detalles
router.get("/:id", authenticateToken, getComprobanteById);

// Marcar pagado (establecer método de pago)
router.put("/:id/pagar", authenticateToken, pagarComprobante);

// Exportar comprobante a PDF
router.get("/:id/export-pdf", authenticateToken, exportComprobantePdf);

module.exports = router;
