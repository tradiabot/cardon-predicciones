/* Cardón Predicciones: lo común de la app. Temas de color, aviso legal obligatorio, idioma,
   donaciones y utilidades. Todo texto que venga de fuera se escapa con esc() antes de pintarlo. */
(function () {
  "use strict";
  var t = I18N.t;
  var AVISO_VERSION = "2026-10-12";
  function $(id) {
    return document.getElementById(id);
  }
  function leer(k) {
    try {
      return localStorage.getItem(k) || "";
    } catch (e) {
      return "";
    }
  }
  function guardar(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function json(texto, defecto) {
    try {
      return texto ? JSON.parse(texto) : defecto;
    } catch (e) {
      return defecto;
    }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"'`]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c];
    });
  }
  var toastT = 0;
  function toast(m) {
    var e = $("toast");
    e.textContent = m;
    e.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      e.classList.remove("show");
    }, 2600);
  }
  function copiar(texto) {
    function viejo() {
      var a = document.createElement("textarea");
      a.value = texto;
      a.style.position = "fixed";
      a.style.opacity = "0";
      document.body.appendChild(a);
      a.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      a.remove();
      toast(ok ? t("copiada") : texto);
    }
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(texto).then(function () {
        toast(t("copiada"));
      }, viejo);
    else viejo();
  }

  /* ---------- Temas de color ---------- */
  var TEMAS = [
    { id: "noche", sw: ["#0a0f0d", "#5eeec8", "#d9b87a"] },
    { id: "atardecer", sw: ["#140d0a", "#ff9d6b", "#f2c879"] },
    { id: "oasis", sw: ["#090e14", "#6cc7ff", "#e3c08a"] },
    { id: "arena", sw: ["#f3ede1", "#0f6b55", "#a8823f"] },
  ];
  function tema(id) {
    var x =
      TEMAS.filter(function (m) {
        return m.id === id;
      })[0] || TEMAS[0];
    document.documentElement.setAttribute("data-theme", x.id);
    var meta = document.querySelector("meta[name=theme-color]");
    if (meta) meta.content = x.sw[0];
    guardar("cardon-pred-tema", x.id);
    [].forEach.call(document.querySelectorAll(".theme-opt"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-tema") === x.id);
    });
  }
  function pintarTemas() {
    $("temas").innerHTML = TEMAS.map(function (m) {
      return (
        '<button class="theme-opt" data-tema="' + m.id + '"><span class="theme-sw">' +
        m.sw
          .map(function (c) {
            return '<i style="background:' + c + '"></i>';
          })
          .join("") +
        "</span><b>" + esc(t("tema_" + m.id)) + "</b><small>" + esc(t("tema_" + m.id + "_n")) + "</small></button>"
      );
    }).join("");
    tema(leer("cardon-pred-tema"));
  }

  /* ---------- Aviso legal (obligatorio al abrir) ---------- */
  function aceptado() {
    return json(leer("cardon-pred-aviso"), {}).v === AVISO_VERSION;
  }
  function aviso() {
    var viejo = $("aviso");
    if (viejo) viejo.remove();
    var ya = aceptado();
    var d = document.createElement("div");
    d.id = "aviso";
    d.className = "setup";
    d.innerHTML =
      '<div class="setup-top"><b>Cardón <i>Predicciones</i></b><span></span>' + (ya ? '<button id="aviso-cerrar" class="icon-btn" title="' + esc(t("cerrar")) + '">✕</button>' : "") + "</div>" +
      '<div class="setup-body"><span class="eyebrow">' + esc(t("aviso_antes")) + "</span><h2>" + esc(t("aviso_titulo")) + '</h2><div class="aviso">' +
      I18N.aviso()
        .map(function (a) {
          return "<h4>" + esc(a[0]) + "</h4><p>" + esc(a[1]) + "</p>";
        })
        .join("") +
      "</div>" +
      (ya
        ? ""
        : [1, 2, 3]
            .map(function (n) {
              return '<label class="check"><input id="av' + n + '" type="checkbox"> ' + esc(t("aviso_c" + n)) + "</label>";
            })
            .join("") + '<div class="setup-nav"><button id="aviso-ok" class="primary" disabled>' + esc(t("aviso_aceptar")) + "</button></div>") +
      "</div>";
    document.body.appendChild(d);
    if (ya) {
      $("aviso-cerrar").onclick = function () {
        d.remove();
      };
      return;
    }
    var cajas = [$("av1"), $("av2"), $("av3")];
    cajas.forEach(function (c) {
      c.onchange = function () {
        $("aviso-ok").disabled = !cajas.every(function (x) {
          return x.checked;
        });
      };
    });
    $("aviso-ok").onclick = function () {
      guardar("cardon-pred-aviso", JSON.stringify({ v: AVISO_VERSION, ts: new Date().toISOString() }));
      d.remove();
      window.dispatchEvent(new Event("cardon-aviso"));
    };
  }

  /* ---------- Donaciones (las mismas direcciones que Cardón DeFi) ---------- */
  var DONAR = [
    { icono: "usdc", titulo: "donar_usdc", dir: "0xAC43f9b0E7F0ae6386cfC8ef6BFf62CE9c3006A1", nota: "donar_usdc_nota" },
    { icono: "bitcoin", nombre: "Bitcoin (BTC)", dir: "bc1qd9j45f4t0jwyhjhqh2kvz2cr7k8xye460rr2y7" },
    { icono: "monero", nombre: "Monero (XMR)", dir: "447gTj6Hg6gaAEAUmjqfhqDZr1PziUTvbT4LYLpmLVnTNVFK6cqeqPfh6P4neMKLWX5jDXAr94fWHacJwDvjmCzBBH8wPBt" },
  ];
  function pintarDonar() {
    $("donar").innerHTML =
      '<div class="panel-title"><span>' + esc(t("donar")) + '</span><span class="pill">' + esc(t("voluntario")) + '</span></div><p class="muted">' + t("donar_nota") + '</p><div class="don">' +
      DONAR.map(function (x) {
        var titulo = x.titulo ? t(x.titulo) : x.nombre;
        return (
          '<div class="don-card"><div class="don-head"><img src="donar/' + x.icono + '.svg" alt=""><b>' + esc(titulo) + '</b></div><img class="qr" src="donar/qr-' + x.icono + '.svg" alt="QR ' + esc(titulo) + '"><code class="address">' + x.dir + "</code>" +
          (x.nota ? '<p class="muted">' + esc(t(x.nota)) + "</p>" : "") + '<button class="wide" data-copiar="' + x.dir + '">' + esc(t("copiar")) + "</button></div>"
        );
      }).join("") +
      '</div><p class="muted" style="margin:10px 0 0">' + esc(t("gracias")) + '</p><p class="muted firma" id="firma">Hecho xhumanx + IA</p>';
  }

  /* ---------- Navegación e idioma ---------- */
  function pantalla(id) {
    [].forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("active", s.id === id);
    });
    [].forEach.call(document.querySelectorAll(".nav button"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-target") === id);
    });
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent("cardon-pantalla", { detail: id }));
  }
  function pintarFijos() {
    I18N.aplicar();
    pintarTemas();
    pintarDonar();
    $("acerca").textContent = t("acerca_nota", { version: (window.CARDON || {}).version || "" });
    [].forEach.call(document.querySelectorAll("[data-idioma]"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-idioma") === I18N.idioma());
    });
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b) return;
    if (b.hasAttribute("data-target")) pantalla(b.getAttribute("data-target"));
    else if (b.hasAttribute("data-tema")) tema(b.getAttribute("data-tema"));
    else if (b.hasAttribute("data-idioma")) I18N.cambiar(b.getAttribute("data-idioma"));
    else if (b.hasAttribute("data-copiar")) copiar(b.getAttribute("data-copiar"));
    else if (b.id === "ver-aviso") aviso();
  });
  window.addEventListener("cardon-idioma", function () {
    pintarFijos();
    if ($("aviso")) aviso();
  });

  window.BASE = { $: $, esc: esc, leer: leer, guardar: guardar, json: json, toast: toast, aceptado: aceptado };
  pintarFijos();
  if (!aceptado()) aviso();
})();
