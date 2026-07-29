import os
import random

import bcrypt
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_mysqldb import MySQL

load_dotenv()

app = Flask(__name__)
CORS(app)

# ==========================================
# CONFIGURACIÓN (desde variables de entorno, ver .env / .env.example)
# ==========================================

# Configuración de la base de datos MySQL
app.config["MYSQL_HOST"] = os.environ.get("MYSQL_HOST", "localhost")
app.config["MYSQL_USER"] = os.environ.get("MYSQL_USER", "root")
app.config["MYSQL_PASSWORD"] = os.environ.get("MYSQL_PASSWORD", "")
app.config["MYSQL_DB"] = os.environ.get("MYSQL_DB", "chaskiDB")
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

# Configuración de JWT
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "chaski-secret-key-muy-segura"
)

mysql = MySQL(app)
jwt = JWTManager(app)

# Porcentaje de comisión que gana el repartidor por cada pedido entregado
COMISION_PORCENTAJE = 0.10


def hash_contrasena(contrasena):
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_contrasena(contrasena, hash_guardado):
    try:
        return bcrypt.checkpw(contrasena.encode("utf-8"), hash_guardado.encode("utf-8"))
    except (ValueError, AttributeError):
        # hash_guardado no es un hash bcrypt válido (p. ej. dato viejo sin migrar)
        return False


# ==========================================
# RUTAS DE VISTAS (HTML)
# ==========================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    return render_template("negocio_dashboard.html")


@app.route("/dashboard/sucursales")
def dashboard_sucursales():
    return render_template("sucursales_detalle.html")


@app.route("/repartidor/panel")
def repartidor_panel():
    return render_template("repartidor_dashboard.html")


@app.route("/cliente/panel")
def cliente_panel():
    return render_template("cliente_dashboard.html")


@app.route("/factura/<int:id_pedido>")
def ver_factura_pagina(id_pedido):
    return render_template("factura.html", id_pedido=id_pedido)


@app.route("/cliente/repartidores")
def vista_repartidores():
    return render_template("repartidores.html")


# ==========================================
# ENDPOINT DE LOGIN UNIFICADO
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    correo = data.get("correo")
    contrasena = data.get("contrasena")

    if not correo or not contrasena:
        return jsonify({"error": "Se requiere correo y contraseña"}), 400

    cursor = mysql.connection.cursor()

    # 1. Buscar si es CLIENTE
    cursor.execute(
        """
            SELECT c.*, p.nombre, p.correo, p.direccion FROM cliente c
            JOIN persona p ON c.ci_cliente = p.ci
            WHERE p.correo = %s
        """,
        (correo,),
    )
    cliente = cursor.fetchone()

    if cliente:
        # Validación única y limpia (comparación directa para texto plano)
        if not verificar_contrasena(contrasena, cliente["contrasena"]):
            cursor.close()
            return jsonify({"error": "Credenciales inválidas"}), 401

        access_token = create_access_token(
            identity=str(cliente["ci_cliente"]),
            additional_claims={
                "rol": "cliente",
                "ci_cliente": cliente["ci_cliente"],
                "nro_cliente": cliente["nro_cliente"],
            },
        )
        cursor.close()
        return (
            jsonify({
                "mensaje": "Login exitoso",
                "token": access_token,
                "rol": "cliente",
                "usuario": {
                    "ci": cliente["ci_cliente"],
                    "nombre": cliente["nombre"],
                    "correo": cliente["correo"],
                    "direccion": cliente["direccion"],
                    "zona": cliente["zona"],
                },
            }),
            200,
        )

    # 2. DUEÑO DE NEGOCIO
    cursor.execute(
        """
            SELECT n.*, p.nombre FROM negocio n
            JOIN persona p ON n.ci_dueno = p.ci
            WHERE n.correo_negocio = %s
        """,
        (correo,),
    )
    negocio = cursor.fetchone()

    if negocio:
        if not verificar_contrasena(contrasena, negocio["contrasena"]):
            cursor.close()
            return jsonify({"error": "Credenciales inválidas"}), 401

        access_token = create_access_token(
            identity=str(negocio["ci_dueno"]),
            additional_claims={
                "rol": "dueno_negocio",
                "id_negocio": negocio["id_negocio"],
            },
        )
        cursor.close()
        return (
            jsonify({
                "mensaje": "Login exitoso",
                "token": access_token,
                "rol": "dueno_negocio",
                "usuario": {
                    "ci": negocio["ci_dueno"],
                    "nombre": negocio["nombre"],
                    "nombre_negocio": negocio["nombre_negocio"],
                    "correo": negocio["correo_negocio"],
                },
            }),
            200,
        )

    # 3. REPARTIDOR
    cursor.execute(
        """
            SELECT r.*, r.contrasena, p.nombre, p.correo 
            FROM repartidor r
            JOIN persona p ON r.ci_repartidor = p.ci
            WHERE p.correo = %s
        """,
        (correo,),
    )
    repartidor = cursor.fetchone()

    if repartidor:
        if not verificar_contrasena(contrasena, repartidor["contrasena"]):
            cursor.close()
            return jsonify({"error": "Credenciales inválidas"}), 401

        access_token = create_access_token(
            identity=str(repartidor["ci_repartidor"]),
            additional_claims={
                "rol": "repartidor",
                "nro_repartidor": repartidor["nro_repartidor"],
            },
        )
        cursor.close()
        return (
            jsonify({
                "mensaje": "Login exitoso",
                "token": access_token,
                "rol": "repartidor",
                "usuario": {
                    "ci": repartidor["ci_repartidor"],
                    "nombre": repartidor["nombre"],
                    "correo": repartidor["correo"],
                },
            }),
            200,
        )

    # 4. SUPER USUARIO ADMINISTRADOR
    cursor.execute(
        """
            SELECT a.*, p.nombre, p.correo FROM administrador a
            JOIN persona p ON a.ci_admin = p.ci
            WHERE p.correo = %s
        """,
        (correo,),
    )
    admin = cursor.fetchone()

    if admin:
        if not verificar_contrasena(contrasena, admin["contrasena"]):
            cursor.close()
            return jsonify({"error": "Credenciales inválidas"}), 401

        access_token = create_access_token(
            identity=str(admin["ci_admin"]),
            additional_claims={"rol": "admin"},
        )
        cursor.close()
        return (
            jsonify({
                "mensaje": "Login exitoso",
                "token": access_token,
                "rol": "admin",
                "usuario": {
                    "ci": admin["ci_admin"],
                    "nombre": admin["nombre"],
                    "correo": admin["correo"],
                },
            }),
            200,
        )

    cursor.close()
    return jsonify({"error": "Usuario no encontrado"}), 404


# ==========================================
# ZONAS / TARIFAS (público: se usa desde el registro, antes de tener sesión)
# ==========================================

@app.route("/api/tarifas", methods=["GET"])
def listar_tarifas():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id_tarifa, zona, costo FROM tarifa ORDER BY zona")
    tarifas = cursor.fetchall()
    cursor.close()
    return jsonify(tarifas), 200


# ==========================================
# ENDPOINT DE REGISTRO UNIFICADO
# ==========================================

@app.route("/api/registro", methods=["POST"])
def registro():
    data = request.get_json()
    rol = data.get("rol")
    ci = data.get("ci")
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")
    contrasena = data.get("contrasena")

    nombre_negocio = data.get("nombre_negocio")

    if rol not in ("cliente", "negocio", "repartidor"):
        return jsonify({"error": "Rol inválido, debe ser cliente, negocio o repartidor"}), 400

    if not ci or not nombre or not correo or not contrasena:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    if rol == "negocio" and not nombre_negocio:
        return jsonify({"error": "Falta el nombre del negocio"}), 400

    contrasena = hash_contrasena(contrasena)

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT ci FROM persona WHERE ci = %s OR correo = %s", (ci, correo))
    if cursor.fetchone():
        cursor.close()
        return jsonify({"error": "Ya existe una cuenta con ese CI o correo"}), 409

    cursor.execute(
        "INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES (%s, %s, %s, %s, %s, %s)",
        (ci, nombre, apepaterno, telefono, correo, direccion),
    )

    if rol == "cliente":
        zona = data.get("zona")
        cursor.execute(
            "INSERT INTO cliente (ci_cliente, contrasena, zona) VALUES (%s, %s, %s)",
            (ci, contrasena, zona),
        )
    elif rol == "repartidor":
        nro_licencia = data.get("nro_licencia")
        cursor.execute(
            "INSERT INTO repartidor (ci_repartidor, contrasena, nro_licencia) VALUES (%s, %s, %s)",
            (ci, contrasena, nro_licencia),
        )
    elif rol == "negocio":
        cursor.execute(
            "INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio, contrasena) VALUES (%s, %s, %s, %s)",
            (nombre_negocio, ci, correo, contrasena),
        )

    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Cuenta creada con éxito", "rol": rol}), 201


