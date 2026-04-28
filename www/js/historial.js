// js/historial.js

document.addEventListener('DOMContentLoaded', async () => {
  // ---------- HELPERS ----------
  const escapeHtml = str => String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

  const fechaParaArchivo = fechaStr => {
    try {
      const d = new Date(fechaStr);
      if (!isNaN(d)) return d.toISOString().slice(0,10);
    } catch(e){}
    return (new Date()).toISOString().slice(0,10);
  };

  // ---------- CARGA CONFIGURACIÓN (datosPlantel & ciclo) ----------
  let datosPlantel = null;
  let cicloEscolar = null;
  try {
    datosPlantel = await localforage.getItem('datosPlantel');
    cicloEscolar = await localforage.getItem('cicloEscolar');

    // compatibilidad: leer claves individuales si no existe objeto completo
    if (!datosPlantel) {
      const municipio = await localforage.getItem('municipio');
      const localidad = await localforage.getItem('localidad');
      const nombreEscuela = await localforage.getItem('nombreEscuela');
      const claveCentro = await localforage.getItem('claveCentro');
      if (municipio || localidad || nombreEscuela || claveCentro) {
        datosPlantel = {
          municipio: municipio || '',
          localidad: localidad || '',
          nombreEscuela: nombreEscuela || '',
          claveCentro: claveCentro || ''
        };
      }
    }
  } catch (err) {
    console.error('Error leyendo configuración:', err);
    datosPlantel = datosPlantel || {};
    cicloEscolar = cicloEscolar || '';
  }
  datosPlantel = datosPlantel || {};
  cicloEscolar = cicloEscolar || '';

  // Actualizar footer ciclo (igual que en otras pantallas)
  const footerCiclo = document.getElementById('footerCiclo');
  if (footerCiclo) {
    footerCiclo.textContent = cicloEscolar ? `Desayunos Escolares ciclo: ${cicloEscolar}` : 'Sin ciclo escolar definido';
  }

  // ---------- ORDENAMIENTO ----------
  const ordenarAlumnos = (a, b) => {
    const ga = parseInt(a.grado) || 0, gb = parseInt(b.grado) || 0;
    if (ga !== gb) return ga - gb;
    const gA = (a.grupo || '').toLowerCase(), gB = (b.grupo || '').toLowerCase();
    if (gA !== gB) return gA.localeCompare(gB);
    const na = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombre}`.toLowerCase();
    const nb = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombre}`.toLowerCase();
    return na.localeCompare(nb);
  };

  // ---------- RENDER DEL ENCABEZADO (HTML para vista y para PDF) ----------
  function encabezadoHTML(plantel, ciclo, modoPDF = false) {
    const escuela = plantel?.nombreEscuela || '';
    const clave = plantel?.claveCentro || plantel?.clave || '';
    const municipio = plantel?.municipio || '';
    const localidad = plantel?.localidad || '';

    // Para PDF: logo a la izquierda y texto a la derecha alineado verticalmente
    if (modoPDF) {
      return `
        <div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid #000;padding:6px 8px;">
          <div style="flex:0 0 auto;">
            <img src="img/logoEncabezado1.png" alt="logo" style="height:70px;display:block;">
          </div>
          <div style="flex:1 1 auto;font-size:12px;line-height:1.05;">
            <div style="font-weight:700;">Sistema para el Desarrollo Integral de la Familia del Estado de México</div>
            <div>Dirección de Alimentación y Nutrición Familiar</div>
            <div>Subdirección de Asistencia Alimentaria a Menores Escolares</div>
            <div style="margin-top:6px;font-weight:700;">Escuela: ${escapeHtml(escuela)}</div>
            <div style="font-size:11px;">CCT: ${escapeHtml(clave)} — ${escapeHtml(municipio)} — ${escapeHtml(localidad)}</div>
            ${ciclo ? `<div style="margin-top:6px;font-size:11px;"><strong>Ciclo:</strong> ${escapeHtml(ciclo)}</div>` : ''}
          </div>
        </div>
      `;
    }

    // Para vista en app: imagen arriba (centrada) y texto debajo (más compacto)
    // Aquí se coloca "Modalidad del programa" y "Desayuno frío" en la misma fila
    return `
      <div class="encabezado-reporte" style="text-align:center;padding:8px;border-bottom:1px solid #000;margin-bottom:6px;">
        <img src="img/logoEncabezado1.png" alt="logo" style="height:60px;display:block;margin:0 auto 6px;">
        <div style="font-size:13px;line-height:1.05;">
          <strong>Sistema para el Desarrollo Integral de la Familia del Estado de México</strong><br>
          Dirección de Alimentación y Nutrición Familiar<br>
          Subdirección de Asistencia Alimentaria a Menores Escolares
        </div>

        <h4 class="text-center mt-1 mb-1 w-100" style="font-size:14px;">Programa "Alimentación Escolar para el Bienestar"</h4>
        <h5 class="text-center mb-2 w-100" style="font-size:13px;">Registro Diario de Entrega y Consumo</h5>

        <!-- fila: modalidad + etiqueta -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:13px;font-weight:600;">Modalidad del programa:</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="font-size:13px;">Desayuno frío</div>
            <!-- cuadrado relleno negro -->
            <span style="display:inline-block;width:14px;height:14px;background:#000;border-radius:2px;vertical-align:middle;"></span>
          </div>
        </div>

        <div style="margin-top:6px;font-weight:700;">Escuela: ${escapeHtml(escuela)}</div>
        <div style="font-size:12px;">CCT: ${escapeHtml(clave)}</div>
        <div style="font-size:12px;">Municipio: ${escapeHtml(municipio)}</div>
        <div style="font-size:12px;">Localidad: ${escapeHtml(localidad)}</div>
        ${ciclo ? `<div style="margin-top:6px;font-size:12px;"><strong>Ciclo:</strong> ${escapeHtml(ciclo)}</div>` : ''}
      </div>
    `;
  }

  // ---------- RENDER PRINCIPAL (lista de reportes) ----------
  const contenedor = document.getElementById('reportePDF');

  function renderLista() {
    const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
    contenedor.innerHTML = '';

    if (!historial.length) {
      contenedor.innerHTML = '<p class="text-center">No hay historial guardado.</p>';
      return;
    }

    // mostramos en orden inverso (más reciente arriba)
    historial.slice().reverse().forEach((registro, revIdx) => {
      const originalIndex = historial.length - 1 - revIdx;
      const { fecha, lista } = registro;
      const entregados = (lista || []).filter(a => a.entregado).sort(ordenarAlumnos);
      const idReporte = `reporte-${originalIndex}`;

      const html = `
        <div id="${idReporte}" class="pagina-reporte mb-5 p-0 pb-1 border rounded bg-white">
          ${encabezadoHTML(datosPlantel, cicloEscolar, false)}

          <h6 class="text-center mb-3 w-100" style="font-size:12px;">Fecha: ${escapeHtml(fecha)}</h6>

          <div class="table-responsive tabla-scroll">
            <table class="table table-striped" style="font-size:12px;">
              <thead class="table-light">
                <tr>
                  <th class="text-center">#</th>
                  <th class="text-center">Grado</th>
                  <th class="text-truncate">A. Paterno</th>
                  <th class="text-truncate">A. Materno</th>
                  <th class="text-truncate">Nombre(s)</th>
                  <th class="text-truncate">Observaciones</th>
                </tr>
              </thead>

              <tbody>
                ${entregados.map((a,i) => `
                  <tr>
                    <td class="text-center">${i+1}</td>
                    <td class="text-center">${escapeHtml(a.grado)}° ${escapeHtml(a.grupo)}</td>
                    <td class="text-truncate">${escapeHtml(a.apellidoPaterno)}</td>
                    <td class="text-truncate">${escapeHtml(a.apellidoMaterno)}</td>
                    <td class="text-truncate">${escapeHtml(a.nombre)}</td>
                    <td class="observaciones">${escapeHtml(a.observacion || '')}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr><td colspan="6"><strong>Total entregados: ${entregados.length}</strong></td></tr>
              </tfoot>
            </table>
          </div>

          <div class="text-center mt-3 no-print" style="display:flex;gap:8px;justify-content:center;padding-bottom:8px;">
            <button class="btn btn-success exportarBtn btn-sm" data-id="${idReporte}" data-fecha="${escapeHtml(fecha)}"><i class="fas fa-file-pdf"></i> Exportar en PDF</button>
            <button class="btn btn-danger eliminarBtn btn-sm" data-index="${originalIndex}"><i class="fas fa-trash-alt"></i> Eliminar</button>
          </div>
        </div>
      `;
      contenedor.insertAdjacentHTML('beforeend', html);
    });

    attachListeners();
  }

  // ---------- FUNCIONES: exportar, eliminar ----------
  function attachListeners() {
    // exportar
    document.querySelectorAll('.exportarBtn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const fecha = btn.getAttribute('data-fecha') || new Date().toLocaleString();
        const nodo = document.getElementById(id);
        if (!nodo) return;

        // clonamos, removemos botones no-print y preparamos encabezado en modo PDF
        const copia = nodo.cloneNode(true);
        copia.querySelectorAll('.no-print').forEach(e => e.remove());

        // Reemplazar encabezado visual por versión para PDF (imagen izq, texto der)
        const encabezado = copia.querySelector('.encabezado-reporte');
        if (encabezado) encabezado.remove();
        const encabezadoPDF = document.createElement('div');
        encabezadoPDF.innerHTML = encabezadoHTML(datosPlantel, cicloEscolar, true);
        copia.insertBefore(encabezadoPDF, copia.firstChild);

        // Ajustes estilo
        copia.style.width = '100%';
        copia.style.maxWidth = '100%';
        copia.style.fontSize = '11px';
        const tabla = copia.querySelector('table');
        if (tabla) {
          tabla.style.width = '100%';
          tabla.style.tableLayout = 'auto';
          tabla.style.wordWrap = 'break-word';
        }

        // Pie de firmas
        const pie = document.createElement('div');
        pie.style.marginTop = '60px';
        pie.style.fontSize = '12px';
        pie.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:20px;">
            <div style="width:45%;text-align:center;">
              ___________________________<br>
              <strong>Comité de Desayunos Escolares</strong>
            </div>
            <div style="width:45%;text-align:center;">
              ___________________________<br>
              <strong>Dirección Escolar</strong>
            </div>
          </div>
        `;
        copia.appendChild(pie);

        // Opciones html2pdf
        const filename = `desayunos_${fechaParaArchivo(fecha)}.pdf`;
        const opciones = {
          margin: [0.4, 0.4, 0.4, 0.4],
          filename,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 3, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opciones).from(copia).save();
      };
    });

    // eliminar registro
    document.querySelectorAll('.eliminarBtn').forEach(btn => {
      btn.onclick = async () => {
        const idx = Number(btn.getAttribute('data-index'));
        if (isNaN(idx)) return;
        const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
        const registro = historial[idx];
        if (!registro) return;
        const confirmado = await Swal.fire({
          title: '¿Eliminar registro?',
          text: `Se eliminará el historial del día: ${registro.fecha}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        });
        if (confirmado.isConfirmed) {
          historial.splice(idx, 1);
          localStorage.setItem('historialDesayunos', JSON.stringify(historial));
          renderLista();
          Swal.fire('Eliminado','Registro eliminado correctamente','success');
        }
      };
    });
  }

  // ---------- TOUR para historial ----------
  async function iniciarTourHistorial(isFromPrev = false) {
    const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];

    // Si no hay historial, creamos un demo (preferimos usar alumnos guardados; si no hay, generamos ejemplos)
    if (!historial.length) {
      let alumnosGenerales = await localforage.getItem('alumnos') || [];

      if (!alumnosGenerales || alumnosGenerales.length === 0) {
        // generar alumnos demo si no hay alumnos reales
        alumnosGenerales = [
          { nombre: 'María', apellidoPaterno: 'López', apellidoMaterno: 'González', grado: 1, grupo: 'A' },
          { nombre: 'Juan', apellidoPaterno: 'Pérez', apellidoMaterno: 'García', grado: 1, grupo: 'A' },
          { nombre: 'Ana', apellidoPaterno: 'Ruiz', apellidoMaterno: 'Sánchez', grado: 2, grupo: 'B' },
          { nombre: 'Luis', apellidoPaterno: 'Hernández', apellidoMaterno: 'Torres', grado: 3, grupo: 'A' },
          { nombre: 'Sofía', apellidoPaterno: 'Álvarez', apellidoMaterno: 'Martínez', grado: 4, grupo: 'B' },
          { nombre: 'Carlos', apellidoPaterno: 'Ramírez', apellidoMaterno: 'Vega', grado: 5, grupo: 'A' }
        ];
      }

      const demoRegistro = {
        fecha: (new Date()).toLocaleString(),
        lista: alumnosGenerales.slice(0, 6).map(a => ({ ...a, entregado: true, observacion: '' })),
        demo: true
      };

      const nuevoHist = historial.concat([demoRegistro]);
      localStorage.setItem('historialDesayunos', JSON.stringify(nuevoHist));
      renderLista();

      // encontrar el índice original del demo (es el último índice del arreglo original)
      const indiceOriginal = (historial.length); // antes de push, historial.length era 0, demo quedó en índice 0

      // dar tiempo a que el DOM renderice
      setTimeout(() => runTourForKey(indiceOriginal, true), 600);
      return;
    }

    // hay historial, ejecutar tour sobre el más reciente (último elemento)
    runTourForKey(historial.length - 1, false);
  }

  function runTourForKey(indexKey, isDemo) {
    // indexKey es el índice en el arreglo original (0..n-1)
    const pasos = [
      { intro: 'Esta es la sección de Historial: aquí se listan los reportes de desayunos archivados.' },
          { element: '#reporte-' + indexKey, intro: 'Aquí verás la lista de alumnos que recibieron desayuno (ordenados por grado y grupo).' },
      { element: '#reporte-' + indexKey + ' .exportarBtn', intro: 'Usa este botón para exportar este reporte a PDF.' },
      { element: '#reporte-' + indexKey + ' .eliminarBtn', intro: 'Aquí puedes eliminar este registro.' },
      { element: '#footerCiclo', intro: 'Aquí se muestra el ciclo escolar configurado.' }
    ];
    const tour = introJs();
    tour.setOptions({ steps: pasos, nextLabel: 'Siguiente', prevLabel: 'Anterior', doneLabel: 'Finalizar', skipLabel: 'Omitir', showProgress: true, exitOnOverlayClick: false, exitOnEsc: false });
    tour.oncomplete(async () => {
      // si era demo, eliminarlo
      if (isDemo) {
        const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
        // buscar registro demo por la propiedad demo:true
        const idxDemo = historial.findIndex(r => r.demo === true);
        if (idxDemo >= 0) {
          historial.splice(idxDemo, 1);
          localStorage.setItem('historialDesayunos', JSON.stringify(historial));
        }
        renderLista();
      }
      // preguntar si sigue al siguiente módulo (configurar)
      const resp = await Swal.fire({
        title: '¿Continuar recorrido?',
        text: '¿Quieres seguir con la siguiente sección (Configurar)?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      });
      if (resp.isConfirmed) {
        localStorage.setItem('tourContinuar', 'configurar');
        window.location.href = 'configurar.html';
      }
    });
    tour.start();
  }

  // ---------- Inicial render ----------
  renderLista();

  // ---------- Si venimos desde la página anterior del tour (ej. desayunos) ----------
  if (localStorage.getItem('tourContinuar') === 'historial') {
    localStorage.removeItem('tourContinuar');
    // iniciar el tour inicial
    iniciarTourHistorial(true);
  }

  // ---------- Botón "Ver guía" (si existe en header) para tour manual ----------
  const verGuia = document.getElementById('verGuia');
  if (verGuia) verGuia.addEventListener('click', () => iniciarTourHistorial(false));
});
