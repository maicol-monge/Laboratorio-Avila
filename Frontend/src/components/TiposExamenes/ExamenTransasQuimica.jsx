import React from "react";
import DatosGeneralesExamen from "../../Examenes/DatosGeneralesExamen";

export default function ExamenTransasQuimica({
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

      <div style={{ fontWeight: "bold", margin: "16px 0 8px 0" }}>
        Examen: Transas quimica
      </div>
      <table className="table table-bordered" style={{ marginTop: 16 }}>
        <thead>
          <tr>
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
          <tr>
            <td><b>TGO</b></td>
            <td>
              <input
                className="form-control"
                value={form.tgo || ""}
                onChange={(e) => handleChange(e, "tgo")}
              />
            </td>
            <td>Hasta 37 U/L</td>
          </tr>
          <tr>
            <td><b>TGP</b></td>
            <td>
              <input
                className="form-control"
                value={form.tgp || ""}
                onChange={(e) => handleChange(e, "tgp")}
              />
            </td>
            <td>Hasta 42 U/L</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}