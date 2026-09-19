"use strict";

/* ---------------------------------------------------------------
   Constantes
--------------------------------------------------------------- */
const CLAVE_REGISTROS = "registros_emocionales";
const CLAVE_PRIVACIDAD = "nota_educativa_aceptada";
const CLAVE_VISITA = "visita_guiada_vista";
const INTENSIDAD_MIN = 0;
const INTENSIDAD_MAX = 10;

const descripcionesIntensidad = [
  "No se siente intensa",
  "Se siente muy leve",
  "Se siente poco intensa",
  "Se siente algo leve",
  "Se siente moderada-baja",
  "Se siente moderada",
  "Se siente bastante intensa",
  "Se siente intensa",
  "Se siente muy intensa",
  "Se siente casi al máximo",
  "Se siente al máximo",
];

/* ---------------------------------------------------------------
   Sugerencias según emoción e intensidad

   A partir de UMBRAL_SUGERENCIA el registro abre un modal con ideas
   concretas. La valencia ("dificil" / "agradable") define el tono del
   mensaje y además es lo que el calendario usa para saber si un día
   sumó o restó. El recordatorio de hablarlo con una persona adulta
   aparece solo en emociones difíciles a partir de UMBRAL_AYUDA, para
   que no pierda peso por repetirse.
--------------------------------------------------------------- */
const UMBRAL_SUGERENCIA = 7;
const UMBRAL_AYUDA = 9;

const MENSAJE_AYUDA =
  "Estás registrando una intensidad muy alta. Si esto se repite o te está " +
  "costando sostenerlo por tu cuenta, contáselo hoy a una persona adulta de " +
  "confianza: alguien de tu familia, un docente o un profesional. Esta " +
  "página no reemplaza ese acompañamiento.";

const sugerencias = {
  tristeza: {
    valencia: "dificil",
    titulo: "La tristeza también pasa",
    intro:
      "Sentirla no está mal: suele ser una respuesta a algo que te importa.",
    ideas: [
      "Contale cómo te sentís a alguien de confianza. Decirlo en voz alta suele aliviar.",
      "Hacé algo simple que te haga bien: escuchar música que te guste, salir a caminar, estar con tu mascota.",
      "No te exijas resolverlo hoy. A veces alcanza con atravesar el día.",
    ],
  },
  ansiedad: {
    valencia: "dificil",
    titulo: "Bajar un cambio",
    intro: "El cuerpo está acelerado y se lo puede ayudar a que baje.",
    ideas: [
      "Probá respirar lento: inhalá contando hasta 4, sostené 4 y exhalá contando 6. Repetilo cinco veces.",
      "Anotá qué te preocupa y separá lo que podés hacer hoy de lo que no depende de vos.",
      "Movete un rato: caminar o estirarte descarga parte de esa activación.",
    ],
  },
  enojo: {
    valencia: "dificil",
    titulo: "Primero el enojo, después la respuesta",
    intro:
      "El enojo avisa que algo te pareció injusto. Conviene escucharlo sin actuar en caliente.",
    ideas: [
      "Dejá pasar unos minutos antes de decir o escribir algo de lo que después te arrepientas.",
      "Descargalo en el cuerpo: caminá rápido, corré, apretá un almohadón.",
      "Cuando baje, contale a alguien qué fue lo que te hizo enojar. Ponerlo en palabras lo ordena.",
    ],
  },
  frustracion: {
    valencia: "dificil",
    titulo: "Cuando algo no sale",
    intro:
      "Suele aparecer justamente cuando le estás poniendo ganas a algo que no está saliendo.",
    ideas: [
      "Hacé una pausa real y volvé después. Insistir cansado casi siempre empeora el resultado.",
      "Partí lo que te frustra en pedazos más chicos y encará uno solo.",
      "Pedí ayuda con esa parte puntual. No hace falta poder con todo.",
    ],
  },
  verguenza: {
    valencia: "dificil",
    titulo: "Un momento incómodo no dice quién sos",
    intro:
      "La vergüenza suele hacernos creer que todos se dieron cuenta y que fue peor de lo que fue.",
    ideas: [
      "Contáselo a alguien de confianza: es muy probable que le haya pasado algo parecido.",
      "Tratate como tratarías a un amigo al que le pasó lo mismo.",
      "Preguntate qué vas a recordar de esto dentro de un mes.",
    ],
  },
  culpa: {
    valencia: "dificil",
    titulo: "Culpa que sirve, culpa que pesa",
    intro:
      "La culpa es útil cuando señala algo para reparar, no cuando se vuelve un castigo.",
    ideas: [
      "Separá lo que realmente estuvo en tus manos de lo que no dependía de vos.",
      "Si hay algo para reparar, pensá un paso concreto y chico.",
      "Hablalo con alguien: desde afuera suele verse más proporcionado.",
    ],
  },
  celos: {
    valencia: "dificil",
    titulo: "Qué hay debajo de los celos",
    intro: "Debajo casi siempre hay miedo a perder algo que te importa.",
    ideas: [
      "Poné en palabras qué es exactamente lo que temés perder.",
      "Hablalo con la persona involucrada en un momento tranquilo, no en el peor.",
      "Fijate si estás dando por cierto algo que en realidad estás suponiendo.",
    ],
  },
  envidia: {
    valencia: "dificil",
    titulo: "La envidia señala algo que querés",
    intro: "Incomoda, pero suele mostrar con bastante claridad qué te importa.",
    ideas: [
      "Preguntate qué tiene esa persona que vos querrías, y por qué.",
      "Convertilo en un objetivo propio, chico y concreto.",
      "Ojo con las redes: ahí se muestra el mejor recorte, nunca el día completo.",
    ],
  },
  decepcion: {
    valencia: "dificil",
    titulo: "Cuando algo no fue como esperabas",
    intro: "Haber esperado otra cosa no fue un error tuyo.",
    ideas: [
      "Date permiso para lamentar lo que esperabas y no pasó.",
      "Contale a alguien cómo te sentís antes de sacar conclusiones definitivas.",
      "Distinguí si te falló una persona, una situación o una expectativa que te habías armado.",
    ],
  },

  felicidad: {
    valencia: "agradable",
    titulo: "Guardá este momento",
    intro: "Registrar lo bueno también sirve, y bastante.",
    ideas: [
      "Escribí en la observación qué fue lo que pasó, con detalle. En un día difícil vas a poder releerlo.",
      "Si podés, compartilo con alguien: contarlo lo hace durar más.",
    ],
  },
  calma: {
    valencia: "agradable",
    titulo: "Registrar la calma también sirve",
    intro: "Vale la pena saber cómo llegaste hasta acá.",
    ideas: [
      "Anotá qué te ayudó a estar así: eso se puede repetir a propósito otro día.",
      "Aprovechá para resolver algo que venías postergando; desde la calma cuesta menos.",
    ],
  },
  motivacion: {
    valencia: "agradable",
    titulo: "Aprovechá el envión",
    intro: "La motivación sube y baja, así que conviene usarla cuando está.",
    ideas: [
      "Arrancá hoy mismo con un paso chico de eso que venías postergando.",
      "Dejá algo preparado para tu yo de mañana, que quizá tenga menos ganas.",
    ],
  },
  orgullo: {
    valencia: "agradable",
    titulo: "Está bien reconocer lo que lograste",
    intro: "Reconocer lo propio no es agrandarse.",
    ideas: [
      "Anotá qué hiciste concretamente para llegar ahí, no solo el resultado.",
      "Contáselo a alguien que te haya acompañado en el proceso.",
    ],
  },
  gratitud: {
    valencia: "agradable",
    titulo: "Decilo en voz alta",
    intro: "La gratitud rinde más cuando sale del registro y llega a alguien.",
    ideas: [
      "Si hay una persona detrás de esto, decíselo. Suele hacerle bien a los dos.",
      "Anotá tres cosas más, aunque sean pequeñas, que hoy también agradecés.",
    ],
  },
  amor: {
    valencia: "agradable",
    titulo: "Un registro para volver a leer",
    intro: "Este es de los que conviene dejar bien escritos.",
    ideas: [
      "Contá en la observación qué te hizo sentir así, con detalle.",
      "En los días difíciles ayuda recordar que también sentiste esto.",
    ],
  },
  esperanza: {
    valencia: "agradable",
    titulo: "Ponerle nombre a lo que viene",
    intro: "Tener el rumbo escrito ayuda a sostenerlo.",
    ideas: [
      "Anotá qué te gustaría que pase, aunque todavía no sepas cómo.",
      "Pensá un paso chico que dependa solo de vos y hacelo esta semana.",
    ],
  },
};

