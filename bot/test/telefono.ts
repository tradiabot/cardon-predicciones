// Un teléfono simulado: crea una llave P-256 y firma como Android (SHA256withECDSA, formato DER).
export async function telefonoSimulado() {
  const par = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publica = Buffer.from(await crypto.subtle.exportKey('spki', par.publicKey)).toString('base64');
  const entero = (b: Uint8Array) => {
    let v = b;
    while (v.length > 1 && v[0] === 0 && !(v[1] & 0x80)) v = v.subarray(1);
    if (v[0] & 0x80) v = Uint8Array.from([0, ...v]);
    return [0x02, v.length, ...v];
  };
  async function firmar(mensaje: string): Promise<string> {
    const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, par.privateKey, new TextEncoder().encode(mensaje)));
    const cuerpo = [...entero(raw.subarray(0, 32)), ...entero(raw.subarray(32))];
    return Buffer.from([0x30, cuerpo.length, ...cuerpo]).toString('base64');
  }
  return { publica, firmar };
}
