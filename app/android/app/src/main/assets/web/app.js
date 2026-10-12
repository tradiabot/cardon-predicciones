/* Cardón Predicciones: explorador de mercados (solo lectura) y la sección «Plataformas».
   Las pantallas solo hablan con NUCLEO (la interfaz común): no saben de qué plataforma es cada dato. */
(function () {
  "use strict";
  var N = window.NUCLEO,
    B = window.BASE,
    t = I18N.t,
    $ = B.$,
    esc = B.esc;
  var CADA_MS = 60000;
  var plataformas = N.crearPlataformas({
    fetch: function (u, o) {
      return window.fetch(u, o);
    },
  });
  var E = {
    datos: null, // lo último que llegó bien: { ts, mercados, errores }
    errores: [],
    cargando: false,
    otraVez: false,
    filtro: Object.assign({}, N.FILTRO_VACIO),
    guardadas: B.json(B.leer("cardon-pred-guardadas"), {}),
    libros: {}, // «plataforma lado» → { cargando } | { libro } | { error }
  };

  function nombrePlataforma(id) {
    var p = plataformas.filter(function (x) {
      return x.id === id;
    })[0];
    return p ? p.nombre : id;
  }
  function num(x, decimales) {
    return Number(x).toLocaleString(I18N.idioma(), { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  }
  function precio(x) {
    if (x == null) return "—";
    return Number(x).toLocaleString(I18N.idioma(), { maximumFractionDigits: x >= 1000 ? 0 : x >= 10 ? 2 : 4 });
  }
  function hace(ts) {
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return t("hace_seg");
    if (s < 3600) return t("hace_min", { n: Math.floor(s / 60) });
    if (s < 86400) return t("hace_h", { n: Math.floor(s / 3600) });
    return t("hace_d", { n: Math.floor(s / 86400) });
  }
  function falta(ms) {
    var m = Math.floor((ms - Date.now()) / 60000);
    if (m < 0) return null;
    if (m < 60) return m + " min";
    if (m < 2880) return Math.floor(m / 60) + " h " + (m % 60) + " min";
    return Math.floor(m / 1440) + " d";
  }
  function fecha(ms) {
    return new Date(ms).toLocaleString(I18N.idioma(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  /* ---------- Filtros: cada opción muestra cuántos mercados tiene ---------- */
  function chip(attr, valor, texto, n, activo) {
    return '<button data-' + attr + '="' + esc(valor) + '"' + (activo ? ' class="active"' : "") + ">" + esc(texto) + (n ? " · " + n : "") + "</button>";
  }
  function pintarFiltros() {
    var m = E.datos ? E.datos.mercados : [],
      c = N.contar(m, E.guardadas),
      f = E.filtro;
    $("pm-categorias").innerHTML =
      chip("cat", "", t("cat_todas"), c.total, !f.categoria) +
      N.CATEGORIAS.map(function (k) {
        return chip("cat", k, t("cat_" + k), c.categorias[k], f.categoria === k);
      }).join("") +
      chip("cat", "guardadas", t("cat_guardadas"), c.guardadas, f.categoria === "guardadas");
    // El filtro de plataforma existe, pero no se enseña mientras haya una sola.
    $("pm-plataformas").hidden = plataformas.length < 2;
    $("pm-plataformas").innerHTML =
      chip("plat", "", t("plataforma_todas"), 0, !f.plataforma) +
      plataformas
        .map(function (p) {
          return chip("plat", p.id, p.nombre, c.plataformas[p.id], f.plataforma === p.id);
        })
        .join("");
    var creadores = Object.keys(c.creadores).sort(function (a, b) {
      return c.creadores[b] - c.creadores[a] || a.localeCompare(b);
    });
    if (f.creador && !c.creadores[f.creador]) f.creador = "";
    $("pm-creadores").innerHTML =
      chip("creador", "", t("creador_todos"), 0, !f.creador) +
      creadores
        .map(function (k) {
          return chip("creador", k, k, c.creadores[k], f.creador === k);
        })
        .join("");
    $("pm-precios").innerHTML =
      chip("precio", "0", t("precio_todos"), 0, !f.precioMax) +
      N.PRECIOS.map(function (p) {
        return chip("precio", String(p), t("precio_menos", { p: num(p, 2) }), c.precios[p], f.precioMax === p);
      }).join("");
  }

  /* ---------- Tarjetas ---------- */
  function htmlLibro(m, l) {
    var x = E.libros[m.plataforma + " " + l.id];
    if (!x) return "";
    if (x.cargando) return '<div class="pm-libro muted">' + esc(t("libro_cargando")) + "</div>";
    if (x.error) return '<div class="pm-libro pm-aviso">' + esc(x.error) + "</div>";
    function tabla(niveles) {
      if (!niveles.length) return '<p class="muted">' + esc(t("libro_vacio")) + "</p>";
      return (
        "<table>" +
        niveles
          .map(function (n) {
            return "<tr><td>" + num(n.precio, 3) + "</td><td>" + esc(t("libro_unidades", { u: num(n.unidades, 0) })) + "</td></tr>";
          })
          .join("") +
        "</table>"
      );
    }
    var v = x.libro.ventas[0],
      c = x.libro.compras[0];
    return (
      '<div class="pm-libro"><h5>' + esc(t("libro_venden")) + "</h5>" + tabla(x.libro.ventas) + "<h5>" + esc(t("libro_compran")) + "</h5>" + tabla(x.libro.compras) +
      '<p class="muted">' + esc(t("libro_nota", { venta: v ? num(v.precio, 3) : t("libro_vacio"), compra: c ? num(c.precio, 3) : t("libro_vacio") })) + "</p></div>"
    );
  }
  function tarjeta(m) {
    var k = N.clave(m),
      g = !!E.guardadas[k],
      f = E.filtro;
    var cuando = m.vence ? (falta(m.vence) ? t("vence_en", { t: falta(m.vence) }) + " · " + fecha(m.vence) : t("vencido")) : t("sin_fecha");
    var linea = [cuando];
    if (m.precio_actual != null && m.subyacente) linea.push(t("ahora_vale", { sub: m.subyacente, precio: precio(m.precio_actual) }) + (m.distancia_pct != null ? " (" + (m.distancia_pct > 0 ? "+" : "") + num(m.distancia_pct, 2) + "%)" : ""));
    linea.push(t("creado_por", { creador: m.creador }));
    if (plataformas.length > 1) linea.push(nombrePlataforma(m.plataforma));
    return (
      '<div class="panel pm-mercado" data-mercado="' + esc(k) + '"><div class="pm-cab"><b>' + esc(m.pregunta) + '</b><button class="pm-estrella" data-estrella="' + esc(k) + '" aria-pressed="' + g + '" title="' + esc(t(g ? "quitar" : "guardar")) + '">' + (g ? "★" : "☆") + "</button></div>" +
      "<small>" + esc(linea.join(" · ")) + "</small>" +
      (m.comision_doble ? '<small class="pm-aviso">⚠ ' + esc(t("comision_doble", { creador: m.creador })) + "</small>" : "") +
      (m.sin_ofertas ? '<small class="pm-aviso">⚠ ' + esc(t("sin_ofertas")) + "</small>" : "") +
      (m.regla ? "<small>" + esc(m.regla) + "</small>" : "") +
      '<div class="grid two">' +
      m.lados
        .map(function (l) {
          if (f.precioMax && !(l.precio != null && l.precio < f.precioMax)) return "";
          var abierto = !!E.libros[m.plataforma + " " + l.id];
          return (
            '<div class="pm-lado"><span>' + esc(l.nombre) + (l.precio != null ? " · " + Math.round(l.precio * 100) + "%" : "") + "</span><b>" + (l.precio != null ? num(l.precio, 3) : "—") + "</b>" +
            '<button data-libro="' + esc(k) + '" data-lado="' + esc(l.id) + '">' + esc(t(abierto ? "ocultar_libro" : "ver_libro")) + "</button></div>"
          );
        })
        .join("") +
      "</div>" +
      m.lados
        .map(function (l) {
          return htmlLibro(m, l);
        })
        .join("") +
      "</div>"
    );
  }
  function tarjetaCerrada(g) {
    var k = N.clave(g);
    return (
      '<div class="panel pm-mercado pm-cerrado"><div class="pm-cab"><b>' + esc(g.pregunta) + '</b><button class="pm-estrella" data-estrella="' + esc(k) + '" title="' + esc(t("quitar")) + '">✕</button></div>' +
      '<small class="pm-aviso">' + esc(t("cerrado")) + "</small><small>" + esc(t("cerrado_nota", { hace: hace(g.ts) })) + "</small></div>"
    );
  }

  function pintar() {
    $("pm-como").textContent = t("como_texto", { moneda: plataformas[0] ? plataformas[0].moneda : "USDC" });
    pintarFiltros();
    $("pm-errores").innerHTML = E.errores
      .map(function (e) {
        return '<div class="panel pm-error">' + esc(t("error_plataforma", { plataforma: nombrePlataforma(e.plataforma), error: e.error })) + (E.datos ? " " + esc(t("error_viejos")) : "") + "</div>";
      })
      .join("");
    if (!E.datos) {
      $("pm-estado").textContent = E.cargando ? t("cargando") : "";
      $("pm-lista").innerHTML = "";
      return;
    }
    var lista = N.filtrar(E.datos.mercados, E.filtro, E.guardadas);
    $("pm-estado").textContent = t("estado", { n: lista.length, total: E.datos.mercados.length, hace: hace(E.datos.ts) });
    var html = lista.slice(0, 80).map(tarjeta).join("");
    if (E.filtro.categoria === "guardadas" && !E.filtro.texto) {
      var idas = N.cerradas(E.guardadas, { mercados: E.datos.mercados, errores: E.errores });
      html += idas.map(tarjetaCerrada).join("");
      if (!lista.length && !idas.length) html = '<p class="muted">' + esc(t("sin_guardadas")) + "</p>";
    } else if (!lista.length) html = '<p class="muted">' + esc(t("nada")) + "</p>";
    $("pm-lista").innerHTML = html;
  }

  /* ---------- Datos ---------- */
  function cargar() {
    if (E.cargando) {
      E.otraVez = true; // p. ej. cambió el idioma a media carga: se repite al terminar
      return Promise.resolve();
    }
    E.cargando = true;
    if (!E.datos) pintar();
    return N.explorar(plataformas, I18N.idioma())
      .then(function (r) {
        E.errores = r.errores;
        // Si todas fallaron se conserva lo último bueno y se enseña el error real.
        if (r.mercados.length || !r.errores.length || !E.datos) E.datos = r;
      })
      .catch(function (e) {
        E.errores = [{ plataforma: "app", error: String((e && e.message) || e) }];
      })
      .then(function () {
        E.cargando = false;
        pintar();
        if (E.otraVez) {
          E.otraVez = false;
          return cargar();
        }
      });
  }
  function verLibro(k, lado) {
    var m = (E.datos ? E.datos.mercados : []).filter(function (x) {
      return N.clave(x) === k;
    })[0];
    if (!m) return;
    var id = m.plataforma + " " + lado;
    if (E.libros[id]) {
      delete E.libros[id];
      return pintar();
    }
    E.libros[id] = { cargando: true };
    pintar();
    N.buscarPlataforma(plataformas, m.plataforma)
      .libro(lado)
      .then(
        function (libro) {
          if (E.libros[id]) E.libros[id] = { libro: libro };
        },
        function (e) {
          if (E.libros[id]) E.libros[id] = { error: String((e && e.message) || e) };
        },
      )
      .then(pintar);
  }
  function estrella(k) {
    var m = (E.datos ? E.datos.mercados : []).filter(function (x) {
      return N.clave(x) === k;
    })[0];
    E.guardadas = N.alternarGuardada(E.guardadas, m || E.guardadas[k], Date.now());
    B.guardar("cardon-pred-guardadas", JSON.stringify(E.guardadas));
    pintar();
  }

  /* ---------- Config → Plataformas ---------- */
  function pintarPlataformas() {
    $("plataformas").innerHTML = plataformas
      .map(function (p) {
        return (
          '<div class="pm-plataforma"><div class="pm-cab"><b>' + esc(p.nombre) + '</b><span class="pill">' + esc(t("plat_lectura")) + "</span></div>" +
          '<p class="muted">' + esc(t("plat_detalle", { moneda: p.moneda, min: num(p.minimo_orden, 0) })) + "</p>" +
          '<p class="muted">' + esc(t("plat_claves", { claves: p.claves.map(function (c) { return c.nombre; }).join(", ") })) + "</p></div>"
        );
      })
      .join("");
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b) return;
    if (b.hasAttribute("data-cat")) E.filtro.categoria = b.getAttribute("data-cat");
    else if (b.hasAttribute("data-plat")) E.filtro.plataforma = b.getAttribute("data-plat");
    else if (b.hasAttribute("data-creador")) E.filtro.creador = b.getAttribute("data-creador");
    else if (b.hasAttribute("data-precio")) E.filtro.precioMax = Number(b.getAttribute("data-precio")) || 0;
    else if (b.hasAttribute("data-estrella")) return estrella(b.getAttribute("data-estrella"));
    else if (b.hasAttribute("data-libro")) return verLibro(b.getAttribute("data-libro"), b.getAttribute("data-lado"));
    else if (b.id === "pm-actualizar") return void cargar();
    else return;
    pintar();
  });
  $("pm-buscar").addEventListener("input", function () {
    E.filtro.texto = this.value;
    pintar();
  });
  window.addEventListener("cardon-idioma", function () {
    // Las preguntas llegan ya traducidas de cada plataforma: se piden de nuevo.
    pintarPlataformas();
    pintar();
    cargar();
  });
  window.addEventListener("cardon-aviso", cargar);
  setInterval(function () {
    if (!document.hidden && B.aceptado() && $("mercados").classList.contains("active")) cargar();
  }, CADA_MS);

  pintarPlataformas();
  pintar();
  // Nada sale a la red hasta aceptar el aviso legal.
  if (B.aceptado()) cargar();
})();