# ==========================================
# ENDPOINTS PARA DUEÑO DE NEGOCIO
# ==========================================

@app.route("/api/negocio/dashboard", methods=["GET"])
@jwt_required()
def dashboard_negocio():
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    cursor = mysql.connection.cursor()

    # 1. Datos del negocio (sin la contraseña: esto se manda tal cual al frontend)
    cursor.execute(
        "SELECT id_negocio, nombre_negocio, ci_dueno, correo_negocio FROM negocio WHERE id_negocio = %s",
        (id_negocio,),
    )
    negocio = cursor.fetchone()

    # 2. Sucursales de este negocio
    cursor.execute(
        "SELECT id_sucursal, nombre FROM sucursal WHERE id_negocio = %s",
        (id_negocio,),
    )
    sucursales = cursor.fetchall()

    # 3. Productos registrados del negocio
    cursor.execute(
        """
            SELECT p.id_producto, p.nombre, p.descripcion, p.precio_unitario, p.stock_producto, s.nombre AS sucursal_nombre 
            FROM producto p
            JOIN cuenta_con cc ON p.id_producto = cc.id_producto
            JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
            WHERE s.id_negocio = %s
        """,
        (id_negocio,),
    )
    productos = cursor.fetchall()

    # 4. Facturas asociadas a los pedidos de las sucursales de este negocio
    cursor.execute(
        """
            SELECT DISTINCT f.id_factura, f.nit, f.nro_autorizacion, f.tipo_pago, p.total, f.fecha_emision 
            FROM factura f
            JOIN pedido p ON f.id_pedido = p.id_pedido
            JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
            WHERE s.id_negocio = %s
        """,
        (id_negocio,),
    )
    facturas = cursor.fetchall()

    # 5. Ganancias totales (usa un subquery DISTINCT para no duplicar pedidos con más de un producto)
    cursor.execute(
        """
            SELECT SUM(total) as total_ganancias
            FROM pedido
            WHERE id_pedido IN (
                SELECT DISTINCT p.id_pedido
                FROM pedido p
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
                WHERE s.id_negocio = %s
            )
        """,
        (id_negocio,),
    )
    ganancias = cursor.fetchone()

    # 6. Ventas del mes actual vs. el mes anterior (para el % de crecimiento)
    cursor.execute(
        """
            SELECT
                SUM(CASE WHEN YEAR(f.fecha_emision) = YEAR(CURDATE())
                          AND MONTH(f.fecha_emision) = MONTH(CURDATE())
                     THEN p.total ELSE 0 END) AS ventas_mes_actual,
                SUM(CASE WHEN YEAR(f.fecha_emision) = YEAR(CURDATE() - INTERVAL 1 MONTH)
                          AND MONTH(f.fecha_emision) = MONTH(CURDATE() - INTERVAL 1 MONTH)
                     THEN p.total ELSE 0 END) AS ventas_mes_anterior
            FROM (
                SELECT DISTINCT f.id_factura, f.fecha_emision, f.id_pedido
                FROM factura f
                JOIN pedido p2 ON f.id_pedido = p2.id_pedido
                JOIN detalle_pedido dp ON p2.id_pedido = dp.id_pedido
                JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
                WHERE s.id_negocio = %s
            ) f
            JOIN pedido p ON f.id_pedido = p.id_pedido
        """,
        (id_negocio,),
    )
    ventas = cursor.fetchone() or {}
    ventas_mes_actual = float(ventas.get("ventas_mes_actual") or 0)
    ventas_mes_anterior = float(ventas.get("ventas_mes_anterior") or 0)

    if ventas_mes_anterior > 0:
        crecimiento_porcentual = round(
            ((ventas_mes_actual - ventas_mes_anterior) / ventas_mes_anterior) * 100, 1
        )
    elif ventas_mes_actual > 0:
        crecimiento_porcentual = 100.0
    else:
        crecimiento_porcentual = 0.0

    cursor.close()

    return (
        jsonify({
            "negocio": negocio,
            "sucursales": sucursales,
            "productos": productos,
            "facturas": facturas,
            "ganancias_totales": (
                ganancias["total_ganancias"]
                if ganancias and ganancias["total_ganancias"]
                else 0.0
            ),
            "ventas_mes_actual": ventas_mes_actual,
            "ventas_mes_anterior": ventas_mes_anterior,
            "crecimiento_porcentual": crecimiento_porcentual,
        }),
        200,
    )


@app.route("/api/negocio/reportes", methods=["GET"])
@jwt_required()
def reportes_negocio():
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT DISTINCT f.id_factura, f.nit, f.nro_autorizacion, f.tipo_pago,
               f.fecha_emision, p.total, s.nombre AS sucursal_nombre
        FROM factura f
        JOIN pedido p ON f.id_pedido = p.id_pedido
        JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
        JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
        WHERE s.id_negocio = %s
        ORDER BY f.fecha_emision DESC
        """,
        (id_negocio,),
    )
    facturas = cursor.fetchall()
    cursor.close()
    return jsonify(facturas), 200


@app.route("/api/negocio/detalle-sucursales", methods=["GET"])
@jwt_required()
def detalle_sucursales_negocio():
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    cursor = mysql.connection.cursor()

    # 1. Obtener sucursales del negocio
    cursor.execute(
        "SELECT id_sucursal, nombre, direccion FROM sucursal WHERE id_negocio = %s",
        (id_negocio,),
    )
    sucursales = cursor.fetchall()

    resultado_final = []

    for suc in sucursales:
        id_sucursal = suc["id_sucursal"]

        # 2. Productos de la sucursal
        cursor.execute(
            """
            SELECT p.id_producto, p.nombre, p.descripcion, p.precio_unitario, p.stock_producto 
            FROM producto p
            JOIN cuenta_con cc ON p.id_producto = cc.id_producto
            WHERE cc.id_sucursal = %s
        """,
            (id_sucursal,),
        )
        productos = cursor.fetchall()

        # 3. Pedidos asociados usando 'estado_pedido'
        cursor.execute(
            """
            SELECT DISTINCT p.fecha,p.id_pedido, p.estado_pedido AS estado, p.total
            FROM pedido p
            JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            WHERE dp.id_sucursal = %s
        """,
            (id_sucursal,),
        )
        pedidos = cursor.fetchall()

        # 4. Ganancias totales de la sucursal (DISTINCT para no duplicar pedidos con más de un producto)
        cursor.execute(
            """
            SELECT SUM(total) as ganancias
            FROM pedido
            WHERE id_pedido IN (
                SELECT DISTINCT p.id_pedido
                FROM pedido p
                JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                WHERE dp.id_sucursal = %s
            )
        """,
            (id_sucursal,),
        )
        ganancias_res = cursor.fetchone()
        ganancias = (
            ganancias_res["ganancias"]
            if ganancias_res and ganancias_res["ganancias"]
            else 0.0
        )

        resultado_final.append({
            "sucursal": suc,
            "productos": productos,
            "pedidos": pedidos,
            "ganancias": ganancias,
        })

    cursor.close()
    return jsonify(resultado_final), 200


@app.route("/api/negocio/producto", methods=["POST"])
@jwt_required()
def agregar_producto_negocio():
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    data = request.get_json()

    nombre = data.get("nombre")
    descripcion = data.get("descripcion")
    precio = data.get("precio_unitario")
    stock = data.get("stock_producto")
    id_sucursal = data.get("id_sucursal")

    if not nombre or not precio or not id_sucursal:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()

    # Validar que la sucursal pertenezca al negocio
    cursor.execute(
        "SELECT id_sucursal FROM sucursal WHERE id_sucursal = %s AND id_negocio = %s",
        (id_sucursal, id_negocio),
    )
    if not cursor.fetchone():
        cursor.close()
        return jsonify({"error": "La sucursal no pertenece a este negocio"}), 403

    # Insertar el producto
    cursor.execute(
        """
        INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) 
        VALUES (%s, %s, %s, %s)
    """,
        (nombre, descripcion, precio, stock or 0),
    )
    mysql.connection.commit()
    nuevo_id_producto = cursor.lastrowid

    # Vincularlo mediante cuenta_con
    cursor.execute(
        """
        INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (%s, %s)
    """,
        (id_sucursal, nuevo_id_producto),
    )
    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Producto agregado y vinculado con éxito"}), 201


@app.route("/api/negocio/producto/<int:id_producto>", methods=["DELETE"])
@jwt_required()
def eliminar_producto_negocio(id_producto):
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    cursor = mysql.connection.cursor()

    # Validar que el producto pertenezca a una sucursal de este negocio
    cursor.execute(
        """
        SELECT p.id_producto FROM producto p
        JOIN cuenta_con cc ON p.id_producto = cc.id_producto
        JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
        WHERE p.id_producto = %s AND s.id_negocio = %s
    """,
        (id_producto, id_negocio),
    )
    if not cursor.fetchone():
        cursor.close()
        return (
            jsonify({"error": "El producto no pertenece a este negocio"}),
            403,
        )

    # Eliminar primero la relación en cuenta_con y luego el producto
    cursor.execute("DELETE FROM cuenta_con WHERE id_producto = %s", (id_producto,))
    cursor.execute("DELETE FROM producto WHERE id_producto = %s", (id_producto,))
    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Producto eliminado con éxito"}), 200


@app.route("/api/negocio/sucursales", methods=["GET"])
@jwt_required()
def listar_sucursales_negocio():
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    cursor = mysql.connection.cursor()
    cursor.execute(
        "SELECT id_sucursal, nombre FROM sucursal WHERE id_negocio = %s",
        (id_negocio,),
    )
    sucursales = cursor.fetchall()
    cursor.close()

    return jsonify(sucursales), 200


@app.route("/api/negocio/sucursal", methods=["POST"])
@jwt_required()
def agregar_sucursal_negocio():
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    data = request.get_json()

    nombre = data.get("nombre")
    direccion = data.get("direccion")

    if not nombre or not direccion:
        return jsonify({"error": "Faltan datos obligatorios (nombre y dirección)"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        INSERT INTO sucursal (nombre, direccion, id_negocio) 
        VALUES (%s, %s, %s)
    """,
        (nombre, direccion, id_negocio),
    )
    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Sucursal registrada con éxito"}), 201


