/* Cardón Predicciones: IA («Analizar»), mercados globales y el semáforo.
   Sin nube, la IA es Kilo (gratis, sin clave) llamada desde el teléfono. Con tu nube, las IA que
   configures: sus claves viven cifradas allí y aquí solo se ven recortadas.
   Todo lo que viene de fuera (respuestas de la IA incluidas) se escapa antes de pintarlo. */
(function () {
  "use strict";
  var N = window.NUCLEO,
    B = window.BASE,
    A = window.APP,
    NB = window.NUBE,
    $ = B.$,
    esc = B.esc;

  I18N.sumar({
    es: {
      nav_global: "Global",
      global_eyebrow: "MERCADOS GLOBALES",
      global_titulo: "Global",
      g_verde: "Verde: el mercado tiene apetito",
      g_amarillo: "Amarillo: sin rumbo claro",
      g_rojo: "Rojo: hay miedo",
      g_verde_nota: "Suben la bolsa y la cripto. Suele ayudar a las preguntas de «¿sube a…?».",
      g_amarillo_nota: "Ni sube ni baja con fuerza. No dice mucho por sí solo.",
      g_rojo_nota: "Caen la bolsa y la cripto. Los precios pueden moverse fuerte hacia abajo.",
      g_nota: "Semáforo por reglas fijas (sin IA), con el cambio frente a ayer. Es contexto, no una señal de compra.",
      g_cargando: "Cargando mercados globales…",
      g_error: "No llegó: {error}",
      g_estado: "Precios públicos de Hyperliquid y alternative.me · actualizado {hace}",
      g_cripto: "Cripto",
      g_bolsa: "Bolsa",
      g_materias: "Materias primas",
      g_divisas: "Divisas",
      g_animo: "Ánimo",
      g_puntos: "{n} puntos",
      ia_analizar: "🤖 Analizar con IA",
      ia_otra_vez: "Analizar otra vez",
      ia_pensando: "Las IA están leyendo el mercado… puede tardar hasta medio minuto.",
      ia_comprar: "Comprar «{lado}»",
      ia_no_entrar: "No entrar",
      ia_confianza: "confianza {n} %",
      ia_nums: "La IA cree que «{lado}» gana con {ia} %. El precio medio dice {mercado} %.",
      ia_costo: "Comprar «{lado}» cuesta ahora {costo} por unidad.",
      ia_ventaja: "Ventaja de «{lado}»: {n} puntos.",
      ia_freno_poca_ventaja: "La IA se inclinaba por «{lado}», pero a lo que cuesta comprarlo no queda ventaja suficiente para cubrir comisiones: mejor no entrar.",
      ia_freno_sin_ofertas: "Nadie vende «{lado}» ahora: el precio que se ve no es real, mejor no entrar.",
      ia_acuerdo: "Coinciden {a} de {b} IA.",
      ia_voto_comprar: "comprar «{lado}» ({n})",
      ia_voto_no: "no entrar ({n})",
      ia_voto_fallo: "no respondió: {error}",
      ia_pie: "Opinión automática, no un consejo financiero. Puede equivocarse: decide tú.",
      ia_error: "La IA no pudo opinar: {error}",
      ia_guardado: "análisis de {hace}",
      ia_titulo: "Inteligencia artificial",
      ia_local: "KILO · GRATIS",
      ia_n_modelos: "{n} MODELOS",
      ia_nota_local: "Sin nube, la app usa Kilo: gratis, sin cuenta y sin clave, directo desde tu teléfono. Para sumar Groq, Gemini, OpenRouter, Cerebras o Mistral instala tu nube: sus claves se guardan cifradas allí, nunca en el teléfono.",
      ia_nota_nube: "Tu agente consulta a estas IA en orden. Las claves se guardan cifradas en tu nube y aquí solo se ven recortadas.",
      ia_probar: "Probar las IA",
      ia_probando: "Probando… puede tardar hasta medio minuto.",
      ia_prueba_ok: "respondió en {s} s",
      ia_prueba_mal: "falló: {error}",
      ia_clave_puesta: "clave {clave}",
      ia_sin_clave: "sin clave",
      ia_no_pide: "no pide clave",
      ia_clave_ph: "Pega aquí la clave de {nombre}",
      ia_guardar: "Guardar clave",
      ia_quitar: "Quitar clave",
      ia_alta: "Copiar dirección para crear la clave",
      ia_clave_guardada: "Clave guardada: {clave}",
      ia_clave_quitada: "Clave quitada",
      ia_modelos: "Modelos, en orden",
      ia_anadir: "Añadir",
      ia_descansa: "descansa hasta las {hora}",
      ia_consenso: "Consenso",
      ia_consenso_nota: "Con consenso opinan varias IA a la vez y gana lo que más confianza junta. Sin consenso opina solo la primera que responda.",
      ia_consenso_si: "Consenso activado",
      ia_consenso_no: "Consenso desactivado",
      ia_consenso_n: "{n} IA",
      ia_cargando: "Leyendo los ajustes de tu agente…",
      sem_titulo: "Semáforo",
      sem_revisar: "Revisar ahora",
      sem_revisando: "Revisando…",
      sem_mercados: "Mercados",
      sem_nube: "Mi nube",
      sem_ia: "IA",
      sem_avisos: "Avisos",
      sem_merc_ok: "{n} mercados leídos {hace}.",
      sem_merc_nada: "Aún no se han leído. Abre la pestaña Mercados.",
      sem_merc_mal: "{error} Revisa tu conexión y toca «Revisar ahora».",
      sem_nube_sin: "Sin instalar. Explorar y la IA gratis funcionan igual.",
      sem_nube_ok: "Conectada (versión {version}).",
      sem_nube_vieja: "Conectada, pero tu nube es la versión {version} y la app la {app}. Toca «Reinstalar o actualizar» en Mi nube.",
      sem_nube_sesion: "Sin sesión. Toca «Entrar con huella» en Mi nube.",
      sem_nube_mal: "{error}",
      sem_ia_nada: "Aún sin probar. Toca «Revisar ahora».",
      sem_ia_ok: "Respondió {hace}.",
      sem_ia_mal: "Falló {hace}: {error}",
      sem_ia_pausa: " En descanso por límite: {lista}.",
      sem_av_ok: "Activados.",
      sem_av_no: "Sin permiso. Toca «Activar avisos» más abajo.",
      sem_av_app: "Solo funcionan en la app instalada.",
    },
    en: {
      nav_global: "Global",
      global_eyebrow: "GLOBAL MARKETS",
      global_titulo: "Global",
      g_verde: "Green: the market has appetite",
      g_amarillo: "Yellow: no clear direction",
      g_rojo: "Red: there is fear",
      g_verde_nota: "Stocks and crypto are rising. It usually helps “will it reach…?” questions.",
      g_amarillo_nota: "Not moving strongly either way. It says little on its own.",
      g_rojo_nota: "Stocks and crypto are falling. Prices can move sharply down.",
      g_nota: "Traffic light from fixed rules (no AI), using the change since yesterday. It is context, not a buy signal.",
      g_cargando: "Loading global markets…",
      g_error: "Did not arrive: {error}",
      g_estado: "Public prices from Hyperliquid and alternative.me · updated {hace}",
      g_cripto: "Crypto",
      g_bolsa: "Stocks",
      g_materias: "Commodities",
      g_divisas: "Currencies",
      g_animo: "Mood",
      g_puntos: "{n} points",
      ia_analizar: "🤖 Analyze with AI",
      ia_otra_vez: "Analyze again",
      ia_pensando: "The AIs are reading the market… it can take up to half a minute.",
      ia_comprar: "Buy “{lado}”",
      ia_no_entrar: "Stay out",
      ia_confianza: "confidence {n}%",
      ia_nums: "The AI thinks “{lado}” wins with {ia}%. The mid price says {mercado}%.",
      ia_costo: "Buying “{lado}” costs {costo} per unit right now.",
      ia_ventaja: "Edge of “{lado}”: {n} points.",
      ia_freno_poca_ventaja: "The AI leaned towards “{lado}”, but at what it costs to buy there is not enough edge to cover fees: better stay out.",
      ia_freno_sin_ofertas: "Nobody is selling “{lado}” right now: the price shown is not real, better stay out.",
      ia_acuerdo: "{a} of {b} AIs agree.",
      ia_voto_comprar: "buy “{lado}” ({n})",
      ia_voto_no: "stay out ({n})",
      ia_voto_fallo: "did not answer: {error}",
      ia_pie: "Automatic opinion, not financial advice. It can be wrong: you decide.",
      ia_error: "The AI could not give an opinion: {error}",
      ia_guardado: "analysis from {hace}",
      ia_titulo: "Artificial intelligence",
      ia_local: "KILO · FREE",
      ia_n_modelos: "{n} MODELS",
      ia_nota_local: "Without a cloud, the app uses Kilo: free, no account and no key, straight from your phone. To add Groq, Gemini, OpenRouter, Cerebras or Mistral install your cloud: their keys are stored encrypted there, never on the phone.",
      ia_nota_nube: "Your agent asks these AIs in order. Keys are stored encrypted in your cloud and are only shown trimmed here.",
      ia_probar: "Test the AIs",
      ia_probando: "Testing… it can take up to half a minute.",
      ia_prueba_ok: "answered in {s} s",
      ia_prueba_mal: "failed: {error}",
      ia_clave_puesta: "key {clave}",
      ia_sin_clave: "no key",
      ia_no_pide: "needs no key",
      ia_clave_ph: "Paste the {nombre} key here",
      ia_guardar: "Save key",
      ia_quitar: "Remove key",
      ia_alta: "Copy the address to create the key",
      ia_clave_guardada: "Key saved: {clave}",
      ia_clave_quitada: "Key removed",
      ia_modelos: "Models, in order",
      ia_anadir: "Add",
      ia_descansa: "resting until {hora}",
      ia_consenso: "Consensus",
      ia_consenso_nota: "With consensus several AIs give their opinion at once and the option with the most combined confidence wins. Without it, only the first one that answers counts.",
      ia_consenso_si: "Consensus on",
      ia_consenso_no: "Consensus off",
      ia_consenso_n: "{n} AIs",
      ia_cargando: "Reading your agent's settings…",
      sem_titulo: "Traffic light",
      sem_revisar: "Check now",
      sem_revisando: "Checking…",
      sem_mercados: "Markets",
      sem_nube: "My cloud",
      sem_ia: "AI",
      sem_avisos: "Notifications",
      sem_merc_ok: "{n} markets read {hace}.",
      sem_merc_nada: "Not read yet. Open the Markets tab.",
      sem_merc_mal: "{error} Check your connection and tap “Check now”.",
      sem_nube_sin: "Not installed. Exploring and the free AI work anyway.",
      sem_nube_ok: "Connected (version {version}).",
      sem_nube_vieja: "Connected, but your cloud is version {version} and the app is {app}. Tap “Reinstall or update” in My cloud.",
      sem_nube_sesion: "No session. Tap “Sign in with fingerprint” in My cloud.",
      sem_nube_mal: "{error}",
      sem_ia_nada: "Not tested yet. Tap “Check now”.",
      sem_ia_ok: "Answered {hace}.",
      sem_ia_mal: "Failed {hace}: {error}",
      sem_ia_pausa: " Resting after hitting their limit: {lista}.",
      sem_av_ok: "On.",
      sem_av_no: "No permission. Tap “Turn on notifications” below.",
      sem_av_app: "They only work in the installed app.",
    },
  });
  var t = I18N.t;
  I18N.aplicar();

  var CADA_MS = 60000;
  var G = { datos: null, error: "", cargando: false };
  var AN = {}; // «plataforma:mercado» → { cargando } | { datos } | { error }
  var IAC = { vista: null, error: "", cargando: false, pruebas: null, probando: false, nota: "" };
  var S = { revisando: false, version: null, ultima: B.json(B.leer("cardon-pred-ia-ultima"), null), pausas: {} };

  function luz(color) {
    return '<span class="luz ' + esc(color) + '" role="img" aria-label="' + esc(color) + '"></span>';
  }
  function mensaje(e) {
    return String((e && e.message) || e);
  }
  function idioma() {
    return I18N.idioma() === "en" ? "en" : "es";
  }
  function conectada() {
    return NB.estado().conectada;
  }
  function anotar(ok, detalle) {
    S.ultima = { ts: Date.now(), ok: ok, detalle: String(detalle || "").slice(0, 200) };
    B.guardar("cardon-pred-ia-ultima", JSON.stringify(S.ultima));
  }

  /* ---------- La red de la IA sin clave: pasa por la app Android (o por fetch en un navegador) ---------- */
  function redIA(url, op) {
    return NB.httpTexto(String(url), (op && op.headers) || {}, (op && op.body) || "").then(function (r) {
      if (!r.status) throw new Error(r.texto || "sin conexión");
      return {
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        text: function () {
          return Promise.resolve(r.texto);
        },
      };
    });
  }

  /* ---------- Mercados globales ---------- */
  function valor(i) {
    return A.precio(i.valor) + (i.unidad ? " " + i.unidad : "");
  }
  function pintarGlobal() {
    var g = G.datos;
    if (!g) {
      $("g-semaforo").innerHTML = '<p class="muted">' + esc(G.error ? t("g_error", { error: G.error }) : t("g_cargando")) + "</p>";
      $("g-lista").innerHTML = "";
      $("g-errores").innerHTML = "";
      $("g-estado").textContent = "";
      return;
    }
    var c = g.lectura.color;
    $("g-semaforo").innerHTML =
      '<div class="sem-cab">' + luz(c) + "<b>" + esc(t("g_" + c)) + '</b><span class="pill">' + esc(t("g_puntos", { n: A.conSigno(g.lectura.puntos, 1) })) + "</span></div>" +
      '<p class="muted">' + esc(t("g_" + c + "_nota")) + "</p>" +
      (g.lectura.razones.length ? '<ul class="sem-razones">' + g.lectura.razones.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" : "") +
      '<p class="muted sem-pie">' + esc(t("g_nota")) + "</p>";
    $("g-errores").innerHTML = g.errores
      .map(function (e) {
        return '<div class="panel pm-error">' + esc(t("g_error", { error: e })) + "</div>";
      })
      .join("");
    var grupos = ["cripto", "bolsa", "materias", "divisas", "animo"];
    $("g-lista").innerHTML = grupos
      .map(function (gr) {
        var lista = g.indicadores.filter(function (i) {
          return i.grupo === gr;
        });
        if (!lista.length) return "";
        return (
          '<div class="panel"><div class="panel-title">' + esc(t("g_" + gr)) + '</div><div class="g-grid">' +
          lista
            .map(function (i) {
              var cambio = i.cambio == null ? "" : A.cambio(i.cambio, gr === "animo" ? A.conSigno(i.cambio, 0) : A.conSigno(i.cambio, 2) + " %");
              return '<div class="g-celda" data-ind="' + esc(i.id) + '"><span>' + esc(i.nombre) + "</span><b>" + esc(valor(i)) + "</b><em>" + cambio + "</em></div>";
            })
            .join("") +
          "</div></div>"
        );
      })
      .join("");
    $("g-estado").textContent = t("g_estado", { hace: A.hace(g.ts) });
  }
  function cargarGlobal() {
    if (G.cargando) return Promise.resolve();
    G.cargando = true;
    return N.leerGlobal({ fetch: function (u, o) { return window.fetch(u, o); } }, idioma())
      .then(
        function (g) {
          // Si no llegó nada, se conserva lo último bueno y se enseña el error real.
          if (g.indicadores.length || !G.datos) G.datos = g;
          G.error = g.indicadores.length ? "" : g.errores.join(" · ");
          if (!g.indicadores.length && G.datos === g) G.datos = null;
        },
        function (e) {
          G.error = mensaje(e);
        },
      )
      .then(function () {
        G.cargando = false;
        pintarGlobal();
      });
  }

  /* ---------- Analizar un mercado ---------- */
  function ladoDe(m, id) {
    var l = m.lados.filter(function (x) {
      return x.id === id;
    })[0];
    return l ? l.nombre : "";
  }
  function htmlAnalisis(m, d) {
    var titulo = d.sugerencia === "COMPRAR" ? t("ia_comprar", { lado: d.lado_nombre }) : t("ia_no_entrar");
    var votos = d.votos
      .map(function (v) {
        var que = !v.ok ? t("ia_voto_fallo", { error: v.error }) : v.sugerencia === "COMPRAR" ? t("ia_voto_comprar", { lado: ladoDe(m, v.lado), n: Math.round(v.confianza) }) : t("ia_voto_no", { n: Math.round(v.confianza) });
        return "<li>" + esc(N.etiquetaModelo(v.modelo)) + ": " + esc(que) + "</li>";
      })
      .join("");
    return (
      '<div class="ia-res" data-color="' + esc(d.color) + '"><div class="sem-cab">' + luz(d.color) + "<b>" + esc(titulo) + '</b><span class="pill">' + esc(t("ia_confianza", { n: Math.round(d.confianza) })) + "</span></div>" +
      (d.probabilidad != null && d.precio != null
        ? "<p>" + esc(t("ia_nums", { lado: d.primer_lado, ia: A.num(d.probabilidad, 0), mercado: A.num(d.precio, 0) })) +
          (d.costo != null && d.lado_nombre ? " " + esc(t("ia_costo", { lado: d.lado_nombre, costo: A.num(d.costo, 3) })) : "") +
          (d.ventaja != null && d.lado_nombre ? " " + esc(t("ia_ventaja", { lado: d.lado_nombre, n: A.conSigno(d.ventaja, 1) })) : "") + "</p>"
        : "") +
      (d.freno ? '<p class="pm-aviso">' + esc(t("ia_freno_" + d.freno, { lado: d.lado_nombre || "" })) + "</p>" : "") +
      (d.motivo ? "<p>" + esc(d.motivo) + "</p>" : "") +
      "<small>" + esc(t("ia_acuerdo", { a: d.acuerdo.a_favor, b: d.acuerdo.total })) + (d.guardado ? " · " + esc(t("ia_guardado", { hace: A.hace(d.ts) })) : "") + '</small><ul class="ia-votos">' + votos + "</ul>" +
      "<small>" + esc(t("ia_pie")) + "</small></div>"
    );
  }
  function tarjeta(m, k) {
    var x = AN[k],
      boton = function (texto) {
        return '<button class="wide ia-boton" data-analizar="' + esc(k) + '">' + esc(texto) + "</button>";
      };
    if (!x) return boton(t("ia_analizar"));
    if (x.cargando) return '<div class="ia-res muted">' + esc(t("ia_pensando")) + "</div>";
    if (x.error) return '<div class="ia-res pm-aviso">' + esc(t("ia_error", { error: x.error })) + "</div>" + boton(t("ia_otra_vez"));
    return htmlAnalisis(m, x.datos) + boton(t("ia_otra_vez"));
  }
  function analizar(k) {
    var m = A.mercado(k);
    if (!m || (AN[k] && AN[k].cargando)) return;
    AN[k] = { cargando: true };
    A.pintar();
    var pedido;
    if (conectada()) {
      pedido = NB.agente("/ia/analizar?idioma=" + idioma(), { cuerpo: { plataforma: m.plataforma, mercado: m.id } }).then(function (r) {
        if (r.status !== 200) throw new Error(r.datos.error || "HTTP " + r.status);
        return r.datos;
      });
    } else {
      pedido = N.analizar({
        entorno: { fetch: redIA },
        mercado: m,
        plataforma: N.buscarPlataforma(A.plataformas, m.plataforma),
        global: G.datos,
        claves: {},
        modelos: N.MODELOS_SIN_CLAVE,
        consenso: { activo: true, tamano: 2 },
        pausas: S.pausas,
        idioma: idioma(),
      }).then(
        function (r) {
          for (var x in r.pausas) S.pausas[x] = r.pausas[x];
          return r.analisis;
        },
        function (e) {
          for (var x in e.pausas || {}) S.pausas[x] = e.pausas[x];
          throw e;
        },
      );
    }
    pedido
      .then(
        function (d) {
          AN[k] = { datos: d };
          anotar(true, "");
        },
        function (e) {
          AN[k] = { error: mensaje(e) };
          anotar(false, mensaje(e));
        },
      )
      .then(function () {
        A.pintar();
        pintarSemaforo();
      });
  }

  /* ---------- Config → IA ---------- */
  function hora(ms) {
    return new Date(ms).toLocaleTimeString(I18N.idioma(), { hour: "2-digit", minute: "2-digit" });
  }
  function htmlPruebas() {
    if (IAC.probando) return '<p class="setup-note">' + esc(t("ia_probando")) + "</p>";
    if (!IAC.pruebas) return "";
    return (
      '<ul class="ia-votos">' +
      IAC.pruebas
        .map(function (p) {
          return "<li>" + luz(p.ok ? "verde" : "rojo") + " " + esc(N.etiquetaModelo(p.modelo)) + ": " + esc(p.ok ? t("ia_prueba_ok", { s: A.num(p.ms / 1000, 1) }) : t("ia_prueba_mal", { error: p.error })) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }
  function pintarIA() {
    var v = IAC.vista,
      nube = conectada();
    var cab = '<div class="panel-title"><span>' + esc(t("ia_titulo")) + '</span><span class="pill">' + esc(nube && v ? t("ia_n_modelos", { n: v.modelos.length }) : t("ia_local")) + "</span></div>";
    var pie = '<button id="ia-probar" class="wide">' + esc(t("ia_probar")) + "</button>" + htmlPruebas() + '<p id="ia-nota" class="setup-note">' + esc(IAC.nota || IAC.error) + "</p>";
    if (!nube) {
      $("ia").innerHTML = cab + '<p class="muted">' + esc(t("ia_nota_local")) + "</p>" + pie;
      return;
    }
    if (!v) {
      $("ia").innerHTML = cab + '<p class="muted">' + esc(IAC.error || t("ia_cargando")) + "</p>";
      return;
    }
    var proveedores = v.proveedores
      .map(function (p) {
        var estado = !p.pide_clave ? t("ia_no_pide") : p.clave ? t("ia_clave_puesta", { clave: p.clave }) : t("ia_sin_clave");
        return (
          '<div class="pm-plataforma" data-proveedor="' + esc(p.id) + '"><div class="pm-cab"><b>' + esc(p.nombre) + '</b><span class="pill ' + (p.tiene_clave ? "" : "warn") + '">' + esc(estado) + "</span></div>" +
          '<p class="muted">' + esc(p.nota) + "</p>" +
          (p.pide_clave
            ? '<input type="password" autocomplete="off" class="pm-buscar" data-clave-de="' + esc(p.id) + '" placeholder="' + esc(t("ia_clave_ph", { nombre: p.nombre })) + '">' +
              '<div class="grid two"><button data-guardar-clave="' + esc(p.id) + '">' + esc(t("ia_guardar")) + "</button>" +
              (p.clave ? '<button data-quitar-clave="' + esc(p.id) + '">' + esc(t("ia_quitar")) + "</button>" : p.alta ? '<button data-copiar="' + esc(p.alta) + '">' + esc(t("ia_alta")) + "</button>" : "") +
              "</div>"
            : "") +
          "</div>"
        );
      })
      .join("");
    var modelos = v.modelos
      .map(function (m, i) {
        var pausa = v.pausas[m] ? " · " + t("ia_descansa", { hora: hora(v.pausas[m]) }) : "";
        return (
          '<div class="ia-modelo"><span>' + (i + 1) + ". " + esc(N.etiquetaModelo(m)) + esc(pausa) + "</span>" +
          (i ? '<button data-subir-modelo="' + esc(m) + '" aria-label="↑">↑</button>' : "") +
          (v.modelos.length > 1 ? '<button data-quitar-modelo="' + esc(m) + '" aria-label="✕">✕</button>' : "") +
          "</div>"
        );
      })
      .join("");
    var libres = [];
    v.proveedores.forEach(function (p) {
      if (p.tiene_clave)
        p.modelos.forEach(function (m) {
          if (v.modelos.indexOf(m) < 0) libres.push(m);
        });
    });
    var anadir =
      libres.length && v.modelos.length < v.max_modelos
        ? '<div class="chips pm-filtro">' + libres.map(function (m) { return '<button data-anadir-modelo="' + esc(m) + '">+ ' + esc(N.etiquetaModelo(m)) + "</button>"; }).join("") + "</div>"
        : "";
    var consenso =
      '<div class="pm-plataforma"><div class="pm-cab"><b>' + esc(t("ia_consenso")) + "</b></div><p class=\"muted\">" + esc(t("ia_consenso_nota")) + "</p>" +
      '<button id="ia-consenso" class="wide' + (v.consenso.activo ? " primary" : "") + '">' + esc(t(v.consenso.activo ? "ia_consenso_si" : "ia_consenso_no")) + "</button>" +
      '<div class="chips pm-filtro">' +
      [2, 3, 4, 5]
        .map(function (n) {
          return '<button data-consenso-n="' + n + '"' + (v.consenso.tamano === n ? ' class="active"' : "") + ">" + esc(t("ia_consenso_n", { n: n })) + "</button>";
        })
        .join("") +
      "</div></div>";
    $("ia").innerHTML = cab + '<p class="muted">' + esc(t("ia_nota_nube")) + "</p>" + proveedores + '<div class="pm-plataforma"><div class="pm-cab"><b>' + esc(t("ia_modelos")) + "</b></div>" + modelos + anadir + "</div>" + consenso + pie;
  }
  function recibir(r) {
    if (r.status !== 200) throw new Error(r.datos.error || "HTTP " + r.status);
    IAC.vista = r.datos;
    IAC.error = "";
  }
  function cargarIA() {
    if (!conectada() || IAC.cargando) return pintarIA();
    IAC.cargando = true;
    NB.agente("/ia?idioma=" + idioma())
      .then(recibir)
      .catch(function (e) {
        IAC.error = mensaje(e);
      })
      .then(function () {
        IAC.cargando = false;
        pintarIA();
        pintarSemaforo();
      });
  }
  function cambiarIA(cuerpo, nota) {
    IAC.nota = "";
    return NB.agente("/ia?idioma=" + idioma(), { cuerpo: cuerpo })
      .then(recibir)
      .then(
        function () {
          IAC.nota = nota ? nota() : "";
        },
        function (e) {
          IAC.nota = mensaje(e);
        },
      )
      .then(pintarIA);
  }
  function probar() {
    if (IAC.probando) return Promise.resolve();
    IAC.probando = true;
    IAC.pruebas = null;
    pintarIA();
    var pedido;
    if (conectada()) {
      pedido = NB.agente("/ia/probar", { post: true }).then(function (r) {
        if (r.status !== 200) throw new Error(r.datos.error || "HTTP " + r.status);
        return r.datos.pruebas;
      });
    } else {
      var mensajes = [{ role: "system", content: "Respondes SOLO JSON." }, { role: "user", content: 'Responde exactamente {"ok":true}' }];
      pedido = Promise.all(
        N.MODELOS_SIN_CLAVE.map(function (modelo) {
          var t0 = Date.now();
          return N.preguntar({ fetch: redIA }, modelo, {}, mensajes, 200).then(
            function () {
              return { modelo: modelo, ok: true, ms: Date.now() - t0 };
            },
            function (e) {
              return { modelo: modelo, ok: false, ms: Date.now() - t0, error: mensaje(e) };
            },
          );
        }),
      );
    }
    return pedido
      .then(
        function (pruebas) {
          IAC.pruebas = pruebas;
          var mala = pruebas.filter(function (p) { return !p.ok; })[0];
          var buena = pruebas.some(function (p) { return p.ok; });
          anotar(buena, buena ? "" : mala ? mala.error : "");
        },
        function (e) {
          IAC.nota = mensaje(e);
          anotar(false, mensaje(e));
        },
      )
      .then(function () {
        IAC.probando = false;
        if (conectada()) return cargarIA();
        pintarIA();
        pintarSemaforo();
      });
  }

  /* ---------- Config → Semáforo: cuatro luces y cómo arreglar lo que esté mal ---------- */
  function luces() {
    var E = A.E,
      n = NB.estado(),
      app = (window.CARDON || {}).version || "";
    var mercados = E.errores.length
      ? ["rojo", t("sem_merc_mal", { error: E.errores.map(function (e) { return e.error; }).join(" · ") })]
      : E.datos
        ? ["verde", t("sem_merc_ok", { n: E.datos.mercados.length, hace: A.hace(E.datos.ts) })]
        : ["amarillo", t("sem_merc_nada")];
    var nube = !n.api
      ? ["amarillo", t("sem_nube_sin")]
      : n.nota
        ? ["rojo", t("sem_nube_mal", { error: n.nota })]
        : !n.conectada
          ? ["amarillo", t("sem_nube_sesion")]
          : S.version && S.version !== app
            ? ["amarillo", t("sem_nube_vieja", { version: S.version, app: app })]
            : ["verde", t("sem_nube_ok", { version: S.version || "…" })];
    // Con nube manda lo que sabe el agente; sin nube, lo último que pasó en este teléfono.
    var u = n.conectada && IAC.vista ? IAC.vista.ultima : S.ultima;
    var pausas = n.conectada && IAC.vista ? IAC.vista.pausas : S.pausas;
    var enPausa = Object.keys(pausas || {}).filter(function (m) {
      return pausas[m] > Date.now();
    });
    var ia = !u ? ["amarillo", t("sem_ia_nada")] : u.ok ? ["verde", t("sem_ia_ok", { hace: A.hace(u.ts) })] : ["rojo", t("sem_ia_mal", { hace: A.hace(u.ts), error: u.detalle })];
    if (enPausa.length) ia[1] += t("sem_ia_pausa", { lista: enPausa.map(N.etiquetaModelo).join(", ") });
    var av = NB.avisos();
    var avisos = av.error ? ["amarillo", t("sem_av_app")] : av.permiso ? ["verde", t("sem_av_ok")] : ["rojo", t("sem_av_no")];
    return [
      ["mercados", mercados],
      ["nube", nube],
      ["ia", ia],
      ["avisos", avisos],
    ];
  }
  function pintarSemaforo() {
    $("semaforo").innerHTML =
      '<div class="panel-title"><span>🚦 ' + esc(t("sem_titulo")) + "</span></div>" +
      luces()
        .map(function (x) {
          return '<div class="sem-fila" data-luz="' + x[0] + '" data-color="' + x[1][0] + '">' + luz(x[1][0]) + "<div><b>" + esc(t("sem_" + x[0])) + "</b><small>" + esc(x[1][1]) + "</small></div></div>";
        })
        .join("") +
      '<button id="sem-revisar" class="wide"' + (S.revisando ? " disabled" : "") + ">" + esc(t(S.revisando ? "sem_revisando" : "sem_revisar")) + "</button>";
  }
  function leerVersion() {
    if (!NB.estado().api) return Promise.resolve();
    return NB.agente("/salud", { anonimo: true }).then(
      function (r) {
        S.version = r.status === 200 ? r.datos.version || null : null;
      },
      function () {
        S.version = null;
      },
    );
  }
  function revisar() {
    if (S.revisando) return Promise.resolve();
    S.revisando = true;
    pintarSemaforo();
    NB.comprobar();
    return Promise.all([A.cargar(), leerVersion(), probar()]).then(function () {
      S.revisando = false;
      pintarSemaforo();
    });
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b) return;
    var v = IAC.vista;
    if (b.hasAttribute("data-analizar")) return analizar(b.getAttribute("data-analizar"));
    if (b.id === "g-actualizar") return void cargarGlobal();
    if (b.id === "sem-revisar") return void revisar();
    if (b.id === "ia-probar") return void probar();
    if (!v) return;
    if (b.hasAttribute("data-guardar-clave")) {
      var id = b.getAttribute("data-guardar-clave"),
        campo = document.querySelector('[data-clave-de="' + id + '"]'),
        claves = {};
      if (!campo || !campo.value.trim()) return;
      claves[id] = campo.value.trim();
      campo.value = ""; // la clave no se queda en la pantalla ni se guarda en el teléfono
      return void cambiarIA({ claves: claves }, function () {
        var p = IAC.vista.proveedores.filter(function (x) { return x.id === id; })[0];
        return t("ia_clave_guardada", { clave: p ? p.clave : "" });
      });
    }
    if (b.hasAttribute("data-quitar-clave")) {
      var fuera = {};
      fuera[b.getAttribute("data-quitar-clave")] = null;
      return void cambiarIA({ claves: fuera }, function () {
        return t("ia_clave_quitada");
      });
    }
    var lista = v.modelos.slice(),
      m;
    if (b.hasAttribute("data-subir-modelo")) {
      m = lista.indexOf(b.getAttribute("data-subir-modelo"));
      if (m > 0) lista.splice(m - 1, 0, lista.splice(m, 1)[0]);
      return void cambiarIA({ modelos: lista });
    }
    if (b.hasAttribute("data-quitar-modelo")) {
      m = b.getAttribute("data-quitar-modelo");
      return void cambiarIA({ modelos: lista.filter(function (x) { return x !== m; }) });
    }
    if (b.hasAttribute("data-anadir-modelo")) return void cambiarIA({ modelos: lista.concat([b.getAttribute("data-anadir-modelo")]) });
    if (b.id === "ia-consenso") return void cambiarIA({ consenso: { activo: !v.consenso.activo } });
    if (b.hasAttribute("data-consenso-n")) return void cambiarIA({ consenso: { tamano: Number(b.getAttribute("data-consenso-n")) } });
  });
  window.addEventListener("cardon-idioma", function () {
    I18N.aplicar();
    AN = {}; // los motivos vienen en el idioma en que se pidieron
    G.datos = null;
    pintarGlobal();
    pintarSemaforo();
    if (B.aceptado()) cargarGlobal();
    IAC.vista = null;
    cargarIA();
  });
  var antes = null;
  window.addEventListener("cardon-nube-estado", function () {
    var ahora = conectada();
    pintarSemaforo();
    if (ahora === antes) return;
    antes = ahora;
    IAC.vista = null;
    IAC.pruebas = null;
    if (ahora) leerVersion().then(pintarSemaforo);
    cargarIA();
  });
  window.addEventListener("cardon-pantalla", function (e) {
    if (e.detail === "global" && B.aceptado()) cargarGlobal();
    if (e.detail === "config") pintarSemaforo();
  });
  window.addEventListener("cardon-aviso", cargarGlobal);
  setInterval(function () {
    if (!document.hidden && B.aceptado() && $("global").classList.contains("active")) cargarGlobal();
  }, CADA_MS);

  window.IA = { tarjeta: tarjeta };
  pintarGlobal();
  pintarIA();
  pintarSemaforo();
  A.pintar();
  // Nada sale a la red hasta aceptar el aviso legal. El contexto global también lo usa la IA.
  if (B.aceptado()) cargarGlobal();
})();
