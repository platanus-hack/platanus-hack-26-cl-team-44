# Skills del proyecto

| Skill | Propósito | Fuente |
|---|---|---|
| `adapt-app` | Investigar una conexión, preparar una interfaz accesible y comprobar tareas reales | [SKILL.md](adapt-app/SKILL.md) |

## Uso

Para trabajar en una adaptación con el agente, invoca `$adapt-app` desde este repositorio o indica explícitamente el archivo anterior. El [glosario](../../GLOSSARY.md), las [decisiones de producto](../../docs/product/CREADOR-APPS-ELA.md) y el [contrato de adaptadores](../../software/apps-bridge/ADAPTERS.md) completan las instrucciones.

Para generar un lector RSS, sigue la [preparación asistida](../../software/apps-bridge/README.md#generar-e-instalar-un-lector-nuevo). El bridge carga directamente este `SKILL.md` y lo proporciona a Codex; no depende del descubrimiento automático de skills ni de una copia global. Se necesita el repositorio completo, Node 22+, las dependencias del bridge, Codex CLI y una sesión local iniciada. La copia versionada no incluye credenciales.

## Investigación de contratos

`adapt-app` recurre a [surface-recon de Crafter Station](https://github.com/crafter-station/skills/blob/main/skills/surface-recon/SKILL.md) cuando falta verificar una capacidad, autenticación o resultado. El informe distingue evidencia de hipótesis y determina qué puede construir el adaptador. Los criterios y la entrega entre ambas skills están en [adapt-app](adapt-app/SKILL.md#investigar-un-contrato-incompleto).

`surface-recon` es un procedimiento de investigación para el agente, no una dependencia de ejecución del bridge. Puede consultarse desde su instalación disponible o desde su fuente; no se instala automáticamente. El generador RSS sigue leyendo únicamente `adapt-app/SKILL.md`, sin herramientas ni acceso a esas referencias externas. REA queda como herramienta opcional de investigación.

## Mantenimiento

Modifica `adapt-app/SKILL.md` en el mismo PR que cambie el contrato al que se refiere. Mantén claros el alcance implementado y el trabajo pendiente. El generador registra el SHA-256 del texto utilizado; actualizar la skill afecta a futuras generaciones, sin modificar los paquetes ya instalados.

No uses una copia personal como fuente de las instrucciones del proyecto. La ruta se resuelve desde `generator/codex.mjs`, independientemente del directorio de arranque. Si empaquetas el bridge por separado, incluye también `.agents/skills/adapt-app/SKILL.md` conservando la estructura relativa del repositorio.

Desde la raíz:

```sh
npm ci --prefix software/apps-bridge
node --test tests/apps/*.test.mjs
```

La prueba `skill-portability.test.mjs` monta una copia aislada del generador y de la skill en una ruta con espacios. Un ejecutable de prueba comprueba qué instrucciones recibe y la prueba verifica su hash. No llama a Codex real, no consume inferencia y no necesita iniciar sesión. No acredita funcionamiento con un paciente.
