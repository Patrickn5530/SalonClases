// js/desayunos.js
let alumnosDesayuno = JSON.parse(localStorage.getItem('alumnosDesayuno')) || [];

// UTIL
function generarId() {
  return Date.now() + Math.random().toString(36).substring(2, 9);
}
function guardarDesayunos() {
  localStorage.setItem('alumnosDesayuno', JSON.stringify(alumnosDesayuno));
}

function formatearFecha(fecha) {
  return fecha ? fecha.split('-').reverse().join('-') : '';
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

// Capitaliza cada palabra (preserva acentos y Ñ)
function capitalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// FOOTER: muestra el ciclo escolar (cicloEscolar) almacenado en localforage
async function actualizarFooter() {
  const footer = document.getElementById('footerDesayunos');
  try {
    const ciclo = await localforage.getItem('cicloEscolar');
    if (ciclo) {
      footer.textContent = `Desayunos Escolares ciclo: ${ciclo}`;
    } else {
      footer.textContent = 'Desayunos Escolares';
    }
  } catch (e) {
    footer.textContent = 'Desayunos Escolares';
  }
}

// FORMULARIO AGREGAR
// FORMULARIO AGREGAR (modificado para preservar scroll)
function abrirFormularioDesayuno() {
  Swal.fire({
    title: 'Agregar Alumno',
    html: `
      <div class="text-start">
        <input id="apellidoPaterno" class="form-control mb-2" placeholder="Apellido Paterno">
        <input id="apellidoMaterno" class="form-control mb-2" placeholder="Apellido Materno">
        <input id="nombre" class="form-control mb-2" placeholder="Nombre(s)">
        <select id="grado" class="form-select mb-2 w-50">
          <option disabled selected>Grado:</option>
          ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}">${n}°</option>`).join('')}
        </select>
        <select id="grupo" class="form-select w-50">
          <option disabled selected>Grupo:</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </div>
    `,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    showCancelButton: true,
    allowOutsideClick: false,
    preConfirm: () => {
      const nombreRaw = document.getElementById('nombre').value.trim();
      const apellidoPaternoRaw = document.getElementById('apellidoPaterno').value.trim();
      const apellidoMaternoRaw = document.getElementById('apellidoMaterno').value.trim();
      const grado = document.getElementById('grado').value;
      const grupo = document.getElementById('grupo').value;

      if (!nombreRaw || !apellidoPaternoRaw || !apellidoMaternoRaw || !grado || !grupo) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }

      // capitalizar antes de devolver
      return {
        nombre: capitalizar(nombreRaw),
        apellidoPaterno: capitalizar(apellidoPaternoRaw),
        apellidoMaterno: capitalizar(apellidoMaternoRaw),
        grado,
        grupo
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const { nombre, apellidoPaterno, apellidoMaterno, grado, grupo } = result.value;

      // Guardar scroll actual si existe (para restaurarlo después)
      const wrapperBefore = document.getElementById('tablaWrapper');
      const prevScrollTop = wrapperBefore ? wrapperBefore.scrollTop : 0;

      alumnosDesayuno.push({
        id: generarId(),
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        grado,
        grupo,
        entregado: false
      });
      guardarDesayunos();

      // Re-render y restaurar scroll
      mostrarListaEntrega();
      requestAnimationFrame(() => {
        const wrapperAfter = document.getElementById('tablaWrapper');
        if (wrapperAfter) {
          wrapperAfter.scrollTop = prevScrollTop;
        }
      });

      // Feedback similar a otros avisos: confirmación centrada y rápida
      Swal.fire({ icon: 'success', title: 'Alumno agregado', showConfirmButton: false, timer: 1400, position: 'center' });
    }
  });
}


// MOSTRAR LISTA (actualizada para mantener scroll en una fila)
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
  let totalNoEntregados = totalAlumnos - totalEntregados;

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
    tabla += `
      <tr class="${filaClase}" data-id="${alumno.id}">
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${alumno.grado}° ${alumno.grupo}</td>
        <td class="text-truncate">${alumno.apellidoPaterno}</td>
        <td class="text-truncate">${alumno.apellidoMaterno}</td>
        <td class="text-truncate">${alumno.nombre}</td>
        <td class="action-icons">
          <div class="d-flex">
            <i class="fas fa-check-circle ${alumno.entregado ? 'text-success' : 'text-secondary'} btn-sm me-1" title="entregado" onclick="marcarEntregado('${alumno.id}')"></i>
            <i class="fas fa-edit text-primary btn-sm me-1" title="Editar" onclick="editarAlumno('${alumno.id}')"></i>
            <i class="fas fa-trash-alt text-danger btn-sm" title="Eliminar" onclick="eliminarAlumno('${alumno.id}')"></i>
          </div>
        </td>
      </tr>
    `;
  });

  tabla += `
        </tbody>
  <tfoot style="position: sticky; bottom: 0; background: rgba(0,0,0,0.05);">
    <tr>
      <td colspan="6" style="text-align: left;">
        <strong>Desayunos Totales: ${totalAlumnos}</strong>&nbsp;&nbsp;<strong class="text-success"> Entregados: ${totalEntregados}</strong>&nbsp;&nbsp;<strong class="text-danger"> No entregados: ${totalNoEntregados}</strong>
      </td>
    </tr>
  </tfoot>
      </table>
    </div>
  `;
  const contenedorPrincipal = document.getElementById('listaDesayunos');
  contenedorPrincipal.innerHTML = tabla;

  // Si se pidió hacer foco en una fila determinada, desplazar el contenedor
  if (focusId) {
    // usar requestAnimationFrame para asegurar que el DOM ya está pintado
    requestAnimationFrame(() => {
      const wrapper = document.getElementById('tablaWrapper'); // el contenedor con overflow
      const row = wrapper ? wrapper.querySelector(`tbody tr[data-id="${focusId}"]`) : null;
      if (wrapper && row) {
        // calcular desplazamiento relativo del row dentro del wrapper
        const wrapperRect = wrapper.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        // posición del row relativa al scroll actual
        const offsetTop = (rowRect.top - wrapperRect.top) + wrapper.scrollTop;
        // centrar la fila en el wrapper
        const targetScroll = Math.max(0, offsetTop - (wrapper.clientHeight / 2) + (row.clientHeight / 2));
        wrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
        // opcional: dar foco visual breve
        row.classList.add('table-active');
        setTimeout(() => row.classList.remove('table-active'), 900);
      }
    });
  }
}


// ------------------ ACTUALIZAR FILA Y TOTALES (sin re-render completo) ------------------
function actualizarFilaYTotales(id) {
  const wrapper = document.getElementById('tablaWrapper');
  // Recalcular totales a partir del array actual
  const alumnosOrdenados = [...alumnosDesayuno].sort((a, b) => {
    const ga = Number(a.grado) || 0;
    const gb = Number(b.grado) || 0;
    if (ga !== gb) return ga - gb;
    const gA = (a.grupo || '').toLowerCase();
    const gB = (b.grupo || '').toLowerCase();
    if (gA !== gB) return gA.localeCompare(gB, 'es', { sensitivity: 'base' });
    return (a.apellidoPaterno || '').localeCompare((b.apellidoPaterno || ''), 'es', { sensitivity: 'base' });
  });

  const totalEntregados = alumnosOrdenados.filter(a => a.entregado).length;
  const totalAlumnos = alumnosOrdenados.length;
  const totalNoEntregados = totalAlumnos - totalEntregados;

  if (wrapper) {
    const tabla = wrapper.querySelector('#tablaDesayuno');
    if (tabla) {
      const tfoot = tabla.querySelector('tfoot');
      if (tfoot) {
        tfoot.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: left;">
              <strong>Desayunos Totales: ${totalAlumnos}</strong>&nbsp;&nbsp;
              <strong class="text-success"> Entregados: ${totalEntregados}</strong>&nbsp;&nbsp;
              <strong class="text-danger"> No entregados: ${totalNoEntregados}</strong>
            </td>
          </tr>
        `;
      }
    }

    const row = wrapper.querySelector(`tbody tr[data-id="${id}"]`);
    if (row) {
      const alumno = alumnosDesayuno.find(a => a.id === id);
      if (!alumno) {
        // fila en DOM pero alumno no existe en array -> fallback a render completo
        mostrarListaEntrega();
        return;
      }

      // actualizar clase visual
      if (alumno.entregado) {
        row.classList.add('table-success');
      } else {
        row.classList.remove('table-success');
      }

      // actualizar icono check
      const checkIcon = row.querySelector('.fa-check-circle');
      if (checkIcon) {
        checkIcon.classList.remove('text-success', 'text-secondary');
        checkIcon.classList.add(alumno.entregado ? 'text-success' : 'text-secondary');
        // actualizar title con observación si existe
        if (alumno.observacion) {
          checkIcon.setAttribute('title', `Entregado: ${alumno.observacion}`);
        } else {
          checkIcon.setAttribute('title', 'entregado');
        }
      }
    } else {
      // si la fila ya no está en DOM (por alguna razón), hacemos re-render completo
      mostrarListaEntrega();
    }
  } else {
    // wrapper no existe -> fallback a re-render
    mostrarListaEntrega();
  }
}

