const db = require("../config/db");

/* VALIDACIONES GENERALES */
const validarInsumo = ({
  nombre_insumo,
  stock,
  stock_minimo,
  fecha_vencimiento,
}) => {
  const errores = [];

  if (!nombre_insumo || nombre_insumo.trim() === "") {
    errores.push("El nombre del insumo es obligatorio.");
  }
  if (stock == null || isNaN(stock) || stock <= 0) {
    errores.push("El stock debe ser un número mayor a 0.");
  }
  if (stock_minimo == null || isNaN(stock_minimo) || stock_minimo <= 0) {
    errores.push("El stock mínimo debe ser un número mayor a 0.");
  }
  if (fecha_vencimiento && isNaN(Date.parse(fecha_vencimiento))) {
    errores.push("La fecha de vencimiento no es válida.");
  }

  return errores;
};

const validarMovimiento = ({ id_insumo, tipo_movimiento, cantidad }) => {
  const errores = [];

  if (!id_insumo || isNaN(id_insumo)) {
    errores.push("El ID del insumo es obligatorio y debe ser un número.");
  }
  if (!tipo_movimiento || !["E", "S"].includes(tipo_movimiento)) {
    errores.push(
      "El tipo de movimiento debe ser 'E' (Entrada) o 'S' (Salida)."
    );
  }
  if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
    errores.push("La cantidad debe ser un número mayor que 0.");
  }

  return errores;
};

/*CRUD DE INSUMOS*/

// Crear un nuevo insumo
exports.addInsumo = (req, res) => {
  //console.log("📥 Datos recibidos para nuevo insumo:", req.body);
  const {
    nombre_insumo,
    descripcion,
    stock,
    stock_minimo,
    unidad_medida,
    fecha_vencimiento,
  } = req.body;
  const estado = "1"; // Activo por defecto
  const errores = validarInsumo({
    nombre_insumo,
    stock,
    stock_minimo,
    fecha_vencimiento,
  });
  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  db.beginTransaction((err) => {
    if (err)
      return res.status(500).json({ error: "Error al iniciar transacción" });

    const query = `
            INSERT INTO insumo 
            (nombre_insumo, descripcion, stock, stock_minimo, unidad_medida, fecha_vencimiento, estado, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    db.query(
      query,
      [
        nombre_insumo,
        descripcion,
        stock,
        stock_minimo,
        unidad_medida,
        fecha_vencimiento,
        estado,
      ],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error("❌ Error al agregar insumo:", err);
            res.status(500).json({ error: "Error al agregar insumo" });
          });
        }

        const id_insumo = result.insertId;

        // Si el stock inicial es mayor a 0, registrar movimiento de entrada
        if (stock > 0) {
          const movimientoQuery = `
                        INSERT INTO movimiento_insumo 
                        (id_insumo, tipo_movimiento, cantidad, observacion, estado, created_at, updated_at)
                        VALUES (?, 'E', ?, 'Ingreso inicial', '1', NOW(), NOW())`;

          db.query(movimientoQuery, [id_insumo, stock], (err2) => {
            if (err2) {
              return db.rollback(() => {
                console.error(
                  "❌ Error al registrar movimiento inicial:",
                  err2
                );
                res
                  .status(500)
                  .json({ error: "Error al registrar movimiento inicial" });
              });
            }

            db.commit((err3) => {
              if (err3) {
                return db.rollback(() => {
                  res
                    .status(500)
                    .json({ error: "Error al confirmar transacción" });
                });
              }
              res.status(201).json({
                message:
                  "✅ Insumo y movimiento inicial agregados exitosamente",
                id: id_insumo,
              });
            });
          });
        } else {
          db.commit((err4) => {
            if (err4) {
              return db.rollback(() => {
                res
                  .status(500)
                  .json({ error: "Error al confirmar transacción" });
              });
            }
            res.status(201).json({ message: "El stock debe ser mayor a 0" });
          });
        }
      }
    );
  });
};

// Listar insumos
exports.getInsumos = (req, res) => {
  const query = `SELECT * FROM insumo WHERE estado = '1' ORDER BY created_at DESC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener insumos:", err);
      return res.status(500).json({ error: "Error al obtener insumos" });
    }
    res.status(200).json(results);
  });
};

