import React from "react";

export default function ExamenOrina({ form, setForm }) {
  // Helper para actualizar campos anidados
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
      {/* Datos generales */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Edad</label>
          <input
            className="form-control"
            value={form.edad || ""}
            onChange={(e) => handleChange(e, null, "edad")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Sexo</label>
          <input
            className="form-control"
            value={form.sexo || ""}
            onChange={(e) => handleChange(e, null, "sexo")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Tipo de muestra</label>
          <input
            className="form-control"
            value={form.tipo_muestra || ""}
            onChange={(e) => handleChange(e, null, "tipo_muestra")}
          />
        </div>
      </div>
      {/* Examen Físico */}
      <div
        style={{
          background: "#f4f4f4",
          fontWeight: "bold",
          margin: "16px 0 8px 0",
          padding: "4px 8px",
          borderRadius: 4,
        }}
      >
        Exámen Físico
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
          <label>Aspecto</label>
          <input
            className="form-control"
            value={form.fisico?.aspecto || ""}
            onChange={(e) => handleChange(e, "fisico", "aspecto")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>PH</label>
          <input
            className="form-control"
            value={form.fisico?.ph || ""}
            onChange={(e) => handleChange(e, "fisico", "ph")}
          />
        </div>
      </div>
      {/* Examen Químico */}
      <div
        style={{
          background: "#f4f4f4",
          fontWeight: "bold",
          margin: "16px 0 8px 0",
          padding: "4px 8px",
          borderRadius: 4,
        }}
      >
        Exámen Químico
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Densidad</label>
          <input
            className="form-control"
            value={form.quimico?.densidad || ""}
            onChange={(e) => handleChange(e, "quimico", "densidad")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Nitritos</label>
          <input
            className="form-control"
            value={form.quimico?.nitritos || ""}
            onChange={(e) => handleChange(e, "quimico", "nitritos")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Glucosa</label>
          <input
            className="form-control"
            value={form.quimico?.glucosa || ""}
            onChange={(e) => handleChange(e, "quimico", "glucosa")}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Proteínas</label>
          <input
            className="form-control"
            value={form.quimico?.proteinas || ""}
            onChange={(e) => handleChange(e, "quimico", "proteinas")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Cuerpos Cetonicos</label>
          <input
            className="form-control"
            value={form.quimico?.cuerpos_cetonicos || ""}
            onChange={(e) => handleChange(e, "quimico", "cuerpos_cetonicos")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Urobilinogeno</label>
          <input
            className="form-control"
            value={form.quimico?.urobilinogeno || ""}
            onChange={(e) => handleChange(e, "quimico", "urobilinogeno")}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Bilirrubina</label>
          <input
            className="form-control"
            value={form.quimico?.bilirrubina || ""}
            onChange={(e) => handleChange(e, "quimico", "bilirrubina")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Sangre Oculta</label>
          <input
            className="form-control"
            value={form.quimico?.sangre_oculta || ""}
            onChange={(e) => handleChange(e, "quimico", "sangre_oculta")}
          />
        </div>
      </div>
      {/* Examen Microscópico */}
      <div
        style={{
          background: "#f4f4f4",
          fontWeight: "bold",
          margin: "16px 0 8px 0",
          padding: "4px 8px",
          borderRadius: 4,
        }}
      >
        Exámen Microscópico
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Leucocitos</label>
          <input
            className="form-control"
            value={form.microscopico?.leucocitos || ""}
            onChange={(e) => handleChange(e, "microscopico", "leucocitos")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Hematíes</label>
          <input
            className="form-control"
            value={form.microscopico?.hematies || ""}
            onChange={(e) => handleChange(e, "microscopico", "hematies")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Células escamosas</label>
          <input
            className="form-control"
            value={form.microscopico?.celulas_escamosas || ""}
            onChange={(e) => handleChange(e, "microscopico", "celulas_escamosas")}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Células redondas</label>
          <input
            className="form-control"
            value={form.microscopico?.celulas_redondas || ""}
            onChange={(e) => handleChange(e, "microscopico", "celulas_redondas")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Cilindros</label>
          <input
            className="form-control"
            value={form.microscopico?.cilindros || ""}
            onChange={(e) => handleChange(e, "microscopico", "cilindros")}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Cristales</label>
          <input
            className="form-control"
            value={form.microscopico?.cristales || ""}
            onChange={(e) => handleChange(e, "microscopico", "cristales")}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Parásitos</label>
          <input
            className="form-control"
            value={form.microscopico?.parasitos || ""}
            onChange={(e) => handleChange(e, "microscopico", "parasitos")}
          />
        </div>
        <div style={{ flex: 2 }}>
          <label>Otros</label>
          <input
            className="form-control"
            value={form.microscopico?.otros || ""}
            onChange={(e) => handleChange(e, "microscopico", "otros")}
          />
        </div>
      </div>
    </div>
  );
}