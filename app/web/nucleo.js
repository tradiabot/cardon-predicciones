/* Generado con «npm run app» desde bot/src. No lo edites a mano. */
"use strict";
var NUCLEO = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/nucleo.ts
  var nucleo_exports = {};
  __export(nucleo_exports, {
    CATEGORIAS: () => CATEGORIAS,
    CONFIANZA_VERDE: () => CONFIANZA_VERDE,
    FILTRO_VACIO: () => FILTRO_VACIO,
    MODELOS_SIN_CLAVE: () => MODELOS_SIN_CLAVE,
    PRECIOS: () => PRECIOS,
    VENTAJA_MIN: () => VENTAJA_MIN,
    VENTAJA_MIN_DOBLE: () => VENTAJA_MIN_DOBLE,
    alternarGuardada: () => alternarGuardada,
    analizar: () => analizar,
    buscarPlataforma: () => buscarPlataforma,
    categoriaDe: () => categoriaDe,
    cerradas: () => cerradas,
    clave: () => clave,
    contar: () => contar,
    crearPlataformas: () => crearPlataformas,
    etiquetaModelo: () => etiquetaModelo,
    explorar: () => explorar,
    filtrar: () => filtrar,
    leerGlobal: () => leerGlobal,
    preguntar: () => preguntar
  });

  // src/explorar.ts
  var CATEGORIAS = ["cripto_hoy", "cripto_mediano", "bolsa", "economia", "otro"];
  var PRECIOS = [0.5, 0.1];
  var FILTRO_VACIO = { categoria: "", creador: "", precioMax: 0, plataforma: "", texto: "" };
  var clave = (m) => `${m.plataforma}:${m.id}`;
  var categoriaDe = (m) => m.categoria === "cripto" ? `cripto_${m.plazo}` : m.categoria;
  var barato = (m, max) => m.lados.some((l) => l.precio != null && l.precio < max);
  async function explorar(plataformas, idioma = "es", ahora = Date.now) {
    const r = await Promise.allSettled(plataformas.map((p) => p.listarMercados(idioma)));
    const out = { ts: ahora(), mercados: [], errores: [] };
    r.forEach((x, i) => {
      var _a;
      if (x.status === "fulfilled") out.mercados.push(...x.value.mercados);
      else out.errores.push({ plataforma: plataformas[i].id, error: String(((_a = x.reason) == null ? void 0 : _a.message) || x.reason) });
    });
    return out;
  }
  function filtrar(mercados, f, guardadas = {}) {
    const q = f.texto.trim().toLowerCase();
    return mercados.filter((m) => {
      if (f.plataforma && m.plataforma !== f.plataforma) return false;
      if (f.creador && m.creador !== f.creador) return false;
      if (f.precioMax && !barato(m, f.precioMax)) return false;
      if (q && !m.pregunta.toLowerCase().includes(q)) return false;
      if (f.categoria === "guardadas") return !!guardadas[clave(m)];
      return !f.categoria || categoriaDe(m) === f.categoria;
    });
  }
  function contar(mercados, guardadas = {}) {
    const categorias = {}, creadores = {}, plataformas = {}, precios = {};
    for (const m of mercados) {
      categorias[categoriaDe(m)] = (categorias[categoriaDe(m)] || 0) + 1;
      creadores[m.creador] = (creadores[m.creador] || 0) + 1;
      plataformas[m.plataforma] = (plataformas[m.plataforma] || 0) + 1;
      for (const p of PRECIOS) if (barato(m, p)) precios[p] = (precios[p] || 0) + 1;
    }
    return { total: mercados.length, categorias, creadores, plataformas, precios, guardadas: Object.keys(guardadas).length };
  }
  function cerradas(guardadas, e) {
    const abiertos = new Set(e.mercados.map(clave)), sinDatos = new Set(e.errores.map((x) => x.plataforma));
    return Object.keys(guardadas).filter((k) => !abiertos.has(k) && !sinDatos.has(guardadas[k].plataforma)).map((k) => guardadas[k]);
  }
  function alternarGuardada(guardadas, m, ahora) {
    var _a;
    const out = { ...guardadas }, k = clave(m);
    if (out[k]) delete out[k];
    else out[k] = { plataforma: m.plataforma, id: m.id, pregunta: m.pregunta, ts: ahora, vence: (_a = m.vence) != null ? _a : null };
    return out;
  }

  // src/plataformas/tipos.ts
  var ErrorPlataforma = class extends Error {
    constructor(plataforma, mensaje) {
      super(mensaje);
      this.plataforma = plataforma;
      this.name = "ErrorPlataforma";
    }
  };

  // src/plataformas/hyperliquid.ts
  var ID = "hyperliquid";
  var URL_INFO = "https://api.hyperliquid.xyz/info";
  var MINIMO_ORDEN = 1;
  var HORAS_HOY = 36;
  var MAX_MERCADOS = 300;
  var CREADORES = { "": "Hyperliquid", out: "out", skew: "skew", txyz: "trade.xyz" };
  var NOMBRES_SUB = {
    "xyz:XYZ100": ["Nasdaq 100", "Nasdaq 100"],
    "xyz:SP500": ["S&P 500", "S&P 500"],
    "xyz:CL": ["Petr\xF3leo WTI", "WTI crude oil"],
    "xyz:BRENTOIL": ["Petr\xF3leo Brent", "Brent crude oil"],
    "xyz:GOLD": ["Oro", "Gold"],
    "xyz:SILVER": ["Plata", "Silver"],
    "xyz:SPCX": ["SpaceX", "SpaceX"]
  };
  var ES_DEPORTE = /sport|award|contest/i;
  function campos(desc) {
    const out = {};
    for (const parte of String(desc || "").split("|")) {
      const i = parte.indexOf(":");
      if (i > 0) out[parte.slice(0, i).trim()] = parte.slice(i + 1).trim();
    }
    return out;
  }
  function venceMs(t) {
    const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(String(t || ""));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
  }
  function numero(x) {
    const n = Number(x);
    return x != null && x !== "" && Number.isFinite(n) ? n : null;
  }
  function cifraEn(n, idioma = "es") {
    if (n >= 1e3) return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const s = String(Number(n.toPrecision(6)));
    return idioma === "en" ? s : s.replace(".", ",");
  }
  function textos(idioma) {
    const es = idioma !== "en";
    const cifra = (n) => cifraEn(n, idioma);
    const fecha = (ms) => ms ? new Date(ms).toLocaleDateString(es ? "es" : "en", { day: "numeric", month: "short", timeZone: "UTC" }) : "";
    const si = es ? "\xABS\xED\xBB" : "\u201CYes\u201D";
    return {
      es,
      fecha,
      sub: (s) => {
        var _a;
        return ((_a = NOMBRES_SUB[s]) == null ? void 0 : _a[es ? 0 : 1]) || s.replace(/^xyz:/, "");
      },
      lado(n) {
        const x = String(n || "").replace(/^template:/, "");
        if (x === "Yes") return es ? "S\xED" : "Yes";
        if (x === "Over") return es ? "M\xE1s" : "Over";
        if (x === "Under") return es ? "Menos" : "Under";
        return x;
      },
      precio: (N, o) => es ? { pregunta: `\xBF${N} \u2265 ${cifra(o)} al vencer?`, regla: `${si} gana si ${N} est\xE1 en ${cifra(o)} o m\xE1s al vencer.` } : { pregunta: `${N} \u2265 ${cifra(o)} at expiry?`, regla: `${si} wins if ${N} is at ${cifra(o)} or higher at expiry.` },
      toque: (N, o, v) => es ? { pregunta: `\xBF${N} toca ${cifra(o)} antes del ${fecha(v)}?`, regla: `${si} gana si ${N} toca ${cifra(o)} en cualquier momento antes de vencer.` } : { pregunta: `${N} touches ${cifra(o)} before ${fecha(v)}?`, regla: `${si} wins if ${N} touches ${cifra(o)} at any time before expiry.` },
      rango(N, desde, hasta) {
        if (desde == null && hasta != null)
          return es ? { pregunta: `\xBF${N} < ${cifra(hasta)} al vencer?`, regla: `${si} gana si al vencer ${N} est\xE1 por debajo de ${cifra(hasta)}.` } : { pregunta: `${N} < ${cifra(hasta)} at expiry?`, regla: `${si} wins if ${N} is below ${cifra(hasta)} at expiry.` };
        if (hasta == null && desde != null)
          return es ? { pregunta: `\xBF${N} \u2265 ${cifra(desde)} al vencer?`, regla: `${si} gana si al vencer ${N} est\xE1 en ${cifra(desde)} o m\xE1s.` } : { pregunta: `${N} \u2265 ${cifra(desde)} at expiry?`, regla: `${si} wins if ${N} is at ${cifra(desde)} or higher at expiry.` };
        const a = cifra(desde != null ? desde : 0), b = cifra(hasta != null ? hasta : 0);
        return es ? { pregunta: `\xBF${N} entre ${a} y ${b} al vencer?`, regla: `${si} gana si al vencer ${N} est\xE1 entre ${a} y ${b}.` } : { pregunta: `${N} between ${a} and ${b} at expiry?`, regla: `${si} wins if ${N} is between ${a} and ${b} at expiry.` };
      },
      fuente: (f) => es ? ` Se resuelve con: ${f}.` : ` Resolved with: ${f}.`,
      tasa(institucion, nombre, etiqueta) {
        const fed = /federal/i.test(institucion);
        const que = /NoChange/.test(nombre) ? 0 : /Decrease/.test(nombre) ? 1 : 2;
        if (es) {
          const quien2 = fed ? "la Fed" : institucion || "el banco central";
          const v2 = ["mantiene", "baja", "sube"][que];
          return { pregunta: `\xBF${quien2[0].toUpperCase() + quien2.slice(1)} ${v2} la tasa de inter\xE9s (${etiqueta || "pr\xF3xima decisi\xF3n"})?`, regla: `${si} gana si ${quien2} ${v2} la tasa en esa decisi\xF3n.` };
        }
        const quien = fed ? "the Fed" : institucion || "the central bank";
        const v = ["holds", "cuts", "raises"][que];
        return { pregunta: `${quien[0].toUpperCase() + quien.slice(1)} ${v} the interest rate (${etiqueta || "next decision"})?`, regla: `${si} wins if ${quien} ${v} the rate at that decision.` };
      },
      ipo: (empresa, v) => es ? { pregunta: `\xBF${empresa} confirma su salida a bolsa antes del ${fecha(v)}?`, regla: `${si} gana si ${empresa} confirma oficialmente su salida a bolsa antes del ${fecha(v)}.` } : { pregunta: `${empresa} confirms its IPO before ${fecha(v)}?`, regla: `${si} wins if ${empresa} officially confirms its IPO before ${fecha(v)}.` },
      ipoValor(empresa, milesDeMillones, v) {
        if (es) {
          const valor2 = milesDeMillones >= 1e3 ? `${cifra(milesDeMillones / 1e3)} billones` : `${cifra(milesDeMillones)} mil millones`;
          return { pregunta: `\xBF${empresa} vale ${valor2} de USD o m\xE1s en su primer d\xEDa en bolsa?`, regla: `${si} gana si ${empresa} sale a bolsa antes del ${fecha(v)} y cierra su primer d\xEDa con ese valor o m\xE1s.` };
        }
        const valor = milesDeMillones >= 1e3 ? `${cifra(milesDeMillones / 1e3)} trillion` : `${cifra(milesDeMillones)} billion`;
        return { pregunta: `${empresa} worth USD ${valor} or more on its first trading day?`, regla: `${si} wins if ${empresa} lists before ${fecha(v)} and closes its first day at that value or more.` };
      }
    };
  }
  function leerMercado(o, q, T) {
    var _a, _b;
    const nombre = String(o.name || ""), desc = String(o.description || ""), c = campos(desc), cq = q ? campos(q.description) : {};
    if (ES_DEPORTE.test(nombre) || ES_DEPORTE.test(String((q == null ? void 0 : q.name) || "")) || c.participant || c.competition || c.candidate || cq.sport || cq.competition || cq.award) return null;
    if (/fallback/i.test(nombre) || desc === "other") return null;
    const perp = desc.startsWith("perp:") ? desc.split("|")[0].slice(5) : null;
    if (c.class === "priceBinary" && c.underlying) return { tipo: "precio", sub: c.underlying, objetivo: numero(c.targetPrice), vence: venceMs(c.expiry) };
    if (nombre === "template:binaryPrice" && perp) return { tipo: "precio", sub: perp, objetivo: numero(c.threshold), vence: venceMs(c.time), fuente: c.priceDescription };
    if (nombre === "template:priceTouch" && perp) return { tipo: "toque", sub: perp, objetivo: numero(c.target), vence: venceMs(c.time), fuente: c.priceDescription };
    if (nombre === "template:binaryPriceExternal") return { tipo: "precio", externo: c.shortName || c.instrument, objetivo: numero(c.threshold), vence: venceMs(c.time), fuente: c.priceDescription };
    if (cq.class === "priceBucket" && cq.underlying && c.index != null) {
      const t = String(cq.priceThresholds || "").split(",").map(Number).filter((x) => x > 0), k = Number(c.index);
      return { tipo: "rango", sub: cq.underlying, desde: k > 0 ? (_a = t[k - 1]) != null ? _a : null : null, hasta: k < t.length ? t[k] : null, vence: venceMs(cq.expiry) };
    }
    if (/^template:policyRate/.test(nombre)) return { tipo: "evento", categoria: "economia", ...T.tasa(String(cq.institution || ""), nombre, String(cq.decisionLabel || "")), vence: (_b = venceMs(cq.scheduledDecision)) != null ? _b : venceMs(cq.decisionDeadline) };
    if (nombre === "template:companyIpoConfirmed" && c.company) {
      const v = venceMs(c.dateTime);
      return { tipo: "evento", categoria: "economia", ...T.ipo(c.company, v), vence: v };
    }
    if (nombre === "template:companyIpoFirstDayMarketCap" && c.company) {
      const v = venceMs(c.listingDeadline);
      return { tipo: "evento", categoria: "economia", ...T.ipoValor(c.company, Number(c.marketCapThresholdB), v), vence: v };
    }
    const n2 = nombre.replace(/^template:/, "");
    return { tipo: "evento", categoria: "otro", pregunta: desc ? `${n2} \xB7 ${desc.slice(0, 80)}` : n2, vence: venceMs(cq.resolutionDeadline) };
  }
  function leerAyer(lados, ...activos) {
    var _a;
    const out = {};
    const positivo = (x) => {
      const n = numero(x);
      return n != null && n > 0 ? n : null;
    };
    for (const c of (Array.isArray(lados) ? lados[1] : null) || []) {
      if (typeof (c == null ? void 0 : c.coin) === "string" && c.coin.startsWith("#")) out[c.coin] = { ayer: positivo(c.prevDayPx), volumen: numero(c.dayNtlVlm) };
    }
    for (const par of activos) {
      if (!Array.isArray(par)) continue;
      const universo = ((_a = par[0]) == null ? void 0 : _a.universe) || [];
      universo.forEach((u, i) => {
        var _a2;
        if ((u == null ? void 0 : u.name) && ((_a2 = par[1]) == null ? void 0 : _a2[i])) out[u.name] = { ayer: positivo(par[1][i].prevDayPx), volumen: numero(par[1][i].dayNtlVlm) };
      });
    }
    return out;
  }
  var redondo = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
  function leerMercados(meta, precios, ahora, idioma = "es", ayer = {}) {
    var _a, _b, _c, _d;
    const T = textos(idioma);
    const preguntas = {};
    for (const q of (meta == null ? void 0 : meta.questions) || []) for (const n of [...(q == null ? void 0 : q.namedOutcomes) || [], q == null ? void 0 : q.fallbackOutcome]) preguntas[n] = q;
    const lista = [];
    for (const o of (meta == null ? void 0 : meta.outcomes) || []) {
      if (!o || typeof o.outcome !== "number") continue;
      const m = leerMercado(o, preguntas[o.outcome], T);
      if (!m) continue;
      if (m.vence && m.vence < ahora) continue;
      if (m.externo && precios["xyz:" + m.externo] != null) m.sub = "xyz:" + m.externo;
      const lados = (o.sideSpecs || []).map((sd, i) => {
        var _a2;
        const id = `#${o.outcome * 10 + i}`;
        const precio = numero(precios[id]);
        const antes = (_a2 = ayer[id]) == null ? void 0 : _a2.ayer;
        return { id, nombre: T.lado(sd.name), precio, cambio: precio != null && antes ? redondo(precio - antes, 4) : null };
      });
      const volumenes = lados.map((l) => {
        var _a2;
        return (_a2 = ayer[l.id]) == null ? void 0 : _a2.volumen;
      }).filter((v) => v != null);
      if (!lados.some((l) => l.precio != null)) continue;
      const sinOfertas = lados.length === 2 && lados.every((l) => l.precio === 0.5);
      const N = m.sub ? T.sub(m.sub) : m.externo || "";
      let { pregunta, regla } = m;
      if (m.tipo === "precio" && m.objetivo != null) ({ pregunta, regla } = T.precio(N, m.objetivo));
      if (m.tipo === "toque" && m.objetivo != null) ({ pregunta, regla } = T.toque(N, m.objetivo, m.vence));
      if (m.tipo === "rango") ({ pregunta, regla } = T.rango(N, (_a = m.desde) != null ? _a : null, (_b = m.hasta) != null ? _b : null));
      if (!pregunta) continue;
      if (m.fuente && regla) regla += T.fuente(m.fuente);
      const horas = m.vence ? Math.round((m.vence - ahora) / 36e4) / 10 : null;
      const actual = m.sub ? numero(precios[m.sub]) : null;
      const objetivo = m.tipo === "rango" ? null : (_c = m.objetivo) != null ? _c : null;
      const subAyer = m.sub ? (_d = ayer[m.sub]) == null ? void 0 : _d.ayer : null;
      lista.push({
        plataforma: ID,
        id: String(o.outcome),
        pregunta,
        regla: regla || null,
        categoria: m.categoria || (m.sub ? m.sub.startsWith("xyz:") ? "bolsa" : "cripto" : m.externo ? "bolsa" : "otro"),
        plazo: horas != null && horas <= HORAS_HOY ? "hoy" : "mediano",
        vence: m.vence,
        horas,
        lados,
        moneda: String(o.quoteToken || "USDC"),
        creador: CREADORES[String(o.venue || "")] || String(o.venue),
        comision_doble: Number(o.deployerFeeScale) > 0,
        sin_ofertas: sinOfertas,
        subyacente: N || null,
        precio_actual: actual,
        objetivo,
        distancia_pct: actual != null && objetivo ? Math.round((actual / objetivo - 1) * 1e4) / 100 : null,
        subyacente_id: m.sub || null,
        cambio_subyacente_pct: actual != null && subAyer ? redondo((actual / subAyer - 1) * 100, 2) : null,
        volumen: volumenes.length ? redondo(volumenes.reduce((a, b) => a + b, 0), 2) : null
      });
    }
    const orden = { cripto: 0, bolsa: 1, economia: 2, otro: 3 };
    lista.sort((a, b) => orden[a.categoria] - orden[b.categoria] || (a.vence || 9e15) - (b.vence || 9e15));
    return lista.slice(0, MAX_MERCADOS);
  }
  function crearHyperliquid(entorno) {
    const ahora = entorno.ahora || Date.now;
    async function info(cuerpo) {
      let r;
      try {
        r = await entorno.fetch(URL_INFO, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      } catch (e) {
        throw new ErrorPlataforma(ID, `Hyperliquid no respondi\xF3: ${String((e == null ? void 0 : e.message) || e).slice(0, 120)}`);
      }
      if (!r.ok) throw new ErrorPlataforma(ID, `Hyperliquid respondi\xF3 HTTP ${r.status}`);
      return r.json();
    }
    const etapa2 = () => {
      throw new ErrorPlataforma(ID, "Esta versi\xF3n solo lee mercados: operar y ver tu cuenta llega en la etapa 2.");
    };
    return {
      id: ID,
      nombre: "Hyperliquid",
      moneda: "USDC",
      minimo_orden: MINIMO_ORDEN,
      claves: [
        { id: "cuenta", nombre: "Direcci\xF3n de tu cuenta", secreta: false },
        { id: "clave_agente", nombre: "Clave de la billetera de agente (API wallet)", secreta: true }
      ],
      async listarMercados(idioma = "es") {
        const extra = (cuerpo) => info(cuerpo).catch(() => null);
        const [meta, mids, midsXyz, lados, cripto, bolsa] = await Promise.all([
          info({ type: "outcomeMeta" }),
          info({ type: "allMids" }),
          info({ type: "allMids", dex: "xyz" }).catch(() => ({})),
          extra({ type: "spotMetaAndAssetCtxs" }),
          extra({ type: "metaAndAssetCtxs" }),
          extra({ type: "metaAndAssetCtxs", dex: "xyz" })
        ]);
        const ts = ahora();
        return { plataforma: ID, ts, mercados: leerMercados(meta, { ...mids, ...midsXyz }, ts, idioma, leerAyer(lados, cripto, bolsa)) };
      },
      async libro(lado) {
        if (!/^#\d{2,9}$/.test(lado)) throw new ErrorPlataforma(ID, "Mercado inv\xE1lido");
        const d = await info({ type: "l2Book", coin: lado });
        const [compras, ventas] = (d == null ? void 0 : d.levels) || [[], []];
        const nivel = (x) => ({ precio: Number(x.px), unidades: Number(x.sz) });
        return { plataforma: ID, lado, ts: ahora(), compras: (compras || []).slice(0, 5).map(nivel), ventas: (ventas || []).slice(0, 5).map(nivel) };
      },
      async historia(m) {
        if (!m.subyacente_id) return null;
        const fin = ahora();
        const velas = await info({ type: "candleSnapshot", req: { coin: m.subyacente_id, interval: "1h", startTime: fin - 7 * 24 * 36e5, endTime: fin } });
        const cierres = (Array.isArray(velas) ? velas : []).map((v) => Number(v == null ? void 0 : v.c)).filter((x) => x > 0);
        if (cierres.length < 3) return null;
        const ultimo = cierres[cierres.length - 1];
        const dia = cierres.slice(-25);
        const cambio = (desde) => redondo((ultimo / desde - 1) * 100, 2);
        return {
          cambio_24h_pct: cambio(dia[0]),
          rango_24h: [Math.min(...dia), Math.max(...dia)],
          cambio_7d_pct: cierres.length > 30 ? cambio(cierres[0]) : null,
          rango_7d: cierres.length > 30 ? [Math.min(...cierres), Math.max(...cierres)] : null
        };
      },
      saldo: etapa2,
      posiciones: etapa2,
      comprar: etapa2,
      vender: etapa2,
      cobrar: etapa2
    };
  }

  // src/plataformas/registro.ts
  var PLATAFORMAS = [crearHyperliquid];
  function crearPlataformas(entorno, fabricas = PLATAFORMAS) {
    return fabricas.map((f) => f(entorno));
  }
  function buscarPlataforma(lista, id) {
    const p = lista.find((x) => x.id === id);
    if (!p) throw new ErrorPlataforma(id, `Plataforma desconocida: ${id}`);
    return p;
  }

  // src/global.ts
  var URL_INFO2 = "https://api.hyperliquid.xyz/info";
  var URL_ANIMO = "https://api.alternative.me/fng/?limit=2";
  var LISTA = [
    ["btc", "BTC", "cripto", "Bitcoin", "Bitcoin", "USD"],
    ["eth", "ETH", "cripto", "Ethereum", "Ethereum", "USD"],
    ["sol", "SOL", "cripto", "Solana", "Solana", "USD"],
    ["hype", "HYPE", "cripto", "Hyperliquid", "Hyperliquid", "USD"],
    ["sp500", "xyz:SP500", "bolsa", "S&P 500 (EE. UU.)", "S&P 500 (US)", ""],
    ["nasdaq", "xyz:XYZ100", "bolsa", "Nasdaq 100 (tecnolog\xEDa)", "Nasdaq 100 (tech)", ""],
    ["nikkei", "xyz:JP225", "bolsa", "Nikkei 225 (Jap\xF3n)", "Nikkei 225 (Japan)", ""],
    ["kospi", "xyz:KR200", "bolsa", "Kospi 200 (Corea)", "Kospi 200 (Korea)", ""],
    ["oro", "xyz:GOLD", "materias", "Oro", "Gold", "USD"],
    ["plata", "xyz:SILVER", "materias", "Plata", "Silver", "USD"],
    ["petroleo", "xyz:CL", "materias", "Petr\xF3leo WTI", "WTI crude oil", "USD"],
    ["eur", "xyz:EUR", "divisas", "Euro en d\xF3lares", "Euro in dollars", ""],
    ["jpy", "xyz:JPY", "divisas", "D\xF3lar en yenes", "Dollar in yen", ""]
  ];
  var num = (x) => {
    const n = Number(x);
    return x != null && x !== "" && Number.isFinite(n) && n > 0 ? n : null;
  };
  var redondo2 = (n) => Math.round(n * 100) / 100;
  function leerIndicadores(idioma, ...listas) {
    var _a, _b;
    const por = {};
    for (const par of listas) {
      if (!Array.isArray(par)) continue;
      (((_a = par[0]) == null ? void 0 : _a.universe) || []).forEach((u, i) => {
        var _a2;
        if ((u == null ? void 0 : u.name) && ((_a2 = par[1]) == null ? void 0 : _a2[i])) por[u.name] = par[1][i];
      });
    }
    const out = [];
    for (const [id, activo, grupo, es, en, unidad] of LISTA) {
      const c = por[activo];
      const valor = (_b = num(c == null ? void 0 : c.midPx)) != null ? _b : num(c == null ? void 0 : c.markPx);
      if (valor == null) continue;
      const ayer = num(c == null ? void 0 : c.prevDayPx);
      out.push({ id, nombre: idioma === "en" ? en : es, grupo, valor, cambio: ayer ? redondo2((valor / ayer - 1) * 100) : null, unidad });
    }
    return out;
  }
  var signo = (n) => `${n > 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}`;
  function lecturaPorReglas(ind, idioma = "es") {
    const es = idioma !== "en";
    const de = (id) => ind.find((i) => i.id === id);
    const pct = (n) => (es ? signo(n) : signo(n).replace(",", ".")) + " %";
    let puntos = 0;
    const razones = [];
    const mover = (id, umbral, peso) => {
      const i = de(id);
      if ((i == null ? void 0 : i.cambio) == null) return;
      const p = i.cambio > umbral ? peso : i.cambio < -umbral ? -peso : 0;
      puntos += p;
      razones.push(`${i.nombre} ${pct(i.cambio)}${p > 0 ? " \u25B2" : p < 0 ? " \u25BC" : ""}`);
    };
    mover("sp500", 0.5, 1);
    mover("nasdaq", 0.7, 0.5);
    mover("btc", 2, 1);
    const animo = de("animo");
    if ((animo == null ? void 0 : animo.valor) != null) {
      const p = animo.valor > 60 ? 0.5 : animo.valor < 30 ? -0.5 : 0;
      puntos += p;
      razones.push(`${animo.nombre} ${Math.round(animo.valor)}/100${p > 0 ? " \u25B2" : p < 0 ? " \u25BC" : ""}`);
    }
    puntos = Math.max(-2, Math.min(2, Math.round(puntos * 2) / 2));
    return { color: !razones.length ? "amarillo" : puntos >= 1 ? "verde" : puntos <= -1 ? "rojo" : "amarillo", puntos, razones };
  }
  async function leerGlobal(entorno, idioma = "es") {
    const ahora = entorno.ahora || Date.now;
    const errores = [];
    const intento = async (que, f) => {
      try {
        return await f();
      } catch (e) {
        errores.push(`${que}: ${String((e == null ? void 0 : e.message) || e).slice(0, 120)}`);
        return null;
      }
    };
    const info = async (cuerpo) => {
      const r = await entorno.fetch(URL_INFO2, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    };
    const [cripto, bolsa, animo] = await Promise.all([
      intento(idioma === "en" ? "Crypto" : "Cripto", () => info({ type: "metaAndAssetCtxs" })),
      intento(idioma === "en" ? "Stocks and commodities" : "Bolsa y materias primas", () => info({ type: "metaAndAssetCtxs", dex: "xyz" })),
      intento(idioma === "en" ? "Fear and greed" : "Miedo y codicia", async () => {
        const r = await entorno.fetch(URL_ANIMO);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      })
    ]);
    const indicadores = leerIndicadores(idioma, cripto, bolsa);
    const [hoy, antes] = (animo == null ? void 0 : animo.data) || [];
    const valor = num(hoy == null ? void 0 : hoy.value);
    if (valor != null) {
      const previo = num(antes == null ? void 0 : antes.value);
      indicadores.push({ id: "animo", nombre: idioma === "en" ? "Fear and greed (crypto)" : "Miedo y codicia (cripto)", grupo: "animo", valor, cambio: previo != null ? valor - previo : null, unidad: "/100" });
    }
    return { ts: ahora(), indicadores, lectura: lecturaPorReglas(indicadores, idioma), errores };
  }
  function resumenGlobal(g) {
    var _a, _b;
    if (!g || !g.indicadores.length) return null;
    return {
      semaforo: g.lectura.color,
      puntos: g.lectura.puntos,
      cambios_del_dia_pct: Object.fromEntries(g.indicadores.filter((i) => i.cambio != null && i.grupo !== "animo").map((i) => [i.id, i.cambio])),
      miedo_codicia: (_b = (_a = g.indicadores.find((i) => i.id === "animo")) == null ? void 0 : _a.valor) != null ? _b : null
    };
  }

  // src/ia/proveedores.ts
  var PROVEEDORES = {
    kilo: {
      nombre: "Kilo",
      url: "https://api.kilo.ai/api/gateway",
      pide_clave: false,
      alta: null,
      modelos: ["nvidia/nemotron-3-super-120b-a12b:free", "nvidia/nemotron-3-ultra-550b-a55b:free"],
      nota: ["Gratis, sin cuenta ni clave. Unas 200 consultas por hora; tarda de 4 a 30 s porque piensa antes de responder.", "Free, no account or key. About 200 requests per hour; takes 4 to 30 s because it thinks before answering."]
    },
    groq: {
      nombre: "Groq",
      url: "https://api.groq.com/openai/v1",
      pide_clave: true,
      alta: "https://console.groq.com/keys",
      modelos: ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"],
      nota: ["Cuenta gratis \u2192 \xABCreate API Key\xBB (empieza por gsk_). Muy r\xE1pida.", "Free account \u2192 \u201CCreate API Key\u201D (starts with gsk_). Very fast."]
    },
    google: {
      nombre: "Google AI Studio (Gemini)",
      url: "https://generativelanguage.googleapis.com/v1beta/openai",
      pide_clave: true,
      alta: "https://aistudio.google.com/app/apikey",
      modelos: ["gemini-3.7-flash"],
      nota: ["Con tu cuenta de Google \u2192 \xABCreate API key\xBB. En el plan gratis Google puede usar lo que env\xEDas (solo datos p\xFAblicos de mercados).", "With your Google account \u2192 \u201CCreate API key\u201D. On the free plan Google may use what you send (only public market data)."]
    },
    openrouter: {
      nombre: "OpenRouter",
      url: "https://openrouter.ai/api/v1",
      pide_clave: true,
      alta: "https://openrouter.ai/workspaces/default/keys",
      modelos: ["openrouter/free"],
      nota: ["Cuenta con correo \u2192 crea una clave (sk-or-\u2026). Gratis: unas 50 consultas al d\xEDa.", "Account with email \u2192 create a key (sk-or-\u2026). Free: about 50 requests a day."]
    },
    cerebras: {
      nombre: "Cerebras",
      url: "https://api.cerebras.ai/v1",
      pide_clave: true,
      alta: "https://cloud.cerebras.ai",
      modelos: ["gpt-oss-120b", "qwen-3-235b-a22b-instruct-2507"],
      nota: ["Cuenta gratis \u2192 API Keys. Muy r\xE1pida.", "Free account \u2192 API Keys. Very fast."]
    },
    mistral: {
      nombre: "Mistral",
      url: "https://api.mistral.ai/v1",
      pide_clave: true,
      alta: "https://console.mistral.ai/api-keys",
      modelos: ["mistral-small-latest"],
      nota: ["Cuenta con correo, plan gratis \xABExperiment\xBB \u2192 crea una API key.", "Account with email, free \u201CExperiment\u201D plan \u2192 create an API key."]
    }
  };
  var IDS_PROVEEDOR = Object.keys(PROVEEDORES);
  var MODELOS_SIN_CLAVE = PROVEEDORES.kilo.modelos.map((m) => `kilo:${m}`);
  function partirModelo(entrada) {
    const i = entrada.indexOf(":");
    const p = i > 0 ? entrada.slice(0, i) : "";
    return p in PROVEEDORES && entrada.length > i + 1 ? { proveedor: p, modelo: entrada.slice(i + 1) } : null;
  }
  function etiquetaModelo(entrada) {
    const m = partirModelo(entrada);
    if (!m) return entrada;
    return `${m.modelo.split("/").pop().replace(/:free$/, "")} \xB7 ${PROVEEDORES[m.proveedor].nombre.split(" ")[0]}`;
  }
  function esperaMs(mensaje) {
    var _a, _b, _c;
    const m = /try again in (?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?/i.exec(mensaje);
    if (!m || !(m[1] || m[2] || m[3])) return null;
    return ((Number((_a = m[1]) != null ? _a : 0) * 60 + Number((_b = m[2]) != null ? _b : 0)) * 60 + Number((_c = m[3]) != null ? _c : 0)) * 1e3;
  }
  var ErrorIA = class extends Error {
    constructor(mensaje, pausaHasta = null) {
      super(mensaje);
      this.pausaHasta = pausaHasta;
      this.name = "ErrorIA";
    }
  };
  function ajustes(proveedor, modelo, tope) {
    if (proveedor === "kilo") return { max_tokens: 4096 };
    if (/gpt-oss/.test(modelo)) return { reasoning_effort: "low", max_completion_tokens: Math.max(1500, tope) };
    return { max_tokens: tope };
  }
  async function preguntar(entorno, entrada, claves, mensajes, tope = 800) {
    var _a, _b, _c, _d, _e, _f;
    const m = partirModelo(entrada);
    if (!m) throw new ErrorIA(`modelo mal escrito: ${entrada}`);
    const p = PROVEEDORES[m.proveedor];
    const clave2 = claves[m.proveedor];
    if (p.pide_clave && !clave2) throw new ErrorIA(`falta la clave de ${p.nombre}`);
    const cabeceras = { "Content-Type": "application/json" };
    if (clave2) cabeceras.Authorization = `Bearer ${clave2}`;
    const tiempo = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(m.proveedor === "kilo" ? 45e3 : 25e3) : void 0;
    let r;
    try {
      r = await entorno.fetch(`${p.url}/chat/completions`, {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({ model: m.modelo, temperature: 0.2, messages: mensajes, ...ajustes(m.proveedor, m.modelo, tope), response_format: { type: "json_object" } }),
        signal: tiempo
      });
    } catch (e) {
      throw new ErrorIA(`${p.nombre} no respondi\xF3: ${String((e == null ? void 0 : e.message) || e).slice(0, 100)}`);
    }
    const texto = await r.text();
    let cuerpo = {};
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      if (r.ok) throw new ErrorIA(`${p.nombre} respondi\xF3 algo que no se entiende`);
    }
    if (!r.ok) {
      const mensaje = String((typeof (cuerpo == null ? void 0 : cuerpo.error) === "string" ? cuerpo.error : (_a = cuerpo == null ? void 0 : cuerpo.error) == null ? void 0 : _a.message) || (cuerpo == null ? void 0 : cuerpo.message) || `HTTP ${r.status}`);
      if (r.status === 429) {
        const espera = Math.max(6e4, (_b = esperaMs(mensaje)) != null ? _b : 6e5);
        throw new ErrorIA(`l\xEDmite de ${p.nombre} agotado`, (entorno.ahora || Date.now)() + espera);
      }
      if (r.status === 401 || r.status === 403) throw new ErrorIA(`${p.nombre} rechaz\xF3 la clave (HTTP ${r.status})`);
      throw new ErrorIA(`${p.nombre} HTTP ${r.status}: ${mensaje.slice(0, 140)}`);
    }
    const contenido = String((_f = (_e = (_d = (_c = cuerpo == null ? void 0 : cuerpo.choices) == null ? void 0 : _c[0]) == null ? void 0 : _d.message) == null ? void 0 : _e.content) != null ? _f : "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (!contenido) throw new ErrorIA(`${p.nombre} respondi\xF3 vac\xEDo`);
    return contenido;
  }
  function sacarJson(crudo) {
    const a = crudo.indexOf("{");
    const b = crudo.lastIndexOf("}");
    if (a < 0 || b <= a) throw new ErrorIA("la respuesta no trae JSON");
    try {
      return JSON.parse(crudo.slice(a, b + 1));
    } catch {
      throw new ErrorIA("la respuesta trae un JSON roto");
    }
  }

  // src/ia/analizar.ts
  var VENTAJA_MIN = 5;
  var VENTAJA_MIN_DOBLE = 8;
  var CONFIANZA_VERDE = 60;
  var ErrorAnalisis = class extends Error {
    constructor(mensaje, pausas, votos = []) {
      super(mensaje);
      this.pausas = pausas;
      this.votos = votos;
      this.name = "ErrorAnalisis";
    }
  };
  function sistema(idioma, lados) {
    var _a;
    const lengua = idioma === "en" ? "ingl\xE9s" : "espa\xF1ol";
    return `Eres analista de mercados de predicci\xF3n. Cada mercado es una pregunta de s\xED o no: una unidad del lado que acierta paga 1 y la del que falla paga 0. El precio de un lado (de 0 a 1) es la probabilidad que le da el mercado.
Recibes un mercado en JSON: la pregunta, la regla que decide qui\xE9n gana, las horas que faltan y, de cada lado, su precio medio, su cambio de hoy y lo que dice el libro: "comprar_cuesta" (lo que pagar\xEDas de verdad por unidad) y "vender_paga". Si "comprar_cuesta" es null, nadie vende ese lado. Cuando "comprar_cuesta" est\xE1 lejos del precio medio, el precio medio no es real: f\xEDate del libro. Si depende de un precio, tambi\xE9n el activo, su precio actual, el objetivo, la distancia y c\xF3mo se movi\xF3 en 24 h y 7 d\xEDas; y "global", el \xE1nimo general de los mercados. No inventes datos ni noticias que no est\xE9n ah\xED.
Tu trabajo:
1. Estima la probabilidad real, de 0 a 100, de que gane el PRIMER lado ("${(_a = lados[0]) != null ? _a : ""}"). Piensa en cu\xE1nto suele moverse el activo en el tiempo que falta frente a la distancia al objetivo.
2. Sugiere COMPRAR un lado solo si tu probabilidad para ese lado supera a su "comprar_cuesta" (o a su precio, si no viene el libro) por al menos ${VENTAJA_MIN} puntos (${VENTAJA_MIN_DOBLE} si "comision_doble" es true). Si no hay esa ventaja, si "sin_ofertas" es true o si no tienes datos para opinar: NO_ENTRAR.
3. La confianza (0 a 100) dice cu\xE1nto te f\xEDas de tu propia estimaci\xF3n, no la probabilidad.
Responde SOLO un objeto JSON:
{"probabilidad":0-100,"sugerencia":"COMPRAR"|"NO_ENTRAR","lado":${lados.map((l) => `"${l}"`).join("|")}|null,"confianza":0-100,"motivo":"m\xE1ximo 220 caracteres en ${lengua}, sencillo, sin jerga"}`;
  }
  function contextoDe(m, historia, global, ofertas = {}) {
    var _a, _b;
    const ctx = {
      pregunta: m.pregunta,
      regla: m.regla,
      horas_para_vencer: m.horas,
      lados: m.lados.map((l) => ({
        lado: l.nombre,
        precio: l.precio,
        cambio_hoy_puntos: l.cambio == null ? null : Math.round(l.cambio * 1e3) / 10,
        ...ofertas[l.id] ? { comprar_cuesta: ofertas[l.id].comprar, vender_paga: ofertas[l.id].vender } : {}
      })),
      volumen_del_dia: (_a = m.volumen) != null ? _a : null,
      comision_doble: m.comision_doble,
      sin_ofertas: m.sin_ofertas
    };
    if (m.subyacente) {
      ctx.activo = {
        nombre: m.subyacente,
        precio_actual: m.precio_actual,
        objetivo: m.objetivo,
        distancia_al_objetivo_pct: m.distancia_pct,
        cambio_hoy_pct: (_b = m.cambio_subyacente_pct) != null ? _b : null,
        ...historia || {}
      };
    }
    const g = resumenGlobal(global);
    if (g) ctx.global = g;
    return ctx;
  }
  function leerVoto(crudo, m) {
    var _a, _b;
    const d = sacarJson(crudo);
    const numero2 = (x, que) => {
      const n = Number(x);
      if (x == null || x === "" || !Number.isFinite(n) || n < 0 || n > 100) throw new ErrorIA(`${que} inv\xE1lida: ${String(x).slice(0, 20)}`);
      return n;
    };
    const probabilidad = numero2(d.probabilidad, "probabilidad");
    const confianza = numero2(d.confianza, "confianza");
    const s = String(d.sugerencia || "").toUpperCase().replace(/\s+/g, "_");
    if (s !== "COMPRAR" && s !== "NO_ENTRAR") throw new ErrorIA(`sugerencia inv\xE1lida: ${String(d.sugerencia).slice(0, 20)}`);
    let lado = null;
    if (s === "COMPRAR") {
      const nombre = String((_a = d.lado) != null ? _a : "").trim().toLowerCase();
      const l = m.lados.find((x) => x.nombre.toLowerCase() === nombre);
      if (!l) throw new ErrorIA(`sugiri\xF3 comprar un lado que no existe: ${String(d.lado).slice(0, 20)}`);
      lado = l.id;
    }
    return { sugerencia: s, lado, probabilidad, confianza, motivo: String((_b = d.motivo) != null ? _b : "").slice(0, 240) };
  }
  function mediana(v) {
    const o = [...v].sort((a, b) => a - b);
    const mitad = Math.floor(o.length / 2);
    return o.length % 2 ? o[mitad] : (o[mitad - 1] + o[mitad]) / 2;
  }
  function juntarVotos(votos, m, ahora, ofertas = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const ok = votos.filter((v) => v.ok && v.sugerencia);
    if (!ok.length) return null;
    const opcion = (v) => v.sugerencia === "COMPRAR" && v.lado ? v.lado : "";
    const suma = {};
    for (const v of ok) suma[opcion(v)] = (suma[opcion(v)] || 0) + Math.max(1, (_a = v.confianza) != null ? _a : 0);
    const orden = Object.keys(suma).sort((a, b) => suma[b] - suma[a]);
    let lado = orden.length > 1 && suma[orden[0]] === suma[orden[1]] ? null : orden[0] || null;
    const aFavor = ok.filter((v) => opcion(v) === (lado != null ? lado : ""));
    const media = aFavor.length ? aFavor.reduce((a, v) => {
      var _a2;
      return a + ((_a2 = v.confianza) != null ? _a2 : 0);
    }, 0) / aFavor.length : Math.min(...ok.map((v) => {
      var _a2;
      return (_a2 = v.confianza) != null ? _a2 : 0;
    }));
    let confianza = Math.round(media * (0.5 + 0.5 * aFavor.length / ok.length));
    const probabilidad = Math.round(mediana(ok.map((v) => {
      var _a2;
      return (_a2 = v.probabilidad) != null ? _a2 : 50;
    })) * 10) / 10;
    const primero = m.lados[0];
    const precio = (primero == null ? void 0 : primero.precio) != null ? Math.round(primero.precio * 1e3) / 10 : null;
    let ventaja = null;
    let costo = null;
    let freno = null;
    if (lado) {
      const i = m.lados.findIndex((l) => l.id === lado);
      const libro = ofertas[lado];
      costo = libro ? libro.comprar : (_c = (_b = m.lados[i]) == null ? void 0 : _b.precio) != null ? _c : null;
      const mia = i === 0 ? probabilidad : 100 - probabilidad;
      ventaja = costo != null ? Math.round((mia - costo * 100) * 10) / 10 : null;
      if (m.sin_ofertas || libro && libro.comprar == null) freno = "sin_ofertas";
      else if (ventaja == null || ventaja < (m.comision_doble ? VENTAJA_MIN_DOBLE : VENTAJA_MIN)) freno = "poca_ventaja";
    }
    const guia = [...aFavor.length ? aFavor : ok].sort((a, b) => {
      var _a2, _b2;
      return ((_a2 = b.confianza) != null ? _a2 : 0) - ((_b2 = a.confianza) != null ? _b2 : 0);
    })[0];
    const sugerido = lado;
    if (freno) {
      lado = null;
      confianza = Math.min(confianza, 50);
    }
    return {
      plataforma: m.plataforma,
      mercado: m.id,
      pregunta: m.pregunta,
      ts: ahora,
      sugerencia: lado ? "COMPRAR" : "NO_ENTRAR",
      lado,
      lado_nombre: (_e = (_d = m.lados.find((l) => l.id === (lado != null ? lado : sugerido))) == null ? void 0 : _d.nombre) != null ? _e : null,
      primer_lado: (_f = primero == null ? void 0 : primero.nombre) != null ? _f : "",
      probabilidad,
      precio,
      costo,
      ventaja,
      confianza,
      color: !lado ? "rojo" : confianza >= CONFIANZA_VERDE ? "verde" : "amarillo",
      motivo: (_g = guia.motivo) != null ? _g : "",
      freno,
      acuerdo: { a_favor: aFavor.length, total: ok.length },
      votos
    };
  }
  async function analizar(p) {
    var _a, _b, _c, _d;
    const ahora = (p.entorno.ahora || Date.now)();
    const idioma = p.idioma || "es";
    const m = p.mercado;
    if (m.vence && m.vence < ahora) throw new ErrorAnalisis(idioma === "en" ? "This market has already expired." : "Este mercado ya venci\xF3.", {});
    let historia = null;
    try {
      historia = (_c = await ((_b = (_a = p.plataforma) == null ? void 0 : _a.historia) == null ? void 0 : _b.call(_a, m))) != null ? _c : null;
    } catch {
    }
    const ofertas = {};
    if (p.plataforma) {
      await Promise.all(
        m.lados.map(async (l) => {
          var _a2, _b2, _c2, _d2;
          try {
            const libro = await p.plataforma.libro(l.id);
            ofertas[l.id] = { comprar: (_b2 = (_a2 = libro.ventas[0]) == null ? void 0 : _a2.precio) != null ? _b2 : null, vender: (_d2 = (_c2 = libro.compras[0]) == null ? void 0 : _c2.precio) != null ? _d2 : null };
          } catch {
          }
        })
      );
    }
    const mensajes = [
      { role: "system", content: sistema(idioma, m.lados.map((l) => l.nombre)) },
      { role: "user", content: JSON.stringify(contextoDe(m, historia, (_d = p.global) != null ? _d : null, ofertas)) }
    ];
    const pausas = {};
    const votar = async (modelo) => {
      const t0 = Date.now();
      try {
        const leido = leerVoto(await preguntar(p.entorno, modelo, p.claves, mensajes), m);
        return { modelo, ok: true, ms: Date.now() - t0, ...leido };
      } catch (e) {
        if (e instanceof ErrorIA && e.pausaHasta) pausas[modelo] = e.pausaHasta;
        return { modelo, ok: false, ms: Date.now() - t0, error: String((e == null ? void 0 : e.message) || e).slice(0, 200) };
      }
    };
    const libres = p.modelos.filter((x) => {
      var _a2, _b2;
      return ((_b2 = (_a2 = p.pausas) == null ? void 0 : _a2[x]) != null ? _b2 : 0) <= ahora;
    });
    const votos = [];
    if (p.consenso.activo) {
      const primeros = libres.slice(0, Math.max(2, Math.min(5, p.consenso.tamano)));
      votos.push(...await Promise.all(primeros.map(votar)));
      for (const x of libres.slice(primeros.length)) {
        if (votos.filter((v) => v.ok).length * 2 >= primeros.length) break;
        votos.push(await votar(x));
      }
    } else {
      for (const x of libres) {
        votos.push(await votar(x));
        if (votos[votos.length - 1].ok) break;
      }
    }
    const analisis = juntarVotos(votos, m, ahora, ofertas);
    if (!analisis) {
      const detalle = votos.map((v) => `${etiquetaModelo(v.modelo)}: ${v.error}`).join(" | ");
      const sinModelos = idioma === "en" ? "All your AI models are resting after hitting their limit. Try again in a few minutes." : "Todas tus IA est\xE1n descansando porque agotaron su l\xEDmite. Prueba en unos minutos.";
      throw new ErrorAnalisis(detalle || sinModelos, pausas, votos);
    }
    if (p.consenso.activo && analisis.acuerdo.total < 2 && analisis.color === "verde") analisis.color = "amarillo";
    return { analisis, pausas };
  }
  return __toCommonJS(nucleo_exports);
})();
