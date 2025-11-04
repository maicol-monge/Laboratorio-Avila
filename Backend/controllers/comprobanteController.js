const db = require("../config/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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

// Exportar comprobante a PDF (diseño tipo factura con logo)
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
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
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

      // Encabezado con logo y datos del laboratorio
      const accent = '#00C2CC';
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftX = doc.page.margins.left;
      const rightX = leftX + pageWidth;

      // Intentar cargar el logo del frontend
      let logoPath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'assets', 'Lab Avila Logo.png');
      let hasLogo = false;
      try { hasLogo = fs.existsSync(logoPath); } catch (_) { hasLogo = false; }

      const headerHeight = 70;
      doc.roundedRect(leftX, doc.y, pageWidth, headerHeight, 6).fillOpacity(0.06).fill(accent).fillOpacity(1).strokeColor('#e7f6f7').stroke();
      doc.save();
      if (hasLogo) {
        try { doc.image(logoPath, leftX + 10, doc.y + 10, { height: 50 }); } catch (_) {}
      }
      doc.fillColor('#111').fontSize(18).text('Laboratorio Ávila', hasLogo ? leftX + 80 : leftX + 12, doc.y + 18);
      doc.fillColor('#666').fontSize(10).text('Servicios de Análisis Clínicos', hasLogo ? leftX + 80 : leftX + 12, doc.y + 40);
      doc.restore();

      // Bloque de datos del comprobante/cliente
      doc.moveDown(2);
      const blockY = doc.y;
      doc.roundedRect(leftX, blockY, pageWidth, 70, 6).strokeColor('#eef0f2').stroke();
      doc.fontSize(11).fillColor('#000').text(`Paciente: ${head.paciente_nombre || ''} ${head.paciente_apellido || ''}`, leftX + 10, blockY + 10);
      doc.fillColor('#555').fontSize(10).text(`Fecha: ${fecha}`, leftX + 10, blockY + 30);
      doc.text(`Comprobante: #${head.id_comprobante}`, leftX + 10, blockY + 46);
      const estadoStr = head.estado === '1' ? 'Pagado' : 'Pendiente';
      doc.fillColor(head.estado === '1' ? '#0a8754' : '#b86b00').fontSize(12).text(estadoStr, rightX - 120, blockY + 12, { width: 110, align: 'right' });
      if (head.estado === '1') {
        const metodo = head.tipo_pago === 'E' ? 'Efectivo' : head.tipo_pago === 'T' ? 'Tarjeta' : head.tipo_pago === 'B' ? 'Transferencia' : '';
        doc.fillColor('#333').fontSize(10).text(`Método: ${metodo}`, rightX - 120, blockY + 36, { width: 110, align: 'right' });
      }
      doc.moveDown(6);

      // Tabla de conceptos con encabezado sombreado
      const tableY = doc.y + 4;
      const colConceptoW = Math.floor(pageWidth * 0.7);
      const colTotalW = pageWidth - colConceptoW;

      // Header de la tabla
      doc.rect(leftX, tableY, pageWidth, 24).fill('#f6f8fa');
      doc.fillColor('#111').fontSize(11).text('Concepto', leftX + 8, tableY + 6, { width: colConceptoW - 12 });
      doc.text('Total', leftX + colConceptoW + 8, tableY + 6, { width: colTotalW - 12, align: 'right' });
      doc.moveTo(leftX, tableY + 24).lineTo(rightX, tableY + 24).strokeColor('#e5e7eb').stroke();

      let total = 0;
      let y = tableY + 28;
      detalles.forEach((d) => {
        const concepto = d.concepto_pago || d.titulo_examen || '';
        const monto = Number(d.total || 0);
        total += monto;
        doc.fillColor('#333').fontSize(10).text(concepto, leftX + 8, y, { width: colConceptoW - 12 });
        doc.text(`$ ${monto.toFixed(2)}`, leftX + colConceptoW + 8, y, { width: colTotalW - 12, align: 'right' });
        y += 20;
        doc.moveTo(leftX, y - 4).lineTo(rightX, y - 4).strokeColor('#f0f2f4').stroke();
      });

      // Total
      y += 4;
      doc.rect(leftX, y, pageWidth, 28).fill('#f9fafb');
      doc.fillColor('#111').fontSize(11).text('Total', leftX + colConceptoW + 8 - 120, y + 8, { width: 90, align: 'right' });
      doc.text(`$ ${Number(head.total || total).toFixed(2)}`, leftX + colConceptoW + 8, y + 8, { width: colTotalW - 12, align: 'right' });

      // Pie de página
      doc.moveDown(3);
      doc.fillColor('#888').fontSize(9).text('Gracias por su preferencia.', { align: 'left' });
      doc.fillColor('#bbb').fontSize(8).text('Este comprobante no constituye documento fiscal.', { align: 'left' });

      doc.end();
    });
  });
};

// Estadísticas de comprobantes (ignoran filtro de estado): totales de caja, pagado y pendiente
// Query params:
// - from: YYYY-MM-DD (opcional)
// - to: YYYY-MM-DD (opcional)
// - paciente: string (opcional, busca en nombre+apellido)
// - examen: string (opcional, coincide por concepto_pago o título de examen)
exports.getComprobanteStats = (req, res) => {
  try {
    const { from, to, paciente, examen } = req.query || {};
    const params = [];
    let where = " WHERE 1=1 ";

    if (from) { where += " AND DATE(c.fecha_emision) >= ? "; params.push(from); }
    if (to) { where += " AND DATE(c.fecha_emision) <= ? "; params.push(to); }
    if (paciente && String(paciente).trim()) {
      where += " AND CONCAT(IFNULL(p.nombre,''), ' ', IFNULL(p.apellido,'')) LIKE ? ";
      params.push(`%${String(paciente).trim()}%`);
    }
    if (examen && String(examen).trim()) {
      where += ` AND EXISTS (
        SELECT 1 FROM detalle_comprobante d
        LEFT JOIN examen_realizado er ON d.id_examen_realizado = er.id_examen_realizado
        LEFT JOIN examen e ON er.id_examen = e.id_examen
        WHERE d.id_comprobante = c.id_comprobante AND d.estado = '1'
          AND (d.concepto_pago = ? OR e.titulo_examen = ?)
      )`;
      const ex = String(examen).trim();
      params.push(ex, ex);
    }

    const sql = `
      SELECT
        COALESCE(SUM(c.total), 0) AS totalCaja,
        COALESCE(SUM(CASE WHEN c.estado = '1' THEN c.total ELSE 0 END), 0) AS totalPagado,
        COALESCE(SUM(CASE WHEN c.estado = '0' THEN c.total ELSE 0 END), 0) AS totalPendiente
      FROM comprobante c
      LEFT JOIN paciente p ON c.id_paciente = p.id_paciente
      ${where}
    `;
    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al calcular estadísticas" });
      const r = (rows && rows[0]) || {};
      res.json({
        totalCaja: Number(r.totalCaja || 0),
        totalPagado: Number(r.totalPagado || 0),
        totalPendiente: Number(r.totalPendiente || 0),
      });
    });
  } catch (_) {
    return res.status(500).json({ error: "Error inesperado en estadísticas" });
  }
};
