// js/desayunos.js
let alumnosDesayuno = JSON.parse(localStorage.getItem('alumnosDesayuno')) || [];

// UTIL
function generarId() {
  return Date.now() + Math.random().toString(36).substring(2, 9);
}

function guardarDesayunos() {
  localStorage.setItem('alumnosDesayuno', JSON.stringify(alumnosDesayuno));
}

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

function capitalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

async function actualizarFooter() {
  const footer = document.getElementById('footerDesayunos');
  try {
    const ciclo = await localforage.getItem('cicloEscolar');
    footer.textContent = ciclo ? `Desayunos Escolares ciclo: ${ciclo}` : 'Desayunos Escolares';
  } catch (e) {
    footer.textContent = 'Desayunos Escolares';
  }
}

// FORMULARIO AGREGAR
function abrirFormularioDesayuno() {
  Swal.fire({
    title: 'Agregar Alumno',
    html: `
      <div class="text-start">
        <input id="apellidoPaterno" class="form-control mb-2" placeholder="Apellido Paterno">
        <input id="apellidoMaterno" class="form-control mb-2" placeholder="Apellido Materno">
        <input id="nombre" class="form-control mb-2" placeholder="Nombre(s)">
        <div class="d-flex gap-2">
           <select id="grado" class="form-select mb-2 w-50">
            <option disabled selected value="">Grado:</option>
            ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}">${n}°</option>`).join('')}
          </select>
          <select id="grupo" class="form-select w-50">
            <option disabled selected value="">Grupo:</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </div>
      </div>
    `,
    confirmButtonText: 'Aceptar',
    showCancelButton: true,
    preConfirm: () => {
      const nombreRaw = document.getElementById('nombre').value.trim();
      const apRaw = document.getElementById('apellidoPaterno').value.trim();
      const amRaw = document.getElementById('apellidoMaterno').value.trim();
      const grado = document.getElementById('grado').value;
      const grupo = document.getElementById('grupo').value;

      if (!nombreRaw || !apRaw || !amRaw || !grado || !grupo) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }
      return { nombre: capitalizar(nombreRaw), apellidoPaterno: capitalizar(apRaw), apellidoMaterno: capitalizar(amRaw), grado, grupo };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const wrapperBefore = document.getElementById('tablaWrapper');
      const prevScrollTop = wrapperBefore ? wrapperBefore.scrollTop : 0;

      alumnosDesayuno.push({ id: generarId(), ...result.value, entregado: false });
      guardarDesayunos();
      mostrarListaEntrega();

      requestAnimationFrame(() => {
        const wrapperAfter = document.getElementById('tablaWrapper');
        if (wrapperAfter) wrapperAfter.scrollTop = prevScrollTop;
      });
      Swal.fire({ icon: 'success', title: 'Alumno agregado', showConfirmButton: false, timer: 1400 });
    }
  });
}

function mostrarListaEntrega(focusId = null) {
  const alumnosOrdenados = [...alumnosDesayuno].sort((a, b) => {
    const ga = Number(a.grado) || 0;
    const gb = Number(b.grado) || 0;
    if (ga !== gb) return ga - gb;
    const gA = (a.grupo || '').toLowerCase();
    const gB = (b.grupo || '').toLowerCase();
    if (gA !== gB) return gA.localeCompare(gB, 'es', { sensitivity: 'base' });
    return (a.apellidoPaterno || '').localeCompare((b.apellidoPaterno || ''), 'es', { sensitivity: 'base' });
  });

  let totalEntregados = alumnosOrdenados.filter(a => a.entregado).length;
  let totalAlumnos = alumnosOrdenados.length;

  let tabla = `
    <div id="tablaWrapper" class="tabla-scroll">
      <table id="tablaDesayuno" class="table table-striped">
        <thead class="sticky-top">
          <tr>
            <th class="text-center">#</th>
            <th>Grado</th>
            <th class="text-truncate">A. Paterno</th>
            <th class="text-truncate">A. Materno</th>
            <th class="text-truncate">Nombre(s)</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  alumnosOrdenados.forEach((alumno, index) => {
    const filaClase = alumno.entregado ? 'table-success' : '';
    // Ajuste de botones estilo Colectas (más pequeños y compactos)
    tabla += `
      <tr class="${filaClase}" data-id="${alumno.id}">
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${alumno.grado}° ${alumno.grupo}</td>
        <td class="text-truncate">${alumno.apellidoPaterno}</td>
        <td class="text-truncate">${alumno.apellidoMaterno}</td>
        <td class="text-truncate">${alumno.nombre}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center gap-1">
            <i class="fas fa-check-circle ${alumno.entregado ? 'text-success' : 'text-secondary'}" 
               style="cursor:pointer; font-size: 1.1rem;" onclick="marcarEntregado('${alumno.id}')"></i>
            <i class="fas fa-edit text-primary" 
               style="cursor:pointer; font-size: 1.1rem;" onclick="editarAlumno('${alumno.id}')"></i>
            <i class="fas fa-trash-alt text-danger" 
               style="cursor:pointer; font-size: 1.1rem;" onclick="eliminarAlumno('${alumno.id}')"></i>
          </div>
        </td>
      </tr>
    `;
  });

  tabla += `
        </tbody>
        <tfoot style="position: sticky; bottom: 0; background: #f8f9fa; z-index:10;">
          <tr>
            <td colspan="6" class="text-start">
              <small><strong>Total: ${totalAlumnos}</strong> | <strong class="text-success">Entregados: ${totalEntregados}</strong></small>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  document.getElementById('listaDesayunos').innerHTML = tabla;

  if (focusId) {
    requestAnimationFrame(() => {
      const wrapper = document.getElementById('tablaWrapper');
      const row = wrapper ? wrapper.querySelector(`tbody tr[data-id="${focusId}"]`) : null;
      if (wrapper && row) {
        const offsetTop = (row.getBoundingClientRect().top - wrapper.getBoundingClientRect().top) + wrapper.scrollTop;
        wrapper.scrollTo({ top: offsetTop - (wrapper.clientHeight / 2), behavior: 'smooth' });
        row.classList.add('table-active');
        setTimeout(() => row.classList.remove('table-active'), 900);
      }
    });
  }
}

function marcarEntregado(id) {
  const alumno = alumnosDesayuno.find(a => a.id === id);
  if (!alumno) return;

  if (alumno.entregado) {
    Swal.fire({
      title: '¿Quitar entrega?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar'
    }).then((result) => {
      if (result.isConfirmed) {
        alumno.entregado = false;
        alumno.observacion = '';
        guardarDesayunos();
        mostrarListaEntrega(id);
      }
    });
  } else {
    Swal.fire({
      title: 'Observación de entrega',
      input: 'text',
      inputPlaceholder: 'Ej. No asistió, entregado a tutor...',
      showCancelButton: true,
      confirmButtonText: 'Marcar entregado'
    }).then(result => {
      if (result.isConfirmed) {
        alumno.entregado = true;
        alumno.observacion = result.value || '';
        guardarDesayunos();
        mostrarListaEntrega(id);
      }
    });
  }
}

function eliminarAlumno(id) {
  Swal.fire({
    title: '¿Eliminar alumno?',
    icon: 'warning',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, eliminar'
  }).then(result => {
    if (result.isConfirmed) {
      alumnosDesayuno = alumnosDesayuno.filter(a => a.id !== id);
      guardarDesayunos();
      mostrarListaEntrega();
    }
  });
}

function editarAlumno(id) {
  const alumno = alumnosDesayuno.find(a => a.id === id);
  if (!alumno) return;

  Swal.fire({
    title: 'Editar Alumno',
    html: `
      <div class="text-start">
        <label class="small">Nombre(s):</label>
        <input id="nombre" class="form-control mb-2" value="${alumno.nombre}">
        <label class="small">Apellido Paterno:</label>
        <input id="apellidoPaterno" class="form-control mb-2" value="${alumno.apellidoPaterno}">
        <label class="small">Apellido Materno:</label>
        <input id="apellidoMaterno" class="form-control mb-2" value="${alumno.apellidoMaterno}">
        <div class="d-flex gap-2">
          <select id="grado" class="form-select mb-2 w-50">
            ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n == alumno.grado ? 'selected' : ''}>${n}°</option>`).join('')}
          </select>
          <select id="grupo" class="form-select w-50">
            <option value="A" ${alumno.grupo === 'A' ? 'selected' : ''}>A</option>
            <option value="B" ${alumno.grupo === 'B' ? 'selected' : ''}>B</option>
          </select>
        </div>
      </div>
    `,
    confirmButtonText: 'Guardar',
    showCancelButton: true,
    preConfirm: () => ({
      nombre: capitalizar(document.getElementById('nombre').value.trim()),
      apellidoPaterno: capitalizar(document.getElementById('apellidoPaterno').value.trim()),
      apellidoMaterno: capitalizar(document.getElementById('apellidoMaterno').value.trim()),
      grado: document.getElementById('grado').value,
      grupo: document.getElementById('grupo').value
    })
  }).then(result => {
    if (result.isConfirmed) {
      Object.assign(alumno, result.value);
      guardarDesayunos();
      mostrarListaEntrega(id);
    }
  });
}

