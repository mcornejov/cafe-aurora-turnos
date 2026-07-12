import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Reconstrucción de __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta por defecto al archivo de persistencia
const RUTA_POR_DEFECTO = path.join(__dirname, '..', 'data', 'services.json');

// Campos obligatorios de cada servicio
const CAMPOS_REQUERIDOS = [
  'name',
  'description',
  'duration',
  'price',
  'category',
  'available',
];

// Error de validación de datos. Permite distinguir en la capa de rutas un error
// del cliente (400) de un error interno del servidor (500).
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ServiceManager {
  // Cola interna para serializar las escrituras
  #cola = Promise.resolve();

  constructor(rutaArchivo = RUTA_POR_DEFECTO) {
    this.path = rutaArchivo;
  }

  // Serializa las operaciones de escritura para evitar condiciones de carrera
  // (dos escrituras concurrentes que se pisen y pierdan datos).
  #enCola(operacion) {
    const resultado = this.#cola.then(() => operacion());
    // La cola sigue avanzando aunque una operación falle.
    this.#cola = resultado.then(
      () => {},
      () => {}
    );
    return resultado;
  }

  // Lee y parsea el archivo; si no existe todavía, devuelve un arreglo vacío
  async #leerArchivo() {
    try {
      const contenido = await fs.readFile(this.path, 'utf-8');
      return JSON.parse(contenido);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // Guarda el arreglo de forma atómica (archivo temporal + rename), para que una
  // lectura concurrente nunca vea el archivo a medio escribir.
  async #guardarArchivo(services) {
    await fs.mkdir(path.dirname(this.path), { recursive: true });
    const rutaTemporal = `${this.path}.tmp`;
    await fs.writeFile(rutaTemporal, JSON.stringify(services, null, 2));
    await fs.rename(rutaTemporal, this.path);
  }

  // Deja solo los campos conocidos de un objeto (lista blanca), descartando extras
  #soloCamposConocidos(datos) {
    const resultado = {};
    for (const campo of CAMPOS_REQUERIDOS) {
      if (datos[campo] !== undefined) {
        resultado[campo] = datos[campo];
      }
    }
    return resultado;
  }

  // Valida presencia y tipo de cada campo.
  // Con { parcial: true } solo valida los campos presentes (para updateService).
  #validarServicio(serviceData, { parcial = false } = {}) {
    if (!serviceData || typeof serviceData !== 'object') {
      throw new ValidationError('Los datos del servicio deben ser un objeto.');
    }

    const esTextoValido = (valor) =>
      typeof valor === 'string' && valor.trim() !== '';
    const esNumeroValido = (valor) =>
      typeof valor === 'number' && !Number.isNaN(valor) && valor >= 0;
    const esBooleanoValido = (valor) => typeof valor === 'boolean';

    const reglas = {
      name: esTextoValido,
      description: esTextoValido,
      category: esTextoValido,
      duration: esNumeroValido,
      price: esNumeroValido,
      available: esBooleanoValido,
    };

    const errores = [];

    for (const campo of CAMPOS_REQUERIDOS) {
      const presente = serviceData[campo] !== undefined;

      if (!presente) {
        // En modo parcial (update) se aceptan campos ausentes
        if (!parcial) {
          errores.push(`falta "${campo}"`);
        }
        continue;
      }

      if (!reglas[campo](serviceData[campo])) {
        errores.push(`"${campo}" tiene un valor inválido`);
      }
    }

    if (errores.length > 0) {
      throw new ValidationError(
        `Datos del servicio inválidos: ${errores.join(', ')}.`
      );
    }
  }

  // Devuelve todos los servicios
  async getServices() {
    return await this.#leerArchivo();
  }

  // Devuelve un servicio por id, o null si no existe
  async getServiceById(id) {
    const services = await this.#leerArchivo();
    const service = services.find((s) => s.id === Number(id));
    return service ?? null;
  }

  // Agrega un servicio con id generado automáticamente
  async addService(serviceData) {
    this.#validarServicio(serviceData);
    const datos = this.#soloCamposConocidos(serviceData);

    return this.#enCola(async () => {
      const services = await this.#leerArchivo();
      const nuevoId =
        services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;

      const nuevoServicio = { id: nuevoId, ...datos };

      services.push(nuevoServicio);
      await this.#guardarArchivo(services);

      return nuevoServicio;
    });
  }

  // Actualiza un servicio existente; no permite modificar el id ni agregar campos extra
  async updateService(id, updatedData) {
    // Se descarta cualquier intento de modificar el id y se ignoran campos desconocidos
    const { id: _idIgnorado, ...resto } = updatedData ?? {};
    const datosPermitidos = this.#soloCamposConocidos(resto);

    return this.#enCola(async () => {
      const services = await this.#leerArchivo();
      const indice = services.findIndex((s) => s.id === Number(id));

      // Si el servicio no existe se devuelve null (404), sin importar el body
      if (indice === -1) {
        return null;
      }

      // Recién ahora se validan los campos entrantes (400 si son inválidos)
      this.#validarServicio(datosPermitidos, { parcial: true });

      services[indice] = { ...services[indice], ...datosPermitidos };
      await this.#guardarArchivo(services);

      return services[indice];
    });
  }

  // Elimina un servicio por id; devuelve el eliminado o null si no existe
  async deleteService(id) {
    return this.#enCola(async () => {
      const services = await this.#leerArchivo();
      const indice = services.findIndex((s) => s.id === Number(id));

      if (indice === -1) {
        return null;
      }

      const [eliminado] = services.splice(indice, 1);
      await this.#guardarArchivo(services);

      return eliminado;
    });
  }
}

export default ServiceManager;
