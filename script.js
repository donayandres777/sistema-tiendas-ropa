/* =====================================================
   DONAY STORE
   SISTEMA DE CLIENTES, VENTAS E INVENTARIO
   VERSION SUPABASE
===================================================== */

/*
   IMPORTANTE:
   Esta es la Publishable Key de Supabase.
   NO poner nunca una Secret Key aquí.
*/
const SUPABASE_URL = "https://nouwdqeznmaphvisrxyq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WhcUZvNR-Rn1ThN4qnF6Vg_4jZJ5qoN";

let supabaseClient = null;
let usuarioActual = null;
let tiendaActual = null;
let cargandoSistema = true;

/* Carga Supabase JS desde CDN para este sitio HTML normal */
function cargarLibreriaSupabase() {
    return new Promise(function(resolve, reject) {
        if (window.supabase) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve;
        script.onerror = function() {
            reject(new Error("No se pudo cargar Supabase."));
        };
        document.head.appendChild(script);
    });
}

/* =====================================================
   DATOS
===================================================== */

const formulario = document.getElementById("formulario-clientes");
const lista = document.getElementById("lista-clientes");
const contador = document.getElementById("contador-clientes");
const buscador = document.getElementById("buscador");
const filtroEstado = document.getElementById("filtro-estado");

let clientes = [];
let inventario = [];

/* =====================================================
   UTILIDADES SUPABASE
===================================================== */

function mostrarErrorSupabase(error, mensaje) {
    console.error(mensaje, error);

    alert(
        "❌ " + mensaje +
        "\n\n" +
        (error && error.message ? error.message : "Revisa tu conexión.")
    );
}

function fechaTexto(fecha) {
    if (!fecha) return "Sin fecha";

    const d = new Date(fecha);

    if (Number.isNaN(d.getTime())) {
        return String(fecha);
    }

    return d.toLocaleDateString("es-CO");
}

function horaTexto(fecha) {
    if (!fecha) return "Sin hora";

    const d = new Date(fecha);

    if (Number.isNaN(d.getTime())) {
        return "Sin hora";
    }

    return d.toLocaleTimeString("es-CO");
}

function convertirClienteDesdeDB(cliente) {
    return {
        id: cliente.id,

        nombre: cliente.nombre || "",
        whatsapp: cliente.whatsapp || "",
        producto: cliente.producto || "",
        talla: cliente.talla || "S",
        marca: cliente.marca || "Sin marca",
        categoria: cliente.categoria || "Otro",

        fechaRegistro:
            cliente.fecha_registro
                ? fechaTexto(cliente.fecha_registro)
                : "Sin fecha",

        horaRegistro:
            cliente.fecha_registro
                ? horaTexto(cliente.fecha_registro)
                : "Sin hora",

        estado:
            cliente.estado === "vendido"
                ? "Vendido"
                : "Pendiente",

        precio: Number(cliente.precio) || 0,
        costo: Number(cliente.costo) || 0,

        fechaVenta: cliente.fecha_venta || null
    };
}

function convertirInventarioDesdeDB(producto) {
    return {
        id: producto.id,

        producto: producto.producto || "",
        marca: producto.marca || "Sin marca",
        talla: producto.talla || "S",
        cantidad: Number(producto.cantidad) || 0,
        precio: Number(producto.precio) || 0,
        costo: Number(producto.costo) || 0
    };
}

/* =====================================================
   LOGIN
===================================================== */

