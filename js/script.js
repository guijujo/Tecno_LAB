"use strict";

/* ---------------------------------------------------------------
   Constantes
--------------------------------------------------------------- */
const CLAVE_REGISTROS = "registros_emocionales";
const CLAVE_PRIVACIDAD = "nota_educativa_aceptada";
const CLAVE_VISITA = "visita_guiada_vista";
const INTENSIDAD_MIN = 0;
const INTENSIDAD_MAX = 10;
let problemaLecturaRegistros = null;
let bloquearEscrituraRegistros = false;

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
const fondoMenuMovil = document.getElementById("fondo-menu-movil");
const botonActualizar = document.getElementById("btn-actualizar-registros");
const panelActualizar = document.getElementById("actualizar-registros");
const overlayModal = document.getElementById("modal-overlay-bg");
const botonCerrarActualizar = document.getElementById("btn-cerrar-actualizar");
const botonSeleccionarArchivo = document.getElementById("btn-seleccionar-archivo");
const archivoRegistros = document.getElementById("archivo-registros");
const selectorArchivo = document.querySelector(".selector-archivo");
const nombreArchivoSeleccionado = document.getElementById(
  "nombre-archivo-seleccionado",
);
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

const panelReportarBug = document.getElementById("modal-reportar-bug");
const botonAbrirReporteBug = document.getElementById("btn-reportar-bug");
const botonCerrarReporteBug = document.getElementById("btn-cerrar-reportar-bug");
const formularioReporteBug = document.getElementById("form-reportar-bug");
const archivoReporteBug = document.getElementById("reporte-imagen");
const nombreArchivoReporteBug = document.getElementById(
  "reporte-imagen-nombre",
);
const estadoReporteBug = document.getElementById("estado-reporte-bug");
const avisoConfigReportes = document.getElementById("aviso-config-reportes");
const botonEnviarReporteBug = document.getElementById(
  "btn-enviar-reporte-bug",
);
const MAXIMO_TAMANO_IMAGEN_REPORTE = 4 * 1024 * 1024;

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
const filtroEmocionHistorial = document.getElementById(
  "filtro-emocion-historial",
);
const filtroIntensidadHistorial = document.getElementById(
  "filtro-intensidad-historial",
);
const filtroFechaDesdeHistorial = document.getElementById("filtro-fecha-desde");
const filtroFechaHastaHistorial = document.getElementById("filtro-fecha-hasta");
const botonLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
const listaHistorial = document.getElementById("lista-historial");
let registrosEnMemoria = [];
const MAXIMO_REGISTROS_HISTORIAL = 3;
const REGISTROS_POR_PAGINA_HISTORIAL = 10;
let registrosMostradosHistorial = MAXIMO_REGISTROS_HISTORIAL;
const MAXIMO_REGISTROS_DIA = 3;
let registrosMostradosDia = MAXIMO_REGISTROS_DIA;

const calendarioMes = document.getElementById("calendario-mes");
const calendarioDias = document.getElementById("calendario-dias");
const calendarioLeyenda = document.getElementById("calendario-leyenda");
const calendarioDetalle = document.getElementById("calendario-detalle");
const botonMesAnterior = document.getElementById("btn-mes-anterior");
const botonMesSiguiente = document.getElementById("btn-mes-siguiente");
const botonIniciarPausa = document.getElementById("btn-iniciar-pausa");
const etiquetaBotonIniciarPausa = document.getElementById(
  "texto-btn-iniciar-pausa",
);
const botonDetenerPausa = document.getElementById("btn-detener-pausa");
const contenedorPausa = document.getElementById("pausa-calma");
const circuloPausa = document.getElementById("pausa-circulo");
const cuentaPausa = document.getElementById("pausa-cuenta");
const instruccionPausa = document.getElementById("pausa-instruccion");
const indicadoresPausa = document.querySelectorAll(".pausa-ciclo");

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
    informarProblemaRegistros("almacenamiento");
    return [];
  }

  if (!crudo) {
    return [];
  }

  let datos;
  try {
    datos = JSON.parse(crudo);
  } catch (error) {
    informarProblemaRegistros("datos");
    return [];
  }

  if (!Array.isArray(datos)) {
    informarProblemaRegistros("datos");
    return [];
  }

  const normalizados = datos.map(normalizarRegistro);
  const registros = normalizados.filter(Boolean);
  if (registros.length !== datos.length) {
    informarProblemaRegistros("datos");
  }
  return registros;
}

function informarProblemaRegistros(tipo) {
  problemaLecturaRegistros = problemaLecturaRegistros || tipo;
  bloquearEscrituraRegistros = true;
  window.appSoloLectura = true;

  if (window.appLista && typeof window.mostrarErrorApp === "function") {
    window.mostrarErrorApp(problemaLecturaRegistros);
  }
}

function guardarRegistros(registros, opciones = {}) {
  if (
    (bloquearEscrituraRegistros || window.appSoloLectura) &&
    !opciones.permitirReemplazo
  ) {
    window.mostrarErrorApp?.(problemaLecturaRegistros || "almacenamiento");
    return false;
  }

  try {
    localStorage.setItem(CLAVE_REGISTROS, JSON.stringify(registros));
    if (opciones.permitirReemplazo) {
      problemaLecturaRegistros = null;
      bloquearEscrituraRegistros = false;
      window.appSoloLectura = false;
      window.cerrarErrorApp?.();
    }
    return true;
  } catch (error) {
    if (error?.name === "QuotaExceededError") {
      informarProblemaRegistros("espacio");
    } else {
      informarProblemaRegistros("almacenamiento");
    }
    return false;
  }
}

/* ---------------------------------------------------------------
   Avisos
--------------------------------------------------------------- */
function ocultarAvisoPagina() {
  const aviso = document.getElementById("aviso-pagina");
  const botonCerrar = document.getElementById("btn-cerrar-aviso-pagina");

  clearTimeout(mostrarAviso.temporizador);
  aviso.className = "aviso-pagina";
  aviso.querySelector(".aviso-pagina-texto").textContent = "";
  botonCerrar.hidden = true;
  aviso.setAttribute("role", "status");
  aviso.setAttribute("aria-live", "polite");
}

function mostrarAviso(mensaje, tipo) {
  const aviso = document.getElementById("aviso-pagina");
  const textoAviso = aviso.querySelector(".aviso-pagina-texto");
  const botonCerrar = document.getElementById("btn-cerrar-aviso-pagina");

  textoAviso.textContent = mensaje;
  botonCerrar.hidden = false;
  botonCerrar.onclick = ocultarAvisoPagina;
  aviso.className = `aviso-pagina aviso-visible aviso-${tipo}`;
  aviso.setAttribute("role", tipo === "error" ? "alert" : "status");
  aviso.setAttribute("aria-live", tipo === "error" ? "assertive" : "polite");

  clearTimeout(mostrarAviso.temporizador);
  mostrarAviso.temporizador = setTimeout(ocultarAvisoPagina, 4000);
}

