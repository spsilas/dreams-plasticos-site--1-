/* Dreams Plásticos — comportamento do site (JS puro, sem dependências) */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIGURAÇÃO
     Os formulários precisam de um endpoint que receba o envio (POST/JSON),
     por exemplo Formspree, Getform ou um script próprio no servidor.
     Preencha as duas constantes abaixo antes de publicar.
     ------------------------------------------------------------------ */
  var FORM_ENDPOINTS = {
    contato: "",   // ex.: "https://formspree.io/f/xxxxxxx"
    trabalhe: ""   // ex.: "https://formspree.io/f/yyyyyyy"
  };
  var PHONE_TEXT = "(11) 5660-7568";

  var d = document;
  var root = d.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* Preloader */
  var pre = $(".preload");
  function hidePre() { if (pre) { pre.classList.add("is-gone"); setTimeout(function () { pre.remove(); }, 600); } }
  window.addEventListener("load", hidePre);
  setTimeout(hidePre, 2500);

  /* Cabeçalho: sólido ao rolar + menu mobile */
  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-solid", y > 40);
    var top = $(".to-top");
    if (top) top.classList.toggle("is-visible", y > 700);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  if (toggle) {
    toggle.addEventListener("click", function () { setMenu(!header.classList.contains("is-open")); });
    $$(".nav a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* Voltar ao topo */
  var topBtn = $(".to-top");
  if (topBtn) topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* Revelar ao rolar */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Contadores animados */
  function animateCount(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var sep = el.hasAttribute("data-sep");
    if (reduce) { el.textContent = fmt(end); return; }
    var t0 = null, dur = 1600;
    function fmt(n) { n = Math.round(n); return sep ? n.toLocaleString("pt-BR") : String(n); }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); } });
    }, { threshold: .6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* Hero: slider */
  var hero = $(".hero");
  if (hero) {
    var slides = $$(".hero__slide", hero);
    var dots = $$(".dot", hero);
    var kicker = $("[data-slide-kicker]", hero);
    var text = $("[data-slide-text]", hero);
    var link = $("[data-slide-link]", hero);
    var current = 0, timer = null, TIME = 7000;
    hero.style.setProperty("--slide-time", TIME + "ms");

    function go(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle("is-active", n === current); });
      dots.forEach(function (dt, n) {
        dt.classList.remove("is-active", "is-done");
        dt.setAttribute("aria-current", n === current ? "true" : "false");
        if (n < current) dt.classList.add("is-done");
      });
      void hero.offsetWidth;
      dots[current].classList.add("is-active");
      var s = slides[current];
      [kicker, text].forEach(function (el) { if (el) { el.style.opacity = 0; } });
      setTimeout(function () {
        if (kicker) kicker.textContent = s.getAttribute("data-title");
        if (text) text.textContent = s.getAttribute("data-text");
        if (link) { link.textContent = s.getAttribute("data-link-text"); link.href = s.getAttribute("data-href"); }
        [kicker, text].forEach(function (el) { if (el) { el.style.transition = "opacity .5s"; el.style.opacity = 1; } });
      }, reduce ? 0 : 280);
      restart();
    }
    function restart() { clearTimeout(timer); if (!reduce) timer = setTimeout(function () { go(current + 1); }, TIME); }
    dots.forEach(function (dt, n) { dt.addEventListener("click", function () { go(n); }); });
    var prev = $("[data-prev]", hero), next = $("[data-next]", hero);
    if (prev) prev.addEventListener("click", function () { go(current - 1); });
    if (next) next.addEventListener("click", function () { go(current + 1); });
    hero.addEventListener("mouseenter", function () { hero.classList.add("is-paused"); clearTimeout(timer); });
    hero.addEventListener("mouseleave", function () { hero.classList.remove("is-paused"); go(current); });
    go(0);
  }

  /* Vídeo do YouTube (carrega só ao clicar) */
  $$(".video__poster").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-yt");
      /* Abrindo o arquivo direto do computador (file://), o YouTube recusa o player
         embutido (erro 153). Nesse caso abre o vídeo no YouTube; hospedado, toca aqui. */
      if (location.protocol !== "http:" && location.protocol !== "https:") {
        window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
        return;
      }
      var f = d.createElement("iframe");
      f.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.title = "Vídeo institucional da Dreams Plásticos";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });

  /* Galeria com lightbox */
  var items = $$("[data-lightbox]");
  if (items.length) {
    var lb = d.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Galeria de fotos");
    lb.innerHTML = '<button class="lightbox__close" aria-label="Fechar">×</button><button class="lightbox__prev" aria-label="Foto anterior">‹</button><img alt=""><button class="lightbox__next" aria-label="Próxima foto">›</button>';
    d.body.appendChild(lb);
    var img = $("img", lb), idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + items.length) % items.length;
      img.src = items[idx].href;
      img.alt = items[idx].getAttribute("data-alt") || "Foto da estrutura da Dreams Plásticos";
    }
    function open(i) { lastFocus = d.activeElement; show(i); lb.classList.add("is-open"); d.body.style.overflow = "hidden"; $(".lightbox__close", lb).focus(); }
    function close() { lb.classList.remove("is-open"); d.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    items.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); open(i); }); });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lightbox__next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    d.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* Formulários: validação acessível + envio */
  function maskPhone(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    return v;
  }
  $$("input[data-mask='phone']").forEach(function (i) { i.addEventListener("input", function () { i.value = maskPhone(i.value); }); });

  function validateField(f) {
    var wrap = f.closest(".field");
    var msg = "";
    var v = f.value.trim();
    if (f.required && !v) msg = "Preencha este campo.";
    else if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Informe um e-mail válido.";
    else if (f.getAttribute("data-mask") === "phone" && v && v.replace(/\D/g, "").length < 10) msg = "Informe o telefone com DDD.";
    else if (f.type === "file" && f.files && f.files[0]) {
      var file = f.files[0];
      if (file.size > 5 * 1024 * 1024) msg = "O arquivo deve ter até 5 MB.";
      else if (!/\.(pdf|docx?|odt)$/i.test(file.name)) msg = "Envie PDF ou Word (.pdf, .doc, .docx).";
    }
    wrap.classList.toggle("has-error", !!msg);
    var err = $(".field__error", wrap);
    if (err) err.textContent = msg;
    f.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  $$("form[data-form]").forEach(function (form) {
    var status = $(".form__status", form);
    var btn = $("button[type=submit]", form);
    $$("input, textarea, select", form).forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value || f.closest(".has-error")) validateField(f); });
      f.addEventListener("input", function () { if (f.closest(".has-error")) validateField(f); });
    });
    function say(kind, m) { status.className = "form__status is-" + kind; status.textContent = m; status.focus && status.focus(); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form__status";
      var fields = $$("input:not(.hp):not([type=hidden]), textarea, select", form);
      var ok = fields.map(validateField).every(Boolean);
      if (!ok) { var bad = $(".has-error input, .has-error textarea, .has-error select", form); if (bad) bad.focus(); return; }
      if ($(".hp", form) && $(".hp", form).value) return; /* anti-spam */

      var endpoint = FORM_ENDPOINTS[form.getAttribute("data-form")];
      if (!endpoint) {
        say("err", "O envio online ainda não está disponível. Ligue para " + PHONE_TEXT + " e fale com a nossa equipe.");
        return;
      }
      btn.disabled = true;
      var label = btn.innerHTML;
      btn.textContent = "Enviando…";
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () { form.reset(); say("ok", "Mensagem enviada! Retornaremos o contato o mais breve possível."); })
        .catch(function () { say("err", "Não foi possível enviar agora. Tente novamente ou ligue para " + PHONE_TEXT + "."); })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });

  /* Ano no rodapé */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
