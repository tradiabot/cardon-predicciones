/* Textos de la app en español e inglés. t('clave', {n: 3}) sustituye {n}. */
(function () {
  "use strict";
  var TEXTOS = {
    es: {
      lema: "AGENTE DE MERCADOS DE PREDICCIÓN",
      solo_lectura: "SOLO LECTURA",
      nav_mercados: "Mercados",
      nav_config: "Config",
      explorar_eyebrow: "EXPLORAR · CON IA",
      explorar_titulo: "Mercados",
      actualizar: "Actualizar",
      como_funciona: "Cómo funciona",
      como_texto:
        "Cada mercado es una pregunta de sí o no. Compras unidades de un lado: cada unidad paga 1 {moneda} si aciertas y 0 si fallas. El precio (de 0 a 1) es la probabilidad que le da el mercado. Al vencer se cobra solo, sin tener que vender.",
      buscar: "Buscar en las preguntas…",
      cat_todas: "Todas",
      cat_cripto_hoy: "Cripto hoy",
      cat_cripto_mediano: "Cripto mediano plazo",
      cat_bolsa: "Bolsa y materias primas",
      cat_economia: "Economía",
      cat_otro: "Otros",
      cat_guardadas: "★ Guardadas",
      plataforma_todas: "Plataforma: todas",
      creador_todos: "Creador: todos",
      precio_todos: "Precio: todos",
      precio_menos: "Menos de {p}",
      cargando: "Cargando mercados…",
      nada: "Nada con ese filtro.",
      sin_guardadas: "Aún no guardas ninguno. Toca la ☆ de un mercado para vigilarlo aquí.",
      estado: "{n} de {total} mercados · actualizado {hace}",
      error_plataforma: "{plataforma} no respondió: {error}",
      error_viejos: "Se muestran los últimos datos que llegaron.",
      vence_en: "vence en {t}",
      sin_fecha: "sin fecha",
      vencido: "ya venció",
      ahora_vale: "{sub} ahora {precio}",
      hoy_pct: "{n} % hoy",
      hoy_puntos: "{n} puntos hoy",
      del_objetivo: "{n} % del objetivo",
      volumen: "movió {n} {moneda} hoy",
      creado_por: "creado por {creador}",
      comision_doble: "Comisión doble: este mercado lo creó {creador}, un creador externo que cobra su parte en cada operación.",
      sin_ofertas: "Sin ofertas: nadie compra ni vende ahora, el precio que se ve no es real.",
      ver_libro: "Ver libro",
      ocultar_libro: "Ocultar libro",
      libro_cargando: "Leyendo el libro de órdenes…",
      libro_venden: "Venden (lo más barato primero)",
      libro_compran: "Compran (lo que más pagan primero)",
      libro_vacio: "nadie",
      libro_unidades: "{u} u.",
      libro_nota: "Si compraras ahora, el más barato vende a {venta}. Si vendieras, el que más paga da {compra}.",
      guardar: "Guardar para vigilar",
      quitar: "Quitar de guardadas",
      cerrado: "Ya no está abierto",
      cerrado_nota: "Cerró o venció. Lo guardaste {hace}.",
      hace_seg: "hace un momento",
      hace_min: "hace {n} min",
      hace_h: "hace {n} h",
      hace_d: "hace {n} d",
      config_eyebrow: "AJUSTES",
      config_titulo: "Configuración",
      colores: "Colores de la app",
      tema_noche: "Noche",
      tema_noche_n: "Menta sobre oscuro",
      tema_atardecer: "Atardecer",
      tema_atardecer_n: "Terracota cálido",
      tema_oasis: "Oasis",
      tema_oasis_n: "Azul de agua",
      tema_arena: "Arena",
      tema_arena_n: "Claro, para el sol",
      idioma: "Idioma",
      plataformas: "Plataformas",
      plataformas_nota: "Dónde opera la app. Las claves se guardan aparte para cada plataforma.",
      plat_lectura: "LECTURA",
      plat_detalle: "Se paga y se cobra en {moneda} · mínimo por orden aproximado: {min} {moneda}",
      plat_claves: "Por ahora solo lee mercados y no pide ninguna clave. Para operar hará falta: {claves}.",
      legal: "Aviso legal",
      legal_nota: "Lo aceptaste al abrir la app. Puedes volver a leerlo cuando quieras.",
      legal_ver: "Ver el aviso legal",
      donar: "Apoya al desarrollador",
      voluntario: "VOLUNTARIO",
      donar_nota: "Cardón Predicciones es gratis y abierto. Si te sirve, puedes invitarle un café al desarrollador. Envía cada moneda <b>solo por su propia red</b>.",
      donar_usdc: "USDC · red Arbitrum",
      donar_usdc_nota: "Solo USDC en Arbitrum, mínimo 5 USDC. No envíes por Polygon, Ethereum ni otra red.",
      copiar: "Copiar dirección",
      copiada: "Dirección copiada",
      gracias: "¡Gracias! 🙏",
      acerca: "Acerca de",
      acerca_nota: "Versión {version} · software libre (licencia MIT).",
      aviso_antes: "ANTES DE EMPEZAR",
      aviso_titulo: "Aviso y descargo de responsabilidad",
      aviso_c1: "Leí y acepto este aviso y el descargo de responsabilidad del desarrollador.",
      aviso_c2: "Entiendo que puedo perder todo lo que ponga y que nadie me garantiza ganancias.",
      aviso_c3: "Soy responsable de que usar mercados de predicción sea legal en mi país.",
      aviso_aceptar: "Aceptar y continuar",
      cerrar: "Cerrar",
    },
    en: {
      lema: "PREDICTION MARKETS AGENT",
      solo_lectura: "READ ONLY",
      nav_mercados: "Markets",
      nav_config: "Settings",
      explorar_eyebrow: "EXPLORE · WITH AI",
      explorar_titulo: "Markets",
      actualizar: "Refresh",
      como_funciona: "How it works",
      como_texto:
        "Each market is a yes-or-no question. You buy units of one side: each unit pays 1 {moneda} if you are right and 0 if you are wrong. The price (0 to 1) is the probability the market gives it. At expiry it pays out by itself, with no need to sell.",
      buscar: "Search the questions…",
      cat_todas: "All",
      cat_cripto_hoy: "Crypto today",
      cat_cripto_mediano: "Crypto mid-term",
      cat_bolsa: "Stocks and commodities",
      cat_economia: "Economy",
      cat_otro: "Other",
      cat_guardadas: "★ Saved",
      plataforma_todas: "Platform: all",
      creador_todos: "Creator: all",
      precio_todos: "Price: all",
      precio_menos: "Under {p}",
      cargando: "Loading markets…",
      nada: "Nothing matches that filter.",
      sin_guardadas: "You have not saved any yet. Tap the ☆ on a market to watch it here.",
      estado: "{n} of {total} markets · updated {hace}",
      error_plataforma: "{plataforma} did not respond: {error}",
      error_viejos: "Showing the last data received.",
      vence_en: "expires in {t}",
      sin_fecha: "no date",
      vencido: "already expired",
      ahora_vale: "{sub} now {precio}",
      hoy_pct: "{n}% today",
      hoy_puntos: "{n} points today",
      del_objetivo: "{n}% from target",
      volumen: "{n} {moneda} traded today",
      creado_por: "created by {creador}",
      comision_doble: "Double fee: this market was created by {creador}, an external creator that takes its own cut on every trade.",
      sin_ofertas: "No offers: nobody is buying or selling now, the price shown is not real.",
      ver_libro: "View book",
      ocultar_libro: "Hide book",
      libro_cargando: "Reading the order book…",
      libro_venden: "Selling (cheapest first)",
      libro_compran: "Buying (highest bid first)",
      libro_vacio: "nobody",
      libro_unidades: "{u} u.",
      libro_nota: "If you bought now, the cheapest seller asks {venta}. If you sold, the highest bidder pays {compra}.",
      guardar: "Save to watch",
      quitar: "Remove from saved",
      cerrado: "No longer open",
      cerrado_nota: "It closed or expired. You saved it {hace}.",
      hace_seg: "a moment ago",
      hace_min: "{n} min ago",
      hace_h: "{n} h ago",
      hace_d: "{n} d ago",
      config_eyebrow: "SETTINGS",
      config_titulo: "Settings",
      colores: "App colors",
      tema_noche: "Night",
      tema_noche_n: "Mint on dark",
      tema_atardecer: "Sunset",
      tema_atardecer_n: "Warm terracotta",
      tema_oasis: "Oasis",
      tema_oasis_n: "Water blue",
      tema_arena: "Sand",
      tema_arena_n: "Light, for sunlight",
      idioma: "Language",
      plataformas: "Platforms",
      plataformas_nota: "Where the app trades. Keys are stored separately for each platform.",
      plat_lectura: "READ",
      plat_detalle: "Pays and settles in {moneda} · approximate minimum per order: {min} {moneda}",
      plat_claves: "For now it only reads markets and asks for no keys. Trading will need: {claves}.",
      legal: "Legal notice",
      legal_nota: "You accepted it when you opened the app. You can read it again at any time.",
      legal_ver: "View the legal notice",
      donar: "Support the developer",
      voluntario: "VOLUNTARY",
      donar_nota: "Cardón Predicciones is free and open. If it helps you, you can buy the developer a coffee. Send each coin <b>only on its own network</b>.",
      donar_usdc: "USDC · Arbitrum network",
      donar_usdc_nota: "USDC on Arbitrum only, minimum 5 USDC. Do not send over Polygon, Ethereum or any other network.",
      copiar: "Copy address",
      copiada: "Address copied",
      gracias: "Thank you! 🙏",
      acerca: "About",
      acerca_nota: "Version {version} · free software (MIT license).",
      aviso_antes: "BEFORE YOU START",
      aviso_titulo: "Notice and disclaimer",
      aviso_c1: "I have read and accept this notice and the developer's disclaimer.",
      aviso_c2: "I understand I can lose everything I put in and that nobody guarantees profits.",
      aviso_c3: "I am responsible for making sure prediction markets are legal in my country.",
      aviso_aceptar: "Accept and continue",
      cerrar: "Close",
    },
  };

  var AVISO = {
    es: [
      ["Qué es", "Cardón Predicciones es software libre y gratuito, en versión piloto. Es una herramienta para ver y operar mercados de predicción con tu propia cuenta y desde tu propia nube."],
      ["No es consejo financiero", "Nada de lo que muestra la app, ni lo que digan las inteligencias artificiales, es una recomendación de comprar o vender. No es un exchange, un bróker, un custodio ni un servicio de inversión o de asesoría financiera, fiscal o legal."],
      ["Puedes perder todo lo que pongas", "En un mercado de predicción, cada unidad paga 1 si aciertas y 0 si fallas: si fallas, pierdes todo lo que pagaste por ella. Los precios cambian rápido y puede no haber quien te compre cuando quieras vender."],
      ["Que sea legal depende de ti", "Los mercados de predicción están prohibidos o restringidos en algunos países. Cada persona es responsable de comprobar que usarlos sea legal donde vive, y de cumplir sus leyes e impuestos."],
      ["Sin garantías", "El software se entrega «tal cual», sin garantía de ningún tipo. Puede tener errores. Las plataformas, GitHub, Cloudflare y los proveedores de IA pueden fallar, cambiar o bloquear el servicio sin aviso."],
      ["Descargo", "En la máxima medida que permita la ley, el desarrollador y los colaboradores no responden por pérdidas, daños ni perjuicios derivados del uso o de la imposibilidad de uso del software. El desarrollador no recibe, guarda ni mueve tu dinero, y no tiene acceso a tus claves."],
    ],
    en: [
      ["What it is", "Cardón Predicciones is free, open-source software in a pilot version. It is a tool to view and trade prediction markets with your own account and from your own cloud."],
      ["Not financial advice", "Nothing the app shows, and nothing the AI models say, is a recommendation to buy or sell. It is not an exchange, a broker, a custodian or an investment, financial, tax or legal advisory service."],
      ["You can lose everything you put in", "In a prediction market each unit pays 1 if you are right and 0 if you are wrong: if you are wrong, you lose everything you paid for it. Prices move fast and there may be nobody to buy from you when you want to sell."],
      ["Legality is up to you", "Prediction markets are banned or restricted in some countries. Each person is responsible for checking that using them is legal where they live, and for complying with local laws and taxes."],
      ["No warranty", "The software is provided “as is”, without warranty of any kind. It may contain errors. The platforms, GitHub, Cloudflare and the AI providers may fail, change or block the service without notice."],
      ["Disclaimer", "To the maximum extent permitted by law, the developer and contributors are not liable for any loss or damage arising from the use of, or inability to use, the software. The developer does not receive, hold or move your money and has no access to your keys."],
    ],
  };

  function leer(k) {
    try {
      return localStorage.getItem(k) || "";
    } catch (e) {
      return "";
    }
  }
  var idioma = leer("cardon-pred-idioma");
  if (idioma !== "es" && idioma !== "en") idioma = /^en/i.test((navigator.language || "") + "") ? "en" : "es";

  function t(clave, vars) {
    var s = (TEXTOS[idioma] && TEXTOS[idioma][clave]) || TEXTOS.es[clave] || clave;
    return s.replace(/\{(\w+)\}/g, function (_, k) {
      return vars && vars[k] != null ? vars[k] : "";
    });
  }
  // Pone los textos fijos de la página: data-t (contenido), data-t-ph (placeholder) y data-t-title.
  function aplicar(raiz) {
    document.documentElement.lang = idioma;
    [].forEach.call((raiz || document).querySelectorAll("[data-t]"), function (e) {
      e.textContent = t(e.getAttribute("data-t"));
    });
    [].forEach.call((raiz || document).querySelectorAll("[data-t-ph]"), function (e) {
      e.setAttribute("placeholder", t(e.getAttribute("data-t-ph")));
    });
    [].forEach.call((raiz || document).querySelectorAll("[data-t-title]"), function (e) {
      e.setAttribute("title", t(e.getAttribute("data-t-title")));
    });
  }
  window.I18N = {
    t: t,
    // Cada parte de la app suma aquí sus propios textos.
    sumar: function (mas) {
      ["es", "en"].forEach(function (id) {
        for (var k in mas[id] || {}) TEXTOS[id][k] = mas[id][k];
      });
    },
    aplicar: aplicar,
    idioma: function () {
      return idioma;
    },
    cambiar: function (nuevo) {
      if (nuevo !== "es" && nuevo !== "en") return;
      idioma = nuevo;
      try {
        localStorage.setItem("cardon-pred-idioma", nuevo);
      } catch (e) {}
      aplicar();
      window.dispatchEvent(new Event("cardon-idioma"));
    },
    aviso: function () {
      return AVISO[idioma];
    },
  };
})();