// MARCAR ENTREGADO / QUITAR (actualizado: actualiza solo la fila y totales)
function marcarEntregado(id) {
  const alumno = alumnosDesayuno.find(a => a.id === id);
  if (!alumno) return;

  if (alumno.entregado) {
    Swal.fire({
      title: '¿Quitar entrega?',
      text: 'Se quitará el estado de entrega',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        alumno.entregado = false;
        alumno.observacion = '';
        guardarDesayunos();
        actualizarFilaYTotales(id); // <--- actualizamos sin re-renderizar toda la tabla
        Swal.fire({ icon: 'success', title: 'Entrega cancelada', timer: 1200, showConfirmButton: false });
      }
    });
  } else {
    Swal.fire({
      title: 'Observación de entrega',
      input: 'text',
      inputLabel: '¿Deseas agregar una observación?',
      inputPlaceholder: 'Ej. Se entregó al profesor, no asistió, etc.',
      showCancelButton: true,
      confirmButtonText: 'Marcar como entregado',
      cancelButtonText: 'Cancelar',
      inputValidator: value => {
        if (value && value.length > 100) return 'Máximo 100 caracteres';
      }
    }).then(result => {
      if (result.isConfirmed) {
        alumno.entregado = true;
        alumno.observacion = result.value || '';
        guardarDesayunos();
        actualizarFilaYTotales(id); // <--- actualizamos sin re-renderizar toda la tabla
        Swal.fire({ icon: 'success', title: 'Entrega registrada', timer: 1200, showConfirmButton: false });
      }
    });
  }
}

