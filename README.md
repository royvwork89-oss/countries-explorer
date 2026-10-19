# Navegador de países

Reto técnico App Developer 2026 — Enacment.

## Reto elegido y alcance

Mini-proyecto: **Navegador de países + similares**.

- Lista de países con búsqueda.
- Detalle de país con 3 países similares y una explicación legible de la similitud.
- Favoritos persistentes en el navegador.
- Publicado en Firebase Hosting.

**Elecciones del reto:** toque personal = explicación legible de la similitud, con una mini-gráfica comparativa de población y superficie frente a los 3 similares (más los favoritos); persistencia = `localStorage`; similitud con 5 rasgos (idiomas, población, subregión, superficie y región).

### Supuestos

- La fuente de datos es un dataset público local en lugar de la API en vivo de REST Countries (ver "Decisiones técnicas"). Confirmado con la reclutadora antes de implementar.

## Arquitectura y dependencias

Aplicación Angular 22 con componentes standalone, signals y TypeScript en modo `strict`. No usa librerías de terceros más allá de Angular y RxJS; las pruebas usan Vitest, que trae Angular CLI.

```
src/app/
  core/
    models/         Country (modelo de la app) y CountryRaw (forma cruda del JSON)
    mappers/        convierte CountryRaw en Country; los datos faltantes pasan a null
    data/           CountriesDataSource (contrato) y StaticCountriesDataSource (JSON local)
    services/       CountriesService: carga una sola vez y expone el estado con signals
    similarity/     findSimilar(): función pura, sin dependencias de Angular
    favorites/      FavoritesRepository (contrato), versión localStorage y FavoritesService
    utils/          formato de números, normalización de texto para la búsqueda y escalado de las barras de la gráfica
  features/
    country-list/   lista, búsqueda y "Mostrar más"
    country-detail/ detalle, países similares y botón de favorito
    favorites/      página de favoritos
```

**Flujo de datos:** `StaticCountriesDataSource` descarga `data/countries.json` → `mapCountries` lo convierte a `Country[]` → `CountriesService` lo guarda en una señal → los componentes leen señales y derivan lo que necesitan con `computed`. La similitud y la búsqueda se calculan en el cliente sobre esa lista.

**Rutas** (todas con carga diferida):

| Ruta | Componente |
|---|---|
| `/` | Lista y búsqueda (`/?q=texto` conserva el filtro) |
| `/countries/:id` | Detalle por código ISO de 3 letras, por ejemplo `/countries/MEX` |
| `/favorites` | Favoritos |
| cualquier otra | Redirige a `/` |

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

### Persistencia de favoritos

No se usa Firestore ni Realtime Database, así que no hay colecciones, índices ni reglas. Los favoritos son una lista de códigos ISO de 3 letras guardada como JSON en `localStorage` bajo la clave `countries-explorer:favorites:v1` (el sufijo de versión permite cambiar el formato más adelante). Se valida al leer y se escribe en cada cambio.

## Estado y navegación

- **Estado:** `CountriesService` y `FavoritesService` guardan su estado en signals y lo exponen como solo lectura. Los componentes derivan con `computed` (resultados filtrados, país actual, similares). No se usó NgRx ni una librería de estado: son dos piezas pequeñas de estado y las signals bastan.
- **Estados de interfaz:** `idle`, `loading`, `ready` y `error` en el servicio; la lista, el detalle y favoritos muestran carga, vacío y error con opción de reintentar.
- **Búsqueda en la URL:** el texto se guarda como `?q=`. Así sobrevive a recargas y a la navegación, y se puede compartir. El campo se controla con una señal local y la URL se actualiza con `replaceUrl`, para no llenar el historial y no perder pulsaciones mientras se resuelve la navegación.
- **Lazy loading:** las tres pantallas se cargan con `loadComponent`.
- **Recarga directa:** Firebase Hosting reescribe todas las rutas a `index.html`, así que recargar en `/countries/MEX` funciona.

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