/* ---------------------------------------------------------------
   Referencias del DOM
--------------------------------------------------------------- */
const botonMenu = document.getElementById("btn-menu");
const barraNavegacion = document.querySelector(".navbar");
const menuNavegacion = document.getElementById("menu-navegacion");
const botonActualizar = document.getElementById("btn-actualizar-registros");
const panelActualizar = document.getElementById("actualizar-registros");
const overlayModal = document.getElementById("modal-overlay-bg");
const botonCerrarActualizar = document.getElementById("btn-cerrar-actualizar");
const archivoRegistros = document.getElementById("archivo-registros");
const campoPegar = document.getElementById("registro-para-pegar");
const botonImportar = document.getElementById("btn-importar-registro");

const contenedorPrivacidad = document.getElementById("contenedorBloqueo");
const panelPrivacidad = document.getElementById("aviso-privacidad");
const detallePrivacidad = document.getElementById("privacidad-detalle");
const botonEntendido = document.getElementById("btnEntendido");
const botonCerrarPrivacidad = document.getElementById("btn-cerrar-privacidad");
const botonVerPrivacidad = document.getElementById("btn-ver-privacidad");

const capaVisita = document.getElementById("visita-guiada");
const focoVisita = document.getElementById("visita-foco");
const globoVisita = document.getElementById("visita-globo");
const pasoVisita = document.getElementById("visita-paso");
const tituloVisita = document.getElementById("visita-titulo");
const textoVisita = document.getElementById("visita-texto");
const botonVerVisita = document.getElementById("btn-ver-visita");
const botonVisitaAnterior = document.getElementById("btn-visita-anterior");
const botonVisitaSiguiente = document.getElementById("btn-visita-siguiente");
const botonVisitaSaltar = document.getElementById("btn-visita-saltar");

const panelBorrar = document.getElementById("modal-borrar");
const textoBorrar = document.getElementById("texto-borrar");
const botonBorrarDatos = document.getElementById("btn-borrar-datos");
const botonCancelarBorrar = document.getElementById("btn-cancelar-borrar");
const botonConfirmarBorrar = document.getElementById("btn-confirmar-borrar");

const panelSugerencia = document.getElementById("modal-sugerencia");
const botonCerrarSugerencia = document.getElementById("btn-cerrar-sugerencia");
const botonListoSugerencia = document.getElementById("btn-listo-sugerencia");
const sugerenciaEmocion = document.getElementById("sugerencia-emocion");
const sugerenciaTitulo = document.getElementById("titulo-sugerencia");
const sugerenciaIntro = document.getElementById("sugerencia-intro");
const sugerenciaIdeas = document.getElementById("sugerencia-ideas");
const sugerenciaAyuda = document.getElementById("sugerencia-ayuda");

const botonDescargas = document.getElementById("btn-descargas");
const dropdownDescargas = document.getElementById("dropdown-descargas");
const botonDescargarTexto = document.getElementById("btn-descargar-texto");
const botonDescargarPdf = document.getElementById("btn-descargar-pdf");

const campoFecha = document.getElementById("fecha");
const selectEmocion = document.getElementById("emocion-select");
const slider = document.getElementById("intensidad");
const valorIntensidad = document.getElementById("valor-intensidad");
const descripcionIntensidad = document.getElementById("descripcion-intensidad");
const campoObservacion = document.getElementById("observacion");
const avisoIntensidad = document.getElementById("aviso-intensidad");

const botonResumen = document.getElementById("btn-resumen");
const contenidoResumen = document.getElementById("contenido-resumen");

const botonBuscarHistorial = document.getElementById("btn-buscar-historial");
const busquedaHistorial = document.getElementById("busqueda-historial");
const campoBusquedaHistorial = document.getElementById(
  "campo-busqueda-historial",
);
const listaHistorial = document.getElementById("lista-historial");

const calendarioMes = document.getElementById("calendario-mes");
const calendarioDias = document.getElementById("calendario-dias");
const calendarioLeyenda = document.getElementById("calendario-leyenda");
const calendarioDetalle = document.getElementById("calendario-detalle");
const botonMesAnterior = document.getElementById("btn-mes-anterior");
const botonMesSiguiente = document.getElementById("btn-mes-siguiente");

/* ---------------------------------------------------------------
   Almacenamiento: lectura/escritura tolerante a fallos
   localStorage puede estar bloqueado (modo privado, cookies
   deshabilitadas) o contener datos corruptos. Sin estas guardas un
   solo valor inválido rompía toda la página al cargar.
--------------------------------------------------------------- */
function normalizarIntensidad(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return null;
  }

  // Respaldos antiguos podían venir en escala 0-100.
  const enEscala = numero > INTENSIDAD_MAX ? numero / 10 : numero;
  const redondeado = Math.round(enEscala);

  if (redondeado < INTENSIDAD_MIN || redondeado > INTENSIDAD_MAX) {
    return null;
  }
  return redondeado;
}

function normalizarRegistro(registro) {
  if (!registro || typeof registro !== "object") {
    return null;
  }

  const intensidad = normalizarIntensidad(registro.intensidad);
  if (
    intensidad === null ||
    typeof registro.fecha !== "string" ||
    typeof registro.emocion !== "string" ||
    !registro.fecha.trim() ||
    !registro.emocion.trim()
  ) {
    return null;
  }

  return {
    fecha: registro.fecha.trim(),
    emocion: registro.emocion.trim(),
    intensidad,
    observacion:
      typeof registro.observacion === "string" ? registro.observacion : "",
  };
}

function leerRegistros() {
  let crudo = null;

  try {
    crudo = localStorage.getItem(CLAVE_REGISTROS);
  } catch (error) {
    return [];
  }

  if (!crudo) {
    return [];
  }

  try {
    const datos = JSON.parse(crudo);
    if (!Array.isArray(datos)) {
      return [];
    }
    return datos.map(normalizarRegistro).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function guardarRegistros(registros) {
  try {
    localStorage.setItem(CLAVE_REGISTROS, JSON.stringify(registros));
    return true;
  } catch (error) {
    mostrarAviso(
      "No se pudieron guardar los registros en este navegador.",
      "error",
    );
    return false;
  }
}

/* ---------------------------------------------------------------
   Avisos
--------------------------------------------------------------- */
function mostrarAviso(mensaje, tipo) {
  const aviso = document.getElementById("aviso-pagina");
  aviso.textContent = mensaje;
  aviso.className = `aviso-pagina aviso-${tipo}`;

  clearTimeout(mostrarAviso.temporizador);
  mostrarAviso.temporizador = setTimeout(() => {
    aviso.className = "aviso-pagina";
    aviso.textContent = "";
  }, 4000);
}

/* ---------------------------------------------------------------
   Navegación
--------------------------------------------------------------- */
function abrirMenuMovil(abierto) {
  barraNavegacion.classList.toggle("menu-abierto", abierto);
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
}

botonMenu.addEventListener("click", () => {
  abrirMenuMovil(!barraNavegacion.classList.contains("menu-abierto"));
});

// Al tocar un enlace del menú en móvil, el panel debe cerrarse solo.
menuNavegacion.querySelectorAll('a[href^="#"]').forEach((enlace) => {
  enlace.addEventListener("click", () => abrirMenuMovil(false));
});

function mostrarDropdownDescargas(abierto) {
  dropdownDescargas.classList.toggle("mostrar-menu", abierto);
  botonDescargas.setAttribute("aria-expanded", String(abierto));
}

botonDescargas.addEventListener("click", () => {
  mostrarDropdownDescargas(
    !dropdownDescargas.classList.contains("mostrar-menu"),
  );
});

function mostrarResumen(abierto) {
  contenidoResumen.classList.toggle("mostrar-resumen", abierto);
  botonResumen.setAttribute("aria-expanded", String(abierto));
}

botonResumen.addEventListener("click", () => {
  mostrarResumen(!contenidoResumen.classList.contains("mostrar-resumen"));
});

// Un único listener delegado en lugar de pisar window.onclick.
document.addEventListener("click", (evento) => {
  const destino =
    evento.target instanceof Element ? evento.target : null;

  if (!destino || !destino.closest("#menu-descargas")) {
    mostrarDropdownDescargas(false);
  }

  if (!destino || !destino.closest(".iniciocontenedor")) {
    mostrarResumen(false);
  }
});

/* ---------------------------------------------------------------
   Formulario de registro
--------------------------------------------------------------- */
// AAAA-MM-DD: lo que espera un <input type="date"> y, de paso, lo que
// hace que los archivos descargados se ordenen solos por fecha.
function fechaISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function refrescarFecha() {
  campoFecha.value = fechaISO();
}

// Si la pestaña queda abierta de un día para el otro, la fecha se
// actualiza al volver en lugar de guardar la de ayer.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refrescarFecha();
  }
});

