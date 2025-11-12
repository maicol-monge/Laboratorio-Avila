const express = require("express"); 
const {
	createPaciente,
	getPacientes,
	getPacienteById,
	updatePaciente,
	deletePaciente
} = require("../controllers/pacienteController");

const authenticateToken = require("../middlewares/auth"); // Importa el middleware

const router = express.Router(); 

// Rutas de paciente protegidas por token
router.get("/", authenticateToken, getPacientes);
router.post("/", authenticateToken, createPaciente);
// Obtener exámenes realizados y citas por paciente
router.get("/:id/examenes", authenticateToken, (req, res) => {
	// delegate to controller function if exported
	const { getExamenesByPaciente } = require("../controllers/pacienteController");
	return getExamenesByPaciente(req, res);
});
router.get("/:id/citas", authenticateToken, (req, res) => {
	const { getCitasByPaciente } = require("../controllers/pacienteController");
	return getCitasByPaciente(req, res);
});
router.get("/:id", authenticateToken, getPacienteById);
router.put("/:id", authenticateToken, updatePaciente);
router.delete("/:id", authenticateToken, deletePaciente);

module.exports = router;