@app.route("/api/negocio/sucursal/<int:id_sucursal>", methods=["DELETE"])
@jwt_required()
def eliminar_sucursal_negocio(id_sucursal):
    claims = get_jwt()
    if claims.get("rol") != "dueno_negocio":
        return jsonify({"error": "Acceso denegado"}), 403

    id_negocio = claims.get("id_negocio")
    cursor = mysql.connection.cursor()

    # Validar que la sucursal pertenezca al negocio
    cursor.execute(
        "SELECT id_sucursal FROM sucursal WHERE id_sucursal = %s AND id_negocio = %s",
        (id_sucursal, id_negocio),
    )
    if not cursor.fetchone():
        cursor.close()
        return jsonify({"error": "La sucursal no pertenece a este negocio"}), 403

    try:
        # Nota: Si hay pedidos o registros asociados, asegúrate de que tu BD maneje cascadas
        # o elimina las relaciones previas necesarias (como cuenta_con para esta sucursal)
        cursor.execute(
            "DELETE FROM cuenta_con WHERE id_sucursal = %s", (id_sucursal,)
        )
        cursor.execute("DELETE FROM sucursal WHERE id_sucursal = %s", (id_sucursal,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Sucursal eliminada con éxito"}), 200
    except Exception:
        mysql.connection.rollback()
        cursor.close()
        return (
            jsonify({
                "error": (
                    "No se puede eliminar la sucursal porque tiene registros"
                    " asociados (como pedidos)."
                )
            }),
            400,
        )


# ==========================================
# ENDPOINTS PARA REPARTIDOR
# ==========================================

@app.route("/api/repartidor/pedidos", methods=["GET"])
@jwt_required()
def obtener_pedidos_repartidor():
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    nro_repartidor = claims.get("nro_repartidor")
    cursor = mysql.connection.cursor()

    # 1. Obtener datos completos del repartidor
    cursor.execute(
        "SELECT ci_repartidor, nro_repartidor, fecha_registro, nro_licencia, estado_disponible FROM repartidor WHERE nro_repartidor = %s",
        (nro_repartidor,),
    )
    rep_data = cursor.fetchone()

    # 2. Obtener todos los pedidos asignados (con el costo de envío de su zona,
    #    que se paga íntegro al repartidor como comisión extra)
    cursor.execute(
        """
        SELECT p.id_pedido, p.fecha, p.estado_pedido, p.total,
               COALESCE(t.costo, 0) AS costo_envio
        FROM pedido p
        JOIN repartidor r ON p.ci_repartidor = r.ci_repartidor
        LEFT JOIN tarifa t ON p.id_tarifa = t.id_tarifa
        WHERE r.nro_repartidor = %s
        """,
        (nro_repartidor,),
    )
    pedidos = cursor.fetchall()
    cursor.close()

    for p in pedidos:
        entregado = str(p.get("estado_pedido", "")).lower() in ["entregado", "terminado"]
        costo_envio = float(p.pop("costo_envio", 0) or 0)
        if entregado:
            subtotal_productos = float(p["total"]) - costo_envio
            p["comision"] = round(subtotal_productos * COMISION_PORCENTAJE, 2) + round(costo_envio, 2)
        else:
            p["comision"] = 0.0

    # 3. Validar si tiene algún pedido activo
    estados_activos = ["pendiente", "en camino", "confirmado"]
    tiene_pedido_activo = any(
        str(p.get("estado_pedido", "")).lower() in estados_activos
        for p in pedidos
    )

    if tiene_pedido_activo:
        estado_actual = "ocupado"
    else:
        db_estado = rep_data.get("estado_disponible", "Disponible") if rep_data else "Disponible"
        estado_actual = "disponible" if str(db_estado).lower() in ["disponible", "1", "true"] else "ocupado"

    return jsonify({
        "repartidor": rep_data,
        "pedidos": pedidos,
        "estado_repartidor": estado_actual
    }), 200


@app.route("/api/repartidor/pedido/<int:id_pedido>", methods=["GET"])
@jwt_required()
def detalle_pedido_repartidor(id_pedido):
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_repartidor = get_jwt_identity()
    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT p.id_pedido, p.fecha, p.estado_pedido, p.total,
               pe.nombre AS cliente_nombre, pe.telefono AS cliente_telefono,
               pe.direccion AS cliente_direccion
        FROM pedido p
        JOIN cliente c ON p.ci_cliente = c.ci_cliente
        JOIN persona pe ON c.ci_cliente = pe.ci
        WHERE p.id_pedido = %s AND p.ci_repartidor = %s
        """,
        (id_pedido, ci_repartidor),
    )
    pedido = cursor.fetchone()

    if not pedido:
        cursor.close()
        return jsonify({"error": "Pedido no encontrado"}), 404

    cursor.execute(
        """
        SELECT dp.cantidad, pr.nombre, pr.precio_unitario, s.nombre AS sucursal_nombre
        FROM detalle_pedido dp
        JOIN producto pr ON dp.id_producto = pr.id_producto
        JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
        WHERE dp.id_pedido = %s
        """,
        (id_pedido,),
    )
    pedido["productos"] = cursor.fetchall()
    cursor.close()

    return jsonify(pedido), 200


@app.route("/api/repartidor/pedidos-disponibles", methods=["GET"])
@jwt_required()
def pedidos_disponibles_repartidor():
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT p.id_pedido, p.fecha, p.total,
               pe.nombre AS cliente_nombre, pe.direccion AS cliente_direccion,
               s.nombre AS sucursal_nombre, n.nombre_negocio
        FROM pedido p
        JOIN cliente c ON p.ci_cliente = c.ci_cliente
        JOIN persona pe ON c.ci_cliente = pe.ci
        JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
        JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
        JOIN negocio n ON s.id_negocio = n.id_negocio
        WHERE p.estado_pedido = 'Pendiente' AND p.ci_repartidor IS NULL
        GROUP BY p.id_pedido, p.fecha, p.total, pe.nombre, pe.direccion, s.nombre, n.nombre_negocio
        ORDER BY p.fecha ASC
        """
    )
    pedidos = cursor.fetchall()

    for p in pedidos:
        cursor.execute(
            """
            SELECT dp.cantidad, pr.nombre, pr.precio_unitario
            FROM detalle_pedido dp
            JOIN producto pr ON dp.id_producto = pr.id_producto
            WHERE dp.id_pedido = %s
            """,
            (p["id_pedido"],),
        )
        p["productos"] = cursor.fetchall()

    cursor.close()
    return jsonify(pedidos), 200


@app.route("/api/repartidor/pedido/<int:id_pedido>/aceptar", methods=["POST"])
@jwt_required()
def aceptar_pedido_repartidor(id_pedido):
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_repartidor = get_jwt_identity()
    cursor = mysql.connection.cursor()

    # Un repartidor no puede aceptar un segundo pedido mientras tenga uno en curso
    cursor.execute(
        "SELECT id_pedido FROM pedido WHERE ci_repartidor = %s AND estado_pedido = 'En Camino'",
        (ci_repartidor,),
    )
    if cursor.fetchone():
        cursor.close()
        return jsonify({"error": "Ya tenés un pedido en curso, no podés aceptar otro."}), 400

    # El pedido debe seguir disponible (por si otro repartidor lo tomó primero)
    cursor.execute(
        "SELECT id_pedido FROM pedido WHERE id_pedido = %s AND estado_pedido = 'Pendiente' AND ci_repartidor IS NULL",
        (id_pedido,),
    )
    if not cursor.fetchone():
        cursor.close()
        return jsonify({"error": "Este pedido ya no está disponible."}), 409

    token = f"{random.randint(0, 99999):05d}"

    # El UPDATE puede ser rechazado por trg_repartidor_un_pedido_activo (ver
    # chaski_db.sql) si, por una condición de carrera, el repartidor ya tomó
    # otro pedido entre el chequeo de arriba y este UPDATE.
    try:
        cursor.execute(
            "UPDATE pedido SET ci_repartidor = %s, estado_pedido = 'En Camino', token = %s WHERE id_pedido = %s",
            (ci_repartidor, token, id_pedido),
        )
    except Exception as e:
        mysql.connection.rollback()
        cursor.close()
        return (
            jsonify({"error": "Ya tenés un pedido en curso, no podés aceptar otro."}),
            400,
        )

    cursor.execute(
        "UPDATE repartidor SET estado_disponible = 'ocupado' WHERE ci_repartidor = %s",
        (ci_repartidor,),
    )
    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Pedido aceptado con éxito", "id_pedido": id_pedido}), 200


@app.route("/api/repartidor/pedido-actual", methods=["GET"])
@jwt_required()
def pedido_actual_repartidor():
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_repartidor = get_jwt_identity()
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT p.id_pedido, p.fecha, p.estado_pedido, p.total,
               pe.nombre AS cliente_nombre, pe.telefono AS cliente_telefono,
               pe.direccion AS cliente_direccion,
               s.nombre AS sucursal_nombre, s.direccion AS sucursal_direccion
        FROM pedido p
        JOIN cliente c ON p.ci_cliente = c.ci_cliente
        JOIN persona pe ON c.ci_cliente = pe.ci
        JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
        JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
        WHERE p.ci_repartidor = %s AND p.estado_pedido = 'En Camino'
        GROUP BY p.id_pedido, p.fecha, p.estado_pedido, p.total, pe.nombre,
                 pe.telefono, pe.direccion, s.nombre, s.direccion
        ORDER BY p.id_pedido DESC
        LIMIT 1
        """,
        (ci_repartidor,),
    )
    pedido = cursor.fetchone()

    if not pedido:
        cursor.close()
        return jsonify({"pedido": None}), 200

    cursor.execute(
        """
        SELECT dp.cantidad, pr.nombre, pr.precio_unitario
        FROM detalle_pedido dp
        JOIN producto pr ON dp.id_producto = pr.id_producto
        WHERE dp.id_pedido = %s
        """,
        (pedido["id_pedido"],),
    )
    pedido["productos"] = cursor.fetchall()
    cursor.close()

    # OJO: nunca devolver el token acá — el repartidor no debe verlo,
    # se lo tiene que dar el cliente en persona al momento de la entrega.
    return jsonify({"pedido": pedido}), 200


@app.route("/api/repartidor/pedido/<int:id_pedido>/confirmar", methods=["POST"])
@jwt_required()
def confirmar_entrega_repartidor(id_pedido):
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_repartidor = get_jwt_identity()
    data = request.get_json()
    token_ingresado = str(data.get("token", "")).strip()

    cursor = mysql.connection.cursor()
    cursor.execute(
        "SELECT token FROM pedido WHERE id_pedido = %s AND ci_repartidor = %s AND estado_pedido = 'En Camino'",
        (id_pedido, ci_repartidor),
    )
    pedido = cursor.fetchone()

    if not pedido:
        cursor.close()
        return jsonify({"error": "Pedido no encontrado o no está en curso."}), 404

    if not token_ingresado or token_ingresado != pedido["token"]:
        cursor.close()
        return jsonify({"error": "El token ingresado no es correcto."}), 400

    cursor.execute(
        "UPDATE pedido SET estado_pedido = 'Entregado' WHERE id_pedido = %s",
        (id_pedido,),
    )

    cursor.execute("SELECT id_factura FROM factura WHERE id_pedido = %s", (id_pedido,))
    if not cursor.fetchone():
        cursor.execute(
            """
            INSERT INTO factura (nit, nro_autorizacion, fecha_emision, tipo_pago, id_pedido, id_reporte)
            VALUES (%s, %s, NOW(), %s, %s, %s)
            """,
            ("123456019", "AUT-2026-001", "Efectivo", id_pedido, 1),
        )

    cursor.execute(
        "UPDATE repartidor SET estado_disponible = 'disponible' WHERE ci_repartidor = %s",
        (ci_repartidor,),
    )

    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Entrega confirmada con éxito. Factura generada."}), 200


@app.route("/api/repartidor/vehiculo", methods=["GET"])
@jwt_required()
def obtener_vehiculo_repartidor():
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_repartidor = get_jwt_identity()
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM vehiculo WHERE ci_repartidor = %s", (ci_repartidor,))
    vehiculo = cursor.fetchone()
    cursor.close()
    return jsonify(vehiculo), 200


@app.route("/api/repartidor/vehiculo", methods=["POST", "PUT"])
@jwt_required()
def guardar_vehiculo_repartidor():
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_repartidor = get_jwt_identity()
    data = request.get_json()
    tipo = data.get("tipo")
    placa = data.get("placa")
    modelo = data.get("modelo")
    color = data.get("color")

    if not tipo or not placa:
        return jsonify({"error": "Faltan datos obligatorios (tipo y placa)"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT ci_repartidor FROM vehiculo WHERE ci_repartidor = %s", (ci_repartidor,))
    existente = cursor.fetchone()

    if existente:
        cursor.execute(
            "UPDATE vehiculo SET tipo = %s, placa = %s, modelo = %s, color = %s WHERE ci_repartidor = %s",
            (tipo, placa, modelo, color, ci_repartidor),
        )
    else:
        cursor.execute(
            "INSERT INTO vehiculo (ci_repartidor, tipo, placa, modelo, color) VALUES (%s, %s, %s, %s, %s)",
            (ci_repartidor, tipo, placa, modelo, color),
        )

    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Vehículo guardado con éxito"}), 200


@app.route("/api/repartidor/estado", methods=["PUT"])
@jwt_required()
def actualizar_estado_repartidor():
    claims = get_jwt()
    if claims.get("rol") != "repartidor":
        return jsonify({"error": "Acceso denegado"}), 403

    nro_repartidor = claims.get("nro_repartidor")
    data = request.get_json()
    nuevo_estado = data.get("estado")

    cursor = mysql.connection.cursor()

    # Verificar si el repartidor tiene pedidos activos antes de permitir cambiar a 'disponible'
    if str(nuevo_estado).lower() == "disponible":
        cursor.execute(
            """
            SELECT p.id_pedido, p.estado_pedido 
            FROM pedido p
            JOIN repartidor r ON p.ci_repartidor = r.ci_repartidor
            WHERE r.nro_repartidor = %s
            """,
            (nro_repartidor,),
        )
        pedidos = cursor.fetchall()
        cursor.close()

        estados_activos = ["pendiente", "en camino", "confirmado"]
        tiene_pedido_activo = any(
            str(p.get("estado_pedido", "")).lower() in estados_activos
            for p in pedidos
        )

        if tiene_pedido_activo:
            return jsonify({
                "error": "No puedes cambiar tu estado a disponible mientras tengas pedidos activos o en camino."
            }), 400

        cursor = mysql.connection.cursor()

    # Actualizar estado
    cursor.execute(
        "UPDATE repartidor SET estado_disponible = %s WHERE nro_repartidor = %s",
        (nuevo_estado, nro_repartidor),
    )
    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Estado actualizado con éxito", "nuevo_estado": nuevo_estado}), 200


@app.route("/api/repartidores/disponibles", methods=["GET"])
@jwt_required()
def listar_repartidores_disponibles():
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT r.nro_repartidor, r.ci_repartidor, p.nombre, p.apepaterno, p.telefono 
        FROM repartidor r
        JOIN persona p ON r.ci_repartidor = p.ci
        WHERE r.estado_disponible = 'disponible'
        """
    )
    repartidores = cursor.fetchall()
    cursor.close()
    return jsonify(repartidores), 200