function actualizarIntensidad() {
  const valor = normalizarIntensidad(slider.value) ?? 5;
  valorIntensidad.textContent = valor;
  descripcionIntensidad.textContent = descripcionesIntensidad[valor];
  actualizarAvisoIntensidad();
}

// Los registros guardan la emoción con su emoji ("😢 Tristeza"), y esos
// emojis cambiaron con el tiempo. Se busca por el nombre sin emoji ni
// acentos para que un registro viejo siga encontrando su sugerencia.
function claveEmocion(emocion) {
  return String(emocion)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function obtenerSugerencia(emocion, intensidad) {
  if (intensidad < UMBRAL_SUGERENCIA) {
    return null;
  }
  return sugerencias[claveEmocion(emocion)] || null;
}

// Adelanto discreto bajo el medidor, antes de guardar.
function actualizarAvisoIntensidad() {
  const sugerencia = obtenerSugerencia(
    selectEmocion.value,
    normalizarIntensidad(slider.value) ?? 0,
  );

  if (!sugerencia) {
    avisoIntensidad.hidden = true;
    avisoIntensidad.textContent = "";
    avisoIntensidad.classList.remove("tono-refuerzo");
    return;
  }

  avisoIntensidad.hidden = false;
  avisoIntensidad.classList.toggle(
    "tono-refuerzo",
    sugerencia.valencia === "agradable",
  );
  avisoIntensidad.textContent =
    sugerencia.valencia === "agradable"
      ? "Intensidad alta. Al guardar vas a ver una idea para aprovechar este momento."
      : "Intensidad alta. Al guardar vas a ver algunas ideas que pueden ayudarte.";
}

slider.addEventListener("input", actualizarIntensidad);
selectEmocion.addEventListener("change", actualizarAvisoIntensidad);

document.getElementById("form-emocion").addEventListener("submit", (e) => {
  e.preventDefault();

  const emocion = selectEmocion.value;
  if (!emocion) {
    mostrarAviso("Por favor elegí una emoción antes de guardar.", "error");
    selectEmocion.focus();
    return;
  }

  // El input guarda AAAA-MM-DD; el historial muestra DD/MM/AAAA.
  const [anio, mes, dia] = campoFecha.value.split("-");
  if (!anio || !mes || !dia) {
    mostrarAviso("La fecha del registro no es válida.", "error");
    return;
  }

  const nuevoRegistro = {
    fecha: `${dia}/${mes}/${anio}`,
    emocion,
    intensidad: normalizarIntensidad(slider.value) ?? 5,
    observacion: campoObservacion.value.trim(),
  };

  const registros = leerRegistros();
  registros.unshift(nuevoRegistro);

  if (!guardarRegistros(registros)) {
    return;
  }

  campoObservacion.value = "";
  selectEmocion.selectedIndex = 0;
  slider.value = 5;
  actualizarIntensidad();
  actualizarInterfaz();
  mostrarAviso("Registro guardado correctamente.", "exito");

  const sugerencia = obtenerSugerencia(
    nuevoRegistro.emocion,
    nuevoRegistro.intensidad,
  );
  if (sugerencia) {
    abrirModalSugerencia(sugerencia, nuevoRegistro);
  }
});

/* ---------------------------------------------------------------
   Búsqueda en el historial
--------------------------------------------------------------- */
botonBuscarHistorial.addEventListener("click", () => {
  const estabaAbierta = !busquedaHistorial.hidden;
  busquedaHistorial.hidden = estabaAbierta;
  botonBuscarHistorial.setAttribute("aria-expanded", String(!estabaAbierta));

  if (estabaAbierta) {
    campoBusquedaHistorial.value = "";
    actualizarInterfaz();
  } else {
    campoBusquedaHistorial.focus();
  }
});

campoBusquedaHistorial.addEventListener("input", actualizarInterfaz);

/* ---------------------------------------------------------------
   Estadísticas (una sola fuente de verdad para pantalla y PDF)
--------------------------------------------------------------- */
function calcularEstadisticas(registros) {
  const total = registros.length;

  if (total === 0) {
    return { total: 0, promedio: 0, frecuencias: [], masFrecuente: "-" };
  }

  const suma = registros.reduce(
    (acumulado, registro) => acumulado + registro.intensidad,
    0,
  );

  const conteos = new Map();
  registros.forEach((registro) => {
    conteos.set(registro.emocion, (conteos.get(registro.emocion) || 0) + 1);
  });

  // Se derivan de los datos reales: así también aparecen las emociones
  // que vengan de un respaldo importado o de una versión anterior.
  const frecuencias = [...conteos.entries()]
    .map(([emocion, cantidad]) => ({
      emocion,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100),
    }))
    .sort(
      (a, b) =>
        b.cantidad - a.cantidad || a.emocion.localeCompare(b.emocion, "es"),
    );

  return {
    total,
    promedio: Math.round(suma / total),
    frecuencias,
    masFrecuente: frecuencias[0].emocion,
  };
}

/* ---------------------------------------------------------------
   Render
--------------------------------------------------------------- */
function actualizarInterfaz() {
  const registros = leerRegistros();

  // 1. Resumen
  if (registros.length > 0) {
    const ultimo = registros[0];
    document.getElementById("resumen-fecha").textContent = ultimo.fecha;
    document.getElementById("resumen-intensidad").textContent =
      `${ultimo.intensidad}/10 - ${descripcionesIntensidad[ultimo.intensidad]}`;
    document.getElementById("resumen-emocion").textContent = ultimo.emocion;
  } else {
    document.getElementById("resumen-fecha").innerHTML = "<i>Sin registros</i>";
    document.getElementById("resumen-intensidad").innerHTML =
      "<i>Sin registros</i>";
    document.getElementById("resumen-emocion").innerHTML =
      "<i>Sin registros</i>";
  }

  // 2. Historial
  listaHistorial.innerHTML = "";
  const textoBusqueda = campoBusquedaHistorial.value.trim().toLowerCase();
  const registrosFiltrados = textoBusqueda
    ? registros.filter((registro) =>
        [
          registro.fecha,
          registro.emocion,
          registro.intensidad,
          descripcionesIntensidad[registro.intensidad],
          registro.observacion,
        ].some((valor) =>
          String(valor ?? "")
            .toLowerCase()
            .includes(textoBusqueda),
        ),
      )
    : registros;

  if (registros.length === 0) {
    listaHistorial.appendChild(
      crearMensajeVacio(
        "Todavía no hay registros. Tu primer registro aparecerá aquí.",
      ),
    );
  } else if (registrosFiltrados.length === 0) {
    listaHistorial.appendChild(
      crearMensajeVacio("No se encontraron registros con esa búsqueda."),
    );
  }

  registrosFiltrados.forEach((registro) => {
    listaHistorial.appendChild(crearTarjetaRegistro(registro));
  });

  // 3. Estadísticas
  const { total, promedio, frecuencias, masFrecuente } =
    calcularEstadisticas(registros);

  document.getElementById("stat-cantidad").textContent = total;
  document.getElementById("stat-frecuente").textContent = masFrecuente;
  document.getElementById("stat-promedio").textContent =
    total === 0
      ? "0/10"
      : `${promedio}/10 - ${descripcionesIntensidad[promedio]}`;

  const listaFrecuencias = document.getElementById("stat-frecuencias");
  listaFrecuencias.innerHTML = "";
  frecuencias.forEach(({ emocion, porcentaje }) => {
    const elemento = document.createElement("li");
    elemento.textContent = `${emocion}: ${porcentaje}%`;
    listaFrecuencias.appendChild(elemento);
  });

  // 4. Calendario
  renderCalendario();
}

function crearMensajeVacio(texto) {
  const vacio = document.createElement("p");
  vacio.className = "historial-vacio";
  vacio.textContent = texto;
  return vacio;
}

