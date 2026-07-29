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
    direccion VARCHAR(200),
    -- Fecha de nacimiento, usada por fn_es_mayor_edad().
    fechanac DATE DEFAULT NULL
);

CREATE TABLE cliente (
    ci_cliente INT PRIMARY KEY,
    nro_cliente INT NOT NULL AUTO_INCREMENT UNIQUE,
    contrasena VARCHAR(100) NOT NULL,
    -- Zona de la dirección del cliente (debe coincidir con alguna fila de tarifa.zona);
    -- se usa para calcular el costo extra de envío, que luego pasa íntegro como
    -- comisión extra al repartidor que entrega el pedido.
    zona VARCHAR(100) DEFAULT NULL,
    -- Último punto de entrega que el cliente marcó en el mapa (se reusa como
    -- default en el próximo checkout). Ver pedido.lat/lng para el punto real
    -- de CADA pedido, que puede diferir de este.
    lat DECIMAL(10,7) DEFAULT NULL,
    lng DECIMAL(10,7) DEFAULT NULL,
    -- Fecha en que el cliente se registró, usada por fn_dias_como_cliente().
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ci_cliente) REFERENCES persona(ci)
);

CREATE TABLE negocio (
    id_negocio INT PRIMARY KEY AUTO_INCREMENT,
    nombre_negocio VARCHAR(150) NOT NULL DEFAULT '',
    ci_dueno INT NOT NULL,
    correo_negocio VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL DEFAULT '$2b$12$lKNsmcsQyeW3WPcmZ.hQ1eKfpmM/.0/7m/F12UTXW44LHoa3eTfTm',
    FOREIGN KEY (ci_dueno) REFERENCES persona(ci)
);

-- Super Usuario Administrador: gestiona personas, clientes, repartidores, negocios y productos
CREATE TABLE administrador (
    ci_admin INT PRIMARY KEY,
    contrasena VARCHAR(100) NOT NULL,
    FOREIGN KEY (ci_admin) REFERENCES persona(ci)
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

CREATE TABLE vehiculo (
    ci_repartidor INT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    placa VARCHAR(20) NOT NULL,
    modelo VARCHAR(50),
    color VARCHAR(30),
    FOREIGN KEY (ci_repartidor) REFERENCES repartidor(ci_repartidor)
);

CREATE TABLE sucursal (
    id_sucursal INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    -- Punto exacto marcado en el mapa por el negocio al crear la sucursal.
    -- Se usa directamente en el mapa del repartidor (no se re-geocodifica).
    lat DECIMAL(10,7) DEFAULT NULL,
    lng DECIMAL(10,7) DEFAULT NULL,
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

-- Productos favoritos de un cliente
CREATE TABLE favorito (
    ci_cliente INT NOT NULL,
    id_producto INT NOT NULL,
    fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ci_cliente, id_producto),
    FOREIGN KEY (ci_cliente) REFERENCES cliente(ci_cliente),
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
    token VARCHAR(5),
    direccion VARCHAR(200),
    -- Punto de entrega marcado en el mapa por el cliente al confirmar ESTE
    -- pedido (puede diferir de cliente.lat/lng, su último punto usado).
    lat DECIMAL(10,7) DEFAULT NULL,
    lng DECIMAL(10,7) DEFAULT NULL,
    total DECIMAL(10,2) NOT NULL,
    ci_cliente INT NOT NULL,
    ci_repartidor INT,
    id_tarifa INT,
    FOREIGN KEY (ci_cliente) REFERENCES cliente(ci_cliente),
    FOREIGN KEY (ci_repartidor) REFERENCES repartidor(ci_repartidor),
    FOREIGN KEY (id_tarifa) REFERENCES tarifa(id_tarifa)
);

-- Un repartidor no puede tener dos pedidos "En Camino" a la vez: si el backend
-- intenta asignarle un segundo pedido mientras ya tiene uno activo, este
-- trigger aborta el UPDATE con un error que la API traduce a un mensaje claro.
DELIMITER $$
CREATE TRIGGER trg_repartidor_un_pedido_activo
BEFORE UPDATE ON pedido
FOR EACH ROW
BEGIN
  DECLARE pedidos_activos INT;
  IF NEW.ci_repartidor IS NOT NULL AND OLD.ci_repartidor IS NULL THEN
    SELECT COUNT(*) INTO pedidos_activos
    FROM pedido
    WHERE ci_repartidor = NEW.ci_repartidor
      AND estado_pedido = 'En Camino'
      AND id_pedido <> NEW.id_pedido;
    IF pedidos_activos > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Este repartidor ya tiene un pedido en curso; no puede aceptar otro.';
    END IF;
  END IF;
END$$
DELIMITER ;

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
-- Nota: las contraseñas se guardan hasheadas con bcrypt, nunca en texto plano.
-- Los valores '$2b$12$...' de abajo son el hash de '123456' (o 'admin123' para
-- el administrador); para iniciar sesión seguí usando la contraseña en texto
-- plano documentada en el README, no el hash.
-- ==========================================

INSERT INTO reporte (id_reporte, descripcion) VALUES (1, 'Reporte inicial');

-- Cliente de prueba: cliente@chaski.com / 123456
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion, fechanac) VALUES
(1001, 'Juan', 'Perez', '70000001', 'cliente@chaski.com', 'Av. San Martin, Equipetrol, Santa Cruz de la Sierra', '1998-06-15');
INSERT INTO cliente (ci_cliente, contrasena, lat, lng, fecha_registro) VALUES (1001, '$2b$12$lKNsmcsQyeW3WPcmZ.hQ1eKfpmM/.0/7m/F12UTXW44LHoa3eTfTm', -17.7680, -63.1975, '2026-01-10 09:00:00');

