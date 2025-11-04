const db = require("../config/db");

// Helper to build WHERE between dates using DATE(column)
const whereBetween = (col, from, to, params) => {
  let where = " WHERE 1=1 ";
  if (from) { where += ` AND DATE(${col}) >= ? `; params.push(from); }
  if (to) { where += ` AND DATE(${col}) <= ? `; params.push(to); }
  return where;
};

exports.getCitasStats = (req, res) => {
  try {
    const { from, to } = req.query || {};
    const params = [];
    const where = whereBetween('c.fecha_cita', from, to, params);

    const sqlTotal = `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN c.estado <> '0' THEN 1 ELSE 0 END) AS activas,
        SUM(CASE WHEN c.estado = '0' THEN 1 ELSE 0 END) AS canceladas
      FROM cita c ${where}`;

    const sqlPorDia = `SELECT DATE(c.fecha_cita) AS dia, COUNT(*) AS cnt
      FROM cita c ${where}
      GROUP BY DATE(c.fecha_cita)
      ORDER BY DATE(c.fecha_cita)`;

    db.query(sqlTotal, params, (e1, rows1) => {
      if (e1) return res.status(500).json({ error: 'Error al contar citas' });
      db.query(sqlPorDia, params, (e2, rows2) => {
        if (e2) return res.status(500).json({ error: 'Error en series por día' });
        const r = rows1 && rows1[0] ? rows1[0] : {};
        res.json({
          total: Number(r.total || 0),
          activas: Number(r.activas || 0),
          canceladas: Number(r.canceladas || 0),
          porDia: (rows2 || []).map(x => ({ dia: x.dia, cnt: Number(x.cnt || 0) })),
        });
      });
    });
  } catch (_) {
    return res.status(500).json({ error: 'Error inesperado en estadísticas de citas' });
  }
};

exports.getExamenesStats = (req, res) => {
  try {
    const { from, to } = req.query || {};
    const params = [];
    const where = whereBetween('er.created_at', from, to, params);
    const whereActivos = where + " AND er.estado = '1' ";

    const sqlTotal = `SELECT COUNT(*) AS total FROM examen_realizado er ${whereActivos}`;
    const sqlPorDia = `SELECT DATE(er.created_at) AS dia, COUNT(*) AS cnt
      FROM examen_realizado er ${whereActivos}
      GROUP BY DATE(er.created_at)
      ORDER BY DATE(er.created_at)`;
    const sqlPorTipo = `SELECT e.titulo_examen AS tipo, COUNT(*) AS cnt
      FROM examen_realizado er
      JOIN examen e ON er.id_examen = e.id_examen
      ${whereActivos}
      GROUP BY e.titulo_examen
      ORDER BY cnt DESC`;

    db.query(sqlTotal, params, (e1, r1) => {
      if (e1) return res.status(500).json({ error: 'Error al contar exámenes' });
      db.query(sqlPorDia, params, (e2, r2) => {
        if (e2) return res.status(500).json({ error: 'Error en series por día' });
        db.query(sqlPorTipo, params, (e3, r3) => {
          if (e3) return res.status(500).json({ error: 'Error en desglose por tipo' });
          res.json({
            total: Number((r1 && r1[0] && r1[0].total) || 0),
            porDia: (r2 || []).map(x => ({ dia: x.dia, cnt: Number(x.cnt || 0) })),
            porTipo: (r3 || []).map(x => ({ tipo: x.tipo || 'N/D', cnt: Number(x.cnt || 0) })),
          });
        });
      });
    });
  } catch (_) {
    return res.status(500).json({ error: 'Error inesperado en estadísticas de exámenes' });
  }
};

