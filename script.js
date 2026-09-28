const formulario = document.querySelector("form");
const lista = document.getElementById("lista-clientes");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

function guardarClientes() {
    localStorage.setItem("clientes", JSON.stringify(clientes));
}

function mostrarClientes() {
    lista.innerHTML = "";

    if (clientes.length === 0) {
        lista.innerHTML = "<p>No hay clientes registrados todavía.</p>";
        return;
    }

    clientes.forEach(function(cliente, indice) {
        const div = document.createElement("div");

        div.innerHTML = `
            <div>
                <h3>Cliente ${indice + 1}</h3>

                <p>
                    <strong>Nombre:</strong> ${cliente.nombre}<br>
                    <strong>WhatsApp:</strong> ${cliente.whatsapp}<br>
                    <strong>Producto:</strong> ${cliente.producto}<br>
                    <strong>Talla:</strong> ${cliente.talla}
                </p>

                <button onclick="abrirWhatsApp(${indice})">
                    WhatsApp
                </button>

                <button onclick="editarCliente(${indice})">
                    Editar
                </button>

                <button onclick="eliminarCliente(${indice})">
                    Eliminar
                </button>

                <hr>
            </div>
        `;

        lista.appendChild(div);
    });
}

formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const textos = formulario.querySelectorAll('input[type="text"]');
    const whatsapp = formulario.querySelector('input[type="tel"]').value;
    const talla = formulario.querySelector("select").value;

    const cliente = {
        nombre: textos[0].value,
        whatsapp: whatsapp,
        producto: textos[1].value,
        talla: talla
    };

    clientes.push(cliente);

    guardarClientes();

    formulario.reset();

    mostrarClientes();

    alert("Cliente registrado correctamente");
});

function eliminarCliente(indice) {
    const confirmar = confirm("¿Quieres eliminar este cliente?");

    if (!confirmar) {
        return;
    }

    clientes.splice(indice, 1);

    guardarClientes();

    mostrarClientes();
}

function editarCliente(indice) {
    const cliente = clientes[indice];

    const nuevoNombre = prompt("Nombre del cliente:", cliente.nombre);

    if (nuevoNombre === null) {
        return;
    }

    const nuevoWhatsapp = prompt("WhatsApp:", cliente.whatsapp);

    if (nuevoWhatsapp === null) {
        return;
    }

    const nuevoProducto = prompt("Producto:", cliente.producto);

    if (nuevoProducto === null) {
        return;
    }

    const nuevaTalla = prompt(
        "Talla (S, M, L o XL):",
        cliente.talla
    );

    if (nuevaTalla === null) {
        return;
    }

    cliente.nombre = nuevoNombre;
    cliente.whatsapp = nuevoWhatsapp;
    cliente.producto = nuevoProducto;
    cliente.talla = nuevaTalla;

    guardarClientes();

    mostrarClientes();
}

function abrirWhatsApp(indice) {
    const cliente = clientes[indice];

    let numero = cliente.whatsapp.replace(/\D/g, "");

    if (numero.length === 10 && numero.startsWith("3")) {
        numero = "57" + numero;
    }

    window.open("https://wa.me/" + numero, "_blank");
}

mostrarClientes();
