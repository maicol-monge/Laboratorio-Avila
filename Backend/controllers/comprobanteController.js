const db = require("../config/db");
const PDFDocument = require("pdfkit");

// Mapear método legible a código de un caracter en BD
const metodoToCode = (m) => {
  const map = { tarjeta: "T", transferencia: "B", efectivo: "E" };
  return map[String(m || "").toLowerCase()] || null;
};

// Crear comprobante PENDIENTE a partir de exámenes realizados
// body: { id_paciente: number, examenes_realizados: number[] }
exports.createComprobante = (req, res) => {
  const { id_paciente, examenes_realizados } = req.body || {};
  if (!id_paciente || !Array.isArray(examenes_realizados) || examenes_realizados.length === 0) {
    return res.status(400).json({ error: "Parámetros inválidos" });
  }

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ error: "No se pudo iniciar la transacción" });

    const insertHeader = `INSERT INTO comprobante (id_paciente, fecha_emision, total, tipo_pago, estado, created_at, updated_at)
                          VALUES (?, NOW(), 0, NULL, '0', NOW(), NOW())`;
    db.query(insertHeader, [id_paciente], (err, result) => {
      if (err) {
        db.rollback(() => {});
        return res.status(500).json({ error: "Error al crear comprobante" });
      }
      const id_comprobante = result.insertId;

      let total = 0;
      const insertDetail = `INSERT INTO detalle_comprobante (id_comprobante, id_examen_realizado, concepto_pago, total, estado, created_at, updated_at)
                            VALUES (?, ?, ?, ?, '1', NOW(), NOW())`;

      const processOne = (idx) => {
        if (idx >= examenes_realizados.length) {
          // actualizar total
          db.query(
            `UPDATE comprobante SET total = ?, updated_at = NOW() WHERE id_comprobante = ?`,
            [total, id_comprobante],
            (uErr) => {
              if (uErr) {
                db.rollback(() => {});
                return res.status(500).json({ error: "Error al actualizar total" });
              }
              db.commit((cErr) => {
                if (cErr) {
                  db.rollback(() => {});
                  return res.status(500).json({ error: "Error al confirmar comprobante" });
                }
                return res.json({ id_comprobante, total });
              });
            }
          );
          return;
        }

        const id_er = Number(examenes_realizados[idx]);
        const q = `SELECT er.id_examen_realizado, er.id_paciente, e.titulo_examen, e.precio
                   FROM examen_realizado er
                   JOIN examen e ON er.id_examen = e.id_examen
                   WHERE er.id_examen_realizado = ? AND er.estado = '1'`;
        db.query(q, [id_er], (qErr, rows) => {
          if (qErr) {
            db.rollback(() => {});
            return res.status(500).json({ error: "Error consultando examen" });
          }
          const row = rows && rows[0];
          if (!row) {
            db.rollback(() => {});
            return res.status(400).json({ error: `Examen realizado ${id_er} no válido` });
          }
          if (Number(row.id_paciente) !== Number(id_paciente)) {
            db.rollback(() => {});
            return res.status(400).json({ error: `Examen ${id_er} no pertenece al paciente` });
          }

          const concepto = row.titulo_examen || `Examen ${id_er}`;
          const precio = Number(row.precio || 0);
          db.query(insertDetail, [id_comprobante, id_er, concepto, precio], (iErr) => {
            if (iErr) {
              db.rollback(() => {});
              return res.status(500).json({ error: "Error al crear detalle" });
            }
            total += precio;
            processOne(idx + 1);
          });
        });
      };

      processOne(0);
    });
  });
};

// Listar comprobantes (opcional ?estado=0|1)
exports.getComprobantes = (req, res) => {
  const { estado } = req.query || {};
  const where = estado === '0' || estado === '1' ? `WHERE c.estado = '${estado}'` : '';
  const sql = `SELECT c.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
               FROM comprobante c
               LEFT JOIN paciente p ON c.id_paciente = p.id_paciente
               ${where}
               ORDER BY c.created_at DESC`;
  db.query(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener comprobantes" });
    res.json(rows || []);
  });
};

// Obtener un comprobante con detalles
exports.getComprobanteById = (req, res) => {
  const { id } = req.params;
  const headSql = `SELECT c.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
                   FROM comprobante c
                   LEFT JOIN paciente p ON c.id_paciente = p.id_paciente
                   WHERE c.id_comprobante = ?`;
  const detSql = `SELECT d.*, er.id_examen, e.titulo_examen, e.precio
                  FROM detalle_comprobante d
                  LEFT JOIN examen_realizado er ON d.id_examen_realizado = er.id_examen_realizado
                  LEFT JOIN examen e ON er.id_examen = e.id_examen
                  WHERE d.id_comprobante = ? AND d.estado = '1'`;
  db.query(headSql, [id], (e1, hRows) => {
    if (e1) return res.status(500).json({ error: "Error al obtener comprobante" });
    const head = hRows && hRows[0];
    if (!head) return res.status(404).json({ error: "Comprobante no encontrado" });
    db.query(detSql, [id], (e2, dRows) => {
      if (e2) return res.status(500).json({ error: "Error al obtener detalles" });
      res.json({ ...head, detalles: dRows || [] });
    });
  });
};

