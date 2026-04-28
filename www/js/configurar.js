// js/configurar.js
// Requiere: localforage, SweetAlert2 (Swal), introJs y FontAwesome cargados

// ------------------ HELPERS ------------------
function capitalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
const escapeHtml = str => String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

// ------------------ CONFIG DOCENTE ------------------
function abrirConfigDocente() {
  localforage.getItem('configuracionDocente').then(data => {
    const docente = data || { tratamiento: 'Profesor', nombre: '', grado: '1', grupo: 'A' };

    Swal.fire({
      title: 'Configurar Docente',
      html: `
        <select id="tratamiento" class="swal2-input">
          <option value="Profesor" ${docente.tratamiento === 'Profesor' ? 'selected' : ''}>Profesor</option>
          <option value="Profesora" ${docente.tratamiento === 'Profesora' ? 'selected' : ''}>Profesora</option>
        </select>
        <input id="nombre" class="swal2-input" maxlength="25" placeholder="Nombre" value="${escapeHtml(docente.nombre || '')}" oninput="actualizarContadorNombre()">
        <small id="contadorNombre" style="display:block; text-align:center; font-size:0.8em; color:#666;">0 / 25</small>
        <select id="grado" class="swal2-input">
          ${[1,2,3,4,5,6].map(g => `<option value="${g}" ${docente.grado == g ? 'selected' : ''}>${g}°</option>`).join('')}
        </select>
        <select id="grupo" class="swal2-input">
          ${['A','B'].map(g => `<option value="${g}" ${docente.grupo == g ? 'selected' : ''}>Grupo ${g}</option>`).join('')}
        </select>
      `,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Guardar',
      allowOutsideClick: false,
      didOpen: () => {
        actualizarContadorNombre();
      },
      preConfirm: () => {
        const nombreInput = (document.getElementById('nombre') || {}).value || '';
        const nombre = capitalizar(nombreInput.trim()).slice(0, 25);
        const regexNombre = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s'\-]+$/;
        if (!nombre) {
          Swal.showValidationMessage('El nombre no puede estar vacío'); return false;
        }
        if (!regexNombre.test(nombre)) {
          Swal.showValidationMessage('El nombre contiene caracteres inválidos'); return false;
        }
        const tratamiento = document.getElementById('tratamiento').value;
        const grado = document.getElementById('grado').value;
        const grupo = document.getElementById('grupo').value;
        const nuevoDocente = { tratamiento, nombre, grado, grupo };
        return localforage.setItem('configuracionDocente', nuevoDocente);
      }
    }).then(result => {
      if (result.isConfirmed) Swal.fire('¡Guardado!', 'Datos del docente actualizados.', 'success');
    });
  });
}

function actualizarContadorNombre() {
  const input = document.getElementById('nombre');
  const contador = document.getElementById('contadorNombre');
  if (!input || !contador) return;
  const largo = input.value.length;
  contador.textContent = `Caracteres ${largo} / 25`;
  contador.style.color = (largo >= 25) ? 'red' : '#666';
}

// ------------------ CICLO ------------------
function abrirConfigCiclo() {
  localforage.getItem('cicloEscolar').then(cicloActual => {
    Swal.fire({
      title: 'Ciclo Escolar',
      input: 'text',
      inputValue: cicloActual || '',
      inputPlaceholder: 'Ej: 2025-2026',
      inputAttributes: {
        maxlength: 9,
        inputmode: 'numeric',
        pattern: '\\d{4}-\\d{4}'
      },
      confirmButtonText: 'Guardar',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const input = document.querySelector('.swal2-input');
        if (!input) return;
        input.setAttribute('maxlength', '9');

        input.addEventListener('input', () => {
          const raw = input.value || '';
          const digits = raw.replace(/\D/g, '').slice(0,8);
          let formatted = digits.length > 4 ? digits.slice(0,4) + '-' + digits.slice(4) : digits;
          input.value = formatted;
          const pos = input.value.length;
          input.setSelectionRange(pos, pos);
        });

        input.addEventListener('paste', (ev) => {
          ev.preventDefault();
          const pasted = (ev.clipboardData || window.clipboardData).getData('text') || '';
          const digits = pasted.replace(/\D/g, '').slice(0,8);
          const formatted = digits.length > 4 ? digits.slice(0,4) + '-' + digits.slice(4) : digits;
          input.value = formatted;
        });
      },
      preConfirm: (value) => {
        if (!/^\d{4}-\d{4}$/.test(value)) {
          Swal.showValidationMessage('Formato inválido. Usa "2025-2026" (solo números)');
          return false;
        }
        return localforage.setItem('cicloEscolar', value);
      }
    }).then(result => {
      if (result.isConfirmed) Swal.fire('¡Guardado!', 'Ciclo escolar actualizado.', 'success');
    });
  });
}

