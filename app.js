// Función para guardar los alumnos (usada solo para inicializar los datos)
function guardarAlumnos() {
    const alumnos = [
        { nombre: "Angel Santiago", apellidoPaterno: "Alvarez", apellidoMaterno: "Martinez" },
    { nombre: "Leylani Abril", apellidoPaterno: "Chavez", apellidoMaterno: "Mena" },
    { nombre: "Josias", apellidoPaterno: "Covarrubias", apellidoMaterno: "Mar" },
    { nombre: "Tania Yamileth", apellidoPaterno: "Daniel", apellidoMaterno: "Mendoza" },
        { nombre: "Kevin", apellidoPaterno: "Garcia", apellidoMaterno: "Ortega" },
        { nombre: "Maria Susana", apellidoPaterno: "Gonzales", apellidoMaterno: "Flores" },
    { nombre: "Fernanda Dominicka", apellidoPaterno: "Hernandez", apellidoMaterno: "Jurado" },
    { nombre: "Danna Valeria", apellidoPaterno: "Hernandez", apellidoMaterno: "Cruz" },
    { nombre: "Ezequiel", apellidoPaterno: "Hernandez", apellidoMaterno: "Vazquez" },
    { nombre: "Melanny Zoe", apellidoPaterno: "Jarillo", apellidoMaterno: "Marquez" },
    { nombre: "Melissa Guadalupe", apellidoPaterno: "Leon", apellidoMaterno: "Macias" },
    { nombre: "Jose Gabriel", apellidoPaterno: "Montoya", apellidoMaterno: "Herrera" },
    { nombre: "Ximena Eridani", apellidoPaterno: "Oñate", apellidoMaterno: "Martinez" },
    { nombre: "José María", apellidoPaterno: "Ortigosa", apellidoMaterno: "Rubio" },
    { nombre: "Ana Sofía", apellidoPaterno: "Patricio", apellidoMaterno: "Villanueva" },
    { nombre: "Allizon Alejandra", apellidoPaterno: "Perez Banuett", apellidoMaterno: "Fernandez" },
    { nombre: "Vanessa Guadalupe", apellidoPaterno: "Quezada", apellidoMaterno: "Gasque" },
    { nombre: "Danna Sofia", apellidoPaterno: "Reynaga", apellidoMaterno: "Torres" },
    { nombre: "Polette Leilany", apellidoPaterno: "Robles", apellidoMaterno: "Muñoz" },
    { nombre: "Hannia Isabela Kimberly", apellidoPaterno: "Siordia", apellidoMaterno: "Cisneros" },
    { nombre: "Francisco Yalath", apellidoPaterno: "Vazquez", apellidoMaterno: "Jimenez" },
    { nombre: "Edgar fernando", apellidoPaterno: "Velazquez", apellidoMaterno: "Matias" }
    ];
    
    localforage.setItem('alumnos', alumnos).then(() => {
        console.log('Alumnos guardados');
    }).catch(err => {
        console.log('Error al guardar alumnos:', err);
    });
}

// Llamamos a esta función una sola vez para guardar los alumnos
guardarAlumnos();



// Crear colecta
document.getElementById('crearColectaBtn').addEventListener('click', function () {
    Swal.fire({
        title: 'Crear Colecta',
        html: `
            <input type="text" id="tituloColecta" class="swal2-input" placeholder="Título de la colecta">
            <input type="number" id="montoColecta" class="swal2-input" placeholder="Monto a colectar">
            <input type="date" id="fechaInicio" class="swal2-input" placeholder="Fecha de inicio">
            <input type="date" id="fechaLimite" class="swal2-input" placeholder="Fecha límite">
        `,
        preConfirm: function () {
            let titulo = document.getElementById('tituloColecta').value;
            let monto = document.getElementById('montoColecta').value;
            let fechaInicio = document.getElementById('fechaInicio').value;
            let fechaLimite = document.getElementById('fechaLimite').value;

            if (!titulo || !monto || !fechaInicio || !fechaLimite) {
                Swal.showValidationMessage('Por favor llena todos los campos');
                return false;
            }

            return { titulo, monto, fechaInicio, fechaLimite };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            let { titulo, monto, fechaInicio, fechaLimite } = result.value;

            // Obtener la lista de alumnos guardados
            localforage.getItem('alumnos').then(alumnos => {
                if (!alumnos || alumnos.length === 0) {
                    Swal.fire('Error', 'No se han encontrado alumnos en el sistema', 'error');
                    return;
                }

                let nuevaColecta = {
                    titulo,
                    monto: parseFloat(monto),
                    fechaInicio,
                    fechaLimite,
                    alumnos: alumnos.map(alumno => ({ 
                        ...alumno, 
                        entregado: 0 // Inicialmente no hay dinero entregado
                    }))
                };

                // Guardar la colecta en localForage
                localforage.setItem(titulo, nuevaColecta).then(() => {
                    Swal.fire('Colecta creada!', '', 'success');
                    cargarColectas(); // Recargar las colectas después de crearla
                }).catch(err => {
                    console.log('Error al guardar colecta:', err);
                });
            }).catch(err => {
                console.log('Error al obtener alumnos:', err);
                Swal.fire('Error', 'No se han encontrado alumnos en el sistema', 'error');
            });
        }
    });
});