// Pagar comprobante: body { metodoPago: 'tarjeta'|'transferencia'|'efectivo' }
exports.pagarComprobante = (req, res) => {
  const { id } = req.params;
  const { metodoPago } = req.body || {};
  const code = metodoToCode(metodoPago);
  if (!code) return res.status(400).json({ error: "Método de pago inválido" });

  const sql = `UPDATE comprobante SET tipo_pago = ?, estado = '1', updated_at = NOW() WHERE id_comprobante = ?`;
  db.query(sql, [code, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Error al procesar pago" });
    if (!result || result.affectedRows === 0) return res.status(404).json({ error: "Comprobante no encontrado" });
    res.json({ message: "Pago procesado", id_comprobante: Number(id) });
  });
};

// Exportar comprobante a PDF desde cero
exports.exportComprobantePdf = (req, res) => {
  const { id } = req.params;
  const headSql = `SELECT c.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
                   FROM comprobante c
                   LEFT JOIN paciente p ON c.id_paciente = p.id_paciente
                   WHERE c.id_comprobante = ?`;
  const detSql = `SELECT d.*, er.id_examen, e.titulo_examen
                  FROM detalle_comprobante d
                  LEFT JOIN examen_realizado er ON d.id_examen_realizado = er.id_examen_realizado
                  LEFT JOIN examen e ON er.id_examen = e.id_examen
                  WHERE d.id_comprobante = ? AND d.estado = '1'`;

  const toDMY = (val) => {
    try {
      const d = new Date(String(val).replace(' ', 'T'));
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch { return String(val||''); }
  };
  const safe = (s) => String(s||"").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();

  db.query(headSql, [id], (e1, hRows) => {
    if (e1) return res.status(500).json({ error: "Error al obtener comprobante" });
    const head = hRows && hRows[0];
    if (!head) return res.status(404).json({ error: "Comprobante no encontrado" });
    db.query(detSql, [id], (e2, dRows) => {
      if (e2) return res.status(500).json({ error: "Error al obtener detalles" });
      const detalles = dRows || [];

      // Preparar nombre de archivo
      const fecha = toDMY(head.fecha_emision);
      const fileNameUtf8 = `${safe(head.paciente_nombre)} ${safe(head.paciente_apellido)} - Comprobante - ${fecha}.pdf`;
      const fileNameFallback = fileNameUtf8;

      // Construir PDF en memoria
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        const pdfBuf = Buffer.concat(chunks);
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileNameFallback}"; filename*=UTF-8''${encodeURIComponent(fileNameUtf8)}`,
          'Access-Control-Expose-Headers': 'Content-Disposition, X-Filename',
          'X-Filename': fileNameUtf8,
        });
        res.send(pdfBuf);
      });

      // Branding / encabezado
      const accent = '#00C2CC';
      doc.fillColor(accent).fontSize(22).text('Comprobante de Pago', { align: 'left' });
      doc.moveDown(0.5);
      doc.fillColor('#666666').fontSize(10).text(`Fecha: ${fecha}`);
      doc.moveDown(0.5);
      doc.fillColor('#000000').fontSize(12).text(`Paciente: ${head.paciente_nombre || ''} ${head.paciente_apellido || ''}`);
      doc.text(`No. Comprobante: ${head.id_comprobante}`);
      doc.text(`Estado: ${head.estado === '1' ? 'Pagado' : 'Pendiente'}`);
      if (head.estado === '1') {
        const metodo = head.tipo_pago === 'E' ? 'Efectivo' : head.tipo_pago === 'T' ? 'Tarjeta' : head.tipo_pago === 'B' ? 'Transferencia' : '';
        doc.text(`Método de pago: ${metodo}`);
      }
      doc.moveDown(1);

      // Tabla simple de conceptos
      const startY = doc.y;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const col1 = doc.page.margins.left; // concepto
      const col2 = doc.page.margins.left + pageWidth * 0.75; // total

      doc.fontSize(11).fillColor('#000').text('Concepto', col1, startY, { width: pageWidth * 0.75 });
      doc.text('Total', col2, startY, { width: pageWidth * 0.25, align: 'right' });
      doc.moveDown(0.5);
      doc.strokeColor('#dddddd').moveTo(col1, doc.y).lineTo(col1 + pageWidth, doc.y).stroke();
      doc.moveDown(0.5);

      let total = 0;
      detalles.forEach((d) => {
        const concepto = d.concepto_pago || d.titulo_examen || '';
        const monto = Number(d.total || 0);
        total += monto;
        const y = doc.y;
        doc.fontSize(10).fillColor('#333').text(concepto, col1, y, { width: pageWidth * 0.75 });
        doc.text(`$ ${monto.toFixed(2)}`, col2, y, { width: pageWidth * 0.25, align: 'right' });
        doc.moveDown(0.2);
      });

      // Total
      doc.moveDown(0.5);
      doc.strokeColor('#dddddd').moveTo(col1, doc.y).lineTo(col1 + pageWidth, doc.y).stroke();
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor('#000')
        .text('Total', col1 + pageWidth * 0.5, doc.y, { width: pageWidth * 0.25, align: 'right' })
        .text(`$ ${Number(head.total || total).toFixed(2)}`, col2, doc.y, { width: pageWidth * 0.25, align: 'right' });

      doc.moveDown(1);
      doc.fillColor('#888').fontSize(9).text('Gracias por su preferencia.', { align: 'left' });

      doc.end();
    });
  });
};