/* ---------------------------------------------------------------
   Navegación
--------------------------------------------------------------- */
function abrirMenuMovil(abierto) {
  barraNavegacion.classList.toggle("menu-abierto", abierto);
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  fondoMenuMovil.hidden = !abierto;
}

botonMenu.addEventListener("click", () => {
  abrirMenuMovil(!barraNavegacion.classList.contains("menu-abierto"));
});

fondoMenuMovil.addEventListener("click", () => abrirMenuMovil(false));

// Al tocar un enlace del menú en móvil, el panel debe cerrarse solo.
menuNavegacion.querySelectorAll('a[href^="#"]').forEach((enlace) => {
  enlace.addEventListener("click", () => abrirMenuMovil(false));
});

menuNavegacion
  .querySelector("[data-theme-toggle]")
  .addEventListener("click", () => abrirMenuMovil(false));

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

const FASES_RESPIRACION = [
  { nombre: "inhalar", texto: "Inhalá suavemente", segundos: 4 },
  { nombre: "sostener", texto: "Hacé una pausa", segundos: 2 },
  { nombre: "exhalar", texto: "Exhalá despacio", segundos: 6 },
];
const CICLOS_RESPIRACION = 5;
let temporizadorRespiracion = null;
let faseRespiracionActual = 0;
let ciclosRespiracionCompletados = 0;
let segundosFaseRespiracion = 0;

function actualizarProgresoRespiracion() {
  indicadoresPausa.forEach((indicador, indice) => {
    indicador.classList.toggle(
      "completado",
      indice < ciclosRespiracionCompletados,
    );
  });
}

function mostrarFaseRespiracion() {
  const fase = FASES_RESPIRACION[faseRespiracionActual];
  contenedorPausa.dataset.fase = fase.nombre;
  circuloPausa.dataset.fase = fase.nombre;
  cuentaPausa.textContent = segundosFaseRespiracion;
  instruccionPausa.textContent =
    `Ciclo ${ciclosRespiracionCompletados + 1} de ${CICLOS_RESPIRACION}. ${fase.texto}.`;
  instruccionPausa.classList.remove("fase-cambio");
  void instruccionPausa.offsetWidth;
  instruccionPausa.classList.add("fase-cambio");
}

function finalizarPausa(completada) {
  const devolverFoco = document.activeElement === botonDetenerPausa;
  window.clearInterval(temporizadorRespiracion);
  temporizadorRespiracion = null;
  botonIniciarPausa.disabled = false;
  etiquetaBotonIniciarPausa.textContent = completada
    ? "Repetir pausa"
    : "Empezar de nuevo";
  botonDetenerPausa.disabled = true;
  contenedorPausa.dataset.fase = "lista";
  circuloPausa.dataset.fase = "lista";
  cuentaPausa.textContent = completada ? "✓" : "·";

  if (completada) {
    ciclosRespiracionCompletados = CICLOS_RESPIRACION;
    actualizarProgresoRespiracion();
    instruccionPausa.textContent =
      "Pausa terminada. Gracias por regalarte este momento.";
  } else {
    instruccionPausa.textContent =
      "Pausa detenida. Podés volver cuando quieras.";
  }

  if (devolverFoco) {
    botonIniciarPausa.focus();
  }
}

function avanzarFaseRespiracion() {
  segundosFaseRespiracion -= 1;
  if (segundosFaseRespiracion > 0) {
    cuentaPausa.textContent = segundosFaseRespiracion;
    cuentaPausa.classList.remove("cuenta-pulso");
    void cuentaPausa.offsetWidth;
    cuentaPausa.classList.add("cuenta-pulso");
    return;
  }

  faseRespiracionActual += 1;
  if (faseRespiracionActual >= FASES_RESPIRACION.length) {
    faseRespiracionActual = 0;
    ciclosRespiracionCompletados += 1;
    actualizarProgresoRespiracion();
    if (ciclosRespiracionCompletados >= CICLOS_RESPIRACION) {
      finalizarPausa(true);
      return;
    }
  }

  segundosFaseRespiracion = FASES_RESPIRACION[faseRespiracionActual].segundos;
  mostrarFaseRespiracion();
}

botonIniciarPausa.addEventListener("click", () => {
  ciclosRespiracionCompletados = 0;
  faseRespiracionActual = 0;
  segundosFaseRespiracion = FASES_RESPIRACION[0].segundos;
  actualizarProgresoRespiracion();
  mostrarFaseRespiracion();
  botonIniciarPausa.disabled = true;
  etiquetaBotonIniciarPausa.textContent = "Pausa en curso";
  botonDetenerPausa.disabled = false;
  botonDetenerPausa.focus();
  temporizadorRespiracion = window.setInterval(
    avanzarFaseRespiracion,
    1000,
  );
});

botonDetenerPausa.addEventListener("click", () => finalizarPausa(false));

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
function reiniciarHistorialVisible() {
  registrosMostradosHistorial = MAXIMO_REGISTROS_HISTORIAL;
}

function limpiarFiltrosHistorial() {
  campoBusquedaHistorial.value = "";
  filtroEmocionHistorial.value = "";
  filtroIntensidadHistorial.value = "";
  filtroFechaDesdeHistorial.value = "";
  filtroFechaHastaHistorial.value = "";
  filtroFechaDesdeHistorial.max = "";
  filtroFechaHastaHistorial.min = "";
}

function actualizarOpcionesFiltroEmocion(registros) {
  const seleccionActual = filtroEmocionHistorial.value;
  const emociones = [...new Set(registros.map((registro) => registro.emocion))]
    .filter(Boolean)
    .sort((primera, segunda) => primera.localeCompare(segunda, "es"));
  const opcionTodas = document.createElement("option");
  opcionTodas.value = "";
  opcionTodas.textContent = "Todas";
  filtroEmocionHistorial.replaceChildren(opcionTodas);

  emociones.forEach((emocion) => {
    const opcion = document.createElement("option");
    opcion.value = emocion;
    opcion.textContent = emocion;
    filtroEmocionHistorial.appendChild(opcion);
  });

  filtroEmocionHistorial.value = emociones.includes(seleccionActual)
    ? seleccionActual
    : "";
}

function fechaRegistroParaFiltro(fecha) {
  const partes = partesFecha(fecha);
  if (!partes) return "";

  return `${partes.anio}-${String(partes.mes).padStart(2, "0")}-${String(partes.dia).padStart(2, "0")}`;
}

