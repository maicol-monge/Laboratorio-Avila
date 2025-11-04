import React from "react";
import DatosGeneralesExamen from "../../Examenes/DatosGeneralesExamen";

export default function ExamenHpEgh({
  form,
  setForm,
  pacientes,
  selectedPaciente,
  setSelectedPaciente,
  lockPaciente,
}) {
  const handleChange = (e, section, field) => {
    if (section) {
      setForm({
        ...form,
        [section]: { ...form[section], [field]: e.target.value },
      });
    } else {
      setForm({ ...form, [field]: e.target.value });
    }
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

      <div style={{ fontWeight: "bold", fontSize: 20, color: "#00C2CC", margin: "32px 0 16px 0", textAlign: "center" }}>
        Examen Físico
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Color</label>
          <input
            className="form-control"
            value={form.fisico?.color || ""}
            onChange={(e) => handleChange(e, "fisico", "color")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Consistencia</label>
          <input
            className="form-control"
            value={form.fisico?.consistencia || ""}
            onChange={(e) => handleChange(e, "fisico", "consistencia")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Mucus</label>
          <input
            className="form-control"
            value={form.fisico?.mucus || ""}
            onChange={(e) => handleChange(e, "fisico", "mucus")}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Leucocitos</label>
          <input
            className="form-control"
            value={form.fisico?.leucocitos || ""}
            onChange={(e) => handleChange(e, "fisico", "leucocitos")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Hematíes</label>
          <input
            className="form-control"
            value={form.fisico?.hematies || ""}
            onChange={(e) => handleChange(e, "fisico", "hematies")}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label>Restos alimenticios macroscópicos</label>
          <input
            className="form-control"
            value={form.fisico?.restos_macroscopicos || ""}
            onChange={(e) => handleChange(e, "fisico", "restos_macroscopicos")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Restos alimenticios microscópicos</label>
          <input
            className="form-control"
            value={form.fisico?.restos_microscopicos || ""}
            onChange={(e) => handleChange(e, "fisico", "restos_microscopicos")}
          />
        </div>
      </div>

      <div style={{ fontWeight: "bold", fontSize: 20, color: "#00C2CC", margin: "32px 0 16px 0", textAlign: "center" }}>
        Examen Parasitológico
      </div>
      <div style={{ display: "flex", gap: 32, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>Protozoarios</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Activos</label>
              <input
                className="form-control"
                value={form.parasitologico?.activos || ""}
                onChange={(e) => handleChange(e, "parasitologico", "activos")}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Quistes</label>
              <input
                className="form-control"
                value={form.parasitologico?.quistes || ""}
                onChange={(e) => handleChange(e, "parasitologico", "quistes")}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Bacterias</label>
              <input
                className="form-control"
                value={form.parasitologico?.bacterias || ""}
                onChange={(e) => handleChange(e, "parasitologico", "bacterias")}
              />
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>Metazoarios</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Huevo</label>
              <input
                className="form-control"
                value={form.parasitologico?.huevo || ""}
                onChange={(e) => handleChange(e, "parasitologico", "huevo")}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Larva</label>
              <input
                className="form-control"
                value={form.parasitologico?.larva || ""}
                onChange={(e) => handleChange(e, "parasitologico", "larva")}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Levaduras</label>
              <input
                className="form-control"
                value={form.parasitologico?.levaduras || ""}
                onChange={(e) => handleChange(e, "parasitologico", "levaduras")}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold" }}>HELICOBACTER PYLORI EN HECES</label>
          <input
            className="form-control"
            value={form.helicobacter_pylori || ""}
            onChange={(e) => handleChange(e, null, "helicobacter_pylori")}
          />
        </div>
      </div>
    </div>
  );
}