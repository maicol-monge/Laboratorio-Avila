const express = require("express");
const {
  addExamenRealizado,
  getExamenesRealizados,
  getExamenRealizadoById,
  updateExamenRealizado,
  deleteExamenRealizado,
  exportExamenRealizado,
  exportExamenRealizadoPdf,
} = require("../controllers/examen_realizadoController");
const authenticateToken = require("../middlewares/auth");
const router = express.Router();

// CRUD de exámenes realizados
router.get("/", authenticateToken, getExamenesRealizados);
router.post("/", authenticateToken, addExamenRealizado);
// Exportar examen realizado a .docx (debe ir antes de la ruta /:id)
router.get("/:id/export", authenticateToken, exportExamenRealizado);
// Exportar/Imprimir examen realizado a PDF (misma plantilla) usando LibreOffice
router.get("/:id/export-pdf", authenticateToken, exportExamenRealizadoPdf);
router.get("/:id", authenticateToken, getExamenRealizadoById);
router.put("/:id", authenticateToken, updateExamenRealizado);
router.delete("/:id", authenticateToken, deleteExamenRealizado);

module.exports = router;