# ==========================================
# CREAR PEDIDO (el repartidor lo acepta después, ver más abajo)
# ==========================================

@app.route("/api/pedido/crear", methods=["POST"])
@jwt_required()
def crear_pedido():
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    data = request.get_json()

    subtotal_productos = data.get("total", 0)
    id_sucursal = data.get("id_sucursal")
    zona_destino = data.get("zona")
    direccion_pedido = data.get("direccion")
    detalles = data.get("detalles", [])

    if not id_sucursal:
        return jsonify({"error": "Falta la sucursal"}), 400

    cursor = mysql.connection.cursor()

    # 1. Obtener la dirección y la zona por defecto del cliente si no se especifica otra
    cursor.execute(
        """
        SELECT p.direccion, c.zona FROM persona p
        JOIN cliente c ON c.ci_cliente = p.ci
        WHERE p.ci = %s
        """,
        (ci_cliente,),
    )
    cliente_info = cursor.fetchone() or {}
    direccion_defecto = cliente_info.get("direccion") or "Sin dirección registrada"

    if not direccion_pedido or str(direccion_pedido).strip() == "":
        direccion_pedido = direccion_defecto

    if not zona_destino or str(zona_destino).strip() == "":
        zona_destino = cliente_info.get("zona")

    # 2. Buscar la tarifa y el costo según la zona de destino
    id_tarifa = 1
    costo_envio = 10.00

    if zona_destino:
        cursor.execute("SELECT id_tarifa, costo FROM tarifa WHERE zona LIKE %s", (f"%{zona_destino}%",))
        tarifa_info = cursor.fetchone()
        if tarifa_info:
            id_tarifa = tarifa_info["id_tarifa"]
            costo_envio = float(tarifa_info["costo"])

    # 3. Calcular el total final sumando productos + envío
    total_final = float(subtotal_productos) + costo_envio

    # 4. Insertar el pedido SIN repartidor asignado: queda "Pendiente" y disponible
    #    para que cualquier repartidor lo acepte desde "Entregar Pedido"
    cursor.execute(
        """
        INSERT INTO pedido (fecha, estado_pedido, total, ci_cliente, id_tarifa, direccion)
        VALUES (NOW(), 'Pendiente', %s, %s, %s, %s)
        """,
        (total_final, ci_cliente, id_tarifa, direccion_pedido),
    )
    id_pedido = cursor.lastrowid

    # 5. Insertar los detalles del pedido (ajustado exactamente a las columnas que tiene tu tabla detalle_pedido)
    for item in detalles:
        cursor.execute(
            """
            INSERT INTO detalle_pedido (id_pedido, id_producto, id_sucursal, cantidad)
            VALUES (%s, %s, %s, %s)
            """,
            (id_pedido, item.get("id_producto"), id_sucursal, item.get("cantidad", 1)),
        )

    mysql.connection.commit()
    cursor.close()

    return jsonify({
        "mensaje": "Pedido creado con éxito",
        "id_pedido": id_pedido,
        "total_pagar": total_final,
        "direccion": direccion_pedido
    }), 201


