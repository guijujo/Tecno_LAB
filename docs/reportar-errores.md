# Configurar el envío de reportes de errores

La aplicación está publicada como sitio estático en GitHub Pages. Para
recibir imágenes y mandar reportes a
`soporteproyectonosotros@gmail.com`, usa Google Apps Script con la cuenta
que administra ese buzón. La tabla privada de control guarda solamente la
fecha del servidor y un hash del identificador aleatorio del navegador; no
almacena descripciones ni imágenes.

## Crear el servicio

1. Iniciá sesión con la cuenta de Google que debe autorizar el envío y abrí
   [script.google.com](https://script.google.com/).
2. Creá un proyecto nuevo y reemplazá el contenido de `Code.gs` por el archivo
   [`backend/Code.gs`](../backend/Code.gs) de este repositorio.
3. En la configuración del proyecto, elegí la zona horaria que se usará para
   definir el cambio de día del límite.
4. En el editor, ejecutá `setupReportes` una vez y aceptá los permisos
   solicitados. Esto crea una hoja privada para contar los reportes y habilita
   el permiso de envío de correo. No compartas esa hoja.
5. Elegí **Implementar → Nueva implementación → Aplicación web**. Configurá
   **Ejecutar como: yo** y el acceso para que cualquier persona pueda usar el
   formulario. Implementá y copiá la URL que termina en `/exec`.
6. Pegá esa URL en `window.URL_SERVICIO_REPORTES` dentro de
   [`js/reportes-config.js`](../js/reportes-config.js), entre las comillas.
   La URL de implementación no es una contraseña; no agregues credenciales ni
   claves privadas al repositorio.
7. Publicá los cambios de GitHub Pages. Enviá un reporte de prueba con una
   imagen pequeña y verificá que llegue al buzón indicado.

Cuando modifiques `Code.gs`, creá una versión nueva de la implementación web
para que el endpoint use el código actualizado. Si cambias de cuenta o
proyecto, repetí la configuración y actualizá la URL en el archivo de
configuración.

## Qué hace el límite

El servidor permite hasta tres envíos por día para el identificador aleatorio
guardado en ese navegador. La actualización del contador y el envío de correo
se protegen con un bloqueo para evitar que dos envíos simultáneos superen el
límite. La hoja conserva solo los identificadores hash necesarios para
controlar los últimos días.

No es una verificación de identidad: borrar los datos del sitio, cambiar de
navegador o usar otro dispositivo puede crear un identificador nuevo. La
captura se envía como adjunto de correo a la dirección indicada. Google
procesa la solicitud porque Apps Script, Gmail y Sheets son el servicio de
recepción; no se debe incluir información privada en la imagen.
