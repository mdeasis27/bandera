# Bandera

[English](README.md) · [Probar demo](https://bandera-manueldeasis27-2515s-projects.vercel.app/es/app) · [Caso de estudio](https://manueldeasis.com/es/projects/bandera) · [Código](https://github.com/mdeasis27/bandera)

![Interfaz interactiva local real](docs/images/cover.png)

Cambia calidad simulada de variantes y márgenes de no inferioridad para inspeccionar decisiones de rollout.

## Dos situaciones para comparar

**Variante sana:** Calidad 0.80 Las etapas avanzan.

![Variante sana](docs/images/scenario-a.es.png)

**Variante débil:** Calidad baja Se activa el apagado.

![Variante débil](docs/images/scenario-b.es.png)

## Caso de uso de negocio

Un despliegue necesita una condición observable para detenerse.

**Quién lo usa:** Responsable de lanzamiento.

**La decisión:** Avanzar, mantener o activar el apagado.

Elige calidad, simula tráfico por etapas y lee cada decisión.

### Prueba la decisión

**Variante sana:** Calidad 0.80 Las etapas avanzan.

**Variante débil:** Calidad baja Se activa el apagado.

Elige un escenario, modifica sus controles y ejecuta el cálculo local. Avanza por la visualización paso a paso o revela todo. Reinicia antes de comparar el segundo escenario.

## Cómo probarlo

Abre `/en/app` (inglés, por defecto) o `/es/app` (español). Cambia los datos del escenario y ejecuta el cálculo. Inspecciona la decisión, evidencia y traza calculada. La reproducción revela pasos locales ya completados; no mide un modelo en vivo. Reiniciar empieza un escenario local nuevo. Cambiar de idioma reinicia el escenario; la interfaz muestra un aviso de reinicio.

La demo principal no requiere cuenta, clave de API ni base de datos. Los enlaces públicos apuntan al despliegue existente; el rediseño local está pendiente de publicación.

## Instalación y verificación local

Requiere Node.js 22 y pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm lint
pnpm build
```

Abre `http://localhost:3000/en/app`. La validación registrada cubre pruebas, lint, TypeScript y builds de producción. Consulta los [resultados de comandos](docs/quality/decision-lab-verification.json) y las [comprobaciones de componentes en navegador](docs/quality/decision-lab-browser.json). Estas pruebas usan componentes React y CSS de producción con navegación de idioma controlada; no certifican rutas de Next ni el despliegue público.

## Arquitectura

- `app/[lang]/`: experiencia web por idioma.
- `lib/experience/`: adaptador local tipado, validación y trazas.
- `design-system/`: tokens visuales, controles de idioma y presentación de ejecución y reproducción.
- `app/api/`: integraciones opcionales de servidor; la demo principal no las requiere.

Tecnología: Next.js 16, TypeScript, Python, Vitest, pytest, Tailwind CSS v4.

## Evidencia y límites

El tráfico llena etapas hasta una compuerta o apagado.

Etapas de tráfico, rutas de esperar, avanzar o detener y supuestos de simulación explícitos.

Convierte evidencia de despliegue en una acción reversible.

**Límites:** El tráfico se simula localmente. Estos prototipos de portafolio no afirman impacto medido en producción.

Los datos son ejemplos ficticios o anónimos. Las integraciones opcionales requieren sus propias credenciales y configuración. Los secretos pertenecen al gestor configurado, nunca a archivos locales de secretos ni Git. Usa el flujo existente `infisical run -- <command>` si necesitas integraciones en vivo. La demo local no publica ni despliega automáticamente.

![Captura real de la demo en español](docs/images/demo.es.png)