@app.route("/api/pedido/<int:id_pedido>/entregar", methods=["PUT"])
@jwt_required()
def entregar_pedido(id_pedido):
    cursor = mysql.connection.cursor()

    # Actualizar estado del pedido
    cursor.execute("UPDATE pedido SET estado_pedido = 'Entregado' WHERE id_pedido = %s", (id_pedido,))

    # Obtener datos del pedido para la factura
    cursor.execute("SELECT total, ci_cliente FROM pedido WHERE id_pedido = %s", (id_pedido,))
    pedido = cursor.fetchone()

    if not pedido:
        cursor.close()
        return jsonify({"error": "Pedido no encontrado"}), 404

    # Generar Factura automáticamente
    cursor.execute(
        """
        INSERT INTO factura (fecha_emision, monto_total, id_pedido, ci_cliente) 
        VALUES (NOW(), %s, %s, %s)
        """,
        (pedido["total"], id_pedido, pedido["ci_cliente"]),
    )
    id_factura = cursor.lastrowid
    mysql.connection.commit()
    cursor.close()

    return jsonify({"mensaje": "Pedido marcado como entregado y factura generada", "id_factura": id_factura}), 200


@app.route("/api/pedido/actualizar/<int:id_pedido>", methods=["PUT", "POST"])
def actualizar_estado_pedido(id_pedido):
    cursor = mysql.connection.cursor()
    try:
        # Cambia 'Entregado' o el estado que corresponda
        cursor.execute(
            """
            UPDATE pedido 
            SET estado_pedido = 'Entregado' 
            WHERE id_pedido = %s
            """,
            (id_pedido,),
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Estado actualizado con éxito"}), 200
    except Exception as e:
        cursor.close()
        return jsonify({"error": str(e)}), 500


# ==========================================
# ENDPOINTS PARA FACTURA
# ==========================================

@app.route("/api/factura/<int:id_pedido>", methods=["GET"])
def ver_factura_detalle(id_pedido):
    cursor = mysql.connection.cursor()

    # Consultamos los datos de la factura uniendo la tabla pedido para obtener el total correcto
    cursor.execute(
        """
        SELECT f.id_factura, f.nit, f.nro_autorizacion, f.fecha_emision, f.tipo_pago,
               p.total, pe.nombre, pe.apepaterno, pe.correo, pe.direccion
        FROM factura f
        JOIN pedido p ON f.id_pedido = p.id_pedido
        JOIN cliente c ON p.ci_cliente = c.ci_cliente
        JOIN persona pe ON c.ci_cliente = pe.ci
        WHERE f.id_pedido = %s
        """,
        (id_pedido,),
    )
    factura = cursor.fetchone()
    cursor.close()

    if not factura:
        return jsonify({"error": "Factura no encontrada para este pedido"}), 404

    return jsonify({
        "id_factura": factura["id_factura"],
        "nit": factura["nit"],
        "nro_autorizacion": factura["nro_autorizacion"],
        "fecha": factura["fecha_emision"],
        "tipo_pago": factura["tipo_pago"],
        "total": factura["total"],
        "cliente": f"{factura['nombre']} {factura['apepaterno'] or ''}",
        "correo": factura["correo"],
        "direccion": factura["direccion"]
    }), 200


# ==========================================
# ENDPOINTS PARA CLIENTES
# ==========================================

@app.route("/api/cliente/perfil", methods=["GET"])
@jwt_required()
def obtener_perfil_cliente():
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT c.ci_cliente, c.nro_cliente, p.nombre, p.apepaterno, p.telefono, p.correo, p.direccion 
        FROM cliente c
        JOIN persona p ON c.ci_cliente = p.ci
        WHERE c.ci_cliente = %s
        """,
        (ci_cliente,),
    )
    cliente = cursor.fetchone()
    cursor.close()

    if not cliente:
        return jsonify({"error": "Cliente no encontrado"}), 404

    # Mapeamos explícitamente las claves para que tu JS encuentre 'apellido' y 'telefono' sin fallar
    return jsonify({
        "nombre": cliente["nombre"],
        "apellido": cliente["apepaterno"] or "",
        "telefono": cliente["telefono"] or "No registrado",
        "correo": cliente["correo"],
        "direccion": cliente["direccion"],
        "nro_cliente": cliente["nro_cliente"]
    }), 200


@app.route("/api/cliente/pedidos", methods=["GET"])
@jwt_required()
def listar_pedidos_cliente():
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT id_pedido, fecha, estado_pedido AS estado, total, token
        FROM pedido
        WHERE ci_cliente = %s
        ORDER BY id_pedido DESC
        """,
        (ci_cliente,),
    )
    pedidos = cursor.fetchall()
    cursor.close()
    return jsonify(pedidos), 200


