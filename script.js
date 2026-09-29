/* =====================================================
   DONAY STORE
   SISTEMA DE CLIENTES, VENTAS E INVENTARIO
===================================================== */


/* =====================================================
   DATOS
===================================================== */

const formulario = document.getElementById("formulario-clientes");
const lista = document.getElementById("lista-clientes");
const contador = document.getElementById("contador-clientes");
const buscador = document.getElementById("buscador");
const filtroEstado = document.getElementById("filtro-estado");


/* =====================================================
   CARGAR CLIENTES EXISTENTES
===================================================== */

let clientes = JSON.parse(
    localStorage.getItem("clientes")
) || [];


/* =====================================================
   COMPATIBILIDAD CON CLIENTES ANTIGUOS
   NO BORRA LOS DATOS QUE YA TENÍAS
===================================================== */

clientes = clientes.map(function(cliente) {

    return {

        nombre: cliente.nombre || "",

        whatsapp: cliente.whatsapp || "",

        producto: cliente.producto || "",

        talla: cliente.talla || "S",

        marca: cliente.marca || "Sin marca",

        categoria: cliente.categoria || "Otro",

        fechaRegistro:
            cliente.fechaRegistro || "Sin fecha",

        horaRegistro:
            cliente.horaRegistro || "Sin hora",

        estado:
            cliente.estado || "Pendiente",

        precio:
            Number(cliente.precio) || 0,

        costo:
            Number(cliente.costo) || 0

    };

});


/* =====================================================
   INVENTARIO
===================================================== */

let inventario = JSON.parse(
    localStorage.getItem("inventario")
) || [];


/* =====================================================
   GUARDAR CLIENTES
===================================================== */

function guardarClientes() {

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

}


/* =====================================================
   GUARDAR INVENTARIO
===================================================== */

function guardarInventario() {

    localStorage.setItem(
        "inventario",
        JSON.stringify(inventario)
    );

}


/* =====================================================
   FORMATO DE DINERO
===================================================== */

function dinero(valor) {

    return Number(valor || 0).toLocaleString(
        "es-CO"
    );

}


/* =====================================================
   CALCULAR GANANCIA
===================================================== */

function calcularGanancia(cliente) {

    return (
        Number(cliente.precio || 0) -
        Number(cliente.costo || 0)
    );

}


/* =====================================================
   NAVEGACIÓN
===================================================== */