-- Dueño de negocio de prueba: negocio@chaski.com / 123456
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion, fechanac) VALUES
(2001, 'Maria', 'Lopez', '70000002', 'negocio@chaski.com', 'Calle Comercio 456', '1985-09-22');
INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio, contrasena) VALUES ('El Buen Sabor', 2001, 'negocio@chaski.com', '$2b$12$lKNsmcsQyeW3WPcmZ.hQ1eKfpmM/.0/7m/F12UTXW44LHoa3eTfTm');

-- Repartidor de prueba: repartidor@chaski.com / 123456
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion, fechanac) VALUES
(3001, 'Carlos', 'Gomez', '70000003', 'repartidor@chaski.com', 'Zona Sur 789', '1995-01-30');
INSERT INTO repartidor (ci_repartidor, contrasena, nro_licencia, estado_disponible) VALUES
(3001, '$2b$12$lKNsmcsQyeW3WPcmZ.hQ1eKfpmM/.0/7m/F12UTXW44LHoa3eTfTm', 'LIC-001', 'disponible');

INSERT INTO vehiculo (ci_repartidor, tipo, placa, modelo, color) VALUES
(3001, 'Motocicleta', '1234-ABC', 'Honda Wave 110', 'Rojo');

-- Sucursal y productos de ejemplo
INSERT INTO sucursal (nombre, direccion, lat, lng, telefono, id_negocio) VALUES
('Sucursal Centro', 'Calle Junín, Casco Viejo, Santa Cruz de la Sierra', -17.7833, -63.1821, '70000000', (SELECT id_negocio FROM negocio WHERE correo_negocio = 'negocio@chaski.com'));

INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES
('Hamburguesa', 'Hamburguesa clásica', 25.00, 50),
('Refresco', 'Gaseosa 500ml', 8.00, 100);

INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (1, 1), (1, 2);

INSERT INTO tarifa (zona, costo) VALUES
('Centro', 10.00),
('Norte', 12.00),
('Sur', 15.00),
('Equipetrol', 8.00),
('Las Palmas', 14.00);

-- ==========================================
-- Negocios adicionales de prueba (para probar el flujo Negocios -> Sucursales)
-- ==========================================

-- Negocio: Pizza Nostra (pizzanostra@chaski.com / 123456)
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion, fechanac) VALUES
(2002, 'Roberto', 'Fernandez', '70055002', 'pizzanostra@chaski.com', 'Av. San Martin 200', '1979-11-05');
INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio, contrasena) VALUES
('Pizza Nostra', 2002, 'pizzanostra@chaski.com', '$2b$12$lKNsmcsQyeW3WPcmZ.hQ1eKfpmM/.0/7m/F12UTXW44LHoa3eTfTm');
SET @id_pizza = LAST_INSERT_ID();

