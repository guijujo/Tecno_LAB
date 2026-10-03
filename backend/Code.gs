const DESTINO_REPORTES = "soporteproyectonosotros@gmail.com";
const CLAVE_HOJA_CUOTAS = "reporte_bugs_quota_sheet_id";
const CLAVE_CACHE_REPORTE = "reporte_bugs_status_";
const MAXIMO_REPORTES_DIARIOS = 3;
const MAXIMO_BYTES_IMAGEN = 4 * 1024 * 1024;
const TIPOS_REPORTE = [
  "visual",
  "funcional",
  "contenido",
  "rendimiento",
  "otro",
];
const CABECERAS_CUOTAS = ["Fecha del servidor", "Identificador anónimo"];

function setupReportes() {
  MailApp.getRemainingDailyQuota();
  const propiedades = PropertiesService.getScriptProperties();
  const hojaId = propiedades.getProperty(CLAVE_HOJA_CUOTAS);
  if (hojaId) {
    const existente = SpreadsheetApp.openById(hojaId);
    Logger.log("Registro privado de cuotas: " + existente.getUrl());
    return existente.getUrl();
  }

  const libro = SpreadsheetApp.create("Control privado de reportes de errores");
  const hoja = libro.getSheets()[0];
  hoja.setName("Cuotas");
  hoja.appendRow(CABECERAS_CUOTAS);
  hoja.setFrozenRows(1);
  propiedades.setProperty(CLAVE_HOJA_CUOTAS, libro.getId());
  Logger.log("Registro privado de cuotas: " + libro.getUrl());
  return libro.getUrl();
}