// ARCHIVAR (Con validación de lista vacía)
function archivarListaEntrega() {
  // CANDADO: No permitir archivar si no hay alumnos
  if (alumnosDesayuno.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Lista vacía',
      text: 'No hay alumnos registrados para archivar.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  Swal.fire({
    title: '¿Archivar lista?',
    text: 'Se guardará la jornada actual y se reiniciarán las entregas.',
    icon: 'question',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, archivar'
  }).then((result) => {
    if (result.isConfirmed) {
      const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
      const fechaActual = new Date().toLocaleString();
      
      historial.push({ fecha: fechaActual, lista: [...alumnosDesayuno] });
      localStorage.setItem('historialDesayunos', JSON.stringify(historial));

      alumnosDesayuno = alumnosDesayuno.map(a => ({ ...a, entregado: false }));
      guardarDesayunos();
      mostrarListaEntrega();

      Swal.fire({ icon: 'success', title: 'Lista archivada', timer: 1500, showConfirmButton: false });
    }
  });
}

// TOUR (Actualizado a .tour())
async function iniciarTourInicialDesayunos() {
  if (alumnosDesayuno.length > 0) return iniciarTourManualDesayunos();

  await Swal.fire({
    title: '¡Bienvenido!',
    html: 'Crearemos un ejemplo para el recorrido. Se eliminará al finalizar.',
    icon: 'info', confirmButtonText: 'Entendido'
  });

  const demo = { id: generarId(), nombre: 'Juan', apellidoPaterno: 'Pérez', apellidoMaterno: 'García', grado: 1, grupo: 'A', entregado: false, __demo: true };
  alumnosDesayuno.push(demo);
  guardarDesayunos();
  mostrarListaEntrega();
  setTimeout(() => continuarTourDesayunos(true), 600);
}

