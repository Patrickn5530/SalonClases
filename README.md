App Escolar - Sistema de Control de Desayunos y Colectas
Esta es una PWA (Progressive Web App) diseñada para facilitar la gestión administrativa escolar en el Estado de México. Permite el control de asistencia para desayunos, gestión de colectas y generación de reportes oficiales en PDF, funcionando de manera fluida tanto en navegadores móviles como en aplicaciones empaquetadas (APK).

🚀 Características Principales
Gestión de Alumnos: Registro con ID único para evitar duplicados y facilitar ediciones.

Módulo de Desayunos: Control diario de entrega con capacidad de añadir observaciones personalizadas.

Módulo de Colectas: Seguimiento de aportaciones económicas de forma independiente.

Historial y Reportes: Almacenamiento local de jornadas anteriores con opción de exportar a PDF con formato oficial (incluye logos del DIFEM y espacio para firmas).

Modo Offline: Gracias al uso de Service Workers y localForage, la app funciona sin conexión a internet.

Tours Interactivos: Guías paso a paso para usuarios nuevos en cada sección.

🛠️ Tecnologías Utilizadas
Frontend: HTML5, CSS3 (Bootstrap 5), JavaScript (ES6+).

Almacenamiento: localStorage y localForage (IndexedDB) para persistencia de datos pesados.

Librerías de Terceros:

SweetAlert2: Para alertas y formularios elegantes.

html2pdf.js: Para la generación de reportes PDF.

Intro.js: Para los recorridos guiados.

FontAwesome: Para la iconografía.

📦 Instalación y Uso
Clonar el repositorio:

Bash
git clone https://github.com/tu-usuario/app-escolar.git
Servidor Local: Debido al uso de Service Workers, se recomienda abrir el proyecto a través de un servidor local (como Live Server en VS Code) para evitar restricciones de seguridad de archivos locales (file://).

Configuración: Al ingresar por primera vez, ve a la sección Configurar para establecer los datos del plantel y el ciclo escolar actual.

📱 Compilación a APK
Este proyecto está optimizado para ser empaquetado mediante herramientas como Apache Cordova o Capacitor.

Nota: Se han implementado parches específicos en la gestión de descargas de PDF para asegurar la compatibilidad con el WebView de Android.

📄 Estructura del Proyecto
Plaintext
www/
├── css/            # Estilos personalizados y librerías (Bootstrap, Intro.js)
├── js/             # Lógica de la app (desayunos.js, historial.js, etc.)
├── img/            # Logotipos institucionales y recursos visuales
├── index.html      # Lista general de alumnos
├── desayunos.html  # Módulo de desayunos
├── historial.html  # Consulta de reportes y exportación
└── sw.js           # Service Worker para soporte offline
