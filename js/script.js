"use strict";

/* ---------------------------------------------------------------
   Constantes
--------------------------------------------------------------- */
const CLAVE_REGISTROS = "registros_emocionales";
const CLAVE_PRIVACIDAD = "nota_educativa_aceptada";
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

const botonResumen = document.getElementById("btn-resumen");
const contenidoResumen = document.getElementById("contenido-resumen");

const botonBuscarHistorial = document.getElementById("btn-buscar-historial");
const busquedaHistorial = document.getElementById("busqueda-historial");
const campoBusquedaHistorial = document.getElementById(
  "campo-busqueda-historial",
);
const listaHistorial = document.getElementById("lista-historial");

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
function refrescarFecha() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  campoFecha.value = `${anio}-${mes}-${dia}`;
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
}

slider.addEventListener("input", actualizarIntensidad);

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
    "registros-emocionales.txt",
    JSON.stringify(registros, null, 2),
    "text/plain;charset=utf-8",
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

  documento.save("registro-emocional-completo.pdf");
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
function atraparFoco(e) {
  const focuseables = panelActualizar.querySelectorAll(
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
  } else if (!panelActualizar.contains(document.activeElement)) {
    e.preventDefault();
    primero.focus();
  }
}

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
overlayModal.addEventListener("click", cerrarModalActualizar);

document.addEventListener("keydown", (e) => {
  const modalAbierto = panelActualizar.classList.contains("modal-visible");

  if (e.key === "Tab" && modalAbierto) {
    atraparFoco(e);
    return;
  }

  if (e.key !== "Escape") {
    return;
  }

  if (modalAbierto) {
    cerrarModalActualizar();
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
function iniciarAvisoPrivacidad() {
  const contenedor = document.getElementById("contenedorBloqueo");
  const botonEntendido = document.getElementById("btnEntendido");

  let yaAceptado = false;
  try {
    yaAceptado = localStorage.getItem(CLAVE_PRIVACIDAD) === "true";
  } catch (error) {
    yaAceptado = false;
  }

  if (!yaAceptado) {
    contenedor.classList.remove("oculto");
    document.body.classList.add("sin-scroll");
    botonEntendido.focus();
  }

  botonEntendido.addEventListener("click", () => {
    try {
      localStorage.setItem(CLAVE_PRIVACIDAD, "true");
    } catch (error) {
      // Sin almacenamiento el aviso volverá a aparecer; no es bloqueante.
    }

    contenedor.classList.add("oculto");
    document.body.classList.remove("sin-scroll");
  });
}

/* ---------------------------------------------------------------
   Arranque
--------------------------------------------------------------- */
refrescarFecha();
actualizarIntensidad();
actualizarInterfaz();
iniciarAvisoPrivacidad();