// ------------------ REINICIAR ------------------
function abrirReiniciarValores() {
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Se borrará la configuración del docente, ciclo escolar y datos del plantel.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      localforage.removeItem('configuracionDocente');
      localforage.removeItem('cicloEscolar');
      localforage.removeItem('datosPlantel');
      localforage.removeItem('municipio');
      localforage.removeItem('localidad');
      localforage.removeItem('nombreEscuela');
      localforage.removeItem('claveCentro');
      Swal.fire('Reiniciado', 'La configuración fue eliminada.', 'success');
    }
  });
}

// ------------------ PLANTEL ------------------
async function abrirConfigPlantel() {
  try {
    const datosGuardados = await localforage.getItem('datosPlantel') || {};
    const municipio = datosGuardados.municipio || '';
    const localidad = datosGuardados.localidad || '';
    const nombreEscuela = datosGuardados.nombreEscuela || '';
    const claveCentro = datosGuardados.claveCentro || '';

    const { value: formValues } = await Swal.fire({
      title: 'Configurar datos del plantel',
      html: `
        <div class="text-start">
          <label class="form-label">Municipio</label>
          <input id="municipioPlantel" class="swal2-input" placeholder="Municipio" value="${escapeHtml(municipio)}">
          <label class="form-label">Localidad</label>
          <input id="localidadPlantel" class="swal2-input" placeholder="Localidad" value="${escapeHtml(localidad)}">
          <label class="form-label">Nombre de la escuela</label>
          <input id="nombreEscuelaPlantel" class="swal2-input" maxlength="80" placeholder="Nombre de la escuela" value="${escapeHtml(nombreEscuela)}">
          <label class="form-label">Clave del centro (opcional)</label>
          <input id="claveCentroPlantel" class="swal2-input" maxlength="20" placeholder="Clave del centro" value="${escapeHtml(claveCentro)}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const municipioIn = document.getElementById('municipioPlantel').value.trim();
        const localidadIn = document.getElementById('localidadPlantel').value.trim();
        const nombreEscuelaIn = document.getElementById('nombreEscuelaPlantel').value.trim();
        const claveIn = document.getElementById('claveCentroPlantel').value.trim();
        if (!municipioIn || !localidadIn || !nombreEscuelaIn) {
          Swal.showValidationMessage('Municipio, localidad y nombre de la escuela son obligatorios');
          return false;
        }
        return {
          municipio: capitalizar(municipioIn),
          localidad: capitalizar(localidadIn),
          nombreEscuela: capitalizar(nombreEscuelaIn),
          claveCentro: claveIn.toUpperCase()
        };
      }
    });

    if (formValues) {
      const datosPlantel = {
        ...datosGuardados,
        municipio: formValues.municipio,
        localidad: formValues.localidad,
        nombreEscuela: formValues.nombreEscuela,
        claveCentro: formValues.claveCentro
      };
      await localforage.setItem('datosPlantel', datosPlantel);
      await localforage.setItem('municipio', datosPlantel.municipio);
      await localforage.setItem('localidad', datosPlantel.localidad);
      await localforage.setItem('nombreEscuela', datosPlantel.nombreEscuela);
      await localforage.setItem('claveCentro', datosPlantel.claveCentro);
      Swal.fire('¡Guardado!', 'Los datos del plantel se actualizaron.', 'success');
    }
  } catch (err) {
    console.error('Error guardar datos plantel', err);
    Swal.fire('Error', 'No se pudo guardar la información del plantel', 'error');
  }
}

// ------------------ PERSONAL DOCENTE ------------------
function ordenarConIndiceOriginal(list) {
  if (!Array.isArray(list)) return [];
  const mapped = list.map((item, idx) => ({ item, __origIndex: idx }));
  mapped.sort((a, b) => {
    const ga = parseInt(a.item.grado, 10) || 0;
    const gb = parseInt(b.item.grado, 10) || 0;
    if (ga !== gb) return ga - gb;
    const grupa = String(a.item.grupo || '').toUpperCase();
    const grb = String(b.item.grupo || '').toUpperCase();
    if (grupa < grb) return -1;
    if (grupa > grb) return 1;
    const na = String(a.item.nombre || '').toUpperCase();
    const nb = String(b.item.nombre || '').toUpperCase();
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  });
  return mapped;
}

// Reemplaza abrirPersonalDocente() y renderPersonalDocenteTable() por esto:

async function abrirPersonalDocente() {
  let docentes = await localforage.getItem('personalDocente') || [];
  const mapped = ordenarConIndiceOriginal(docentes);

  const html = `
    <style>
      /* Estilos compactos parecidos a la tabla del index */
      .pd-swal .table { margin:0; width:100%; border-collapse:collapse; }
      .pd-swal .table thead th { position: sticky; top: 0; background: rgba(13,110,253,0.12); z-index: 2; }
      .pd-swal .name-cell { white-space: normal; word-break: break-word; }
      .pd-swal .name-cell span {
        display: -webkit-box;
        -webkit-line-clamp: 2; /* limitar a 2 líneas */
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .pd-swal .grade-cell { white-space: nowrap; text-align:center; width:60px; }
      .pd-swal .actions-cell { white-space: nowrap; text-align:center; width:60px; }

      /* botones sin borde con color */
      .pd-btn {
        border: none;
        background: transparent;
        padding: 1px 1px;
        margin: 0 2px;
        cursor: pointer;
        font-size: 0.95rem;
      }
      .pd-btn-edit { color: #0d6efd; }   /* azul editar */
      .pd-btn-del  { color: #dc3545; }   /* rojo eliminar */
    </style>

    <div class="pd-swal">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="mb-0">Personal Docente</h5>
        <button id="pd-agregar" class="btn btn-sm btn-primary"><i class="fas fa-user-plus"></i> Agregar</button>
      </div>

      <div class="pd-table-wrapper">
        <table class="table table-sm table-striped">
          <thead>
            <tr>
              <th style="width:25px;">#</th>
              <th style="width:180px;">Nombre</th>
              <th class="text-center" style="width:60px;">Grado</th>
              <th class="text-center" style="width:60px;">Acciones</th>
            </tr>
          </thead>
          <tbody id="pd-tbody">
            ${mapped.map((m, i) => `
              <tr data-index="${m.__origIndex}">
                <td class="text-center">${i + 1}</td>
                <td class="name-cell"><span>${escapeHtml(capitalizar(m.item.nombre || ''))}</span></td>
                <td class="grade-cell">${escapeHtml(String(m.item.grado || ''))} ${escapeHtml(String(m.item.grupo || ''))}</td>
                <td class="actions-cell">
                  <button class="pd-btn pd-btn-edit editar-docente" data-i="${m.__origIndex}" title="Editar"><i class="fas fa-edit"></i></button>
                  <button class="pd-btn pd-btn-del eliminar-docente" data-i="${m.__origIndex}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  await Swal.fire({
    html,
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    showConfirmButton: false,
    width: 820,
    didOpen: () => {
      const tbody = document.getElementById('pd-tbody');
      const btnAgregar = document.getElementById('pd-agregar');

      // Agregar docente
      if (btnAgregar) {
        btnAgregar.addEventListener('click', async () => {
          await abrirFormularioDocente(false, null);
          const nuevos = await localforage.getItem('personalDocente') || [];
          renderPersonalDocenteTable(nuevos);
        });
      }

      // Delegación eventos editar/eliminar
      if (tbody) {
        tbody.addEventListener('click', async (ev) => {
          const btn = ev.target.closest('button');
          if (!btn) return;
          const idx = Number(btn.getAttribute('data-i'));
          if (btn.classList.contains('editar-docente')) {
            await abrirFormularioDocente(true, idx);
            const nuevos = await localforage.getItem('personalDocente') || [];
            renderPersonalDocenteTable(nuevos);
          } else if (btn.classList.contains('eliminar-docente')) {
            const confirmed = await Swal.fire({
              title: '¿Eliminar docente?',
              text: 'Se eliminará este registro del personal docente.',
              icon: 'warning',
              showCancelButton: true,
              cancelButtonText: 'Cancelar',
              confirmButtonText: 'Sí, eliminar'
            });
            if (confirmed.isConfirmed) {
              let list = await localforage.getItem('personalDocente') || [];
              if (idx >= 0 && idx < list.length) {
                list.splice(idx, 1);
                await localforage.setItem('personalDocente', list);
                renderPersonalDocenteTable(list);
              }
            }
          }
        });
      }
    }
  });
}

/* render parcial - actualiza tbody con el mismo formato */
function renderPersonalDocenteTable(list) {
  const tbody = document.getElementById('pd-tbody');
  if (!tbody) return;
  const mapped = ordenarConIndiceOriginal(list || []);
  tbody.innerHTML = mapped.map((m, i) => `
    <tr data-index="${m.__origIndex}">
      <td class="text-center">${i + 1}</td>
      <td class="name-cell"><span>${escapeHtml(capitalizar(m.item.nombre || ''))}</span></td>
      <td class="grade-cell">${escapeHtml(String(m.item.grado || ''))} ${escapeHtml(String(m.item.grupo || ''))}</td>
      <td class="actions-cell">
        <button class="pd-btn pd-btn-edit editar-docente" data-i="${m.__origIndex}" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="pd-btn pd-btn-del eliminar-docente" data-i="${m.__origIndex}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
      </td>
    </tr>
  `).join('');
}


// formulario para agregar/editar docente
async function abrirFormularioDocente(esEditar = false, indice = null) {
  let list = await localforage.getItem('personalDocente') || [];
  const editarObj = (esEditar && indice !== null && list[indice]) ? list[indice] : { nombre: '', grado: '1', grupo: 'A' };

  const { value } = await Swal.fire({
    title: esEditar ? 'Editar docente' : 'Agregar docente',
    html: `
      <input id="doc_nombre" class="swal2-input" placeholder="Nombre" value="${escapeHtml(editarObj.nombre || '')}">
      <select id="doc_grado" class="swal2-input">
        ${[1,2,3,4,5,6].map(g => `<option value="${g}" ${String(editarObj.grado) == g ? 'selected' : ''}>${g}°</option>`).join('')}
      </select>
      <select id="doc_grupo" class="swal2-input">
        ${['A','B'].map(gr => `<option value="${gr}" ${String(editarObj.grupo) === gr ? 'selected' : ''}>Grupo ${gr}</option>`).join('')}
      </select>
    `,
    allowOutsideClick: false,
    focusConfirm: false,
    showConfirmButton: true,
    confirmButtonText: 'Agregar', 
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre = (document.getElementById('doc_nombre').value || '').trim();
      const grado = document.getElementById('doc_grado').value;
      const grupo = document.getElementById('doc_grupo').value;
      if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio'); return false; }
      return { nombre: capitalizar(nombre), grado, grupo };
    }
  });

  if (value) {
    let list = await localforage.getItem('personalDocente') || [];
    if (esEditar && indice !== null && indice >= 0 && indice < list.length) {
      list[indice] = value;
      await localforage.setItem('personalDocente', list);
      Swal.fire({ icon: 'success', title: 'Docente actualizado', timer: 1500, showConfirmButton: false });
    } else {
      list.push(value);
      await localforage.setItem('personalDocente', list);
      Swal.fire({ icon: 'success', title: 'Docente agregado', timer: 1500, showConfirmButton: false });
    }
  }
}

// ------------------ TOUR CONFIGURAR ------------------
async function iniciarTourConfigurar(isFromPrev = false) {
  const pasosBase = [
    { element: 'header .dropdown-toggle', intro: 'Aquí accedes a las distintas secciones.' },
    { element: 'button[onclick="abrirConfigDocente()"]', intro: 'Configurar datos del docente (nombre, grado y grupo).' },
    { element: 'button[onclick="abrirConfigCiclo()"]', intro: 'Configurar ciclo escolar.' },
    { element: 'button[onclick="abrirConfigPlantel()"]', intro: 'Configurar datos del plantel: municipio, localidad, escuela y CCT.' },
    { element: '#btnPersonalDocente', intro: 'Aquí gestionas el personal docente (añadir, editar o eliminar).' },
    { element: 'button[onclick="abrirReiniciarValores()"]', intro: 'Reiniciar valores de configuración.' }
  ];

  let docentes = await localforage.getItem('personalDocente') || [];
  let createdDemo = false;
  if (!docentes || docentes.length === 0) {
    const demo = [
      { nombre: 'María López', grado: '1', grupo: 'A' },
      { nombre: 'Juan Pérez', grado: '2', grupo: 'B' }
    ];
    await localforage.setItem('personalDocente', demo);
    docentes = demo;
    createdDemo = true;
  }

  const tour = introJs();
  let tourCompleted = false;

  tour.setOptions({
    steps: pasosBase,
    nextLabel: 'Siguiente',
    prevLabel: 'Anterior',
    doneLabel: 'Finalizar',
    skipLabel: 'Omitir',
    showProgress: true,
    exitOnOverlayClick: false,
    exitOnEsc: false
  });

  tour.oncomplete(() => {
    tourCompleted = true;
    try { tour.exit(); } catch (e) { console.warn('Error al forzar exit de introJs:', e); }
  });

  tour.onexit(async () => {
    if (createdDemo) {
      const listado = await localforage.getItem('personalDocente') || [];
      if (Array.isArray(listado) && listado.length <= 2 &&
          listado[0] && listado[1] &&
          listado[0].nombre === 'María López' && listado[1].nombre === 'Juan Pérez') {
        await localforage.removeItem('personalDocente');
      }
    }
    if (tourCompleted) {
      await Swal.fire({
        title: 'Recorrido finalizado',
        html: 'Has llegado al final del recorrido.<br><br>Puedes volver a ver este recorrido en cualquier momento usando el botón <strong>"Ver guía"</strong> en el menú.',
        icon: 'success',
        confirmButtonText: 'Cerrar'
      });
    }
  });

  tour.start();
}

window.iniciarTourConfigurar = iniciarTourConfigurar;
