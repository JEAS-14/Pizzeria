-- Creación de la Base de Datos
CREATE DATABASE IF NOT EXISTS pizzeria_la_esquina;
USE pizzeria_la_esquina;

-- Tabla de Usuarios (Administradores y Clientes)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos (Pizzas y bebidas)
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    imagen VARCHAR(255),
    categoria VARCHAR(50) DEFAULT 'Pizzas',
    stock INT DEFAULT 10
);

-- Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'preparando', 'enviado', 'entregado') DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de Detalles del Pedido (Relación de pedidos con productos)
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- Insertar productos iniciales (Carta básica de la pizzería)
INSERT INTO productos (nombre, descripcion, precio, imagen, categoria) VALUES
('Americana', 'Queso mozzarella, salsa de tomate y jamón americano.', 12.90, 'img/img9.png', 'Clasica'),
('Pepperoni', 'Queso mozzarella, pepperoni premium y salsa de tomate.', 12.90, 'img/img5.png', 'Clasica'),
('Mozzarella', 'Doble queso mozzarella fundido y salsa de tomate de la casa.', 12.90, 'img/img7.png', 'Clasica'),
('Hawaiana', 'Queso mozzarella, salsa de tomate, jamón y piña seleccionada.', 15.90, 'img/img9.png', 'Especialidad'),
('Suprema', 'Queso mozzarella, pepperoni, carne picada, pimientos y cebolla.', 18.90, 'img/img5.png', 'Especialidad'),
('Combo La Familia', '2 pizzas familiares clásicas a elección + gaseosa de 1.5L para compartir.', 135.90, 'img/img6.png', 'Promociones'),
('Duo de Barrio', '2 pizzas clásicas personales + 2 gaseosas de 500ml heladas.', 29.90, 'img/img10.png', 'Promociones'),
('Mi Esquina', '1 pizza grande clásica + 1 gaseosa de 1L + 3 rolls de pepperoni calientes.', 60.70, 'img/img3.png', 'Promociones'),
('Combo Mi Netho', '2 pizzas grandes clásicas para compartir en familia o con amigos.', 91.80, 'img/img11.png', 'Promociones'),
('Sábado de 2x1', 'Compra una pizza clásica familiar y llévate la segunda gratis. Oferta exclusiva para los días sábados.', 45.00, 'img/img0.png', 'Promociones');

-- Insertar usuario Admin por defecto
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@laesquina.com', 'admin123', 'admin'),
('Cliente de Prueba', 'cliente@laesquina.com', 'cliente123', 'cliente');
