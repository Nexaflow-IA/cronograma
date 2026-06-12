# Cronogramas Nexaflow IA

Una aplicación web para la gestión visual de cronogramas y diagramas de Gantt enfocada en múltiples proyectos simultáneos. Desarrollada con React (Vite) y soportada por autenticación directa con Google OAuth.

## Características
- **Multi-Proyecto:** Permite gestionar múltiples cronogramas de proyectos desde un panel de control unificado.
- **Visualización Gantt Interactiva:** Arrastra barras para ajustar dependencias o modificar la duración de las tareas dinámicamente.
- **Roles y Asignaciones:** Define roles en los proyectos y asigna responsables específicos (Ej. `Analista de Datos (Juan Pérez)`).
- **Autenticación Gratuita y Segura:** Implementa inicio de sesión con `@react-oauth/google` para control de acceso al sistema sin costos adicionales de bases de datos de autenticación (ej. Firebase).
- **Persistencia Local:** La información de los proyectos se mantiene eficientemente en el LocalStorage del navegador del usuario.

## Requisitos Previos
- Node.js (v18 o superior)
- Una cuenta de Google Cloud para el Client ID de OAuth.

## Configuración y Despliegue Local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Configura el entorno:
   Crea un archivo `.env.production` (y `.env.local` para desarrollo local si es necesario) y añade tu ID de Cliente de Google:
   ```env
   VITE_GOOGLE_CLIENT_ID=tu_client_id_de_google.apps.googleusercontent.com
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Construye para producción:
   ```bash
   npm run build
   ```

## Despliegue en Servidor (Ej. AWS EC2)
El despliegue está preparado para entornos Nginx:
1. Sube la carpeta `dist/` a tu servidor.
2. Configura Nginx para servir el `index.html`.
3. Instala Certbot y habilita SSL/HTTPS (Requerido para que Google OAuth autorice el dominio).