// ELIMINAR (ahora elimina la fila del DOM y actualiza numeración/totales sin re-render completo)
function eliminarAlumno(id) {
  Swal.fire({
    title: '¿Eliminar alumno?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (!result.isConfirmed) return;

    // quitar del array y guardar
    alumnosDesayuno = alumnosDesayuno.filter(a => a.id !== id);
    guardarDesayunos();

    // intentar eliminar solo la fila del DOM y recalcular numeración + totales
    const wrapper = document.getElementById('tablaWrapper');
    if (wrapper) {
      const row = wrapper.querySelector(`tbody tr[data-id="${id}"]`);
      if (row) {
        row.remove();
        // renumerar primera columna
        const rows = Array.from(wrapper.querySelectorAll('tbody tr'));
        rows.forEach((r, idx) => {
          const firstTd = r.querySelector('td');
          if (firstTd) firstTd.textContent = (idx + 1);
        });
        // actualizar totales
        // tomar la ruta corta: llamar a actualizarFilaYTotales con null id para sólo actualizar tfoot
        // pero nuestra función espera id — hacemos recalculo directo:
        const alumnosOrdenados = [...alumnosDesayuno].sort((a, b) => {
          const ga = Number(a.grado) || 0;
          const gb = Number(b.grado) || 0;
          if (ga !== gb) return ga - gb;
          const gA = (a.grupo || '').toLowerCase();
          const gB = (b.grupo || '').toLowerCase();
          if (gA !== gB) return gA.localeCompare(gB, 'es', { sensitivity: 'base' });
          return (a.apellidoPaterno || '').localeCompare((b.apellidoPaterno || ''), 'es', { sensitivity: 'base' });
        });
        const totalEntregados = alumnosOrdenados.filter(a => a.entregado).length;
        const totalAlumnos = alumnosOrdenados.length;
        const totalNoEntregados = totalAlumnos - totalEntregados;
        const tabla = wrapper.querySelector('#tablaDesayuno');
        if (tabla) {
          const tfoot = tabla.querySelector('tfoot');
          if (tfoot) {
            tfoot.innerHTML = `
              <tr>
                <td colspan="6" style="text-align: left;">
                  <strong>Desayunos Totales: ${totalAlumnos}</strong>&nbsp;&nbsp;
                  <strong class="text-success"> Entregados: ${totalEntregados}</strong>&nbsp;&nbsp;
                  <strong class="text-danger"> No entregados: ${totalNoEntregados}</strong>
                </td>
              </tr>
            `;
          }
        }
        Swal.fire({ icon: 'success', title: 'Alumno eliminado', timer: 1100, showConfirmButton: false });
        return;
      }
    }

    // fallback: si wrapper/row no existe (p. ej. vista diferente), re-render completo
    mostrarListaEntrega();
    Swal.fire({ icon: 'success', title: 'Alumno eliminado', timer: 1100, showConfirmButton: false });
  });
}