INSERT INTO sucursal (nombre, direccion, lat, lng, telefono, id_negocio) VALUES ('Sucursal Norte', 'Av. Cristo Redentor, Santa Cruz de la Sierra', -17.7550, -63.1890, '70099101', @id_pizza);
SET @suc_pizza_norte = LAST_INSERT_ID();
INSERT INTO sucursal (nombre, direccion, lat, lng, telefono, id_negocio) VALUES ('Sucursal Sur', 'Av. Beni, Santa Cruz de la Sierra', -17.8100, -63.1700, '70099102', @id_pizza);
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
INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion, fechanac) VALUES
(2003, 'Lucia', 'Vargas', '70055003', 'sushiichiban@chaski.com', 'Av. Monseñor Rivero 150', '1990-02-18');
INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio, contrasena) VALUES
('Sushi Ichiban', 2003, 'sushiichiban@chaski.com', '$2b$12$lKNsmcsQyeW3WPcmZ.hQ1eKfpmM/.0/7m/F12UTXW44LHoa3eTfTm');
SET @id_sushi = LAST_INSERT_ID();

INSERT INTO sucursal (nombre, direccion, lat, lng, telefono, id_negocio) VALUES ('Sucursal Equipetrol', 'Calle Portugal, Equipetrol, Santa Cruz de la Sierra', -17.7650, -63.1980, '70099201', @id_sushi);
SET @suc_sushi_equipetrol = LAST_INSERT_ID();
INSERT INTO sucursal (nombre, direccion, lat, lng, telefono, id_negocio) VALUES ('Sucursal Las Palmas', 'Av. Roca y Coronado, Santa Cruz de la Sierra', -17.7950, -63.1650, '70099202', @id_sushi);
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

-- ==========================================
-- Super Usuario Administrador de prueba: admin@chaski.com / admin123
-- ==========================================

INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion, fechanac) VALUES
(9999, 'Admin', 'Chaski', '70000000', 'admin@chaski.com', 'Oficina Central', '1988-04-10');
INSERT INTO administrador (ci_admin, contrasena) VALUES (9999, '$2b$12$bDAmENsAmSXUSXQFuw/fW.rJHv.HveIyf6MnS4eTNbUiNGiQBJOh2');

-- ==========================================
-- FUNCIONES, PROCEDIMIENTOS, TRIGGERS Y CURSOR
-- (para la defensa del proyecto)
-- ==========================================

-- ------------------------------------------
-- FUNCIONES
-- ------------------------------------------

-- Verifica si una persona es mayor de edad
DELIMITER $$
CREATE FUNCTION fn_es_mayor_edad(p_ci VARCHAR(15))
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE v_fechanac DATE;
    DECLARE v_edad INT;

    SELECT fechanac INTO v_fechanac FROM persona WHERE ci = p_ci;

    IF v_fechanac IS NULL THEN
        RETURN 'Desconocido';
    END IF;

    SET v_edad = TIMESTAMPDIFF(YEAR, v_fechanac, CURDATE());

    RETURN IF(v_edad >= 18, 'Sí', 'No');
END$$
DELIMITER ;

-- Calcula hace cuántos días se registró un cliente
DELIMITER $$
CREATE FUNCTION fn_dias_como_cliente(p_ci_cliente VARCHAR(15))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_fecha_registro DATE;

    SELECT fecha_registro INTO v_fecha_registro
    FROM cliente
    WHERE ci_cliente = p_ci_cliente;

    IF v_fecha_registro IS NULL THEN
        RETURN -1;
    END IF;

    RETURN DATEDIFF(CURDATE(), v_fecha_registro);
END$$
DELIMITER ;

-- ------------------------------------------
-- PROCEDIMIENTOS
-- ------------------------------------------

-- Genera un mensaje de bienvenida personalizado según la hora del día
DELIMITER $$
CREATE PROCEDURE sp_saludo_cliente(IN p_ci_cliente VARCHAR(15))
BEGIN
    SELECT
        CONCAT(
            CASE
                WHEN HOUR(NOW()) < 12 THEN 'Buenos días'
                WHEN HOUR(NOW()) < 19 THEN 'Buenas tardes'
                ELSE 'Buenas noches'
            END,
            ', ', pe.nombre, '! Bienvenido de nuevo a Chaski 🛵'
        ) AS mensaje_bienvenida
    FROM cliente c
    JOIN persona pe ON c.ci_cliente = pe.ci
    WHERE c.ci_cliente = p_ci_cliente;