botonBuscarHistorial.addEventListener("click", () => {
  const estabaAbierta = !busquedaHistorial.hidden;
  busquedaHistorial.hidden = estabaAbierta;
  botonBuscarHistorial.setAttribute("aria-expanded", String(!estabaAbierta));
  botonBuscarHistorial.setAttribute(
    "aria-label",
    estabaAbierta ? "Mostrar filtros del historial" : "Ocultar filtros del historial",
  );

  if (!estabaAbierta) {
    filtroEmocionHistorial.focus();
  }
});

campoBusquedaHistorial.addEventListener("input", () => {
  reiniciarHistorialVisible();
  actualizarInterfaz(true);
});

[
  filtroEmocionHistorial,
  filtroIntensidadHistorial,
  filtroFechaDesdeHistorial,
  filtroFechaHastaHistorial,
].forEach((filtro) => {
  filtro.addEventListener("change", () => {
    filtroFechaHastaHistorial.min = filtroFechaDesdeHistorial.value;
    filtroFechaDesdeHistorial.max = filtroFechaHastaHistorial.value;
    reiniciarHistorialVisible();
    actualizarInterfaz(true);
  });
});

botonLimpiarFiltros.addEventListener("click", () => {
  limpiarFiltrosHistorial();
  reiniciarHistorialVisible();
  actualizarInterfaz(true);
  campoBusquedaHistorial.focus();
});

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
function actualizarInterfaz(soloHistorial = false) {
  const registros = soloHistorial ? registrosEnMemoria : leerRegistros();

  if (!soloHistorial) {
    registrosEnMemoria = registros;

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
  }

  // 2. Historial
  listaHistorial.innerHTML = "";
  if (!soloHistorial) {
    actualizarOpcionesFiltroEmocion(registros);
  }
  const textoBusqueda = campoBusquedaHistorial.value.trim().toLowerCase();
  const emocionSeleccionada = filtroEmocionHistorial.value;
  const intensidadSeleccionada = filtroIntensidadHistorial.value;
  const fechaDesde = filtroFechaDesdeHistorial.value;
  const fechaHasta = filtroFechaHastaHistorial.value;
  const registrosFiltrados = registros.filter((registro) => {
    const coincideTexto =
      !textoBusqueda ||
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
      );
    const coincideEmocion =
      !emocionSeleccionada || registro.emocion === emocionSeleccionada;
    const coincideIntensidad =
      !intensidadSeleccionada ||
      String(registro.intensidad) === intensidadSeleccionada;
    const fechaRegistro = fechaRegistroParaFiltro(registro.fecha);
    const coincideFecha =
      (!fechaDesde && !fechaHasta) ||
      Boolean(
        fechaRegistro &&
          (!fechaDesde || fechaRegistro >= fechaDesde) &&
          (!fechaHasta || fechaRegistro <= fechaHasta),
      );

    return coincideTexto && coincideEmocion && coincideIntensidad && coincideFecha;
  });
  const registrosOrdenados = [...registrosFiltrados].sort((primero, segundo) => {
    const fechaPrimero = partesFecha(primero.fecha);
    const fechaSegundo = partesFecha(segundo.fecha);
    if (!fechaPrimero || !fechaSegundo) return 0;
    return (
      fechaSegundo.anio - fechaPrimero.anio ||
      fechaSegundo.mes - fechaPrimero.mes ||
      fechaSegundo.dia - fechaPrimero.dia
    );
  });

  if (registros.length === 0) {
    listaHistorial.appendChild(
      crearMensajeVacio(
        "Todavía no hay registros. Tu primer registro aparecerá aquí.",
      ),
    );
  } else if (registrosFiltrados.length === 0) {
    listaHistorial.appendChild(
      crearMensajeVacio("No hay registros que coincidan con esos filtros."),
    );
  }

  const registrosVisibles = registrosOrdenados.slice(
    0,
    registrosMostradosHistorial,
  );

  registrosVisibles.forEach((registro) => {
    listaHistorial.appendChild(crearTarjetaRegistro(registro));
  });

  if (registrosFiltrados.length > registrosMostradosHistorial) {
    const botonMostrarMas = document.createElement("button");
    botonMostrarMas.type = "button";
    botonMostrarMas.className = "btn-mostrar-mas";
    botonMostrarMas.textContent = "Mostrar más";
    botonMostrarMas.addEventListener("click", () => {
      registrosMostradosHistorial = Math.min(
        registrosMostradosHistorial + REGISTROS_POR_PAGINA_HISTORIAL,
        registrosFiltrados.length,
      );
      actualizarInterfaz(true);
    });
    listaHistorial.appendChild(botonMostrarMas);
  }

  if (registrosMostradosHistorial > MAXIMO_REGISTROS_HISTORIAL) {
    const botonMostrarMenos = document.createElement("button");
    botonMostrarMenos.type = "button";
    botonMostrarMenos.className = "btn-mostrar-menos";
    botonMostrarMenos.textContent = "Mostrar menos";
    botonMostrarMenos.addEventListener("click", () => {
      reiniciarHistorialVisible();
      actualizarInterfaz(true);
    });
    listaHistorial.appendChild(botonMostrarMenos);
  }

  if (soloHistorial) return;

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
    elemento.className = "frecuencia-item";

    const etiqueta = document.createElement("span");
    etiqueta.className = "frecuencia-emocion";
    etiqueta.textContent = emocion;

    const valor = document.createElement("strong");
    valor.className = "frecuencia-porcentaje";
    valor.textContent = `${porcentaje}%`;

    const grafico = document.createElement("span");
    grafico.className = "frecuencia-grafico";
    grafico.setAttribute("role", "progressbar");
    grafico.setAttribute("aria-label", `Frecuencia de ${emocion}`);
    grafico.setAttribute("aria-valuemin", "0");
    grafico.setAttribute("aria-valuemax", "100");
    grafico.setAttribute("aria-valuenow", String(porcentaje));

    const barra = document.createElement("span");
    barra.className = "frecuencia-barra";
    barra.style.width = `${porcentaje}%`;
    grafico.appendChild(barra);
    elemento.append(etiqueta, valor, grafico);
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
  const altoPagina = documento.internal.pageSize.getHeight();
  const margen = 18;
  const anchoUtil = anchoPagina - margen * 2;
  const limiteInferior = altoPagina - 24;
  const colorTinta = [35, 52, 69];
  const colorSuave = [99, 116, 131];
  const colorPrincipal = [40, 102, 173];
  const colorFondo = [244, 248, 251];
  let posicionY = 57;

  documento.setProperties({
    title: "Informe de registro emocional",
    subject: "Resumen descriptivo de registros emocionales personales",
    author: "TECNO-LAB | Proyecto Nosotros",
    creator: "Registro Emocional Web",
  });

  const dibujarEncabezadoContinuacion = () => {
    documento.setFillColor(...colorPrincipal);
    documento.rect(0, 0, anchoPagina, 16, "F");
    documento.setFont("helvetica", "bold");
    documento.setFontSize(8);
    documento.setTextColor(255, 255, 255);
    documento.text("REGISTRO EMOCIONAL", margen, 10);
    documento.setFont("helvetica", "normal");
    documento.text("INFORME DE SEGUIMIENTO", anchoPagina - margen, 10, {
      align: "right",
    });
  };

  const asegurarEspacio = (altoNecesario) => {
    if (posicionY + altoNecesario > limiteInferior) {
      documento.addPage();
      dibujarEncabezadoContinuacion();
      posicionY = 27;
      return true;
    }
    return false;
  };

  const prepararParrafo = (texto, opciones = {}) => {
    const tamano = opciones.tamano || 9;
    const interlineado = opciones.interlineado || 4.5;
    documento.setFontSize(tamano);
    documento.setFont("helvetica", opciones.negrita ? "bold" : "normal");
    const lineas = documento.splitTextToSize(limpiarTextoPDF(texto), anchoUtil);
    return {
      lineas,
      tamano,
      negrita: Boolean(opciones.negrita),
      alto: lineas.length * interlineado + 2,
    };
  };

  const dibujarParrafo = (parrafo) => {
    documento.setFontSize(parrafo.tamano);
    documento.setFont("helvetica", parrafo.negrita ? "bold" : "normal");
    documento.setTextColor(...colorTinta);
    documento.text(parrafo.lineas, margen, posicionY);
    posicionY += parrafo.alto;
  };

  const logo = await cargarImagenParaPDF("img/icono-circular.png");
  documento.setFillColor(...colorPrincipal);
  documento.rect(0, 0, anchoPagina, 44, "F");
  if (logo) {
    documento.addImage(logo, "PNG", margen, 10, 24, 24);
  }
  documento.setFont("helvetica", "bold");
  documento.setFontSize(19);
  documento.setTextColor(255, 255, 255);
  documento.text("Registro Emocional", margen + 31, 21);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(9);
  documento.setTextColor(225, 237, 247);
  documento.text("TECNO-LAB | Proyecto Nosotros", margen + 31, 28);
  documento.setFontSize(8);
  documento.text("INFORME PERSONAL", anchoPagina - margen, 16, {
    align: "right",
  });
  documento.text(
    `Generado el ${new Date().toLocaleDateString("es-AR")}`,
    anchoPagina - margen,
    23,
    { align: "right" },
  );

  documento.setFont("helvetica", "bold");
  documento.setFontSize(13);
  documento.setTextColor(...colorTinta);
  documento.text("Resumen", margen, posicionY);
  posicionY += 6;

  const { total, promedio, frecuencias, masFrecuente } =
    calcularEstadisticas(registros);

  const separacionTarjetas = 4;
  const anchoTarjeta = (anchoUtil - separacionTarjetas * 2) / 3;
  const tarjetasResumen = [
    {
      titulo: "REGISTROS",
      valor: String(total),
      detalle: total === 1 ? "registro guardado" : "registros guardados",
    },
    {
      titulo: "INTENSIDAD PROMEDIO",
      valor: `${promedio}/10`,
      detalle: descripcionesIntensidad[promedio],
    },
    {
      titulo: "EMOCIÓN MÁS FRECUENTE",
      valor: limpiarTextoPDF(masFrecuente),
      detalle: "según lo registrado",
    },
  ];
  const tarjetasResumenPreparadas = tarjetasResumen.map((tarjeta, indice) => {
    const tamanoValor = indice === 2 ? 9 : 16;
    documento.setFont("helvetica", "bold");
    documento.setFontSize(tamanoValor);
    const lineasValor = documento.splitTextToSize(
      tarjeta.valor,
      anchoTarjeta - 11,
    );
    const yDetalle = Math.max(24, 14 + lineasValor.length * 4.2 + 2);
    return { ...tarjeta, tamanoValor, lineasValor, yDetalle };
  });
  const altoTarjetaResumen = Math.max(
    29,
    ...tarjetasResumenPreparadas.map((tarjeta) => tarjeta.yDetalle + 5),
  );

  tarjetasResumenPreparadas.forEach((tarjeta, indice) => {
    const x = margen + indice * (anchoTarjeta + separacionTarjetas);
    documento.setFillColor(...colorFondo);
    documento.roundedRect(
      x,
      posicionY,
      anchoTarjeta,
      altoTarjetaResumen,
      2,
      2,
      "F",
    );
    documento.setFillColor(...colorPrincipal);
    documento.roundedRect(x, posicionY, 2, altoTarjetaResumen, 1, 1, "F");
    documento.setFont("helvetica", "bold");
    documento.setFontSize(7);
    documento.setTextColor(...colorSuave);
    documento.text(tarjeta.titulo, x + 6, posicionY + 6);
    documento.setFontSize(tarjeta.tamanoValor);
    documento.setTextColor(...colorTinta);
    documento.text(tarjeta.lineasValor, x + 6, posicionY + 14);
    documento.setFont("helvetica", "normal");
    documento.setFontSize(7);
    documento.setTextColor(...colorSuave);
    documento.text(tarjeta.detalle, x + 6, posicionY + tarjeta.yDetalle);
  });
  posicionY += altoTarjetaResumen + 9;

  const agregarTituloSeccion = (titulo) => {
    asegurarEspacio(13);
    documento.setFont("helvetica", "bold");
    documento.setFontSize(12);
    documento.setTextColor(...colorTinta);
    documento.text(titulo, margen, posicionY);
    posicionY += 3;
    documento.setDrawColor(218, 227, 235);
    documento.setLineWidth(0.35);
    documento.line(margen, posicionY, anchoPagina - margen, posicionY);
    posicionY += 7;
  };

  agregarTituloSeccion("Frecuencia por emoción");
  frecuencias.forEach(({ emocion, cantidad, porcentaje }) => {
    const lineasNombre = documento.splitTextToSize(
      limpiarTextoPDF(emocion),
      61,
    );
    const altoFila = Math.max(8, lineasNombre.length * 4 + 2);
    asegurarEspacio(altoFila);
    documento.setFont("helvetica", "normal");
    documento.setFontSize(8);
    documento.setTextColor(...colorTinta);
    documento.text(lineasNombre, margen, posicionY + 3);

    const xBarra = margen + 67;
    const anchoBarra = anchoUtil - 105;
    const yBarra = posicionY + 1;
    documento.setFillColor(231, 238, 244);
    documento.roundedRect(xBarra, yBarra, anchoBarra, 3, 1.5, 1.5, "F");
    if (porcentaje > 0) {
      documento.setFillColor(...colorPrincipal);
      documento.roundedRect(
        xBarra,
        yBarra,
        Math.max(1, (anchoBarra * porcentaje) / 100),
        3,
        1.5,
        1.5,
        "F",
      );
    }
    documento.setFont("helvetica", "bold");
    documento.setTextColor(...colorSuave);
    documento.text(
      `${porcentaje}% | ${cantidad}`,
      anchoPagina - margen,
      posicionY + 3,
      { align: "right" },
    );
    posicionY += altoFila;
  });

  posicionY += 3;
  agregarTituloSeccion("Detalle de registros");

  const registrosPorPeriodo = new Map();
  const registrosOrdenados = [...registros].sort((primero, segundo) => {
    const fechaPrimero = partesFecha(primero.fecha);
    const fechaSegundo = partesFecha(segundo.fecha);
    if (!fechaPrimero || !fechaSegundo) {
      return fechaPrimero ? -1 : fechaSegundo ? 1 : 0;
    }
    return (
      fechaSegundo.anio - fechaPrimero.anio ||
      fechaSegundo.mes - fechaPrimero.mes ||
      fechaSegundo.dia - fechaPrimero.dia
    );
  });

  registrosOrdenados.forEach((registro) => {
    const fecha = partesFecha(registro.fecha);
    const clavePeriodo = fecha
      ? `${fecha.anio}-${String(fecha.mes).padStart(2, "0")}`
      : "fechas-sin-clasificar";
    if (!registrosPorPeriodo.has(clavePeriodo)) {
      registrosPorPeriodo.set(clavePeriodo, {
        fecha,
        registros: [],
      });
    }
    registrosPorPeriodo.get(clavePeriodo).registros.push(registro);
  });

  let indiceRegistro = 0;
  registrosPorPeriodo.forEach((grupo) => {
    const cantidad = grupo.registros.length;
    const intensidadPromedio = Math.round(
      grupo.registros.reduce((suma, registro) => suma + registro.intensidad, 0) /
        cantidad,
    );
    const periodo = grupo.fecha
      ? new Intl.DateTimeFormat("es-AR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(grupo.fecha.anio, grupo.fecha.mes - 1, 1)))
      : "Fechas sin clasificar";
    const tituloPeriodo =
      periodo.charAt(0).toLocaleUpperCase("es-AR") + periodo.slice(1);

    grupo.registros.forEach((registro, indiceEnGrupo) => {
      const xContenido = margen + 7;
      const anchoContenido = anchoUtil - 14;
      const tituloRegistro = documento.splitTextToSize(
        limpiarTextoPDF(`${indiceRegistro + 1}. ${registro.emocion}`),
        anchoContenido - 34,
      );
      const detalleIntensidad = documento.splitTextToSize(
        limpiarTextoPDF(
          `Intensidad ${registro.intensidad}/10 - ${descripcionesIntensidad[registro.intensidad]}`,
        ),
        anchoContenido,
      );
      const observacion = documento.splitTextToSize(
        limpiarTextoPDF(
          `Observación: ${registro.observacion || "Sin observación"}`,
        ),
        anchoContenido,
      );
      const altoCabecera = Math.max(5, tituloRegistro.length * 4.5);
      const altoTarjeta =
        altoCabecera +
        detalleIntensidad.length * 4.2 +
        observacion.length * 4.2 +
        12;
      const nuevaPagina = asegurarEspacio(altoTarjeta + 17);

      if (indiceEnGrupo === 0 || nuevaPagina) {
        documento.setFillColor(...colorFondo);
        documento.roundedRect(margen, posicionY, anchoUtil, 11, 2, 2, "F");
        documento.setFont("helvetica", "bold");
        documento.setFontSize(8);
        documento.setTextColor(...colorTinta);
        documento.text(
          nuevaPagina && indiceEnGrupo > 0
            ? `${tituloPeriodo} (continuación)`
            : tituloPeriodo,
          margen + 5,
          posicionY + 4.5,
        );
        documento.setFont("helvetica", "normal");
        documento.setFontSize(7);
        documento.setTextColor(...colorSuave);
        documento.text(
          `${cantidad} ${cantidad === 1 ? "registro" : "registros"} · promedio ${intensidadPromedio}/10`,
          anchoPagina - margen - 5,
          posicionY + 4.5,
          { align: "right" },
        );
        posicionY += 14;
      }

      documento.setFillColor(...colorFondo);
      documento.setDrawColor(224, 232, 239);
      documento.setLineWidth(0.25);
      documento.roundedRect(
        margen,
        posicionY,
        anchoUtil,
        altoTarjeta,
        2,
        2,
        "FD",
      );
      documento.setFillColor(...colorPrincipal);
      documento.roundedRect(margen, posicionY, 2, altoTarjeta, 1, 1, "F");
      documento.setFont("helvetica", "bold");
      documento.setFontSize(9);
      documento.setTextColor(...colorTinta);
      documento.text(tituloRegistro, xContenido, posicionY + 7);
      documento.setFont("helvetica", "normal");
      documento.setFontSize(8);
      documento.setTextColor(...colorSuave);
      documento.text(
        limpiarTextoPDF(registro.fecha),
        anchoPagina - margen - 5,
        posicionY + 7,
        { align: "right" },
      );
      let yTexto = posicionY + 13;
      documento.setFontSize(8);
      documento.setTextColor(...colorTinta);
      documento.text(detalleIntensidad, xContenido, yTexto);
      yTexto += detalleIntensidad.length * 4.2 + 1;
      documento.setTextColor(...colorSuave);
      documento.text(observacion, xContenido, yTexto);
      posicionY += altoTarjeta + 4;
      indiceRegistro += 1;
    });
  });

  agregarTituloSeccion("Información importante");
  const aviso = prepararParrafo(
    "Este informe presenta un resumen descriptivo de los datos anotados y no constituye una evaluación ni un diagnóstico clínico.",
    { tamano: 8, interlineado: 4 },
  );
  const privacidad = prepararParrafo(
    "Tus registros se guardan en este dispositivo. Al descargar o compartir este archivo, vos decidís con quién hacerlo.",
    { tamano: 8, interlineado: 4 },
  );
  const altoAviso = aviso.alto + privacidad.alto + 8;
  asegurarEspacio(altoAviso);
  documento.setFillColor(240, 246, 250);
  documento.roundedRect(margen, posicionY, anchoUtil, altoAviso, 2, 2, "F");
  posicionY += 5;
  dibujarParrafo(aviso);
  dibujarParrafo(privacidad);
  posicionY += 3;

  const cantidadPaginas = documento.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= cantidadPaginas; pagina += 1) {
    documento.setPage(pagina);
    documento.setDrawColor(218, 227, 235);
    documento.setLineWidth(0.3);
    documento.line(margen, altoPagina - 17, anchoPagina - margen, altoPagina - 17);
    documento.setFont("helvetica", "normal");
    documento.setFontSize(8);
    documento.setTextColor(...colorSuave);
    documento.text("TECNO-LAB | Proyecto Nosotros", margen, altoPagina - 10);
    documento.text(
      `Página ${pagina} de ${cantidadPaginas}`,
      anchoPagina - margen,
      altoPagina - 10,
      { align: "right" },
    );
  }

  documento.save(`informe-emocional-${fechaISO()}.pdf`);
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
  const focuseables = [...panel.querySelectorAll(
    'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
  )].filter(
    (elemento) =>
      !elemento.disabled &&
      !elemento.hidden &&
      elemento.getClientRects().length > 0,
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
  if (panelReportarBug.classList.contains("modal-visible")) {
    return panelReportarBug;
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
  } else if (panel === panelReportarBug) {
    cerrarModalReportarBug();
  }
}

