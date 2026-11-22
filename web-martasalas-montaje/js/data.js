/* Contenido de la web. Para añadir un trabajo, añade una línea en la categoría que toque.
   Formato: [año, "Título", "Detalle (dirección, producción, cadena, premios)", destacado?] */

window.SITE = {
  featured: [
    { title: "Machos Alfa", wide: true, kind: "Serie · Temporadas 1–6", years: "2022–2026", info: "Netflix · Contubernio Films", tag: "Netflix" },
    { title: "Un plan perfecto", kind: "Largometraje y serie", years: "2025–2026", info: "Dir. María Pulido · Dynamo para Sony y Amazon", tag: "Próximamente en cines", poster: "assets/un-plan-perfecto.jpg" },
    { title: "AVA", kind: "Documental", years: "2022", info: "Dir. Mabel Lozano · Mafalda", tag: "Goya 2024 · Mejor cortometraje documental" },
    { title: "El lodo", kind: "Largometraje", years: "2021", info: "Dir. Iñaki Sánchez Arrieta · Sunrise Picture, Vértice 360", tag: "Nominada a mejor montaje · Premis Berlanga" },
    { title: "El juego de las llaves", kind: "Largometraje", years: "2021", info: "Dir. Vicente Villanueva · Nadie es Perfecto, Warner, Atresmedia" },
    { title: "El año de la furia", kind: "Largometraje", years: "2019–2020", info: "Dir. Rafa Russo · Gona, Aliwood Mediterráneo" },
    { title: "Parot", kind: "Serie", years: "2020", info: "Onza Partners para TVE y Amazon" },
    { title: "Zoomers", kind: "Serie · Asesora de montaje y montaje", years: "2024", info: "Dynamo para Amazon" },
    { title: "Una tarda amb…", kind: "Serie documental · Montaje y guion", years: "2025", info: "Con Candela Peña · Catorce para 2Cat (RTVE)" },
    { title: "El Ministerio del Tiempo", kind: "Serie", years: "2017", info: "Onza Partners para TVE" }
  ],

  awards: [
    { year: "2024", text: "Goya al mejor cortometraje documental", work: "AVA" },
    { year: "2021", text: "Nominada al mejor montaje · Premis Berlanga", work: "El lodo" },
    { year: "2003", text: "Premio al mejor montaje · Festival Internacional de Nuevos Realizadores de Granada", work: "Uno más, uno menos" },
    { year: "2003", text: "Premio al mejor montaje · Festival de Cortometrajes de Madrid", work: "Uno más, uno menos" },
    { year: "2001", text: "Premio al mejor montaje · Alcalá de Henares · Corto nominado a los Goya", work: "Uno más, uno menos" }
  ],

  reels: {
    tv: [
      { id: "llKcfHfTL_Y" }, { id: "4Apr_Ce4eag" }, { id: "xfmQ9MgFRps" }, { id: "gY7g2xY3UPg" }, { id: "k2oJLX4u8Pc" }
    ],
    cine: [
      { id: "3tBYR2JTeHk" }, { id: "seCTe9WUS8Y" }, { id: "n4NT0TJzEkg" }
    ]
  },

  credits: [
    { cat: "Largometrajes y TV movies", items: [
      [2026, "Un plan perfecto", "Dir. María Pulido. Dynamo para Sony"],
      [2021, "El juego de las llaves", "Dir. Vicente Villanueva. Nadie es Perfecto, Warner y Atresmedia"],
      [2021, "El lodo", "Dir. Iñaki Sánchez Arrieta. Sunrise Picture y Vértice 360. Nominada al mejor montaje en los Premis Berlanga 2021"],
      ["2019–2020", "El año de la furia", "Dir. Rafa Russo. Gona y Aliwood Mediterráneo Producciones"],
      [2011, "Rocío Dúrcal, volver a verte", "TV movie. Dir. Carles Vila. Tri-neofilms y New Atlantis para Mediaset"],
      [2010, "El Gordo, una historia verdadera", "TV movie, capítulo I. Zebra para Antena 3 Films"],
      [2002, "Entre cien fuegos", "TV movie. Pausoka para Telemadrid"]
    ]},
    { cat: "Series de ficción", items: [
      [2026, "Machos Alfa · T6", "Netflix y Contubernio Films"],
      [2025, "Un plan perfecto", "Serie. Dynamo para Amazon"],
      [2025, "Machos Alfa · T4 y T5", "Netflix y Contubernio Films"],
      [2024, "Zoomers", "Asesora de montaje y montaje. Dynamo para Amazon"],
      [2024, "Machos Alfa · T3", "Netflix y Contubernio Films"],
      [2023, "Machos Alfa · T2", "Netflix y Contubernio Films"],
      ["2022–2023", "Lucas & me", "Dir. Guillermo García Carsí. Serie infantil de Muppets en inglés. Lingo Kids"],
      [2022, "Machos Alfa · T1", "Netflix y Contubernio Films"],
      [2020, "Parot", "Onza Partners para TVE y Amazon"],
      [2019, "La otra mirada · T2", "Boomerang TV para TVE"],
      ["2018–2019", "Brigada Costa del Sol", "Warner Bros y Netflix para Mediaset"],
      [2018, "La víctima número 8", "Globomedia-Mediapro para Telemadrid y ETB"],
      ["2017–2018", "Vivir sin permiso", "Alea Media para Mediaset"],
      [2017, "El Ministerio del Tiempo", "Onza Partners para TVE"],
      ["2015–2017", "Seis hermanas", "Serie diaria. Bambú Producciones para TVE"],
      [2014, "Violeta · T3", "Exteriores rodados en España. TV Group (Argentina) para Disney Channel"],
      [2012, "Gran Reserva", "Bambú para TVE"],
      [2011, "Gran Hotel", "Bambú para Antena 3 y TVE"],
      ["2010–2011", "Tierra de lobos", "Multipark Ficción para Telecinco"],
      ["2008–2009", "La chica de ayer", "Montaje y coordinación de postproducción. Adaptación de «Life on Mars». Ida y Vuelta para Antena 3"],
      ["2004–2008", "El comisario", "Montaje y postproducción en Avid Symphony. BocaBoca para Telecinco"],
      [2004, "Capital", "Montaje y postproducción. Zeppelin para Telemadrid"],
      ["2003–2004", "Los Serrano", "Montaje y postproducción en Avid Symphony. Globomedia para Telecinco"],
      ["2001–2003", "Un paso adelante · T1 y T2", "Globomedia para Antena 3"]
    ]},
    { cat: "Documental y reportaje", items: [
      [2025, "Una tarda amb… (Candela Peña)", "Montaje y guion. Serie de 8 capítulos. Catorce para 2Cat (RTVE)"],
      [2022, "AVA", "Dir. Mabel Lozano. Mafalda. Goya 2024 al mejor cortometraje documental"],
      [2014, "El rey del pincho", "Montaje y realización de 8 capítulos. AMC Networks International Iberia para Canal Cocina"],
      ["2013–2014", "Cocinados", "Montaje en Avid de 5 capítulos. Shine Iberia para La 1 de TVE"],
      [2010, "Luz de mar", "Dir. Raúl Serrano y Luis Vázquez. Telecinco Cinema"],
      [2010, "Cruce de caminos", "Programa documental de 13 capítulos. TVE"],
      [2008, "942 Dakar, historia de una familia", "Ojocítrico Producciones"],
      [2005, "Mar de fang (Mar de barro)", "Documental sobre el mural cerámico de Miquel Barceló en la capilla de San Pedro de la Catedral de Mallorca. Dir. Agustí Torres y Luis Ortas. TVE"],
      [2004, "Los abajo firmantes · Making of", "Largometraje de Joaquín Oristrell"],
      [2003, "Interculturalidad en las escuelas", "Dir. Pablo Montero. Common Films para el Ayuntamiento de Madrid"],
      [1994, "Documental OIT España", ""]
    ]},
    { cat: "Cortometrajes", items: [
      [2012, "Maldito lunes", "Dir. Eva Lesmes. Javier Gancedo, Central de Guiones"],
      [2010, "Lupe", "Dir. Raúl Jiménez"],
      [2010, "Pan Complex", "Dir. David Tejedor. 16 mm, en inglés"],
      [2010, "Spot", "Dir. Guillermo Zapata. Pepe Jordana, Prosopopeya"],
      [2010, "Paganini (2015)", "Dir. Carlos Polo. Pepe Jordana, Prosopopeya"],
      [2009, "Nubes", "Dir. Fran Boira"],
      [2009, "Chocolate frío", "Dir. Pedro Loro"],
      [2008, "Paper or Plastic", "Dir. Martín Rosete. 16 mm, en inglés. Anitra Thomas, Nueva York"],
      [2008, "9", "Dir. Candela Peña"],
      [2006, "El espacio de las apariencias", "Dir. Hnos. Rico. 35 mm. Réplica para Nescafé. Premiado en diversos festivales"],
      [2006, "Juego", "Dir. Ione Hernández. Alicia Produce"],
      [2005, "Ricardo, piezas descatalogadas", "Dir. Hnos. Rico. 35 mm. Premiado en diversos festivales"],
      [2004, "El soñador", "Dir. Oskar Santos. 35 mm. Producido por Carmen Rico. Premiado en diversos festivales"],
      [2003, "La posada de las almas", "Dir. Jhazmina"],
      [2003, "Las aventuras peligrosas", "Dir. Iñaki Ibasete"],
      [2002, "Alianza mortal", "Dir. Hnos. Rico. 35 mm"],
      [2001, "Uno más, uno menos", "Comontaje. Dir. Antonio Naharro y Álvaro Pastor. Nominado a los Goya. Premio al mejor montaje en Alcalá de Henares, en el Festival Internacional de Nuevos Realizadores de Granada 2003 y en el Festival de Cortometrajes de Madrid 2003"],
      [2001, "Nuestro pequeño secreto", "Dir. Ana Martínez-Almeida. 35 mm"],
      [2001, "Que te folle un pez", "Dir. Luis Ortas. Premio del público en el Festival de Cine de Palma de Mallorca"],
      [2001, "La luz", "Dir. Carolina del Prado"],
      [2001, "El hambre", "Dir. Pedro Riutort"],
      [2001, "El diario de la abuela", "Dir. Javier Ocaña. 35 mm"],
      [2000, "Happy Halloween", "Dir. Pablo Guerrero"],
      [2000, "Velocidad", "Dir. Fernando González. 35 mm. Nominado al mejor montaje en el Festival de Cine de Laguardia. Premiado en diversos festivales"],
      [1999, "Hongos", "Dir. Ramón Salazar. Producido por Koldo Zuazua. Nominado al mejor montaje en el Festival de Cine de Laguardia"],
      [1999, "Pelota, pan y móvil", "Dir. Pablo Guerrero"],
      [1999, "Dúplex", "Dir. Fernando González"],
      [1999, "Agua mansa", "Dir. Pablo Fernández"],
      [1998, "Cría zapatillas", "Dir. Isabel de Ocampo. 35 mm"],
      [1996, "Alter ego", "Dir. Antonio Matesanz"],
      [1992, "Al otro lado", "Dir. Antonio Matesanz"]
    ]},
    { cat: "Musical", items: [
      [2021, "BSO", "Programa musical de Emilio Aragón. Caribe Estudios para Movistar"],
      [2007, "Al natural · Farruco", "Montaje y postproducción del espectáculo"],
      [2007, "Fury · Nuevo Ballet Español", "Montaje del espectáculo"],
      [2005, "Vuelo · Vacazul", "Videoclip. Montaje y postproducción (V2)"],
      [2005, "Champs · Veracruz", "Videoclip. Montaje y postproducción (Yoyo Industrias)"],
      [2004, "Un mundo raro · María Jiménez", "Videoclip. Montaje y postproducción (Universal)"],
      [2003, "Rap pati, rap pami · Arianna Puello", "Videoclip. Realización, montaje y postproducción (Zona Bruta)"],
      [2003, "Arte · Guerrilla Gorila", "Videoclip. Montaje"],
      [2003, "Aujourd’hui · Plastic d’Amour", "Videoclip. Montaje"],
      [2002, "Del Nilo al Guadalquivir", "Espectáculo de Julia y Gustavo Salmerón. Montaje y postproducción"]
    ]},
    { cat: "Publicidad", items: [
      [2010, "Mujeres ricas · SsangYong", "Dir. Pablo Palazón. Pepe Jordana, Prosopopeya"],
      [2010, "¿Te has enterado? · Citroën", "Dir. Carlos Polo. Pepe Jordana, Prosopopeya"],
      [2005, "Montaje de publicidad", "Serena Digital y Genlock"]
    ]},
    { cat: "Programas de TV", items: [
      [2013, "Me resbala", "Montaje en Avid. Shine Iberia para Antena 3"],
      [2013, "Por arte de magia", "Montaje en Avid. Shine Iberia para Antena 3"],
      [2002, "Estudio de actores", "Montaje en Avid Symphony. Zeppelin para Antena 3"],
      ["2000–2002", "Disney Channel (Telson)", "Montaje, postproducción y sonorización en Avid Symphony de programas infantiles, videoclips y dramáticos"],
      [2000, "Gran Hermano I", "Montaje en Avid Media Composer. Zeppelin para Telecinco"],
      ["1997–1998", "Informativos Telecinco", "Operadora de edición para programas e informativos"]
    ]},
    { cat: "Otros", items: [
      [2008, "The Endless Not", "Videocreación de Oscar Shocking y Hnos. Rico. Montaje y postproducción"],
      [2004, "Promoter en Disney Channel", ""],
      ["1998–2000", "Técnica de sala · Informativos Telecinco", "Sistema digital. Postproducción con Lightworks, grafismo y recepción de enlaces"]
    ]},
    { cat: "Ayudante de montaje", items: [
      [2002, "El alquimista impaciente (DVD)", "Ayudante de Esperanza Cobos. Tornasol"],
      [2000, "Un chupete para ella", "Ayudante de Esperanza Cobos y Juan Carlos Arroyo en Avid Media Composer. Pedro Masó para Antena 3"],
      [2000, "Muñecas", "Ayudante de montaje de positivo. Cortometraje en 35 mm. Dir. David Utrilla"],
      ["1999–2000", "Robles, investigador privado", "Ayudante de Esperanza Cobos en Avid Symphony. CPA para TVE"],
      ["1995–1996", "Esto es Carnaval", "Ayudante de montaje y de dirección. Dir. Fernando Campos. Cinevideo 20 y Agencia EFE"]
    ]},
    { cat: "Script", items: [
      [2002, "Los abajo firmantes", "Largometraje. Dir. Joaquín Oristrell"],
      [2002, "La reina del bar canalla", "Cortometraje. Dir. Daniel Azancot"],
      [2002, "Perdidos", "Cortometraje. Dir. Humberto Miró"],
      [2001, "A qué saben · Hombre Gancho", "Videoclip. Dir. Luis Cerveró"],
      [2000, "Taxidermia", "Documental. Dir. Luis Cerveró"],
      [2000, "Nuevo ser · Frank T", "Videoclip. Chop, Zona Bruta"],
      [1999, "No apta", "Cortometraje. Dir. Pablo Guerrero y Fernando González"],
      [1999, "Dúplex", "Cortometraje. Dir. Fernando González"],
      [1999, "Subidón", "Cortometraje. Dir. Pablo Guerrero"],
      [1999, "Agua mansa", "Cortometraje. Dir. Pablo Fernández"]
    ]}
  ],

  teaching: [
    ["2026", "Metodología del Montaje I", "2º Diplomatura de Montaje · ECAM, Escuela de Cine de la Comunidad de Madrid"],
    ["2026", "Montaje de ficción para directores (edición II)", "ECAM · Escuela de Oficios"],
    ["2025", "Montaje de ficción para directores (edición I)", "ECAM · Escuela de Oficios"],
    ["2024", "Montaje · Máster de Dirección de Cine y Series", "TAI Arts"],
    ["2006", "Clases de Avid", "EIMA · Escuela Internacional de Medios Audiovisuales"],
    ["2002", "Clases de montaje", "Ondas Escolares"],
    ["2002", "Clases de montaje", "EAV · Escuela de Artes Visuales"]
  ],

  training: [
    ["2026", "Inteligencia Artificial aplicada a la industria cinematográfica", "Academia de Cine (AACCE)"],
    ["2026", "Curso de IA en el audiovisual", "Proyecto HAZ · RTVE"],
    ["2024–2025", "Certificado profesional de habilitación para la docencia (grados A, B y C de FP)", "Grupo Colón"],
    ["2024", "Tutorización del aprendizaje en la empresa", "Grupo Colón"],
    ["2023", "Máster de Dirección de Postproducción", "AMA Formación para la Agencia para el Empleo"],
    ["2018", "Códecs, formatos y flujos de trabajo HD y 4K", "709 Mediaroom"],
    ["2017", "Seminario con Walter Murch, montador e ingeniero de sonido", "ECAM"],
    ["2011", "Curso de corrección de color «Color»", ""],
    ["2010", "Edición 3D con Final Cut Studio: estereografía y edición estereoscópica", "Javier Barañano · CECA Multimedia, Madrid"],
    ["2009", "Edit Fest L.A. · Encuentro de American Cinema Editors (ACE)", "Universal Studios Hollywood, Los Ángeles"],
    ["2008", "Digital Editing Workshop", "New York Film Academy, Nueva York"],
    ["2006", "Masterclass de guion de Linda Seger", "SGAE"],
    ["2005", "Masterclass de guion de Syd Field", "SGAE"],
    ["2003", "Taller de sonido y música para cine", "SGAE"],
    ["2003", "Taller de elaboración de documentales «ComunicArte ’03»", ""],
    ["1997–2000", "Diplomada en Montaje", "ECAM · Escuela de Cine de la Comunidad de Madrid. Talleres de montaje de publicidad (Rori Sainz de Rozas), documental (Nieves Martín), sonido (Teresa Font), sonido digital (José Vinader) e Illusion (Ricardo Elipa)"],
    ["1998", "Técnica de sala en Telecinco", "Postproducción no lineal Lightworks, grafismo, recepción de enlaces y control de realización"],
    ["1997", "Curso de Literatura y Cine", "UNED"],
    ["1995", "Ayudante de producción audiovisual", "Comunidad de Madrid"],
    ["1994", "Imagen y sonido", "Casa de Oficios Magerit"],
    ["1992", "Softimage en Silicon Graphics · Animación 3D", "Promovisa · Taller Ex-Tipo. Pieza «Dos», exhibida en Imagina 93"],
    ["1991–1994", "Módulo III de Operaciones de Imagen y Sonido", "Técnico Especialista Superior (equivalente al actual Grado Superior) · CFTP Puerta Bonita"],
    ["1991–1994", "Módulo III de Mantenimiento y Operaciones Técnicas de Radio y TV", "Técnico Especialista Superior (equivalente al actual Grado Superior) · CFTP Puerta Bonita"]
  ]
};
