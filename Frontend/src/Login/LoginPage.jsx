import { useState } from "react";
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import logo from '../assets/lab-avila-logo.png';

const LoginPage = () => {
    return (
        <div
            className="container-fluid page-full-screen min-vh-100 d-flex align-items-center justify-content-center p-0"
            style={{
                background: "linear-gradient(135deg, #ffffff 60%,  #00C2CC 40%)",
            }}
        >
        {/* container interno sólo para limitar ancho del contenido centrado */}
        <div className="container">

        <div className="row w-100">
            {/* Panel izquierdo */}
            <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center text-white" style={{ padding: "100px" }}>
                <img
                    src={logo}
                    alt="Logo de Lab Avila"
                    className="mb-4"
                    style={{
                        maxWidth: "300px",
                        height: "auto",
                        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
                    }}
                />
                <h1 className="fw-bold mb-1" style={{ fontSize: "2rem", color: "#00C2CC", fontWeight: "bold"}}>
                    ¡Bienvenidos!
                </h1>
                <br />
                <p
                    className="text-center"
                    style={{ maxWidth: "420px", fontSize: "1.15rem", lineHeight: "1.6", color: "#00C2CC", fontWeight: "bold" }}
                >
                    Comprometidos con tu Salud
                </p>
        </div>


                {/* Panel derecho */}
                <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center bg-white p-5 border-radius-15 shadow">
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                        <LoginForm />
                    </div>
                </div>
            </div>
            
        </div>{/* /.container */}
        </div>
    );
};

export default LoginPage;
