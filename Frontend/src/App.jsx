import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./Login/LoginPage";
import Home_Normal from "./Home/Home";
import Pacientes from "./Pacientes/Pacientes";
import FichaPaciente from "./Pacientes/FichaPaciente";
import Inventario from "./Inventario/Inventario";
import Producto from "./Inventario/Producto";
import Administrador from "./components/Administrador";
import Recuperar from "./components/Recuperar";
import Citas from "./Citas/Citas";
import Examenes from "./Examenes/Examenes";
import CrudExamenes from "./Examenes/CrudExamenes";
import RealizarExamen from "./Examenes/RealizarExamen";
import EditarExamenRealizado from "./Examenes/EditarExamenRealizado";
import Pagos from "./Pagos/Pagos";
import Estadisticas from "./Estadisticas/Estadisticas";
import "./App.css";

function App() {
  useEffect(() => {
    let timeout;
    const INACTIVITY_LIMIT = 120 * 60 * 1000; // 120 minutos

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.removeItem("user");
        window.location.href = "/";
      }, INACTIVITY_LIMIT);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, []);

  return (
    <Router>
      <InnerApp />
    </Router>
  );
}

function InnerApp() {
  const location = useLocation();
  const showNavbar =
    location.pathname !== "/" && location.pathname !== "/recuperar";

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/" element={<LoginPage />} />
        {/* Solo admin (rol 0) puede ver estas rutas */}
        <Route element={<ProtectedRoute allowedPrivileges={[0]} />}>
          <Route path="/home_normal" element={<Home_Normal />} />
        </Route>
        <Route element={<ProtectedRoute allowedPrivileges={[0]} />}>
          <Route path="/administrador" element={<Administrador />} />
        </Route>
        <Route element={<ProtectedRoute allowedPrivileges={[0]} />}>
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/fichaPaciente" element={<FichaPaciente />} />
          <Route path="/producto" element={<Producto />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/examenes" element={<Examenes />} />
          <Route path="/crud-examenes" element={<CrudExamenes />} />
          <Route path="/realizar-examen" element={<RealizarExamen />} />
          <Route
            path="/editar-examen-realizado/:id"
            element={<EditarExamenRealizado />}
          />
          <Route path="/Pagos" element={<Pagos />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
