import React from "react";
import DatosGeneralesExamen from "../../Examenes/DatosGeneralesExamen";

export default function ExamenQuimicaBasica({
  form,
  setForm,
  readOnly = false,
  pacientes = [],
  selectedPaciente,
  setSelectedPaciente,
  lockPaciente,
}) {
  // Helper para actualizar campos
  const handleChange = (e, field) => {
    setForm({
      ...form,
      [field]: e.target.value,
    });
  };

  return (
    <div>
      {/* Datos generales (delegado al componente) */}
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
            <td>
              <b>GLUCOSA</b>
            </td>
            <td>
              <input
                className="form-control"
                value={form.glucosa || ""}
                onChange={(e) => handleChange(e, "glucosa")}
                disabled={readOnly}
              />
            </td>
            <td>70 – 105 mg/dl</td>
          </tr>
          <tr>
            <td>
              <b>COLESTEROL</b>
            </td>
            <td>
              <input
                className="form-control"
                value={form.colesterol || ""}
                onChange={(e) => handleChange(e, "colesterol")}
                disabled={readOnly}
              />
            </td>
            <td>150 – 200 mg/dl</td>
          </tr>
          <tr>
            <td>
              <b>TRIGLICERIDOS</b>
            </td>
            <td>
              <input
                className="form-control"
                value={form.trigliceridos || ""}
                onChange={(e) => handleChange(e, "trigliceridos")}
                disabled={readOnly}
              />
            </td>
            <td>50 – 150 mg/dl</td>
          </tr>
          <tr>
            <td>
              <b>ACIDO URICO</b>
            </td>
            <td>
              <input
                className="form-control"
                value={form.acido_urico || ""}
                onChange={(e) => handleChange(e, "acido_urico")}
                disabled={readOnly}
              />
            </td>
            <td>3 – 7 mg/dl</td>
          </tr>
          <tr>
            <td>
              <b>CREATININA</b>
            </td>
            <td>
              <input
                className="form-control"
                value={form.creatinina || ""}
                onChange={(e) => handleChange(e, "creatinina")}
                disabled={readOnly}
              />
            </td>
            <td>0.7 – 1.3 mg/dl</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
