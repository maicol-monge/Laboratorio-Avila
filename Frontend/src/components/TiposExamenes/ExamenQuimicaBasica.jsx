import React from "react";

export default function ExamenQuimicaBasica({ form, setForm }) {
  // Helper para actualizar campos
  const handleChange = (e, field) => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  return (
    <div>
      {/* Datos generales */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Edad:</label>
          <input
            className="form-control"
            value={form.edad || ""}
            onChange={(e) => handleChange(e, "edad")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Sexo:</label>
          <input
            className="form-control"
            value={form.sexo || ""}
            onChange={(e) => handleChange(e, "sexo")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Tipo de muestra:</label>
          <input
            className="form-control"
            value={form.tipo_muestra || "Sangre"}
            onChange={(e) => handleChange(e, "tipo_muestra")}
          />
        </div>
      </div>
      {/* Tabla de resultados */}
      <table className="table table-bordered" style={{ marginTop: 16 }}>
        <thead>
          <tr style={{ background: "#222", color: "#fff" }}>
            <th>EXAMEN</th>
            <th>RESULTADO</th>
            <th>VALOR NORMAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>GLUCOSA</b></td>
            <td>
              <input
                className="form-control"
                value={form.glucosa || ""}
                onChange={(e) => handleChange(e, "glucosa")}
              />
            </td>
            <td>70 – 105 mg/dl</td>
          </tr>
          <tr>
            <td><b>COLESTEROL</b></td>
            <td>
              <input
                className="form-control"
                value={form.colesterol || ""}
                onChange={(e) => handleChange(e, "colesterol")}
              />
            </td>
            <td>150 – 200 mg/dl</td>
          </tr>
          <tr>
            <td><b>TRIGLICERIDOS</b></td>
            <td>
              <input
                className="form-control"
                value={form.trigliceridos || ""}
                onChange={(e) => handleChange(e, "trigliceridos")}
              />
            </td>
            <td>50 – 150 mg/dl</td>
          </tr>
          <tr>
            <td><b>ACIDO URICO</b></td>
            <td>
              <input
                className="form-control"
                value={form.acido_urico || ""}
                onChange={(e) => handleChange(e, "acido_urico")}
              />
            </td>
            <td>3 – 7 mg/dl</td>
          </tr>
          <tr>
            <td><b>CREATININA</b></td>
            <td>
              <input
                className="form-control"
                value={form.creatinina || ""}
                onChange={(e) => handleChange(e, "creatinina")}
              />
            </td>
            <td>0.7 – 1.3 mg/dl</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}