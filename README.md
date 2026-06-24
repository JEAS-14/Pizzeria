# 🍕 Sistema de Pizzería "LA ESQUINA"

¡Bienvenido al sistema de pizzería **LA ESQUINA**! Este es un proyecto educativo de nivel básico-intermedio estructurado limpiamente con una arquitectura cliente-servidor utilizando **Node.js, Express y MySQL**.

---

## 🛠️ Requisitos Previos

Para hacer funcionar el sistema, asegúrate de tener instalado en tu computadora:

1.  **Node.js** (Versión 16 o superior). [Descargar aquí](https://nodejs.org/).
2.  **Servidor MySQL** (Recomendado usar **XAMPP** para una instalación rápida y local de Apache + MySQL). [Descargar aquí](https://www.apachefriends.org/).
3.  **MySQL Workbench** (Opcional, pero muy recomendado para gestionar la base de datos). [Descargar aquí](https://dev.mysql.com/downloads/workbench/).

---

## 🚀 Guía de Instalación y Configuración

### Paso 1: Configurar la Base de Datos (MySQL)
1.  Abre el **XAMPP Control Panel** e inicia el módulo de **MySQL** haciendo clic en **"Start"**.
2.  Abre **MySQL Workbench** y conéctate a tu servidor local (generalmente puerto `3306`, usuario `root`, sin contraseña).
3.  Ve a **File > Open SQL Script...** y selecciona el archivo [database.sql](./database.sql) ubicado en la raíz del proyecto.
4.  Haz clic en el icono del **rayo amarillo** para ejecutar el script. Esto creará la base de datos `pizzeria_la_esquina`, las tablas y cargará los productos y usuarios iniciales.

### Paso 2: Descargar dependencias e iniciar el Servidor Node.js
1.  Abre una terminal o consola de comandos en la carpeta raíz del proyecto.
2.  Ejecuta el siguiente comando para instalar las dependencias (`express` y `mysql2`):
    ```bash
    npm install
    ```
3.  Inicia el servidor backend corriendo:
    ```bash
    npm start
    ```
4.  Abre tu navegador web e ingresa a: **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Cuentas de Prueba para la Evaluación

El sistema viene pre-cargado con las siguientes cuentas de prueba:

*   **Administrador**:
    *   **Correo**: `admin@laesquina.com`
    *   **Contraseña**: `admin123`
*   **Cliente estándar**:
    *   **Correo**: `cliente@laesquina.com`
    *   **Contraseña**: `cliente123`
*   *Nota: También puedes usar el botón "Continuar con Google" en el login para iniciar sesión de prueba al instante.*

---

## 📂 Estructura del Proyecto

El código está organizado de manera limpia y modular:

```text
Pizzeria/
├── LA_ESQUINA_/
│   └── public/               # Archivos estáticos servidos al cliente
│       ├── css/              # Hojas de estilo estructuradas
│       │   ├── auth.css      # Estilos para Login y Registro
│       │   ├── styles.css    # Estilos del Home y Carrito
│       │   └── admin.css     # Estilos del Dashboard Admin (Modo Oscuro)
│       ├── js/               # Scripts frontend independientes
│       │   ├── auth.js       # Registro, Login y Login Google
│       │   ├── cart.js       # Carrito de compras y pasarela de pagos
│       │   ├── main.js       # Carga dinámica de la carta y promos
│       │   └── admin.js      # Lógica de dashboard, reportes y CRUD
│       ├── index.html        # Página principal
│       ├── login.html        # Inicio de sesión
│       ├── registro.html     # Registro de cuenta
│       ├── promos.html       # Promociones y Combos
│       └── admin.html        # Panel del Administrador
├── database.sql              # Script de la base de datos MySQL
├── server.js                 # Servidor Backend Express (Puntos de acceso a la DB)
└── package.json              # Configuración y dependencias del proyecto
```

---

## 🌟 Características Destacadas

*   **Pasarela de Pago Simulada**: Valida e imita el procesamiento de cobro real con animaciones fluidas antes de confirmar el pedido.
*   **Control Inteligente de Stock**: Resta productos dinámicamente de la base de datos y marca como "Agotado" los productos sin stock.
*   **Promociones Condicionales**: Las promociones de fin de semana (Sábado de 2x1) se bloquean automáticamente si no es el día de la oferta.
*   **Dashboard Avanzado para el Admin**: Con métricas de venta diaria, ranking de productos más vendidos, y gestores completos para la carta y los clientes.