// Cargar las colectas
function cargarColectas() {
    localforage.keys().then(keys => {
        let select = document.getElementById('colectaSelect');
        select.innerHTML = '<option  value="">Selecciona una colecta</option>';

        keys.forEach(key => {
            localforage.getItem(key).then(colecta => {
                let option = document.createElement('option');
                option.value = key;
                option.textContent = `${colecta.titulo}`;
                select.appendChild(option);
            });
        });
    });
}

// Mostrar la colecta seleccionada
document.getElementById('colectaSelect').addEventListener('change', function() {
    mostrarColectaSeleccionada();
});

function mostrarColectaSeleccionada() {
    let tituloColecta = document.getElementById('colectaSelect').value;

    if (!tituloColecta) return;

    localforage.getItem(tituloColecta).then(colecta => {
        function formatearFecha(fecha) {
  return fecha.split('-').reverse().join('-');
}
        let totalRecaudado = 0;

        let tablaHTML = ` 
  <h3>${colecta.titulo}</h3> 
  <p>Inicio: ${formatearFecha(colecta.fechaInicio)} Límite: ${formatearFecha(colecta.fechaLimite)}</p> 
  <table class="table table-striped table-responsive"> 
    <thead> 
      <tr> 
        <th>#</th> 
        <th>Alumno</th> 
        <th>Entregado</th> 
        <th>Restante</th> 
        <th class="text-center">Abonar</th> 
      </tr> 
    </thead> 
    <tbody> 
`;

        colecta.alumnos.forEach((alumno, index) => {
            totalRecaudado += alumno.entregado;
            tablaHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td class="text-truncate">${alumno.apellidoPaterno} ${alumno.apellidoMaterno} ${alumno.nombre}</td>
                    <td class="text-end">${alumno.entregado.toFixed(2)}</td>
                    <td class="text-end">${(colecta.monto - alumno.entregado).toFixed(2)}</td>
                    <td><button class="btn btn-success" onclick="abonar('${tituloColecta}', ${index})">Abonar</button></td>
                </tr>
            `;
        });

        tablaHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Total Recaudado:</strong></td>
                        <td class="text-end"><strong>${totalRecaudado.toFixed(2)}</strong></td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        `;

        document.getElementById('tablaColecta').innerHTML = tablaHTML;
    });
}


// Registrar un abono
function abonar(tituloColecta, indiceAlumno) {
    localforage.getItem(tituloColecta).then(colecta => {
        let alumno = colecta.alumnos[indiceAlumno];

        // Registrar el abono
        Swal.fire({
            title: 'Registrar abono',
            input: 'number',
            inputPlaceholder: 'Cantidad a abonar',
            showCancelButton: true,
            confirmButtonText: 'Registrar',
        }).then(result => {
            if (result.isConfirmed) {
                let abono = parseFloat(result.value);

                if (abono > 0) {
                    alumno.entregado += abono;
                    localforage.setItem(tituloColecta, colecta).then(() => {
                        mostrarColectaSeleccionada();
                        Swal.fire('Abono registrado', '', 'success');
                    });
                }
            }
        });
    });
}

// Cargar colectas al inicio
cargarColectas();

import { App } from '@capacitor/app';
import Swal from 'sweetalert2';

let lastBackPress = 0;

// Detectar si estás en la página principal
function isHomePage() {
  // Aquí defines tu lógica. Ejemplo:
  return location.pathname === '/' || location.href.endsWith('index.html');
}

// Mostrar el SweetAlert personalizado abajo
function showExitToast() {
  Swal.fire({
    toast: true,
    position: 'bottom',
    showConfirmButton: false,
    timer: 2000,
    background: '#e0e0e0', // gris claro
    color: '#ffffff', // texto blanco
    customClass: {
      popup: 'exit-toast'
    },
    html: '<span style="font-size:16px;">Presiona dos veces para salir</span>'
  });
}

App.addListener('backButton', () => {
  const currentTime = new Date().getTime();

  if (!isHomePage()) {
    // Si no está en página principal, redirigir a ella
    window.location.href = 'index.html'; // ajusta si tu ruta principal es diferente
    return;
  }

  if (currentTime - lastBackPress < 2000) {
    App.exitApp(); // salir de la app
  } else {
    showExitToast(); // mostrar alerta
    lastBackPress = currentTime;
  }
});