// EDITAR (modificado para preservar scroll)
function editarAlumno(id) {
  const alumno = alumnosDesayuno.find(a => a.id === id);
  if (!alumno) return;

  Swal.fire({
    title: 'Editar Alumno',
    html: `
      <div class="text-start">
        <label>Nombre(s):</label>
        <input id="nombre" class="form-control mb-2" value="${alumno.nombre}">
        <label>Apellido Paterno:</label>
        <input id="apellidoPaterno" class="form-control mb-2" value="${alumno.apellidoPaterno}">
        <label>Apellido Materno:</label>
        <input id="apellidoMaterno" class="form-control mb-2" value="${alumno.apellidoMaterno}">
        <label>Grado:</label>
        <select id="grado" class="form-select mb-2">
          ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n == alumno.grado ? 'selected' : ''}>${n}°</option>`).join('')}
        </select>
        <label>Grupo:</label>
        <select id="grupo" class="form-select">
          <option value="A" ${alumno.grupo === 'A' ? 'selected' : ''}>A</option>
          <option value="B" ${alumno.grupo === 'B' ? 'selected' : ''}>B</option>
        </select>
      </div>
    `,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    showCancelButton: true,
    allowOutsideClick: false,
    preConfirm: () => {
      const nombreRaw = document.getElementById('nombre').value.trim();
      const apellidoPaternoRaw = document.getElementById('apellidoPaterno').value.trim();
      const apellidoMaternoRaw = document.getElementById('apellidoMaterno').value.trim();
      const grado = parseInt(document.getElementById('grado').value);
      const grupo = document.getElementById('grupo').value;

      if (!nombreRaw || !apellidoPaternoRaw || !apellidoMaternoRaw || !grado || !grupo) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }

      // capitalizar antes de devolver
      return {
        nombre: capitalizar(nombreRaw),
        apellidoPaterno: capitalizar(apellidoPaternoRaw),
        apellidoMaterno: capitalizar(apellidoMaternoRaw),
        grado,
        grupo
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      // Guardar scroll actual si existe (para restaurarlo después)
      const wrapperBefore = document.getElementById('tablaWrapper');
      const prevScrollTop = wrapperBefore ? wrapperBefore.scrollTop : 0;

      Object.assign(alumno, result.value);
      guardarDesayunos();

      // Re-render y restaurar scroll
      mostrarListaEntrega();
      requestAnimationFrame(() => {
        const wrapperAfter = document.getElementById('tablaWrapper');
        if (wrapperAfter) {
          wrapperAfter.scrollTop = prevScrollTop;
        }
      });

      Swal.fire({ icon: 'success', title: 'Alumno actualizado', timer: 1200, showConfirmButton: false });
    }
  });
}


// ARCHIVAR
function archivarListaEntrega() {
  Swal.fire({
    title: '¿Archivar lista?',
    text: 'Se guardará la entrega actual y se reiniciará para una nueva jornada.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, archivar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      const historial = JSON.parse(localStorage.getItem('historialDesayunos')) || [];
      const fechaActual = new Date().toLocaleString();
      historial.push({ fecha: fechaActual, lista: alumnosDesayuno.map(a => ({ ...a })) });
      localStorage.setItem('historialDesayunos', JSON.stringify(historial));

      alumnosDesayuno = alumnosDesayuno.map(a => ({ ...a, entregado: false }));
      guardarDesayunos();
      mostrarListaEntrega();

      Swal.fire({ icon: 'success', title: 'Lista archivada', text: 'Se ha reiniciado la entrega.', timer: 2000, showConfirmButton: false });
    }
  });
}


// ------------------ TOUR para Desayunos ------------------
async function iniciarTourInicialDesayunos() {
  if ((alumnosDesayuno || []).length > 0) {
    iniciarTourManualDesayunos();
    return;
  }

  await Swal.fire({
    title: '¡Bienvenido!',
    html: 'Crearemos un alumno de ejemplo para mostrar cómo funciona esta sección. Se eliminará al terminar el recorrido.',
    icon: 'info',
    confirmButtonText: 'Entendido',
    allowOutsideClick: false
  });

  const demoAlumno = {
    id: generarId(),
    nombre: capitalizar('juan'),
    apellidoPaterno: capitalizar('pérez'),
    apellidoMaterno: capitalizar('garcía'),
    grado: 1,
    grupo: 'A',
    entregado: false,
    __demo: true
  };
  alumnosDesayuno.push(demoAlumno);
  guardarDesayunos();
  mostrarListaEntrega();
  setTimeout(() => continuarTourDesayunos(true), 600);
}

async function iniciarTourManualDesayunos() {
  if ((alumnosDesayuno || []).length === 0) {
    const demoAlumno = {
      id: generarId(),
      nombre: capitalizar('juan'),
      apellidoPaterno: capitalizar('pérez'),
      apellidoMaterno: capitalizar('garcía'),
      grado: 1,
      grupo: 'A',
      entregado: false,
      __demo: true
    };
    alumnosDesayuno.push(demoAlumno);
    guardarDesayunos();
    mostrarListaEntrega();
    setTimeout(() => continuarTourDesayunos(true), 600);
    return;
  }
  setTimeout(() => continuarTourDesayunos(false), 300);
}

function continuarTourDesayunos(isDemo) {
  const firstRow = document.querySelector('#tablaDesayuno tbody tr:first-child');
  if (firstRow) firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const pasos = [
    { element: 'header .dropdown-toggle', intro: "Aquí está el menú para navegar entre secciones." },
    { element: 'button[onclick="abrirFormularioDesayuno()"]', intro: "Usa este botón para agregar un alumno a la lista." },
    { element: 'button[onclick="archivarListaEntrega()"]', intro: "Con este botón puedes archivar la entrega actual (guardar y reiniciar)." },
    { element: '#tablaDesayuno tbody tr:first-child', intro: "Aquí aparece la fila del alumno (grado, apellidos y nombres)." },
    { element: '.fa-check-circle', intro: "Este icono marca la entrega (y permite agregar observación)." },
    { element: '.fa-edit', intro: "Con este icono puedes editar los datos del alumno." },
    { element: '.fa-trash-alt', intro: "Con este icono eliminas al alumno de la lista." },
    { element: '#footerDesayunos', intro: "En el pie se muestra el ciclo escolar activo." }
  ];

  const tour = introJs();
  tour.setOptions({ steps: pasos, ...labelsTour() });

  tour.oncomplete(async () => {
    if (isDemo) {
      let anyDemo = false;
      alumnosDesayuno = (alumnosDesayuno || []).filter(a => {
        if (a.__demo) { anyDemo = true; return false; }
        return true;
      });
      if (anyDemo) {
        guardarDesayunos();
        mostrarListaEntrega();
      }
    }

    // Preguntar si continuar y redirigir a historial.html si confirma
    Swal.fire({
      title: '¿Continuar recorrido?',
      text: '¿Deseas seguir con la siguiente sección (Historial)?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(res => {
      if (res.isConfirmed) {
        // -> fijar bandera para que historial inicie su tour al cargar
        localStorage.setItem('tourContinuar', 'historial');
        window.location.href = 'historial.html';
      }
    });
  });

  tour.start();
}


// ------------------ INICIALIZACIÓN ------------------
document.addEventListener('DOMContentLoaded', async () => {
  await actualizarFooter();
  mostrarListaEntrega();
  
  const btnGuia = document.getElementById('verGuia');
  if (btnGuia) btnGuia.addEventListener('click', iniciarTourManualDesayunos);

  // Si venimos del tour anterior (colectas -> desayunos)
  if (localStorage.getItem('tourContinuar') === 'desayunos') {
    localStorage.removeItem('tourContinuar');
    iniciarTourInicialDesayunos();
  }
});