END$$
DELIMITER ;

-- Muestra si hay al menos un repartidor disponible en este momento (alerta simple sí/no)
DELIMITER $$
CREATE PROCEDURE sp_hay_repartidores_disponibles()
BEGIN
    DECLARE v_disponibles INT;

    SELECT COUNT(*) INTO v_disponibles
    FROM repartidor
    WHERE estado_disponible = 'Disponible';

    IF v_disponibles = 0 THEN
        SELECT 'No hay repartidores disponibles en este momento 🚫' AS estado;
    ELSE
        SELECT CONCAT('Hay ', v_disponibles, ' repartidor(es) disponible(s) ✅') AS estado;
    END IF;
END$$
DELIMITER ;

-- ------------------------------------------
-- TRIGGERS
-- ------------------------------------------

-- Bloquea pedidos duplicados si se realiza más de uno en un corto periodo de tiempo
DELIMITER $$
CREATE TRIGGER trg_bloquear_pedido_duplicado
BEFORE INSERT ON pedido
FOR EACH ROW
BEGIN
    DECLARE v_duplicados INT;

    SELECT COUNT(*) INTO v_duplicados
    FROM pedido
    WHERE ci_cliente = NEW.ci_cliente
      AND total = NEW.total
      AND TIMESTAMPDIFF(SECOND, fecha, NOW()) <= 120;

    IF v_duplicados > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Posible pedido duplicado detectado (mismo cliente y total en menos de 2 minutos)';
    END IF;
END$$
DELIMITER ;

-- Si al actualizar un producto el stock llega a 0, registra una alerta en una tabla de bitácora
CREATE TABLE IF NOT EXISTS bitacora_stock (
    id_bitacora INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    mensaje VARCHAR(200),
    fecha_evento DATETIME DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$
CREATE TRIGGER trg_alerta_producto_agotado
AFTER UPDATE ON producto
FOR EACH ROW
BEGIN
    IF NEW.stock_producto = 0 AND OLD.stock_producto > 0 THEN
        INSERT INTO bitacora_stock (id_producto, mensaje)
        VALUES (NEW.id_producto, CONCAT('⚠️ El producto "', NEW.nombre, '" se quedó sin stock'));
    END IF;
END$$
DELIMITER ;

-- ------------------------------------------
-- CURSOR
-- ------------------------------------------

-- Genera un menú de una sucursal, como si se fuera a imprimir
DELIMITER $$
CREATE PROCEDURE sp_menu_texto_sucursal(IN p_id_sucursal INT)
BEGIN
    DECLARE v_nombre_producto VARCHAR(80);
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_stock INT;
    DECLARE v_fin INT DEFAULT 0;
    DECLARE v_menu TEXT DEFAULT '';
    DECLARE v_nombre_sucursal VARCHAR(80);

    DECLARE cur_menu CURSOR FOR
        SELECT p.nombre, p.precio_unitario, p.stock_producto
        FROM cuenta_con cc
        JOIN producto p ON cc.id_producto = p.id_producto
        WHERE cc.id_sucursal = p_id_sucursal
        ORDER BY p.precio_unitario ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_fin = 1;

    SELECT nombre INTO v_nombre_sucursal FROM sucursal WHERE id_sucursal = p_id_sucursal;
    SET v_menu = CONCAT('=== MENÚ - ', IFNULL(v_nombre_sucursal, 'Sucursal desconocida'), ' ===', CHAR(10));

    OPEN cur_menu;

    leer_menu: LOOP
        FETCH cur_menu INTO v_nombre_producto, v_precio, v_stock;

        IF v_fin = 1 THEN
            LEAVE leer_menu;
        END IF;

        SET v_menu = CONCAT(
            v_menu,
            '- ', v_nombre_producto,
            ' ..... Bs. ', v_precio,
            CASE WHEN v_stock = 0 THEN ' (AGOTADO)' ELSE '' END,
            CHAR(10)
        );
    END LOOP;

    CLOSE cur_menu;

    SELECT v_menu AS menu_generado;
END$$
DELIMITER ;