@app.route("/api/cliente/pedido/<int:id_pedido>", methods=["GET"])
@jwt_required()
def detalle_pedido_cliente(id_pedido):
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT p.id_pedido, p.fecha, p.estado_pedido AS estado, p.total, p.token,
               p.direccion, t.zona
        FROM pedido p
        LEFT JOIN tarifa t ON p.id_tarifa = t.id_tarifa
        WHERE p.id_pedido = %s AND p.ci_cliente = %s
        """,
        (id_pedido, ci_cliente),
    )
    pedido = cursor.fetchone()

    if not pedido:
        cursor.close()
        return jsonify({"error": "Pedido no encontrado"}), 404

    cursor.execute(
        """
        SELECT dp.cantidad, pr.id_producto, pr.nombre, pr.precio_unitario,
               s.nombre AS sucursal_nombre, n.nombre_negocio
        FROM detalle_pedido dp
        JOIN producto pr ON dp.id_producto = pr.id_producto
        JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
        JOIN negocio n ON s.id_negocio = n.id_negocio
        WHERE dp.id_pedido = %s
        """,
        (id_pedido,),
    )
    pedido["productos"] = cursor.fetchall()
    cursor.close()

    return jsonify(pedido), 200


@app.route("/api/productos", methods=["GET"])
@jwt_required()
def listar_todos_los_productos():
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT pr.id_producto, pr.nombre AS nombre_producto, pr.descripcion,
               pr.precio_unitario AS precio, pr.stock_producto AS stock,
               s.id_sucursal, s.nombre AS sucursal_nombre,
               n.id_negocio, n.nombre_negocio
        FROM producto pr
        JOIN cuenta_con cc ON pr.id_producto = cc.id_producto
        JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
        JOIN negocio n ON s.id_negocio = n.id_negocio
        ORDER BY pr.id_producto DESC
        """
    )
    productos = cursor.fetchall()
    cursor.close()
    return jsonify(productos), 200


@app.route("/api/buscar", methods=["GET"])
@jwt_required()
def buscar_productos_y_negocios():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"productos": [], "negocios": []}), 200

    patron = f"%{q}%"
    cursor = mysql.connection.cursor()

    cursor.execute(
        """
        SELECT pr.id_producto, pr.nombre AS nombre_producto, pr.descripcion,
               pr.precio_unitario AS precio, pr.stock_producto AS stock,
               s.id_sucursal, s.nombre AS sucursal_nombre,
               n.id_negocio, n.nombre_negocio
        FROM producto pr
        JOIN cuenta_con cc ON pr.id_producto = cc.id_producto
        JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
        JOIN negocio n ON s.id_negocio = n.id_negocio
        WHERE pr.nombre LIKE %s
        ORDER BY pr.id_producto DESC
        """,
        (patron,),
    )
    productos = cursor.fetchall()

    cursor.execute(
        """
        SELECT n.id_negocio, n.nombre_negocio, n.correo_negocio,
               COUNT(s.id_sucursal) AS cantidad_sucursales
        FROM negocio n
        LEFT JOIN sucursal s ON s.id_negocio = n.id_negocio
        WHERE n.nombre_negocio LIKE %s
        GROUP BY n.id_negocio, n.nombre_negocio, n.correo_negocio
        """,
        (patron,),
    )
    negocios = cursor.fetchall()
    cursor.close()

    return jsonify({"productos": productos, "negocios": negocios}), 200


@app.route("/api/cliente/favoritos", methods=["GET"])
@jwt_required()
def listar_favoritos_cliente():
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT pr.id_producto, pr.nombre AS nombre_producto, pr.descripcion,
               pr.precio_unitario AS precio, pr.stock_producto AS stock,
               s.id_sucursal, s.nombre AS sucursal_nombre,
               n.id_negocio, n.nombre_negocio
        FROM favorito f
        JOIN producto pr ON f.id_producto = pr.id_producto
        JOIN cuenta_con cc ON pr.id_producto = cc.id_producto
        JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
        JOIN negocio n ON s.id_negocio = n.id_negocio
        WHERE f.ci_cliente = %s
        ORDER BY f.fecha_agregado DESC
        """,
        (ci_cliente,),
    )
    favoritos = cursor.fetchall()
    cursor.close()
    return jsonify(favoritos), 200


@app.route("/api/cliente/favoritos", methods=["POST"])
@jwt_required()
def agregar_favorito_cliente():
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    data = request.get_json()
    id_producto = data.get("id_producto")

    if not id_producto:
        return jsonify({"error": "Falta el ID del producto"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        "INSERT IGNORE INTO favorito (ci_cliente, id_producto) VALUES (%s, %s)",
        (ci_cliente, id_producto),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Producto agregado a favoritos"}), 201


@app.route("/api/cliente/favoritos/<int:id_producto>", methods=["DELETE"])
@jwt_required()
def quitar_favorito_cliente(id_producto):
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403

    ci_cliente = claims.get("ci_cliente")
    cursor = mysql.connection.cursor()
    cursor.execute(
        "DELETE FROM favorito WHERE ci_cliente = %s AND id_producto = %s",
        (ci_cliente, id_producto),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Producto quitado de favoritos"}), 200


@app.route("/api/negocios", methods=["GET"])
@jwt_required()
def listar_negocios():
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT n.id_negocio, n.nombre_negocio, n.correo_negocio,
               COUNT(s.id_sucursal) AS cantidad_sucursales
        FROM negocio n
        LEFT JOIN sucursal s ON s.id_negocio = n.id_negocio
        GROUP BY n.id_negocio, n.nombre_negocio, n.correo_negocio
        """
    )
    negocios = cursor.fetchall()
    cursor.close()
    return jsonify(negocios), 200


@app.route("/api/negocio/<int:id_negocio>/sucursales", methods=["GET"])
@jwt_required()
def listar_sucursales_de_negocio(id_negocio):
    cursor = mysql.connection.cursor()
    cursor.execute(
        "SELECT id_negocio, nombre_negocio FROM negocio WHERE id_negocio = %s",
        (id_negocio,),
    )
    negocio = cursor.fetchone()

    if not negocio:
        cursor.close()
        return jsonify({"error": "Negocio no encontrado"}), 404

    cursor.execute(
        "SELECT id_sucursal, nombre AS nombre_sucursal, direccion, telefono FROM sucursal WHERE id_negocio = %s",
        (id_negocio,),
    )
    sucursales = cursor.fetchall()
    cursor.close()

    return jsonify({"negocio": negocio, "sucursales": sucursales}), 200


@app.route("/api/sucursales", methods=["GET"])
@jwt_required()
def listar_sucursales():
    cursor = mysql.connection.cursor()
    # Usamos AS nombre_sucursal para que el botón de HTML lo lea correctamente en vez de undefined
    cursor.execute("SELECT id_sucursal, nombre AS nombre_sucursal, direccion, telefono FROM sucursal")
    sucursales = cursor.fetchall()
    cursor.close()
    return jsonify(sucursales), 200


@app.route("/api/sucursal/<int:id_sucursal>/productos", methods=["GET"])
@jwt_required()
def productos_por_sucursal(id_sucursal):
    cursor = mysql.connection.cursor()
    # Usamos la relación correcta con la tabla 'cuenta_con' y columnas reales de 'producto'
    cursor.execute(
        """
        SELECT p.id_producto, p.nombre AS nombre_producto, p.precio_unitario AS precio, p.stock_producto AS stock 
        FROM producto p
        JOIN cuenta_con cc ON p.id_producto = cc.id_producto
        WHERE cc.id_sucursal = %s
        """,
        (id_sucursal,),
    )
    productos = cursor.fetchall()
    cursor.close()
    return jsonify(productos), 200


# ==========================================
# ENDPOINTS PARA SUPER USUARIO ADMINISTRADOR
# ==========================================

def _admin_o_403():
    claims = get_jwt()
    if claims.get("rol") != "admin":
        return jsonify({"error": "Acceso denegado"}), 403
    return None