function doGet(e) {
  const parametros = (e && e.parameter) || {};
  const callback = String(parametros.callback || "");
  const requestId = String(parametros.requestId || "");
  if (
    parametros.action !== "status" ||
    !esUuid_(requestId) ||
    !/^[A-Za-z_$][A-Za-z0-9_$]{0,80}$/.test(callback)
  ) {
    return ContentService.createTextOutput('{"status":"invalid"}')
      .setMimeType(ContentService.MimeType.JSON);
  }

  const resultado =
    CacheService.getScriptCache().get(CLAVE_CACHE_REPORTE + requestId);
  const estado = resultado
    ? JSON.parse(resultado)
    : { status: "unknown" };
  return ContentService.createTextOutput(
    callback + "(" + JSON.stringify(estado) + ");",
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  let requestId = "";
  let bloqueo = null;
  try {
    const contenido = e && e.postData ? e.postData.contents : "";
    const solicitud = JSON.parse(contenido || "{}");
    requestId = String(solicitud.requestId || "");
    if (!esUuid_(requestId)) {
      throw new Error("INVALID_REPORT");
    }

    const cache = CacheService.getScriptCache();
    const estadoExistente = cache.get(CLAVE_CACHE_REPORTE + requestId);
    if (estadoExistente) {
      return respuestaJson_(JSON.parse(estadoExistente));
    }
    guardarEstado_(requestId, { status: "pending" });

    const reporte = validarReporte_(solicitud);
    bloqueo = LockService.getScriptLock();
    if (!bloqueo.tryLock(30000)) {
      guardarEstado_(requestId, { status: "error" });
      return respuestaJson_({ status: "error" });
    }

    const hoja = obtenerHojaCuotas_();
    const ahora = new Date();
    const hoy = Utilities.formatDate(
      ahora,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fechaMinima = Utilities.formatDate(
      desde,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const filas = hoja.getLastRow() > 1
      ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues()
      : [];
    const vigentes = filas.filter(
      (fila) =>
        typeof fila[0] === "string" &&
        fila[0] >= fechaMinima &&
        typeof fila[1] === "string",
    );
    const cantidad = vigentes.filter(
      (fila) => fila[0] === hoy && fila[1] === reporte.identificadorCuota,
    ).length;

    hoja.clearContents();
    hoja.getRange(1, 1, 1, CABECERAS_CUOTAS.length).setValues([
      CABECERAS_CUOTAS,
    ]);
    if (vigentes.length) {
      hoja.getRange(2, 1, vigentes.length, 2).setValues(vigentes);
    }

    if (cantidad >= MAXIMO_REPORTES_DIARIOS) {
      const limite = { status: "limit", count: cantidad };
      guardarEstado_(requestId, limite);
      return respuestaJson_(limite);
    }

    const filaReserva = hoja.getLastRow() + 1;
    hoja.getRange(filaReserva, 1, 1, 2).setValues([
      [hoy, reporte.identificadorCuota],
    ]);
    try {
      enviarReporte_(reporte);
    } catch (error) {
      hoja.deleteRow(filaReserva);
      throw error;
    }

    const resultado = { status: "sent", count: cantidad + 1 };
    guardarEstado_(requestId, resultado);
    return respuestaJson_(resultado);
  } catch (error) {
    console.error("No se pudo procesar un reporte de error:", error.message);
    if (requestId && esUuid_(requestId)) {
      const estado = error.message === "INVALID_REPORT"
        ? { status: "invalid" }
        : { status: "error" };
      guardarEstado_(requestId, estado);
      return respuestaJson_(estado);
    }
    return respuestaJson_({ status: "invalid" });
  } finally {
    if (bloqueo && bloqueo.hasLock()) {
      bloqueo.releaseLock();
    }
  }
}

function validarReporte_(solicitud) {
  const descripcion = limitarTexto_(solicitud.description, 3000).trim();
  const deviceId = String(solicitud.deviceId || "");
  const tipo = String(solicitud.type || "");
  const imagen = solicitud.image || {};
  const mimeType = String(imagen.mimeType || "");
  const base64 = String(imagen.base64 || "");

  if (
    solicitud.website ||
    solicitud.consent !== true ||
    descripcion.length < 20 ||
    !TIPOS_REPORTE.includes(tipo) ||
    !esUuid_(deviceId) ||
    !["image/png", "image/jpeg", "image/webp"].includes(mimeType) ||
    !base64 ||
    base64.length > Math.ceil((MAXIMO_BYTES_IMAGEN * 4) / 3) + 8 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  ) {
    throw new Error("INVALID_REPORT");
  }

  const bytesImagen = Utilities.base64Decode(base64);
  if (
    !bytesImagen.length ||
    bytesImagen.length > MAXIMO_BYTES_IMAGEN ||
    !coincideFirmaImagen_(bytesImagen, mimeType)
  ) {
    throw new Error("INVALID_REPORT");
  }

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    deviceId,
    Utilities.Charset.UTF_8,
  );
  const identificadorCuota = digest
    .map((byte) => ((byte + 256) % 256).toString(16).padStart(2, "0"))
    .join("");

  return {
    tipo,
    descripcion,
    pasos: limitarTexto_(solicitud.steps, 1500).trim(),
    esperado: limitarTexto_(solicitud.expected, 500).trim(),
    pagina: limitarTexto_(solicitud.page, 500).trim(),
    navegador: limitarTexto_(solicitud.browser, 300).trim(),
    mimeType,
    bytesImagen,
    identificadorCuota,
  };
}

function enviarReporte_(reporte) {
  const extensiones = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const tipos = {
    visual: "Visual o de diseño",
    funcional: "Botón o función no funciona",
    contenido: "Texto o información incorrecta",
    rendimiento: "Lentitud o bloqueo",
    otro: "Otro",
  };
  const cuerpo = [
    "Nuevo reporte de error en Registro Emocional",
    "",
    "Tipo: " + tipos[reporte.tipo],
    "Descripción:",
    reporte.descripcion,
    "",
    "Pasos para reproducirlo:",
    reporte.pasos || "No indicados",
    "",
    "Resultado esperado:",
    reporte.esperado || "No indicado",
    "",
    "Página: " + (reporte.pagina || "No indicada"),
    "Navegador: " + (reporte.navegador || "No indicado"),
    "",
    "Se adjunta la imagen seleccionada por la persona.",
  ].join("\n");

  MailApp.sendEmail({
    to: DESTINO_REPORTES,
    subject: "Nuevo reporte de error - Registro Emocional",
    body: cuerpo,
    attachments: [
      Utilities.newBlob(
        reporte.bytesImagen,
        reporte.mimeType,
        "captura-error." + extensiones[reporte.mimeType],
      ),
    ],
    name: "Reporte de errores | Registro Emocional",
  });
}

function obtenerHojaCuotas_() {
  const id = PropertiesService.getScriptProperties().getProperty(
    CLAVE_HOJA_CUOTAS,
  );
  if (!id) {
    throw new Error("El registro de cuotas todavía no está inicializado.");
  }
  return SpreadsheetApp.openById(id).getSheets()[0];
}

function guardarEstado_(requestId, estado) {
  CacheService.getScriptCache().put(
    CLAVE_CACHE_REPORTE + requestId,
    JSON.stringify(estado),
    3600,
  );
}

function respuestaJson_(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}

function limitarTexto_(valor, maximo) {
  return String(valor || "").slice(0, maximo);
}

function coincideFirmaImagen_(bytes, mimeType) {
  const byte = (indice) => (bytes[indice] + 256) % 256;
  if (mimeType === "image/png") {
    return (
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every(
        (esperado, indice) => byte(indice) === esperado,
      )
    );
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && byte(0) === 255 && byte(1) === 216 && byte(2) === 255;
  }
  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

function esUuid_(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(valor));
}