function mostrarSeccion(nombre, boton) {

    const secciones =
        document.querySelectorAll(".seccion");

    secciones.forEach(function(seccion) {

        seccion.classList.remove("activa");

    });


    const seccion =
        document.getElementById(
            "seccion-" + nombre
        );


    if (seccion) {

        seccion.classList.add("activa");

    }


    const botones =
        document.querySelectorAll(".nav-btn");

    botones.forEach(function(btn) {

        btn.classList.remove("activo");

    });


    if (boton) {

        boton.classList.add("activo");

    }


    if (nombre === "inicio") {

        actualizarInicio();

    }


    if (nombre === "ventas") {

        mostrarVentas();

    }


    if (nombre === "inventario") {

        mostrarInventario();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =====================================================
   NAVEGAR DESDE BOTONES INTERNOS
===================================================== */

function mostrarSeccionPorNombre(nombre) {

    const botones =
        document.querySelectorAll(".nav-btn");

    let botonEncontrado = null;


    botones.forEach(function(boton) {

        const texto =
            boton.textContent.toLowerCase();

        if (
            (nombre === "clientes" &&
             texto.includes("clientes")) ||

            (nombre === "ventas" &&
             texto.includes("ventas")) ||

            (nombre === "inventario" &&
             texto.includes("inventario")) ||

            (nombre === "inicio" &&
             texto.includes("inicio"))
        ) {

            botonEncontrado = boton;

        }

    });


    mostrarSeccion(
        nombre,
        botonEncontrado
    );

}


/* =====================================================
   MOSTRAR CLIENTES
===================================================== */

function mostrarClientes(
    clientesMostrar = clientes
) {

    lista.innerHTML = "";


    const vendidos =
        clientes.filter(function(cliente) {

            return cliente.estado === "Vendido";

        });


    const pendientes =
        clientes.filter(function(cliente) {

            return cliente.estado !== "Vendido";

        });


    let totalVentas = 0;

    let totalGanancia = 0;


    vendidos.forEach(function(cliente) {

        totalVentas +=
            Number(cliente.precio) || 0;

        totalGanancia +=
            calcularGanancia(cliente);

    });


    contador.innerHTML =
        clientes.length +
        " clientes registrados | " +
        vendidos.length +
        " vendidos | " +
        pendientes.length +
        " pendientes | Ventas: $" +
        dinero(totalVentas) +
        " | Ganancia: $" +
        dinero(totalGanancia);


    if (clientesMostrar.length === 0) {

        lista.innerHTML = `
            <div class="cliente">
                <h3>🔎 No encontramos resultados</h3>
                <p>
                    No hay clientes que coincidan con la búsqueda.
                </p>
            </div>
        `;

        return;

    }


    clientesMostrar.forEach(function(cliente) {

        const indiceReal =
            clientes.indexOf(cliente);


        const div =
            document.createElement("div");


        div.className = "cliente";


        const ganancia =
            calcularGanancia(cliente);


        const estadoTexto =
            cliente.estado === "Vendido"
                ? "🟢 Vendido"
                : "🟡 Pendiente";


        div.innerHTML = `

            <h3>
                👤 ${cliente.nombre}
            </h3>

            <p>

                <strong>📱 WhatsApp:</strong>
                ${cliente.whatsapp}
                <br>

                <strong>👕 Producto:</strong>
                ${cliente.producto}
                <br>

                <strong>🏷️ Marca:</strong>
                ${cliente.marca}
                <br>

                <strong>📂 Categoría:</strong>
                ${cliente.categoria}
                <br>

                <strong>📏 Talla:</strong>
                ${cliente.talla}
                <br>

                <strong>📅 Fecha:</strong>
                ${cliente.fechaRegistro}
                <br>

                <strong>⏰ Hora:</strong>
                ${cliente.horaRegistro}
                <br>

                <strong>📌 Estado:</strong>
                ${estadoTexto}
                <br>

                <strong>💵 Precio:</strong>
                $${dinero(cliente.precio)}
                <br>

                <strong>📦 Costo:</strong>
                $${dinero(cliente.costo)}
                <br>

                <strong>💰 Ganancia:</strong>
                $${dinero(ganancia)}

            </p>


            <button
                class="boton-whatsapp"
                onclick="abrirWhatsApp(${indiceReal})">

                💬 WhatsApp

            </button>


            <button
                class="boton-editar"
                onclick="editarCliente(${indiceReal})">

                ✏️ Editar

            </button>


            ${
                cliente.estado !== "Vendido"

                ?

                `
                <button
                    class="boton-editar"
                    onclick="marcarVendido(${indiceReal})">

                    💰 Marcar vendido

                </button>
                `

                :

                `
                <button
                    class="boton-editar"
                    onclick="mostrarRecibo(${indiceReal})">

                    🧾 Recibo

                </button>
                `
            }


            <button
                class="boton-eliminar"
                onclick="eliminarCliente(${indiceReal})">

                🗑️ Eliminar

            </button>

            <hr>

        `;


        lista.appendChild(div);

    });

}


/* =====================================================
   BUSCADOR
===================================================== */

function aplicarFiltros() {

    const texto =
        buscador.value
            .toLowerCase()
            .trim();


    const estado =
        filtroEstado.value;


    const filtrados =
        clientes.filter(function(cliente) {

            const coincideTexto =

                cliente.nombre
                    .toLowerCase()
                    .includes(texto)

                ||

                cliente.whatsapp
                    .toLowerCase()
                    .includes(texto)

                ||

                cliente.producto
                    .toLowerCase()
                    .includes(texto)

                ||

                cliente.marca
                    .toLowerCase()
                    .includes(texto)

                ||

                cliente.categoria
                    .toLowerCase()
                    .includes(texto)

                ||

                cliente.estado
                    .toLowerCase()
                    .includes(texto);


            const coincideEstado =

                estado === "Todos"

                ||

                cliente.estado === estado;


            return (
                coincideTexto &&
                coincideEstado
            );

        });


    mostrarClientes(filtrados);

}


buscador.addEventListener(
    "input",
    aplicarFiltros
);


filtroEstado.addEventListener(
    "change",
    aplicarFiltros
);


/* =====================================================
   REGISTRAR CLIENTE
===================================================== */

formulario.addEventListener(
    "submit",
    function(evento) {

        evento.preventDefault();


        const ahora =
            new Date();


        const cliente = {

            nombre:
                document.getElementById(
                    "nombre"
                ).value.trim(),


            whatsapp:
                document.getElementById(
                    "whatsapp"
                ).value.trim(),


            producto:
                document.getElementById(
                    "producto"
                ).value.trim(),


            marca:
                document.getElementById(
                    "marca"
                ).value,


            categoria:
                document.getElementById(
                    "categoria"
                ).value,


            talla:
                document.getElementById(
                    "talla"
                ).value,


            fechaRegistro:
                ahora.toLocaleDateString(
                    "es-CO"
                ),


            horaRegistro:
                ahora.toLocaleTimeString(
                    "es-CO"
                ),


            estado:
                "Pendiente",


            precio:
                Number(
                    document.getElementById(
                        "precio"
                    ).value
                ) || 0,


            costo:
                Number(
                    document.getElementById(
                        "costo"
                    ).value
                ) || 0

        };


        clientes.push(cliente);


        guardarClientes();


        formulario.reset();


        mostrarClientes();


        actualizarInicio();


        alert(
            "✅ Cliente registrado correctamente"
        );

    }
);


/* =====================================================
   EDITAR CLIENTE
===================================================== */

function editarCliente(indice) {

    const cliente =
        clientes[indice];


    if (!cliente) {
        return;
    }


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


    const nuevaMarca =
        prompt(
            "Marca:",
            cliente.marca
        );


    if (nuevaMarca === null) {
        return;
    }


    const nuevaCategoria =
        prompt(
            "Categoría:",
            cliente.categoria
        );


    if (nuevaCategoria === null) {
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
        nuevoNombre.trim();


    cliente.whatsapp =
        nuevoWhatsapp.trim();


    cliente.producto =
        nuevoProducto.trim();


    cliente.marca =
        nuevaMarca.trim() || "Sin marca";


    cliente.categoria =
        nuevaCategoria.trim() || "Otro";


    cliente.talla =
        nuevaTalla.trim();


    cliente.estado =
        nuevoEstado.trim();


    cliente.precio =
        Number(nuevoPrecio) || 0;


    cliente.costo =
        Number(nuevoCosto) || 0;


    guardarClientes();


    mostrarClientes();


    actualizarInicio();


    mostrarVentas();

}


/* =====================================================
   MARCAR VENDIDO
===================================================== */

function marcarVendido(indice) {

    const cliente =
        clientes[indice];


    if (!cliente) {
        return;
    }


    const confirmar =
        confirm(
            "¿Quieres marcar a " +
            cliente.nombre +
            " como VENDIDO?"
        );


    if (!confirmar) {
        return;
    }


    const precio =
        prompt(
            "Precio de venta:",
            cliente.precio || 0
        );


    if (precio === null) {
        return;
    }


    const costo =
        prompt(
            "Costo del producto:",
            cliente.costo || 0
        );


    if (costo === null) {
        return;
    }


    cliente.estado =
        "Vendido";


    cliente.precio =
        Number(precio) || 0;


    cliente.costo =
        Number(costo) || 0;


    guardarClientes();


    mostrarClientes();


    actualizarInicio();


    mostrarVentas();


    alert(
        "✅ Venta registrada correctamente"
    );

}


/* =====================================================
   ELIMINAR CLIENTE
===================================================== */

function eliminarCliente(indice) {

    const cliente =
        clientes[indice];


    if (!cliente) {
        return;
    }


    const confirmar =
        confirm(
            "¿Quieres eliminar a " +
            cliente.nombre +
            "?"
        );


    if (!confirmar) {
        return;
    }


    clientes.splice(
        indice,
        1
    );


    guardarClientes();


    mostrarClientes();


    actualizarInicio();


    mostrarVentas();

}


/* =====================================================
   WHATSAPP
===================================================== */

function abrirWhatsApp(indice) {

    const cliente =
        clientes[indice];


    if (!cliente) {
        return;
    }


    let numero =
        String(
            cliente.whatsapp
        ).replace(/\D/g, "");


    if (
        numero.length === 10 &&
        numero.startsWith("3")
    ) {

        numero =
            "57" + numero;

    }


    window.open(
        "https://wa.me/" + numero,
        "_blank"
    );

}


/* =====================================================
   ESTADÍSTICAS DEL INICIO
===================================================== */

function actualizarInicio() {

    const clientesElemento =
        document.getElementById(
            "inicio-clientes"
        );


    const ventasElemento =
        document.getElementById(
            "inicio-ventas"
        );


    const productosElemento =
        document.getElementById(
            "inicio-productos"
        );


    const gananciaElemento =
        document.getElementById(
            "inicio-ganancia"
        );


    if (!clientesElemento) {
        return;
    }


    const vendidos =
        clientes.filter(function(cliente) {

            return cliente.estado === "Vendido";

        });


    let dineroVendido = 0;

    let ganancia = 0;


    vendidos.forEach(function(cliente) {

        dineroVendido +=
            Number(cliente.precio) || 0;


        ganancia +=
            calcularGanancia(cliente);

    });


    clientesElemento.textContent =
        clientes.length;


    ventasElemento.textContent =
        vendidos.length;


    productosElemento.textContent =
        inventario.length;


    gananciaElemento.textContent =
        "$" + dinero(ganancia);

}


/* =====================================================
   VENTAS
===================================================== */

function mostrarVentas() {

    const listaVentas =
        document.getElementById(
            "lista-ventas"
        );


    if (!listaVentas) {
        return;
    }


    listaVentas.innerHTML = "";


    const ventas =
        clientes.filter(function(cliente) {

            return cliente.estado === "Vendido";

        });


    let totalDinero = 0;

    let totalGanancia = 0;


    ventas.forEach(function(cliente) {

        totalDinero +=
            Number(cliente.precio) || 0;


        totalGanancia +=
            calcularGanancia(cliente);

    });


    document.getElementById(
        "total-ventas"
    ).textContent =
        ventas.length;


    document.getElementById(
        "dinero-ventas"
    ).textContent =
        "$" + dinero(totalDinero);


    document.getElementById(
        "ganancia-ventas"
    ).textContent =
        "$" + dinero(totalGanancia);


    if (ventas.length === 0) {

        listaVentas.innerHTML = `

            <div class="cliente">

                <h3>
                    💰 Todavía no hay ventas
                </h3>

                <p>
                    Cuando marques un cliente como vendido,
                    aparecerá aquí.
                </p>

            </div>

        `;

        return;

    }


    ventas.forEach(function(cliente) {

        const indice =
            clientes.indexOf(cliente);


        const div =
            document.createElement("div");


        div.className =
            "cliente";


        div.innerHTML = `

            <h3>
                💰 ${cliente.producto}
            </h3>

            <p>

                <strong>Cliente:</strong>
                ${cliente.nombre}
                <br>

                <strong>Marca:</strong>
                ${cliente.marca}
                <br>

                <strong>Fecha:</strong>
                ${cliente.fechaRegistro}
                <br>

                <strong>Venta:</strong>
                $${dinero(cliente.precio)}
                <br>

                <strong>Costo:</strong>
                $${dinero(cliente.costo)}
                <br>

                <strong>Ganancia:</strong>
                $${dinero(
                    calcularGanancia(cliente)
                )}

            </p>


            <button
                class="boton-editar"
                onclick="mostrarRecibo(${indice})">

                🧾 Ver recibo

            </button>

        `;


        listaVentas.appendChild(div);

    });

}


/* =====================================================
   INVENTARIO
===================================================== */

function agregarProductoInventario() {

    const producto =
        document.getElementById(
            "inventario-producto"
        ).value.trim();


    const marca =
        document.getElementById(
            "inventario-marca"
        ).value;


    const talla =
        document.getElementById(
            "inventario-talla"
        ).value;


    const cantidad =
        Number(
            document.getElementById(
                "inventario-cantidad"
            ).value
        ) || 0;


    const precio =
        Number(
            document.getElementById(
                "inventario-precio"
            ).value
        ) || 0;


    const costo =
        Number(
            document.getElementById(
                "inventario-costo"
            ).value
        ) || 0;


    if (!producto) {

        alert(
            "Escribe el nombre del producto."
        );

        return;

    }


    if (cantidad <= 0) {

        alert(
            "La cantidad debe ser mayor que 0."
        );

        return;

    }


    const nuevoProducto = {

        producto: producto,

        marca: marca,

        talla: talla,

        cantidad: cantidad,

        precio: precio,

        costo: costo

    };


    inventario.push(
        nuevoProducto
    );


    guardarInventario();


    document.getElementById(
        "inventario-producto"
    ).value = "";


    document.getElementById(
        "inventario-cantidad"
    ).value = "1";


    document.getElementById(
        "inventario-precio"
    ).value = "";


    document.getElementById(
        "inventario-costo"
    ).value = "";


    mostrarInventario();


    actualizarInicio();


    alert(
        "✅ Producto agregado al inventario."
    );

}


/* =====================================================
   MOSTRAR INVENTARIO
===================================================== */

function mostrarInventario() {

    const listaInventario =
        document.getElementById(
            "lista-inventario"
        );


    if (!listaInventario) {
        return;
    }


    listaInventario.innerHTML = "";


    if (inventario.length === 0) {

        listaInventario.innerHTML = `

            <div class="cliente">

                <h3>
                    📦 Inventario vacío
                </h3>

                <p>
                    Agrega tus productos usando el formulario.
                </p>

            </div>

        `;

        return;

    }


    inventario.forEach(function(
        producto,
        indice
    ) {

        const div =
            document.createElement("div");


        div.className =
            "producto-inventario";


        div.innerHTML = `

            <div class="producto-info">

                <h3>
                    ${producto.producto}
                </h3>

                <p>
                    🏷️ Marca:
                    ${producto.marca}
                </p>

                <p>
                    📏 Talla:
                    ${producto.talla}
                </p>

                <p>
                    💵 Precio:
                    $${dinero(producto.precio)}
                </p>

                <p>
                    📦 Costo:
                    $${dinero(producto.costo)}
                </p>

            </div>


            <div>

                <div class="producto-cantidad">

                    ${producto.cantidad}
                    unidades

                </div>


                <button
                    class="boton-eliminar"
                    onclick="eliminarProductoInventario(${indice})">

                    🗑️ Eliminar

                </button>

            </div>

        `;


        listaInventario.appendChild(div);

    });

}


/* =====================================================
   ELIMINAR PRODUCTO INVENTARIO
===================================================== */

function eliminarProductoInventario(indice) {

    const producto =
        inventario[indice];


    if (!producto) {
        return;
    }


    const confirmar =
        confirm(
            "¿Eliminar " +
            producto.producto +
            " del inventario?"
        );


    if (!confirmar) {
        return;
    }


    inventario.splice(
        indice,
        1
    );


    guardarInventario();


    mostrarInventario();


    actualizarInicio();

}


/* =====================================================
   SELECCIONAR MARCA
===================================================== */

function seleccionarMarca(marca) {

    mostrarSeccionPorNombre(
        "clientes"
    );


    const campo =
        document.getElementById(
            "marca"
        );


    if (!campo) {
        return;
    }


    const opciones =
        Array.from(
            campo.options
        );


    const existe =
        opciones.some(function(
            opcion
        ) {

            return opcion.value === marca;

        });


    if (existe) {

        campo.value = marca;

    }

}


/* =====================================================
   SELECCIONAR CATEGORÍA
===================================================== */

function seleccionarCategoria(
    categoria
) {

    mostrarSeccionPorNombre(
        "clientes"
    );


    const campo =
        document.getElementById(
            "categoria"
        );


    if (!campo) {
        return;
    }


    const opciones =
        Array.from(
            campo.options
        );


    const existe =
        opciones.some(function(
            opcion
        ) {

            return opcion.value === categoria;

        });


    if (existe) {

        campo.value = categoria;

    }

}


/* =====================================================
   RECIBO
===================================================== */

function mostrarRecibo(indice) {

    const cliente =
        clientes[indice];


    if (!cliente) {
        return;
    }


    const contenido =
        document.getElementById(
            "contenido-recibo"
        );


    const ganancia =
        calcularGanancia(cliente);


    contenido.innerHTML = `

        <h2>
            🧾 DONAY STORE
        </h2>

        <p>
            <strong>Recibo de venta</strong>
        </p>

        <hr>

        <p>

            <strong>Cliente:</strong>
            ${cliente.nombre}
            <br>

            <strong>WhatsApp:</strong>
            ${cliente.whatsapp}
            <br>

            <strong>Producto:</strong>
            ${cliente.producto}
            <br>

            <strong>Marca:</strong>
            ${cliente.marca}
            <br>

            <strong>Talla:</strong>
            ${cliente.talla}
            <br>

            <strong>Fecha:</strong>
            ${cliente.fechaRegistro}
            <br>

            <strong>Hora:</strong>
            ${cliente.horaRegistro}

        </p>

        <hr>

        <p>

            <strong>Precio:</strong>
            $${dinero(cliente.precio)}
            <br>

            <strong>Ganancia:</strong>
            $${dinero(ganancia)}

        </p>

        <hr>

        <p>
            Gracias por tu compra 🛍️
        </p>

    `;


    const modal =
        document.getElementById(
            "modal-recibo"
        );


    modal.classList.add(
        "activo"
    );

}


/* =====================================================
   CERRAR RECIBO
===================================================== */

function cerrarRecibo() {

    const modal =
        document.getElementById(
            "modal-recibo"
        );


    modal.classList.remove(
        "activo"
    );

}


/* =====================================================
   IMPRIMIR RECIBO
===================================================== */

function imprimirRecibo() {

    const contenido =
        document.getElementById(
            "contenido-recibo"
        ).innerHTML;


    const ventana =
        window.open(
            "",
            "_blank"
        );


    ventana.document.write(`

        <html>

        <head>

            <title>
                Recibo DONAY STORE
            </title>

            <style>

                body {
                    font-family: Arial;
                    padding: 30px;
                    max-width: 500px;
                    margin: auto;
                }

                h2 {
                    text-align: center;
                }

                hr {
                    border: 0;
                    border-top: 1px solid #ccc;
                }

                p {
                    line-height: 1.8;
                }

            </style>

        </head>

        <body>

            ${contenido}

        </body>

        </html>

    `);


    ventana.document.close();


    ventana.focus();


    ventana.print();

}


/* =====================================================
   EXPORTAR CLIENTES A CSV
===================================================== */

function exportarCSV() {

    if (clientes.length === 0) {

        alert(
            "No hay clientes para exportar."
        );

        return;

    }


    let csv =
        "Nombre,WhatsApp,Producto,Marca,Categoria,Talla,Estado,Precio,Costo,Ganancia,Fecha,Hora\n";


    clientes.forEach(function(cliente) {

        const fila = [

            cliente.nombre,

            cliente.whatsapp,

            cliente.producto,

            cliente.marca,

            cliente.categoria,

            cliente.talla,

            cliente.estado,

            cliente.precio,

            cliente.costo,

            calcularGanancia(cliente),

            cliente.fechaRegistro,

            cliente.horaRegistro

        ];


        csv +=

            fila.map(function(valor) {

                return '"' +
                    String(valor)
                        .replace(/"/g, '""') +
                    '"';

            }).join(",") +

            "\n";

    });


    const archivo =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            archivo
        );


    const enlace =
        document.createElement("a");


    enlace.href = url;


    enlace.download =
        "clientes-donay-store.csv";


    document.body.appendChild(
        enlace
    );


    enlace.click();


    document.body.removeChild(
        enlace
    );


    URL.revokeObjectURL(
        url
    );

}


/* =====================================================
   CERRAR MODAL AL TOCAR AFUERA
===================================================== */

const modalRecibo =
    document.getElementById(
        "modal-recibo"
    );


if (modalRecibo) {

    modalRecibo.addEventListener(
        "click",
        function(evento) {

            if (
                evento.target ===
                modalRecibo
            ) {

                cerrarRecibo();

            }

        }
    );

}


/* =====================================================
   INICIAR SISTEMA
===================================================== */

guardarClientes();

guardarInventario();

mostrarClientes();

mostrarVentas();

mostrarInventario();

actualizarInicio();