@app.route("/api/admin/dashboard", methods=["GET"])
@jwt_required()
def admin_dashboard():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT COUNT(*) AS total FROM cliente")
    total_clientes = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) AS total FROM negocio")
    total_negocios = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) AS total FROM repartidor")
    total_repartidores = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) AS total FROM producto")
    total_productos = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) AS total FROM pedido")
    total_pedidos = cursor.fetchone()["total"]
    cursor.execute(
        "SELECT SUM(total) AS total FROM pedido WHERE estado_pedido = 'Entregado'"
    )
    ventas_res = cursor.fetchone()
    ventas_totales = float(ventas_res["total"]) if ventas_res and ventas_res["total"] else 0.0
    cursor.close()

    return (
        jsonify({
            "total_clientes": total_clientes,
            "total_negocios": total_negocios,
            "total_repartidores": total_repartidores,
            "total_productos": total_productos,
            "total_pedidos": total_pedidos,
            "ventas_totales": ventas_totales,
        }),
        200,
    )


# --- Personas (gestión general) ---

@app.route("/api/admin/personas", methods=["GET"])
@jwt_required()
def admin_listar_personas():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT p.ci, p.nombre, p.apepaterno, p.telefono, p.correo, p.direccion,
               CASE
                   WHEN c.ci_cliente IS NOT NULL THEN 'cliente'
                   WHEN n.ci_dueno IS NOT NULL THEN 'negocio'
                   WHEN r.ci_repartidor IS NOT NULL THEN 'repartidor'
                   WHEN a.ci_admin IS NOT NULL THEN 'admin'
                   ELSE 'sin rol'
               END AS rol
        FROM persona p
        LEFT JOIN cliente c ON c.ci_cliente = p.ci
        LEFT JOIN negocio n ON n.ci_dueno = p.ci
        LEFT JOIN repartidor r ON r.ci_repartidor = p.ci
        LEFT JOIN administrador a ON a.ci_admin = p.ci
        ORDER BY p.nombre
        """
    )
    personas = cursor.fetchall()
    cursor.close()
    return jsonify(personas), 200


@app.route("/api/admin/persona/<int:ci>", methods=["PUT"])
@jwt_required()
def admin_editar_persona(ci):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")

    if not nombre or not correo:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        UPDATE persona SET nombre = %s, apepaterno = %s, telefono = %s, correo = %s, direccion = %s
        WHERE ci = %s
        """,
        (nombre, apepaterno, telefono, correo, direccion, ci),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Persona actualizada con éxito"}), 200


