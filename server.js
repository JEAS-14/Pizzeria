const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'LA_ESQUINA_', 'public')));

// Configuración de la conexión a MySQL
// Cambia estas credenciales según la configuración de tu XAMPP / MySQL local
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Contraseña por defecto vacía en XAMPP
    database: 'pizzeria_la_esquina',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar conexión a la Base de Datos
db.getConnection((err, connection) => {
    if (err) {
        console.error('ERROR al conectar a MySQL:', err.message);
        console.log('Asegúrate de que MySQL esté ejecutándose y de haber importado "database.sql".');
    } else {
        console.log('Conexión exitosa a la base de datos MySQL (pizzeria_la_esquina).');
        connection.release();
    }
});

// ==========================================
// RUTA POR DEFECTO (Redirigir a index.html)
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'LA_ESQUINA_', 'public', 'index.html'));
});

// ==========================================
// ENDPOINTS DE AUTENTICACIÓN
// ==========================================

// Registro de Usuario
app.post('/api/auth/register', (req, res) => {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos requeridos.' });
    }

    const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "cliente")';
    db.query(sql, [nombre, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
            }
            console.error(err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    });
});

// Login de Usuario
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, ingresa tu correo y contraseña.' });
    }

    const sql = 'SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const user = results[0];
        res.json({ message: 'Ingreso exitoso', user });
    });
});

// ==========================================
// ENDPOINTS DE PRODUCTOS
// ==========================================

// Obtener todos los productos (Carta)
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM productos';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al obtener productos.' });
        }
        res.json(results);
    });
});

// ==========================================
// ENDPOINTS DE PEDIDOS (CLIENTE)
// ==========================================

// Registrar un nuevo pedido
app.post('/api/orders', (req, res) => {
    const { usuario_id, total, items } = req.body;

    if (!usuario_id || !total || !items || items.length === 0) {
        return res.status(400).json({ message: 'El pedido está incompleto.' });
    }

    // Usar transacción para asegurar que el pedido y sus detalles se guarden correctamente
    db.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error de conexión.' });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({ message: 'Error al iniciar transacción.' });
            }

            // 1. Insertar Cabecera de Pedido
            const sqlPedido = 'INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, "pendiente")';
            connection.query(sqlPedido, [usuario_id, total], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error(err);
                        res.status(500).json({ message: 'Error al registrar pedido.' });
                    });
                }

                const pedidoId = result.insertId;

                // 2. Insertar Detalles de Pedido
                const sqlDetalle = 'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES ?';
                
                // Formatear items para inserción masiva: [[pedido_id, prod_id, cant, precio], ...]
                const values = items.map(item => [pedidoId, item.producto_id, item.cantidad, item.precio_unitario]);

                connection.query(sqlDetalle, [values], (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error(err);
                            res.status(500).json({ message: 'Error al registrar detalles del pedido.' });
                        });
                    }

                    // 3. Descontar Stock de los productos
                    const updateStockPromises = items.map(item => {
                        return new Promise((resolve, reject) => {
                            const sqlUpdate = 'UPDATE productos SET stock = GREATEST(0, stock - ?) WHERE id = ?';
                            connection.query(sqlUpdate, [item.cantidad, item.producto_id], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    });

                    Promise.all(updateStockPromises)
                        .then(() => {
                            connection.commit(err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error(err);
                                        res.status(500).json({ message: 'Error al completar transacción.' });
                                    });
                                }
                                connection.release();
                                res.status(201).json({ message: 'Pedido registrado con éxito.', pedido_id: pedidoId });
                            });
                        })
                        .catch(err => {
                            connection.rollback(() => {
                                connection.release();
                                console.error(err);
                                res.status(500).json({ message: 'Error al actualizar stock de los productos.' });
                            });
                        });
                });
            });
        });
    });
});

// ==========================================
// ENDPOINTS DE ADMINISTRACIÓN
// ==========================================

