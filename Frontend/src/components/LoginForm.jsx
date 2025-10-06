import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const LoginForm = () => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    const handleLogin = () => {
        if (username && password) {
            axios
                .post("http://localhost:5000/api/users/login", { nombre_usuario: username, contrasena: password })
                .then((response) => {
                    const data = response.data;
                    console.log("Respuesta del servidor:", data);

                    // Login normal: guarda token y datos de usuario
                    const { id_usuario, nombre, apellido, nombre_usuario, rol, estado, requiereCambioPassword } = data.user;
                    localStorage.setItem("user", JSON.stringify({ id_usuario, nombre, apellido, nombre_usuario, rol: Number(rol), estado, requiereCambioPassword }));

                    localStorage.setItem("token", data.token); // Guarda el token para futuras peticiones

                     // Si requiere cambio de contraseña
                    if (data.user.requiereCambioPassword === 1) {
                        Swal.fire({
                            title: "Contraseña temporal",
                            text: "Debes cambiar tu contraseña temporal antes de continuar.",
                            icon: "warning",
                            showConfirmButton: true
                        }).then(() => {
                            // Puedes pasar el id_usuario por estado o query si lo necesitas
                            navigate("/administrador", { state: { id_usuario: data.user.id_usuario } });
                        });
                        return;
                    }
                    console.log("Usuario con rol:", rol);
                    if (rol == 0) {
                        console.log("Navegando a /home_normal");
                        navigate("/home_normal");
                    }
                })
                .catch((error) => {
                    Swal.fire({
                        title: "Error",
                        text: "Usuario o contraseña incorrectos",
                        icon: "error",
                        showConfirmButton: false,
                        timer: 1500
                    });
                });
        } else {
            Swal.fire({
                title: "Error",
                text: "Por favor, completa todos los campos.",
                icon: "error",
                showConfirmButton: false,
                timer: 1500
            });
        }
    };


    return (
        <div className="container-fluid d-flex justify-content-center align-items-center px-2">
            <div className="w-100" style={{ maxWidth: 400 }}>
                <h2
                    className="fw-bold mb-4 text-center"
                    style={{ color: "#00C2CC" }}
                >
                    Iniciar Sesión
                </h2>

                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    {/* Usuario */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">
                            Usuario
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ingresa tu usuario"
                            style={{
                                borderRadius: "10px",
                                padding: "0.75rem",
                            }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    {/* Contraseña con ojito */}
                    <div className="mb-3 position-relative">
                        <label className="form-label fw-semibold">
                            Contraseña
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Ingresa tu contraseña"
                            style={{
                                borderRadius: "10px",
                                padding: "0.75rem 2.5rem 0.75rem 0.75rem",
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        <i
                            className={`bi ${
                                showPassword
                                    ? "bi-eye-slash-fill"
                                    : "bi-eye-fill"
                            }`}
                            style={{
                                position: "absolute",
                                top: "65%",
                                right: "15px",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                fontSize: "1.2rem",
                                color: "#00C2CC",
                            }}
                            onClick={() => setShowPassword(!showPassword)}
                        ></i>
                    </div>

                    {/* Botón login */}
                    <button
                        type="submit"
                        className="btn w-100 fw-bold text-white mt-2"
                        style={{
                            backgroundColor: "#00C2CC",
                            borderRadius: "30px",
                            padding: "0.8rem",
                            fontSize: "1rem",
                            transition: "all 0.3s ease",
                        }}
                        onMouseOver={(e) =>
                            (e.target.style.backgroundColor = "#0099a3")
                        }
                        onMouseOut={(e) =>
                            (e.target.style.backgroundColor = "#00C2CC")
                        }
                    >
                        Ingresar
                    </button>
                </form>
                            <div className="text-center mt-3">
                                <a href="/recuperar" className="text-decoration-none" style={{ color: '#00C2CC' }}>¿Olvidaste tu contraseña?</a>
                            </div>
            </div>
        </div>
    );
};

export default LoginForm;