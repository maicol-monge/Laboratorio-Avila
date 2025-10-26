const express = require("express");
const {
  addExamenRealizado,
  getExamenesRealizados,
  getExamenRealizadoById,
  updateExamenRealizado,
  deleteExamenRealizado,
} = require("../controllers/examen_realizadoController");
const router = express.Router();

// CRUD de exámenes realizados
router.get("/", getExamenesRealizados);
router.post("/", addExamenRealizado);
router.get("/:id", getExamenRealizadoById);
router.put("/:id", updateExamenRealizado);
router.delete("/:id", deleteExamenRealizado);

module.exports = router;