### 5. Similitud determinista, sin IA en tiempo de ejecución

El cálculo es una función pura (`findSimilar`) que compara cinco rasgos y devuelve los 3 países más parecidos con una explicación legible. No llama a ningún servicio externo, por lo que no necesita llaves ni red y se puede probar de forma exacta.

| Rasgo | Cómo se mide | Peso |
|---|---|---|
| Idiomas | Índice de Jaccard sobre códigos ISO 639-2 | 0.30 |
| Población | Distancia en escala logarítmica, normalizada por el rango del dataset | 0.25 |
| Subregión | Igual (1) o distinta (0) | 0.20 |
| Superficie | Distancia en escala logarítmica, normalizada por el rango del dataset | 0.15 |
| Región | Igual (1) o distinta (0) | 0.10 |

- **Por qué logarítmica:** sin ella, un país de 1,400 millones de habitantes haría que todos los demás parecieran iguales entre sí.
- **Datos faltantes:** un rasgo ausente se excluye y su peso se reparte entre los demás. Con menos de 2 rasgos comparables, el par no se considera.
- **Determinismo:** los empates se resuelven por nombre, así que el mismo dato siempre produce el mismo resultado.
- **Explicaciones:** se generan con plantillas ("Misma subregión", "Idiomas en común", "Población parecida", "Superficie parecida"). Un valor numérico se considera parecido si su puntaje es de al menos 0.95; el umbral se ajustó de 0.90 al ver con datos reales que 125 y 52 millones de habitantes no deberían llamarse "parecidos".
- **Costo aceptado:** los pesos son una elección razonada, no medida; región y subregión se solapan y cuentan algo doble.

## Escalabilidad y mantenimiento

- **Capas separadas:** datos (`data/`), transformación (`mappers/`), estado (`services/`), reglas de negocio (`similarity/`) y presentación (`features/`). Los componentes no conocen el origen de los datos ni dónde se guardan los favoritos.
- **Migrabilidad:** para pasar a la API en vivo se crea otra implementación de `CountriesDataSource` y se cambia una línea en `app.config.ts`. Para pasar a Firestore se hace lo mismo con `FavoritesRepository`.
- **Motor de similitud:** es una función pura y probada. Agregar un rasgo implica sumar su comparación y su peso en `similarity.ts`, sin tocar la interfaz.
- **Pruebas:** mapper, servicios, motor de similitud, favoritos, utilidades, lista y shell. Todas son unitarias y rápidas, sin red.
- **Crecimiento:** con muchos más registros habría que paginar en el servidor o usar virtual scroll, y mover la búsqueda y la similitud a un backend o a un índice.

## Seguridad y validaciones

- **Secretos:** no hay llaves ni credenciales en el repositorio ni en el bundle. La fuente de datos se eligió precisamente para evitar exponer una API key (ver "Decisiones técnicas").
- **Datos externos como no confiables:** el mapper valida cada campo antes de usarlo (tipos, cadenas vacías, números no positivos, listas ausentes) y descarta los registros sin identificador o sin nombre.
- **Favoritos:** lo que se lee de `localStorage` se valida (JSON válido, arreglo de textos no vacíos, sin duplicados). Si está corrupto, se parte de una lista vacía. Si `localStorage` falla al escribir (modo privado, cuota), la app sigue funcionando en memoria.
- **Plantillas:** solo interpolación de Angular, que escapa el contenido. No se usa `innerHTML` ni `bypassSecurityTrust*`. El parámetro de la ruta solo se usa como clave de búsqueda en un `Map`.
- **Reglas de Firebase:** no aplican. La app usa Firebase únicamente para Hosting, sin Firestore ni Realtime Database, por lo que no hay `firestore.rules` ni `database.rules.json`. Si se migran los favoritos a Firestore, las reglas deberían limitar lectura y escritura al documento del propio usuario autenticado.
- **No se configuró** una política de seguridad de contenido (CSP) ni cabeceras adicionales en Hosting (ver limitaciones).

