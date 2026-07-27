# Chaski Delivery

App de delivery con tres roles: **cliente**, **dueño de negocio** y **repartidor**. El cliente elige un negocio, ve sus sucursales, arma un pedido con carrito y elige un repartidor disponible; el negocio administra sus productos, sucursales y ve sus ganancias; el repartidor gestiona su disponibilidad y ve el detalle de sus entregas.

## Stack

- **Backend**: Python + Flask + MySQL (JWT para autenticación)
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

1. Arrancá MySQL (si usás XAMPP, abrí el panel de control y iniciá el módulo **MySQL**).
2. Creá la base y cargá el esquema + datos de prueba, parado en la raíz del proyecto (donde está `chaski_db.sql`):

   ```
   mysql -u root --default-character-set=utf8mb4 -e "source chaski_db.sql"
   ```

   > ⚠️ **Importante si estás en Windows**: usá el comando de arriba tal cual, con `-e "source ..."`, y **no** la forma `mysql -u root < chaski_db.sql`. Esa redirección con `<` funciona en cmd.exe y en bash, pero **no existe en PowerShell** (tira el error `El operador '<' está reservado para uso futuro`) — y PowerShell es la terminal que abre Windows por defecto. El comando con `source` funciona igual en cmd, PowerShell y bash, así que evitás el problema directamente.

   Si `mysql` no está en el PATH (típico con XAMPP en Windows), usá la ruta completa al ejecutable, ajustando según dónde lo hayas instalado:

   ```
   "C:\xampp\mysql\bin\mysql.exe" -u root --default-character-set=utf8mb4 -e "source chaski_db.sql"
   ```

   > El script crea la base `chaskiDB`, todas las tablas y datos de prueba (usuarios, negocios, sucursales, productos). Si tu MySQL tiene contraseña para `root`, agregá `-p` al comando y te la va a pedir.

3. Revisá `app.py` (líneas ~20-24): por defecto asume usuario `root` **sin contraseña** en `localhost`. Si tu MySQL tiene otra configuración, editá esas líneas:

   ```python
   app.config["MYSQL_HOST"] = "localhost"
   app.config["MYSQL_USER"] = "root"
   app.config["MYSQL_PASSWORD"] = ""  # poné tu contraseña acá si tenés una
   app.config["MYSQL_DB"] = "chaskiDB"
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

Todas las contraseñas de las cuentas de prueba son `123456`.

| Rol | Correo | Notas |
|---|---|---|
| Cliente | `cliente@chaski.com` | Juan Perez |
| Dueño de negocio | `negocio@chaski.com` | Negocio "El Buen Sabor", 1 sucursal |
| Dueño de negocio | `pizzanostra@chaski.com` | Negocio "Pizza Nostra", 2 sucursales |
| Dueño de negocio | `sushiichiban@chaski.com` | Negocio "Sushi Ichiban", 2 sucursales |
| Repartidor | `repartidor@chaski.com` | Carlos Gomez |

También podés crear cuentas nuevas desde la pantalla de login (botón "Creá una" / registro), para cualquiera de los 3 roles.

## Estructura del proyecto

```
Chaski_app/
├── app.py                 # Backend Flask (API + rutas)
├── chaski_db.sql           # Esquema completo + datos de prueba
├── requirements.txt         # Dependencias de Python
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
