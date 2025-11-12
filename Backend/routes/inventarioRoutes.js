const express = require("express");
const {
  addInsumo,
  getInsumos,
  getInsumoById,
  updateInsumo,
  deleteInsumo,
  addMovimiento,
  getMovimientos,
  getMovimientosByInsumo,
} = require("../controllers/inventarioController");

const authenticateToken = require("../middlewares/auth"); // Importa el middleware

const router = express.Router();

// Rutas de inventario protegidas por token
router.get("/insumos", authenticateToken, getInsumos);
router.post("/insumos", authenticateToken, addInsumo);
router.get("/insumos/:id", authenticateToken, getInsumoById);
router.put("/insumos/:id", authenticateToken, updateInsumo);
router.delete("/insumos/:id", authenticateToken, deleteInsumo);
router.post("/movimientos", authenticateToken, addMovimiento);
router.get("/movimientos", authenticateToken, getMovimientos);
router.get(
  "/movimientos/insumo/:id_insumo",
  authenticateToken,
  getMovimientosByInsumo
);

module.exports = router;
