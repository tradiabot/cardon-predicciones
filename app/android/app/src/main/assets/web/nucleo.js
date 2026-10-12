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
    FILTRO_VACIO: () => FILTRO_VACIO,
    PRECIOS: () => PRECIOS,
    alternarGuardada: () => alternarGuardada,
    buscarPlataforma: () => buscarPlataforma,
    categoriaDe: () => categoriaDe,
    cerradas: () => cerradas,
    clave: () => clave,
    contar: () => contar,
    crearPlataformas: () => crearPlataformas,
    explorar: () => explorar,
    filtrar: () => filtrar
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
    const out = { ...guardadas }, k = clave(m);
    if (out[k]) delete out[k];
    else out[k] = { plataforma: m.plataforma, id: m.id, pregunta: m.pregunta, ts: ahora };
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
  function leerMercados(meta, precios, ahora, idioma = "es") {
    var _a, _b, _c;
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
        const id = `#${o.outcome * 10 + i}`;
        return { id, nombre: T.lado(sd.name), precio: numero(precios[id]) };
      });
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
        distancia_pct: actual != null && objetivo ? Math.round((actual / objetivo - 1) * 1e4) / 100 : null
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
        const [meta, mids, midsXyz] = await Promise.all([info({ type: "outcomeMeta" }), info({ type: "allMids" }), info({ type: "allMids", dex: "xyz" }).catch(() => ({}))]);
        const ts = ahora();
        return { plataforma: ID, ts, mercados: leerMercados(meta, { ...mids, ...midsXyz }, ts, idioma) };
      },
      async libro(lado) {
        if (!/^#\d{2,9}$/.test(lado)) throw new ErrorPlataforma(ID, "Mercado inv\xE1lido");
        const d = await info({ type: "l2Book", coin: lado });
        const [compras, ventas] = (d == null ? void 0 : d.levels) || [[], []];
        const nivel = (x) => ({ precio: Number(x.px), unidades: Number(x.sz) });
        return { plataforma: ID, lado, ts: ahora(), compras: (compras || []).slice(0, 5).map(nivel), ventas: (ventas || []).slice(0, 5).map(nivel) };
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
  return __toCommonJS(nucleo_exports);
})();
