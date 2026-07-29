# Chaski Delivery

App de delivery con tres roles: **cliente**, **dueño de negocio** y **repartidor**. El cliente elige un negocio, ve sus sucursales, arma un pedido con carrito y elige un repartidor disponible; el negocio administra sus productos, sucursales y ve sus ganancias; el repartidor gestiona su disponibilidad y ve el detalle de sus entregas.

## Stack

- **Backend**: Python + Flask + MySQL (JWT para autenticación, contraseñas hasheadas con bcrypt)
- **Frontend**: React + Vite + Tailwind CSS
- El backend expone una API en `http://localhost:5000` y el frontend corre aparte en `http://localhost:5173`. Son dos servidores separados que corren al mismo tiempo.

## Requisitos previos

Instalá esto antes de arrancar:

- **Python 3.10+** (con `pip`)
- **Node.js 18+** (con `npm`)
- **MySQL** — la forma más fácil es con [XAMPP](https://www.apachefriends.org/), que trae MySQL listo para usar. Solo necesitás el módulo de MySQL corriendo, **no hace falta Apache**.

## 1. Cloná el repositorio

```bash
git clone <url-del-repo>
cd Chaski_app
```

## 2. Base de datos

Arrancá MySQL primero (si usás XAMPP, abrí el panel de control y iniciá el módulo **MySQL**). Después, para crear la base e importar `chaski_db.sql`, elegí una de estas dos opciones según lo que tengas instalado.

> El script crea la base `chaskiDB`, todas las tablas y datos de prueba (usuarios, negocios, sucursales, productos).

### Opción A — Por línea de comandos (XAMPP o MySQL con el cliente en el PATH)

Parado en la raíz del proyecto (donde está `chaski_db.sql`):

```
mysql -u root --default-character-set=utf8mb4 -e "source chaski_db.sql"
```

> ⚠️ **Importante si estás en Windows**: usá el comando de arriba tal cual, con `-e "source ..."`, y **no** la forma `mysql -u root < chaski_db.sql`. Esa redirección con `<` funciona en cmd.exe y en bash, pero **no existe en PowerShell** (tira el error `El operador '<' está reservado para uso futuro`) — y PowerShell es la terminal que abre Windows por defecto. El comando con `source` funciona igual en cmd, PowerShell y bash, así que evitás el problema directamente.

Si te tira `mysql no se reconoce como un comando` (no tenés el cliente en el PATH — típico si solo instalaste XAMPP o solo MySQL Workbench sin el Server), usá la ruta completa al ejecutable en vez de solo `mysql`, ajustando según dónde lo tengas instalado:

```
"C:\xampp\mysql\bin\mysql.exe" -u root --default-character-set=utf8mb4 -e "source chaski_db.sql"
```

Si no tenés XAMPP y tampoco encontrás el ejecutable, probá con la opción B de abajo.

### Opción B — Con MySQL Workbench (sin usar la terminal)

Si tenés Workbench instalado, es más simple importar el archivo directo desde ahí:

1. Abrí MySQL Workbench y conectate a tu servidor local (la conexión que ya tengas configurada, normalmente `root` + tu contraseña).
2. Andá a **File → Open SQL Script...** y seleccioná el archivo `chaski_db.sql` del proyecto.
3. Ejecutá el script completo con el botón del rayo ⚡ (o `Ctrl+Shift+Enter`).
4. Debería correr sin errores y crear la base `chaskiDB` con todas las tablas y datos de prueba. Si ves un error de sintaxis, revisá que se haya abierto el archivo completo y no una selección parcial.

> Nota: si usás la Opción A por línea de comandos y tu MySQL tiene contraseña para `root`, agregá `-p` al comando y te la va a pedir.

### Configurá las variables de entorno

El backend lee su configuración (conexión a MySQL, clave de JWT, puerto) desde un archivo `.env` en la raíz del proyecto. Ese archivo **no se sube a git** porque tiene datos sensibles/locales — cada uno crea el suyo copiando la plantilla:

```bash
cp .env.example .env
```

Por defecto ya funciona con XAMPP (usuario `root`, sin contraseña, `localhost`). Si tu MySQL tiene otra configuración, editá `.env`:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=       # poné tu contraseña acá si tenés una
MYSQL_DB=chaskiDB
JWT_SECRET_KEY=chaski-secret-key-muy-segura
FLASK_DEBUG=True
FLASK_PORT=5000
```

## 3. Backend (Flask)

Desde la raíz del proyecto:

```bash
pip install -r requirements.txt
python app.py
```

Esto levanta la API en `http://localhost:5000`. Dejalo corriendo en esta terminal.

> **Nota para Windows**: `mysqlclient` (una de las dependencias) a veces falla al instalar porque necesita compilar. Si te da error, probá `pip install --upgrade pip` primero y volvé a intentar — para Python 3.11+ suele haber wheels precompilados y no debería hacer falta compilar nada.

## 4. Frontend (React)

Abrí **otra terminal** (dejando la anterior con Flask corriendo) y andá a la carpeta `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Esto levanta la app en `http://localhost:5173` — esa es la URL que tenés que abrir en el navegador (no la 5000, esa es solo la API).

## Resumen para correrlo día a día

Una vez que ya instalaste todo (pasos 2-4 hechos una sola vez), para levantar el proyecto solo necesitás:

```bash
# Terminal 1 (raíz del proyecto)
python app.py

# Terminal 2 (carpeta frontend/)
npm run dev
```

Y con MySQL corriendo (XAMPP abierto con el módulo MySQL iniciado).

## Usuarios de prueba

Todas las contraseñas de las cuentas de prueba son `123456`, excepto el Super Administrador.

| Rol | Correo | Contraseña | Notas |
|---|---|---|---|
| Cliente | `cliente@chaski.com` | `123456` | Juan Perez |
| Dueño de negocio | `negocio@chaski.com` | `123456` | Negocio "El Buen Sabor", 1 sucursal |
| Dueño de negocio | `pizzanostra@chaski.com` | `123456` | Negocio "Pizza Nostra", 2 sucursales |
| Dueño de negocio | `sushiichiban@chaski.com` | `123456` | Negocio "Sushi Ichiban", 2 sucursales |
| Repartidor | `repartidor@chaski.com` | `123456` | Carlos Gomez |
| Super Administrador | `admin@chaski.com` | `admin123` | Gestiona personas, clientes, repartidores, negocios y productos |

También podés crear cuentas nuevas desde la pantalla de login (botón "Creá una" / registro), para Cliente, Negocio o Repartidor. El Super Administrador no es autoregistrable: solo existe la cuenta semilla de arriba.

## Estructura del proyecto

```
Chaski_app/
├── app.py                 # Backend Flask (API + rutas)
├── chaski_db.sql           # Esquema completo + datos de prueba
├── requirements.txt         # Dependencias de Python
├── .env.example             # Plantilla de variables de entorno (copiarla a .env)
├── templates/               # Vistas HTML viejas (ya no se usan, reemplazadas por frontend/)
└── frontend/                # App React (lo que se usa hoy)
    ├── src/
    │   ├── pages/            # Una pantalla por archivo (Login, ClientePanel, NegocioDashboard, etc.)
    │   ├── components/       # AppShell (sidebar), EstadoBadge, StatTile, gráficos, etc.
    │   ├── api/client.js      # Cliente HTTP hacia el backend (adjunta el token automáticamente)
    │   └── auth/AuthContext.jsx  # Maneja el login/logout y el usuario actual
    └── package.json
```

## Problemas comunes

- **`El operador '<' está reservado para uso futuro'` al importar `chaski_db.sql`**: estás en PowerShell, que no soporta `<` para redirección. Usá el comando con `-e "source chaski_db.sql"` que está en el paso 2, no el de `<`.
- **"No se pudo conectar con el servidor" en el login**: revisá que `python app.py` esté corriendo y no haya tirado un error en la terminal.
- **Error de conexión a MySQL al arrancar Flask**: el módulo MySQL de XAMPP no está iniciado, o la config de `app.py` (usuario/contraseña) no coincide con tu instalación.
- **Puerto 5000 u 5173 ocupado**: cerrá cualquier otro proceso que los esté usando, o algún `python app.py` / `npm run dev` que haya quedado corriendo de antes.
- **La lista de negocios/sucursales aparece vacía**: asegurate de haber importado `chaski_db.sql` completo (trae los datos de prueba).