exports.getInventarioStats = (req, res) => {
  try {
    const { from, to } = req.query || {};
    const params = [];
    const whereMov = whereBetween('m.created_at', from, to, params);

    const sqlEntradas = `SELECT DATE(m.created_at) AS dia, SUM(m.cantidad) AS total
      FROM movimiento_insumo m ${whereMov} AND m.estado = '1' AND m.tipo_movimiento = 'E'
      GROUP BY DATE(m.created_at)
      ORDER BY DATE(m.created_at)`;
    const sqlSalidas = `SELECT DATE(m.created_at) AS dia, SUM(m.cantidad) AS total
      FROM movimiento_insumo m ${whereMov} AND m.estado = '1' AND m.tipo_movimiento = 'S'
      GROUP BY DATE(m.created_at)
      ORDER BY DATE(m.created_at)`;
    const sqlTopConsumo = `SELECT i.nombre_insumo AS insumo, SUM(m.cantidad) AS total
      FROM movimiento_insumo m JOIN insumo i ON m.id_insumo = i.id_insumo
      ${whereMov} AND m.estado = '1' AND m.tipo_movimiento = 'S'
      GROUP BY m.id_insumo, i.nombre_insumo
      ORDER BY total DESC
      LIMIT 10`;
    const sqlStockBajo = `SELECT COUNT(*) AS low FROM insumo i WHERE i.estado = '1' AND i.stock <= i.stock_minimo`;

    // proximos a vencer por rango (si from/to presentes sobre fecha_vencimiento)
    const paramsV = [];
    let whereV = ' WHERE i.estado = \"1\" ';
    if (from) { whereV += ' AND DATE(i.fecha_vencimiento) >= ? '; paramsV.push(from); }
    if (to) { whereV += ' AND DATE(i.fecha_vencimiento) <= ? '; paramsV.push(to); }
    const sqlVenc = `SELECT COUNT(*) AS exp FROM insumo i ${whereV}`;

    db.query(sqlEntradas, params, (e1, r1) => {
      if (e1) return res.status(500).json({ error: 'Error en entradas' });
      db.query(sqlSalidas, params, (e2, r2) => {
        if (e2) return res.status(500).json({ error: 'Error en salidas' });
        db.query(sqlTopConsumo, params, (e3, r3) => {
          if (e3) return res.status(500).json({ error: 'Error en top consumo' });
          db.query(sqlStockBajo, [], (e4, r4) => {
            if (e4) return res.status(500).json({ error: 'Error en stock bajo' });
            db.query(sqlVenc, paramsV, (e5, r5) => {
              if (e5) return res.status(500).json({ error: 'Error en vencimientos' });
              res.json({
                entradasPorDia: (r1 || []).map(x => ({ dia: x.dia, total: Number(x.total || 0) })),
                salidasPorDia: (r2 || []).map(x => ({ dia: x.dia, total: Number(x.total || 0) })),
                topConsumo: (r3 || []).map(x => ({ insumo: x.insumo || 'N/D', total: Number(x.total || 0) })),
                stockBajo: Number((r4 && r4[0] && r4[0].low) || 0),
                proximosAVencer: Number((r5 && r5[0] && r5[0].exp) || 0),
              });
            });
          });
        });
      });
    });
  } catch (_) {
    return res.status(500).json({ error: 'Error inesperado en estadísticas de inventario' });
  }
};

exports.getIngresosStats = (req, res) => {
  try {
    const { from, to } = req.query || {};
    const params = [];
    const where = whereBetween('c.fecha_emision', from, to, params);

    const sqlTotales = `SELECT
        COALESCE(SUM(c.total), 0) AS totalCaja,
        COALESCE(SUM(CASE WHEN c.estado = '1' THEN c.total ELSE 0 END), 0) AS totalPagado,
        COALESCE(SUM(CASE WHEN c.estado = '0' THEN c.total ELSE 0 END), 0) AS totalPendiente
      FROM comprobante c ${where}`;

    const sqlPorDia = `SELECT DATE(c.fecha_emision) AS dia, SUM(c.total) AS total
      FROM comprobante c ${where}
      GROUP BY DATE(c.fecha_emision)
      ORDER BY DATE(c.fecha_emision)`;

    const sqlPorMetodo = `SELECT c.tipo_pago, SUM(c.total) AS total
      FROM comprobante c ${where} AND c.estado = '1' AND c.tipo_pago IS NOT NULL
      GROUP BY c.tipo_pago`;

    db.query(sqlTotales, params, (e1, r1) => {
      if (e1) return res.status(500).json({ error: 'Error en totales de ingresos' });
      db.query(sqlPorDia, params, (e2, r2) => {
        if (e2) return res.status(500).json({ error: 'Error en series por día' });
        db.query(sqlPorMetodo, params, (e3, r3) => {
          if (e3) return res.status(500).json({ error: 'Error en desglose por método' });
          const t = (r1 && r1[0]) || {};
          res.json({
            totalCaja: Number(t.totalCaja || 0),
            totalPagado: Number(t.totalPagado || 0),
            totalPendiente: Number(t.totalPendiente || 0),
            porDia: (r2 || []).map(x => ({ dia: x.dia, total: Number(x.total || 0) })),
            porMetodo: (r3 || []).map(x => ({ metodo: x.tipo_pago || 'N/D', total: Number(x.total || 0) })),
          });
        });
      });
    });
  } catch (_) {
    return res.status(500).json({ error: 'Error inesperado en estadísticas de ingresos' });
  }
};
