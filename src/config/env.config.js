import dotenv from 'dotenv';

// Carga las variables de entorno lo antes posible en el ciclo de vida de la app
dotenv.config();

// Variables obligatorias para que la aplicación pueda iniciar
const REQUERIDAS = ['PORT', 'NODE_ENV'];

// Validación Fail-Fast: si falta alguna variable, la app no arranca
const faltantes = REQUERIDAS.filter((clave) => !process.env[clave]);

if (faltantes.length > 0) {
  console.error(
    `Error de configuración: faltan variables de entorno obligatorias: ${faltantes.join(', ')}.`
  );
  console.error('Revisa tu archivo .env tomando como referencia .env.example.');
  process.exit(1);
}

const config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
};

export default config;
