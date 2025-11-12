import React from "react";

function Home_Normal() {
  return (
    <div
      style={{
        backgroundColor: "#F0F0F0",
        minHeight: "100vh",
        marginLeft: "250px", // mismo ancho que el sidebar
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h2 className="fw-bold" style={{ color: "#00C2CC" }}>
        Bienvenido
      </h2>
    </div>
  );
}

export default Home_Normal;
