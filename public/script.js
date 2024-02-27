document.addEventListener("DOMContentLoaded", async function () {
  abrirModal();
  try {
    await obtenerEstadoDesdeServidor();
    await obtenerHistorialDesdeServidor();
    crearBotones();

    // Configurar recarga automática cada 5 segundos
    setInterval(async function () {
      await obtenerEstadoDesdeServidor();
      await obtenerHistorialDesdeServidor();
    }, 2000); // 5000 milisegundos = 5 segundos

    document
      .getElementById("formularioRifa")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        const nombreInput = document.getElementById("nombre");
        const numerosInput = document.getElementById("numeros");
        const phoneInput = document.getElementById("phone");
        const nombre = nombreInput.value.trim();
        const numeros = numerosInput.value.trim().padStart(2, "0");
        const phone = phoneInput.value.trim();

        try {
          const botonSeleccionado = await obtenerBotonSeleccionado();

          if (
            nombre === "" ||
            numeros === "" ||
            botonSeleccionado === "" ||
            phone === ""
          ) {
            mostrarError(
              "Por favor, complete todos los campos y seleccione un botón."
            );
            return;
          }

          const participante = {
            nombre,
            numero: `${botonSeleccionado}${numeros}`,
            phone,
          };

          await guardarInformacion(participante);
        } catch (error) {
          console.error("Error al obtener el botón seleccionado:", error);
        }
      });
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  }
});

// Función para abrir el modal
function abrirModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "block";
}

// Función para cerrar el modal
function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}

async function obtenerBotonSeleccionado() {
  try {
    const botonesSeleccionados = await obtenerEstadoDesdeServidor();
    return botonesSeleccionados[0] || ""; // Devolver el primer elemento (si existe)
  } catch (error) {
    console.error("Error al obtener el botón seleccionado:", error);
    throw error;
  }
}

async function obtenerEstadoDesdeServidor() {
  try {
    const response = await fetch("/obtenerEstado");
    const data = await response.json();
    return data.botonesSeleccionados || [];
  } catch (error) {
    console.error("Error al obtener el estado desde el servidor:", error);
    throw error;
  }
}

async function obtenerHistorialDesdeServidor() {
  try {
    const response = await fetch("/obtenerHistorial");
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("El historial recibido no es un array");
    }

    participantes = data;
    mostrarHistorial(participantes, document.getElementById("historial"));
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    throw error;
  }
}
async function guardarInformacion(participante) {
  try {
    const response = await fetch("/guardarInformacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(participante),
    });

    const message = await response.text();
    console.log(message);

    mostrarInformacionEnPantalla(participante);

    // Limpiar los campos del formulario
    document.getElementById("nombre").value = "";
    document.getElementById("numeros").value = "";
    document.getElementById("phone").value = "";
    mostrarError(""); // Limpiar mensaje de error
  } catch (error) {
    console.error("Error al enviar la información:", error);
    mostrarError(
      "Error al enviar la información. Por favor, inténtalo de nuevo."
    );
  }
}

function crearBotones() {
  const botonesContainer = document.getElementById("botones-container");
  console.log("Creando botones...");

  for (let i = 0; i < 100; i++) {
    const button = document.createElement("button");
    const numero = String(i).padStart(2, "0");
    button.id = numero;
    button.textContent = numero;
    button.onclick = function () {
      capturarValores(numero);
    };
    botonesContainer.appendChild(button);
  }
}

async function capturarValores(numero) {
  await actualizarEstadoServidor([numero]);
  mostrarMensajeSeleccionado(numero);
}

function actualizarEstadoServidor(botonesSeleccionados) {
  try {
    return fetch("/actualizarEstado", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ botonesSeleccionados }),
    }).then(async (response) => {
      const data = await response.json();
      console.log("Estado actualizado en el servidor:", data);
    });
  } catch (error) {
    console.error("Error al actualizar el estado en el servidor:", error);
    throw error;
  }
}