function crearTarjetaRegistro(registro) {
  const articulo = document.createElement("article");
  articulo.className = "tarjeta-emocion";

  const cabecera = document.createElement("div");
  cabecera.className = "tarjeta-cabecera";
  const emocion = document.createElement("strong");
  emocion.textContent = registro.emocion;
  const fecha = document.createElement("time");
  fecha.textContent = registro.fecha;
  cabecera.append(emocion, fecha);

  const intensidad = document.createElement("p");
  intensidad.className = "tarjeta-intensidad";
  intensidad.textContent = `Intensidad: ${registro.intensidad}/10 - ${descripcionesIntensidad[registro.intensidad]}`;

  const observacion = document.createElement("p");
  observacion.className = "tarjeta-observacion";
  observacion.textContent = registro.observacion || "Sin observación";

  articulo.append(cabecera, intensidad, observacion);
  return articulo;
}

/* ---------------------------------------------------------------
   Descargas
--------------------------------------------------------------- */
function descargarArchivo(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.style.display = "none";

  // Firefox exige que el enlace esté en el documento, y revocar la URL
  // de inmediato puede cancelar la descarga: se libera después.
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

botonDescargarTexto.addEventListener("click", () => {
  mostrarDropdownDescargas(false);
  abrirMenuMovil(false);

  const registros = leerRegistros();
  if (registros.length === 0) {
    mostrarAviso("No hay registros para descargar todavía.", "error");
    return;
  }

  descargarArchivo(
    `registros-emocionales-${fechaISO()}.json`,
    JSON.stringify(registros, null, 2),
    "application/json;charset=utf-8",
  );
  mostrarAviso("Registros descargados correctamente.", "exito");
});

botonDescargarPdf.addEventListener("click", async () => {
  mostrarDropdownDescargas(false);
  abrirMenuMovil(false);

  const registros = leerRegistros();
  if (registros.length === 0) {
    mostrarAviso("No hay registros para crear el PDF todavía.", "error");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    mostrarAviso(
      "No se pudo cargar el generador de PDF. Revisá tu conexión.",
      "error",
    );
    return;
  }

  const { jsPDF } = window.jspdf;
  const documento = new jsPDF();
  const anchoPagina = documento.internal.pageSize.getWidth();
  const margen = 20;
  const anchoUtil = anchoPagina - margen * 2;
  const limiteInferior = 278;
  let posicionY = 20;

  const asegurarEspacio = (altoNecesario) => {
    if (posicionY + altoNecesario > limiteInferior) {
      documento.addPage();
      posicionY = 20;
    }
  };

  // Se mide el párrafo antes de dibujarlo para poder reservar el alto
  // exacto de cada tarjeta y no partirla entre dos páginas.
  const prepararParrafo = (texto, opciones = {}) => {
    const tamano = opciones.tamano || 10;
    const interlineado = opciones.interlineado || 5;
    documento.setFontSize(tamano);
    documento.setFont("helvetica", opciones.negrita ? "bold" : "normal");
    const lineas = documento.splitTextToSize(limpiarTextoPDF(texto), anchoUtil);
    return {
      lineas,
      tamano,
      negrita: Boolean(opciones.negrita),
      alto: lineas.length * interlineado + 4,
    };
  };

  const dibujarParrafo = (parrafo) => {
    documento.setFontSize(parrafo.tamano);
    documento.setFont("helvetica", parrafo.negrita ? "bold" : "normal");
    documento.text(parrafo.lineas, margen, posicionY);
    posicionY += parrafo.alto;
  };

  const agregarParrafo = (texto, opciones) => {
    const parrafo = prepararParrafo(texto, opciones);
    asegurarEspacio(parrafo.alto);
    dibujarParrafo(parrafo);
  };

  const logo = await cargarImagenParaPDF("img/icono-circular.png");
  if (logo) {
    documento.addImage(logo, "PNG", margen, posicionY, 22, 22);
  }
  documento.setFont("helvetica", "bold");
  documento.setFontSize(18);
  documento.text("Registro Emocional", margen + 28, posicionY + 9);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  documento.text("TECNO-LAB | Proyecto Nosotros", margen + 28, posicionY + 16);
  posicionY += 34;
  documento.setDrawColor(0, 123, 255);
  documento.line(margen, posicionY, anchoPagina - margen, posicionY);
  posicionY += 12;

  agregarParrafo(
    `Documento generado el ${new Date().toLocaleDateString("es-AR")}`,
    { tamano: 9 },
  );
  agregarParrafo("Resumen de registros", { tamano: 14, negrita: true });

  const { total, promedio, frecuencias, masFrecuente } =
    calcularEstadisticas(registros);

  agregarParrafo(`Cantidad de registros: ${total}`);
  agregarParrafo(
    `Intensidad promedio: ${promedio}/10 - ${descripcionesIntensidad[promedio]}`,
  );
  agregarParrafo(`Emoción más frecuente: ${masFrecuente}`);
  agregarParrafo("Frecuencia por emoción", { negrita: true });
  frecuencias.forEach(({ emocion, cantidad, porcentaje }) => {
    agregarParrafo(
      `${emocion}: ${porcentaje}% (${cantidad} registro${cantidad === 1 ? "" : "s"})`,
    );
  });
  agregarParrafo("Detalle de registros", { tamano: 14, negrita: true });

  registros.forEach((registro, indice) => {
    const partes = [
      prepararParrafo(`${indice + 1}. ${registro.emocion} | ${registro.fecha}`, {
        negrita: true,
      }),
      prepararParrafo(
        `Intensidad: ${registro.intensidad}/10 - ${descripcionesIntensidad[registro.intensidad]}`,
      ),
      prepararParrafo(
        `Observación: ${registro.observacion || "Sin observación"}`,
      ),
    ];

    const altoTarjeta = partes.reduce((suma, parte) => suma + parte.alto, 0) + 6;
    asegurarEspacio(altoTarjeta + 4);

    documento.setFillColor(248, 250, 252);
    documento.roundedRect(
      margen - 4,
      posicionY - 6,
      anchoUtil + 8,
      altoTarjeta,
      2,
      2,
      "F",
    );
    partes.forEach(dibujarParrafo);
    posicionY += 6;
  });

  agregarParrafo("Avisos y privacidad", { tamano: 14, negrita: true });
  agregarParrafo(
    "Este proyecto guarda los registros de forma local en este navegador. El archivo se genera como práctica educativa para poder compartirlo con un profesional o recuperarlo mediante “Actualizar Registros”.",
  );
  agregarParrafo(
    "IMPORTANTE: Este proyecto no reemplaza el acompañamiento de una persona adulta o profesional. Tus registros son privados.",
  );
  agregarParrafo("Registro Emocional Web | TECNO-LAB | Proyecto Nosotros", {
    tamano: 9,
  });

  documento.save(`registro-emocional-completo-${fechaISO()}.pdf`);
  mostrarAviso("Documento PDF descargado correctamente.", "exito");
});

function limpiarTextoPDF(texto) {
  return String(texto)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cargarImagenParaPDF(ruta) {
  return new Promise((resolve) => {
    const imagen = new Image();
    imagen.onload = () => {
      const lienzo = document.createElement("canvas");
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      lienzo.getContext("2d").drawImage(imagen, 0, 0);
      resolve(lienzo.toDataURL("image/png"));
    };
    imagen.onerror = () => resolve(null);
    imagen.src = ruta;
  });
}

/* ---------------------------------------------------------------
   Modal "Actualizar registros"
--------------------------------------------------------------- */
function abrirModalActualizar() {
  panelActualizar.classList.add("modal-visible");
  panelActualizar.setAttribute("aria-hidden", "false");
  overlayModal.hidden = false;
  botonActualizar.setAttribute("aria-expanded", "true");

  // focus() sobre un elemento que el navegador todavía tiene calculado
  // como invisible no hace nada: sin este reflujo forzado el teclado
  // nunca entra al diálogo.
  void panelActualizar.offsetHeight;
  botonCerrarActualizar.focus();

  if (document.activeElement !== botonCerrarActualizar) {
    requestAnimationFrame(() => botonCerrarActualizar.focus());
  }
}

// Con aria-modal="true" el foco no debe poder salir del diálogo.
function atraparFoco(e, panel) {
  const focuseables = panel.querySelectorAll(
    'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
  );
  if (focuseables.length === 0) {
    return;
  }

  const primero = focuseables[0];
  const ultimo = focuseables[focuseables.length - 1];

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  } else if (!panel.contains(document.activeElement)) {
    e.preventDefault();
    primero.focus();
  }
}

// "inicial" | "lectura" | null. Vive acá arriba porque modalAbierto()
// necesita saber si la nota de privacidad está abierta.
let modoPrivacidad = null;

function modalAbierto() {
  // La nota de privacidad va primero: se dibuja por encima de todo.
  if (modoPrivacidad) {
    return panelPrivacidad;
  }
  if (panelBorrar.classList.contains("modal-visible")) {
    return panelBorrar;
  }
  if (panelActualizar.classList.contains("modal-visible")) {
    return panelActualizar;
  }
  if (panelSugerencia.classList.contains("modal-visible")) {
    return panelSugerencia;
  }
  return null;
}

function cerrarModal(panel) {
  if (panel === panelPrivacidad) {
    // El aviso de la primera visita es una puerta: solo se sale
    // aceptándolo, así que Escape no lo cierra.
    if (modoPrivacidad === "lectura") {
      cerrarAvisoPrivacidad();
    }
  } else if (panel === panelBorrar) {
    cerrarModalBorrar();
  } else if (panel === panelActualizar) {
    cerrarModalActualizar();
  } else if (panel === panelSugerencia) {
    cerrarModalSugerencia();
  }
}

/* ---------------------------------------------------------------
   Borrar todos los datos

   Vive en el pie y no en el aviso de bienvenida a propósito: una
   acción irreversible no va en la pantalla por la que todos pasan.
--------------------------------------------------------------- */
function abrirModalBorrar() {
  const cantidad = leerRegistros().length;

  const marcas =
    "las marcas de que ya aceptaste el aviso de privacidad y de que ya viste la visita guiada, así que las dos van a volver a aparecer";

  textoBorrar.textContent =
    cantidad === 0
      ? `No tenés registros guardados. Se van a borrar ${marcas}.`
      : `Se van a borrar ${cantidad} registro${cantidad === 1 ? "" : "s"} y ${marcas}.`;

  panelBorrar.classList.add("modal-visible");
  panelBorrar.setAttribute("aria-hidden", "false");
  overlayModal.hidden = false;

  // El foco va a Cancelar, nunca al botón que borra.
  void panelBorrar.offsetHeight;
  botonCancelarBorrar.focus();

  if (document.activeElement !== botonCancelarBorrar) {
    requestAnimationFrame(() => botonCancelarBorrar.focus());
  }
}

function cerrarModalBorrar() {
  panelBorrar.classList.remove("modal-visible");
  panelBorrar.setAttribute("aria-hidden", "true");
  overlayModal.hidden = true;
  botonBorrarDatos.focus();
}

function borrarTodosLosDatos() {
  try {
    localStorage.removeItem(CLAVE_REGISTROS);
    localStorage.removeItem(CLAVE_PRIVACIDAD);
    localStorage.removeItem(CLAVE_VISITA);
  } catch (error) {
    mostrarAviso("No se pudieron borrar los datos en este navegador.", "error");
    return;
  }

  cerrarModalBorrar();

  // Se deja la interfaz como recién llegada: sin búsqueda abierta, sin
  // día seleccionado y con el calendario de vuelta en el mes actual.
  campoBusquedaHistorial.value = "";
  busquedaHistorial.hidden = true;
  botonBuscarHistorial.setAttribute("aria-expanded", "false");
  diaSeleccionado = null;
  mesVisible = null;

  actualizarInterfaz();
  mostrarAviso("Se borraron todos tus datos de este navegador.", "exito");
}

botonBorrarDatos.addEventListener("click", abrirModalBorrar);
botonCancelarBorrar.addEventListener("click", cerrarModalBorrar);
botonConfirmarBorrar.addEventListener("click", borrarTodosLosDatos);

/* ---------------------------------------------------------------
   Modal de sugerencia
--------------------------------------------------------------- */
let focoPrevioSugerencia = null;

function abrirModalSugerencia(sugerencia, registro) {
  focoPrevioSugerencia =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  sugerenciaEmocion.textContent = `${registro.emocion} · intensidad ${registro.intensidad}/10`;
  sugerenciaTitulo.textContent = sugerencia.titulo;
  sugerenciaIntro.textContent = sugerencia.intro;

  sugerenciaIdeas.innerHTML = "";
  sugerencia.ideas.forEach((idea) => {
    const elemento = document.createElement("li");
    elemento.textContent = idea;
    sugerenciaIdeas.appendChild(elemento);
  });

  const necesitaAyuda =
    sugerencia.valencia === "dificil" && registro.intensidad >= UMBRAL_AYUDA;
  sugerenciaAyuda.hidden = !necesitaAyuda;
  sugerenciaAyuda.textContent = necesitaAyuda ? MENSAJE_AYUDA : "";

  panelSugerencia.classList.toggle(
    "tono-refuerzo",
    sugerencia.valencia === "agradable",
  );
  panelSugerencia.classList.add("modal-visible");
  panelSugerencia.setAttribute("aria-hidden", "false");
  overlayModal.hidden = false;

  void panelSugerencia.offsetHeight;

  // Se enfoca el diálogo y no el botón del pie: así el lector de
  // pantalla arranca por el título y el panel no se autodesplaza hacia
  // abajo cuando el contenido no entra en la pantalla.
  panelSugerencia.focus();
  panelSugerencia.scrollTop = 0;

  if (document.activeElement !== panelSugerencia) {
    requestAnimationFrame(() => {
      panelSugerencia.focus();
      panelSugerencia.scrollTop = 0;
    });
  }
}

function cerrarModalSugerencia() {
  panelSugerencia.classList.remove("modal-visible");
  panelSugerencia.setAttribute("aria-hidden", "true");
  overlayModal.hidden = true;

  if (focoPrevioSugerencia && document.body.contains(focoPrevioSugerencia)) {
    focoPrevioSugerencia.focus();
  }
  focoPrevioSugerencia = null;
}

botonCerrarSugerencia.addEventListener("click", cerrarModalSugerencia);
botonListoSugerencia.addEventListener("click", cerrarModalSugerencia);

function cerrarModalActualizar() {
  panelActualizar.classList.remove("modal-visible");
  panelActualizar.setAttribute("aria-hidden", "true");
  overlayModal.hidden = true;
  botonActualizar.setAttribute("aria-expanded", "false");
  botonActualizar.focus();
}

botonActualizar.addEventListener("click", () => {
  abrirMenuMovil(false);
  abrirModalActualizar();
});

botonCerrarActualizar.addEventListener("click", cerrarModalActualizar);

overlayModal.addEventListener("click", () => {
  const abierto = modalAbierto();
  if (abierto) {
    cerrarModal(abierto);
  }
});

document.addEventListener("keydown", (e) => {
  const abierto = modalAbierto();

  if (e.key === "Tab" && abierto) {
    atraparFoco(e, abierto);
    return;
  }

  if (e.key !== "Escape") {
    return;
  }

  if (abierto) {
    cerrarModal(abierto);
    return;
  }

  mostrarDropdownDescargas(false);
  mostrarResumen(false);
  abrirMenuMovil(false);
});

archivoRegistros.addEventListener("change", () => {
  const archivo = archivoRegistros.files[0];
  if (!archivo) {
    return;
  }

  const lector = new FileReader();
  lector.addEventListener("load", (e) => {
    campoPegar.value = e.target.result;
  });
  lector.addEventListener("error", () => {
    mostrarAviso("No se pudo leer el archivo seleccionado.", "error");
  });
  lector.readAsText(archivo);
});

botonImportar.addEventListener("click", () => {
  const contenido = campoPegar.value
    .replace(/^﻿/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (!contenido) {
    mostrarAviso("Pegá o importá el contenido del respaldo.", "error");
    return;
  }

  let datos;
  try {
    datos = JSON.parse(contenido);
  } catch (error) {
    mostrarAviso("El registro pegado no tiene un formato válido.", "error");
    return;
  }

  if (!Array.isArray(datos)) {
    mostrarAviso("El registro pegado no tiene datos válidos.", "error");
    return;
  }

  const registrosValidados = datos.map(normalizarRegistro);
  if (registrosValidados.some((registro) => registro === null)) {
    mostrarAviso("El registro pegado no tiene datos válidos.", "error");
    return;
  }

  // Importar una lista vacía borraría todo el historial sin avisar.
  if (registrosValidados.length === 0) {
    mostrarAviso("El respaldo no contiene registros para importar.", "error");
    return;
  }

  if (!guardarRegistros(registrosValidados)) {
    return;
  }

  campoPegar.value = "";
  // Se limpia para poder volver a elegir el mismo archivo.
  archivoRegistros.value = "";
  actualizarInterfaz();
  mostrarAviso(
    `Se actualizaron ${registrosValidados.length} registro${
      registrosValidados.length === 1 ? "" : "s"
    }.`,
    "exito",
  );
});

/* ---------------------------------------------------------------
   Aviso de privacidad
--------------------------------------------------------------- */
function abrirAvisoPrivacidad(modo) {
  modoPrivacidad = modo;

  contenedorPrivacidad.classList.remove("oculto");
  contenedorPrivacidad.classList.toggle("modo-inicial", modo === "inicial");
  document.body.classList.add("sin-scroll");

  // En la primera visita el detalle va plegado para que el aviso se
  // pueda leer de un vistazo; si alguien lo abre a propósito desde el
  // pie, es porque quiere leer todo.
  detallePrivacidad.open = modo === "lectura";
  botonEntendido.textContent =
    modo === "inicial" ? "Aceptar y continuar" : "Cerrar";

  // Se enfoca el diálogo, no el botón: así el lector de pantalla
  // arranca por el título y el panel no se desplaza hasta el final.
  void panelPrivacidad.offsetHeight;
  panelPrivacidad.scrollTop = 0;
  panelPrivacidad.focus();
}

function cerrarAvisoPrivacidad() {
  const veniaDeLectura = modoPrivacidad === "lectura";

  contenedorPrivacidad.classList.add("oculto");
  document.body.classList.remove("sin-scroll");
  modoPrivacidad = null;

  // Solo se devuelve el foco al pie si se había abierto desde ahí;
  // al aceptar en la primera visita saltaría al final de la página.
  if (veniaDeLectura) {
    botonVerPrivacidad.focus();
  }
}

function iniciarAvisoPrivacidad() {
  botonEntendido.addEventListener("click", () => {
    const eraPrimeraVisita = modoPrivacidad === "inicial";

    if (eraPrimeraVisita) {
      try {
        localStorage.setItem(CLAVE_PRIVACIDAD, "true");
      } catch (error) {
        // Sin almacenamiento el aviso volverá a aparecer; no es bloqueante.
      }
    }

    cerrarAvisoPrivacidad();

    // Recién ahora, con la página ya destapada, arranca la visita.
    if (eraPrimeraVisita && !visitaYaVista()) {
      iniciarVisita();
    }
  });

  botonCerrarPrivacidad.addEventListener("click", cerrarAvisoPrivacidad);
  botonVerPrivacidad.addEventListener("click", () =>
    abrirAvisoPrivacidad("lectura"),
  );

  let yaAceptado = false;
  try {
    yaAceptado = localStorage.getItem(CLAVE_PRIVACIDAD) === "true";
  } catch (error) {
    yaAceptado = false;
  }

  if (!yaAceptado) {
    abrirAvisoPrivacidad("inicial");
  }
}

/* ---------------------------------------------------------------
   Calendario

   Cada registro aporta un puntaje con signo: la intensidad suma si la
   emoción es agradable y resta si es difícil. El promedio del día cae
   en uno de cinco niveles, del rojo al verde. Así una mañana de enojo
   intenso y una tarde de felicidad se compensan en un día amarillo.
--------------------------------------------------------------- */
const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Ordenados de peor a mejor; cada uno vale desde su mínimo hacia arriba.
const NIVELES_ANIMO = [
  {
    clave: "muy-bajo",
    minimo: -Infinity,
    cara: "😞",
    texto: "Un día cuesta arriba",
  },
  { clave: "bajo", minimo: -4, cara: "🙁", texto: "Más para abajo" },
  { clave: "neutro", minimo: -1.5, cara: "😐", texto: "Mezclado" },
  { clave: "alto", minimo: 1.5, cara: "🙂", texto: "Más para arriba" },
  { clave: "muy-alto", minimo: 4, cara: "😄", texto: "Un buen día" },
];

let mesVisible = null;
let diaSeleccionado = null;

function nivelAnimo(promedio) {
  for (let i = NIVELES_ANIMO.length - 1; i >= 0; i--) {
    if (promedio >= NIVELES_ANIMO[i].minimo) {
      return NIVELES_ANIMO[i];
    }
  }
  return NIVELES_ANIMO[0];
}

// Los registros guardan la fecha como DD/MM/AAAA.
function partesFecha(fecha) {
  const coincidencia = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
    String(fecha).trim(),
  );
  if (!coincidencia) {
    return null;
  }

  const dia = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const anio = Number(coincidencia[3]);

  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }
  return { dia, mes, anio };
}

