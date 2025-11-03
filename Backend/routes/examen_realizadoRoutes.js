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
const router = express.Router();

// CRUD de exámenes realizados
router.get("/", getExamenesRealizados);
router.post("/", addExamenRealizado);
// Exportar examen realizado a .docx (debe ir antes de la ruta /:id)
router.get("/:id/export", exportExamenRealizado);
// Exportar/Imprimir examen realizado a PDF (misma plantilla) usando LibreOffice
router.get("/:id/export-pdf", exportExamenRealizadoPdf);
router.get("/:id", getExamenRealizadoById);
router.put("/:id", updateExamenRealizado);
router.delete("/:id", deleteExamenRealizado);

module.exports = router;