// Obtener estadísticas del resumen (Ventas del día y productos más vendidos)
app.get('/api/admin/stats', (req, res) => {
    // 1. Consulta para productos más vendidos (entregados)
    const sqlTopProducts = `
        SELECT prod.nombre, SUM(dp.cantidad) AS total_vendido
        FROM detalles_pedido dp
        JOIN productos prod ON dp.producto_id = prod.id
        JOIN pedidos p ON dp.pedido_id = p.id
        WHERE p.estado = 'entregado'
        GROUP BY prod.nombre
        ORDER BY total_vendido DESC
        LIMIT 5
    `;

    // 2. Consulta para transacciones del día de hoy (entregadas)
    const sqlSalesToday = `
        SELECT p.id, u.nombre AS cliente, p.total, DATE_FORMAT(p.fecha, '%H:%i') AS hora
        FROM pedidos p
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        WHERE DATE(p.fecha) = CURDATE() AND p.estado = 'entregado'
        ORDER BY p.fecha DESC
    `;

    db.query(sqlTopProducts, (err, topProducts) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al obtener productos más vendidos.' });
        }

        db.query(sqlSalesToday, (err, salesToday) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error al obtener ventas del día.' });
            }

            res.json({
                top_products: topProducts,
                sales_today: salesToday
            });
        });
    });
});

// Obtener lista completa de pedidos con detalles agrupados
app.get('/api/admin/orders', (req, res) => {
    const sql = `
        SELECT 
            p.id, 
            p.total, 
            p.estado, 
            p.fecha, 
            u.nombre AS cliente_nombre, 
            u.email AS cliente_email,
            GROUP_CONCAT(CONCAT(prod.nombre, ' (x', dp.cantidad, ')') SEPARATOR ', ') AS detalles
        FROM pedidos p
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN detalles_pedido dp ON p.id = dp.pedido_id
        LEFT JOIN productos prod ON dp.producto_id = prod.id
        GROUP BY p.id
        ORDER BY p.fecha DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al obtener pedidos para el admin.' });
        }
        res.json(results);
    });
});

// Actualizar estado de un pedido
app.put('/api/admin/orders/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ message: 'Estado requerido.' });
    }

    const sql = 'UPDATE pedidos SET estado = ? WHERE id = ?';
    db.query(sql, [estado, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al actualizar pedido.' });
        }
        res.json({ message: 'Pedido actualizado con éxito.' });
    });
});

// Obtener todos los usuarios
app.get('/api/admin/users', (req, res) => {
    const sql = 'SELECT id, nombre, email, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al obtener usuarios.' });
        }
        res.json(results);
    });
});

// Actualizar rol de un usuario
app.put('/api/admin/users/:id/role', (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol) {
        return res.status(400).json({ message: 'Rol requerido.' });
    }

    const sql = 'UPDATE usuarios SET rol = ? WHERE id = ?';
    db.query(sql, [rol, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al actualizar rol del usuario.' });
        }
        res.json({ message: 'Rol de usuario actualizado con éxito.' });
    });
});

// Crear un nuevo producto (pizza/bebida)
app.post('/api/admin/products', (req, res) => {
    const { nombre, descripcion, precio, imagen, categoria, stock } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ message: 'Nombre y precio son obligatorios.' });
    }

    const imgPath = imagen || 'img/img9.png'; // Imagen por defecto
    const prodStock = stock !== undefined ? parseInt(stock) : 10;
    const sql = 'INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, stock) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nombre, descripcion, precio, imgPath, categoria || 'Clasica', prodStock], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al crear producto.' });
        }
        res.status(201).json({ message: 'Producto creado con éxito.', producto_id: result.insertId });
    });
});

// Editar un producto existente
app.put('/api/admin/products/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, categoria, stock } = req.body;

    if (!nombre || !precio) {
        return res.status(400).json({ message: 'Nombre y precio son obligatorios.' });
    }

    const prodStock = stock !== undefined ? parseInt(stock) : 10;
    const sql = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen = ?, categoria = ?, stock = ? WHERE id = ?';
    db.query(sql, [nombre, descripcion, precio, imagen, categoria, prodStock, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al actualizar producto.' });
        }
        res.json({ message: 'Producto actualizado con éxito.' });
    });
});

// Eliminar un producto
app.delete('/api/admin/products/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM productos WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al eliminar producto.' });
        }
        res.json({ message: 'Producto eliminado con éxito.' });
    });
});


// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
