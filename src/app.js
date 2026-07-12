import config from './config/env.config.js';
import ServiceManager from './managers/ServiceManager.js';

const manager = new ServiceManager();

async function main() {
  console.log(
    `Café Aurora · Sistema de turnos y reservas (modo ${config.nodeEnv}, puerto ${config.port})`
  );
  console.log('-------------------------------------------------------------');

  // Listar todos los servicios
  const servicios = await manager.getServices();
  console.log(`Servicios disponibles: ${servicios.length}`);
  console.table(servicios);

  // Buscar un servicio por id
  const servicio = await manager.getServiceById(1);
  console.log('\nBúsqueda por id (1):');
  console.log(servicio);

  // Agregar un nuevo servicio (el id se genera automáticamente)
  const nuevo = await manager.addService({
    name: 'Suscripción mensual de café',
    description: 'Entrega mensual de 500 g de café recién tostado a domicilio.',
    duration: 0,
    price: 18000,
    category: 'Suscripciones',
    available: true,
  });
  console.log('\nServicio agregado:');
  console.log(nuevo);

  // Actualizar un servicio existente (no se permite cambiar el id)
  const actualizado = await manager.updateService(nuevo.id, {
    price: 16500,
    available: false,
  });
  console.log('\nServicio actualizado:');
  console.log(actualizado);

  // Eliminar el servicio recién creado
  const eliminado = await manager.deleteService(nuevo.id);
  console.log('\nServicio eliminado:');
  console.log(eliminado);

  // Intentar agregar un servicio inválido (se rechaza con un error descriptivo)
  console.log('\nIntento de agregar un servicio inválido:');
  try {
    await manager.addService({
      name: 'Servicio sin datos',
      price: -100,
      available: 'sí',
    });
  } catch (error) {
    console.log(`Rechazado correctamente → ${error.message}`);
  }
}

main().catch((error) => {
  console.error('Ocurrió un error al ejecutar la aplicación:', error.message);
  process.exit(1);
});
