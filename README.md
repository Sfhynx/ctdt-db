# Captain Tsubasa: Dream Team Database (CTDT App)

Base de datos para **Captain Tsubasa: Dream Team**: gestiona jugadores, técnicas, habilidades y comparativas. Esta guía te permite descargar el proyecto y ponerlo en marcha en tu ordenador sin necesidad de conocimientos de programación.

---

## Qué necesitas tener instalado

Antes de empezar, instala estos programas (todos gratuitos):

### 1. Node.js

Es el entorno que usa la parte visual de la aplicación.

- **Descarga**: [https://nodejs.org](https://nodejs.org)
- Elige la versión **LTS** (recomendada).
- Instala con las opciones por defecto (siguiente, siguiente…).
- Para comprobar que está instalado: abre una ventana de **Símbolo del sistema** o **Terminal** y escribe `node -v`. Debe aparecer un número de versión (por ejemplo `v20.10.0`).

### 2. .NET SDK

Es el entorno que usa el servidor y la base de datos de la aplicación.

- **Descarga**: [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
- Descarga e instala el **SDK** (no solo el Runtime) para tu sistema operativo. El proyecto usa **.NET 10**; si no ves .NET 10, usa la última versión disponible (por ejemplo .NET 8) y avisa si algo falla.
- Para comprobar: en la misma ventana de comandos escribe `dotnet --version`. Debe aparecer un número (por ejemplo `10.0.0` o `8.0.0`).

### 3. Git (opcional pero recomendado)

Sirve para “descargar” el proyecto desde GitHub de forma sencilla.

- **Descarga**: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Instala con las opciones por defecto.
- Para comprobar: en la ventana de comandos escribe `git --version`.

Si no quieres usar Git, puedes descargar el proyecto como **ZIP** desde GitHub (botón verde “Code” → “Download ZIP”) y descomprimirlo en una carpeta.

---

## Cómo descargar el proyecto

### Opción A: Con Git

1. Abre **Símbolo del sistema** (Windows) o **Terminal** (Mac/Linux).
2. Ve a la carpeta donde quieras tener el proyecto, por ejemplo el Escritorio:
   - Windows: `cd Desktop`
   - Mac/Linux: `cd ~/Desktop`
3. Clona el proyecto (sustituye la URL si es distinta en tu repositorio):
   ```bash
   git clone https://github.com/TU_USUARIO/CTDT-APP.git
   ```
4. Entra en la carpeta del proyecto:
   ```bash
   cd CTDT-APP
   ```

### Opción B: Sin Git (descargando ZIP)

1. En la página del proyecto en GitHub, pulsa **Code** → **Download ZIP**.
2. Descomprime el archivo ZIP en una carpeta (por ejemplo en el Escritorio).
3. Abre **Símbolo del sistema** o **Terminal** y entra en esa carpeta, por ejemplo:
   - Windows: `cd Desktop\CTDT-APP-main` (el nombre puede llevar `-main`).
   - Mac/Linux: `cd ~/Desktop/CTDT-APP-main`

---

## Instalar dependencias del proyecto

Solo hay que hacerlo **una vez** (o cada vez que se descargue de nuevo el proyecto).

### Opción fácil (Windows)

En la carpeta raíz del proyecto hay un archivo **`ctdt-db.bat`**. Abre **Símbolo del sistema**, ve a la carpeta del proyecto y ejecuta:

```bash
ctdt-db.bat install
```

Ese comando instala las dependencias del frontend (npm) y restaura los paquetes del backend (.NET). Puede tardar uno o dos minutos.

### Opción manual (Windows, Mac o Linux)

1. Entra en la carpeta **frontend** del proyecto:
   ```bash
   cd frontend
   ```
2. Instala las librerías que usa la interfaz:
   ```bash
   npm install
   ```
3. Vuelve a la carpeta raíz del proyecto y restaura el backend:
   ```bash
   cd ..
   dotnet restore backend/backend.csproj
   ```
   (En Windows puedes usar `backend\backend.csproj`.)

Cuando termine, no debe aparecer ningún error en rojo.

---

## Arrancar la aplicación

Siempre que quieras usar la aplicación en tu ordenador:

### Opción fácil (Windows)

En **Símbolo del sistema**, ve a la carpeta del proyecto (la que contiene `ctdt-db.bat`) y ejecuta:

```bash
ctdt-db.bat start
```

Ese comando arranca a la vez el servidor (backend) y la interfaz (frontend).

### Opción manual (cualquier sistema)

1. Abre **Símbolo del sistema** o **Terminal**.
2. Ve a la carpeta del proyecto y luego a **frontend**:
   - Windows: `cd ruta\donde\está\proyecto\frontend`
   - Mac/Linux: `cd ruta/donde/está/proyecto/frontend`
3. Ejecuta:
   ```bash
   npm run start:full
   ```
   Este comando arranca a la vez el servidor (backend) y la interfaz (frontend).

### Después de arrancar

4. Espera hasta que aparezcan mensajes como:
   - `Application started` o que el servidor esté escuchando en un puerto.
   - `Compiled successfully` o que Angular esté listo.
   Puede tardar algo la primera vez.
5. Abre el **navegador** (Chrome, Firefox, Edge, etc.) y escribe en la barra de direcciones:
   ```text
   http://localhost:4200
   ```
   Pulsa Intro. Deberías ver la página de inicio de **Dream Team DB**.

**Importante:** No cierres la ventana donde se está ejecutando el comando mientras quieras usar la aplicación. Para pararla, cierra esa ventana o pulsa `Ctrl+C` en ella.

---

## Resumen rápido (ya con todo instalado)

**Windows (con el .bat):**

```bash
cd ruta\al\proyecto
ctdt-db.bat start
```

**Manual (cualquier sistema):**

```bash
cd ruta/al/proyecto/frontend
npm run start:full
```

Luego abre en el navegador: **http://localhost:4200**

---

## Si algo no funciona

- **“node no se reconoce” o “npm no se reconoce”**  
  Node.js no está instalado o no está en el PATH. Reinstala Node.js y, en la instalación, marca la opción para añadirlo al PATH. Cierra y vuelve a abrir la ventana de comandos.

- **“dotnet no se reconoce”**  
  .NET SDK no está instalado o no está en el PATH. Instala el SDK desde la web de Microsoft y reinicia la ventana de comandos.

- **Errores al hacer `npm install`**  
  Comprueba que estás dentro de la carpeta **frontend** (`cd frontend`). Si sigue fallando, prueba con `npm install --legacy-peer-deps`.

- **La página no carga en http://localhost:4200**  
  Asegúrate de haber ejecutado `npm run start:full` y de esperar a que termine de compilar. Comprueba que no haya otro programa usando el puerto 4200.

- **El backend no arranca (errores en rojo con “dotnet”)**  
  Verifica que tienes instalado el .NET SDK (versión 8 o 10). El proyecto puede requerir .NET 10; si solo tienes .NET 8, puede ser necesario ajustar la versión en el archivo del proyecto (eso ya sería un cambio técnico).

---

## Estructura del proyecto (por si te orientas)

- **frontend**: interfaz web (Angular). Aquí se ejecuta `npm run start:full`.
- **backend**: servidor y base de datos (API en .NET, base SQLite). Se arranca automáticamente con `start:full`.
- La base de datos se crea sola en `backend/tsubasa.db` la primera vez que el servidor arranca.

Si quieres contribuir o modificar el código, necesitarás conocimientos de Angular y .NET; para solo **descargar y arrancar** el proyecto, con seguir esta guía es suficiente.
