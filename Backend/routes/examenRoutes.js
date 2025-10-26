const express = require("express");
const {
  addExamen,
  getExamenes,
  getExamenById,
  updateExamen,
  deleteExamen,
} = require("../controllers/examenController");
const authenticateToken = require("../middlewares/auth"); // Importa el middleware
const router = express.Router();

// Rutas de examenes protegidas por token
router.get("/", authenticateToken, getExamenes);
router.post("/", authenticateToken, addExamen);
router.get("/:id", authenticateToken, getExamenById);
router.put("/:id", authenticateToken, updateExamen);
router.delete("/:id", authenticateToken, deleteExamen);

module.exports = router;