async function iniciarTourManualDesayunos() {
  if (alumnosDesayuno.length === 0) return iniciarTourInicialDesayunos();
  continuarTourDesayunos(false);
}

function continuarTourDesayunos(isDemo) {
  const pasos = [
    { element: 'button[onclick="abrirFormularioDesayuno()"]', intro: "Agrega alumnos a esta lista independiente." },
    { element: '#btnArchivar', intro: "Guarda la jornada en el historial y limpia las entregas." },
    { element: '#tablaDesayuno tbody tr:first-child', intro: "Aquí verás los datos del alumno." },
    { element: '.fa-check-circle', intro: "Marca la entrega diaria aquí." },
    { element: '.fa-edit', intro: "Edita los datos del alumno." },
    { element: '.fa-trash-alt', intro: "Elimina al alumno de esta sección." }
  ];

  const tour = introJs.tour(); // Actualizado para evitar deprecation
  tour.setOptions({ steps: pasos, ...labelsTour() });

  tour.oncomplete(async () => {
    if (isDemo) {
      alumnosDesayuno = alumnosDesayuno.filter(a => !a.__demo);
      guardarDesayunos();
      mostrarListaEntrega();
    }
    
    Swal.fire({
      title: '¿Continuar recorrido?',
      text: '¿Deseas seguir con la siguiente sección (Historial)?',
      icon: 'question',
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Sí'
    }).then(res => {
      if (res.isConfirmed) {
        localStorage.setItem('tourContinuar', 'historial');
        window.location.href = 'historial.html';
      }
    });
  });
  tour.start();
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await actualizarFooter();
    mostrarListaEntrega();
    
    const btnGuia = document.getElementById('verGuia');
    if (btnGuia) btnGuia.onclick = iniciarTourManualDesayunos;

    if (localStorage.getItem('tourContinuar') === 'desayunos') {
      localStorage.removeItem('tourContinuar');
      // Aumentamos un poquito el delay a 800ms para que el canal de mensajes se estabilice
      setTimeout(() => {
        iniciarTourInicialDesayunos();
      }, 800);
    }
  } catch (error) {
    console.warn("Aviso de carga:", error);
  }
});