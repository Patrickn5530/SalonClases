// js/historial.js

// ESCUDO PROACTIVO para errores asíncronos de Chrome
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
    event.preventDefault();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const escapeHtml = str => String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

  function labelsTour() {
    return {
      nextLabel: 'Siguiente',
      prevLabel: 'Anterior',
      doneLabel: 'Finalizar',
      skipLabel: 'Omitir',
      showProgress: true,
      exitOnOverlayClick: false,
      exitOnEsc: false
    };
  }

  const fechaParaArchivo = fechaStr => {
    try {
      const d = new Date(fechaStr);
      if (!isNaN(d)) return d.toISOString().slice(0,10);
    } catch(e){}
    return (new Date()).toISOString().slice(0,10);
  };

  let datosPlantel = await localforage.getItem('datosPlantel') || {};
  let cicloEscolar = await localforage.getItem('cicloEscolar') || '';

  const footerCiclo = document.getElementById('footerCiclo');
  if (footerCiclo) {
    footerCiclo.textContent = cicloEscolar ? `Desayunos Escolares ciclo: ${cicloEscolar}` : 'Sin ciclo escolar';
  }

  function ordenarAlumnos(a, b) {
    const ga = parseInt(a.grado) || 0, gb = parseInt(b.grado) || 0;
    if (ga !== gb) return ga - gb;
    const gA = (a.grupo || '').toLowerCase(), gB = (b.grupo || '').toLowerCase();
    if (gA !== gB) return gA.localeCompare(gB);
    const na = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombre}`.toLowerCase();
    const nb = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombre}`.toLowerCase();
    return na.localeCompare(nb);
  }

  function encabezadoHTML(plantel, ciclo, modoPDF = false) {
    const escuela = plantel?.nombreEscuela || '';
    const clave = plantel?.claveCentro || '';
    const municipio = plantel?.municipio || '';
    const localidad = plantel?.localidad || '';

    if (modoPDF) {
      return `
        <div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid #000;padding:6px 8px;">
          <div style="flex:0 0 auto;"><img src="img/logoEncabezado1.png" style="height:70px;"></div>
          <div style="flex:1 1 auto;font-size:12px;line-height:1.05;">
            <div style="font-weight:700;">Sistema para el Desarrollo Integral de la Familia del Estado de México</div>
            <div>Dirección de Alimentación y Nutrición Familiar</div>
            <div style="margin-top:6px;font-weight:700;">Escuela: ${escapeHtml(escuela)}</div>
            <div style="font-size:11px;">CCT: ${escapeHtml(clave)} — ${escapeHtml(municipio)}</div>
            ${ciclo ? `<div style="margin-top:4px;font-size:11px;"><strong>Ciclo:</strong> ${escapeHtml(ciclo)}</div>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="encabezado-reporte" style="text-align:center;padding:8px;border-bottom:1px solid #000;margin-bottom:6px;">
        <img src="img/logoEncabezado1.png" style="height:60px;display:block;margin:0 auto 6px;">
        <div style="font-size:13px;line-height:1.05;">
          <strong>Sistema para el Desarrollo Integral de la Familia del Estado de México</strong><br>
          Dirección de Alimentación y Nutrición Familiar
        </div>
        <h4 class="text-center mt-1 mb-1" style="font-size:14px;">Programa "Alimentación Escolar para el Bienestar"</h4>
        <div style="margin-top:6px;font-weight:700;">Escuela: ${escapeHtml(escuela)}</div>
        <div style="font-size:12px;">CCT: ${escapeHtml(clave)}</div>
      </div>
    `;
  }

  function renderLista() {
    const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
    const contenedor = document.getElementById('reportePDF');
    contenedor.innerHTML = '';

    if (!historial.length) {
      contenedor.innerHTML = '<p class="text-center text-white">No hay historial guardado.</p>';
      return;
    }

    historial.slice().reverse().forEach((registro, revIdx) => {
      const originalIndex = historial.length - 1 - revIdx;
      const { fecha, lista } = registro;
      const alumnosReporte = (lista || []).sort(ordenarAlumnos);
      const idReporte = `reporte-${originalIndex}`;

      contenedor.insertAdjacentHTML('beforeend', `
        <div id="${idReporte}" class="pagina-reporte mb-5 p-0 pb-1 border rounded bg-white text-dark">
          ${encabezadoHTML(datosPlantel, cicloEscolar, false)}
          <h6 class="text-center mb-3" style="font-size:12px;">Fecha: ${fecha}</h6>
          <div class="table-responsive tabla-scroll">
            <table class="table table-striped" style="font-size:12px;">
              <thead class="table-light">
                <tr>
                  <th class="text-center">#</th>
                  <th class="text-center">Grado</th>
                  <th class="text-truncate">A. Paterno</th>
                  <th class="text-truncate">A. Materno</th>
                  <th class="text-truncate">Nombre(s)</th>
                  <th class="text-center">Entregado</th>
                  <th class="text-truncate">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                ${alumnosReporte.map((a,i) => `
                  <tr>
                    <td class="text-center">${i+1}</td>
                    <td class="text-center">${a.grado}° ${a.grupo}</td>
                    <td class="text-truncate">${a.apellidoPaterno}</td>
                    <td class="text-truncate">${a.apellidoMaterno}</td>
                    <td class="text-truncate">${a.nombre}</td>
                    <td class="text-center">${a.entregado ? 'SÍ' : 'NO'}</td>
                    <td class="observaciones">${escapeHtml(a.observacion || '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="text-center mt-3 no-print d-flex justify-content-center gap-2 pb-2">
            <button class="btn btn-success exportarBtn btn-sm" data-id="${idReporte}" data-fecha="${fecha}"><i class="fas fa-file-pdf"></i> Exportar en PDF</button>
            <button class="btn btn-danger eliminarBtn btn-sm" data-index="${originalIndex}"><i class="fas fa-trash-alt"></i> Eliminar</button>
          </div>
        </div>
      `);
    });
    attachListeners();
  }

  function attachListeners() {
    document.querySelectorAll('.exportarBtn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const fecha = btn.getAttribute('data-fecha');
        const nodo = document.getElementById(id);
        
        const copia = nodo.cloneNode(true);
        copia.querySelectorAll('.no-print').forEach(e => e.remove());
        
        const encabezado = copia.querySelector('.encabezado-reporte');
        if (encabezado) encabezado.remove();
        const encabezadoPDF = document.createElement('div');
        encabezadoPDF.innerHTML = encabezadoHTML(datosPlantel, cicloEscolar, true);
        copia.insertBefore(encabezadoPDF, copia.firstChild);

        // PIE DE FIRMAS AJUSTADO (Líneas proporcionales al texto)
        const pie = document.createElement('div');
        pie.style.marginTop = '60px';
        pie.style.fontSize = '12px';
        pie.innerHTML = `
          <div style="display:flex; justify-content:space-around; align-items:flex-start;">
            <div style="width:250px; text-align:center;">
              <div style="border-top:1px solid #000; margin-bottom:4px;"></div>
              <strong>Comité de Desayunos Escolares</strong>
            </div>
            <div style="width:250px; text-align:center;">
              <div style="border-top:1px solid #000; margin-bottom:4px;"></div>
              <strong>Dirección Escolar</strong>
            </div>
          </div>
        `;
        copia.appendChild(pie);

        const filename = `desayunos_${fechaParaArchivo(fecha)}.pdf`;
        html2pdf().set({
          margin: [0.4, 0.4, 0.4, 0.4],
          filename,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 3, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(copia).toPdf().get('pdf').then(pdf => pdf.save());
      };
    });

    document.querySelectorAll('.eliminarBtn').forEach(btn => {
      btn.onclick = async function() {
        const idx = this.getAttribute('data-index');
        const { isConfirmed } = await Swal.fire({ title: '¿Eliminar registro?', icon: 'warning', showCancelButton: true });
        if (isConfirmed) {
          const historial = JSON.parse(localStorage.getItem('historialDesayunos'));
          historial.splice(idx, 1);
          localStorage.setItem('historialDesayunos', JSON.stringify(historial));
          renderLista();
        }
      };
    });
  }

  function iniciarTourHistorial() {
    const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
    if (historial.length === 0) return;

    // Asegurar que el primer reporte sea visible antes de apuntar
    const primerReporte = document.querySelector('.pagina-reporte');
    if (primerReporte) primerReporte.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const tour = introJs.tour();
      tour.setOptions({
        steps: [
          { intro: 'Sección de Historial: Aquí se listan los reportes archivados.' },
          { element: '.pagina-reporte:first-child', intro: 'Aquí verás la lista de alumnos (incluye estatus de entrega).' },
          { element: '.exportarBtn:first-child', intro: 'Usa este botón para exportar este reporte a PDF.' },
          { element: '.eliminarBtn:first-child', intro: 'Aquí puedes eliminar este registro.' }
        ],
        ...labelsTour()
      });
      tour.start();
    }, 500);
  }

  renderLista();
  setTimeout(() => {
    if (localStorage.getItem('tourContinuar') === 'historial') {
      localStorage.removeItem('tourContinuar');
      iniciarTourHistorial();
    }
    const verGuia = document.getElementById('verGuia');
    if (verGuia) verGuia.onclick = iniciarTourHistorial;
  }, 1000);
});