async function mostrarInformacion() {
  console.log("La función mostrarInformacion() se está ejecutando.");

  const nombreInput = document.getElementById("nombre");
  const numerosInput = document.getElementById("numeros");
  const phoneInput = document.getElementById("phone");

  const nombre = nombreInput.value.trim();
  const numeros = numerosInput.value.trim().padStart(2, "0");
  const phone = phoneInput.value.trim();

  if (nombre === "" || numeros === "" || phone === "") {
    mostrarError("Por favor, complete todos los campos.");
    return;
  }

  try {
    const botonSeleccionado = await obtenerBotonSeleccionado();

    if (botonSeleccionado === "") {
      mostrarError("Por favor, seleccione un botón.");
      return;
    }

    const participante = {
      nombre,
      numero: `${botonSeleccionado}${numeros}`,
    };

    await guardarInformacion(participante);

    // Limpiar los campos del formulario
    nombreInput.value = "";
    numerosInput.value = "";
    mostrarError(""); // Limpiar mensaje de error
  } catch (error) {
    console.error("Error al mostrar la información:", error);
  }
}

function mostrarInformacionEnPantalla(participante) {
  const resultadoDiv = document.getElementById("resultado");
  const errorMessageDiv = document.getElementById("error-message");
  const historialDiv = document.getElementById("historial");

  resultadoDiv.textContent = `Información Guardada: ${participante.nombre}: ${participante.numero}`;
  mostrarHistorial(participantes, historialDiv);
  errorMessageDiv.textContent = "";

  setTimeout(() => {
    resultadoDiv.textContent = "";
  }, 3000);
}

function mostrarError(mensaje) {
  const errorMessageDiv = document.getElementById("error-message");
  errorMessageDiv.textContent = mensaje;
}

// function mostrarHistorial(participantes, historialDiv) {
//   historialDiv.innerHTML = "<h2>Historial de Participantes</h2>";
//   if (participantes.length === 0) {
//     historialDiv.innerHTML += "<p>No hay participantes aún.</p>";
//   } else {
//     participantes.forEach(function (participante) {
//       historialDiv.innerHTML += `<p>${participante.nombre}: ${participante.numero}</p>`;
//     });
//   }
// }

function mostrarHistorial(participantes, historialDiv) {
  // Selecciona la tabla en lugar de div
  const table = document.getElementById("tablaHistorial");
  const tbody = table.querySelector("tbody");

  // Limpia el contenido anterior del cuerpo de la tabla
  tbody.innerHTML = "";

  if (participantes.length === 0) {
    // Agrega una fila indicando que no hay participantes
    const emptyRow = tbody.insertRow();
    const cell = emptyRow.insertCell(0);
    cell.colSpan = 2;
    cell.textContent = "No hay participantes aún.";
  } else {
    // Agrega una fila por cada participante
    participantes.forEach(function (participante) {
      const row = tbody.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);
      cell1.textContent = participante.nombre;
      cell2.textContent = participante.numero;
    });
  }
}

function copiarAlPortapapeles(texto) {
  // Crear un campo de texto temporal fuera del área visible
  const inputTemp = document.createElement("textarea");
  inputTemp.value = texto;

  // Asegurarse de que el campo de texto sea visible
  inputTemp.style.position = "fixed";
  inputTemp.style.left = "-9999px";
  inputTemp.style.top = "0";

  // Agregar el campo de texto al DOM
  document.body.appendChild(inputTemp);

  // Seleccionar el texto dentro del campo de texto
  inputTemp.select();
  inputTemp.setSelectionRange(0, 99999); // Para dispositivos móviles

  try {
    // Intentar copiar el texto al portapapeles utilizando el API del Portapapeles
    navigator.clipboard.writeText(texto).then(() => {
      // Mostrar el mensaje de copiado
      const mensajeCopiado = document.getElementById("mensaje-copiado");
      mensajeCopiado.innerHTML = `Texto copiado: ${texto}`;
      mensajeCopiado.style.display = "block";

      // Ocultar el mensaje después de un tiempo (ej. 2 segundos)
      setTimeout(() => {
        mensajeCopiado.style.display = "none";
      }, 2000);
    });
  } catch (err) {
    console.error("Error al intentar copiar al portapapeles:", err);
  } finally {
    // Eliminar el campo de texto temporal del DOM
    document.body.removeChild(inputTemp);
  }
}

function mostrarMensajeSeleccionado(numero) {
  const mensajeSeleccionado = document.getElementById("mensaje-seleccionado");
  mensajeSeleccionado.textContent = `Botón seleccionado: ${numero}`;
  mensajeSeleccionado.style.display = "block";

  // Ocultar el mensaje después de un tiempo (ej. 2 segundos)
  setTimeout(() => {
    mensajeSeleccionado.style.display = "none";
  }, 3000);
}