function mostrarLogin() {
    let login = document.getElementById("login-supabase");

    if (login) {
        login.classList.remove("oculto");
        return;
    }

    login = document.createElement("div");
    login.id = "login-supabase";

    login.innerHTML = `
        <div class="login-caja">
            <h1>🛍️ DONAY STORE</h1>

            <div id="modo-login">
                <p>Inicia sesión para entrar a tu tienda.</p>

                <form id="form-login-supabase">
                    <input
                        id="login-email"
                        type="email"
                        placeholder="Correo electrónico"
                        autocomplete="email"
                        required
                    >

                    <input
                        id="login-password"
                        type="password"
                        placeholder="Contraseña"
                        autocomplete="current-password"
                        required
                    >

                    <button type="submit">
                        🔐 Iniciar sesión
                    </button>
                </form>

                <button type="button" id="mostrar-registro" class="boton-secundario">
                    🏪 Crear mi tienda
                </button>
            </div>

            <div id="modo-registro" class="oculto-login">
                <p>Crea tu cuenta y tu tienda en DONAY STORE.</p>

                <form id="form-registro-supabase">
                    <input
                        id="registro-tienda"
                        type="text"
                        placeholder="Nombre de tu tienda"
                        autocomplete="organization"
                        required
                    >

                    <input
                        id="registro-email"
                        type="email"
                        placeholder="Correo electrónico"
                        autocomplete="email"
                        required
                    >

                    <input
                        id="registro-password"
                        type="password"
                        placeholder="Crea una contraseña"
                        autocomplete="new-password"
                        minlength="6"
                        required
                    >

                    <button type="submit">
                        🚀 Crear mi cuenta
                    </button>
                </form>

                <button type="button" id="volver-login" class="boton-secundario">
                    ← Ya tengo una cuenta
                </button>
            </div>

            <p id="login-mensaje" class="login-mensaje"></p>
        </div>
    `;

    document.body.appendChild(login);

    const estilo = document.createElement("style");

    estilo.textContent = `
        #login-supabase {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(0,0,0,.96);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        #login-supabase.oculto {
            display: none;
        }

        .login-caja {
            width: min(420px, 100%);
            max-height: 92vh;
            overflow-y: auto;
            background: #fff;
            color: #111;
            border-radius: 18px;
            padding: 28px;
            box-sizing: border-box;
            box-shadow: 0 20px 60px rgba(0,0,0,.35);
        }

        .login-caja h1 {
            margin: 0 0 10px;
            text-align: center;
        }

        .login-caja p {
            text-align: center;
            margin: 8px 0 20px;
        }

        #form-login-supabase input,
        #form-registro-supabase input {
            width: 100%;
            box-sizing: border-box;
            margin: 7px 0;
            padding: 14px;
            border: 1px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
        }

        #form-login-supabase button,
        #form-registro-supabase button {
            width: 100%;
            margin-top: 10px;
            padding: 14px;
            border: 0;
            border-radius: 10px;
            background: #111;
            color: #fff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
        }

        .boton-secundario {
            width: 100%;
            margin-top: 10px;
            padding: 12px;
            border: 1px solid #111;
            border-radius: 10px;
            background: #fff;
            color: #111;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
        }

        .oculto-login {
            display: none;
        }

        .login-mensaje {
            min-height: 20px;
            color: #c00;
        }

        #boton-cerrar-sesion {
            position: fixed;
            right: 14px;
            bottom: 14px;
            z-index: 1000;
            border: 0;
            border-radius: 999px;
            padding: 10px 14px;
            background: #111;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
        }
    `;

    document.head.appendChild(estilo);

    document
        .getElementById("form-login-supabase")
        .addEventListener("submit", iniciarSesion);

    document
        .getElementById("form-registro-supabase")
        .addEventListener("submit", registrarTienda);

    document
        .getElementById("mostrar-registro")
        .addEventListener("click", mostrarFormularioRegistro);

    document
        .getElementById("volver-login")
        .addEventListener("click", mostrarFormularioLogin);

    login.classList.remove("oculto");
}

function mostrarFormularioRegistro() {
    document.getElementById("modo-login").style.display = "none";
    document.getElementById("modo-registro").style.display = "block";
    document.getElementById("login-mensaje").textContent = "";
}

function mostrarFormularioLogin() {
    document.getElementById("modo-registro").style.display = "none";
    document.getElementById("modo-login").style.display = "block";
    document.getElementById("login-mensaje").textContent = "";
}

function ocultarLogin() {
    const login = document.getElementById("login-supabase");

    if (login) {
        login.classList.add("oculto");
    }
}

async function iniciarSesion(evento) {
    evento.preventDefault();

    const email =
        document.getElementById("login-email").value.trim();

    const password =
        document.getElementById("login-password").value;

    const mensaje =
        document.getElementById("login-mensaje");

    mensaje.textContent = "Entrando...";

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        mensaje.textContent =
            "❌ " + error.message;
        return;
    }

    await cargarDatosDelUsuario();

    ocultarLogin();
}

