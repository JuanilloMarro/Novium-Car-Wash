# Lineamientos de desarrollo · Novium CarWash

Reglas **obligatorias** para todo el código del proyecto. Existen para que el producto se vea y se comporte igual en todos los módulos y no termine siendo un frankenstein de estilos y soluciones distintas.

## 0. Cómo usar este documento

- **Antes de desarrollar:** leer las secciones que tocan la tarea y decidir con ellas qué componentes base y tokens se van a usar.
- **Después de desarrollar:** repasar la [lista de verificación](#15-lista-de-verificación) contra lo que se hizo y correr las revisiones automáticas.
- Si una regla no encaja con un caso real, no se rompe en silencio: se discute, y si se acepta una excepción se registra en [§16](#16-excepciones-vigentes) con su motivo.
- Las referencias al plan son al *Plan maestro SaaS para CarWash*.

## 1. Principios del producto

Salen del plan maestro y pesan más que cualquier preferencia visual:

1. **El operario usa un celular de gama baja, con un dedo, en menos de 3 toques.** Registrar un carro tarda menos de 30 segundos. Si una pantalla del operario necesita más, se rediseña.
2. **App web que requiere internet.** No hay modo offline. Si se cae la conexión, las órdenes se registran después como tardías (`is_late`).
3. **La seguridad vive en la base (RLS), no en el frontend.** Ocultar un botón no protege nada: la política de Postgres o la función del servidor es la que niega.
4. **El dinero nunca lo escribe el navegador.** Cobrar, anular, aprobar y cerrar caja se hacen en funciones RPC de Postgres o rutas Nitro, en una sola transacción.
5. **Antifraude como señales, no acusaciones.** Cada alerta muestra los datos y el dueño decide.
6. **Lo más simple que resuelva el caso.** Sin abstracciones para casos que todavía no existen.

## 2. Arquitectura de componentes heredados

### 2.1 Cadena de herencia

```
components/ui/          shadcn-vue, tal como sale del CLI
  └─ components/app/    App*: variantes de marca y composición
       └─ components/<módulo>/   piezas del módulo (orders, cash, customers…)
            └─ pages/            arma secciones, no estiliza
```

Cada capa se arma con la de abajo y **no redefine** lo que esa ya trae.

- **Primero shadcn-vue, lo más posible.** Otra librería o un componente propio desde cero es una excepción justificada con un comentario de una línea, y se registra en [§16](#16-excepciones-vigentes).
- **`components/ui/**` no se edita a mano.** Se agrega con `npx shadcn-vue add <componente>` y se envuelve desde `components/app/`. La marca entra por los tokens del tema y por las variantes del wrapper.
- **API por variantes:** cada componente base expone `variant`, `size` y sus estados (`disabled`, `loading`, `active`, `locked`…) con `cva`, y trae dentro sus transiciones. Quien lo usa elige opciones, no reescribe clases.
- **`class` desde afuera solo ubica** (margen, ancho, posición en grid o flex). Nunca cambia color, tipografía, borde, sombra ni radio.
- **Un wrapper `App*` existe solo si agrega algo** (variantes, composición, estados). Si el componente de shadcn tematizado ya basta, se usa `ui/` directo.
- **Componentes genéricos, sin lógica de un solo uso.** Esa lógica llega por props o slots desde donde se usa. Ejemplo: el mapeo *estado de orden → tono* vive en el módulo de órdenes, no en `AppBadge`.
- **Lo que se repite es componente** y se recorre con `v-for`. Toda card, fila o pieza repetida tiene su componente. Un componente de un solo uso solo se justifica como sección de página.
- **No crear componentes solo para mostrar algo** estático (íconos y logos: ver [§7](#7-íconos)).
- **Las páginas envuelven sus secciones en `<div class="flex flex-col">`.** La página arma secciones, no estiliza.

### 2.2 Nombres y carpetas

- Los componentes se registran por su **nombre de archivo**, sin prefijo de carpeta (`pathPrefix: false` en `nuxt.config.ts`). Por eso cada nombre es único en todo el proyecto.
- `components/app/` → prefijo `App` (`AppButton`, `AppField`, `AppDialog`).
- `components/<módulo>/` → prefijo del dominio en singular (`OrderCard`, `OrderQueueColumn`, `CashMovementRow`, `CustomerSearch`).
- Composables en `app/composables/use*.ts`; stores de Pinia en `app/stores/` (`useAuthStore`, `useBranchStore`, `useOrdersStore`).
- Código compartido entre cliente y servidor (esquemas zod, constantes, tipos) en `shared/`.

### 2.3 Restricciones por rol y por plan

- **Lo que el rol no permite, no se muestra:** control oculto o ruta redirigida. (La base lo niega de todas formas.)
- **Lo que el plan no incluye, se muestra bloqueado:** candado y salida a planes (`FeatureLock`, `AppButton locked`, `AppBadge variant="locked"`).
- La lógica vive solo en `usePermissions()` (rol y sucursal) y `usePlanLimits()` (plan y extras como FEL). Ningún componente compara roles o planes por su cuenta.

## 3. El tema es la única fuente de valores

Todo sale de Tailwind 4 y de su tema en [`app/assets/css/main.css`](../app/assets/css/main.css). No hay `tailwind.config.js`.

- **Nada de valores arbitrarios:** `w-[22rem]`, `rounded-[24px]`, `shadow-[…]`, `z-[300]`, `text-[13px]`, `#1a2540`, `rgba(…)`.
- **Clase canónica siempre:** si Tailwind ya tiene nombre, se usa (`w-[22rem]` → `w-88`, `z-[300]` → `z-300`). Los avisos del IDE cuentan como error.
- **Si no existe utilidad**, se declara una variable con nombre en el tema y se usa con `(--nombre)` o con la utilidad que genera. Nunca el valor suelto.
- **Todo color tiene nombre en el tema**, aunque sea de un solo uso. Nada de hex ni `rgba` en plantillas, scripts ni `:style`.
- `:style` solo para valores calculados en ejecución (posiciones, porcentajes que vienen de datos, el índice `--i` de `stagger`). Un `style="…"` estático está prohibido.

### 3.1 Colores

| Token | Uso |
|---|---|
| `navy-50` … `navy-950` | Escala de marca. Reemplaza a `gray`, `slate`, `zinc`, `blue`, `sky`. |
| `foreground` | Tinta principal (navy-900) |
| `muted-foreground` | Tinta secundaria (navy-700 al 60%) |
| `subtle-foreground` | Tinta terciaria (navy-700 al 40%) |
| `primary` / `primary-foreground` | Acción principal. Es el único color que cada car wash puede personalizar. |
| `background`, `card`, `muted`, `border`, `input`, `ring` | Superficies y bordes de shadcn, ya ligados a navy |
| `emerald` | Éxito (carro listo, caja cuadrada) |
| `amber` | Aviso (orden tardía, diferencia pequeña) |
| `rose` / `destructive` | Error y acciones destructivas. Nunca `red` ni `orange`: el naranja se confunde con el ámbar. |

- **Tres tintas** para texto: `foreground`, `muted-foreground`, `subtle-foreground`, más `text-primary`. Después de un rol de texto solo se agrega un tono de estado (`emerald`, `amber`, `rose`), `primary` o `white`.
- **Tema por car wash:** solo se sobrescriben `--primary` y `--primary-foreground` (y el logo). Nada más cambia por tenant.
- El MVP es **solo tema claro** (uso en exteriores, a pleno sol).

### 3.2 Superficies, radios, sombras

- **Una sola familia de superficie:** cards, paneles, inputs, selectores y bloques internos usan `surface`; elegido o hover: `surface-strong`; hover de opciones no elegidas y overlays: `surface-subtle`.
- Las superficies **no usan `backdrop-blur`**: en un celular de gama baja cuesta fotogramas (ver [§16](#16-excepciones-vigentes)).
- **Sombras en navy:** la escala `shadow-2xs` … `shadow-lg` está redefinida con el navy de la marca. Ninguna superficie usa sombra negra o gris.
- Radios con la escala del tema (`rounded-sm` … `rounded-xl`), que sale de `--radius`.

## 4. Tipografía

### 4.1 Solo roles `type-*`

Cada rol trae **tamaño, interlineado, peso, tracking y tinta**. Fuera de `components/ui/` y `components/app/` está prohibido escribir `text-<tamaño>`, `leading-*`, `font-<peso>`, `tracking-*` o `text-navy-*`. Lo vigila `npm run audit:design`.

| Rol | Tamaño | Peso | Interlineado | Tinta | Uso |
|---|---|---|---|---|---|
| `type-display` | 32px | bold | none | foreground | Número grande de un KPI |
| `type-page` | 22px | bold | none | foreground | Título de módulo (`AppPageTitle`) |
| `type-heading` | 18px | bold | snug | foreground | Título de dialog y de panel de detalle |
| `type-title` | 15px | semibold | snug | foreground | Título de card, sheet o fila maestro-detalle |
| `type-row` | 14px | bold | snug | foreground | Línea principal de una fila (la placa en la cola) |
| `type-body` | 14px | medium | snug | muted | Párrafos y descripciones |
| `type-option` | 14px | semibold | snug | foreground | Texto junto a un switch o checkbox |
| `type-value` | 14px | bold, cifras tabulares | snug | hereda | Valor de un dato: montos, conteos |
| `type-field` | 12px | bold | snug | foreground | Subtítulo sobre un campo, columna o sección de panel |
| `type-label` | 12px | semibold | snug | muted | Nombre de un dato, "(opcional)" |
| `type-meta` | 12px | regular | snug | subtle | Segunda línea, ayudas, ejes de gráficas |
| `type-status` | 11px | bold | snug | hereda | Palabra de estado en un badge |
| `type-micro` | 10px | semibold, mayúsculas | snug | subtle | Eyebrows, contadores |

- La escala es más grande que la de un panel de escritorio típico a propósito: se lee en un celular a la intemperie. **Nada baja de 10px.**
- `type-display` y `type-page` van en una línea. El resto en `snug`. El texto de lectura que se parte en varias líneas (una nota, un aviso, el detalle de una alerta) agrega `flow-text` después del rol y queda en `relaxed`.
- **Títulos solo en módulos, dialogs y cards.** Una sección dentro de un panel o drawer lleva subtítulo `type-field`, nunca un título.
- **Jerarquía:** nada dentro de un contenedor es más grande que su título. Un mismo elemento usa el mismo rol en todos los tamaños de pantalla.
- En las primitivas de shadcn (`Label`, `DialogTitle`, `SheetTitle`, `DropdownMenuLabel`…) el rol va en un `<span>` interno, nunca en su `class`, porque su `cn` aplica su propio peso.
- **Un rol nuevo** se declara en el tema (`--text-<rol>` + `@utility type-<rol>`) **y** se registra en [`app/lib/utils.ts`](../app/lib/utils.ts). Si no, `cn` lo confunde con un color y lo descarta.

### 4.2 Campos

- Todo input, textarea, select y buscador usa la utilidad `field-text`: **16px en todos los anchos** para placeholder, dato y prefijos/sufijos (`+502`, `Q`, `%`). Con 16px iOS no hace zoom al enfocar, sin trucos en el viewport.
- El dato va en bold y `foreground`; el placeholder, el prefijo/sufijo y la opción vacía van en medium y `muted-foreground`. Lo pone `field-text` en el componente base, no el módulo.
- Ningún campo define otro tamaño, peso ni color.

## 5. Formularios y dialogs

### 5.1 Validación (tres capas)

Cada límite se aplica igual en las tres capas:

1. **Pantalla:** `maxlength` y, en textos largos, contador.
2. **Servidor:** el mismo esquema zod de `shared/schemas/` lo usan el formulario (vee-validate) y la ruta Nitro o la llamada RPC.
3. **Postgres:** `check (char_length(campo) <= n)`.

Límites iniciales del plan:

| Campo | Máximo | Regla |
|---|---|---|
| Nombre de negocio / empleado / cliente | 80 / 100 / 100 | Validar y normalizar |
| Placa | 12 | Mayúsculas, aceptar "sin placa" |
| Teléfono | 20 | Guardar normalizado |
| Nombre de servicio | 80 | Catálogo antes que texto libre |
| Notas de la orden | 300 | Opcional, sin índice |
| Motivo de anulación o retiro | 200 | Opciones frecuentes + texto corto |

### 5.2 Estructura

- **Un título por campo** con `AppField`; nunca un título para varios inputs en fila. El formulario crece hacia abajo.
- **Sin textos sueltos alrededor del campo:** lo que no es título ni campo ("Opcional", una ayuda, un dato calculado) va en `help` de `AppField`, un botón "?" junto al título que lo muestra en tooltip. En un switch o fila con control, en `AppHelp` junto a su texto.
- **Texto largo = `AppTextarea`** con `maxlength` y contador (un motivo, una nota). `AppInput` solo para valores cortos.
- Fila con control al lado: `type-row` + detalle `type-meta`. Switch con texto: `AppSwitch`.
- Los desplegables son `AppSelect`.

### 5.3 Dialogs

- **Un solo ancho** (`AppDialog` sin `size`, `max-w-md`), también la confirmación. Excepción única: la comparación de planes (`size="wide"`).
- En teléfono el dialog de un formulario se muestra como sheet desde abajo, al alcance del pulgar (lo resuelve `AppDialog`, no el módulo).
- `AppField` y su control, uno debajo del otro, en `space-y-5`.
- **Dos columnas** solo para pares naturales (inicio y fin; un campo corto junto a un monto). **Tres columnas jamás.**
- **Sin cards ni paneles** envolviendo campos dentro de un dialog, y **sin líneas** (`divide-y`, `border-t`): los grupos se separan con espacio.
- **Botones jamás debajo de un campo:** la acción va a la derecha como `AppToolbarAction` (ícono, el texto en tooltip). Las acciones del dialog van solo en su pie.
- **Orden de un formulario:** (1) campos que todo caso necesita, los más usados primero (en un cobro: Método y Monto); (2) switches de lo opcional (descuento, propina, factura) juntos, cada uno despliega sus campos con `AppUnfold`; (3) listados en `AppScrollList` (muestran 5, el resto con scroll interno); (4) el resumen.
- **Un campo que depende de otro aparece solo cuando aplica** con `AppUnfold` (la Referencia solo con transferencia o tarjeta; al volver a efectivo se borra).
- El cuerpo de `AppDialog` lleva `scroll-fade-y`.
- **Los overlays se controlan con `v-model:open`**, nunca se montan con `v-if`: eso corta la animación de salida.

### 5.4 Acciones de dinero y aprobaciones

- Toda acción de dinero (cobrar, anular, retirar, reembolsar, cerrar caja) envía un `client_id` (UUID v7) generado en el dispositivo: **reintentar no duplica**.
- El botón queda en `loading` mientras la operación está en curso y no se puede pulsar dos veces.
- Anular, cambiar precio o dar un descuento mayor al límite pide aprobación (celular del dueño o gerente, o su clave). La interfaz nunca ofrece borrar una orden.
- El cierre de caja es **ciego**: el cajero declara lo contado sin ver lo esperado.

## 6. Responsive y táctil (prioridad máxima)

- **Se diseña desde el teléfono hacia arriba** y se verifica en **320, 360, 375, 768, 1024, 1280 y 1920 px**: sin scroll horizontal, sin recortes, sin elementos tapados.
- Las pantallas del operario (ingreso por placa, cola, cobro) se prueban primero en 360 px, el ancho más común de Android de gama baja.
- Breakpoints de viewport (`sm:` `md:` `lg:`) solo para el layout de página y el shell. Un componente que vive en contenedores de ancho variable responde a su contenedor con container queries (`@container` + `@sm:`…).
- Antes de componer, decidir qué se ve a primera vista en cada tamaño. Lo secundario se oculta o se compacta.
- **Objetivos táctiles de 44px** (`size-tap`, `min-h-tap`) en todo lo que el operario toca. Nada depende solo de hover.
- Alturas en `dvh` y márgenes con safe-area (`pt-safe`, `pb-safe`).
- **Margen lateral en teléfono: 16px** desde el borde.
- **Acciones principales al alcance del pulgar:** en teléfono, la acción principal de una pantalla del operario va abajo.
- **Evitar scrollbars:** si algo desborda por pocos px, se ajustan los espacios vacíos, no se achican los componentes. Los scroll que quedan van sin barra (`scrollbar-none`).
- **Paneles hermanos con la misma altura.**
- **Espacio reservado:** lo que aparece o desaparece según un estado (un descuento, un total, un badge) ocupa siempre su lugar: se oculta con `invisible` + `aria-hidden`, no se quita del DOM, para que nada salte.
- **Al ajustar un componente no se tocan las dimensiones de los demás.**
- **Aire para la sombra:** un contenedor que recorta (`overflow-*`) deja al menos 8px entre su borde y las cards, con margen negativo + padding igual (`-mx-2 px-2`).

## 7. Íconos

- Primero **Lucide** (`lucide-vue-next`, el set de shadcn-vue).
- Íconos propios (WhatsApp, logo): SVG en `app/assets/svg/<nombre>.svg`, cargados como componente con `nuxt-svgo` (se instala cuando llegue el primer ícono propio). Nunca un `.vue` que solo envuelva un `<svg>`.
- Decorativo: `aria-hidden="true"`. Con significado: `role="img"` + `aria-label`.

## 8. Carga, skeletons y transiciones

### 8.1 Skeletons

- **Solo aparecen si la carga tarda:** cada vista (`AppReveal`) espera 250ms antes de mostrar el suyo. Si los datos llegan antes, el contenido entra directo.
- **Nunca un spinner ni "Cargando…" para cargar una vista.** El spinner queda solo para acciones en curso (`AppButton loading`, el ícono de actualizar).
- **Una vista entra entera:** cada ruta, pestaña o detalle que carga datos es una vista, y espera a todos sus componentes con datos (`useRevealLoading(cond)`). La condición debe terminar siempre, también con error.
- **El skeleton es del módulo, nunca del shell:** la barra lateral y el topbar no tienen skeleton.
- **Sin texto real en un skeleton:** títulos, encabezados y estados vacíos van en barras.
- **Reproduce el layout real** (misma grilla, mismas cards, mismos breakpoints): al llegar los datos no se mueve nada.
- **Cada pieza que se repite tiene su skeleton en el mismo archivo** o junto a él: `OrderCard` → `OrderCardSkeleton`. Se construyen con `Skeleton` de shadcn y el shimmer del tema.
- **Cantidades:** una lista de cards de un módulo muestra 5; un listado dentro de un panel, 3.
- **Una sola etapa:** una card carga entera, nunca título real con skeleton adentro.
- Solo en la primera carga. Al recargar con datos en pantalla se mantiene el contenido y se indica la actualización en el botón.
- El contenedor lleva `aria-busy="true"` y el skeleton `aria-hidden="true"`.

### 8.2 Transiciones

- **Viven en el componente base**, nunca en la página. Cada tipo de elemento tiene una sola entrada y una sola salida: dialog, sheet, menú, tooltip, toast, pestañas, listas, skeleton → contenido, expandibles, estado vacío, error de validación, presión de botón.
- **Entrada de vista:** `animate-reveal` (opacidad y 4px de desplazamiento, 300ms), aplicada por `AppReveal` a todo el módulo a la vez, nunca componente por componente.
- **Duraciones del tema:** `duration-150` (hover, color, presión), `duration-300` (cambios de estado), `duration-500` (superficies grandes). Curvas `ease-*` del tema.
- Se anima `transform` y `opacity`. Transición específica (`transition-colors`, `transition-opacity`, `transition-transform`); `transition-all` solo si animan varias propiedades.
- **Listas escalonadas** con la utilidad `stagger`: el elemento solo pasa su índice (`:style="{ '--i': i }"`).
- **Sin zoom al pasar el puntero** (`hover:scale-*` prohibido). La presión de botón (`active:scale-95`) sí.
- **Menús de opciones:** la opción elegida lleva un check a la derecha (`AppMenuRadioItem`), nunca el punto de shadcn.
- **Cero animaciones de relleno.** Si no comunica nada, se borra.
- **`prefers-reduced-motion` se respeta en todo** con la regla global del tema.

## 9. Datos y estado

- **Pinia solo para estado de sesión:** usuario, rol, tenant y sucursal activa. Los datos remotos van con **@tanstack/vue-query**; nunca se copian a un store.
- Las query keys siempre incluyen tenant y sucursal: `['orders', tenantId, branchId, filtros]`.
- **Paginación:** toda lista trae como máximo `PAGE_SIZE` registros (15, en `shared/constants.ts`) y agrega la siguiente página con "Cargar más". Las páginas se piden al servidor (`.range()` o `p_limit`/`p_offset`).
- **Realtime solo en la pantalla de cola:** un canal privado por sucursal, eventos livianos (id, estado, versión), conexión abierta solo con la pantalla activa y sondeo cada 15s como respaldo.
- **Lecturas** desde el cliente con `useSupabaseClient()` (protegidas por RLS). **Escrituras de dinero y aprobaciones** solo por RPC o ruta Nitro.
- **Llaves secretas** (`SUPABASE_SECRET_KEY`, WhatsApp, FEL) solo en `server/`. Nunca en `runtimeConfig.public` ni en `app/`.
- **Montos:** en la base `numeric`, nunca `float`. En el cliente no se suman montos con `number` para guardar: el total oficial lo calcula el servidor. Para mostrar se usa `useMoney()` con la moneda del tenant; nunca se escribe "Q" a mano.
- **Fechas:** se guardan en UTC y se muestran y agrupan en la zona horaria de la sucursal (`branches.timezone`).
- **Tipos de la base** generados (`npm run db:types` o `db:types:remote`) después de cada migración. Nunca se escriben a mano.

## 10. Base de datos y migraciones

- Todo cambio de esquema es una migración en `supabase/migrations/`. Nunca se edita el esquema desde el panel de Supabase. A producción solo entra por CI.
- **Cada tabla de negocio lleva `tenant_id`, RLS activada y su política** (aislamiento por tenant + `branch_scope` restrictiva si tiene sucursal).
- Llaves foráneas compuestas `(tenant_id, id)` entre tablas de negocio, e índice en cada FK.
- Montos en `numeric(12,2)`; textos con `check (char_length(...) <= n)`.
- Borrado según la política de retención del plan: soft delete solo en lo crítico, las órdenes y movimientos de caja **nunca** se borran (se anulan).
- `audit_log` es de solo inserción.
- **Cada tabla nueva trae su prueba de RLS** en `tests/rls/`: un usuario de otro tenant y uno de otra sucursal intentan leer, crear, editar y borrar, y fallan.

## 11. Textos de la interfaz

- Español neutro con vocabulario de car wash: **cliente, vehículo, placa, orden, lavador, cajero, gerente, dueño, sucursal, caja**. Siempre las mismas palabras para lo mismo ("orden", no a veces "ticket" y a veces "servicio").
- Estados de la orden con nombres fijos: En espera, Lavando, Secando, Listo, Entregado, Anulado.
- Las alertas antifraude hablan de **señales** ("3 anulaciones más que el promedio"), nunca acusan.
- Placeholders que dicen qué escribir ("Placa del vehículo"), no ejemplos inventados.
- **Sin guiones largos** (`—`, `–`): en frases `:` o `,`; en rangos y valores vacíos, guion normal (`10:00 - 10:30`, `-`).
- Errores en lenguaje del usuario, con qué hacer: "No se pudo cobrar. Revisa tu conexión e intenta de nuevo."

## 12. Código

- **Vue 3 con `<script setup lang="ts">`** y Composition API. TypeScript estricto; `any` solo con comentario que diga por qué.
- Props tipadas con `defineProps<…>()` y valores por defecto con `withDefaults`. Eventos con `defineEmits<…>()`.
- **Comentarios:** una sola línea, en inglés, y solo si el código no se explica solo. Nada de bloques JSDoc ni historias de tickets: el porqué largo va en el commit o en `docs/`.
- Entre dos soluciones igual de eficientes, la más simple. Sin código muerto ni comentado.
- Sin dependencias nuevas sin motivo: primero lo que ya trae el stack.

## 13. Accesibilidad

- Todo control tiene nombre accesible (texto, `aria-label` o `<label>`).
- Contraste mínimo AA: las tintas del tema ya lo cumplen sobre `background`; no se usan tintas más claras para texto.
- Foco visible siempre (`ring` del tema). Nunca `outline-none` sin reemplazo.
- El estado no se comunica solo con color: un badge de estado lleva su palabra.

## 14. Forma de trabajo

- Los cambios se hacen a mano, archivo por archivo (leer, decidir, editar), con la herramienta Edit. Nada de scripts que editen en lote ni de `Get-Content`/`Set-Content` de PowerShell 5.1 (rompen los acentos).
- **Consola limpia:** cero errores y cero warnings en DevTools al cargar y recargar cada página tocada.
- Commits pequeños y con mensaje que explique el porqué.

## 15. Lista de verificación

Antes de dar algo por terminado:

- [ ] `npm run check` en verde (lint, tipos, pruebas unitarias y `audit:design`).
- [ ] `npm run build` sin errores.
- [ ] `npm run audit:design -- <archivos tocados>` sin violaciones.
- [ ] Ningún archivo de `components/ui/` editado a mano.
- [ ] Cada valor visual sale del tema: sin hex, sin `[…]`, sin `text-<tamaño>` ni `font-<peso>` fuera de `ui/` y `app/`.
- [ ] Capturas en 320, 360, 375, 768, 1024, 1280 y 1920 px, del contenido y del skeleton (con red lenta).
- [ ] Consola limpia al cargar y recargar.
- [ ] Si se tocó la base: migración, prueba de RLS y tipos regenerados.
- [ ] Si se tocó dinero: idempotencia con `client_id` y operación en el servidor.

## 16. Excepciones vigentes

| Excepción | Motivo |
|---|---|
| Superficies sólidas (`surface-*`) en lugar de vidrio con `backdrop-blur` | El blur es caro en celulares de gama baja |
| Entrada de vista con opacidad y desplazamiento, no con desenfoque | Mismo motivo: un `filter: blur` sobre toda la vista traba la animación |
| `field-text` en 16px | Evita el zoom de iOS sin tocar el viewport y se lee mejor en el piso |
| Escala de texto mínima de 10px | Uso a la intemperie con celular de gama baja |