let focoPrevioReporteBug = null;

function mostrarEstadoReporte(texto, tipo = "") {
  estadoReporteBug.textContent = texto;
  estadoReporteBug.className = `estado-reporte-bug${tipo ? ` estado-${tipo}` : ""}`;
  estadoReporteBug.hidden = false;
}

function abrirModalReportarBug() {
  focoPrevioReporteBug =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : botonAbrirReporteBug;
  estadoReporteBug.hidden = true;
  estadoReporteBug.textContent = "";
  estadoReporteBug.className = "estado-reporte-bug";
  abrirMenuMovil(false);
  avisoConfigReportes.hidden = Boolean(
    typeof window.URL_SERVICIO_REPORTES === "string" &&
      window.URL_SERVICIO_REPORTES.trim(),
  );
  panelReportarBug.classList.add("modal-visible");
  panelReportarBug.setAttribute("aria-hidden", "false");
  overlayModal.hidden = false;
  botonAbrirReporteBug.setAttribute("aria-expanded", "true");
  void panelReportarBug.offsetHeight;
  document.getElementById("reporte-tipo").focus();
}

function cerrarModalReportarBug() {
  panelReportarBug.classList.remove("modal-visible");
  panelReportarBug.setAttribute("aria-hidden", "true");
  overlayModal.hidden = true;
  botonAbrirReporteBug.setAttribute("aria-expanded", "false");
  focoPrevioReporteBug?.focus();
  focoPrevioReporteBug = null;
}

