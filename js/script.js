let emocionSeleccionada = '';

// 1. Cargar la fecha actual en formato compatible (AAAA-MM-DD)
const hoy = new Date();
const anio = hoy.getFullYear();
const mes = String(hoy.getMonth() + 1).padStart(2, '0');
const dia = String(hoy.getDate()).padStart(2, '0');
document.getElementById('fecha').value = `${anio}-${mes}-${dia}`;

// Actualizar etiqueta del rango de intensidad
const slider = document.getElementById('intensidad');
const valorIntensidad = document.getElementById('valor-intensidad');
const descripcionIntensidad = document.getElementById('descripcion-intensidad');
const botonBuscarHistorial = document.getElementById('btn-buscar-historial');
const busquedaHistorial = document.getElementById('busqueda-historial');
const campoBusquedaHistorial = document.getElementById('campo-busqueda-historial');

const descripcionesIntensidad = [
    'No se siente intensa',
    'Se siente muy leve',
    'Se siente poco intensa',
    'Se siente algo leve',
    'Se siente moderada-baja',
    'Se siente moderada',
    'Se siente bastante intensa',
    'Se siente intensa',
    'Se siente muy intensa',
    'Se siente casi al máximo',
    'Se siente al máximo'
];

function actualizarIntensidad() {
    const valor = Math.round(Number(slider.value));
    if (valorIntensidad.textContent === String(valor)) {
        return;
    }
    valorIntensidad.textContent = valor;
    descripcionIntensidad.textContent = descripcionesIntensidad[valor];
}

let actualizacionPendiente = false;

slider.addEventListener('input', () => {
    if (actualizacionPendiente) {
        return;
    }

    actualizacionPendiente = true;
    requestAnimationFrame(() => {
        actualizarIntensidad();
        actualizacionPendiente = false;
    });
});

// 2. Capturar la emoción desde el menú desplegable (Select)
const selectEmocion = document.getElementById('emocion-select');
selectEmocion.addEventListener('change', () => {
    emocionSeleccionada = selectEmocion.value;
});

botonBuscarHistorial.addEventListener('click', () => {
    const estaAbierta = !busquedaHistorial.hidden;
    busquedaHistorial.hidden = estaAbierta;
    botonBuscarHistorial.setAttribute('aria-expanded', !estaAbierta);

    if (estaAbierta) {
        campoBusquedaHistorial.value = '';
        actualizarInterfaz();
    } else {
        campoBusquedaHistorial.focus();
    }
});

campoBusquedaHistorial.addEventListener('input', actualizarInterfaz);

