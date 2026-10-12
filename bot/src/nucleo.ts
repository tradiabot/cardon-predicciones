// Lo que la app del teléfono usa de este código. `npm run app` lo empaqueta en app/web/nucleo.js,
// así la app y el agente de la nube leen los mercados con exactamente el mismo módulo.
export { alternarGuardada, CATEGORIAS, categoriaDe, cerradas, clave, contar, explorar, FILTRO_VACIO, filtrar, PRECIOS } from './explorar';
export { buscarPlataforma, crearPlataformas } from './plataformas/registro';