botonAbrirReporteBug.addEventListener("click", abrirModalReportarBug);
botonCerrarReporteBug.addEventListener("click", cerrarModalReportarBug);

archivoReporteBug.addEventListener("change", () => {
  const archivo = archivoReporteBug.files[0];
  if (!archivo) {
    nombreArchivoReporteBug.textContent =
      "La imagen es obligatoria para enviar el reporte.";
    return;
  }
  nombreArchivoReporteBug.textContent =
    `${archivo.name} · ${(archivo.size / (1024 * 1024)).toFixed(2)} MB`;
});

function leerImagenReporte(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.addEventListener("load", () => {
      const contenido = String(lector.result || "");
      const separador = contenido.indexOf(",");
      if (separador < 0) {
        reject(new Error("No se pudo leer la imagen seleccionada."));
        return;
      }
      resolve(contenido.slice(separador + 1));
    });
    lector.addEventListener("error", () => {
      reject(new Error("No se pudo leer la imagen seleccionada."));
    });
    lector.readAsDataURL(archivo);
  });
}

function obtenerIdDispositivoReportes() {
  const clave = "reporte-bugs-id-dispositivo";
  let id = localStorage.getItem(clave);
  if (id) {
    return id;
  }
  if (!window.crypto?.randomUUID) {
    throw new Error("Este navegador no permite crear un identificador seguro.");
  }
  id = window.crypto.randomUUID();
  localStorage.setItem(clave, id);
  return id;
}