async function registrarTienda(evento) {
    evento.preventDefault();

    const nombreTienda =
        document.getElementById("registro-tienda").value.trim();

    const email =
        document.getElementById("registro-email").value.trim();

    const password =
        document.getElementById("registro-password").value;

    const mensaje =
        document.getElementById("login-mensaje");

    if (!nombreTienda) {
        mensaje.textContent = "❌ Escribe el nombre de tu tienda.";
        return;
    }

    mensaje.textContent = "Creando tu tienda...";

    const { data, error } =
        await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre_tienda: nombreTienda
                }
            }
        });

    if (error) {
        mensaje.textContent =
            "❌ " + error.message;
        return;
    }

    if (!data.session) {
        mensaje.textContent =
            "✅ Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.";
        return;
    }

    await cargarDatosDelUsuario();

    mensaje.textContent = "✅ ¡Tienda creada correctamente!";
    ocultarLogin();
}

async function cerrarSesion() {
    const confirmar =
        confirm("¿Quieres cerrar sesión?");

    if (!confirmar) return;

    await supabaseClient.auth.signOut();

    location.reload();
}

function crearBotonCerrarSesion() {
    if (document.getElementById("boton-cerrar-sesion")) {
        return;
    }

    const boton = document.createElement("button");

    boton.id = "boton-cerrar-sesion";
    boton.textContent = "🚪 Salir";
    boton.onclick = cerrarSesion;

    document.body.appendChild(boton);
}

/* =====================================================
   CARGAR DATOS DEL USUARIO
===================================================== */

async function cargarDatosDelUsuario() {
    const {
        data: {
            user
        },
        error: errorSesion
    } = await supabaseClient.auth.getUser();

    if (errorSesion || !user) {
        mostrarLogin();
        return false;
    }

    usuarioActual = user;

    const {
        data: perfil,
        error: errorPerfil
    } = await supabaseClient
        .from("perfiles")
        .select("tienda_id,nombre,rol")
        .eq("id", user.id)
        .single();

    if (errorPerfil || !perfil) {
        mostrarErrorSupabase(
            errorPerfil,
            "No encontramos el perfil de esta cuenta."
        );
        return false;
    }

    tiendaActual = perfil.tienda_id;

    // Guardar y mostrar el nombre de la tienda.
    // Cada cuenta usa solamente el nombre de SU propia tienda.
    const nombreTiendaMetadata =
        user.user_metadata?.nombre_tienda?.trim() || "";

    if (nombreTiendaMetadata && perfil.rol === "dueño") {
        const { error: errorNombreTienda } =
            await supabaseClient
                .from("tiendas")
                .update({ nombre: nombreTiendaMetadata })
                .eq("id", tiendaActual);

        if (errorNombreTienda) {
            console.warn(
                "No se pudo guardar el nombre de la tienda:",
                errorNombreTienda
            );
        }
    }

    const {
        data: datosTienda,
        error: errorTienda
    } = await supabaseClient
        .from("tiendas")
        .select("nombre")
        .eq("id", tiendaActual)
        .single();

    const nombreTienda =
        nombreTiendaMetadata ||
        (datosTienda && datosTienda.nombre) ||
        "DONAY STORE";

    if (errorTienda) {
        console.warn(
            "No se pudo leer el nombre de la tienda:",
            errorTienda
        );
    }

    actualizarNombreTiendaEnPantalla(nombreTienda);

    await cargarClientesDesdeSupabase();
    await cargarInventarioDesdeSupabase();

    crearBotonCerrarSesion();

    mostrarClientes();
    mostrarVentas();
    mostrarInventario();
    actualizarInicio();

    return true;
}

async function cargarClientesDesdeSupabase() {
    const {
        data,
        error
    } = await supabaseClient
        .from("clientes")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudieron cargar los clientes."
        );
        return;
    }

    clientes =
        (data || []).map(convertirClienteDesdeDB);
}

async function cargarInventarioDesdeSupabase() {
    const {
        data,
        error
    } = await supabaseClient
        .from("inventario")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudo cargar el inventario."
        );
        return;
    }

    inventario =
        (data || []).map(convertirInventarioDesdeDB);
}

/* =====================================================
   NOMBRE DE LA TIENDA
   Cada cuenta ve el nombre de su propia tienda.
===================================================== */

function actualizarNombreTiendaEnPantalla(nombre) {

    const nombreLimpio =
        String(nombre || "DONAY STORE").trim() ||
        "DONAY STORE";

    document.title =
        nombreLimpio + " | Gestión de Clientes";

    // Cambia el titulo principal de la tienda,
    // pero no toca el formulario de inicio de sesión.
    const candidatos =
        Array.from(
            document.querySelectorAll("h1, h2, [data-nombre-tienda]")
        );

    candidatos.forEach(function(elemento) {

        if (
            elemento.closest("#login-supabase") ||
            elemento.closest("#modal-recibo")
        ) {
            return;
        }

        const texto =
            elemento.textContent.trim().toUpperCase();

        if (
            texto === "DONAY STORE" ||
            texto.includes("DONAY STORE")
        ) {
            elemento.textContent = nombreLimpio;
        }

    });

}


