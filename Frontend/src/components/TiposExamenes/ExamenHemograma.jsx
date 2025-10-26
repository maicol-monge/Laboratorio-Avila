import React from "react";
import DatosGeneralesExamen from "../../Examenes/DatosGeneralesExamen";

export default function ExamenHemograma({
  form,
  setForm,
  pacientes,
  selectedPaciente,
  setSelectedPaciente,
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
      />

      <div style={{ fontWeight: "bold", margin: "16px 0 8px 0" }}>
        Examen: Hemograma
      </div>
      <table className="table table-bordered" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th></th>
            <th>Resultado</th>
            <th>Unidades</th>
            <th>Valor normal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GLOBULOS ROJOS</td>
            <td>
              <input
                className="form-control"
                value={form.globulos_rojos || ""}
                onChange={(e) => handleChange(e, "globulos_rojos")}
              />
            </td>
            <td>mm3</td>
            <td>4.100,000-5.700,000</td>
          </tr>
          <tr>
            <td>Hematocrito</td>
            <td>
              <input
                className="form-control"
                value={form.hematocrito || ""}
                onChange={(e) => handleChange(e, "hematocrito")}
              />
            </td>
            <td>%</td>
            <td>37-51</td>
          </tr>
          <tr>
            <td>Hemoglobina</td>
            <td>
              <input
                className="form-control"
                value={form.hemoglobina || ""}
                onChange={(e) => handleChange(e, "hemoglobina")}
              />
            </td>
            <td>gr/dl</td>
            <td>12-17</td>
          </tr>
          <tr>
            <td>VCM</td>
            <td>
              <input
                className="form-control"
                value={form.vcm || ""}
                onChange={(e) => handleChange(e, "vcm")}
              />
            </td>
            <td>Mic.Cub</td>
            <td>80-100</td>
          </tr>
          <tr>
            <td>HCM</td>
            <td>
              <input
                className="form-control"
                value={form.hcm || ""}
                onChange={(e) => handleChange(e, "hcm")}
              />
            </td>
            <td>M.Microgr</td>
            <td>27-34</td>
          </tr>
          <tr>
            <td>CHCM</td>
            <td>
              <input
                className="form-control"
                value={form.chcm || ""}
                onChange={(e) => handleChange(e, "chcm")}
              />
            </td>
            <td>%</td>
            <td>32-36</td>
          </tr>
          <tr>
            <td>GLOBULOS BLANCOS</td>
            <td>
              <input
                className="form-control"
                value={form.globulos_blancos || ""}
                onChange={(e) => handleChange(e, "globulos_blancos")}
              />
            </td>
            <td>mm3</td>
            <td>5,000-10,000</td>
          </tr>
          <tr>
            <th colSpan={4} style={{ textAlign: "center" }}>
              FORMULA DIFERENCIAL
            </th>
          </tr>
          <tr>
            <td>Neutrófilos</td>
            <td>
              <input
                className="form-control"
                value={form.neutrofilos || ""}
                onChange={(e) => handleChange(e, "neutrofilos")}
              />
            </td>
            <td>%</td>
            <td>37-70</td>
          </tr>
          <tr>
            <td>Linfocitos</td>
            <td>
              <input
                className="form-control"
                value={form.linfocitos || ""}
                onChange={(e) => handleChange(e, "linfocitos")}
              />
            </td>
            <td>%</td>
            <td>20-45</td>
          </tr>
          <tr>
            <td>Monocitos</td>
            <td>
              <input
                className="form-control"
                value={form.monocitos || ""}
                onChange={(e) => handleChange(e, "monocitos")}
              />
            </td>
            <td>%</td>
            <td>0.0-8</td>
          </tr>
          <tr>
            <td>Eosinófilos</td>
            <td>
              <input
                className="form-control"
                value={form.eosinofilos || ""}
                onChange={(e) => handleChange(e, "eosinofilos")}
              />
            </td>
            <td>%</td>
            <td>0.0-6</td>
          </tr>
          <tr>
            <td>Basófilos</td>
            <td>
              <input
                className="form-control"
                value={form.basofilos || ""}
                onChange={(e) => handleChange(e, "basofilos")}
              />
            </td>
            <td>%</td>
            <td>0.0-1.0</td>
          </tr>
          <tr>
            <td>PLAQUETAS</td>
            <td>
              <input
                className="form-control"
                value={form.plaquetas || ""}
                onChange={(e) => handleChange(e, "plaquetas")}
              />
            </td>
            <td>mm3</td>
            <td>150,000 – 450,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}