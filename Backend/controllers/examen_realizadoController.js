const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { TemplateHandler } = require("easy-template-x");
const JSZip = require("jszip");

// Crear un examen realizado
exports.addExamenRealizado = (req, res) => {
  const { id_paciente, id_examen, diagnostico, estado } = req.body;
  // Si diagnostico ya es string, no lo vuelvas a serializar
  const diagnosticoStr =
    typeof diagnostico === "string" ? diagnostico : JSON.stringify(diagnostico);

  db.query(
    `INSERT INTO examen_realizado (id_paciente, id_examen, diagnostico, estado, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [id_paciente, id_examen, diagnosticoStr, estado],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al agregar el examen realizado" });
      }
      res.json({
        message: "Examen realizado agregado exitosamente",
        id_examen_realizado: results.insertId,
      });
    }
  );
};

// Obtener exámenes realizados
exports.getExamenesRealizados = (req, res) => {
  db.query("SELECT * FROM examen_realizado", (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener los exámenes realizados" });
    }
    // Manejo seguro de JSON.parse
    const data = results.map((r) => {
      let diagnosticoObj = null;
      try {
        diagnosticoObj = r.diagnostico ? JSON.parse(r.diagnostico) : null;
      } catch (e) {
        diagnosticoObj = null;
      }
      return { ...r, diagnostico: diagnosticoObj };
    });
    res.json(data);
  });
};

// Obtener un examen realizado por ID
exports.getExamenRealizadoById = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM examen_realizado WHERE id_examen_realizado = ?",
    [id],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener el examen realizado" });
      }
      if (!results || !results[0]) {
        return res.status(404).json({ error: "Examen no encontrado" });
      }
      // Parsear el diagnóstico a objeto
      const data = {
        ...results[0],
        diagnostico: results[0].diagnostico
          ? JSON.parse(results[0].diagnostico)
          : null,
      };
      res.json(data);
    }
  );
};

// Actualizar un examen realizado
exports.updateExamenRealizado = (req, res) => {
  const { id } = req.params;
  const { id_paciente, id_examen, diagnostico, estado } = req.body;
  const diagnosticoStr =
    typeof diagnostico === "string" ? diagnostico : JSON.stringify(diagnostico);

  db.query(
    `UPDATE examen_realizado SET id_paciente = ?, id_examen = ?, diagnostico = ?, estado = ?, updated_at = NOW()
         WHERE id_examen_realizado = ?`,
    [id_paciente, id_examen, diagnosticoStr, estado, id],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al actualizar el examen realizado" });
      }
      res.json({ message: "Examen realizado actualizado exitosamente" });
    }
  );
};

// Eliminar un examen realizado
exports.deleteExamenRealizado = (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM examen_realizado WHERE id_examen_realizado = ?",
    [id],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al eliminar el examen realizado" });
      }
      res.json({ message: "Examen realizado eliminado exitosamente" });
    }
  );
};

// Exportar examen realizado a .docx usando plantilla con Content Controls y easy-template-x
exports.exportExamenRealizado = (req, res) => {
  const { id } = req.params;

  // Obtener datos del examen realizado junto con paciente y examen
  const sql = `SELECT er.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.edad AS paciente_edad, p.sexo AS paciente_sexo, e.titulo_examen
                 FROM examen_realizado er
                 JOIN paciente p ON er.id_paciente = p.id_paciente
                 JOIN examen e ON er.id_examen = e.id_examen
                 WHERE er.id_examen_realizado = ?`;

  db.query(sql, [id], async (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener el examen realizado" });
    }
    if (!results || !results[0]) {
      return res.status(404).json({ error: "Examen no encontrado" });
    }

    const row = results[0];

    // diagnostico guardado en la BD (JSON string) -> parsear con tolerancia
    let diagnostico = {};
    try {
      diagnostico = row.diagnostico ? JSON.parse(row.diagnostico) : {};
    } catch (e) {
      diagnostico = {};
    }

    // Construir el objeto de datos que mapeará a los Content Controls
    const data = {
      paciente: `${row.paciente_nombre || ""} ${
        row.paciente_apellido || ""
      }`.trim(),
      edad: diagnostico.edad || row.paciente_edad || "",
      sexo: diagnostico.sexo || row.paciente_sexo || "",
      numeroRegistro:
        diagnostico.numeroRegistro || row.id_examen_realizado || "",
      tipoMuestra: diagnostico.tipoMuestra || diagnostico.tipo_muestra || "",
      examen: row.titulo_examen || "",
      // Campos específicos para Transas quimica
      glucosa: diagnostico.glucosa || "",
      colesterol: diagnostico.colesterol || diagnostico.colesteros || "",
      trigliceridos: diagnostico.trigliceridos || "",
      acido_urico: diagnostico.acido_urico || diagnostico.acidoUrico || "",
      creatinina: diagnostico.creatinina || "",
      tgo: diagnostico.tgo || "",
      tgp: diagnostico.tgp || "",
      // Campos para HDL Química
      hdl: diagnostico.hdl || "",
      ldl: diagnostico.ldl || "",
      nitrogeno_ureico:
        diagnostico.nitrogeno_ureico || diagnostico.nitrogenoUreico || "",
      // Campos específicos para Hemograma
      globulos_rojos: diagnostico.globulos_rojos || "",
      hematocrito: diagnostico.hematocrito || "",
      hemoglobina: diagnostico.hemoglobina || "",
      vcm: diagnostico.vcm || "",
      hcm: diagnostico.hcm || "",
      chcm: diagnostico.chcm || "",
      globulos_blancos: diagnostico.globulos_blancos || "",
      neutrofilos: diagnostico.neutrofilos || "",
      linfocitos: diagnostico.linfocitos || "",
      monocitos: diagnostico.monocitos || "",
      eosinofilos: diagnostico.eosinofilos || "",
      basofilos: diagnostico.basofilos || "",
      plaquetas: diagnostico.plaquetas || "",
      color:
        (diagnostico.fisico && diagnostico.fisico.color) ||
        diagnostico.color ||
        "",
      aspecto:
        (diagnostico.fisico && diagnostico.fisico.aspecto) ||
        diagnostico.aspecto ||
        "",
      ph: (diagnostico.fisico && diagnostico.fisico.ph) || diagnostico.ph || "",
      consistencia:
        (diagnostico.fisico && diagnostico.fisico.consistencia) ||
        diagnostico.consistencia ||
        "",
      mucus:
        (diagnostico.fisico && diagnostico.fisico.mucus) ||
        diagnostico.mucus ||
        "",
      // Preferir valores de microscopico (orina) antes que fisico (heces)
      leucocitos:
        (diagnostico.microscopico && diagnostico.microscopico.leucocitos) ||
        (diagnostico.fisico && diagnostico.fisico.leucocitos) ||
        diagnostico.leucocitos ||
        "",
      hematies:
        (diagnostico.microscopico && diagnostico.microscopico.hematies) ||
        (diagnostico.fisico && diagnostico.fisico.hematies) ||
        diagnostico.hematies ||
        "",
      celulas_escamosas:
        (diagnostico.microscopico &&
          diagnostico.microscopico.celulas_escamosas) ||
        diagnostico.celulas_escamosas ||
        "",
      celulas_redondas:
        (diagnostico.microscopico &&
          diagnostico.microscopico.celulas_redondas) ||
        diagnostico.celulas_redondas ||
        "",
      cilindros:
        (diagnostico.microscopico && diagnostico.microscopico.cilindros) ||
        diagnostico.cilindros ||
        "",
      cristales:
        (diagnostico.microscopico && diagnostico.microscopico.cristales) ||
        diagnostico.cristales ||
        "",
      parasitos:
        (diagnostico.microscopico && diagnostico.microscopico.parasitos) ||
        diagnostico.parasitos ||
        "",
      otros:
        (diagnostico.microscopico && diagnostico.microscopico.otros) ||
        diagnostico.otros ||
        "",
      restos_macroscopicos:
        (diagnostico.fisico && diagnostico.fisico.restos_macroscopicos) ||
        diagnostico.restos_macroscopicos ||
        "",
      restos_microscopicos:
        (diagnostico.fisico && diagnostico.fisico.restos_microscopicos) ||
        diagnostico.restos_microscopicos ||
        "",
      // Campos quimicos de orina
      densidad:
        (diagnostico.quimico && diagnostico.quimico.densidad) ||
        diagnostico.densidad ||
        "",
      nitritos:
        (diagnostico.quimico && diagnostico.quimico.nitritos) ||
        diagnostico.nitritos ||
        "",
      glucosa:
        (diagnostico.quimico && diagnostico.quimico.glucosa) ||
        diagnostico.glucosa ||
        (diagnostico.glucosa ? diagnostico.glucosa : ""),
      proteinas:
        (diagnostico.quimico && diagnostico.quimico.proteinas) ||
        diagnostico.proteinas ||
        "",
      cuerpos_cetonicos:
        (diagnostico.quimico && diagnostico.quimico.cuerpos_cetonicos) ||
        diagnostico.cuerpos_cetonicos ||
        "",
      urobilinogeno:
        (diagnostico.quimico && diagnostico.quimico.urobilinogeno) ||
        diagnostico.urobilinogeno ||
        "",
      bilirrubina:
        (diagnostico.quimico && diagnostico.quimico.bilirrubina) ||
        diagnostico.bilirrubina ||
        "",
      // sangre_oculta puede venir de quimico (orina) o top-level
      sangre_oculta:
        (diagnostico.quimico && diagnostico.quimico.sangre_oculta) ||
        diagnostico.sangre_oculta ||
        diagnostico.sangreOculta ||
        "",
      activos:
        (diagnostico.parasitologico && diagnostico.parasitologico.activos) ||
        diagnostico.activos ||
        "",
      quistes:
        (diagnostico.parasitologico && diagnostico.parasitologico.quistes) ||
        diagnostico.quistes ||
        "",
      huevo:
        (diagnostico.parasitologico && diagnostico.parasitologico.huevo) ||
        diagnostico.huevo ||
        "",
      larva:
        (diagnostico.parasitologico && diagnostico.parasitologico.larva) ||
        diagnostico.larva ||
        "",
      bacterias:
        (diagnostico.parasitologico && diagnostico.parasitologico.bacterias) ||
        diagnostico.bacterias ||
        "",
      levaduras:
        (diagnostico.parasitologico && diagnostico.parasitologico.levaduras) ||
        diagnostico.levaduras ||
        "",
      // Aliases y variantes para plantillas que usen nombres iguales a la vista
      tipo_muestra: diagnostico.tipoMuestra || diagnostico.tipo_muestra || "",
      numero_registro:
        diagnostico.numeroRegistro || row.id_examen_realizado || "",
      fisico_color:
        (diagnostico.fisico && diagnostico.fisico.color) ||
        diagnostico.color ||
        "",
      fisico_consistencia:
        (diagnostico.fisico && diagnostico.fisico.consistencia) ||
        diagnostico.consistencia ||
        "",
      fisico_mucus:
        (diagnostico.fisico && diagnostico.fisico.mucus) ||
        diagnostico.mucus ||
        "",
      fisico_leucocitos:
        (diagnostico.fisico && diagnostico.fisico.leucocitos) ||
        (diagnostico.microscopico && diagnostico.microscopico.leucocitos) ||
        diagnostico.leucocitos ||
        "",
      fisico_hematies:
        (diagnostico.fisico && diagnostico.fisico.hematies) ||
        (diagnostico.microscopico && diagnostico.microscopico.hematies) ||
        diagnostico.hematies ||
        "",
      parasitologico_activos:
        (diagnostico.parasitologico && diagnostico.parasitologico.activos) ||
        diagnostico.activos ||
        "",
      parasitologico_quistes:
        (diagnostico.parasitologico && diagnostico.parasitologico.quistes) ||
        diagnostico.quistes ||
        "",
      parasitologico_huevo:
        (diagnostico.parasitologico && diagnostico.parasitologico.huevo) ||
        diagnostico.huevo ||
        "",
      parasitologico_larva:
        (diagnostico.parasitologico && diagnostico.parasitologico.larva) ||
        diagnostico.larva ||
        "",
      parasitologico_bacterias:
        (diagnostico.parasitologico && diagnostico.parasitologico.bacterias) ||
        diagnostico.bacterias ||
        "",
      parasitologico_levaduras:
        (diagnostico.parasitologico && diagnostico.parasitologico.levaduras) ||
        diagnostico.levaduras ||
        "",
      fisico_restos_macroscopicos:
        (diagnostico.fisico && diagnostico.fisico.restos_macroscopicos) ||
        diagnostico.restos_macroscopicos ||
        "",
      fisico_restos_microscopicos:
        (diagnostico.fisico && diagnostico.fisico.restos_microscopicos) ||
        diagnostico.restos_microscopicos ||
        "",
      ph_heces: diagnostico.ph_heces || diagnostico.phHeces || "",
      sustancias_reductoras:
        diagnostico.sustancias_reductoras ||
        diagnostico.sustanciasReductoras ||
        "",
      // Campos PAM (Prueba de Azul de Metileno)
      polimorfonucleares:
        (diagnostico.pam && diagnostico.pam.polimorfonucleares) ||
        diagnostico.polimorfonucleares ||
        "",
      mononucleares:
        (diagnostico.pam && diagnostico.pam.mononucleares) ||
        diagnostico.mononucleares ||
        "",
      helicobacter_pylori:
        diagnostico.helicobacter_pylori ||
        diagnostico.helicobacter ||
        diagnostico.helicobacter_pylori ||
        "",
      sangre_oculta:
        (diagnostico.quimico && diagnostico.quimico.sangre_oculta) ||
        diagnostico.sangre_oculta ||
        diagnostico.sangreOculta ||
        "",
      fecha: row.created_at
        ? row.created_at.toISOString
          ? row.created_at.toISOString().slice(0, 10)
          : String(row.created_at).slice(0, 10)
        : "",
    };

    // Elegir plantilla automáticamente según el título del examen (no pedir al usuario)
    const plantillasDir = path.join(
      __dirname,
      "..",
      "..",
      "Frontend",
      "src",
      "plantillasExamenes"
    );

    // Normalizar un título para mapear a un archivo de plantilla
    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");

    const templateMap = {
      // claves normalizadas -> nombres de archivo en plantillasExamenes
      [normalize("Hp + Egh")]: "HpEgh.docx",
      [normalize("Hp + Egh+so")]: "HpEghSo.docx",
      [normalize("Hp + Egh so")]: "HpEghSo.docx",
      [normalize("Hp + Egh")]: "HpEgh.docx",
      [normalize("hemograma")]: "hemograma.docx",
      [normalize("transas quimica")]: "TransasQuimica.docx",
      [normalize("heces+pam")]: "hecesPam.docx",
      [normalize("heces")]: "heces.docx",
      [normalize("sustan,ph+egh")]: "SustanPhEgh.docx",
      [normalize("sustanph+egh")]: "SustanPhEgh.docx",
      [normalize("sustan phegh")]: "SustanPhEgh.docx",
      [normalize("(Basi) quimica")]: "BasiQuimica.docx",
      [normalize("(HDL) quimica")]: "HdlQuimica.docx",
      [normalize("orina")]: "orina.docx",
    };

    const tituloExamen = row.titulo_examen || "";
    const normalizedTitulo = normalize(tituloExamen);
    const chosenFile = templateMap[normalizedTitulo] || "HpEgh.docx"; // fallback

    const templatePath = path.join(plantillasDir, chosenFile);

    if (!fs.existsSync(templatePath)) {
      console.error("Plantilla no encontrada:", templatePath);
      return res
        .status(500)
        .json({ error: `Plantilla no encontrada en ruta: ${templatePath}` });
    }

    // Debug helper: si se pasa ?debug=1 devolvemos el objeto data y la ruta de la plantilla
    if (req.query && req.query.debug === "1") {
      console.log("[exportExamenRealizado] debug data:", data);
      return res.json({ data, templatePath });
    }

    // Si se pasa ?listTags=1 devolvemos los Content Control tags encontrados en la plantilla
    if (req.query && req.query.listTags === "1") {
      try {
        const zip = await JSZip.loadAsync(fs.readFileSync(templatePath));
        const filesToCheck = [
          "word/document.xml",
          "word/footnotes.xml",
          "word/endnotes.xml",
        ];
        // buscar headers/footers dinámicamente
        Object.keys(zip.files).forEach((p) => {
          if (
            /^word\/header[0-9]*\.xml$/.test(p) ||
            /^word\/footer[0-9]*\.xml$/.test(p)
          ) {
            filesToCheck.push(p);
          }
        });

        const tags = new Set();
        const tagRegex = /<w:tag[^>]*w:val=(?:"([^"]+)"|'([^']+)')/g;

        for (const f of filesToCheck) {
          const file = zip.file(f);
          if (!file) continue;
          const content = await file.async("string");
          let m;
          while ((m = tagRegex.exec(content)) !== null) {
            tags.add(m[1] || m[2]);
          }
        }

        const tagsArray = Array.from(tags).filter(Boolean);
        console.log("[exportExamenRealizado] found tags:", tagsArray);
        return res.json({ tags: tagsArray, templatePath });
      } catch (err) {
        console.error("Error leyendo plantilla para listar tags:", err);
        return res.status(500).json({
          error: "Error al leer plantilla para listar tags",
          details: err.message || String(err),
        });
      }
    }

    try {
      const templateBuffer = fs.readFileSync(templatePath);
      const handler = new TemplateHandler();

      // easy-template-x acepta un objeto plano con los nombres de los Content Controls
      console.log("[exportExamenRealizado] processing template:", templatePath);
      console.log("[exportExamenRealizado] data keys:", Object.keys(data));
      const outBuffer = await handler.process(templateBuffer, data);

      // Siempre intentar parchear por-tag sobre el documento ya procesado:
      // si un Content Control todavía contiene el placeholder o está vacío, reemplazar sólo ese control.
      const patchProcessedDoc = async (docBuffer, dataObj) => {
        const zip = await JSZip.loadAsync(docBuffer);
        const files = [
          "word/document.xml",
          "word/footnotes.xml",
          "word/endnotes.xml",
        ];
        Object.keys(zip.files).forEach((p) => {
          if (
            /^word\/header[0-9]*\.xml$/.test(p) ||
            /^word\/footer[0-9]*\.xml$/.test(p)
          )
            files.push(p);
        });

        const escapeXml = (str) => {
          return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&apos;");
        };

        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

        for (const fpath of files) {
          const file = zip.file(fpath);
          if (!file) continue;
          let content = await file.async("string");

          for (const key of Object.keys(dataObj)) {
            const val = dataObj[key];
            if (val === undefined || val === null) continue;
            const k = escapeRegex(key);

            // Match the <w:t> inside the sdtContent of a <w:sdt> that has the matching tag.
            // We only replace the inner text node if it equals the known placeholder (conservative).
            const tInnerRegex = new RegExp(
              `(<w:sdt[\\s\\S]*?<w:sdtPr[\\s\\S]*?<w:tag[^>]*w:val=(?:"${k}"|'${k}')[^>]*>[\\s\\S]*?<\\/w:sdtPr>[\\s\\S]*?<w:sdtContent[\\s\\S]*?>[\\s\\S]*?<w:t>)([\\s\\S]*?)(<\\/w:t>)`,
              "g"
            );

            content = content.replace(
              tInnerRegex,
              (fullMatch, beforeT, innerText, afterT) => {
                const placeholder =
                  "Haz clic o pulse aquí para escribir texto.";
                if (
                  !innerText ||
                  innerText.trim() === "" ||
                  innerText.includes(placeholder)
                ) {
                  return `${beforeT}${escapeXml(val)}${afterT}`;
                }
                return fullMatch;
              }
            );
          }

          zip.file(fpath, content);
        }

        return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
      };

      let finalBuffer = outBuffer;
      try {
        finalBuffer = await patchProcessedDoc(outBuffer, data);
      } catch (patchErr) {
        console.error(
          "[exportExamenRealizado] fallo al parchear documento procesado:",
          patchErr
        );
        // como último recurso intentar parchear la plantilla original
        try {
          const fallbackFillSdt = async (templateBuf, dataObj) => {
            const zip2 = await JSZip.loadAsync(templateBuf);
            const files2 = [
              "word/document.xml",
              "word/footnotes.xml",
              "word/endnotes.xml",
            ];
            Object.keys(zip2.files).forEach((p) => {
              if (
                /^word\/header[0-9]*\.xml$/.test(p) ||
                /^word\/footer[0-9]*\.xml$/.test(p)
              )
                files2.push(p);
            });

            const escapeXml2 = (str) =>
              String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&apos;");

            const escapeRegex2 = (s) =>
              s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

            for (const fpath of files2) {
              const file = zip2.file(fpath);
              if (!file) continue;
              let content = await file.async("string");

              for (const key of Object.keys(dataObj)) {
                const val = dataObj[key];
                if (val === undefined || val === null) continue;
                const k = escapeRegex2(key);
                const sdtRegex2 = new RegExp(
                  `<w:sdt[\\s\\S]*?<w:sdtPr[\\s\\S]*?<w:tag[^>]*w:val=(?:"${k}"|'${k}')[^>]*>[\\s\\S]*?<\\/w:sdtPr>[\\s\\S]*?<w:sdtContent>[\\s\\S]*?<\\/w:sdtContent>[\\s\\S]*?<\\/w:sdt>`,
                  "g"
                );
                content = content.replace(sdtRegex2, (match) => {
                  return match.replace(
                    /<w:sdtContent>[\s\S]*?<\/w:sdtContent>/,
                    `<w:sdtContent><w:r><w:t>${escapeXml2(
                      val
                    )}</w:t></w:r></w:sdtContent>`
                  );
                });
              }

              zip2.file(fpath, content);
            }

            return Buffer.from(
              await zip2.generateAsync({ type: "nodebuffer" })
            );
          };

          finalBuffer = await fallbackFillSdt(templateBuffer, data);
        } catch (e) {
          console.error("Fallback manual sobre plantilla también falló:", e);
          finalBuffer = outBuffer; // usar lo que tengamos
        }
      }

      // Si se solicita debugXml=1 devolvemos el document.xml renderizado para inspección
      if (req.query && req.query.debugXml === "1") {
        try {
          const outZip = await JSZip.loadAsync(finalBuffer);
          const docFile = outZip.file("word/document.xml");
          const docXml = docFile ? await docFile.async("string") : null;
          // también obtener headers si existen
          const headers = {};
          Object.keys(outZip.files).forEach((p) => {
            if (/^word\/header[0-9]*\.xml$/.test(p)) {
              headers[p] = null; // placeholder
            }
          });
          for (const h of Object.keys(headers)) {
            const f = outZip.file(h);
            if (f) headers[h] = await f.async("string");
          }

          return res.json({ documentXml: docXml, headers, data });
        } catch (ex) {
          console.error("Error extrayendo document.xml del buffer:", ex);
          return res.status(500).json({
            error: "Error al extraer document.xml del documento generado",
            details: ex.message || String(ex),
          });
        }
      }

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=Examen_${id}.docx`,
      });
      return res.send(finalBuffer);
    } catch (e) {
      console.error("Error generando docx:", e);
      return res.status(500).json({
        error: "Error al generar el archivo .docx",
        details: e.message || e.toString(),
      });
    }
  });
};