@app.route("/api/admin/persona/<int:ci>", methods=["DELETE"])
@jwt_required()
def admin_eliminar_persona(ci):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("DELETE FROM favorito WHERE ci_cliente = %s", (ci,))
        cursor.execute("DELETE FROM vehiculo WHERE ci_repartidor = %s", (ci,))
        cursor.execute("DELETE FROM cliente WHERE ci_cliente = %s", (ci,))
        cursor.execute("DELETE FROM repartidor WHERE ci_repartidor = %s", (ci,))
        cursor.execute("DELETE FROM administrador WHERE ci_admin = %s", (ci,))
        cursor.execute("DELETE FROM persona WHERE ci = %s", (ci,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Persona eliminada con éxito"}), 200
    except Exception:
        mysql.connection.rollback()
        cursor.close()
        return (
            jsonify({
                "error": "No se puede eliminar: la persona tiene registros asociados (pedidos, negocio, etc.)"
            }),
            400,
        )


# --- Clientes ---

@app.route("/api/admin/clientes", methods=["GET"])
@jwt_required()
def admin_listar_clientes():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT c.ci_cliente, c.nro_cliente, c.zona, p.nombre, p.apepaterno, p.telefono, p.correo, p.direccion
        FROM cliente c
        JOIN persona p ON c.ci_cliente = p.ci
        ORDER BY p.nombre
        """
    )
    clientes = cursor.fetchall()
    cursor.close()
    return jsonify(clientes), 200


@app.route("/api/admin/cliente", methods=["POST"])
@jwt_required()
def admin_crear_cliente():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    ci = data.get("ci")
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")
    contrasena = data.get("contrasena")
    zona = data.get("zona")

    if not ci or not nombre or not correo or not contrasena:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT ci FROM persona WHERE ci = %s OR correo = %s", (ci, correo))
    if cursor.fetchone():
        cursor.close()
        return jsonify({"error": "Ya existe una cuenta con ese CI o correo"}), 409

    cursor.execute(
        "INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES (%s, %s, %s, %s, %s, %s)",
        (ci, nombre, apepaterno, telefono, correo, direccion),
    )
    cursor.execute(
        "INSERT INTO cliente (ci_cliente, contrasena, zona) VALUES (%s, %s, %s)",
        (ci, hash_contrasena(contrasena), zona),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Cliente creado con éxito"}), 201


@app.route("/api/admin/cliente/<int:ci>", methods=["PUT"])
@jwt_required()
def admin_editar_cliente(ci):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")
    contrasena = data.get("contrasena")
    zona = data.get("zona")

    if not nombre or not correo:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        "UPDATE persona SET nombre = %s, apepaterno = %s, telefono = %s, correo = %s, direccion = %s WHERE ci = %s",
        (nombre, apepaterno, telefono, correo, direccion, ci),
    )
    cursor.execute("UPDATE cliente SET zona = %s WHERE ci_cliente = %s", (zona, ci))
    if contrasena:
        cursor.execute(
            "UPDATE cliente SET contrasena = %s WHERE ci_cliente = %s",
            (hash_contrasena(contrasena), ci),
        )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Cliente actualizado con éxito"}), 200


@app.route("/api/admin/cliente/<int:ci>", methods=["DELETE"])
@jwt_required()
def admin_eliminar_cliente(ci):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("DELETE FROM favorito WHERE ci_cliente = %s", (ci,))
        cursor.execute("DELETE FROM cliente WHERE ci_cliente = %s", (ci,))
        cursor.execute("DELETE FROM persona WHERE ci = %s", (ci,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Cliente eliminado con éxito"}), 200
    except Exception:
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": "No se puede eliminar: el cliente tiene pedidos asociados"}), 400


# --- Repartidores ---

@app.route("/api/admin/repartidores", methods=["GET"])
@jwt_required()
def admin_listar_repartidores():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT r.ci_repartidor, r.nro_repartidor, r.nro_licencia, r.estado_disponible, r.fecha_registro,
               p.nombre, p.apepaterno, p.telefono, p.correo, p.direccion
        FROM repartidor r
        JOIN persona p ON r.ci_repartidor = p.ci
        ORDER BY p.nombre
        """
    )
    repartidores = cursor.fetchall()
    cursor.close()
    return jsonify(repartidores), 200


@app.route("/api/admin/repartidor", methods=["POST"])
@jwt_required()
def admin_crear_repartidor():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    ci = data.get("ci")
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")
    contrasena = data.get("contrasena")
    nro_licencia = data.get("nro_licencia")

    if not ci or not nombre or not correo or not contrasena:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT ci FROM persona WHERE ci = %s OR correo = %s", (ci, correo))
    if cursor.fetchone():
        cursor.close()
        return jsonify({"error": "Ya existe una cuenta con ese CI o correo"}), 409

    cursor.execute(
        "INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES (%s, %s, %s, %s, %s, %s)",
        (ci, nombre, apepaterno, telefono, correo, direccion),
    )
    cursor.execute(
        "INSERT INTO repartidor (ci_repartidor, contrasena, nro_licencia) VALUES (%s, %s, %s)",
        (ci, hash_contrasena(contrasena), nro_licencia),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Repartidor creado con éxito"}), 201


@app.route("/api/admin/repartidor/<int:ci>", methods=["PUT"])
@jwt_required()
def admin_editar_repartidor(ci):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")
    contrasena = data.get("contrasena")
    nro_licencia = data.get("nro_licencia")
    estado_disponible = data.get("estado_disponible")

    if not nombre or not correo:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        "UPDATE persona SET nombre = %s, apepaterno = %s, telefono = %s, correo = %s, direccion = %s WHERE ci = %s",
        (nombre, apepaterno, telefono, correo, direccion, ci),
    )
    cursor.execute(
        "UPDATE repartidor SET nro_licencia = %s, estado_disponible = COALESCE(%s, estado_disponible) WHERE ci_repartidor = %s",
        (nro_licencia, estado_disponible, ci),
    )
    if contrasena:
        cursor.execute(
            "UPDATE repartidor SET contrasena = %s WHERE ci_repartidor = %s",
            (hash_contrasena(contrasena), ci),
        )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Repartidor actualizado con éxito"}), 200


@app.route("/api/admin/repartidor/<int:ci>", methods=["DELETE"])
@jwt_required()
def admin_eliminar_repartidor(ci):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("DELETE FROM vehiculo WHERE ci_repartidor = %s", (ci,))
        cursor.execute("DELETE FROM repartidor WHERE ci_repartidor = %s", (ci,))
        cursor.execute("DELETE FROM persona WHERE ci = %s", (ci,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Repartidor eliminado con éxito"}), 200
    except Exception:
        mysql.connection.rollback()
        cursor.close()
        return (
            jsonify({"error": "No se puede eliminar: el repartidor tiene pedidos asociados"}),
            400,
        )


# --- Negocios ---

@app.route("/api/admin/negocios", methods=["GET"])
@jwt_required()
def admin_listar_negocios():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT n.id_negocio, n.nombre_negocio, n.correo_negocio, n.ci_dueno,
               p.nombre AS nombre_dueno, p.apepaterno AS apepaterno_dueno, p.telefono AS telefono_dueno,
               (SELECT COUNT(*) FROM sucursal s WHERE s.id_negocio = n.id_negocio) AS total_sucursales
        FROM negocio n
        JOIN persona p ON n.ci_dueno = p.ci
        ORDER BY n.nombre_negocio
        """
    )
    negocios = cursor.fetchall()
    cursor.close()
    return jsonify(negocios), 200


@app.route("/api/admin/negocio", methods=["POST"])
@jwt_required()
def admin_crear_negocio():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    ci = data.get("ci")
    nombre = data.get("nombre")
    apepaterno = data.get("apepaterno")
    telefono = data.get("telefono")
    correo = data.get("correo")
    direccion = data.get("direccion")
    nombre_negocio = data.get("nombre_negocio")
    correo_negocio = data.get("correo_negocio")
    contrasena = data.get("contrasena")

    if not (
        ci and nombre and correo and nombre_negocio and correo_negocio and contrasena
    ):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT ci FROM persona WHERE ci = %s", (ci,))
    persona_existe = cursor.fetchone()

    if not persona_existe:
        cursor.execute("SELECT ci FROM persona WHERE correo = %s", (correo,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Ya existe una cuenta con ese correo"}), 409
        cursor.execute(
            "INSERT INTO persona (ci, nombre, apepaterno, telefono, correo, direccion) VALUES (%s, %s, %s, %s, %s, %s)",
            (ci, nombre, apepaterno, telefono, correo, direccion),
        )

    cursor.execute("SELECT id_negocio FROM negocio WHERE correo_negocio = %s", (correo_negocio,))
    if cursor.fetchone():
        mysql.connection.rollback()
        cursor.close()
        return jsonify({"error": "Ya existe un negocio con ese correo"}), 409

    cursor.execute(
        "INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio, contrasena) VALUES (%s, %s, %s, %s)",
        (nombre_negocio, ci, correo_negocio, hash_contrasena(contrasena)),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Negocio creado con éxito"}), 201


@app.route("/api/admin/negocio/<int:id_negocio>", methods=["PUT"])
@jwt_required()
def admin_editar_negocio(id_negocio):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    nombre_negocio = data.get("nombre_negocio")
    correo_negocio = data.get("correo_negocio")
    contrasena = data.get("contrasena")

    if not nombre_negocio or not correo_negocio:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    if contrasena:
        cursor.execute(
            "UPDATE negocio SET nombre_negocio = %s, correo_negocio = %s, contrasena = %s WHERE id_negocio = %s",
            (nombre_negocio, correo_negocio, hash_contrasena(contrasena), id_negocio),
        )
    else:
        cursor.execute(
            "UPDATE negocio SET nombre_negocio = %s, correo_negocio = %s WHERE id_negocio = %s",
            (nombre_negocio, correo_negocio, id_negocio),
        )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Negocio actualizado con éxito"}), 200


@app.route("/api/admin/negocio/<int:id_negocio>", methods=["DELETE"])
@jwt_required()
def admin_eliminar_negocio(id_negocio):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("SELECT id_sucursal FROM sucursal WHERE id_negocio = %s", (id_negocio,))
        sucursales = cursor.fetchall()
        for suc in sucursales:
            cursor.execute(
                "DELETE FROM cuenta_con WHERE id_sucursal = %s", (suc["id_sucursal"],)
            )
        cursor.execute("DELETE FROM sucursal WHERE id_negocio = %s", (id_negocio,))
        cursor.execute("DELETE FROM negocio WHERE id_negocio = %s", (id_negocio,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Negocio eliminado con éxito"}), 200
    except Exception:
        mysql.connection.rollback()
        cursor.close()
        return (
            jsonify({
                "error": "No se puede eliminar: el negocio tiene pedidos asociados a sus sucursales"
            }),
            400,
        )


# --- Productos (a través de todos los negocios) ---

@app.route("/api/admin/sucursales", methods=["GET"])
@jwt_required()
def admin_listar_sucursales():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT s.id_sucursal, s.nombre, n.nombre_negocio
        FROM sucursal s
        JOIN negocio n ON s.id_negocio = n.id_negocio
        ORDER BY n.nombre_negocio, s.nombre
        """
    )
    sucursales = cursor.fetchall()
    cursor.close()
    return jsonify(sucursales), 200


@app.route("/api/admin/productos", methods=["GET"])
@jwt_required()
def admin_listar_productos():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT DISTINCT p.id_producto, p.nombre, p.descripcion, p.precio_unitario, p.stock_producto,
               s.id_sucursal, s.nombre AS sucursal_nombre, n.nombre_negocio
        FROM producto p
        JOIN cuenta_con cc ON p.id_producto = cc.id_producto
        JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
        JOIN negocio n ON s.id_negocio = n.id_negocio
        ORDER BY n.nombre_negocio, p.nombre
        """
    )
    productos = cursor.fetchall()
    cursor.close()
    return jsonify(productos), 200


@app.route("/api/admin/producto", methods=["POST"])
@jwt_required()
def admin_crear_producto():
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    nombre = data.get("nombre")
    descripcion = data.get("descripcion")
    precio = data.get("precio_unitario")
    stock = data.get("stock_producto")
    id_sucursal = data.get("id_sucursal")

    if not nombre or not precio or not id_sucursal:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        "INSERT INTO producto (nombre, descripcion, precio_unitario, stock_producto) VALUES (%s, %s, %s, %s)",
        (nombre, descripcion, precio, stock or 0),
    )
    nuevo_id_producto = cursor.lastrowid
    cursor.execute(
        "INSERT INTO cuenta_con (id_sucursal, id_producto) VALUES (%s, %s)",
        (id_sucursal, nuevo_id_producto),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Producto creado con éxito"}), 201


@app.route("/api/admin/producto/<int:id_producto>", methods=["PUT"])
@jwt_required()
def admin_editar_producto(id_producto):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    data = request.get_json()
    nombre = data.get("nombre")
    descripcion = data.get("descripcion")
    precio = data.get("precio_unitario")
    stock = data.get("stock_producto")

    if not nombre or not precio:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute(
        "UPDATE producto SET nombre = %s, descripcion = %s, precio_unitario = %s, stock_producto = %s WHERE id_producto = %s",
        (nombre, descripcion, precio, stock or 0, id_producto),
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Producto actualizado con éxito"}), 200


@app.route("/api/admin/producto/<int:id_producto>", methods=["DELETE"])
@jwt_required()
def admin_eliminar_producto(id_producto):
    denegado = _admin_o_403()
    if denegado:
        return denegado

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("DELETE FROM favorito WHERE id_producto = %s", (id_producto,))
        cursor.execute("DELETE FROM cuenta_con WHERE id_producto = %s", (id_producto,))
        cursor.execute("DELETE FROM producto WHERE id_producto = %s", (id_producto,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"mensaje": "Producto eliminado con éxito"}), 200
    except Exception:
        mysql.connection.rollback()
        cursor.close()
        return (
            jsonify({"error": "No se puede eliminar: el producto tiene pedidos asociados"}),
            400,
        )


# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "True").lower() in ("1", "true", "yes")
    port = int(os.environ.get("FLASK_PORT", 5000))
    app.run(debug=debug, port=port)