function puntajeAnimo(registro) {
  const emocion = sugerencias[claveEmocion(registro.emocion)];
  if (!emocion) {
    return null;
  }
  return emocion.valencia === "agradable"
    ? registro.intensidad
    : -registro.intensidad;
}

function claveDia(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function agruparPorDia(registros) {
  const dias = new Map();

  registros.forEach((registro) => {
    const partes = partesFecha(registro.fecha);
    if (!partes) {
      return;
    }

    const clave = claveDia(partes.anio, partes.mes, partes.dia);
    if (!dias.has(clave)) {
      dias.set(clave, { anio: partes.anio, mes: partes.mes, registros: [] });
    }
    dias.get(clave).registros.push(registro);
  });

  dias.forEach((dato) => {
    const puntajes = dato.registros.map(puntajeAnimo).filter((p) => p !== null);
    dato.promedio = puntajes.length
      ? puntajes.reduce((total, p) => total + p, 0) / puntajes.length
      : null;
    dato.nivel = dato.promedio === null ? null : nivelAnimo(dato.promedio);
  });

  return dias;
}

// El calendario solo se mueve entre el primer registro y el mes actual.
function limitesMeses(dias) {
  const hoy = new Date();
  const actual = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  let minimo = actual;
  let maximo = actual;

  dias.forEach((dato) => {
    const candidato = { anio: dato.anio, mes: dato.mes };
    if (comparaMeses(candidato, minimo) < 0) {
      minimo = candidato;
    }
    if (comparaMeses(candidato, maximo) > 0) {
      maximo = candidato;
    }
  });

  return { minimo, maximo };
}

function comparaMeses(a, b) {
  return a.anio - b.anio || a.mes - b.mes;
}

function desplazarMes({ anio, mes }, pasos) {
  const indice = anio * 12 + (mes - 1) + pasos;
  return { anio: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

function renderLeyenda() {
  calendarioLeyenda.innerHTML = "";

  NIVELES_ANIMO.forEach((nivel) => {
    const elemento = document.createElement("li");

    const muestra = document.createElement("span");
    muestra.className = `leyenda-muestra nivel-${nivel.clave}`;
    muestra.textContent = nivel.cara;
    muestra.setAttribute("aria-hidden", "true");

    const texto = document.createElement("span");
    texto.textContent = nivel.texto;

    elemento.append(muestra, texto);
    calendarioLeyenda.appendChild(elemento);
  });
}

function renderCalendario() {
  const dias = agruparPorDia(leerRegistros());
  const { minimo, maximo } = limitesMeses(dias);

  if (!mesVisible) {
    mesVisible = maximo;
  }
  if (comparaMeses(mesVisible, minimo) < 0) {
    mesVisible = minimo;
  }
  if (comparaMeses(mesVisible, maximo) > 0) {
    mesVisible = maximo;
  }

  const { anio, mes } = mesVisible;
  calendarioMes.textContent = `${NOMBRES_MES[mes - 1]} ${anio}`;
  botonMesAnterior.disabled = comparaMeses(mesVisible, minimo) <= 0;
  botonMesSiguiente.disabled = comparaMeses(mesVisible, maximo) >= 0;

  const diasEnMes = new Date(anio, mes, 0).getDate();
  // getDay() arranca en domingo; acá la semana empieza el lunes.
  const desplazamiento = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

  const hoy = new Date();
  const claveHoy = claveDia(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    hoy.getDate(),
  );

  calendarioDias.innerHTML = "";
  let fila = document.createElement("tr");

  for (let i = 0; i < desplazamiento; i++) {
    const vacia = document.createElement("td");
    vacia.className = "dia-fuera-de-mes";
    fila.appendChild(vacia);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    if (fila.children.length === 7) {
      calendarioDias.appendChild(fila);
      fila = document.createElement("tr");
    }

    const clave = claveDia(anio, mes, dia);
    const celda = document.createElement("td");
    celda.appendChild(crearCeldaDia(dia, clave, dias.get(clave), claveHoy));
    fila.appendChild(celda);
  }

  while (fila.children.length < 7) {
    const vacia = document.createElement("td");
    vacia.className = "dia-fuera-de-mes";
    fila.appendChild(vacia);
  }
  calendarioDias.appendChild(fila);

  // Si el día abierto ya no está a la vista, se cierra el detalle.
  if (diaSeleccionado && !dias.has(diaSeleccionado)) {
    diaSeleccionado = null;
  }
  renderDetalleDia(dias);
}

function crearCeldaDia(dia, clave, dato, claveHoy) {
  const numero = document.createElement("span");
  numero.className = "dia-numero";
  numero.textContent = dia;

  if (!dato) {
    const vacio = document.createElement("span");
    vacio.className = "dia-calendario dia-sin-registros";
    if (clave === claveHoy) {
      vacio.classList.add("dia-hoy");
    }
    vacio.appendChild(numero);
    return vacio;
  }

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "dia-calendario";
  boton.dataset.dia = clave;

  const cantidad = dato.registros.length;
  const plural = cantidad === 1 ? "registro" : "registros";

  if (dato.nivel) {
    boton.classList.add(`nivel-${dato.nivel.clave}`);
    boton.setAttribute(
      "aria-label",
      `${dia} de ${NOMBRES_MES[dato.mes - 1]}: ${dato.nivel.texto}, ${cantidad} ${plural}`,
    );
  } else {
    boton.setAttribute(
      "aria-label",
      `${dia} de ${NOMBRES_MES[dato.mes - 1]}: ${cantidad} ${plural}`,
    );
  }

  if (clave === claveHoy) {
    boton.classList.add("dia-hoy");
  }
  if (clave === diaSeleccionado) {
    boton.classList.add("dia-seleccionado");
    boton.setAttribute("aria-current", "true");
  }

  const cara = document.createElement("span");
  cara.className = "dia-cara";
  cara.setAttribute("aria-hidden", "true");
  cara.textContent = dato.nivel ? dato.nivel.cara : "·";

  boton.append(numero, cara);
  return boton;
}

function renderDetalleDia(dias) {
  calendarioDetalle.innerHTML = "";

  if (!diaSeleccionado) {
    return;
  }

  const dato = dias.get(diaSeleccionado);
  if (!dato) {
    return;
  }

  const [anio, mes, dia] = diaSeleccionado.split("-");
  const titulo = document.createElement("p");
  titulo.className = "detalle-titulo";
  titulo.textContent = `${Number(dia)} de ${NOMBRES_MES[Number(mes) - 1]} de ${anio}`;

  if (dato.nivel) {
    const promedio = document.createElement("span");
    promedio.className = "detalle-promedio";
    promedio.textContent = ` · ${dato.nivel.cara} ${dato.nivel.texto}`;
    titulo.appendChild(promedio);
  }

  const lista = document.createElement("div");
  lista.className = "lista-registros";
  dato.registros.forEach((registro) => {
    lista.appendChild(crearTarjetaRegistro(registro));
  });

  calendarioDetalle.append(titulo, lista);
}

calendarioDias.addEventListener("click", (evento) => {
  const boton =
    evento.target instanceof Element
      ? evento.target.closest("button.dia-calendario")
      : null;
  if (!boton) {
    return;
  }

  const clave = boton.dataset.dia;
  diaSeleccionado = clave === diaSeleccionado ? null : clave;
  renderCalendario();

  // El re-render destruye el botón recién pulsado: hay que devolverle
  // el foco para no dejar al teclado en la nada.
  const reenfocar = calendarioDias.querySelector(`[data-dia="${clave}"]`);
  if (reenfocar) {
    reenfocar.focus();
  }
});

botonMesAnterior.addEventListener("click", () => {
  mesVisible = desplazarMes(mesVisible, -1);
  renderCalendario();
});

botonMesSiguiente.addEventListener("click", () => {
  mesVisible = desplazarMes(mesVisible, 1);
  renderCalendario();
});

/* ---------------------------------------------------------------
   Aparición progresiva al desplazarse

   Las tarjetas que todavía están abajo del pliegue entran con un fundido
   corto cuando se llega a ellas. La clase que las oculta la pone el JS,
   nunca el HTML: si el JS no corre o el navegador no soporta
   IntersectionObserver, la página se ve entera igual.
--------------------------------------------------------------- */
const SELECTOR_REVELABLES =
  ".cajaregistrar, #historial, #calendario, #estadisticas, #pie-pagina";

function revelarTodo() {
  document
    .querySelectorAll(".revelar")
    .forEach((elemento) => elemento.classList.add("revelado"));
}

function iniciarRevelado() {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  // Solo se prepara lo que todavía no se ve: ocultar algo que ya está en
  // pantalla produciría un parpadeo al cargar.
  const pendientes = [...document.querySelectorAll(SELECTOR_REVELABLES)].filter(
    (elemento) =>
      elemento.getBoundingClientRect().top > window.innerHeight * 0.9,
  );

  pendientes.forEach((elemento) => elemento.classList.add("revelar"));

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("revelado");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.06 },
  );

  pendientes.forEach((elemento) => observador.observe(elemento));

  // Red de seguridad: si el observador no llegara a disparar, nada que
  // esté a la vista puede quedarse en blanco. Solo destapa lo que ya
  // está en pantalla, así lo de más abajo conserva su aparición.
  setTimeout(() => {
    pendientes.forEach((elemento) => {
      const caja = elemento.getBoundingClientRect();
      if (caja.top < window.innerHeight && caja.bottom > 0) {
        elemento.classList.add("revelado");
      }
    });
  }, 3000);
}

/* ---------------------------------------------------------------
   Visita guiada

   Un recuadro que ilumina una parte de la página y un globo que la
   explica. Arranca sola después de aceptar el aviso de privacidad, una
   sola vez, y se puede repetir desde el pie.
--------------------------------------------------------------- */
const PASOS_VISITA = [
  {
    objetivo: ".cajaregistrar",
    titulo: "Registrar cómo te sentís",
    texto:
      "Elegí una emoción, marcá qué tan intensa fue y, si querés, escribí una observación. Con eso el registro ya queda guardado.",
  },
  {
    objetivo: "#btn-resumen",
    titulo: "Tu último registro, a mano",
    texto:
      "Este botón te muestra el registro más reciente sin tener que bajar hasta el historial.",
  },
  {
    objetivo: "#historial",
    titulo: "El historial completo",
    texto:
      "Acá quedan todos tus registros. La lupa abre un buscador por fecha, emoción, intensidad u observación.",
  },
  {
    objetivo: "#calendario",
    titulo: "El mes de un vistazo",
    texto:
      "Cada día se pinta según el promedio de ese día, del rojo al verde. Tocá cualquiera para ver sus registros.",
  },
  {
    objetivo: "#estadisticas",
    titulo: "Tus números",
    texto:
      "Cuántos registros llevás, la intensidad promedio y qué emoción aparece más seguido.",
  },
  {
    objetivo: "#menu-navegacion",
    titulo: "Guardar y recuperar",
    texto:
      "Desde «Descargar Historial» podés bajar un respaldo o un PDF para mostrarle a un profesional. Con «Actualizar Registros» lo volvés a cargar.",
    // En el teléfono ese menú vive detrás del botón de las tres rayas.
    preparar: () => abrirMenuMovil(true),
    limpiar: () => abrirMenuMovil(false),
  },
  {
    objetivo: "#pie-pagina",
    titulo: "Privacidad y datos",
    texto:
      "Tus registros quedan solo en este navegador. Desde el pie podés repetir esta visita, releer el aviso de privacidad o borrar todo lo guardado.",
  },
];

let visitaActiva = false;
let pasoActual = 0;
let limpiezaPaso = null;

function visitaYaVista() {
  try {
    return localStorage.getItem(CLAVE_VISITA) === "true";
  } catch (error) {
    return false;
  }
}

function marcarVisitaVista() {
  try {
    localStorage.setItem(CLAVE_VISITA, "true");
  } catch (error) {
    // Sin almacenamiento la visita volverá a ofrecerse; no es grave.
  }
}

function iniciarVisita() {
  if (visitaActiva) {
    return;
  }

  visitaActiva = true;
  pasoActual = 0;
  // Nada puede estar esperando a aparecer mientras la visita lo señala.
  revelarTodo();
  capaVisita.hidden = false;
  // El primer recuadro aparece donde corresponde, sin venir volando
  // desde la esquina.
  focoVisita.classList.add("sin-animacion");
  mostrarPaso(0);
  requestAnimationFrame(() => focoVisita.classList.remove("sin-animacion"));

  window.addEventListener("resize", reubicarVisita);
  window.addEventListener("scroll", seguirConLaVista, { passive: true });
}

// Si la página se mueve durante la visita, el recuadro la acompaña.
// Sin envolverlo en requestAnimationFrame a propósito: son dos medidas
// por evento, el navegador ya limita el scroll a un cuadro, y así no
// depende de que la pestaña esté dibujándose.
function seguirConLaVista() {
  if (visitaActiva) {
    posicionarVisita();
  }
}

function terminarVisita() {
  if (!visitaActiva) {
    return;
  }

  if (limpiezaPaso) {
    limpiezaPaso();
    limpiezaPaso = null;
  }

  visitaActiva = false;
  capaVisita.hidden = true;
  window.removeEventListener("resize", reubicarVisita);
  window.removeEventListener("scroll", seguirConLaVista);
  marcarVisitaVista();
  botonVerVisita.focus();
}

function mostrarPaso(indice) {
  if (limpiezaPaso) {
    limpiezaPaso();
    limpiezaPaso = null;
  }

  pasoActual = indice;
  const paso = PASOS_VISITA[indice];

  if (paso.preparar) {
    paso.preparar();
    limpiezaPaso = paso.limpiar || null;
  }

  pasoVisita.textContent = `Paso ${indice + 1} de ${PASOS_VISITA.length}`;
  tituloVisita.textContent = paso.titulo;
  textoVisita.textContent = paso.texto;

  botonVisitaAnterior.disabled = indice === 0;
  botonVisitaSiguiente.textContent =
    indice === PASOS_VISITA.length - 1 ? "Terminar" : "Siguiente";

  reubicarVisita();
  globoVisita.focus();
}

function reubicarVisita() {
  const objetivo = document.querySelector(PASOS_VISITA[pasoActual].objetivo);
  if (!objetivo) {
    return;
  }

  // Lo que vive dentro de la barra de navegación ya está siempre a la
  // vista: no hay que desplazar nada ni esquivar la barra. Si se la
  // esquivara, el recuadro terminaría debajo de ella, iluminando lo que
  // haya en ese lugar en vez del menú.
  if (!barraNavegacion.contains(objetivo)) {
    // Una sección alta no entra entera: se la alinea arriba y se ilumina
    // solo su parte superior, para que quede lugar para el globo.
    const esAlto =
      objetivo.getBoundingClientRect().height > window.innerHeight * 0.6;

    // Instantáneo a propósito, aunque el resto de la página se desplace
    // suave: el recuadro es de posición fija y se calcula apenas termina
    // el salto. Si el desplazamiento siguiera animándose, el objetivo se
    // movería por debajo y el foco quedaría corrido.
    objetivo.scrollIntoView({
      block: esAlto ? "start" : "center",
      behavior: "instant",
    });

    const limiteArriba = barraNavegacion.getBoundingClientRect().height + 8;
    if (objetivo.getBoundingClientRect().top < limiteArriba) {
      window.scrollBy({
        top: objetivo.getBoundingClientRect().top - limiteArriba,
        behavior: "instant",
      });
    }
  }

  posicionarVisita();
}

// Solo coloca el recuadro y el globo según dónde está el objetivo ahora.
// Se usa también al desplazar o redimensionar, para que el foco no se
// despegue de lo que está señalando.
function posicionarVisita() {
  const objetivo = document.querySelector(PASOS_VISITA[pasoActual].objetivo);
  if (!objetivo) {
    return;
  }

  const altoPantalla = window.innerHeight;
  const anchoPantalla = document.documentElement.clientWidth;
  const margen = 8;
  const borde = 4;
  const enLaBarra = barraNavegacion.contains(objetivo);
  const minArriba = enLaBarra
    ? borde
    : barraNavegacion.getBoundingClientRect().height + 8 - margen;

  const caja = objetivo.getBoundingClientRect();

  // El recuadro se recorta contra los bordes: sin esto, un objetivo que
  // toca el borde de la pantalla se sale por el margen que le agregamos.
  const arriba = Math.max(minArriba, caja.top - margen);
  const izquierda = Math.max(borde, caja.left - margen);
  const derecha = Math.min(anchoPantalla - borde, caja.right + margen);
  const altoDeseado = Math.min(caja.height, altoPantalla * 0.55) + margen * 2;
  const abajo = Math.min(altoPantalla - borde, arriba + altoDeseado);

  focoVisita.style.top = `${arriba}px`;
  focoVisita.style.left = `${izquierda}px`;
  focoVisita.style.width = `${Math.max(0, derecha - izquierda)}px`;
  focoVisita.style.height = `${Math.max(0, abajo - arriba)}px`;

  ubicarGlobo(arriba, abajo, izquierda, derecha - izquierda);
}

function ubicarGlobo(focoArriba, focoAbajo, focoIzquierda, focoAncho) {
  const separacion = 12;
  const ancho = globoVisita.offsetWidth;
  const altoGlobo = globoVisita.offsetHeight;
  const anchoPantalla = document.documentElement.clientWidth;
  const altoPantalla = window.innerHeight;

  let arriba = focoAbajo + separacion;
  if (arriba + altoGlobo > altoPantalla - separacion) {
    arriba = focoArriba - altoGlobo - separacion;
  }
  if (arriba < separacion) {
    arriba = Math.max(separacion, (altoPantalla - altoGlobo) / 2);
  }

  const izquierda = Math.min(
    Math.max(separacion, focoIzquierda + focoAncho / 2 - ancho / 2),
    Math.max(separacion, anchoPantalla - ancho - separacion),
  );

  globoVisita.style.top = `${arriba}px`;
  globoVisita.style.left = `${izquierda}px`;
}

function pasoSiguiente() {
  if (pasoActual >= PASOS_VISITA.length - 1) {
    terminarVisita();
    return;
  }
  mostrarPaso(pasoActual + 1);
}

botonVisitaSiguiente.addEventListener("click", pasoSiguiente);
botonVisitaAnterior.addEventListener("click", () => {
  if (pasoActual > 0) {
    mostrarPaso(pasoActual - 1);
  }
});
botonVisitaSaltar.addEventListener("click", terminarVisita);
botonVerVisita.addEventListener("click", iniciarVisita);

document.addEventListener("keydown", (e) => {
  if (!visitaActiva) {
    return;
  }

  if (e.key === "Escape") {
    terminarVisita();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    pasoSiguiente();
  } else if (e.key === "ArrowLeft" && pasoActual > 0) {
    e.preventDefault();
    mostrarPaso(pasoActual - 1);
  }
});

/* ---------------------------------------------------------------
   Service worker (funcionamiento sin conexión)

   Si el navegador no lo soporta, o la página se abre con file:// o sin
   HTTPS, no pasa nada: el registro falla en silencio y la página sigue
   funcionando igual, solo que sin modo offline.
--------------------------------------------------------------- */
function avisarVersionNueva(registro) {
  const aviso = document.getElementById("aviso-actualizacion");
  const boton = document.getElementById("btn-actualizar-version");

  aviso.hidden = false;
  boton.addEventListener(
    "click",
    () => {
      boton.disabled = true;
      boton.textContent = "Actualizando…";
      if (registro.waiting) {
        registro.waiting.postMessage("activar-ahora");
      }
    },
    { once: true },
  );
}

function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  // Nunca se recarga de prepotencia: recargar mientras alguien escribe
  // una observación le borraría lo que estaba cargando. La página se
  // actualiza recién cuando aceptan el aviso.
  // En la primera visita el worker toma control con clients.claim() y eso
  // también dispara controllerchange. Recargar ahí sería una recarga de
  // más: solo interesa cuando se reemplaza a un worker que ya controlaba.
  const habiaWorkerPrevio = Boolean(navigator.serviceWorker.controller);
  let recargando = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recargando || !habiaWorkerPrevio) {
      return;
    }
    recargando = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(
      (registro) => {
        registro.addEventListener("updatefound", () => {
          const entrante = registro.installing;
          if (!entrante) {
            return;
          }

          entrante.addEventListener("statechange", () => {
            // Solo se avisa si ya había una versión controlando la
            // página: en la primera visita no hay nada que actualizar.
            if (
              entrante.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              avisarVersionNueva(registro);
            }
          });
        });
      },
      () => {
        /* sin modo offline, pero la página anda igual */
      },
    );
  });
}

/* ---------------------------------------------------------------
   Arranque
--------------------------------------------------------------- */
refrescarFecha();
actualizarIntensidad();
renderLeyenda();
actualizarInterfaz();
iniciarAvisoPrivacidad();
iniciarRevelado();
registrarServiceWorker();
