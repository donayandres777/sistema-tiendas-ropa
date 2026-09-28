const formulario = document.querySelector("form");

formulario.addEventListener("submit", function(evento) {
  evento.preventDefault();

  const nombre = formulario.querySelector('input[type="text"]').value;
  const whatsapp = formulario.querySelector('input[type="tel"]').value;
  const producto = formulario.querySelectorAll('input[type="text"]')[1].value;
  const talla = formulario.querySelector("select").value;

  const cliente = {
    nombre: nombre,
    whatsapp: whatsapp,
    producto: producto,
    talla: talla
  };

  let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

  clientes.push(cliente);

  localStorage.setItem("clientes", JSON.stringify(clientes));

  alert("Cliente registrado correctamente");

  formulario.reset();
  mostrarClientes();
});
function mostrarClientes() {
    const lista = document.getElementById("lista-clientes");

    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

    lista.innerHTML = "";

    clientes.forEach((cliente) => {
        const div = document.createElement("div");

        div.innerHTML = `
            <p>
                <strong>Nombre:</strong> ${cliente.nombre}<br>
                <strong>WhatsApp:</strong> ${cliente.whatsapp}<br>
                <strong>Producto:</strong> ${cliente.producto}<br>
                <strong>Talla:</strong> ${cliente.talla}
            </p>
            <hr>
        `;

        lista.appendChild(div);
    });
}

mostrarClientes();
