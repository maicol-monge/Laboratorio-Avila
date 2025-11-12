require("dotenv").config(); //Cargar variables d entorno
const express = require("express"); //Crear servidor web
const cors = require("cors"); //Para permitir solicitudes desde otro dominio

const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const pacienteRoutes = require("./routes/pacienteRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");
const citaRoutes = require("./routes/citaRoutes");
const examenRoutes = require("./routes/examenRoutes");
const examen_realizadoRoutes = require("./routes/examen_realizadoRoutes");
const comprobanteRoutes = require("./routes/comprobanteRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express(); //Instancia del servidor
app.use(cors()); //Evitar errores al consumir en React
app.use(express.json()); //Recibir los datos en JSON

db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1); // Sale de la aplicación en caso de error
  }
  console.log("Conectado a la base de datos MySQL");
});

// Rutas
app.use("/api/users", userRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/citas", citaRoutes);
app.use("/api/examenes", examenRoutes);
app.use("/api/examenes_realizados", examen_realizadoRoutes);
app.use("/api/comprobantes", comprobanteRoutes);
app.use("/api/stats", statsRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});