function consultarEstadoReporte(endpoint, requestId) {
  return new Promise((resolve, reject) => {
    const callback = `recibirReporte_${window.crypto.randomUUID().replaceAll("-", "")}`;
    const script = document.createElement("script");
    const temporizador = window.setTimeout(() => {
      delete window[callback];
      script.remove();
      reject(new Error("Se agotó el tiempo esperando la confirmación."));
    }, 12000);

    window[callback] = (respuesta) => {
      window.clearTimeout(temporizador);
      delete window[callback];
      script.remove();
      resolve(respuesta);
    };
    script.onerror = () => {
      window.clearTimeout(temporizador);
      delete window[callback];
      script.remove();
      reject(new Error("No se pudo consultar el estado del reporte."));
    };
    const separador = endpoint.includes("?") ? "&" : "?";
    script.src =
      `${endpoint}${separador}action=status` +
      `&requestId=${encodeURIComponent(requestId)}` +
      `&callback=${encodeURIComponent(callback)}&_=${Date.now()}`;
    document.head.appendChild(script);
  });
}

async function esperarConfirmacionReporte(endpoint, requestId) {
  const limite = Date.now() + 45000;
  while (Date.now() < limite) {
    const respuesta = await consultarEstadoReporte(endpoint, requestId);
    if (respuesta.status !== "pending") {
      return respuesta;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }
  throw new Error("El envío tardó demasiado y no se pudo confirmar.");
}

formularioReporteBug.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (botonEnviarReporteBug.disabled) {
    return;
  }

  const endpoint = window.URL_SERVICIO_REPORTES;
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    mostrarEstadoReporte(
      "El servicio todavía no está configurado. El reporte no se envió.",
      "error",
    );
    return;
  }

  let endpointSeguro;
  try {
    endpointSeguro = new URL(endpoint);
  } catch (error) {
    mostrarEstadoReporte("La URL del servicio de reportes no es válida.", "error");
    return;
  }
  if (
    endpointSeguro.protocol !== "https:" ||
    endpointSeguro.origin !== "https://script.google.com"
  ) {
    mostrarEstadoReporte(
      "La URL configurada no es un servicio seguro de Google Apps Script.",
      "error",
    );
    return;
  }

  const archivo = archivoReporteBug.files[0];
  if (!archivo) {
    mostrarEstadoReporte("Seleccioná una imagen antes de enviar.", "error");
    archivoReporteBug.focus();
    return;
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(archivo.type)) {
    mostrarEstadoReporte("La imagen debe ser PNG, JPG o WebP.", "error");
    archivoReporteBug.focus();
    return;
  }
  if (archivo.size > MAXIMO_TAMANO_IMAGEN_REPORTE) {
    mostrarEstadoReporte("La imagen supera el máximo permitido de 4 MB.", "error");
    archivoReporteBug.focus();
    return;
  }

  botonEnviarReporteBug.disabled = true;
  formularioReporteBug.setAttribute("aria-busy", "true");
  mostrarEstadoReporte("Preparando la imagen y enviando el reporte…");

  try {
    const datos = new FormData(formularioReporteBug);
    const requestId = window.crypto.randomUUID();
    const payload = {
      requestId,
      deviceId: obtenerIdDispositivoReportes(),
      type: String(datos.get("type") || ""),
      description: String(datos.get("description") || "").trim(),
      steps: String(datos.get("steps") || "").trim(),
      expected: String(datos.get("expected") || "").trim(),
      website: String(datos.get("website") || "").trim(),
      consent: datos.get("consent") === "on",
      page: `${location.origin}${location.pathname}${location.hash}`.slice(0, 500),
      browser: navigator.userAgent.slice(0, 300),
      image: {
        mimeType: archivo.type,
        base64: await leerImagenReporte(archivo),
      },
    };

    await fetch(endpointSeguro.href, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    });

    const resultado = await esperarConfirmacionReporte(
      endpointSeguro.href,
      requestId,
    );
    if (resultado.status === "sent") {
      formularioReporteBug.reset();
      nombreArchivoReporteBug.textContent =
        "La imagen es obligatoria para enviar el reporte.";
      mostrarEstadoReporte(
        `Reporte enviado correctamente. Llevás ${resultado.count} de 3 reportes permitidos hoy en este navegador.`,
        "exito",
      );
    } else if (resultado.status === "limit") {
      mostrarEstadoReporte(
        "Ya alcanzaste el límite de 3 reportes de hoy en este navegador. Podés volver a enviar mañana.",
        "error",
      );
    } else if (resultado.status === "invalid") {
      mostrarEstadoReporte(
        "Revisá los datos: falta información o la imagen no es válida.",
        "error",
      );
    } else {
      mostrarEstadoReporte(
        "El servicio no pudo enviar el reporte. Probá más tarde; no se confirmó ningún envío.",
        "error",
      );
    }
  } catch (error) {
    console.error("No se pudo enviar el reporte de error:", error);
    mostrarEstadoReporte(
      "No se pudo confirmar el envío. Revisá tu conexión y volvé a intentarlo.",
      "error",
    );
  } finally {
    botonEnviarReporteBug.disabled = false;
    formularioReporteBug.removeAttribute("aria-busy");
  }
});

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

  problemaLecturaRegistros = null;
  bloquearEscrituraRegistros = false;
  window.appSoloLectura = false;
  window.cerrarErrorApp?.();

  cerrarModalBorrar();

  // Se deja la interfaz como recién llegada: sin búsqueda abierta, sin
  // día seleccionado y con el calendario de vuelta en el mes actual.
  limpiarFiltrosHistorial();
  busquedaHistorial.hidden = true;
  botonBuscarHistorial.setAttribute("aria-expanded", "false");
  botonBuscarHistorial.setAttribute("aria-label", "Mostrar filtros del historial");
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

