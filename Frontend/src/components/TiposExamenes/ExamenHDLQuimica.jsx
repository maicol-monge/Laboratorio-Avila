import React from "react";
import DatosGeneralesExamen from "../../Examenes/DatosGeneralesExamen";

export default function ExamenHDLQuimica({
  form,
  setForm,
  pacientes,
  selectedPaciente,
  setSelectedPaciente,
  lockPaciente,
}) {
  const handleChange = (e, field) => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  return (
    <div>
      <DatosGeneralesExamen
        form={form}
        setForm={setForm}
        pacientes={pacientes}
        selectedPaciente={selectedPaciente}
        setSelectedPaciente={setSelectedPaciente}
        lockPaciente={lockPaciente}
      />
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
            <td><b>HDL</b></td>
            <td>
              <input
                className="form-control"
                value={form.hdl || ""}
                onChange={(e) => handleChange(e, "hdl")}
              />
            </td>
            <td>
              Nivel Favorable: mayor de 55.0<br />
              Nivel sospechoso: 35 - 55.0<br />
              Indicador de Riesgo: menor de 35.0
            </td>
          </tr>
          <tr>
            <td><b>LDL</b></td>
            <td>
              <input
                className="form-control"
                value={form.ldl || ""}
                onChange={(e) => handleChange(e, "ldl")}
              />
            </td>
            <td>
              Sospechoso de 150 – 190<br />
              Elevado mayor de 190
            </td>
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
          <tr>
            <td><b>NITROGENO UREICO</b></td>
            <td>
              <input
                className="form-control"
                value={form.nitrogeno_ureico || ""}
                onChange={(e) => handleChange(e, "nitrogeno_ureico")}
              />
            </td>
            <td>8.0 – 23 mg/dl</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}