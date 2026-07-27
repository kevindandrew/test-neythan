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
from werkzeug.security import check_password_hash

app = Flask(__name__)
CORS(app)

# ==========================================
# CONFIGURACIÓN
# ==========================================

# Configuración de la base de datos MySQL
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = ""  # Pon tu contraseña de MySQL si la tienes
app.config["MYSQL_DB"] = "chaskiDB"
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

# Configuración de JWT
app.config["JWT_SECRET_KEY"] = "chaski-secret-key-muy-segura"

mysql = MySQL(app)
jwt = JWTManager(app)


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
            SELECT c.*, p.nombre, p.correo FROM cliente c
            JOIN persona p ON c.ci_cliente = p.ci
            WHERE p.correo = %s
        """,
        (correo,),
    )
    cliente = cursor.fetchone()

    if cliente:
        # Validación única y limpia (comparación directa para texto plano)
        if cliente["contrasena"] != contrasena:
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
        if contrasena != "123456":
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
        if repartidor["contrasena"] != contrasena:
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

    cursor.close()
    return jsonify({"error": "Usuario no encontrado"}), 404


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

    if not ci or not nombre or not correo or (rol != "negocio" and not contrasena):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    if rol == "negocio" and not nombre_negocio:
        return jsonify({"error": "Falta el nombre del negocio"}), 400

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
        cursor.execute(
            "INSERT INTO cliente (ci_cliente, contrasena) VALUES (%s, %s)",
            (ci, contrasena),
        )
    elif rol == "repartidor":
        nro_licencia = data.get("nro_licencia")
        cursor.execute(
            "INSERT INTO repartidor (ci_repartidor, contrasena, nro_licencia) VALUES (%s, %s, %s)",
            (ci, contrasena, nro_licencia),
        )
    elif rol == "negocio":
        cursor.execute(
            "INSERT INTO negocio (nombre_negocio, ci_dueno, correo_negocio) VALUES (%s, %s, %s)",
            (nombre_negocio, ci, correo),
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

    # 1. Datos del negocio
    cursor.execute(
        "SELECT * FROM negocio WHERE id_negocio = %s",
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

    # 5. Ganancias totales
    cursor.execute(
        """
            SELECT SUM(p.total) as total_ganancias FROM pedido p
            JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            JOIN sucursal s ON dp.id_sucursal = s.id_sucursal
            WHERE s.id_negocio = %s
        """,
        (id_negocio,),
    )
    ganancias = cursor.fetchone()

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
        }),
        200,
    )


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

        # 4. Ganancias totales de la sucursal
        cursor.execute(
            """
            SELECT SUM(p.total) as ganancias 
            FROM pedido p
            JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            WHERE dp.id_sucursal = %s
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

    # 2. Obtener todos los pedidos asignados
    cursor.execute(
        """
        SELECT p.id_pedido, p.fecha, p.estado_pedido, p.total 
        FROM pedido p
        JOIN repartidor r ON p.ci_repartidor = r.ci_repartidor
        WHERE r.nro_repartidor = %s
        """,
        (nro_repartidor,),
    )
    pedidos = cursor.fetchall()
    cursor.close()

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
# CAMBIAR ESTADO DE PEDIDO Y GENERAR FACTURA
# ==========================================

@app.route('/api/pedido/estado', methods=['PUT'])
@jwt_required()
def cambiar_estado_pedido():
    claims = get_jwt()
    if claims.get("rol") != "cliente":
        return jsonify({"error": "Acceso denegado"}), 403
    data = request.get_json()
    id_pedido = data.get('id_pedido')
    nuevo_estado = data.get('estado', 'Entregado')
    if not id_pedido:
        return jsonify({"error": "Falta el ID del pedido"}), 400
    cursor = mysql.connection.cursor()

    # 1. Actualizar el estado del pedido
    cursor.execute(
        "UPDATE pedido SET estado_pedido = %s WHERE id_pedido = %s",
        (nuevo_estado, id_pedido)
    )

    # 2. Si el pedido se marca como Entregado o Terminado, generamos la factura automáticamente
    #    y liberamos al repartidor para que quede disponible para nuevos pedidos
    if str(nuevo_estado).lower() in ['entregado', 'terminado']:
        cursor.execute("SELECT total, ci_cliente, ci_repartidor FROM pedido WHERE id_pedido = %s", (id_pedido,))
        pedido = cursor.fetchone()

        if pedido:
            # Evitar duplicar factura si ya existe una para este pedido
            cursor.execute("SELECT id_factura FROM factura WHERE id_pedido = %s", (id_pedido,))
            factura_existente = cursor.fetchone()

            if not factura_existente:
                # Insertamos usando las columnas reales de tu tabla factura (nit, nro_autorizacion, fecha_emision, tipo_pago, id_pedido, id_reporte)
                cursor.execute(
                    """
                    INSERT INTO factura (nit, nro_autorizacion, fecha_emision, tipo_pago, id_pedido, id_reporte)
                    VALUES (%s, %s, NOW(), %s, %s, %s)
                    """,
                    ("123456019", "AUT-2026-001", "Efectivo", id_pedido, 1)
                )

            if pedido.get("ci_repartidor"):
                cursor.execute(
                    "UPDATE repartidor SET estado_disponible = 'disponible' WHERE ci_repartidor = %s",
                    (pedido["ci_repartidor"],),
                )
    mysql.connection.commit()
    cursor.close()
    return jsonify({"mensaje": "Estado actualizado con éxito y factura generada"}), 200


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
    ci_repartidor = data.get("ci_repartidor")
    zona_destino = data.get("zona")
    direccion_pedido = data.get("direccion")
    detalles = data.get("detalles", [])

    if not id_sucursal or not ci_repartidor:
        return jsonify({"error": "Faltan datos obligatorios (sucursal o repartidor)"}), 400

    cursor = mysql.connection.cursor()

    # 1. Obtener la dirección por defecto del usuario si no se especifica otra
    cursor.execute("SELECT direccion FROM persona WHERE ci = %s", (ci_cliente,))
    persona_info = cursor.fetchone()
    direccion_defecto = persona_info["direccion"] if persona_info and persona_info["direccion"] else "Sin dirección registrada"

    if not direccion_pedido or str(direccion_pedido).strip() == "":
        direccion_pedido = direccion_defecto

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

    # 4. Cambiar estado del repartidor seleccionado a ocupado
    cursor.execute("UPDATE repartidor SET estado_disponible = 'ocupado' WHERE ci_repartidor = %s", (ci_repartidor,))

    # 5. Insertar el pedido principal con el total calculado y su tarifa
    cursor.execute(
        """
        INSERT INTO pedido (fecha, estado_pedido, total, ci_cliente, ci_repartidor, id_tarifa) 
        VALUES (NOW(), 'Pendiente', %s, %s, %s, %s)
        """,
        (total_final, ci_cliente, ci_repartidor, id_tarifa),
    )
    id_pedido = cursor.lastrowid

    # 6. Insertar los detalles del pedido (ajustado exactamente a las columnas que tiene tu tabla detalle_pedido)
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
        SELECT id_pedido, fecha, estado_pedido AS estado, total 
        FROM pedido 
        WHERE ci_cliente = %s
        ORDER BY id_pedido DESC
        """,
        (ci_cliente,),
    )
    pedidos = cursor.fetchall()
    cursor.close()
    return jsonify(pedidos), 200


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
# MAIN
# ==========================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)