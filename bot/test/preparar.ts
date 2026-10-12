// Las pruebas nunca tocan la red de verdad: ni leen mercados reales ni, mucho menos, pueden
// enviar una orden con dinero real. Cada prueba recibe su propia red simulada.
globalThis.fetch = (async (url: unknown) => {
  throw new Error(`Las pruebas no pueden salir a la red (${String(url)})`);
}) as typeof fetch;
