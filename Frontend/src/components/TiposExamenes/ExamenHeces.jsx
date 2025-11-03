import React from "react";
import DatosGeneralesExamen from "../../Examenes/DatosGeneralesExamen";

export default function ExamenHeces({
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
    <div
      style={{
        background: "#f8f9fa",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px #ddd",
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <DatosGeneralesExamen
        form={form}
        setForm={setForm}
        pacientes={pacientes}
        selectedPaciente={selectedPaciente}
        setSelectedPaciente={setSelectedPaciente}
        lockPaciente={lockPaciente}
      />

      <div
        style={{
          fontWeight: "bold",
          fontSize: 18,
          margin: "24px 0 12px 0",
          color: "#00C2CC",
          textAlign: "center",
        }}
      >
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

      <div
        style={{
          fontWeight: "bold",
          fontSize: 18,
          margin: "24px 0 12px 0",
          color: "#00C2CC",
          textAlign: "center",
        }}
      >
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
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Bacterias</label>
          <input
            className="form-control"
            value={form.parasitologico?.bacterias || ""}
            onChange={(e) => handleChange(e, "parasitologico", "bacterias")}
          />
        </div>
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
  );
}