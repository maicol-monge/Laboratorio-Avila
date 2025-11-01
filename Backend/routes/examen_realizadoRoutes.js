const express = require("express");
const {
  addExamenRealizado,
  getExamenesRealizados,
  getExamenRealizadoById,
  updateExamenRealizado,
  deleteExamenRealizado,
  exportExamenRealizado,
} = require("../controllers/examen_realizadoController");
const router = express.Router();

// CRUD de exámenes realizados
router.get("/", getExamenesRealizados);
router.post("/", addExamenRealizado);
// Exportar examen realizado a .docx (debe ir antes de la ruta /:id)
router.get("/:id/export", exportExamenRealizado);
router.get("/:id", getExamenRealizadoById);
router.put("/:id", updateExamenRealizado);
router.delete("/:id", deleteExamenRealizado);

module.exports = router;
