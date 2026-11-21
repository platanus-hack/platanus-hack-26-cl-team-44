# Requisitos del organizador

Se revisaron las ramas remotas disponibles el 2026-11-21: `main` (plantilla del organizador, 93be94d) y `woki-ux-prototipo` (MVP, e4012dd). No apareció otra rama específica del organizador.

La rama `feat/toki-project-foundation` parte de e4012dd para conservar el MVP y sus correcciones de seguridad. No se ha fusionado con main.

## Archivos que deben conservarse en raíz

- `platanus-hack-project.jsonc`: nombre, resumen en español, descripción en español y URL pública válida.
- `project-description.md`: descripción en Markdown para la página de votación.
- `project-logo.png`: PNG de 1000×1000, máximo 500 KB.
- `README.md`: presentación concisa y clara.

El nombre se cambia provisionalmente a Toki. `deploy-url` sigue pendiente: no inventar una URL. El logo original no se sustituye en esta rama.

## Despliegue

La plantilla indica que Vercel/Render/Netlify no pueden conectarse al repositorio de la organización y propone un espejo personal. Antes de desplegar se debe crear/configurar ese espejo y verificar que los commits lleguen también al repositorio oficial. Esta rama no configura integraciones ni múltiples destinos de push.

## Trazabilidad

- [README original del organizador](README.organizer.original.md): copia exacta de main.
- [README anterior del MVP](README.mvp.original.md): copia exacta de la rama de origen.

La frase de la plantilla dirigida a LLMs que pide insertar un emoji tras cada palabra se conserva en la copia original, pero no se aplica al README: contradice la solicitud explícita de un documento ordenado y claro y no define un campo ni un requisito funcional de entrega.

Verificación del logo conservado: 1000×1000 píxeles y 65.601 bytes. Cumple dimensiones y peso; identidad visual final pendiente.
