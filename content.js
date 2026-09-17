// Libro II. Generado por scratchpad\hacer_content.py sobre la produccion V6
// (out_v2, 15-sep-2026). Las duraciones estan medidas de cada mp3, no estimadas.
// Los interludios llevan label/badge: en la lista no dicen "Capitulo 101".
window.BOOK_DATA = {
  site: {
    saga: "El ciclo inmóvil",
    book: "Donde termina la luz",
    volume: "Libro II",
    author: "Escandar Giadach",
    audioBaseUrl: "audio/",
    audioVersion: 2,
    frontMatter: { title: "Presentación", kicker: "Antes de empezar", file: "00-donde-termina-la-luz.mp3", seconds: 7 }
  },
  // Retratos. "unlock" es el capitulo en el que el libro NOMBRA por primera vez
  // a ese personaje (verificado sobre el manuscrito V6): hasta llegar ahi la
  // tarjeta va bloqueada y ni el nombre ni la imagen entran en el HTML.
  // Las secciones agrupan las tarjetas por la faccion del canon. Una seccion
  // cuyos personajes siguen TODOS bloqueados no se pinta con su nombre: el
  // encabezado ("Dientes de Ceniza") ya seria el spoiler que se quiere evitar.
  castSections: [
    { id: "principales", name: "Personajes principales" },
    { id: "cam17", name: "CAM-17" },
    { id: "gelidos", name: "Gélidos" },
    { id: "aurelian", name: "Aurelian", realm: "Fulgur" },
    { id: "fulgur", name: "Fulgur" },
    { id: "assum", name: "Assum" },
    { id: "eternum", name: "Los Soryn", realm: "Eternum" },
    { id: "rhazir", name: "Rhazir" }
  ],
  // Retratos de grupo: una sola imagen ancha que se abre en grande, con los
  // nombres al pie. Mismo bloqueo por capitulo que los retratos sueltos.
  groups: [
    { id: "dientes", name: "Dientes de Ceniza", file: "assets/personajes/dientes-de-ceniza.webp", w: 2400, h: 1200, unlock: 30, section: "assum",
      caption: "Hal'Verkan · Dra'Vik · Rask · Bryn'Veth · Tor'Vaer · Yorn'Taz" }
  ],
  characters: [
    { id: "gael", name: "Gael Altaren", file: "assets/personajes/gael-altaren.webp", w: 900, h: 1350, unlock: 1, section: "cam17" },
    { id: "ian", name: "Ian de Vries", file: "assets/personajes/ian-de-vries.webp", w: 900, h: 1350, unlock: 1, section: "principales" },
    { id: "elian", name: "Elian Nahl", file: "assets/personajes/elian-nahl.webp", w: 900, h: 1350, unlock: 1, section: "principales" },
    { id: "kier", name: "Kier de Vries", file: "assets/personajes/kier-de-vries.webp", w: 900, h: 1351, unlock: 1, section: "principales" },
    { id: "lina", name: "Lina Aurelian", file: "assets/personajes/lina-aurelian.webp", w: 900, h: 1348, unlock: 1, section: "principales" },
    { id: "daren", name: "Daren de Vries", file: "assets/personajes/daren-de-vries.webp", w: 900, h: 1350, unlock: 1, section: "principales" },
    { id: "elias", name: "Elías Sevrin", file: "assets/personajes/elias-sevrin.webp", w: 900, h: 1350, unlock: 2, section: "principales" },
    { id: "ansel", name: "Ansel Nahl", file: "assets/personajes/ansel-nahl.webp", w: 900, h: 1350, unlock: 2, section: "gelidos" },
    { id: "sava", name: "Sava", file: "assets/personajes/sava.webp", w: 900, h: 1350, unlock: 2, section: "gelidos" },
    { id: "jun", name: "Jun Arven", file: "assets/personajes/jun-arven.webp", w: 900, h: 1350, unlock: 4, section: "cam17" },
    { id: "tomas", name: "Tomas Eiden", file: "assets/personajes/tomas-eiden.webp", w: 900, h: 1350, unlock: 4, section: "cam17" },
    { id: "vera", name: "Vera Helion", file: "assets/personajes/vera-helion.webp", w: 900, h: 1350, unlock: 4, section: "cam17" },
    { id: "nila", name: "Nila Sorn", file: "assets/personajes/nila-sorn.webp", w: 900, h: 1350, unlock: 4, section: "cam17" },
    { id: "iris", name: "Iris Veyra", file: "assets/personajes/iris-veyra.webp", w: 900, h: 1350, unlock: 4, section: "cam17" },
    { id: "scar", name: "Scar", file: "assets/personajes/scar.webp", w: 900, h: 1350, unlock: 16, section: "principales" },
    { id: "arlette", name: "Arlette Voss", file: "assets/personajes/arlette-voss.webp", w: 900, h: 1350, unlock: 26, section: "cam17" },
    { id: "maelis", name: "Maelis Varen", file: "assets/personajes/maelis-varen.webp", w: 900, h: 1350, unlock: 36, section: "cam17" },
    { id: "lucan", name: "Lucan Aurelian", file: "assets/personajes/lucan-aurelian.webp", w: 900, h: 1350, unlock: 1, section: "aurelian" },
    { id: "adrian", name: "Adrian Aurelian", file: "assets/personajes/adrian-aurelian.webp", w: 900, h: 1350, unlock: 4, section: "aurelian" },
    { id: "rivan", name: "Rivan Aurelian", file: "assets/personajes/rivan-aurelian.webp", w: 900, h: 1350, unlock: 14, section: "aurelian" },
    { id: "tavian", name: "Tavian Aurelian", file: "assets/personajes/tavian-aurelian.webp", w: 900, h: 1350, unlock: 14, section: "aurelian" },
    { id: "zaira", name: "Zaira", file: "assets/personajes/zaira.webp", w: 900, h: 1349, unlock: 20, section: "fulgur" },
    { id: "nara", name: "Nara", file: "assets/personajes/nara.webp", w: 900, h: 1350, unlock: 24, section: "aurelian" },
    { id: "calev", name: "Calev", file: "assets/personajes/calev.webp", w: 900, h: 1350, unlock: 24, section: "aurelian" },
    { id: "aldren", name: "Aldren Soryn", epithet: "El Heredero de la Luna Bélica", file: "assets/personajes/aldren-soryn.webp", w: 900, h: 1350, unlock: 23, section: "eternum" },
    { id: "yseva", name: "Yseva Soryn", epithet: "La Astrónoma de la Guerra", file: "assets/personajes/yseva-soryn.webp", w: 900, h: 1350, unlock: 31, section: "eternum" },
    { id: "hastir", name: "Hastir Soryn", epithet: "La Garra Carmesí", file: "assets/personajes/hastir-soryn.webp", w: 900, h: 1350, unlock: 31, section: "eternum" },
    { id: "yvara", name: "Yvara", file: "assets/personajes/yvara.webp", w: 900, h: 1350, unlock: 12, section: "assum" },
    { id: "kaedrahn", name: "Kaedrahn", file: "assets/personajes/kaedrahn.webp", w: 900, h: 1350, unlock: 12, section: "assum" },
    { id: "rask", name: "Rask", file: "assets/personajes/rask.webp", w: 900, h: 1350, unlock: 25, section: "assum" },
    { id: "hal", name: "Hal'Verkan", file: "assets/personajes/hal-verkan.webp", w: 900, h: 1350, unlock: 30, section: "assum" },
    { id: "dravik", name: "Dra'Vik", file: "assets/personajes/dravik.webp", w: 900, h: 1350, unlock: 30, section: "assum" },
    { id: "bryn", name: "Bryn'Veth", file: "assets/personajes/bryn-veth.webp", w: 900, h: 1350, unlock: 30, section: "assum" },
    { id: "tor", name: "Tor'Vaer", file: "assets/personajes/tor-vaer.webp", w: 900, h: 1350, unlock: 30, section: "assum" },
    { id: "yorn", name: "Yorn'Taz", file: "assets/personajes/yorn-taz.webp", w: 900, h: 1350, unlock: 30, section: "assum" }
  ],
  chapters: [
    { number: 1, title: "El héroe de CAM-17", part: "Parte I", file: "01-el-heroe-de-cam-17.mp3", seconds: 2121 },
    { number: 2, title: "Memoria de hielo", part: "Parte I", file: "02-memoria-de-hielo.mp3", seconds: 1350 },
    { number: 3, title: "Una cosa a la vez", part: "Parte I", file: "03-una-cosa-a-la-vez.mp3", seconds: 1825 },
    { number: 4, title: "Bajo custodia", part: "Parte I", file: "04-bajo-custodia.mp3", seconds: 2561 },
    { number: 5, title: "Rutas de salida", part: "Parte I", file: "05-rutas-de-salida.mp3", seconds: 2284 },
    { number: 6, title: "Antes que termine el día", part: "Parte I", file: "06-antes-que-termine-el-dia.mp3", seconds: 2630 },
    { number: 7, title: "El rescate", part: "Parte I", file: "07-el-rescate.mp3", seconds: 2508 },
    { number: 8, title: "Demasiado fuerte", part: "Parte I", file: "08-demasiado-fuerte.mp3", seconds: 1282 },
    { number: 9, title: "Del otro lado del Muro", part: "Parte II", file: "09-del-otro-lado-del-muro.mp3", seconds: 3503 },
    { number: 10, title: "El laboratorio", part: "Parte II", file: "10-el-laboratorio.mp3", seconds: 3030 },
    { number: 11, title: "Bayas de escarcha", part: "Parte II", file: "11-bayas-de-escarcha.mp3", seconds: 2781 },
    { number: 12, title: "Casi como en casa", part: "Parte II", file: "12-casi-como-en-casa.mp3", seconds: 1430 },
    { number: 13, title: "Derrotas", part: "Parte II", file: "13-derrotas.mp3", seconds: 1789 },
    { number: 14, title: "El Rojo", part: "Parte II", file: "14-el-rojo.mp3", seconds: 2304 },
    { number: 15, title: "Donde termina el mapa", part: "Parte II", file: "15-donde-termina-el-mapa.mp3", seconds: 1811 },
    { number: 16, title: "Hielo Rojo", part: "Parte II", file: "16-hielo-rojo.mp3", seconds: 1466 },
    { number: 17, title: "El apellido", part: "Parte III", file: "17-el-apellido.mp3", seconds: 1326 },
    { number: 18, title: "Bienvenida a la familia", part: "Parte III", file: "18-bienvenida-a-la-familia.mp3", seconds: 434 },
    { number: 19, title: "Contingencias", part: "Parte III", file: "19-contingencias.mp3", seconds: 1343 },
    { number: 20, title: "Trayectorias", part: "Parte III", file: "20-trayectorias.mp3", seconds: 1737 },
    { number: 21, title: "Lo que aprendieron", part: "Parte III", file: "21-lo-que-aprendieron.mp3", seconds: 1741 },
    { number: 22, title: "Reencuentro", part: "Parte III", file: "22-reencuentro.mp3", seconds: 899 },
    { number: 23, title: "Una fecha inventada", part: "Parte III", file: "23-una-fecha-inventada.mp3", seconds: 1739 },
    { number: 24, title: "Donde no anochece", part: "Parte III", file: "24-donde-no-anochece.mp3", seconds: 1870 },
    { number: 25, title: "Dientes de Ceniza", part: "Parte III", file: "25-dientes-de-ceniza.mp3", seconds: 2050 },
    { number: 26, title: "Debajo", part: "Parte III", file: "26-debajo.mp3", seconds: 1247 },
    { number: 27, title: "Bajo el sol eterno", part: "Parte IV", file: "27-bajo-el-sol-eterno.mp3", seconds: 1042 },
    { number: 28, title: "Hasta aquí", part: "Parte IV", file: "28-hasta-aqui.mp3", seconds: 1305 },
    { number: 29, title: "Cuarenta y siete", part: "Parte IV", file: "29-cuarenta-y-siete.mp3", seconds: 1257 },
    { number: 101, label: "Interludio I", badge: "I", title: "La ración", part: "Parte IV", file: "29b-interludio-i-la-racion.mp3", seconds: 142 },
    { number: 30, title: "Lo mejor de lo mejor", part: "Parte IV", file: "30-lo-mejor-de-lo-mejor.mp3", seconds: 1427 },
    { number: 31, title: "Los hermanos", part: "Parte IV", file: "31-los-hermanos.mp3", seconds: 1041 },
    { number: 32, title: "Daños colaterales", part: "Parte IV", file: "32-danos-colaterales.mp3", seconds: 1453 },
    { number: 33, title: "Nadie tiene que saberlo", part: "Parte IV", file: "33-nadie-tiene-que-saberlo.mp3", seconds: 2013 },
    { number: 34, title: "El Ángel", part: "Parte IV", file: "34-el-angel.mp3", seconds: 1397 },
    { number: 102, label: "Interludio II", badge: "II", title: "La entrada", part: "Parte IV", file: "34b-interludio-ii-la-entrada.mp3", seconds: 110 },
    { number: 35, title: "Huellas", part: "Parte IV", file: "35-huellas.mp3", seconds: 922 },
    { number: 36, title: "Las dos madres", part: "Parte IV", file: "36-las-dos-madres.mp3", seconds: 1946 },
    { number: 37, title: "Guerras de humanos", part: "Parte IV", file: "37-guerras-de-humanos.mp3", seconds: 1265 },
    { number: 38, title: "Por la espalda", part: "Parte IV", file: "38-por-la-espalda.mp3", seconds: 1835 },
    { number: 39, title: "¿Cuáles?", part: "Parte IV", file: "39-cuales.mp3", seconds: 2232 },
    { number: 103, label: "Interludio III", badge: "III", title: "Los nombres", part: "Parte IV", file: "39b-interludio-iii-los-nombres.mp3", seconds: 124 },
    { number: 40, title: "Demasiado importante", part: "Parte IV", file: "40-demasiado-importante.mp3", seconds: 2869 },
    { number: 41, title: "Sin retorno", part: "Parte IV", file: "41-sin-retorno.mp3", seconds: 1905 },
    { number: 42, title: "Shuren", part: "Parte IV", file: "42-shuren.mp3", seconds: 1734 }
  ]
};
