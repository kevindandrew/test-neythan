-- ==========================================
-- Esquema de chaskiDB
-- Generado a partir de las consultas usadas en app.py
-- (el archivo original estaba vacío)
-- ==========================================

CREATE DATABASE IF NOT EXISTS chaskiDB
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE chaskiDB;

-- Persona: entidad base para cliente, dueño de negocio y repartidor
CREATE TABLE persona (
    ci INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apepaterno VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(150) NOT NULL UNIQUE,
    direccion VARCHAR(200)
);

CREATE TABLE cliente (
    ci_cliente INT PRIMARY KEY,
    nro_cliente INT NOT NULL AUTO_INCREMENT UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    FOREIGN KEY (ci_cliente) REFERENCES persona(ci)
);

CREATE TABLE negocio (
    id_negocio INT PRIMARY KEY AUTO_INCREMENT,
    nombre_negocio VARCHAR(150) NOT NULL DEFAULT '',
    ci_dueno INT NOT NULL,
    correo_negocio VARCHAR(150) NOT NULL UNIQUE,
    FOREIGN KEY (ci_dueno) REFERENCES persona(ci)
);

CREATE TABLE repartidor (
    ci_repartidor INT PRIMARY KEY,
    nro_repartidor INT NOT NULL AUTO_INCREMENT UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    nro_licencia VARCHAR(50),
    estado_disponible VARCHAR(20) DEFAULT 'disponible',
    FOREIGN KEY (ci_repartidor) REFERENCES persona(ci)
);

CREATE TABLE sucursal (
    id_sucursal INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    id_negocio INT NOT NULL,
    FOREIGN KEY (id_negocio) REFERENCES negocio(id_negocio)
);

CREATE TABLE producto (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio_unitario DECIMAL(10,2) NOT NULL,
    stock_producto INT DEFAULT 0
);

-- Relación N:M entre sucursal y producto
CREATE TABLE cuenta_con (
    id_sucursal INT NOT NULL,
    id_producto INT NOT NULL,
    PRIMARY KEY (id_sucursal, id_producto),
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

CREATE TABLE tarifa (
    id_tarifa INT PRIMARY KEY AUTO_INCREMENT,
    zona VARCHAR(100) NOT NULL,
    costo DECIMAL(10,2) NOT NULL
);

CREATE TABLE pedido (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_pedido VARCHAR(30) DEFAULT 'Pendiente',
    total DECIMAL(10,2) NOT NULL,
    ci_cliente INT NOT NULL,
    ci_repartidor INT,
    id_tarifa INT,
    FOREIGN KEY (ci_cliente) REFERENCES cliente(ci_cliente),
    FOREIGN KEY (ci_repartidor) REFERENCES repartidor(ci_repartidor),
    FOREIGN KEY (id_tarifa) REFERENCES tarifa(id_tarifa)
);

CREATE TABLE detalle_pedido (
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    id_sucursal INT NOT NULL,
    cantidad INT DEFAULT 1,
    PRIMARY KEY (id_pedido, id_producto),
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal)
);

CREATE TABLE reporte (
    id_reporte INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(255),
    fecha_generado DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE factura (
    id_factura INT PRIMARY KEY AUTO_INCREMENT,
    nit VARCHAR(20),
    nro_autorizacion VARCHAR(50),
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_pago VARCHAR(30),
    id_pedido INT NOT NULL,
    id_reporte INT,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte)
);

-- ==========================================
-- Datos semilla mínimos para poder probar los 3 tipos de login
-- ==========================================

INSERT INTO reporte (id_reporte, descripcion) VALUES (1, 'Reporte inicial');

-- Cliente de prueba: cliente@chaski.com / 123456
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES
(1001, 'Juan', 'Perez', '70000001', 'cliente@chaski.com', 'Av. Siempre Viva 123');
INSERT INTO cliente (ci_cliente, contrasena) VALUES (1001, '123456');

-- Dueño de negocio de prueba: negocio@chaski.com / 123456
-- (ojo: el login de negocio en app.py usa una contraseña fija "123456", no la de la BD)
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES
(2001, 'Maria', 'Lopez', '70000002', 'negocio@chaski.com', 'Calle Comercio 456');
INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio) VALUES ('El Buen Sabor', 2001, 'negocio@chaski.com');