document.querySelector('.descargar').addEventListener('click', (e) => {
    e.preventDefault();
    const registros = JSON.parse(localStorage.getItem('registros_emocionales')) || [];

    if (registros.length === 0) {
        mostrarAviso('No hay registros para descargar todavía.', 'error');
        return;
    }

    const archivo = new Blob([JSON.stringify(registros, null, 2)], { type: 'text/plain;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = 'registros-emocionales.txt';
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    mostrarAviso('Registros descargados correctamente.', 'exito');
});

document.querySelector('.descragadocumento').addEventListener('click', async (e) => {
    e.preventDefault();
    const registros = JSON.parse(localStorage.getItem('registros_emocionales')) || [];

    if (registros.length === 0) {
        mostrarAviso('No hay registros para crear el PDF todavía.', 'error');
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarAviso('No se pudo cargar el generador de PDF. Revisá tu conexión.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const documento = new jsPDF();
    const anchoPagina = documento.internal.pageSize.getWidth();
    const margen = 20;
    let posicionY = 20;

    const asegurarEspacio = (altoNecesario) => {
        if (posicionY + altoNecesario > 278) {
            documento.addPage();
            posicionY = 20;
        }
    };

    const agregarParrafo = (texto, opciones = {}) => {
        const tamano = opciones.tamano || 10;
        const interlineado = opciones.interlineado || 5;
        const lineas = documento.splitTextToSize(limpiarTextoPDF(texto), anchoPagina - margen * 2);
        asegurarEspacio(lineas.length * interlineado + 4);
        documento.setFontSize(tamano);
        documento.setFont('helvetica', opciones.negrita ? 'bold' : 'normal');
        documento.text(lineas, margen, posicionY);
        posicionY += lineas.length * interlineado + 4;
    };

    const logo = await cargarImagenParaPDF('img/icono-circular.png');
    if (logo) {
        documento.addImage(logo, 'PNG', margen, posicionY, 22, 22);
    }
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(18);
    documento.text('Registro Emocional', margen + 28, posicionY + 9);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(10);
    documento.text('TECNO-LAB | Proyecto Nosotros', margen + 28, posicionY + 16);
    posicionY += 34;
    documento.setDrawColor(0, 123, 255);
    documento.line(margen, posicionY, anchoPagina - margen, posicionY);
    posicionY += 12;

    agregarParrafo(`Documento generado el ${new Date().toLocaleDateString('es-AR')}`, { tamano: 9 });
    agregarParrafo('Resumen de registros', { tamano: 14, negrita: true });

    const sumaIntensidad = registros.reduce((total, registro) => total + Number(registro.intensidad), 0);
    const promedio = Math.round(sumaIntensidad / registros.length);
    const frecuencias = {};
    registros.forEach(registro => {
        frecuencias[registro.emocion] = (frecuencias[registro.emocion] || 0) + 1;
    });
    const emocionFrecuente = Object.entries(frecuencias).sort((a, b) => b[1] - a[1])[0][0];

    agregarParrafo(`Cantidad de registros: ${registros.length}`);
    agregarParrafo(`Intensidad promedio: ${promedio}/10 - ${descripcionesIntensidad[promedio]}`);
    agregarParrafo(`Emoción más frecuente: ${emocionFrecuente}`);
    agregarParrafo('Frecuencia por emoción', { negrita: true });
    Object.entries(frecuencias).forEach(([emocion, cantidad]) => {
        agregarParrafo(`${emocion}: ${Math.round((cantidad / registros.length) * 100)}% (${cantidad} registro${cantidad === 1 ? '' : 's'})`);
    });
    agregarParrafo('Detalle de registros', { tamano: 14, negrita: true });

    registros.forEach((registro, indice) => {
        asegurarEspacio(38);
        documento.setFillColor(248, 250, 252);
        documento.roundedRect(margen, posicionY - 4, anchoPagina - margen * 2, 30, 2, 2, 'F');
        agregarParrafo(`${indice + 1}. ${registro.emocion} | ${registro.fecha}`, { negrita: true });
        agregarParrafo(`Intensidad: ${registro.intensidad}/10 - ${descripcionesIntensidad[registro.intensidad]}`);
        agregarParrafo(`Observación: ${registro.observacion || 'Sin observación'}`);
        posicionY += 2;
    });

    agregarParrafo('Avisos y privacidad', { tamano: 14, negrita: true });
    agregarParrafo('Este proyecto guarda los registros de forma local en este navegador. El archivo se genera como práctica educativa para poder compartirlo con un profesional o recuperarlo mediante “Actualizar Registros”.');
    agregarParrafo('IMPORTANTE: Este proyecto no reemplaza el acompañamiento de una persona adulta o profesional. Tus registros son privados.');
    agregarParrafo('Registro Emocional Web | TECNO-LAB | Proyecto Nosotros', { tamano: 9 });

    documento.save('registro-emocional-completo.pdf');
    mostrarAviso('Documento PDF descargado correctamente.', 'exito');
});

function limpiarTextoPDF(texto) {
    return String(texto)
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, '-')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function cargarImagenParaPDF(ruta) {
    return new Promise(resolve => {
        const imagen = new Image();
        imagen.onload = () => {
            const lienzo = document.createElement('canvas');
            lienzo.width = imagen.naturalWidth;
            lienzo.height = imagen.naturalHeight;
            lienzo.getContext('2d').drawImage(imagen, 0, 0);
            resolve(lienzo.toDataURL('image/png'));
        };
        imagen.onerror = () => resolve(null);
        imagen.src = ruta;
    });
}

document.getElementById('btn-actualizar-registros').addEventListener('click', (e) => {
    e.preventDefault();
    const registrar = document.getElementById('registrar');
    const panel = document.getElementById('actualizar-registros');
    const resumen = document.getElementById('inicio');
    const estaAbierto = registrar.classList.toggle('panel-actualizar-abierto');
    panel.setAttribute('aria-hidden', !estaAbierto);
    resumen.classList.toggle('resumen-oculto-actualizar', estaAbierto);
    e.currentTarget.setAttribute('aria-expanded', estaAbierto);

    if (estaAbierto) {
        const alturaNavbar = document.querySelector('.navbar').offsetHeight;
        const posicion = registrar.offsetTop - alturaNavbar - 80;
        window.scrollTo({ top: Math.max(0, posicion), behavior: 'smooth' });
    }
});

document.getElementById('btn-cerrar-actualizar').addEventListener('click', () => {
    const registrar = document.getElementById('registrar');
    const panel = document.getElementById('actualizar-registros');
    const resumen = document.getElementById('inicio');
    registrar.classList.remove('panel-actualizar-abierto');
    panel.setAttribute('aria-hidden', 'true');
    resumen.classList.remove('resumen-oculto-actualizar');
    document.getElementById('btn-actualizar-registros').setAttribute('aria-expanded', 'false');
});

document.getElementById('btn-importar-registro').addEventListener('click', () => {
    const campo = document.getElementById('registro-para-pegar');
    const contenido = campo.value
        .replace(/^\uFEFF/, '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
    let registros;

    try {
        registros = JSON.parse(contenido);
    } catch (error) {
        mostrarAviso('El registro pegado no tiene un formato válido.', 'error');
        return;
    }

    if (!Array.isArray(registros) || registros.some(registro => {
        if (!registro || typeof registro.fecha !== 'string' || typeof registro.emocion !== 'string') {
            return true;
        }

        const intensidad = Number(registro.intensidad);
        return !Number.isInteger(intensidad) || intensidad < 0 || intensidad > 100;
    })) {
        mostrarAviso('El registro pegado no tiene datos válidos.', 'error');
        return;
    }

    const registrosValidados = registros.map(registro => {
        const intensidadOriginal = Number(registro.intensidad);
        const intensidad = intensidadOriginal > 10
            ? Math.round(intensidadOriginal / 10)
            : intensidadOriginal;

        return {
            fecha: registro.fecha,
            emocion: registro.emocion,
            intensidad,
            observacion: typeof registro.observacion === 'string' ? registro.observacion : ''
        };
    });

    localStorage.setItem('registros_emocionales', JSON.stringify(registrosValidados));
    campo.value = '';
    actualizarInterfaz();
    mostrarAviso('Registros actualizados correctamente.', 'exito');
});

// Guardar el registro al enviar el formulario
document.getElementById('form-emocion').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!emocionSeleccionada) {
        mostrarAviso('Por favor elegí una emoción antes de guardar.', 'error');
        return;
    }

    // Convertimos la fecha del input (AAAA-MM-DD) a DD/MM/AAAA para el historial
    const fechaInput = document.getElementById('fecha').value;
    const [y, m, d] = fechaInput.split('-');
    const fechaFormateada = `${d}/${m}/${y}`;

    const nuevoRegistro = {
        fecha: fechaFormateada,
        emocion: emocionSeleccionada,
        intensidad: Math.round(Number(slider.value)),
        observacion: document.getElementById('observacion').value
    };

    const registros = JSON.parse(localStorage.getItem('registros_emocionales')) || [];
    registros.unshift(nuevoRegistro);
    localStorage.setItem('registros_emocionales', JSON.stringify(registros));

    // Limpiar formulario y actualizar vista
    document.getElementById('observacion').value = '';
    selectEmocion.selectedIndex = 0; // Reinicia el menú desplegable
    emocionSeleccionada = '';
    slider.value = 5; // Reinicia el medidor a la mitad
    actualizarIntensidad();
    actualizarInterfaz();
    mostrarAviso('Registro guardado correctamente.', 'exito');
});

function mostrarAviso(mensaje, tipo) {
    const aviso = document.getElementById('aviso-pagina');
    aviso.textContent = mensaje;
    aviso.className = `aviso-pagina aviso-${tipo}`;

    clearTimeout(mostrarAviso.temporizador);
    mostrarAviso.temporizador = setTimeout(() => {
        aviso.className = 'aviso-pagina';
        aviso.textContent = '';
    }, 4000);
}

// Actualizar la interfaz con los datos de localStorage
function actualizarInterfaz() {
    const registros = JSON.parse(localStorage.getItem('registros_emocionales')) || [];
    
    // 1. Actualizar Resumen (Inicio)
    if (registros.length > 0) {
        const ultimo = registros[0];
        document.getElementById('resumen-fecha').textContent = ultimo.fecha;
        document.getElementById('resumen-intensidad').textContent = `${ultimo.intensidad}/10 - ${descripcionesIntensidad[ultimo.intensidad]}`;
        document.getElementById('resumen-emocion').textContent = ultimo.emocion;
    } else {
        document.getElementById('resumen-fecha').innerHTML = '<i>Sin registros</i>';
        document.getElementById('resumen-intensidad').innerHTML = '<i>Sin registros</i>';
        document.getElementById('resumen-emocion').innerHTML = '<i>Sin registros</i>';
    }

    // 2. Actualizar Historial
    const listaHistorial = document.getElementById('lista-historial');
    listaHistorial.innerHTML = '';
    const textoBusqueda = campoBusquedaHistorial.value.trim().toLowerCase();
    const registrosFiltrados = textoBusqueda
        ? registros.filter(registro => [
            registro.fecha,
            registro.emocion,
            registro.intensidad,
            descripcionesIntensidad[registro.intensidad],
            registro.observacion
        ].some(valor => String(valor || '').toLowerCase().includes(textoBusqueda)))
        : registros;

    if (registros.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'historial-vacio';
        vacio.textContent = 'Todavía no hay registros. Tu primer registro aparecerá aquí.';
        listaHistorial.appendChild(vacio);
    } else if (registrosFiltrados.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'historial-vacio';
        vacio.textContent = 'No se encontraron registros con esa búsqueda.';
        listaHistorial.appendChild(vacio);
    }

    registrosFiltrados.forEach(r => {
        const articulo = document.createElement('article');
        articulo.className = 'tarjeta-emocion';

        const cabecera = document.createElement('div');
        cabecera.className = 'tarjeta-cabecera';
        const emocion = document.createElement('strong');
        emocion.textContent = r.emocion;
        const fecha = document.createElement('time');
        fecha.textContent = r.fecha;
        cabecera.append(emocion, fecha);

        const intensidad = document.createElement('p');
        intensidad.className = 'tarjeta-intensidad';
        intensidad.textContent = `Intensidad: ${r.intensidad}/10 - ${descripcionesIntensidad[r.intensidad]}`;

        const observacion = document.createElement('p');
        observacion.className = 'tarjeta-observacion';
        observacion.textContent = r.observacion || 'Sin observación';

        articulo.append(cabecera, intensidad, observacion);
        listaHistorial.appendChild(articulo);
    });

    // 3. Actualizar Estadísticas
    const total = registros.length;
    document.getElementById('stat-cantidad').textContent = total;

    if (total === 0) {
        document.getElementById('stat-promedio').textContent = '0/10';
        document.getElementById('stat-frecuente').textContent = '-';
        document.getElementById('stat-frecuencias').innerHTML = '';
        return;
    }

    const sumaIntensidad = registros.reduce((acc, curr) => acc + curr.intensidad, 0);
    const promedio = Math.round(sumaIntensidad / total);
    document.getElementById('stat-promedio').textContent = `${promedio}/10 - ${descripcionesIntensidad[promedio]}`;

    const frecuencias = {};
    registros.forEach(r => {
        frecuencias[r.emocion] = (frecuencias[r.emocion] || 0) + 1;
    });

    let masFrecuente = '-';
    let maxConteo = 0;
    const listaFrecuencias = document.getElementById('stat-frecuencias');
    listaFrecuencias.innerHTML = '';

    // Mapeo completo de las emociones presentes en tu HTML
    const listaEmocionesPosibles = [
        '😀 Felicidad', '😌 Calma', '😟 Ansiedad', '😢 Tristeza', '😠 Enojo', '💪 Motivación',
        '😰 Ansiedad', '😤 Frustración', '😳 Vergüenza', '😥 Culpa', '😡 Orgullo', '🥰 Gratitud',
        '😍 Amor', '😒 Celos', '🤬 Envidia', '😞 Decepción', '😇 Esperanza'
    ];
    
    listaEmocionesPosibles.forEach(e => {
        const conteo = frecuencias[e] || 0;
        if (conteo > 0) { // Solo lista en pantalla las emociones que el usuario ya usó
            const porcentaje = Math.round((conteo / total) * 100);
            if (conteo > maxConteo) {
                maxConteo = conteo;
                masFrecuente = e;
            }
            const li = document.createElement('li');
            li.textContent = `${e}: ${porcentaje}%`;
            listaFrecuencias.appendChild(li);
        }
    });

    document.getElementById('stat-frecuente').textContent = masFrecuente;
}

// Cargar datos al iniciar la página
actualizarInterfaz();

//aviso de privacidad
document.addEventListener("DOMContentLoaded", function() {
    const contenedor = document.getElementById("contenedorBloqueo");
    const btnEntendido = document.getElementById("btnEntendido");
    const cuerpoPagina = document.body;

    // Comprobar si ya aceptó la nota de privacidad anteriormente
    if (!localStorage.getItem("nota_educativa_aceptada")) {
        // Si no ha aceptado, quitamos 'oculto' para bloquear la pantalla
        contenedor.classList.remove("oculto");
        // Bloqueamos el scroll del body
        cuerpoPagina.classList.add("sin-scroll");
    }

    // Al pulsar el botón "Entendido y Continuar"
    btnEntendido.addEventListener("click", function() {
        // Guardamos el consentimiento en el navegador
        localStorage.setItem("nota_educativa_aceptada", "true");
        
        // Ocultamos el bloqueo y restauramos el scroll de la web
        contenedor.classList.add("oculto");
        cuerpoPagina.classList.remove("sin-scroll");
    });
});

// descargar documento PDF
function toggleMenu(event) {
    event.preventDefault(); 
    const dropdown = document.getElementById('dropdown-descargas');
    dropdown.classList.toggle('mostrar-menu');
}

document.getElementById('btn-resumen').addEventListener('click', (event) => {
    event.stopPropagation();
    const boton = event.currentTarget;
    const resumen = document.getElementById('contenido-resumen');
    const estaAbierto = resumen.classList.toggle('mostrar-resumen');
    boton.setAttribute('aria-expanded', estaAbierto);
});

window.onclick = function(event) {
    if (!event.target.matches('#btn-descargas')) {
        const dropdowns = document.getElementsByClassName("submenu-contenido");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('mostrar-menu')) {
                openDropdown.classList.remove('mostrar-menu');
            }
        }
    }

    const resumen = document.getElementById('contenido-resumen');
    const botonResumen = document.getElementById('btn-resumen');
    if (!event.target.closest('.iniciocontenedor') && resumen.classList.contains('mostrar-resumen')) {
        resumen.classList.remove('mostrar-resumen');
        botonResumen.setAttribute('aria-expanded', 'false');
    }
}