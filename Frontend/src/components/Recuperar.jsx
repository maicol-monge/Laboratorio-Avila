import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const Recuperar = () => {
    const [nombreUsuario, setNombreUsuario] = useState("");
    const navigate = useNavigate();

    // Función para centrar el contenido vertical y horizontalmente
    const containerStyle = {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7fafd"
    };

    const handleRecuperar = (e) => {
        e.preventDefault();

        if (!navigator.onLine) {
            Swal.fire({
                title: "Sin conexión",
                text: "Debes estar conectado a internet para recuperar tu contraseña.",
                icon: "warning",
                showConfirmButton: true
            });
            return;
        }

        if (!nombreUsuario) {
            Swal.fire({
                title: "Error",
                text: "Por favor, ingresa tu nombre de usuario.",
                icon: "error",
                showConfirmButton: false,
                timer: 1500
            });
            return;
        }
        axios.post("http://localhost:5000/api/users/recuperar-password", { nombre_usuario: nombreUsuario })
            .then((res) => {
                // Espera que el backend devuelva { correoOfuscado: "p****a@c****o.com" }
                const correo = res.data.correoOfuscado || "tu correo registrado";
                Swal.fire({
                    title: "¡Listo!",
                    html: `Si el usuario existe, recibirás instrucciones para recuperar tu contraseña en <b>${correo}</b>.`,
                    icon: "success",
                    showConfirmButton: true
                }).then(() => {
                    navigate("/");
                });
            })
            .catch(() => {
                Swal.fire({
                    title: "Error",
                    text: "Hubo un problema al enviar el correo. Intenta nuevamente.",
                    icon: "error",
                    showConfirmButton: false,
                    timer: 1500
                });
            });
    };

    return (
        <div style={containerStyle}>
            <div className="w-100 shadow" style={{ maxWidth: 400, background: "#fff", borderRadius: 16, padding: 32 }}>
                <h2 className="fw-bold mb-4 text-center" style={{ color: "#00C2CC" }}>
                    Recuperar Contraseña
                </h2>
                <form onSubmit={handleRecuperar}>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">
                            Nombre de usuario
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ingresa tu nombre de usuario"
                            style={{
                                borderRadius: "10px",
                                padding: "0.75rem",
                            }}
                            value={nombreUsuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            autoComplete="username"
                        />
                    </div>
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
                        Enviar instrucciones
                    </button>
                </form>
                <div className="text-center mt-3">
                    <a href="/" className="text-decoration-none" style={{ color: '#00C2CC' }}>Volver al inicio de sesión</a>
                </div>
            </div>
        </div>
    );
};

export default Recuperar;