/* =====================================================
   COMPATIBILIDAD LOCAL
   Estas funciones ya no guardan la base de datos.
   Supabase es ahora la fuente principal.
===================================================== */

function guardarClientes() {
    return true;
}

function guardarInventario() {
    return true;
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
    async function(evento) {

        evento.preventDefault();

        if (!supabaseClient || !tiendaActual) {
            alert("Espera a que la tienda termine de cargar.");
            return;
        }

        const ahora = new Date();

        const cliente = {
            tienda_id: tiendaActual,

            nombre:
                document.getElementById("nombre").value.trim(),

            whatsapp:
                document.getElementById("whatsapp").value.trim(),

            producto:
                document.getElementById("producto").value.trim(),

            marca:
                document.getElementById("marca").value,

            categoria:
                document.getElementById("categoria").value,

            talla:
                document.getElementById("talla").value,

            fecha_registro:
                ahora.toISOString(),

            estado:
                "pendiente",

            precio:
                Number(
                    document.getElementById("precio").value
                ) || 0,

            costo:
                Number(
                    document.getElementById("costo").value
                ) || 0
        };

        const {
            data,
            error
        } = await supabaseClient
            .from("clientes")
            .insert(cliente)
            .select()
            .single();

        if (error) {
            mostrarErrorSupabase(
                error,
                "No se pudo registrar el cliente."
            );
            return;
        }

        clientes.unshift(
            convertirClienteDesdeDB(data)
        );

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

async function editarCliente(indice) {

    const cliente = clientes[indice];

    if (!cliente) {
        return;
    }

    const nuevoNombre =
        prompt(
            "Nombre del cliente:",
            cliente.nombre
        );

    if (nuevoNombre === null) return;

    const nuevoWhatsapp =
        prompt(
            "WhatsApp:",
            cliente.whatsapp
        );

    if (nuevoWhatsapp === null) return;

    const nuevoProducto =
        prompt(
            "Producto:",
            cliente.producto
        );

    if (nuevoProducto === null) return;

    const nuevaMarca =
        prompt(
            "Marca:",
            cliente.marca
        );

    if (nuevaMarca === null) return;

    const nuevaCategoria =
        prompt(
            "Categoría:",
            cliente.categoria
        );

    if (nuevaCategoria === null) return;

    const nuevaTalla =
        prompt(
            "Talla (S, M, L o XL):",
            cliente.talla
        );

    if (nuevaTalla === null) return;

    const nuevoEstado =
        prompt(
            "Estado: Pendiente o Vendido",
            cliente.estado
        );

    if (nuevoEstado === null) return;

    const nuevoPrecio =
        prompt(
            "Precio de venta:",
            cliente.precio
        );

    if (nuevoPrecio === null) return;

    const nuevoCosto =
        prompt(
            "Costo del producto:",
            cliente.costo
        );

    if (nuevoCosto === null) return;

    const estadoNormalizado =
        nuevoEstado.trim().toLowerCase() === "vendido"
            ? "vendido"
            : "pendiente";

    const cambios = {
        nombre: nuevoNombre.trim(),
        whatsapp: nuevoWhatsapp.trim(),
        producto: nuevoProducto.trim(),
        marca: nuevaMarca.trim() || "Sin marca",
        categoria: nuevaCategoria.trim() || "Otro",
        talla: nuevaTalla.trim(),
        estado: estadoNormalizado,
        precio: Number(nuevoPrecio) || 0,
        costo: Number(nuevoCosto) || 0
    };

    if (estadoNormalizado === "vendido" && !cliente.fechaVenta) {
        cambios.fecha_venta = new Date().toISOString();
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("clientes")
        .update(cambios)
        .eq("id", cliente.id)
        .select()
        .single();

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudo actualizar el cliente."
        );
        return;
    }

    clientes[indice] =
        convertirClienteDesdeDB(data);

    mostrarClientes();
    actualizarInicio();
    mostrarVentas();
}


/* =====================================================
   MARCAR VENDIDO
===================================================== */

async function marcarVendido(indice) {

    const cliente = clientes[indice];

    if (!cliente) {
        return;
    }

    const confirmar =
        confirm(
            "¿Quieres marcar a " +
            cliente.nombre +
            " como VENDIDO?"
        );

    if (!confirmar) return;

    const precio =
        prompt(
            "Precio de venta:",
            cliente.precio || 0
        );

    if (precio === null) return;

    const costo =
        prompt(
            "Costo del producto:",
            cliente.costo || 0
        );

    if (costo === null) return;

    const precioNumero =
        Number(precio) || 0;

    const costoNumero =
        Number(costo) || 0;

    const fechaVenta =
        new Date().toISOString();

    const {
        data,
        error
    } = await supabaseClient
        .from("clientes")
        .update({
            estado: "vendido",
            precio: precioNumero,
            costo: costoNumero,
            fecha_venta: fechaVenta
        })
        .eq("id", cliente.id)
        .select()
        .single();

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudo registrar la venta."
        );
        return;
    }

    clientes[indice] =
        convertirClienteDesdeDB(data);

    /* Guardamos también la venta en la tabla ventas */
    const {
        error: errorVenta
    } = await supabaseClient
        .from("ventas")
        .insert({
            tienda_id: tiendaActual,
            cliente_id: cliente.id,
            cliente_nombre: cliente.nombre,
            whatsapp: cliente.whatsapp,
            producto: cliente.producto,
            marca: cliente.marca,
            talla: cliente.talla,
            precio: precioNumero,
            costo: costoNumero,
            ganancia:
                precioNumero - costoNumero,
            fecha_venta: fechaVenta
        });

    if (errorVenta) {
        console.warn(
            "El cliente se marcó vendido, pero la copia de la venta no pudo guardarse.",
            errorVenta
        );
    }

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