-- Repartidor de prueba: repartidor@chaski.com / 123456
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES
(3001, 'Carlos', 'Gomez', '70000003', 'repartidor@chaski.com', 'Zona Sur 789');
INSERT INTO repartidor (ci_repartidor, contrasena, nro_licencia, estado_disponible) VALUES
(3001, '123456', 'LIC-001', 'disponible');

-- Sucursal y productos de ejemplo
INSERT INTO sucursal (nombre, direccion, telefono, id_negocio) VALUES
('Sucursal Centro', 'Calle Falsa 123', '70000000', (SELECT id_negocio FROM negocio WHERE correo_negocio = 'negocio@chaski.com'));

INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES
('Hamburguesa', 'Hamburguesa clásica', 25.00, 50),
('Refresco', 'Gaseosa 500ml', 8.00, 100);

INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (1, 1), (1, 2);

INSERT INTO tarifa (zona, costo) VALUES ('Centro', 10.00);

-- ==========================================
-- Negocios adicionales de prueba (para probar el flujo Negocios -> Sucursales)
-- ==========================================

-- Negocio: Pizza Nostra (pizzanostra@chaski.com / 123456)
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES
(2002, 'Roberto', 'Fernandez', '70055002', 'pizzanostra@chaski.com', 'Av. San Martin 200');
INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio) VALUES
('Pizza Nostra', 2002, 'pizzanostra@chaski.com');
SET @id_pizza = LAST_INSERT_ID();

INSERT INTO sucursal (nombre, direccion, telefono, id_negocio) VALUES ('Sucursal Norte', 'Av. Cristo Redentor 500', '70099101', @id_pizza);
SET @suc_pizza_norte = LAST_INSERT_ID();
INSERT INTO sucursal (nombre, direccion, telefono, id_negocio) VALUES ('Sucursal Sur', 'Av. Beni 300', '70099102', @id_pizza);
SET @suc_pizza_sur = LAST_INSERT_ID();

INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Pizza Muzzarella', 'Pizza clásica de muzzarella', 45.00, 30);
SET @prod1 = LAST_INSERT_ID();
INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Pizza Pepperoni', 'Pizza con pepperoni', 50.00, 25);
SET @prod2 = LAST_INSERT_ID();
INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (@suc_pizza_norte, @prod1), (@suc_pizza_norte, @prod2);

INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Pizza Napolitana', 'Pizza con tomate y albahaca', 48.00, 20);
SET @prod3 = LAST_INSERT_ID();
INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Calzone', 'Empanada italiana rellena', 40.00, 15);
SET @prod4 = LAST_INSERT_ID();
INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (@suc_pizza_sur, @prod3), (@suc_pizza_sur, @prod4);

-- Negocio: Sushi Ichiban (sushiichiban@chaski.com / 123456)
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES
(2003, 'Lucia', 'Vargas', '70055003', 'sushiichiban@chaski.com', 'Av. Monseñor Rivero 150');
INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio) VALUES
('Sushi Ichiban', 2003, 'sushiichiban@chaski.com');
SET @id_sushi = LAST_INSERT_ID();

INSERT INTO sucursal (nombre, direccion, telefono, id_negocio) VALUES ('Sucursal Equipetrol', 'Calle Portugal 45', '70099201', @id_sushi);
SET @suc_sushi_equipetrol = LAST_INSERT_ID();
INSERT INTO sucursal (nombre, direccion, telefono, id_negocio) VALUES ('Sucursal Las Palmas', 'Av. Roca y Coronado 800', '70099202', @id_sushi);
SET @suc_sushi_palmas = LAST_INSERT_ID();

INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Sushi California', 'Roll de palta y kanikama', 38.00, 25);
SET @prod5 = LAST_INSERT_ID();
INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Ramen Shoyu', 'Sopa ramen con caldo de soya', 32.00, 20);
SET @prod6 = LAST_INSERT_ID();
INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (@suc_sushi_equipetrol, @prod5), (@suc_sushi_equipetrol, @prod6);

INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Gyozas', 'Empanaditas japonesas al vapor', 22.00, 30);
SET @prod7 = LAST_INSERT_ID();
INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES ('Té Verde Helado', 'Bebida fría', 12.00, 40);
SET @prod8 = LAST_INSERT_ID();
INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (@suc_sushi_palmas, @prod7), (@suc_sushi_palmas, @prod8);
