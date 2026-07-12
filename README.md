# Café Aurora · Administrador de Servicios

Proyecto Node.js (con ES Modules) que implementa la clase `ServiceManager` para gestionar
los servicios de un sistema de turnos y reservas. Los datos se persisten en un archivo
JSON local, de modo que sobreviven al reinicio del proceso.

Corresponde a la **Pre-entrega 1** del curso de Backend.

## Descripción

`ServiceManager` administra el catálogo de servicios reservables de Café Aurora
(catas, talleres, arriendo de espacios, suscripciones, etc.). Permite listar, buscar,
agregar, actualizar y eliminar servicios, validando los datos y generando el identificador
de forma automática.

## Requisitos

- Node.js 18 o superior (se usa `node --watch` y `fs/promises`).

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/mcornejov/coderhouse-backend.git
cd coderhouse-backend/PreEntrega1

# Instalar dependencias
pnpm install
```

## Variables de entorno

Antes de ejecutar, crea un archivo `.env` en la raíz tomando como referencia
`.env.example`:

```bash
PORT=8080
NODE_ENV=development
```

| Variable   | Descripción                              | Ejemplo       |
|------------|------------------------------------------|---------------|
| `PORT`     | Puerto en el que se levanta la app       | `8080`        |
| `NODE_ENV` | Entorno de ejecución                     | `development` |

Si falta alguna variable obligatoria, la aplicación no inicia y muestra un mensaje claro
(patrón Fail-Fast). El archivo `.env` **no** se sube al repositorio.

## Ejecución

```bash
pnpm start       # ejecuta src/app.js
pnpm dev         # ejecuta con recarga automática (node --watch)
```

`app.js` incluye una demostración de uso de todos los métodos del `ServiceManager`.

## Recurso: `services`

Cada servicio tiene la siguiente forma:

```json
{
  "id": 1,
  "name": "Cata de café de especialidad",
  "description": "Degustación guiada de cinco orígenes con notas de cata.",
  "duration": 60,
  "price": 15000,
  "category": "Experiencias",
  "available": true
}
```

| Campo         | Tipo      | Descripción                                   |
|---------------|-----------|-----------------------------------------------|
| `id`          | `number`  | Identificador único (generado automáticamente)|
| `name`        | `string`  | Nombre del servicio                           |
| `description` | `string`  | Descripción del servicio                      |
| `duration`    | `number`  | Duración en minutos                           |
| `price`       | `number`  | Precio en pesos chilenos (CLP)                |
| `category`    | `string`  | Categoría del servicio                        |
| `available`   | `boolean` | Si está disponible para reservar              |

## Métodos del `ServiceManager`

| Método                          | Descripción                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| `getServices()`                 | Devuelve todos los servicios.                                               |
| `getServiceById(id)`            | Devuelve el servicio con ese `id`, o `null` si no existe.                    |
| `addService(serviceData)`       | Agrega un servicio; el `id` se genera solo. Valida campos obligatorios.      |
| `updateService(id, updatedData)`| Actualiza un servicio; no permite cambiar el `id`. Devuelve `null` si no existe. |
| `deleteService(id)`             | Elimina un servicio; devuelve el eliminado o `null` si no existe.            |

### Ejemplos de uso

```js
import ServiceManager from './src/managers/ServiceManager.js';

const manager = new ServiceManager();

// Listar todos
const servicios = await manager.getServices();

// Buscar por id
const servicio = await manager.getServiceById(1);

// Agregar (el id se genera automáticamente)
const nuevo = await manager.addService({
  name: 'Suscripción mensual de café',
  description: 'Entrega mensual de 500 g de café recién tostado.',
  duration: 0,
  price: 18000,
  category: 'Suscripciones',
  available: true,
});

// Actualizar (no se permite modificar el id)
await manager.updateService(nuevo.id, { price: 16500, available: false });

// Eliminar
await manager.deleteService(nuevo.id);
```

### Validaciones

`addService` valida **presencia y tipo** de cada campo antes de guardar; si algo falla,
lanza un error descriptivo y no persiste nada:

- `name`, `description`, `category`: texto no vacío.
- `duration`, `price`: número mayor o igual a `0`.
- `available`: booleano.

`updateService` aplica las mismas reglas, pero solo sobre los campos que se envían
(validación parcial), y descarta cualquier `id` recibido para que no se pueda alterar el
identificador de un servicio existente.

## Estructura del proyecto

```
src/
  config/
    env.config.js      # Carga y valida las variables de entorno (Fail-Fast)
  managers/
    ServiceManager.js  # Lógica de gestión de servicios
  data/
    services.json      # Persistencia de los servicios
  app.js               # Punto de entrada / demostración de uso
.env.example
.gitignore
package.json
README.md
```
