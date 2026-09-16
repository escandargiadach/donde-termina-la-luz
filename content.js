// PRUEBA de GitHub Pages: solo la intro y el capítulo 1, para comprobar que
// GitHub sirve el mp3 con streaming (reproducir y adelantar) desde el celular.
// El audio va en audio\ dentro del propio repo, no en Netlify.
window.BOOK_DATA = {
  site: {
    saga: "El ciclo inmóvil",
    book: "Donde termina la luz",
    volume: "Libro II",
    author: "Escandar Giadach",
    audioBaseUrl: "audio/",
    audioVersion: 1,
    frontMatter: { title: "Presentación", kicker: "Antes de empezar", file: "00-donde-termina-la-luz.mp3", seconds: 7 }
  },
  chapters: [
    { number: 1, title: "El héroe de CAM-17", part: "Parte I", file: "01-el-heroe-de-cam-17.mp3", seconds: 2149 }
  ]
};