async function eliminarCliente(indice) {

    const cliente = clientes[indice];

    if (!cliente) {
        return;
    }

    const confirmar =
        confirm(
            "¿Quieres eliminar a " +
            cliente.nombre +
            "?"
        );

    if (!confirmar) return;

    /* Primero quitamos las ventas relacionadas */
    await supabaseClient
        .from("ventas")
        .delete()
        .eq("cliente_id", cliente.id);

    const {
        error
    } = await supabaseClient
        .from("clientes")
        .delete()
        .eq("id", cliente.id);

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudo eliminar el cliente."
        );
        return;
    }

    clientes.splice(indice, 1);

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

async function agregarProductoInventario() {

    if (!supabaseClient || !tiendaActual) {
        alert("Espera a que la tienda termine de cargar.");
        return;
    }

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
        tienda_id: tiendaActual,
        producto: producto,
        marca: marca,
        talla: talla,
        cantidad: cantidad,
        precio: precio,
        costo: costo
    };

    const {
        data,
        error
    } = await supabaseClient
        .from("inventario")
        .insert(nuevoProducto)
        .select()
        .single();

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudo agregar el producto al inventario."
        );
        return;
    }

    inventario.unshift(
        convertirInventarioDesdeDB(data)
    );

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

async function eliminarProductoInventario(indice) {

    const producto = inventario[indice];

    if (!producto) {
        return;
    }

    const confirmar =
        confirm(
            "¿Eliminar " +
            producto.producto +
            " del inventario?"
        );

    if (!confirmar) return;

    const {
        error
    } = await supabaseClient
        .from("inventario")
        .delete()
        .eq("id", producto.id);

    if (error) {
        mostrarErrorSupabase(
            error,
            "No se pudo eliminar el producto."
        );
        return;
    }

    inventario.splice(indice, 1);

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
            🧾 ${
                document.title.replace(" | Gestión de Clientes", "") ||
                "DONAY STORE"
            }
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
                Recibo ${
                    document.title.replace(" | Gestión de Clientes", "") ||
                    "DONAY STORE"
                }
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
   INICIAR SISTEMA CON SUPABASE
===================================================== */

async function iniciarSistemaSupabase() {

    try {

        await cargarLibreriaSupabase();

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();

        if (!session) {
            cargandoSistema = false;
            mostrarLogin();
            return;
        }

        await cargarDatosDelUsuario();

        cargandoSistema = false;

    } catch (error) {

        console.error(error);

        alert(
            "❌ No se pudo conectar con Supabase.\n\n" +
            "Revisa tu conexión a internet."
        );

    }
}

iniciarSistemaSupabase();