// Listar insumos (Incluso los inactivos)
exports.getAllInsumos = (req, res) => {
  const query = `SELECT * FROM insumo ORDER BY created_at DESC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener insumos:", err);
      return res.status(500).json({ error: "Error al obtener insumos" });
    }
    res.status(200).json(results);
  });
};

// Obtener insumo por ID
exports.getInsumoById = (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM insumo WHERE id_insumo = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener insumo:", err);
      return res.status(500).json({ error: "Error al obtener insumo" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Insumo no encontrado" });
    }
    res.status(200).json(results[0]);
  });
};

// Actualizar insumo
exports.updateInsumo = (req, res) => {
  const { id } = req.params;
  const id_insumo = id;
  const {
    nombre_insumo,
    descripcion,
    stock_minimo,
    unidad_medida,
    fecha_vencimiento,
  } = req.body;

  // Validar solo los campos editables (sin stock)
  const errores = [];
  if (!nombre_insumo || nombre_insumo.trim() === "") {
    errores.push("El nombre del insumo es obligatorio.");
  }
  if (stock_minimo == null || isNaN(stock_minimo) || stock_minimo <= 0) {
    errores.push("El stock mínimo debe ser un número mayor a 0.");
  }
  if (fecha_vencimiento && isNaN(Date.parse(fecha_vencimiento))) {
    errores.push("La fecha de vencimiento no es válida.");
  }
  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  const query = `
        UPDATE insumo 
        SET nombre_insumo = ?, descripcion = ?, stock_minimo = ?, 
            unidad_medida = ?, fecha_vencimiento = ?, updated_at = NOW()
        WHERE id_insumo = ?`;

  db.query(
    query,
    [
      nombre_insumo,
      descripcion,
      stock_minimo,
      unidad_medida,
      fecha_vencimiento,
      id_insumo,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Error al actualizar insumo:", err);
        return res.status(500).json({ error: "Error al actualizar insumo" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Insumo no encontrado" });
      }
      res.status(200).json({ message: "✅ Insumo actualizado correctamente" });
    }
  );
};

// Eliminar insumo (soft delete)
exports.deleteInsumo = (req, res) => {
  const { id } = req.params;
  const id_insumo = id;
  const query = `UPDATE insumo SET estado = '0', updated_at = NOW() WHERE id_insumo = ?`;

  db.query(query, [id_insumo], (err, result) => {
    if (err) {
      console.error("Error al eliminar insumo:", err);
      return res.status(500).json({ error: "Error al eliminar insumo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Insumo no encontrado" });
    }
    res.status(200).json({ message: "Insumo eliminado correctamente" });
  });
};

/* ===========================================================
   MOVIMIENTOS DE INSUMOS
=========================================================== */

// Registrar movimiento y actualizar stock
exports.addMovimiento = (req, res) => {
  const { id_insumo, tipo_movimiento, cantidad, observacion } = req.body;

  const errores = validarMovimiento({ id_insumo, tipo_movimiento, cantidad });
  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  db.beginTransaction((err) => {
    if (err)
      return res.status(500).json({ error: "Error al iniciar transacción" });

    // Validar stock antes de salida
    if (tipo_movimiento === "S") {
      db.query(
        "SELECT stock FROM insumo WHERE id_insumo = ?",
        [id_insumo],
        (err, results) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: "Error al consultar stock" });
            });
          }
          if (results.length === 0) {
            return db.rollback(() => {
              res.status(404).json({ error: "Insumo no encontrado" });
            });
          }
          if (results[0].stock < cantidad) {
            return db.rollback(() => {
              res
                .status(400)
                .json({ error: "Stock insuficiente para la salida" });
            });
          }
          registrarMovimiento();
        }
      );
    } else {
      registrarMovimiento();
    }

    // Función para registrar el movimiento y actualizar el stock
    function registrarMovimiento() {
      const insertMovimiento = `
                INSERT INTO movimiento_insumo 
                (id_insumo, tipo_movimiento, cantidad, observacion, estado, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1, NOW(), NOW())`;

      db.query(
        insertMovimiento,
        [id_insumo, tipo_movimiento, cantidad, observacion],
        (err, result) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: "Error al registrar movimiento" });
            });
          }

          const updateStock =
            tipo_movimiento === "E"
              ? `UPDATE insumo SET stock = stock + ?, updated_at = NOW() WHERE id_insumo = ?`
              : `UPDATE insumo SET stock = stock - ?, updated_at = NOW() WHERE id_insumo = ?`;

          db.query(updateStock, [cantidad, id_insumo], (err, result2) => {
            if (err || result2.affectedRows === 0) {
              return db.rollback(() => {
                res.status(400).json({ error: "Error al actualizar stock" });
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res
                    .status(500)
                    .json({ error: "Error al confirmar transacción" });
                });
              }

              res.status(201).json({
                message: "✅ Movimiento registrado y stock actualizado",
                //id_movimiento_insumo: result.insertId
              });
            });
          });
        }
      );
    }
  });
};

// Listar movimientos
exports.getMovimientos = (req, res) => {
  const query = `
        SELECT m.*, i.nombre_insumo 
        FROM movimiento_insumo m
        JOIN insumo i ON m.id_insumo = i.id_insumo
        WHERE m.estado = '1'
        ORDER BY m.created_at DESC`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener movimientos:", err);
      return res.status(500).json({ error: "Error al obtener movimientos" });
    }
    res.status(200).json(results);
  });
};

// Listar movimientos
exports.getMovimientosByInsumo = (req, res) => {
  const { id_insumo } = req.params;

  const query = `
        SELECT m.*, i.nombre_insumo 
        FROM movimiento_insumo m
        JOIN insumo i ON m.id_insumo = i.id_insumo
        WHERE i.id_insumo = ? AND m.estado = '1'
        ORDER BY m.created_at DESC`;

  db.query(query, [id_insumo], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener movimientos del insumo:", err);
      return res.status(500).json({ error: "Error al obtener movimientos" });
    }
    res.status(200).json(results);
  });
};
