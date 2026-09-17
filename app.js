(() => {
  "use strict";

  const data = window.BOOK_DATA;
  // Clave propia del Libro II: si algún día comparte origen con el Libro I, el
  // progreso de un libro no pisa el del otro.
  const STORAGE_KEY = "el-ciclo-inmovil-libro2-v1";
  // Mismo nombre que AUDIO_CACHE en sw.js. En el Libro I no coincidían y el
  // activate del service worker borraba lo guardado sin conexión.
  const AUDIO_CACHE = "el-ciclo-inmovil-libro2-audio-v1";
  const $ = (id) => document.getElementById(id);

  // Rueda de velocidad: pasos discretos. OJO: va ACA arriba, no junto a sus
  // funciones. buildSpeedWheel() corre en el init de mas abajo; las funciones se
  // hoistean pero los const no, y una TDZ aca rompe el init entero.
  const SPEEDS = [0.75, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2];
  let speedIndex = 0;

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 5.2v13.6L19.5 12z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 5h3.2v14H7.2z"/><path d="M13.6 5h3.2v14h-3.2z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.3v5.4h3.3L12 18.9V5.1L7.3 9.3z"/><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M14.8 9.3a3.9 3.9 0 0 1 0 5.4"/><path d="M17.3 6.9a7.3 7.3 0 0 1 0 10.2"/></g></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.3v5.4h3.3L12 18.9V5.1L7.3 9.3z"/><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m15.2 9.6 4.8 4.8"/><path d="m20 9.6-4.8 4.8"/></g></svg>'
  };

  const elements = {
    audio: $("audio"), chapterList: $("chapterList"), partGrid: $("partGrid"),
    playButton: $("playButton"), previousButton: $("previousButton"), nextButton: $("nextButton"),
    backButton: $("backButton"), forwardButton: $("forwardButton"), timeline: $("timeline"),
    currentTime: $("currentTime"), duration: $("duration"), muteButton: $("muteButton"),
    speedWheel: $("speedWheel"), speedWheelTrack: $("speedWheelTrack"),
    speedToggle: $("speedToggle"), speedToggleValue: $("speedToggleValue"), speedPop: $("speedPop"),
    playerChapter: $("playerChapter"), playerTitle: $("playerTitle"), playerNumber: $("playerNumber"),
    nowTitle: $("nowTitle"), nowPart: $("nowPart"), nowNumber: $("nowNumber"), nowArtLabel: $("nowArtLabel"),
    elapsedSummary: $("elapsedSummary"), durationSummary: $("durationSummary"), cardProgress: $("cardProgress"),
    overallProgress: $("overallProgress"), overallPercent: $("overallPercent"), resumeButton: $("resumeButton"),
    bookRemaining: $("bookRemaining"), bookTotal: $("bookTotal"), bookSpeedNote: $("bookSpeedNote"), bookHours: $("bookHours"),
    offlineButton: $("offlineButton"), offlineNote: $("offlineNote"),
    menuButton: $("menuButton"), mobileMenu: $("mobileMenu"), mobileClose: $("mobileClose"),
    toast: $("toast")
  };

  const defaultState = {
    currentIndex: 0,
    times: {},
    durations: {},
    completed: {},
    unavailable: {},
    speed: 1,
    spoilers: true   // true = proteger; el oyente puede apagarlo
  };

  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = { ...defaultState, ...(saved || {}) };
  state.times ||= {};
  state.durations ||= {};
  state.completed ||= {};
  state.unavailable ||= {};

  let selectedIndex = clamp(Number(state.currentIndex) || 0, 0, data.chapters.length - 1);
  let pendingAutoplay = false;
  let toastTimer;
  let lastSavedSecond = -1;
  const expandedParts = new Set();
  expandedParts.add(data.chapters[selectedIndex]?.part || "");

  // La presentación NO es un capitulo y NO vive en data.chapters: todo el estado
  // guardado va por indice de array. Se reproduce por el mismo <audio> en este
  // modo, que apaga cada escritura de estado.
  let frontMatterMode = false;

  // el hero cuenta capítulos, no pistas: los interludios se cuentan aparte
  $("chapterCount").textContent = data.chapters.filter(c => !c.label).length;
  $("year").textContent = new Date().getFullYear();
  buildSpeedWheel();
  renderChapters();
  renderParts();
  updateSpoilerToggle();
  renderCast();
  renderScenes();
  selectChapter(selectedIndex, false, true);
  bindEvents();
  updateOverallProgress();
  registerServiceWorker();

  function bindEvents() {
    elements.playButton.addEventListener("click", togglePlay);
    elements.resumeButton.addEventListener("click", () => {
      selectChapter(selectedIndex, true);
      document.querySelector("#escuchar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.previousButton.addEventListener("click", () => selectChapter(selectedIndex - 1, true));
    elements.nextButton.addEventListener("click", () => selectChapter(selectedIndex + 1, true));
    elements.backButton.addEventListener("click", () => seekBy(-10));
    elements.forwardButton.addEventListener("click", () => seekBy(10));
    elements.timeline.addEventListener("input", () => {
      if (!Number.isFinite(elements.audio.duration)) return;
      elements.audio.currentTime = (Number(elements.timeline.value) / 100) * elements.audio.duration;
    });
    bindSpeedWheel();
    elements.muteButton.addEventListener("click", () => {
      elements.audio.muted = !elements.audio.muted;
      elements.muteButton.innerHTML = elements.audio.muted ? ICONS.muted : ICONS.volume;
    });
    elements.menuButton.addEventListener("click", openMenu);
    elements.mobileClose.addEventListener("click", closeMenu);
    elements.mobileMenu.addEventListener("click", (event) => { if (event.target.tagName === "A") closeMenu(); });
    elements.offlineButton.addEventListener("click", saveCurrentAudioOffline);
    document.getElementById("spoilerToggle")?.addEventListener("click", toggleSpoilers);
    document.getElementById("castGrid")?.addEventListener("click", event => {
      const g = event.target.closest(".cast-group:not(.locked)");
      if (!g) return;
      const src = g.querySelector("[data-abrir]")?.dataset.abrir || g.querySelector("img")?.getAttribute("src");
      if (src) abrirLupa(src);
    });

    elements.audio.addEventListener("loadedmetadata", onLoadedMetadata);
    elements.audio.addEventListener("timeupdate", onTimeUpdate);
    // el trailer y el audiolibro no suenan a la vez: el que arranca para al otro
    const trailer = document.getElementById("trailerVideo");
    if (trailer) {
      trailer.addEventListener("play", () => { if (!elements.audio.paused) elements.audio.pause(); });
      elements.audio.addEventListener("play", () => { if (!trailer.paused) trailer.pause(); });
    }
    elements.audio.addEventListener("play", ajustarEscenas);
    elements.audio.addEventListener("pause", ajustarEscenas);
    document.addEventListener("visibilitychange", ajustarEscenas);
    elements.audio.addEventListener("play", updatePlayState);
    elements.audio.addEventListener("pause", updatePlayState);
    elements.audio.addEventListener("ended", onEnded);
    elements.audio.addEventListener("error", onAudioError);
    elements.audio.addEventListener("canplay", () => {
      if (pendingAutoplay) {
        pendingAutoplay = false;
        elements.audio.play().catch(() => {});
      }
    });

    document.addEventListener("keydown", (event) => {
      const foco = document.activeElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(foco?.tagName)) return;
      // la rueda de velocidad usa las flechas para su propio valor
      if (foco?.getAttribute?.("role") === "slider") return;
      if (event.code === "Space" && foco?.tagName !== "BUTTON") { event.preventDefault(); togglePlay(); }
      if (event.code === "ArrowLeft") seekBy(-10);
      if (event.code === "ArrowRight") seekBy(10);
    });
  }

  // ---- rueda de velocidad (picker vertical) --------------------------------
  // El enganche en cada valor lo hace scroll-snap del navegador: dedo, rueda y
  // trackpad funcionan sin codigo propio. Aca solo se lee en que valor quedo.
  let wheelScrollTimer;
  let ruedaLista = false;                 // ignora el scroll hasta colocarla

  // Nada de aritmetica con --item: entre bordes y redondeo el alto util no es
  // exactamente 5 filas. Se mide donde esta cada fila.
  function centroDeFila(i) {
    const b = elements.speedWheelTrack.children[i];
    if (!b) return 0;
    return b.offsetTop + b.offsetHeight / 2 - elements.speedWheelTrack.clientHeight / 2;
  }

  function indiceMasCercano() {
    const actual = elements.speedWheelTrack.scrollTop;
    let mejor = 0, dist = Infinity;
    for (let i = 0; i < SPEEDS.length; i++) {
      const d = Math.abs(centroDeFila(i) - actual);
      if (d < dist) { dist = d; mejor = i; }
    }
    return mejor;
  }

  function buildSpeedWheel() {
    if (!elements.speedWheel) return;
    elements.speedWheelTrack.innerHTML = SPEEDS
      .map((v, i) => `<b data-i="${i}">${v}×</b>`).join("");
    const guardada = SPEEDS.indexOf(Number(state.speed || 1));
    speedIndex = guardada >= 0 ? guardada : SPEEDS.indexOf(1);
    aplicarVelocidad({ persist: false, toast: false });
  }

  function abrirRueda() {
    elements.speedPop.hidden = false;
    elements.speedToggle.setAttribute("aria-expanded", "true");
    // sincronico a proposito: leer offsetTop fuerza el layout del popover que
    // acaba de dejar de ser display:none. Con un requestAnimationFrame de por
    // medio el scrollTo llegaba antes que el alto y se recortaba a 0.
    ruedaLista = false;
    irAIndice(speedIndex, "auto");
    requestAnimationFrame(() => { ruedaLista = true; });
    elements.speedWheel.focus({ preventScroll: true });
  }

  function cerrarRueda({ devolverFoco = false } = {}) {
    if (elements.speedPop.hidden) return;
    ruedaLista = false;
    elements.speedPop.hidden = true;
    elements.speedToggle.setAttribute("aria-expanded", "false");
    if (devolverFoco) elements.speedToggle.focus();
  }

  function irAIndice(i, behavior = "smooth") {
    elements.speedWheelTrack.scrollTo({ top: centroDeFila(i), behavior });
  }

  function aplicarVelocidad({ persist = true, toast = true } = {}) {
    const valor = SPEEDS[speedIndex];
    const cambio = state.speed !== valor;
    state.speed = valor;
    elements.audio.playbackRate = valor;

    elements.speedWheelTrack.querySelectorAll("b").forEach((b, i) =>
      b.classList.toggle("on", i === speedIndex));
    elements.speedToggleValue.textContent = `${valor}×`;
    elements.speedWheel.setAttribute("aria-valuenow", String(valor));
    elements.speedWheel.setAttribute("aria-valuetext", `${valor}×`);

    updateBookTime();
    if (persist) saveState();
    if (toast && cambio) showToast(`Velocidad: ${valor}×`);
  }

  function moverVelocidad(paso) {
    const nuevo = clamp(speedIndex + paso, 0, SPEEDS.length - 1);
    if (nuevo === speedIndex) return;
    speedIndex = nuevo;
    aplicarVelocidad();
    irAIndice(speedIndex);
  }

  function bindSpeedWheel() {
    const rueda = elements.speedWheel;
    if (!rueda) return;

    elements.speedToggle.addEventListener("click", () => {
      elements.speedPop.hidden ? abrirRueda() : cerrarRueda({ devolverFoco: true });
    });

    // tocar una fila la elige, sin tener que deslizar hasta el centro
    elements.speedWheelTrack.addEventListener("click", event => {
      const fila = event.target.closest("b[data-i]");
      if (!fila) return;
      speedIndex = Number(fila.dataset.i);
      aplicarVelocidad();
      irAIndice(speedIndex);
      setTimeout(() => cerrarRueda({ devolverFoco: true }), 160);
    });

    document.addEventListener("pointerdown", event => {
      if (elements.speedPop.hidden) return;
      if (!event.target.closest(".speed-picker")) cerrarRueda();
    });

    rueda.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.stopPropagation(); cerrarRueda({ devolverFoco: true }); }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); event.stopPropagation();
        cerrarRueda({ devolverFoco: true });
      }
    });

    elements.speedWheelTrack.addEventListener("scroll", () => {
      if (!ruedaLista) return;
      const i = indiceMasCercano();
      if (i !== speedIndex) {
        speedIndex = i;
        // mientras el dedo arrastra se refleja, pero sin guardar ni avisar
        aplicarVelocidad({ persist: false, toast: false });
      }
      clearTimeout(wheelScrollTimer);
      wheelScrollTimer = setTimeout(() => aplicarVelocidad(), 220);
    }, { passive: true });

    if ("onscrollend" in window) {
      elements.speedWheelTrack.addEventListener("scrollend", () => {
        if (!ruedaLista) return;
        clearTimeout(wheelScrollTimer);
        speedIndex = indiceMasCercano();
        aplicarVelocidad();
      });
    }

    rueda.addEventListener("keydown", event => {
      const pasos = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
      if (event.key in pasos) {
        event.preventDefault();
        event.stopPropagation();
        moverVelocidad(pasos[event.key]);
      } else if (event.key === "Home") {
        event.preventDefault(); speedIndex = 0; aplicarVelocidad(); irAIndice(0);
      } else if (event.key === "End") {
        event.preventDefault();
        speedIndex = SPEEDS.length - 1; aplicarVelocidad(); irAIndice(speedIndex);
      }
    });
  }

  // ---- lista de capítulos y partes ---------------------------------------
  function partGroups() {
    const groups = [];
    data.chapters.forEach((chapter, index) => {
      const part = chapter.part || "";
      if (!groups.length || groups[groups.length - 1].part !== part) groups.push({ part, items: [] });
      groups[groups.length - 1].items.push(index);
    });
    return groups;
  }

  function renderChapters() {
    elements.chapterList.innerHTML = "";
    const fm = data.site.frontMatter;
    if (fm) {
      const wrap = document.createElement("div");
      wrap.className = "chapter-item-wrap";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chapter-item${frontMatterMode ? " active" : ""}`;
      const sonando = frontMatterMode && !elements.audio.paused;
      button.innerHTML = `
        <span class="chapter-number">✦</span>
        <span class="chapter-copy">
          <strong>${escapeHtml(fm.title)}</strong>
          <span>${sonando ? "Reproduciendo ahora" : escapeHtml(fm.kicker || "")}</span>
        </span>
        <span class="chapter-state"></span>`;
      button.addEventListener("click", playFrontMatter);
      wrap.appendChild(button);
      elements.chapterList.appendChild(wrap);
    }

    partGroups().forEach(group => {
      const open = expandedParts.has(group.part);
      if (group.part) {
        const header = document.createElement("button");
        header.type = "button";
        header.className = `part-header${open ? " open" : ""}`;
        header.dataset.part = group.part;
        header.setAttribute("aria-expanded", String(open));
        const done = group.items.filter(i => state.completed[i]).length;
        header.innerHTML = `
          <span class="part-title">${escapeHtml(group.part)}</span>
          <span class="part-meta">${done}/${group.items.length} · <b class="part-chevron">${open ? "▾" : "▸"}</b></span>`;
        header.addEventListener("click", () => {
          if (expandedParts.has(group.part)) expandedParts.delete(group.part);
          else expandedParts.add(group.part);
          renderChapters();
        });
        elements.chapterList.appendChild(header);
        if (!open) return;
      }
      group.items.forEach(index => {
        const chapter = data.chapters[index];
        const progress = getChapterProgress(index);
        const isDone = !!state.completed[index];

        const wrap = document.createElement("div");
        wrap.className = "chapter-item-wrap";

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.index = index;
        button.className = `chapter-item${index === selectedIndex && !frontMatterMode ? " active" : ""}${state.unavailable[index] ? " unavailable" : ""}`;
        const detalle = state.unavailable[index]
          ? "Archivo de audio no encontrado"
          : index === selectedIndex && !frontMatterMode && !elements.audio.paused
            ? "Reproduciendo ahora"
            : (chapter.label || "Capítulo " + chapter.number) + (getChapterSeconds(index) ? " · " + formatLong(getChapterSeconds(index)) : "");
        button.innerHTML = `
          <span class="chapter-number">${escapeHtml(chapter.badge || String(chapter.number).padStart(2, "0"))}</span>
          <span class="chapter-copy">
            <strong>${escapeHtml(chapter.title)}</strong>
            <span>${detalle}</span>
          </span>
          <span class="chapter-state">
            <strong>${Math.round(progress * 100)}%</strong>
            <span class="mini-progress"><span style="width:${progress * 100}%"></span></span>
          </span>`;
        button.addEventListener("click", () => selectChapter(index, true));

        const doneToggle = document.createElement("button");
        doneToggle.type = "button";
        doneToggle.className = `chapter-done-toggle${isDone ? " done" : ""}`;
        doneToggle.setAttribute("aria-pressed", String(isDone));
        doneToggle.setAttribute("aria-label", `${isDone ? "Desmarcar" : "Marcar"} ${chapter.label || "capítulo " + chapter.number} como terminado`);
        doneToggle.title = isDone ? "Marcado como terminado" : "Marcar como terminado";
        doneToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6"/></svg>';
        doneToggle.addEventListener("click", event => {
          event.stopPropagation();
          toggleChapterDone(index);
        });

        wrap.appendChild(button);
        wrap.appendChild(doneToggle);
        elements.chapterList.appendChild(wrap);
      });
    });
  }

  // Tarjetas de las cuatro partes: se construyen una vez y despues solo se
  // actualizan los numeros, asi el foco del teclado no salta mientras suena.
  // Retratos de personajes. Van bloqueados hasta que el oyente llega al capitulo
  // donde el libro NOMBRA por primera vez a ese personaje. Mientras esta
  // bloqueado no se inserta ni el nombre ni la imagen: si estuvieran en el HTML
  // se leerian en el codigo fuente y los cantaria un lector de pantalla, que es
  // justo el spoiler que se quiere evitar.
  function chapterReached(number) {
    const index = data.chapters.findIndex(c => c.number === number);
    if (index < 0) return true;   // si ese capitulo no existe, no se oculta nada
    // al TERMINAR el capitulo, no al empezarlo (Escandar, 16-sep). `completed` se
    // pone solo al pasar el 90% del audio, y tambien a mano con el tilde de la lista.
    return !!state.completed[index];
  }

  function renderCast() {
    const grid = document.getElementById("castGrid");
    if (!grid || !Array.isArray(data.characters)) return;
    const proteger = state.spoilers !== false;
    const visible = x => !proteger || chapterReached(x.unlock);

    const tarjetaPersona = p => visible(p)
      ? `<figure class="cast-card">
          <img src="${p.file}" alt="Retrato de ${escapeHtml(p.name)}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async">
          <figcaption><strong>${escapeHtml(p.name)}</strong>${p.epithet ? `<span>${escapeHtml(p.epithet)}</span>` : ""}</figcaption>
        </figure>`
      : `<figure class="cast-card locked">
          <span class="cast-locked-art" aria-hidden="true">✦</span>
          <figcaption><strong aria-label="Personaje aún no revelado">? ? ?</strong><span>Se revela más adelante</span></figcaption>
        </figure>`;
    // retratos de grupo: una sola imagen ancha, que se abre en grande al tocarla
    const tarjetaGrupo = g => visible(g)
      ? `<figure class="cast-card cast-group">
          <img src="${g.file}" alt="${escapeHtml(g.name)}: ${escapeHtml(g.caption || "")}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async">
          <figcaption><strong>${escapeHtml(g.name)}</strong>${g.caption ? `<span>${escapeHtml(g.caption)}</span>` : ""}</figcaption>
          <button class="cast-lupa" type="button" data-abrir="${g.file}" aria-label="Ver ${escapeHtml(g.name)} en grande">⤢</button>
        </figure>`
      : `<figure class="cast-card cast-group locked">
          <span class="cast-locked-art" aria-hidden="true">✦</span>
          <figcaption><strong aria-label="Grupo aún no revelado">? ? ?</strong><span>Se revela más adelante</span></figcaption>
        </figure>`;

    const grupos = Array.isArray(data.groups) ? data.groups : [];
    const secciones = Array.isArray(data.castSections) ? data.castSections : [];
    const colocadas = new Set();
    let html = "";
    let pendientes = "";   // secciones que aun no ha abierto nadie: van sin nombre

    secciones.forEach(s => {
      const personas = data.characters.filter(p => p.section === s.id);
      const propios = grupos.filter(g => g.section === s.id);
      if (!personas.length && !propios.length) return;
      personas.forEach(p => colocadas.add(p));
      propios.forEach(g => colocadas.add(g));
      const piezas = personas.map(tarjetaPersona).join("") + propios.map(tarjetaGrupo).join("");
      // El encabezado es parte del spoiler: "Dientes de Ceniza" delata al grupo
      // aunque las seis tarjetas esten tapadas. Mientras no se revele ninguna,
      // sus tarjetas caen al bloque anonimo del final.
      if (personas.some(visible) || propios.some(visible)) {
        html += `<h3 class="cast-head">${escapeHtml(s.name)}` +
                (s.realm ? `<span>${escapeHtml(s.realm)}</span>` : "") + `</h3>` + piezas;
      } else {
        pendientes += piezas;
      }
    });

    // lo que no declare seccion (o declare una que no existe) no se pierde
    const sueltas = data.characters.filter(p => !colocadas.has(p)).map(tarjetaPersona).join("") +
                    grupos.filter(g => !colocadas.has(g)).map(tarjetaGrupo).join("");
    if (pendientes || sueltas) {
      html += `<h3 class="cast-head cast-head-mute">Aún por revelar</h3>` + pendientes + sueltas;
    }

    // updateOverallProgress corre en cada avance del audio: repintar solo si algo
    // cambio, para no pelear con la reproduccion en el telefono.
    if (grid.dataset.firma !== html) {
      grid.innerHTML = html;
      grid.dataset.firma = html;
    }
  }

  // Escenas en bucle: mp4 MUDOS con loop, que es un gif pero 17 veces mas ligero
  // (el mismo clip en gif pesaba 30 MB y en mp4 1,8). Mismo bloqueo por capitulo
  // que los retratos.
  function renderScenes() {
    const grid = document.getElementById("sceneGrid");
    const seccion = document.getElementById("escenas");
    if (!grid || !seccion || !Array.isArray(data.scenes) || !data.scenes.length) return;
    const proteger = state.spoilers !== false;
    const visibles = data.scenes.filter(e => !proteger || chapterReached(e.unlock));
    // si no hay ninguna revelada, la seccion entera no existe: el titulo
    // "Escenas" con tarjetas tapadas no aporta nada y ocupa pantalla
    seccion.hidden = !visibles.length;
    const html = visibles.map(e => `<figure class="scene-card">
        <video src="${e.file}" poster="${e.poster}" width="${e.w}" height="${e.h}"
               muted loop playsinline preload="none" disablepictureinpicture></video>
        <figcaption><strong>${escapeHtml(e.name)}</strong>${e.caption ? `<span>${escapeHtml(e.caption)}</span>` : ""}</figcaption>
      </figure>`).join("");
    if (grid.dataset.firma === html) return;
    grid.innerHTML = html;
    grid.dataset.firma = html;
    vigilarEscenas();
    ajustarEscenas();
  }

  // Un bucle dibujando todo el tiempo entrecorta el audio en el telefono: es lo
  // mismo que paso con la nieve. Se para mientras suena y con la pestaña oculta.
  function ajustarEscenas() {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const audio = document.getElementById("audio");
    const sonando = audio && !audio.paused;
    const parar = quieto || document.hidden || sonando;
    document.querySelectorAll(".scene-card video").forEach(v => {
      // Chrome pausa por su cuenta el video mudo que no se ve ("video-only
      // background media was paused to save power"), asi que ni se intenta.
      if (parar || v.dataset.fuera === "1") { v.pause(); return; }
      if (v.preload === "none") v.preload = "auto";
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    });
  }

  // marca cuales estan fuera de pantalla; si no hay IntersectionObserver se
  // asume que todas estan a la vista y decide el navegador
  function vigilarEscenas() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(entradas => {
      entradas.forEach(e => { e.target.dataset.fuera = e.isIntersecting ? "0" : "1"; });
      ajustarEscenas();
    }, { rootMargin: "120px" });
    document.querySelectorAll(".scene-card video").forEach(v => io.observe(v));
  }
  // Abre una imagen a pantalla completa. Se cierra con Esc (lo hace <dialog>),
  // tocando fuera o en el aspa.
  function abrirLupa(src) {
    let dlg = document.getElementById("lupa");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "lupa";
      dlg.innerHTML = '<img alt=""><button type="button" aria-label="Cerrar">×</button>';
      dlg.addEventListener("click", event => {
        if (event.target === dlg || event.target.tagName === "BUTTON") dlg.close();
      });
      document.body.appendChild(dlg);
    }
    const img = dlg.querySelector("img");
    img.src = src;
    img.alt = "";
    dlg.showModal();
  }

  // Interruptor de anti-spoiler. Por defecto protege; quien ya leyo el libro (o
  // no le importa) lo apaga y ve los tres retratos desde el principio.
  function updateSpoilerToggle() {
    const boton = document.getElementById("spoilerToggle");
    const nota = document.getElementById("spoilerNote");
    if (!boton) return;
    const proteger = state.spoilers !== false;
    boton.setAttribute("aria-checked", String(proteger));
    if (nota) {
      nota.textContent = proteger
        ? "Se revelan al terminar el capítulo en que aparecen."
        : "Se ven todos, incluidos los que aún no han aparecido.";
    }
  }

  function toggleSpoilers() {
    state.spoilers = state.spoilers === false;
    saveState();
    updateSpoilerToggle();
    renderCast();
    renderScenes();
  }

  function renderParts() {
    const grid = elements.partGrid;
    if (!grid) return;
    const groups = partGroups().filter(group => group.part);
    if (!grid.children.length) {
      groups.forEach(group => {
        // los interludios no entran en el rango: "Capítulos 27 a 42", no "a 103"
        const nums = group.items.map(i => data.chapters[i]).filter(c => !c.label).map(c => c.number);
        const first = nums[0];
        const last = nums[nums.length - 1];
        const card = document.createElement("button");
        card.type = "button";
        card.className = "part-card";
        card.dataset.part = group.part;
        card.innerHTML = `
          <span class="part-numeral" aria-hidden="true">${escapeHtml(group.part.replace(/^Parte\s+/i, ""))}</span>
          <span class="part-card-label">${escapeHtml(group.part)}</span>
          <strong>Capítulos ${first} a ${last}</strong>
          <span class="part-card-meta" data-meta></span>
          <span class="progress-track"><span data-bar></span></span>
          <span class="part-card-done" data-done></span>`;
        card.addEventListener("click", () => openPart(group.part));
        grid.appendChild(card);
      });
    }
    groups.forEach(group => {
      const card = grid.querySelector(`[data-part="${CSS.escape(group.part)}"]`);
      if (!card) return;
      const seconds = group.items.reduce((sum, i) => sum + getChapterSeconds(i), 0);
      const progress = group.items.reduce((sum, i) => sum + getChapterProgress(i), 0) / group.items.length;
      const done = group.items.filter(i => state.completed[i]).length;
      const inter = group.items.filter(i => data.chapters[i].label).length;
      const caps = group.items.length - inter;
      const cuenta = inter ? `${caps} capítulos y ${inter} interludios` : `${caps} capítulos`;
      card.querySelector("[data-meta]").textContent = `${cuenta} · ${formatLong(seconds)}`;
      card.querySelector("[data-bar]").style.width = `${progress * 100}%`;
      card.querySelector("[data-done]").textContent = done === group.items.length
        ? "Parte terminada"
        : `${done} de ${group.items.length} terminados`;
    });
  }

  function openPart(part) {
    expandedParts.add(part);
    renderChapters();
    elements.chapterList.querySelector(`.part-header[data-part="${CSS.escape(part)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---- reproducción -------------------------------------------------------
  // En la vista previa local los mp3 no estan en esta carpeta: los sirve otro
  // puerto directo desde la salida del pipeline (ver content.js).
  function audioUrl(file) {
    const local = ["localhost", "127.0.0.1"].includes(location.hostname) && data.site.audioBaseUrlLocal;
    const base = local ? data.site.audioBaseUrlLocal : data.site.audioBaseUrl;
    const version = data.site.audioVersion ? `?v=${data.site.audioVersion}` : "";
    return new URL(base + file + version, window.location.href).href;
  }

  function playFrontMatter() {
    const fm = data.site.frontMatter;
    if (!fm) return;
    saveCurrentPosition();
    frontMatterMode = true;
    elements.playerChapter.textContent = fm.kicker || "";
    elements.playerTitle.textContent = fm.title;
    elements.playerNumber.textContent = "✦";
    elements.nowTitle.textContent = fm.title;
    elements.nowPart.textContent = `${data.site.book} · ${data.site.volume}`;
    elements.nowArtLabel.textContent = fm.kicker || "";
    elements.nowNumber.textContent = "✦";
    elements.currentTime.textContent = formatTime(0);
    elements.elapsedSummary.textContent = formatTime(0);
    elements.timeline.value = 0;
    elements.cardProgress.style.width = "0%";
    elements.audio.pause();
    elements.audio.src = audioUrl(fm.file);
    elements.audio.playbackRate = Number(state.speed || 1);
    elements.audio.load();
    pendingAutoplay = true;
    elements.audio.play().catch(() => { pendingAutoplay = true; });
    renderChapters();
  }

  function selectChapter(index, autoplay = false, initial = false) {
    if (index < 0 || index >= data.chapters.length) return;
    if (!initial) saveCurrentPosition();
    frontMatterMode = false;
    selectedIndex = index;
    state.currentIndex = index;
    const chapter = data.chapters[index];

    if (chapter.part) expandedParts.add(chapter.part);
    state.unavailable[index] = false;
    updateChapterLabels();
    renderChapters();
    updateMediaSession();
    saveState();

    const storedTime = Number(state.times[index] || 0);
    const knownDuration = Number(state.durations[index] || chapter.seconds || 0);
    elements.currentTime.textContent = formatTime(storedTime);
    elements.elapsedSummary.textContent = formatTime(storedTime);
    elements.duration.textContent = knownDuration ? formatTime(knownDuration) : "--:--";
    elements.durationSummary.textContent = knownDuration ? formatTime(knownDuration) : "--:--";
    elements.timeline.value = getChapterProgress(index) * 100;
    elements.cardProgress.style.width = `${getChapterProgress(index) * 100}%`;

    if (initial) return;

    elements.audio.pause();
    elements.audio.src = audioUrl(chapter.file.split("/").pop());
    elements.audio.playbackRate = Number(state.speed || 1);
    elements.audio.load();
    pendingAutoplay = autoplay;

    if (autoplay) {
      elements.audio.play().catch(() => {
        pendingAutoplay = true;
      });
    }
  }

  function updateChapterLabels() {
    const chapter = data.chapters[selectedIndex];
    // los interludios traen label/badge propios: nunca dicen "Capítulo 101"
    const numero = chapter.badge || String(chapter.number).padStart(2, "0");
    const rotulo = chapter.label || `Capítulo ${chapter.number}`;
    elements.playerChapter.textContent = rotulo;
    elements.playerTitle.textContent = chapter.title;
    elements.playerNumber.textContent = numero;
    elements.nowTitle.textContent = chapter.title;
    elements.nowPart.textContent = chapter.part || data.site.volume;
    elements.nowArtLabel.textContent = chapter.label ? "Interludio" : "Capítulo";
    elements.nowNumber.textContent = numero;
    const stored = Number(state.times[selectedIndex] || 0);
    const minuscula = rotulo.charAt(0).toLowerCase() + rotulo.slice(1);
    elements.resumeButton.textContent = `${stored > 5 ? "▶ Continuar" : "▶ Escuchar"} ${minuscula}`;
  }

  function togglePlay() {
    if (!elements.audio.src) selectChapter(selectedIndex, false);
    if (elements.audio.paused) {
      elements.audio.play().catch(() => showToast("No se pudo iniciar el audio. Revisa tu conexión e intenta de nuevo."));
    } else {
      elements.audio.pause();
    }
  }

  function updatePlayState() {
    const playing = !elements.audio.paused;
    elements.playButton.innerHTML = playing ? ICONS.pause : ICONS.play;
    elements.playButton.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    renderChapters();
  }

  function onLoadedMetadata() {
    const duration = elements.audio.duration;
    if (!Number.isFinite(duration)) return;
    elements.duration.textContent = formatTime(duration);
    elements.durationSummary.textContent = formatTime(duration);
    if (frontMatterMode) return;
    state.durations[selectedIndex] = duration;
    const storedTime = Math.min(Number(state.times[selectedIndex] || 0), Math.max(0, duration - 1));
    if (storedTime > 0) elements.audio.currentTime = storedTime;
    state.unavailable[selectedIndex] = false;
    saveState();
    updateOverallProgress();
    renderChapters();
  }

  function onTimeUpdate() {
    if (!Number.isFinite(elements.audio.duration)) return;
    const current = elements.audio.currentTime;
    const duration = elements.audio.duration;
    const progress = duration ? current / duration : 0;
    elements.currentTime.textContent = formatTime(current);
    elements.elapsedSummary.textContent = formatTime(current);
    elements.timeline.value = progress * 100;
    elements.cardProgress.style.width = `${progress * 100}%`;
    if (frontMatterMode) return;
    state.times[selectedIndex] = current;
    state.durations[selectedIndex] = duration;
    if (progress >= 0.9) state.completed[selectedIndex] = true;

    const wholeSecond = Math.floor(current);
    if (wholeSecond !== lastSavedSecond && wholeSecond % 2 === 0) {
      lastSavedSecond = wholeSecond;
      saveState();
      updateOverallProgress();
    }
    if (wholeSecond % 5 === 0) updateChapterProgressInPlace();
  }

  function updateChapterProgressInPlace() {
    elements.chapterList.querySelectorAll("[data-index]").forEach(button => {
      const index = Number(button.dataset.index);
      const progress = getChapterProgress(index);
      const percent = button.querySelector(".chapter-state strong");
      const bar = button.querySelector(".mini-progress span");
      if (percent) percent.textContent = `${Math.round(progress * 100)}%`;
      if (bar) bar.style.width = `${progress * 100}%`;
    });
  }

  function toggleChapterDone(index) {
    state.completed[index] = !state.completed[index];
    saveState();
    updateOverallProgress();
    renderChapters();
  }

  function onEnded() {
    if (frontMatterMode) {
      // la presentación encadena al capitulo 1
      frontMatterMode = false;
      selectChapter(0, true);
      return;
    }
    state.completed[selectedIndex] = true;
    state.times[selectedIndex] = state.durations[selectedIndex] || elements.audio.duration || 0;
    saveState();
    updateOverallProgress();
    if (selectedIndex < data.chapters.length - 1) selectChapter(selectedIndex + 1, true);
  }

  function onAudioError() {
    // si el audio ya habia cargado metadata (readyState>0), fue una falla de red
    // transitoria a mitad de reproduccion, no un archivo inexistente: no se marca
    // "no encontrado" para siempre por eso (bug real del Libro I en iPhone)
    const hadLoaded = elements.audio.readyState > 0;
    pendingAutoplay = false;
    if (frontMatterMode) {
      if (!hadLoaded) showToast("No se pudo cargar la presentación. Revisa tu conexión.");
      updatePlayState();
      return;
    }
    if (!hadLoaded) {
      state.unavailable[selectedIndex] = true;
      const chapter = data.chapters[selectedIndex];
      showToast(`No se pudo cargar «${chapter.title}». Revisa tu conexión e intenta de nuevo.`);
    }
    saveState();
    updatePlayState();
  }

  function seekBy(seconds) {
    if (!Number.isFinite(elements.audio.duration)) return;
    elements.audio.currentTime = clamp(elements.audio.currentTime + seconds, 0, elements.audio.duration);
  }

  function saveCurrentPosition() {
    if (frontMatterMode) return;
    if (!elements.audio.src || !Number.isFinite(elements.audio.currentTime)) return;
    state.times[selectedIndex] = elements.audio.currentTime;
    if (Number.isFinite(elements.audio.duration)) state.durations[selectedIndex] = elements.audio.duration;
    saveState();
  }

  function getChapterProgress(index) {
    if (state.completed[index]) return 1;
    const duration = getChapterSeconds(index);
    const time = Number(state.times[index] || 0);
    return duration > 0 ? clamp(time / duration, 0, 1) : 0;
  }

  function updateOverallProgress() {
    const total = data.chapters.reduce((sum, _, index) => sum + getChapterProgress(index), 0) / data.chapters.length;
    const percent = Math.round(total * 100);
    elements.overallProgress.style.width = `${percent}%`;
    elements.overallPercent.textContent = `${percent}%`;
    updateBookTime();
    renderParts();
    renderCast();
    renderScenes();
  }

  // Duracion de un capitulo: la medida por el navegador si ya cargo ese audio;
  // si no, la horneada en content.js, unica forma de saber cuanto dura el libro
  // entero sin bajar los 41 mp3.
  function getChapterSeconds(index) {
    const medida = Number(state.durations[index] || 0);
    if (medida > 0) return medida;
    return Number(data.chapters[index]?.seconds || 0);
  }

  function getBookSeconds() {
    let total = 0;
    let restante = 0;
    data.chapters.forEach((_, index) => {
      const dur = getChapterSeconds(index);
      total += dur;
      if (state.completed[index]) return;
      const oido = Math.min(Number(state.times[index] || 0), dur);
      restante += Math.max(0, dur - oido);
    });
    return { total, restante };
  }

  function updateBookTime() {
    const { total, restante } = getBookSeconds();
    elements.bookTotal.textContent = total > 0 ? `de ${formatLong(total)}` : "de --";
    elements.bookRemaining.textContent = total > 0 ? formatLong(restante) : "--";
    if (elements.bookHours && total > 0) elements.bookHours.textContent = formatLong(total);

    // a velocidad distinta de 1x el tiempo real que falta cambia, y es justo el
    // dato por el que uno toca la velocidad
    const velocidad = Number(state.speed || 1);
    const nota = elements.bookSpeedNote;
    if (velocidad !== 1 && restante > 0) {
      nota.textContent = `A ${velocidad}× son ${formatLong(restante / velocidad)}.`;
      nota.hidden = false;
    } else {
      nota.hidden = true;
    }
  }

  // "20 h 35 min" / "42 min": para totales largos formatTime da "20:35:12", que
  // se lee como un timestamp y no como una duracion
  function formatLong(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0 min";
    const totalMin = Math.round(seconds / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }

  async function saveCurrentAudioOffline() {
    if (!("caches" in window) || !elements.audio.src) {
      showToast("El guardado sin conexión no está disponible en este navegador.");
      return;
    }
    elements.offlineButton.disabled = true;
    elements.offlineButton.textContent = "Guardando…";
    try {
      const response = await fetch(elements.audio.src, { mode: "cors" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const cache = await caches.open(AUDIO_CACHE);
      await cache.put(elements.audio.src, response.clone());
      elements.offlineButton.textContent = "Capítulo guardado ✓";
      elements.offlineNote.textContent = "Este capítulo podrá reproducirse sin conexión desde este dispositivo.";
      showToast("Capítulo guardado sin conexión.");
    } catch (error) {
      elements.offlineButton.textContent = "Guardar capítulo sin conexión";
      showToast("No se pudo guardar el capítulo. Intenta de nuevo con conexión estable.");
    } finally {
      elements.offlineButton.disabled = false;
    }
  }

  function openMenu() { elements.mobileMenu.classList.add("open"); elements.mobileMenu.setAttribute("aria-hidden", "false"); }
  function closeMenu() { elements.mobileMenu.classList.remove("open"); elements.mobileMenu.setAttribute("aria-hidden", "true"); }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const chapter = data.chapters[selectedIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: chapter.title,
      artist: data.site.author,
      album: `${data.site.book} · ${data.site.volume}`,
      artwork: [
        // la portada, para la pantalla de bloqueo del telefono. El png va de
        // respaldo: no todos los navegadores aceptan webp en el artwork.
        { src: new URL("assets/portada/caratula-512.webp", window.location.href).href, sizes: "512x512", type: "image/webp" },
        { src: new URL("assets/portada/caratula-512.png", window.location.href).href, sizes: "512x512", type: "image/png" }
      ]
    });
    const actions = {
      play: () => elements.audio.play(), pause: () => elements.audio.pause(),
      seekbackward: details => seekBy(-(details.seekOffset || 10)),
      seekforward: details => seekBy(details.seekOffset || 10),
      previoustrack: () => selectChapter(selectedIndex - 1, true),
      nexttrack: () => selectChapter(selectedIndex + 1, true)
    };
    Object.entries(actions).forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    });
  }

  // El service worker guarda la pagina para que funcione sin conexion, pero eso
  // hacia que en el telefono se siguiera viendo la version vieja hasta cerrar la
  // pestaña a mano. Ahora, cuando hay una version nueva, la pagina se recarga
  // sola: una vez, y solo si ya habia un worker mandando (si no, la primera
  // visita se recargaria sin motivo, porque activate hace clients.claim).
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
    const habiaControlador = !!navigator.serviceWorker.controller;
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!habiaControlador || recargando) return;
      recargando = true;
      location.reload();
    });
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(reg => {
        reg.update().catch(() => {});
        // al volver a la app desde segundo plano: es justo cuando el movil se
        // quedaba con lo viejo
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) reg.update().catch(() => {});
        });
      }).catch(() => {});
    });
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 3800);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function safeParse(value) {
    try { return value ? JSON.parse(value) : null; } catch (_) { return null; }
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
})();
