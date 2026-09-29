const formulario = document.querySelector("form");
const lista = document.getElementById("lista-clientes");
const contador = document.getElementById("contador-clientes");
const buscador = document.getElementById("buscador");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];


/* =========================
   PREPARAR CLIENTES ANTIGUOS
========================= */

clientes = clientes.map(function(cliente) {

    return {
        nombre: cliente.nombre || "",
        whatsapp: cliente.whatsapp || "",
        producto: cliente.producto || "",
        talla: cliente.talla || "S",
        fechaRegistro: cliente.fechaRegistro || "Sin fecha",
        horaRegistro: cliente.horaRegistro || "Sin hora",
        estado: cliente.estado || "Pendiente",
        precio: Number(cliente.precio) || 0,
        costo: Number(cliente.costo) || 0
    };

});

guardarClientes();


/* =========================
   GUARDAR CLIENTES
========================= */

function guardarClientes() {

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

}


/* =========================
   CALCULAR GANANCIA
========================= */

function calcularGanancia(cliente) {

    return Number(cliente.precio) - Number(cliente.costo);

}


/* =========================
   MOSTRAR CLIENTES
========================= */

function mostrarClientes(clientesMostrar = clientes) {

    lista.innerHTML = "";

    const vendidos = clientes.filter(function(cliente) {
        return cliente.estado === "Vendido";
    });

    const pendientes = clientes.filter(function(cliente) {
        return cliente.estado !== "Vendido";
    });

    let totalVentas = 0;

    vendidos.forEach(function(cliente) {
        totalVentas += Number(cliente.precio) || 0;
    });

    contador.innerHTML =
        clientes.length +
        " clientes registrados | " +
        vendidos.length +
        " vendidos | " +
        pendientes.length +
        " pendientes | $" +
        totalVentas.toLocaleString("es-CO");


    if (clientesMostrar.length === 0) {

        lista.innerHTML =
            "<p>No hay clientes que coincidan con la búsqueda.</p>";

        return;

    }


    clientesMostrar.forEach(function(cliente) {

        const indiceReal = clientes.indexOf(cliente);

        const div = document.createElement("div");

        div.className = "cliente";

        const ganancia = calcularGanancia(cliente);

        div.innerHTML = `
            <div>

                <h3>
                    Cliente ${indiceReal + 1}
                </h3>

                <p>

                    <strong>Nombre:</strong>
                    ${cliente.nombre}
                    <br>

                    <strong>WhatsApp:</strong>
                    ${cliente.whatsapp}
                    <br>

                    <strong>Producto:</strong>
                    ${cliente.producto}
                    <br>

                    <strong>Talla:</strong>
                    ${cliente.talla}
                    <br>

                    <strong>Fecha:</strong>
                    ${cliente.fechaRegistro}
                    <br>

                    <strong>Hora:</strong>
                    ${cliente.horaRegistro}
                    <br>

                    <strong>Estado:</strong>
                    ${cliente.estado}
                    <br>

                    <strong>Precio:</strong>
                    $${Number(cliente.precio).toLocaleString("es-CO")}
                    <br>

                    <strong>Costo:</strong>
                    $${Number(cliente.costo).toLocaleString("es-CO")}
                    <br>

                    <strong>Ganancia:</strong>
                    $${ganancia.toLocaleString("es-CO")}

                </p>


                <button
                    class="boton-whatsapp"
                    onclick="abrirWhatsApp(${indiceReal})">

                    WhatsApp

                </button>


                <button
                    class="boton-editar"
                    onclick="editarCliente(${indiceReal})">

                    Editar

                </button>


                <button
                    class="boton-editar"
                    onclick="marcarVendido(${indiceReal})">

                    Marcar vendido

                </button>


                <button
                    class="boton-eliminar"
                    onclick="eliminarCliente(${indiceReal})">

                    Eliminar

                </button>


                <hr>

            </div>
        `;

        lista.appendChild(div);

    });

}


/* =========================
   BUSCADOR
========================= */

buscador.addEventListener("input", function() {

    const texto = buscador.value.toLowerCase().trim();

    const filtrados = clientes.filter(function(cliente) {

        return (

            cliente.nombre
                .toLowerCase()
                .includes(texto)

            ||

            cliente.whatsapp
                .includes(texto)

            ||

            cliente.producto
                .toLowerCase()
                .includes(texto)

            ||

            cliente.estado
                .toLowerCase()
                .includes(texto)

        );

    });


    mostrarClientes(filtrados);

});


