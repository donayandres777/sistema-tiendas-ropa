const formulario = document.querySelector("form");

formulario.addEventListener("submit", function(evento) {
  evento.preventDefault();

  const campos = formulario.querySelectorAll("input");
  const talla = formulario.querySelector("select");

  const cliente = {
    nombre: campos[0].value,
    whatsapp: campos[1].value,
    producto: campos[2].value,
    talla: talla.value,
    fecha: new Date().toLocaleString()
  };

  const clientesGuardados =
    JSON.parse(localStorage.getItem("clientes")) || [];

  clientesGuardados.push(cliente);

  localStorage.setItem(
    "clientes",
    JSON.stringify(clientesGuardados)
  );

  alert("Cliente registrado correctamente");

  formulario.reset();
});