function actualizarEtiquetaArchivo(archivo) {
  if (!nombreArchivoSeleccionado) {
    return;
  }

  if (!archivo) {
    nombreArchivoSeleccionado.textContent = "Ningún archivo seleccionado";
    nombreArchivoSeleccionado.classList.remove("activo");
    if (selectorArchivo) {
      selectorArchivo.classList.remove("archivo-cargado");
    }
    return;
  }

  nombreArchivoSeleccionado.textContent = archivo.name;
  nombreArchivoSeleccionado.classList.add("activo");
  if (selectorArchivo) {
    selectorArchivo.classList.add("archivo-cargado");
  }
}

function manejarArchivoSeleccionado(archivo) {
  if (!archivo) {
    return;
  }

  actualizarEtiquetaArchivo(archivo);

  const lector = new FileReader();
  lector.addEventListener("load", (e) => {
    campoPegar.value = e.target.result;
  });
  lector.addEventListener("error", () => {
    mostrarAviso("No se pudo leer el archivo seleccionado.", "error");
  });
  lector.readAsText(archivo);
}

if (selectorArchivo) {
  botonSeleccionarArchivo.addEventListener("click", () => {
    archivoRegistros.click();
  });

  selectorArchivo.addEventListener("dragover", (event) => {
    event.preventDefault();
    selectorArchivo.classList.add("dragover");
  });

  selectorArchivo.addEventListener("dragleave", (event) => {
    if (event.relatedTarget && selectorArchivo.contains(event.relatedTarget)) {
      return;
    }
    selectorArchivo.classList.remove("dragover");
  });

  selectorArchivo.addEventListener("drop", (event) => {
    event.preventDefault();
    selectorArchivo.classList.remove("dragover");
    manejarArchivoSeleccionado(event.dataTransfer?.files?.[0]);
  });

}

