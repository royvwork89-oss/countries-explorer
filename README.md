# Navegador de países

Reto técnico App Developer 2026 — Enacment.

## Reto elegido y alcance

Mini-proyecto: **Navegador de países + similares**.

- Lista de países con búsqueda.
- Detalle de país con 3 países similares y una explicación legible de la similitud.
- Favoritos persistentes en el navegador.
- Publicado en Firebase Hosting.

### Supuestos

- La fuente de datos es un dataset público local en lugar de la API en vivo de REST Countries (ver "Decisiones técnicas"). Confirmado con la reclutadora antes de implementar.

## Arquitectura y dependencias

_Pendiente._

## Modelo de datos

### Calidad del dataset

Auditoría reproducible con `node scripts/audit-data.mjs` sobre 250 registros:

| Dato | Registros sin dato | Ejemplos |
|---|---|---|
| Capital | 5 | Antártida, Macao |
| Subregión | 3 | Territorios de la región "Polar" |
| Área | 10 | Palestina, Reunión, Guadalupe |
| Población (0) | 2 | Isla Bouvet, Islas Heard y McDonald |
| Región, idiomas, nombre en español, código ISO | 0 | — |

Hallazgos adicionales:

- El código ISO de 3 letras es único en los 250 registros y se usa como identificador en las rutas.
- 3 países tienen idiomas sin código ISO 639-1, pero todos tienen ISO 639-2, que es el que se usa para comparar idiomas.
- Las capitales solo están disponibles en inglés.

### Política de datos faltantes

- El mapper convierte la respuesta cruda al modelo de la app y tipa los campos opcionales como `T | null`, sin inventar valores.
- La UI muestra "No disponible" en los campos nulos.
- En la similitud, un rasgo faltante en cualquiera de los dos países se excluye y su peso se reparte entre los rasgos restantes. Si quedan menos de 2 rasgos comparables, el par no se considera.
- Una población de 0 se trata como dato faltante, porque la comparación usa escala logarítmica.

## Estado y navegación

_Pendiente._

## Decisiones técnicas

### 1. Fuente de datos: dataset público local

**Contexto:** antes de escribir código se verificó la API. La versión v3.1 de REST Countries responde con un error de deprecación. La versión vigente (v5) exige una API key en cada petición.

**Opciones evaluadas:**

| Opción | Resultado |
|---|---|
| API v5 con la key en el frontend | Descartada. La key quedaría visible en el bundle; la restricción por dominio solo aplica a navegadores, así que cualquiera podría usarla desde un script y agotar la cuota gratuita (1,000 peticiones/mes), congelando la cuenta. |
| API v5 detrás de un proxy en Cloud Functions | Descartada. Oculta la key, pero requiere el plan Blaze de Firebase y añade tiempo y complejidad fuera del alcance del reto. |
| Dataset público local | **Elegida.** |

**Por qué:** cero llaves expuestas, cero dependencia de cuota o disponibilidad de terceros durante la evaluación, y cumple la indicación del reto de usar datos públicos sin exponer llaves. Los términos de la API v5 prohíben descargar su dataset para uso offline, por eso no se usó una copia de la v5.

**Fuente:** `countriesV2.json` del repositorio original de REST Countries (`apilayer/restcountries`, archivado), licencia MPL-2.0. Se sirve sin modificaciones desde `public/data/`.

**Validación:** se consultó a la reclutadora, que confirmó que es válido usar otra fuente pública documentando la decisión.

**Costo aceptado:** los datos son de hace algunos años (la población está desactualizada). El impacto en la similitud es bajo porque la población se compara en escala logarítmica.

**Migrabilidad:** el acceso a datos está detrás de una abstracción, así que cambiar a la API en vivo implicaría una nueva implementación sin tocar componentes.

### 2. Banderas desde un CDN público sin llave

Las URLs de banderas del dataset apuntan a un dominio que ya no existe. Se usa el CDN gratuito de banderas de REST Countries, que no requiere cuenta ni llave.

### 3. Favoritos en localStorage detrás de una abstracción

Se eligió localStorage para reducir el riesgo de entrega en el tiempo del reto. Los componentes no acceden a localStorage directamente: usan un repositorio abstracto, así que migrar a Firestore no requiere cambios en la UI.

### 4. Sin renderizado en servidor (SSR)

Firebase Hosting sirve archivos estáticos. SSR requeriría App Hosting y plan de pago, sin beneficio para este alcance.

## Escalabilidad y mantenimiento

_Pendiente._

## Seguridad y validaciones

_Pendiente._

## Rendimiento

_Pendiente._

## Accesibilidad

_Pendiente._

## Uso de IA

_Registro en curso; se condensará a 5–8 puntos al final._

- **Planificación:** la IA propuso un plan por bloques con criterios de aceptación. Lo ajusté: favoritos en localStorage en vez de Firestore, priorizar el núcleo antes que mejoras opcionales, verificar la API antes de escribir código y documentar desde el inicio.
- **Verificación de la API:** al probar el endpoint antes de implementar, se detectó la deprecación de la v3.1 y que la v5 exige llave. Se evaluaron tres alternativas con sus riesgos (ver "Decisiones técnicas").
- **Validación humana:** antes de elegir la fuente de datos, consulté a la reclutadora en lugar de asumir.
- **Revisión cruzada:** usé una segunda IA para auditar un plan de trabajo. Detectó ambigüedades reales en reglas y rangos de datos; acepté las correcciones y precisé dos que seguían incompletas.
- **Rechazado:** la integración de herramientas de IA dentro del proyecto (archivos de configuración para agentes de código), porque no se usarían y añadirían ruido al repositorio.
- **Riesgos detectados:** exposición de llaves en el frontend y dependencia de un servicio externo con cuota limitada; mitigados con la elección de la fuente de datos.

## Limitaciones y siguientes pasos

_Pendiente._

## Instalación y ejecución

### Requisitos

- Node.js 22.22 o superior (verificado con 24.20 LTS)
- npm (verificado con 11.19)

No es necesario instalar Angular CLI de forma global: el proyecto usa su propia versión (22.2) a través de los scripts de npm.

### Pasos

1. Clonar el repositorio e instalar dependencias:

   ```bash
   git clone <url-del-repo>
   cd countries-explorer
   npm install
   ```

2. Levantar el servidor de desarrollo:

   ```bash
   npm start
   ```

   La app queda disponible en `http://localhost:4200`.

3. Ejecutar los tests unitarios (Vitest):

   ```bash
   npm test
   ```

4. Generar la versión de producción:

   ```bash
   npm run build
   ```

### Auditoría del dataset

Para reproducir el análisis de datos faltantes que sustenta las decisiones de manejo de datos:

```bash
node scripts/audit-data.mjs
```

### Despliegue

La app se publica en Firebase Hosting (plan gratuito Spark):

**URL pública:** https://countries-explorer-9336c.web.app

Para desplegar:

```bash
npm run build
firebase deploy
```

Configuración relevante (`firebase.json`):

- Directorio público: `dist/countries-explorer/browser` (salida del build de Angular).
- Reescritura de todas las rutas a `index.html`, para que recargar directamente en una ruta como `/countries/MEX` funcione en una aplicación de una sola página.

El primer despliegue se hizo con la aplicación base, antes de implementar funcionalidad, para detectar temprano problemas de configuración.

## Créditos

- Datos de países: [REST Countries](https://github.com/apilayer/restcountries) (MPL-2.0).
- Banderas: CDN de banderas de REST Countries.