const formulario = document.querySelector("form");
const lista = document.getElementById("lista-clientes");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

function mostrarClientes() {
    lista.innerHTML = "";

    if (clientes.length === 0) {
        lista.innerHTML = "<p>No hay clientes registrados todavía.</p>";
        return;
    }

    clientes.forEach(function(cliente, indice) {
        const div = document.createElement("div");

        div.innerHTML = `
            <p>
                <strong>Cliente ${indice + 1}</strong><br>
                Nombre: ${cliente.nombre}<br>
                WhatsApp: ${cliente.whatsapp}<br>
                Producto: ${cliente.producto}<br>
                Talla: ${cliente.talla}
            </p>
            <hr>
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

    localStorage.setItem("clientes", JSON.stringify(clientes));

    formulario.reset();

    mostrarClientes();

    alert("Cliente registrado correctamente");
});

mostrarClientes();
