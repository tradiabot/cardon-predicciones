/* Cardón Predicciones: tu nube. Instalador guiado (GitHub + Cloudflare), sesión por huella y avisos.
   Lo que viene de fuera (GitHub, Cloudflare, tu agente) se pinta con textContent, nunca como HTML. */
(function () {
  "use strict";
  var B = window.BASE,
    $ = B.$,
    esc = B.esc,
    C = window.CARDON || {},
    NATIVO = window.AndroidApp || null;
  var REPO = "cardon-predicciones-nube",
    AGENTE = "cardon-predicciones";

  I18N.sumar({
    es: {
      nube_titulo: "Mi nube",
      nube_sin: "SIN INSTALAR",
      nube_ok: "CONECTADA",
      nube_sesion: "SIN SESIÓN",
      nube_nota_sin: "Explorar mercados funciona sin nube. Para operar hará falta tu propio agente, en una cuenta de Cloudflare que es solo tuya. Empieza siempre en simulación.",
      nube_instalar: "Instalar o conectar mi nube",
      nube_entrar: "🔓 Entrar con huella",
      nube_salir: "Cerrar sesión en este teléfono",
      nube_reinstalar: "Reinstalar o actualizar",
      nube_entrando: "Pidiendo el reto a tu agente…",
      nube_huella: "Confirma con tu huella…",
      nube_lista: "Sesión iniciada",
      nube_cerrada: "Sesión cerrada",
      nube_caida: "Tu agente no respondió: {error}",
      e_HUELLA_NO_DISPONIBLE: "Este teléfono no admite huella en la app (hace falta Android 9 o superior).",
      e_SIN_BLOQUEO_DE_PANTALLA: "Activa primero el bloqueo de pantalla del teléfono (huella o PIN) y vuelve a intentarlo.",
      e_SIN_LLAVE: "Este teléfono aún no tiene su llave: instala o reinstala tu nube desde aquí.",
      e_LLAVE_INVALIDADA: "Cambiaste las huellas del teléfono y la llave dejó de valer. Reinstala tu nube desde aquí.",
      e_CANCELADO: "Cancelado.",
      e_SIN_APP: "Solo disponible en la app Android.",
      avisos_titulo: "Avisos en el teléfono",
      avisos_nota: "Notificaciones de Android cuando vence un mercado que guardaste y, con tu nube conectada, cuando hay propuestas nuevas u órdenes ejecutadas. Se revisan cada 15 minutos aproximadamente y al abrir la app.",
      avisos_permiso_si: "PERMITIDOS",
      avisos_permiso_no: "SIN PERMISO",
      avisos_activar: "Permitir notificaciones",
      avisos_probar: "Enviar un aviso de prueba",
      avisos_prueba_t: "Cardón Predicciones",
      avisos_prueba_x: "Así se ven los avisos. Todo en orden.",
      avisos_vencido_t: "Venció un mercado que guardaste",
      avisos_vencido_x: "Se liquida solo: no hay que vender.",
      avisos_est_ok: "Última revisión de tu nube: bien ({hace}).",
      avisos_est_sin_nube: "Sin nube conectada: solo se avisa de los mercados guardados que vencen.",
      avisos_est_sesion: "Tu sesión caducó: entra con tu huella para volver a recibir avisos de tu nube.",
      avisos_est_error: "Última revisión de tu nube: {error} ({hace}).",
      i_paso: "Paso {n} de {total}",
      i_atras: "Atrás",
      i_seguir: "Continuar",
      i_comprobar: "Comprobar y continuar",
      i_inicio_e: "INSTALAR TU NUBE",
      i_inicio_t: "Tu agente, en tu propia nube",
      i_inicio_p: "En unos 10 minutos tendrás un agente funcionando en una cuenta que es solo tuya. Empieza en <b>simulación</b>.",
      i_inicio_l: "<li><b>Huella.</b> Tu teléfono crea una llave que solo tú puedes usar.</li><li><b>GitHub</b> (gratis). Guarda una copia privada del código y lo instala.</li><li><b>Cloudflare</b> (gratis). Es donde vive tu agente.</li>",
      i_inicio_n: "Tus claves van cifradas a tus propias cuentas. El desarrollador no las recibe.",
      i_empezar: "Empezar",
      i_ya: "Ya tengo mi nube instalada",
      i_ya_url: "Dirección de tu agente",
      i_ya_huella: "Conectar con mi huella",
      i_ya_clave: "Contraseña de administrador (si este no es el teléfono que la instaló)",
      i_ya_conectar: "Conectar con la contraseña",
      i_ya_mal: "Revisa la dirección (https://…).",
      i_huella_e: "HUELLA",
      i_huella_t: "La llave de tu teléfono",
      i_huella_p: "Tu teléfono crea una llave en su almacén seguro. Solo funciona con tu huella, tu rostro o tu PIN, y no se puede copiar. Tu agente guardará la mitad pública para reconocerte.",
      i_huella_crear: "Crear la llave",
      i_huella_ok: "Llave lista en este teléfono",
      i_gh_e: "GITHUB",
      i_gh_t: "Conecta GitHub",
      i_gh_p: "GitHub guardará una copia privada del código de tu agente y lo instalará en tu Cloudflare.",
      i_gh_l: '<li>Si no tienes cuenta, <a href="https://github.com/signup">créala gratis</a> y confirma tu correo.</li><li>Abre <a href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Cardon%20Predicciones">crear token</a>. Ya vienen marcadas las casillas <b>repo</b> y <b>workflow</b>.</li><li>En «Expiration» elige 90 días o más y toca <b>Generate token</b>.</li><li>Copia el token (empieza con <code>ghp_</code>) y pégalo aquí.</li>',
      i_gh_token: "Token de GitHub",
      i_gh_como: "Conectado como {login}",
      i_gh_401: "GitHub no reconoce ese token.",
      i_pega: "Pega el token completo.",
      i_comprobando: "Comprobando…",
      i_no_pude: "No pude comprobarlo ({error}).",
      i_cf_e: "CLOUDFLARE",
      i_cf_t: "Conecta Cloudflare",
      i_cf_p: "Aquí vivirá tu agente. El plan gratuito alcanza.",
      i_cf_l: '<li>Si no tienes cuenta, <a href="https://dash.cloudflare.com/sign-up">créala gratis</a> y confirma tu correo.</li><li>Entra a <a href="https://dash.cloudflare.com/?to=/:account/workers-and-pages">Workers &amp; Pages</a>. A la derecha verás <b>Account ID</b>: cópialo.</li><li>Abre <a href="https://dash.cloudflare.com/profile/api-tokens">API Tokens</a> → <b>Create Token</b> → plantilla <b>Edit Cloudflare Workers</b>.</li><li>En «Permissions» toca <b>Add more</b> y agrega <b>Account · D1 · Edit</b>.</li><li>En «Account Resources» elige tu cuenta y en «Zone Resources», <b>All zones</b>. Toca <b>Continue</b> y <b>Create Token</b>.</li><li>Copia el token y pégalo aquí. Solo se muestra una vez.</li>',
      i_cf_token: "Token de Cloudflare",
      i_cf_id_mal: "El Account ID son 32 letras y números.",
      i_cf_ok: "Cloudflare comprobado",
      i_cf_rechazo: "Cloudflare rechazó el token o el Account ID (permiso Workers Scripts).",
      i_cf_d1: "Al token le falta el permiso «Account · D1 · Edit». Edítalo o crea otro.",
      i_cf_red: "Sin conexión con Cloudflare: {error}",
      i_fin_e: "ÚLTIMO PASO",
      i_fin_t: "Instalar tu agente",
      i_fin_p: "Se creará el repositorio privado <b>{repo}</b> en tu GitHub y el agente <b>{agente}</b> en tu Cloudflare. Tarda de 2 a 4 minutos; no cierres la app.",
      i_fin_modo: "Modo",
      i_fin_sim: "Simulación",
      i_fin_llave: "Llave del teléfono",
      i_fin_boton: "Instalar mi agente",
      i_reintentar: "Reintentar",
      i_no_completo: "No se completó: {error}",
      l_repo: "Preparando tu repositorio privado…",
      l_repo_existe: "El repositorio {repo} ya existe: lo reutilizo",
      l_repo_ok: "Repositorio privado {repo} creado",
      l_copia: "Esperando a que GitHub copie los archivos… ({s} s)",
      l_copia_ok: "Archivos listos",
      l_copia_tarde: "GitHub no terminó de copiar la plantilla en 2 minutos",
      l_claves: "Cifrando y guardando tus claves en tu GitHub…",
      l_claves_ok: "Claves guardadas cifradas",
      l_lanzar: "Instalando en tu Cloudflare… {estado} ({s} s)",
      l_cola: "en cola",
      l_curso: "en curso",
      l_espera: "esperando a GitHub",
      l_fallo: "la instalación falló en GitHub Actions. Detalle: {url}",
      l_lento: "la instalación tarda demasiado; revisa la pestaña Actions de tu repositorio",
      l_desplegado: "Agente desplegado en tu Cloudflare",
      l_dir: "Leyendo la dirección de tu agente…",
      l_dir_mal: "dirección del agente inválida",
      l_dir_ok: "Tu agente: {url}",
      l_sesion: "Entrando con tu huella…",
      l_listo: "¡Listo! Tu agente ya está en tu nube, en simulación.",
    },
    en: {
      nube_titulo: "My cloud",
      nube_sin: "NOT INSTALLED",
      nube_ok: "CONNECTED",
      nube_sesion: "SIGNED OUT",
      nube_nota_sin: "Exploring markets works without a cloud. Trading will need your own agent, in a Cloudflare account that is yours alone. It always starts in simulation.",
      nube_instalar: "Install or connect my cloud",
      nube_entrar: "🔓 Sign in with fingerprint",
      nube_salir: "Sign out on this phone",
      nube_reinstalar: "Reinstall or update",
      nube_entrando: "Asking your agent for the challenge…",
      nube_huella: "Confirm with your fingerprint…",
      nube_lista: "Signed in",
      nube_cerrada: "Signed out",
      nube_caida: "Your agent did not respond: {error}",
      e_HUELLA_NO_DISPONIBLE: "This phone does not support fingerprint in the app (Android 9 or later is required).",
      e_SIN_BLOQUEO_DE_PANTALLA: "Turn on the phone's screen lock first (fingerprint or PIN) and try again.",
      e_SIN_LLAVE: "This phone has no key yet: install or reinstall your cloud from here.",
      e_LLAVE_INVALIDADA: "You changed the phone's fingerprints and the key is no longer valid. Reinstall your cloud from here.",
      e_CANCELADO: "Cancelled.",
      e_SIN_APP: "Only available in the Android app.",
      avisos_titulo: "Phone alerts",
      avisos_nota: "Android notifications when a market you saved expires and, with your cloud connected, when there are new proposals or executed orders. Checked roughly every 15 minutes and when you open the app.",
      avisos_permiso_si: "ALLOWED",
      avisos_permiso_no: "NO PERMISSION",
      avisos_activar: "Allow notifications",
      avisos_probar: "Send a test alert",
      avisos_prueba_t: "Cardón Predicciones",
      avisos_prueba_x: "This is what alerts look like. All good.",
      avisos_vencido_t: "A market you saved has expired",
      avisos_vencido_x: "It settles by itself: no need to sell.",
      avisos_est_ok: "Last check of your cloud: fine ({hace}).",
      avisos_est_sin_nube: "No cloud connected: you only get alerts for saved markets that expire.",
      avisos_est_sesion: "Your session expired: sign in with your fingerprint to get alerts from your cloud again.",
      avisos_est_error: "Last check of your cloud: {error} ({hace}).",
      i_paso: "Step {n} of {total}",
      i_atras: "Back",
      i_seguir: "Continue",
      i_comprobar: "Check and continue",
      i_inicio_e: "INSTALL YOUR CLOUD",
      i_inicio_t: "Your agent, in your own cloud",
      i_inicio_p: "In about 10 minutes you will have an agent running in an account that is yours alone. It starts in <b>simulation</b>.",
      i_inicio_l: "<li><b>Fingerprint.</b> Your phone creates a key only you can use.</li><li><b>GitHub</b> (free). Keeps a private copy of the code and installs it.</li><li><b>Cloudflare</b> (free). It is where your agent lives.</li>",
      i_inicio_n: "Your keys go encrypted to your own accounts. The developer never receives them.",
      i_empezar: "Start",
      i_ya: "I already have my cloud installed",
      i_ya_url: "Your agent's address",
      i_ya_huella: "Connect with my fingerprint",
      i_ya_clave: "Administrator password (if this is not the phone that installed it)",
      i_ya_conectar: "Connect with the password",
      i_ya_mal: "Check the address (https://…).",
      i_huella_e: "FINGERPRINT",
      i_huella_t: "Your phone's key",
      i_huella_p: "Your phone creates a key in its secure store. It only works with your fingerprint, face or PIN, and cannot be copied. Your agent keeps the public half to recognise you.",
      i_huella_crear: "Create the key",
      i_huella_ok: "Key ready on this phone",
      i_gh_e: "GITHUB",
      i_gh_t: "Connect GitHub",
      i_gh_p: "GitHub will keep a private copy of your agent's code and install it on your Cloudflare.",
      i_gh_l: '<li>If you have no account, <a href="https://github.com/signup">create one for free</a> and confirm your email.</li><li>Open <a href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Cardon%20Predicciones">create token</a>. The <b>repo</b> and <b>workflow</b> boxes come ticked.</li><li>Under “Expiration” choose 90 days or more and tap <b>Generate token</b>.</li><li>Copy the token (it starts with <code>ghp_</code>) and paste it here.</li>',
      i_gh_token: "GitHub token",
      i_gh_como: "Connected as {login}",
      i_gh_401: "GitHub does not recognise that token.",
      i_pega: "Paste the whole token.",
      i_comprobando: "Checking…",
      i_no_pude: "Could not check it ({error}).",
      i_cf_e: "CLOUDFLARE",
      i_cf_t: "Connect Cloudflare",
      i_cf_p: "Your agent will live here. The free plan is enough.",
      i_cf_l: '<li>If you have no account, <a href="https://dash.cloudflare.com/sign-up">create one for free</a> and confirm your email.</li><li>Go to <a href="https://dash.cloudflare.com/?to=/:account/workers-and-pages">Workers &amp; Pages</a>. On the right you will see <b>Account ID</b>: copy it.</li><li>Open <a href="https://dash.cloudflare.com/profile/api-tokens">API Tokens</a> → <b>Create Token</b> → template <b>Edit Cloudflare Workers</b>.</li><li>Under “Permissions” tap <b>Add more</b> and add <b>Account · D1 · Edit</b>.</li><li>Under “Account Resources” choose your account and under “Zone Resources”, <b>All zones</b>. Tap <b>Continue</b> and <b>Create Token</b>.</li><li>Copy the token and paste it here. It is shown only once.</li>',
      i_cf_token: "Cloudflare token",
      i_cf_id_mal: "The Account ID is 32 letters and digits.",
      i_cf_ok: "Cloudflare checked",
      i_cf_rechazo: "Cloudflare rejected the token or the Account ID (Workers Scripts permission).",
      i_cf_d1: "The token lacks the “Account · D1 · Edit” permission. Edit it or create another.",
      i_cf_red: "No connection to Cloudflare: {error}",
      i_fin_e: "LAST STEP",
      i_fin_t: "Install your agent",
      i_fin_p: "The private repository <b>{repo}</b> will be created on your GitHub and the agent <b>{agente}</b> on your Cloudflare. It takes 2 to 4 minutes; do not close the app.",
      i_fin_modo: "Mode",
      i_fin_sim: "Simulation",
      i_fin_llave: "Phone key",
      i_fin_boton: "Install my agent",
      i_reintentar: "Retry",
      i_no_completo: "Not completed: {error}",
      l_repo: "Preparing your private repository…",
      l_repo_existe: "Repository {repo} already exists: reusing it",
      l_repo_ok: "Private repository {repo} created",
      l_copia: "Waiting for GitHub to copy the files… ({s} s)",
      l_copia_ok: "Files ready",
      l_copia_tarde: "GitHub did not finish copying the template in 2 minutes",
      l_claves: "Encrypting and saving your keys in your GitHub…",
      l_claves_ok: "Keys saved encrypted",
      l_lanzar: "Installing on your Cloudflare… {estado} ({s} s)",
      l_cola: "queued",
      l_curso: "in progress",
      l_espera: "waiting for GitHub",
      l_fallo: "the installation failed in GitHub Actions. Details: {url}",
      l_lento: "the installation is taking too long; check the Actions tab of your repository",
      l_desplegado: "Agent deployed on your Cloudflare",
      l_dir: "Reading your agent's address…",
      l_dir_mal: "invalid agent address",
      l_dir_ok: "Your agent: {url}",
      l_sesion: "Signing in with your fingerprint…",
      l_listo: "Done! Your agent is now in your cloud, in simulation.",
    },
  });
  var t = I18N.t;

  function parse(x) {
    return B.json(x, {});
  }
  function nativo(nombre) {
    if (!NATIVO || !NATIVO[nombre]) return { error: "SIN_APP" };
    try {
      return parse(NATIVO[nombre].apply(NATIVO, [].slice.call(arguments, 1)));
    } catch (e) {
      return { error: String((e && e.message) || e) };
    }
  }
  // Códigos del teléfono → frase; cualquier otro error se muestra tal cual.
  function motivo(e) {
    var s = String((e && e.message) || e || "");
    var k = "e_" + s.split(":")[0];
    return t(k) !== k ? t(k) : s;
  }
  function espera(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  /* ---------- Estado: dirección del agente y sesión ---------- */
  var N = {
    api: B.leer("cardon-pred-api") || C.api || "",
    token: B.leer("cardon-pred-sesion"),
    valida: null, // null = sin comprobar
    nota: "",
  };
  function recordar() {
    B.guardar("cardon-pred-api", N.api);
    B.guardar("cardon-pred-sesion", N.token);
    if (NATIVO && NATIVO.guardarNube) NATIVO.guardarNube(N.api, N.token);
  }
  function agente(ruta, op) {
    op = op || {};
    var cab = { "Content-Type": "application/json" };
    if (!op.anonimo && (op.token || N.token)) cab.Authorization = "Bearer " + (op.token || N.token);
    return window
      .fetch((op.api || N.api) + ruta, { method: op.cuerpo || op.post ? "POST" : "GET", headers: cab, body: op.cuerpo ? JSON.stringify(op.cuerpo) : undefined })
      .then(function (r) {
        return r.json().then(
          function (d) {
            return { status: r.status, datos: d || {} };
          },
          function () {
            return { status: r.status, datos: {} };
          },
        );
      });
  }

  /* ---------- Huella ---------- */
  var esperaHuella = null;
  window.onHuella = function (crudo) {
    var f = esperaHuella;
    esperaHuella = null;
    if (f) f(parse(crudo));
  };
  function firmar(mensaje) {
    return new Promise(function (ok, mal) {
      esperaHuella = function (r) {
        if (r.error || !r.firma) mal(new Error(r.error || "HUELLA"));
        else ok(r);
      };
      var r = nativo("firmar", mensaje);
      if (r.error) {
        esperaHuella = null;
        mal(new Error(r.error));
      }
    });
  }
  // Pide un reto al agente, lo firma el teléfono tras la huella y devuelve el token de sesión.
  function entrar(api, alAvanzar) {
    var paso = alAvanzar || function () {};
    paso(t("nube_entrando"));
    return agente("/sesion/reto", { api: api, post: true, anonimo: true })
      .then(function (r) {
        if (r.status !== 200 || !r.datos.mensaje) throw new Error(r.datos.error || "HTTP " + r.status);
        paso(t("nube_huella"));
        return firmar(r.datos.mensaje);
      })
      .then(function (f) {
        return agente("/sesion/entrar", { api: api, cuerpo: { mensaje: f.mensaje, firma: f.firma }, anonimo: true });
      })
      .then(function (r) {
        if (r.status !== 200 || !r.datos.token) throw new Error(r.datos.error || "HTTP " + r.status);
        return r.datos.token;
      });
  }
  function conectar(api, token) {
    N.api = api;
    N.token = token;
    N.valida = true;
    N.nota = "";
    recordar();
    pintar();
    window.dispatchEvent(new Event("cardon-nube"));
  }
  function comprobar() {
    if (!N.api || !N.token) {
      N.valida = N.api ? false : null;
      return pintar();
    }
    agente("/sesion").then(
      function (r) {
        N.valida = r.status === 200 && r.datos.valida === true;
        N.nota = r.status === 200 || r.status === 401 ? "" : t("nube_caida", { error: r.datos.error || "HTTP " + r.status });
        pintar();
      },
      function (e) {
        N.nota = t("nube_caida", { error: String((e && e.message) || e) });
        pintar();
      },
    );
  }

  /* ---------- Paneles de Configuración ---------- */
  function pintar() {
    var conectada = !!N.api && N.valida === true;
    var pastilla = !N.api ? ["nube_sin", "warn"] : conectada ? ["nube_ok", ""] : ["nube_sesion", "warn"];
    $("estado-nube").textContent = !N.api ? t("solo_lectura") : t(pastilla[0]);
    $("estado-nube").className = "pill " + pastilla[1];
    $("nube").innerHTML =
      '<div class="panel-title"><span>' + esc(t("nube_titulo")) + '</span><span class="pill ' + pastilla[1] + '">' + esc(t(pastilla[0])) + "</span></div>" +
      (N.api ? '<p class="muted pm-url">' + esc(N.api.replace(/\/api\/v1$/, "")) + "</p>" : '<p class="muted">' + esc(t("nube_nota_sin")) + "</p>") +
      (N.api && !conectada ? '<button id="nube-entrar" class="primary wide">' + esc(t("nube_entrar")) + "</button>" : "") +
      '<button id="nube-instalar" class="wide' + (N.api ? "" : " primary") + '">' + esc(t(N.api ? "nube_reinstalar" : "nube_instalar")) + "</button>" +
      (conectada ? '<button id="nube-salir" class="wide">' + esc(t("nube_salir")) + "</button>" : "") +
      '<p id="nube-nota" class="setup-note">' + esc(N.nota) + "</p>";
    pintarAvisos();
  }
  function pintarAvisos() {
    var e = nativo("avisosEstado"),
      hay = !e.error;
    var estado = "";
    if (hay && e.estado) {
      var hace = e.ts ? new Date(e.ts).toLocaleTimeString(I18N.idioma(), { hour: "2-digit", minute: "2-digit" }) : "";
      estado = e.estado === "ok" ? t("avisos_est_ok", { hace: hace }) : e.estado === "sin_nube" ? t("avisos_est_sin_nube") : e.estado === "sesion" ? t("avisos_est_sesion") : t("avisos_est_error", { error: e.estado, hace: hace });
    }
    $("avisos-panel").innerHTML =
      '<div class="panel-title"><span>' + esc(t("avisos_titulo")) + "</span>" + (hay ? '<span class="pill ' + (e.permiso ? "" : "warn") + '">' + esc(t(e.permiso ? "avisos_permiso_si" : "avisos_permiso_no")) + "</span>" : "") + "</div>" +
      '<p class="muted">' + esc(t("avisos_nota")) + "</p>" +
      (hay
        ? (e.permiso ? "" : '<button id="avisos-activar" class="primary wide">' + esc(t("avisos_activar")) + "</button>") + '<button id="avisos-probar" class="wide">' + esc(t("avisos_probar")) + "</button>"
        : '<p class="setup-note">' + esc(t("e_SIN_APP")) + "</p>") +
      '<p id="avisos-estado" class="setup-note">' + esc(estado) + "</p>";
  }
  window.onAvisos = pintarAvisos;
  // El vigilante nativo necesita saber qué mercados guardaste y cuándo vencen.
  function pasarVigiladas() {
    if (!NATIVO || !NATIVO.guardarVigiladas) return;
    var g = B.json(B.leer("cardon-pred-guardadas"), {});
    var lista = Object.keys(g).map(function (k) {
      return { k: k, pregunta: g[k].pregunta, vence: g[k].vence || 0 };
    });
    NATIVO.guardarVigiladas(JSON.stringify(lista), I18N.idioma(), t("avisos_vencido_t"), t("avisos_vencido_x"));
  }

  /* ---------- Peticiones a GitHub y Cloudflare (solo durante la instalación) ---------- */
  var pendientes = {},
    serie = 0;
  window.onNativeHttp = function (id, status, texto) {
    var f = pendientes[id];
    if (f) {
      delete pendientes[id];
      f({ status: status, data: parse(texto) });
    }
  };
  function http(metodo, url, cabeceras, cuerpo) {
    var carga = cuerpo ? JSON.stringify(cuerpo) : "";
    if (NATIVO && NATIVO.http)
      return new Promise(function (ok) {
        var id = "h" + ++serie;
        pendientes[id] = ok;
        NATIVO.http(id, metodo, url, JSON.stringify(cabeceras), carga);
      });
    return window
      .fetch(url, { method: metodo, headers: cabeceras, body: carga || undefined })
      .then(function (r) {
        return r.text().then(function (x) {
          return { status: r.status, data: parse(x) };
        });
      })
      .catch(function (e) {
        return { status: 0, data: { error: String(e.message || e) } };
      });
  }
  var W = {}; // lo que se va reuniendo en el asistente; los tokens se borran al terminar
  function gh(metodo, ruta, cuerpo) {
    return http(metodo, "https://api.github.com" + ruta, { Authorization: "Bearer " + W.gh.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json", "User-Agent": "cardon-predicciones-app" }, cuerpo);
  }
  function cf(metodo, ruta, token) {
    return http(metodo, "https://api.cloudflare.com/client/v4" + ruta, { Authorization: "Bearer " + token, "Content-Type": "application/json" });
  }
  function bien(r, que) {
    if (r.status >= 200 && r.status < 300) return r;
    throw new Error(que + ": " + ((r.data && (r.data.message || r.data.error)) || "HTTP " + r.status));
  }
  function azar() {
    var a = new Uint8Array(24);
    crypto.getRandomValues(a);
    return [].map
      .call(a, function (b) {
        return ("0" + b.toString(16)).slice(-2);
      })
      .join("");
  }

  /* ---------- Asistente de instalación ---------- */
  var PASOS = ["inicio", "huella", "github", "cloudflare", "instalar"],
    capa,
    cuerpo;
  function abrir(en) {
    if (!B.aceptado()) return;
    if (capa) capa.remove();
    capa = document.createElement("div");
    capa.id = "instalador";
    capa.className = "setup";
    capa.innerHTML = '<div class="setup-top"><b>Cardón <i>Predicciones</i></b><span id="i-cuenta"></span><button id="i-cerrar" class="icon-btn">✕</button></div><div class="setup-bar"><i id="i-progreso"></i></div><div id="i-cuerpo" class="setup-body"></div>';
    document.body.appendChild(capa);
    cuerpo = $("i-cuerpo");
    $("i-cerrar").onclick = cerrar;
    ir(en || "inicio");
  }
  function cerrar() {
    W = {};
    if (capa) capa.remove();
    capa = null;
  }
  function ir(nombre) {
    var n = PASOS.indexOf(nombre);
    $("i-cuenta").textContent = n > 0 ? t("i_paso", { n: n, total: PASOS.length - 1 }) : "";
    $("i-progreso").style.width = (n / (PASOS.length - 1)) * 100 + "%";
    cuerpo.scrollTop = 0;
    PANTALLAS[nombre]();
  }
  // Solo recibe textos propios de la app (i18n); lo de fuera entra después con textContent.
  function pantalla(html) {
    cuerpo.innerHTML = html;
  }
  function botones(atras, seguir, etiqueta) {
    var d = document.createElement("div");
    d.className = "setup-nav";
    d.innerHTML = '<button id="i-atras">' + esc(t("i_atras")) + '</button><button id="i-seguir" class="primary">' + esc(etiqueta || t("i_seguir")) + "</button>";
    cuerpo.appendChild(d);
    if (atras)
      $("i-atras").onclick = function () {
        ir(atras);
      };
    else $("i-atras").hidden = true;
    $("i-seguir").onclick = seguir;
    return $("i-seguir");
  }
  function nota(id, texto, clase) {
    $(id).textContent = texto;
    $(id).className = "setup-note " + (clase || "");
  }
  function campo(id, etiqueta, secreto, ph) {
    return "<label>" + esc(etiqueta) + '<input id="' + id + '"' + (secreto ? ' type="password"' : "") + ' autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(ph || "") + '"></label>';
  }
  function cabecera(k) {
    return '<span class="eyebrow">' + esc(t("i_" + k + "_e")) + "</span><h2>" + esc(t("i_" + k + "_t")) + "</h2><p>" + t("i_" + k + "_p", { repo: REPO, agente: AGENTE }) + "</p>";
  }

  var PANTALLAS = {
    inicio: function () {
      pantalla(
        cabecera("inicio") + '<ol class="setup-list">' + t("i_inicio_l") + '</ol><p class="muted">' + esc(t("i_inicio_n")) + "</p>" +
          '<details class="setup-more"><summary>' + esc(t("i_ya")) + "</summary>" + campo("ya-url", t("i_ya_url"), false, "https://cardon-predicciones.….workers.dev") +
          '<button id="ya-huella" class="wide">' + esc(t("i_ya_huella")) + "</button>" + campo("ya-clave", t("i_ya_clave"), true) + '<button id="ya-clave-ir" class="wide">' + esc(t("i_ya_conectar")) + '</button><p id="ya-nota" class="setup-note"></p></details>',
      );
      botones(null, function () { ir("huella"); }, t("i_empezar"));
      $("ya-url").value = N.api.replace(/\/api\/v1$/, "");
      function direccion() {
        var u = $("ya-url").value.trim().replace(/\/+$/, "");
        if (/^https:\/\/[A-Za-z0-9.-]+$/.test(u)) return u + "/api/v1";
        nota("ya-nota", t("i_ya_mal"), "bad");
        return "";
      }
      function fallo(e) {
        nota("ya-nota", motivo(e), "bad");
      }
      $("ya-huella").onclick = function () {
        var api = direccion();
        if (!api) return;
        entrar(api, function (m) { nota("ya-nota", m); })
          .then(function (token) {
            conectar(api, token);
            cerrar();
          })
          .catch(fallo);
      };
      $("ya-clave-ir").onclick = function () {
        var api = direccion(),
          clave = $("ya-clave").value.trim();
        if (!api) return;
        if (clave.length < 8) return nota("ya-nota", t("i_pega"), "bad");
        nota("ya-nota", t("i_comprobando"));
        agente("/sesion", { api: api, token: clave })
          .then(function (r) {
            if (r.status !== 200 || r.datos.valida !== true) throw new Error(r.datos.error || "HTTP " + r.status);
            conectar(api, clave);
            cerrar();
          })
          .catch(fallo);
      };
    },
    huella: function () {
      pantalla(cabecera("huella") + '<div id="h-caja"></div><p id="h-nota" class="setup-note"></p>');
      var seguir = botones("inicio", function () { ir("github"); });
      function lista(publica) {
        W.publica = publica;
        $("h-caja").innerHTML = '<div class="setup-ok">' + esc(t("i_huella_ok")) + "</div>";
        seguir.disabled = false;
      }
      seguir.disabled = true;
      var e = nativo("huellaEstado");
      if (e.publica) return lista(e.publica);
      $("h-caja").innerHTML = '<button id="h-crear" class="primary wide">' + esc(t("i_huella_crear")) + "</button>";
      if (e.error) nota("h-nota", motivo(e.error), "bad");
      $("h-crear").onclick = function () {
        var r = nativo("crearLlave");
        if (r.error || !r.publica) return nota("h-nota", motivo(r.error), "bad");
        nota("h-nota", "");
        lista(r.publica);
      };
    },
    github: function () {
      pantalla(cabecera("gh") + '<ol class="setup-list">' + t("i_gh_l") + "</ol>" + campo("gh-token", t("i_gh_token"), true, "ghp_…") + '<p id="gh-nota" class="setup-note"></p>');
      if (W.gh) nota("gh-nota", t("i_gh_como", { login: W.gh.login }), "ok");
      var seguir = botones("huella", function () {
        var token = $("gh-token").value.trim();
        if (!token && W.gh) return ir("cloudflare");
        if (token.length < 20) return nota("gh-nota", t("i_pega"), "bad");
        seguir.disabled = true;
        nota("gh-nota", t("i_comprobando"));
        W.gh = { token: token };
        gh("GET", "/user").then(function (r) {
          seguir.disabled = false;
          if (r.status !== 200 || !r.data.login) {
            W.gh = null;
            return nota("gh-nota", r.status === 401 ? t("i_gh_401") : t("i_no_pude", { error: r.data.message || r.data.error || "HTTP " + r.status }), "bad");
          }
          W.gh.login = r.data.login;
          ir("cloudflare");
        });
      }, t("i_comprobar"));
    },
    cloudflare: function () {
      pantalla(cabecera("cf") + '<ol class="setup-list">' + t("i_cf_l") + "</ol>" + campo("cf-cuenta", "Account ID", false, "32…") + campo("cf-token", t("i_cf_token"), true) + '<p id="cf-nota" class="setup-note"></p>');
      if (W.cf) {
        $("cf-cuenta").value = W.cf.cuenta;
        nota("cf-nota", t("i_cf_ok"), "ok");
      }
      var seguir = botones("github", function () {
        var cuenta = $("cf-cuenta").value.trim().toLowerCase(),
          token = $("cf-token").value.trim();
        if (!token && W.cf && W.cf.cuenta === cuenta) return ir("instalar");
        if (!/^[0-9a-f]{32}$/.test(cuenta)) return nota("cf-nota", t("i_cf_id_mal"), "bad");
        if (token.length < 20) return nota("cf-nota", t("i_pega"), "bad");
        seguir.disabled = true;
        nota("cf-nota", t("i_comprobando"));
        Promise.all([cf("GET", "/accounts/" + cuenta + "/workers/scripts", token), cf("GET", "/accounts/" + cuenta + "/d1/database?per_page=10", token)]).then(function (r) {
          seguir.disabled = false;
          if (r[0].status === 0) return nota("cf-nota", t("i_cf_red", { error: r[0].data.error || "" }), "bad");
          if (r[0].status !== 200) return nota("cf-nota", t("i_cf_rechazo"), "bad");
          if (r[1].status !== 200) return nota("cf-nota", t("i_cf_d1"), "bad");
          W.cf = { cuenta: cuenta, token: token };
          ir("instalar");
        });
      }, t("i_comprobar"));
    },
    instalar: function () {
      if (!W.publica || !W.gh || !W.cf) return ir(!W.publica ? "huella" : !W.gh ? "github" : "cloudflare");
      pantalla(
        cabecera("fin") + '<dl class="setup-summary"><dt>' + esc(t("i_fin_llave")) + '</dt><dd>✓</dd><dt>GitHub</dt><dd id="r-gh"></dd><dt>Cloudflare</dt><dd id="r-cf"></dd><dt>' + esc(t("i_fin_modo")) + "</dt><dd>" + esc(t("i_fin_sim")) + "</dd></dl>" +
          '<div class="setup-bar big"><i id="i-barra"></i></div><div id="i-registro" class="setup-log"></div>',
      );
      $("r-gh").textContent = W.gh.login;
      $("r-cf").textContent = W.cf.cuenta.slice(0, 6) + "…";
      var seguir = botones("cloudflare", function () {
        seguir.disabled = true;
        $("i-atras").disabled = true;
        instalar().catch(function (e) {
          linea(t("i_no_completo", { error: motivo(e) }), "bad");
          seguir.disabled = false;
          $("i-atras").disabled = false;
          seguir.textContent = t("i_reintentar");
        });
      }, t("i_fin_boton"));
    },
  };
  function linea(texto, clase) {
    var d = document.createElement("div");
    d.textContent = texto;
    if (clase) d.className = clase;
    $("i-registro").appendChild(d);
    if (d.scrollIntoView) d.scrollIntoView({ block: "end" });
    return d;
  }
  function hecho(d, texto) {
    d.textContent = texto;
    d.className = "ok";
  }
  function barra(p) {
    $("i-barra").style.width = Math.max(2, Math.min(100, p)) + "%";
  }

  function instalar() {
    var dueno = W.gh.login,
      base = "/repos/" + dueno + "/" + REPO,
      rama = "main",
      t0;
    $("i-registro").innerHTML = "";
    barra(2);
    var l = linea(t("l_repo"));
    return gh("GET", base)
      .then(function (r) {
        if (r.status === 200) {
          rama = r.data.default_branch || "main";
          return hecho(l, t("l_repo_existe", { repo: dueno + "/" + REPO }));
        }
        return gh("POST", "/repos/" + (C.plantilla || "tradiabot/cardon-predicciones") + "/generate", { owner: dueno, name: REPO, private: true, description: "Mi agente Cardón Predicciones" }).then(function (r) {
          bien(r, "GitHub");
          rama = r.data.default_branch || "main";
          hecho(l, t("l_repo_ok", { repo: dueno + "/" + REPO }));
          barra(10);
          var w = linea(t("l_copia", { s: 0 })),
            n = 0;
          function lista() {
            return gh("GET", base + "/contents/.github/workflows/instalar.yml?ref=" + rama).then(function (r) {
              if (r.status === 200) return hecho(w, t("l_copia_ok"));
              if (r.status === 401 || r.status === 403) bien(r, "GitHub");
              if (n++ > 40) throw new Error(t("l_copia_tarde"));
              w.textContent = t("l_copia", { s: n * 3 });
              return espera(3000).then(lista);
            });
          }
          return lista();
        });
      })
      .then(function () {
        barra(18);
        var s = linea(t("l_claves"));
        // La contraseña de administrador es un respaldo que vive solo en tu GitHub y tu Cloudflare: la app no la conserva.
        var secretos = { CLOUDFLARE_API_TOKEN: W.cf.token, CLOUDFLARE_ACCOUNT_ID: W.cf.cuenta, ADMIN_TOKEN: azar(), DEVICE_PUBLIC_KEY: W.publica };
        return gh("GET", base + "/actions/secrets/public-key").then(function (r) {
          bien(r, "GitHub");
          var nombres = Object.keys(secretos),
            i = 0;
          function poner() {
            if (i >= nombres.length) return hecho(s, t("l_claves_ok"));
            var n = nombres[i++];
            return gh("PUT", base + "/actions/secrets/" + n, { encrypted_value: window.agenteSellar(r.data.key, String(secretos[n])), key_id: r.data.key_id }).then(function (x) {
              bien(x, n);
              barra(18 + (12 * i) / nombres.length);
              return poner();
            });
          }
          return poner();
        });
      })
      .then(function () {
        var s = linea(t("l_lanzar", { estado: t("l_espera"), s: 0 })),
          intentos = 0;
        t0 = Date.now();
        function lanzar() {
          return gh("POST", base + "/actions/workflows/instalar.yml/dispatches", { ref: rama }).then(function (r) {
            if (r.status === 204) return;
            if ((r.status === 404 || r.status === 422) && intentos++ < 12) return espera(5000).then(lanzar);
            bien(r, "GitHub Actions");
          });
        }
        function vigilar() {
          return gh("GET", base + "/actions/workflows/instalar.yml/runs?per_page=3").then(function (r) {
            bien(r, "GitHub Actions");
            var run = (r.data.workflow_runs || []).filter(function (x) {
                return Date.parse(x.created_at) >= t0 - 60000;
              })[0],
              seg = Math.round((Date.now() - t0) / 1000);
            if (run && run.status === "completed") {
              if (run.conclusion === "success") return;
              throw new Error(t("l_fallo", { url: run.html_url }));
            }
            if (Date.now() - t0 > 12 * 60000) throw new Error(t("l_lento"));
            s.textContent = t("l_lanzar", { estado: run ? t(run.status === "queued" ? "l_cola" : "l_curso") : t("l_espera"), s: seg });
            barra(33 + Math.min(48, seg / 4));
            return espera(6000).then(vigilar);
          });
        }
        return lanzar()
          .then(function () {
            barra(33);
            return vigilar();
          })
          .then(function () {
            hecho(s, t("l_desplegado"));
            barra(84);
          });
      })
      .then(function () {
        var s = linea(t("l_dir"));
        return gh("GET", base + "/contents/cardon.json?ref=" + rama).then(function (r) {
          bien(r, "cardon.json");
          var info = parse(atob(String(r.data.content).replace(/\s/g, "")));
          if (!/^https:\/\/[A-Za-z0-9.-]+$/.test(info.url || "")) throw new Error(t("l_dir_mal"));
          hecho(s, t("l_dir_ok", { url: info.url }));
          barra(90);
          return info.url + "/api/v1";
        });
      })
      .then(function (api) {
        var s = linea(t("l_sesion"));
        return entrar(api).then(function (token) {
          hecho(s, t("nube_lista"));
          barra(100);
          linea(t("l_listo"), "ok");
          conectar(api, token);
          return espera(1500).then(cerrar);
        });
      });
  }

  /* ---------- Botones ---------- */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b) return;
    if (b.id === "nube-instalar") abrir("inicio");
    else if (b.id === "nube-entrar")
      entrar(N.api, function (m) {
        nota("nube-nota", m);
      }).then(
        function (token) {
          conectar(N.api, token);
          B.toast(t("nube_lista"));
        },
        function (e) {
          nota("nube-nota", motivo(e), "bad");
        },
      );
    else if (b.id === "nube-salir")
      agente("/sesion/salir", { post: true })
        .catch(function () {})
        .then(function () {
          N.token = "";
          N.valida = false;
          recordar();
          pintar();
          B.toast(t("nube_cerrada"));
        });
    else if (b.id === "avisos-activar") {
      NATIVO.pedirPermisoAvisos();
      setTimeout(pintarAvisos, 1500);
    } else if (b.id === "avisos-probar") NATIVO.probarAvisos(t("avisos_prueba_t"), t("avisos_prueba_x"));
  });
  window.addEventListener("cardon-idioma", function () {
    pintar();
    pasarVigiladas();
  });
  window.addEventListener("cardon-guardadas", pasarVigiladas);
  window.addEventListener("cardon-pantalla", function (e) {
    if (e.detail === "config") pintarAvisos();
  });

  pintar();
  pasarVigiladas();
  if (NATIVO && NATIVO.guardarNube) NATIVO.guardarNube(N.api, N.token);
  if (B.aceptado()) comprobar();
  else window.addEventListener("cardon-aviso", comprobar);
})();