## Rendimiento

- **Una sola petición de datos:** `data/countries.json` pesa unos 330 KB y se descarga una vez por sesión. El servicio no vuelve a pedirlo si ya está cargado o cargando.
- **Paginación en el cliente:** la lista pinta 48 tarjetas y ofrece "Mostrar más" (48 por vez). El contador se reinicia al cambiar la búsqueda. Con 250 registros no se justifica virtual scroll.
- **Carga diferida:** las pantallas se cargan por separado y las imágenes de la lista usan `loading="lazy"`.
- **Cálculos baratos:** la búsqueda es un `computed` local. Calcular los 250 países completos con el motor de similitud tardó unos 77 ms en Node, es decir, menos de 1 ms por país.
- **Pendiente de mejora:** las banderas se piden en 320 px aunque se muestren a 64 px.

## Accesibilidad

- **Teclado y foco:** todo lo interactivo son enlaces y botones nativos. El foco es visible (`:focus-visible`) y hay un enlace "Saltar al contenido".
- **Etiquetas y roles:** el buscador tiene `<label>`; la carga usa `role="status"` y los errores `role="alert"`; el botón de favorito usa `aria-pressed` (la estrella es decorativa); el enlace activo de navegación marca `aria-current`.
- **Gráfica comparativa:** son barras HTML y CSS, sin librerías. Las barras son decorativas (`aria-hidden`) y cada valor aparece siempre como texto, así que la información no depende del color ni de la vista; el país actual se distingue también por el nombre en negrita.
- **Imágenes:** las banderas de las tarjetas son decorativas (`alt=""`) porque el nombre está al lado; la del detalle lleva texto alternativo.
- **Idioma e identificación:** `lang="es"` en el documento, un `h1` por pantalla y botones "Quitar" con nombre accesible completo.
- **Contraste:** calculado con la fórmula de WCAG sobre los colores definidos. Texto principal 16.6:1, texto secundario 6.6:1, enlaces 6.4:1 y mensajes de error 6.5:1 sobre blanco, y todos superan 5.5:1 sobre el fondo azul claro de la página (el mínimo AA es 4.5:1). El borde de los controles (buscador y botón de favorito) se oscureció a 4.7:1 para superar el 3:1 exigido a los controles de formulario; el borde de las tarjetas es decorativo, porque el texto de cada tarjeta ya identifica el enlace. No se probó con lector de pantalla.

## Uso de IA