/* =========================
   REGISTRAR CLIENTE
========================= */

formulario.addEventListener("submit", function(evento) {

    evento.preventDefault();


    const textos =
        formulario.querySelectorAll(
            'input[type="text"]'
        );


    const whatsapp =
        formulario.querySelector(
            'input[type="tel"]'
        ).value;


    const talla =
        formulario.querySelector(
            "select"
        ).value;


    const ahora = new Date();


    const cliente = {

        nombre: textos[0].value,

        whatsapp: whatsapp,

        producto: textos[1].value,

        talla: talla,

        fechaRegistro:
            ahora.toLocaleDateString("es-CO"),

        horaRegistro:
            ahora.toLocaleTimeString("es-CO"),

        estado: "Pendiente",

        precio: 0,

        costo: 0

    };


    clientes.push(cliente);


    guardarClientes();


    formulario.reset();


    mostrarClientes();


    alert(
        "Cliente registrado correctamente"
    );

});


/* =========================
   EDITAR CLIENTE
========================= */

function editarCliente(indice) {

    const cliente = clientes[indice];


    const nuevoNombre =
        prompt(
            "Nombre del cliente:",
            cliente.nombre
        );


    if (nuevoNombre === null) {
        return;
    }


    const nuevoWhatsapp =
        prompt(
            "WhatsApp:",
            cliente.whatsapp
        );


    if (nuevoWhatsapp === null) {
        return;
    }


    const nuevoProducto =
        prompt(
            "Producto:",
            cliente.producto
        );


    if (nuevoProducto === null) {
        return;
    }


    const nuevaTalla =
        prompt(
            "Talla (S, M, L o XL):",
            cliente.talla
        );


    if (nuevaTalla === null) {
        return;
    }


    const nuevoEstado =
        prompt(
            "Estado: Pendiente o Vendido",
            cliente.estado
        );


    if (nuevoEstado === null) {
        return;
    }


    const nuevoPrecio =
        prompt(
            "Precio de venta:",
            cliente.precio
        );


    if (nuevoPrecio === null) {
        return;
    }


    const nuevoCosto =
        prompt(
            "Costo del producto:",
            cliente.costo
        );


    if (nuevoCosto === null) {
        return;
    }


    cliente.nombre =
        nuevoNombre;

    cliente.whatsapp =
        nuevoWhatsapp;

    cliente.producto =
        nuevoProducto;

    cliente.talla =
        nuevaTalla;

    cliente.estado =
        nuevoEstado;

    cliente.precio =
        Number(nuevoPrecio) || 0;

    cliente.costo =
        Number(nuevoCosto) || 0;


    guardarClientes();


    mostrarClientes();

}


/* =========================
   MARCAR COMO VENDIDO
========================= */

function marcarVendido(indice) {

    const cliente = clientes[indice];


    const confirmar =
        confirm(
            "¿Quieres marcar a " +
            cliente.nombre +
            " como VENDIDO?"
        );


    if (!confirmar) {
        return;
    }


    cliente.estado = "Vendido";


    const precio =
        prompt(
            "Precio de venta:",
            cliente.precio || 0
        );


    if (precio !== null) {

        cliente.precio =
            Number(precio) || 0;

    }


    const costo =
        prompt(
            "Costo del producto:",
            cliente.costo || 0
        );


    if (costo !== null) {

        cliente.costo =
            Number(costo) || 0;

    }


    guardarClientes();


    mostrarClientes();


    alert(
        "Venta registrada correctamente"
    );

}


/* =========================
   ELIMINAR CLIENTE
========================= */

function eliminarCliente(indice) {

    const confirmar =
        confirm(
            "¿Quieres eliminar este cliente?"
        );


    if (!confirmar) {
        return;
    }


    clientes.splice(indice, 1);


    guardarClientes();


    mostrarClientes();

}


/* =========================
   ABRIR WHATSAPP
========================= */

function abrirWhatsApp(indice) {

    const cliente = clientes[indice];


    let numero =
        cliente.whatsapp.replace(/\D/g, "");


    if (
        numero.length === 10 &&
        numero.startsWith("3")
    ) {

        numero = "57" + numero;

    }


    window.open(
        "https://wa.me/" + numero,
        "_blank"
    );

}


/* =========================
   MOSTRAR AL CARGAR
========================= */

mostrarClientes();