archivoRegistros.addEventListener("change", () => {
  manejarArchivoSeleccionado(archivoRegistros.files[0]);
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

  if (!guardarRegistros(registrosValidados, { permitirReemplazo: true })) {
    return;
  }

  campoPegar.value = "";
  // Se limpia para poder volver a elegir el mismo archivo.
  archivoRegistros.value = "";
  actualizarEtiquetaArchivo(null);
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

  // Cierra el detalle solo cuando se navega a otro mes.
  if (diaSeleccionado) {
    const [anioSeleccionado, mesSeleccionado] = diaSeleccionado
      .split("-")
      .map(Number);
    if (anioSeleccionado !== anio || mesSeleccionado !== mes) {
      diaSeleccionado = null;
    }
  }
  renderDetalleDia(dias);
}

function crearCeldaDia(dia, clave, dato, claveHoy) {
  const numero = document.createElement("span");
  numero.className = "dia-numero";
  numero.textContent = dia;

  if (!dato) {
    const vacio = document.createElement("button");
    vacio.type = "button";
    vacio.className = "dia-calendario dia-sin-registros";
    vacio.dataset.dia = clave;
    vacio.setAttribute(
      "aria-label",
      `${dia} de ${NOMBRES_MES[Number(clave.slice(5, 7)) - 1]}: sin registros`,
    );
    if (clave === claveHoy) {
      vacio.classList.add("dia-hoy");
    }
    if (clave === diaSeleccionado) {
      vacio.classList.add("dia-seleccionado");
      vacio.setAttribute("aria-current", "true");
    }
    const marcaVacia = document.createElement("span");
    marcaVacia.className = "dia-vacio-marca";
    marcaVacia.setAttribute("aria-hidden", "true");
    marcaVacia.textContent = "·";
    vacio.appendChild(numero);
    vacio.appendChild(marcaVacia);
    return vacio;
  }

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "dia-calendario";
  boton.dataset.dia = clave;

  const cantidad = dato.registros.length;
  const plural = cantidad === 1 ? "registro" : "registros";
  const emociones = [
    ...new Map(
      dato.registros.map((registro) => [
        claveEmocion(registro.emocion),
        registro.emocion,
      ]),
    ).values(),
  ];
  const textoEmociones = emociones.join(", ");

  if (dato.nivel) {
    boton.classList.add(`nivel-${dato.nivel.clave}`);
    boton.setAttribute(
      "aria-label",
      `${dia} de ${NOMBRES_MES[dato.mes - 1]}: ${dato.nivel.texto}, ${cantidad} ${plural}. Emociones: ${textoEmociones}`,
    );
  } else {
    boton.setAttribute(
      "aria-label",
      `${dia} de ${NOMBRES_MES[dato.mes - 1]}: ${cantidad} ${plural}. Emociones: ${textoEmociones}`,
    );
  }

  if (clave === claveHoy) {
    boton.classList.add("dia-hoy");
  }
  if (clave === diaSeleccionado) {
    boton.classList.add("dia-seleccionado");
    boton.setAttribute("aria-current", "true");
  }

  const emocionesDia = document.createElement("span");
  emocionesDia.className = "dia-emociones";
  emocionesDia.setAttribute("aria-hidden", "true");
  emociones.slice(0, 3).forEach((emocion) => {
    const icono = document.createElement("span");
    icono.className = "dia-emocion";
    icono.textContent = emocion.trim().split(/\s+/)[0] || "•";
    emocionesDia.appendChild(icono);
  });
  if (emociones.length > 3) {
    const restantes = document.createElement("span");
    restantes.className = "dia-emociones-mas";
    restantes.textContent = `+${emociones.length - 3}`;
    emocionesDia.appendChild(restantes);
  }

  boton.append(numero, emocionesDia);
  return boton;
}

function renderDetalleDia(dias) {
  calendarioDetalle.innerHTML = "";

  if (!diaSeleccionado) {
    return;
  }

  const dato = dias.get(diaSeleccionado);
  const [anio, mes, dia] = diaSeleccionado.split("-");
  const titulo = document.createElement("p");
  titulo.className = "detalle-titulo";
  titulo.textContent = `${Number(dia)} de ${NOMBRES_MES[Number(mes) - 1]} de ${anio}`;

  if (!dato) {
    const vacio = document.createElement("p");
    vacio.className = "calendario-sin-registros";
    vacio.textContent = "Todavía no hay registros para este día.";
    calendarioDetalle.append(titulo, vacio);
    return;
  }

  if (dato.nivel) {
    const promedio = document.createElement("span");
    promedio.className = "detalle-promedio";
    promedio.textContent = ` · ${dato.nivel.cara} ${dato.nivel.texto}`;
    titulo.appendChild(promedio);
  }

  const lista = document.createElement("div");
  lista.className = "lista-registros";
  dato.registros.slice(0, registrosMostradosDia).forEach((registro) => {
    lista.appendChild(crearTarjetaRegistro(registro));
  });

  calendarioDetalle.append(titulo, lista);
  if (dato.registros.length > registrosMostradosDia) {
    const botonMostrarMas = document.createElement("button");
    botonMostrarMas.type = "button";
    botonMostrarMas.className = "btn-mostrar-mas";
    botonMostrarMas.textContent = "Mostrar más registros";
    botonMostrarMas.addEventListener("click", () => {
      registrosMostradosDia = Math.min(
        registrosMostradosDia + MAXIMO_REGISTROS_DIA,
        dato.registros.length,
      );
      renderDetalleDia(dias);
    });
    calendarioDetalle.appendChild(botonMostrarMas);
  } else if (registrosMostradosDia > MAXIMO_REGISTROS_DIA) {
    const botonMostrarMenos = document.createElement("button");
    botonMostrarMenos.type = "button";
    botonMostrarMenos.className = "btn-mostrar-menos";
    botonMostrarMenos.textContent = "Mostrar menos";
    botonMostrarMenos.addEventListener("click", () => {
      registrosMostradosDia = MAXIMO_REGISTROS_DIA;
      renderDetalleDia(dias);
    });
    calendarioDetalle.appendChild(botonMostrarMenos);
  }
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
  registrosMostradosDia = MAXIMO_REGISTROS_DIA;
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
  ".cajaregistrar, #pausa-calma, #historial, #calendario, #estadisticas, #pie-pagina";

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
    objetivo: "#pausa-calma",
    titulo: "Una pausa a tu ritmo",
    texto:
      "Si te sirve, seguí unas respiraciones suaves. No hace falta hacerlo perfecto y podés terminar cuando quieras.",
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
      "El color representa el promedio y los emojis muestran las emociones del día. Tocá también los días vacíos para ver su estado.",
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

  // Sigue los bordes visibles completos del objetivo, con un margen seguro.
  const arriba = Math.max(minArriba, caja.top - margen);
  const izquierda = Math.min(
    Math.max(borde, caja.left - margen),
    anchoPantalla - borde,
  );
  const derecha = Math.max(
    izquierda,
    Math.min(anchoPantalla - borde, caja.right + margen),
  );
  const abajo = Math.max(
    arriba,
    Math.min(altoPantalla - borde, caja.bottom + margen),
  );

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
  const arribaLimitado = Math.min(
    Math.max(separacion, arriba),
    Math.max(separacion, altoPantalla - altoGlobo - separacion),
  );

  globoVisita.style.top = `${arribaLimitado}px`;
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

document.addEventListener("keydown", (e) => {
  if (modalAbierto() || visitaActiva || !window.appLista) {
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.altKey) {
    const formulario = document.getElementById("form-emocion");
    if (formulario && (e.target instanceof Element) && formulario.contains(e.target)) {
      e.preventDefault();
      formulario.requestSubmit();
    }
    return;
  }

  const destino =
    e.target instanceof Element ? e.target : null;
  if (
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    e.shiftKey ||
    destino?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
  ) {
    return;
  }

  const seccion = (id) => document.getElementById(id);
  const enfocarSeccion = (id, selector) => {
    abrirMenuMovil(false);
    const destinoSeccion = seccion(id);
    destinoSeccion?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (selector) {
      destinoSeccion?.querySelector(selector)?.focus({ preventScroll: true });
    }
  };

  switch (e.key.toLowerCase()) {
    case "r":
      e.preventDefault();
      enfocarSeccion("registrar", "#emocion-select");
      break;
    case "h":
      e.preventDefault();
      enfocarSeccion("historial");
      break;
    case "f":
      e.preventDefault();
      enfocarSeccion("historial", "#campo-busqueda-historial");
      break;
    case "p":
      e.preventDefault();
      enfocarSeccion("pausa-calma");
      (temporizadorRespiracion
        ? botonDetenerPausa
        : botonIniciarPausa
      ).click();
      break;
    default:
      break;
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
  const botonCerrar = document.getElementById("btn-cerrar-aviso-actualizacion");

  aviso.hidden = false;
  botonCerrar.onclick = () => {
    aviso.hidden = true;
  };
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
window.marcarAppLista();
if (problemaLecturaRegistros) {
  window.mostrarErrorApp(problemaLecturaRegistros);
}