1. **Dónde y por qué:** usé un asistente de IA como pareja de trabajo para planificar por bloques con criterios de aceptación, generar el código base (modelos, mapper, servicios, componentes, estilos) y escribir las pruebas. Lo hice para llegar a una app publicada y probada en el tiempo del reto, trabajando una pieza a la vez y exigiendo para cada cambio tres respuestas: qué hace, por qué funciona y dónde puede fallar.
2. **Qué ajusté del plan:** acepté el plan por bloques pero lo cambié: favoritos en localStorage detrás de una abstracción en vez de Firestore, núcleo (lista, búsqueda, detalle, similitud) antes que mejoras opcionales, verificar la API antes de escribir código y documentar desde el inicio.
3. **Verificación en vez de confianza:** antes de implementar se probó el endpoint de REST Countries. Así se detectó que la v3.1 está deprecada y que la v5 exige llave. Se evaluaron tres alternativas con sus riesgos y se documentó la elegida (ver "Decisiones técnicas"). Antes de adoptarla consulté a la reclutadora en lugar de asumir.
4. **Revisión cruzada:** usé una segunda IA para auditar el plan de trabajo. Encontró ambigüedades reales en reglas y rangos de datos; acepté las correcciones y precisé dos que seguían incompletas.
5. **Qué rechacé o reescribí:** rechacé integrar herramientas de IA dentro del proyecto (archivos de configuración para agentes), porque no se usarían y añadirían ruido. Un umbral de la IA para "población parecida" (0.90) resultó demasiado generoso al probarlo con datos reales; lo subí a 0.95. Al probar yo mismo la app detecté que el filtro de búsqueda se perdía al recargar, y lo corregimos guardándolo en la URL.
6. **Riesgos detectados y mitigación:** exposición de llaves en el frontend y dependencia de una cuota externa (mitigado con un dataset local); datos externos mal formados (mapper defensivo y tests); contenido guardado corrupto (validación al leer favoritos); código generado que compila pero no funciona (cada bloque se probó con tests, con el build y a mano en el navegador).
7. **Enfoque de prompts y similitud:** la IA me ayudó a proponer los rasgos, los pesos y las plantillas de explicación de la similitud; yo fijé los criterios y validé el resultado. Pedí cosas pequeñas y verificables ("una función pura con estos rasgos y pesos, con tests de casos límite"), con la política de datos faltantes definida de antemano, y revisé los resultados con datos reales (por ejemplo, México → Guatemala, Honduras, Nicaragua) antes de aceptarlos.
8. **Lecciones y mejoras:** las pruebas unitarias no compilan las plantillas, así que además hay que correr `npm run build`. Revisar `git status` antes de cada commit evitó repetir un primer commit con archivos de caché que hubo que limpiar. Siguientes mejoras: pruebas end-to-end, auditoría de accesibilidad con herramienta y traducción de datos (ver limitaciones).

## Limitaciones y siguientes pasos

**Limitaciones conocidas**

- Los datos son de hace algunos años y las capitales, regiones, subregiones e idiomas aparecen en inglés, mientras que los nombres de países están en español.
- Los pesos de la similitud son una decisión de diseño, no una verdad objetiva. Un par con solo 2 rasgos comparables puede obtener un porcentaje alto con poca evidencia.
- La gráfica usa escala lineal relativa al mayor de los cuatro países; si uno es mucho mayor, las barras de los demás se ven muy cortas (se garantiza un ancho mínimo visible y el valor exacto siempre está en texto).
- Los favoritos son por navegador, no por usuario, y dos pestañas no se sincronizan hasta recargar.
- No hay pruebas de extremo a extremo ni auditoría automática de accesibilidad; el contraste se calculó con la fórmula de WCAG pero no se probó con lector de pantalla.
- No hay CSP ni cabeceras de seguridad configuradas en Hosting.
- Las banderas dependen de un CDN externo; si cae, la tarjeta muestra una imagen rota.
- Si se vuelve atrás dentro de la lista, el campo de búsqueda no se resincroniza con `?q=` (solo se lee al abrir la pantalla).

**Siguientes pasos**

- Traducir regiones, subregiones y idiomas con una tabla pequeña.
- Migrar los favoritos a Firestore con autenticación y reglas por usuario.
- Pedir banderas del tamaño adecuado y añadir cabeceras de seguridad en Hosting.
- Añadir pruebas end-to-end y una auditoría de accesibilidad.
- Mover la fuente de datos a la API en vivo con un proxy que oculte la llave.

## Instalación y ejecución

### Requisitos

- Node.js 22.22 o superior (verificado con 24.20 LTS)
- npm (verificado con 11.19)

No es necesario instalar Angular CLI de forma global: el proyecto usa su propia versión (22.2) a través de los scripts de npm.

### Pasos

1. Clonar el repositorio e instalar dependencias:

   ```bash
   git clone https://github.com/royvwork89-oss/countries-explorer.git
   cd countries-explorer
   npm install
   ```

2. Levantar el servidor de desarrollo:

   ```bash
   npm start
   ```

   La app queda disponible en `http://localhost:4200`.

3. Ejecutar los tests unitarios (Vitest, sin red):

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