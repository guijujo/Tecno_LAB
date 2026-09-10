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
slider.addEventListener('input', () => {
    valorIntensidad.textContent = slider.value;
});

// 2. Capturar la emoción desde el menú desplegable (Select)
const selectEmocion = document.getElementById('emocion-select');
selectEmocion.addEventListener('change', () => {
    emocionSeleccionada = selectEmocion.value;
});

document.querySelector('.descargar').addEventListener('click', (e) => {
    e.preventDefault();
    const registros = JSON.parse(localStorage.getItem('registros_emocionales')) || [];

    if (registros.length === 0) {
        mostrarAviso('No hay registros para descargar todavía.', 'error');
        return;
    }

    const archivo = new Blob([JSON.stringify(registros, null, 2)], { type: 'application/json' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = 'registros-emocionales.json';
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    mostrarAviso('Registros descargados correctamente.', 'exito');
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
        intensidad: parseInt(slider.value),
        observacion: document.getElementById('observacion').value
    };

    const registros = JSON.parse(localStorage.getItem('registros_emocionales')) || [];
    registros.unshift(nuevoRegistro);
    localStorage.setItem('registros_emocionales', JSON.stringify(registros));

    // Limpiar formulario y actualizar vista
    document.getElementById('observacion').value = '';
    selectEmocion.selectedIndex = 0; // Reinicia el menú desplegable
    emocionSeleccionada = '';
    slider.value = 50; // Reinicia el medidor a la mitad
    valorIntensidad.textContent = '50';
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
        document.getElementById('resumen-intensidad').textContent = ultimo.intensidad + '/100';
        document.getElementById('resumen-emocion').textContent = ultimo.emocion;
    } else {
        document.getElementById('resumen-fecha').innerHTML = '<i>Sin registros</i>';
        document.getElementById('resumen-intensidad').innerHTML = '<i>Sin registros</i>';
        document.getElementById('resumen-emocion').innerHTML = '<i>Sin registros</i>';
    }

    // 2. Actualizar Historial
    const listaHistorial = document.getElementById('lista-historial');
    listaHistorial.innerHTML = '';

    if (registros.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'historial-vacio';
        vacio.textContent = 'Todavía no hay registros. Tu primer registro aparecerá aquí.';
        listaHistorial.appendChild(vacio);
    }

    registros.forEach(r => {
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
        intensidad.textContent = `Intensidad: ${r.intensidad}/100`;

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
        document.getElementById('stat-promedio').textContent = '0/100';
        document.getElementById('stat-frecuente').textContent = '-';
        document.getElementById('stat-frecuencias').innerHTML = '';
        return;
    }

    const sumaIntensidad = registros.reduce((acc, curr) => acc + curr.intensidad, 0);
    document.getElementById('stat-promedio').textContent = Math.round(sumaIntensidad / total) + '/100';

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