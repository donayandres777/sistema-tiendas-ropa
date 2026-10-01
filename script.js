/* =========================================================
   MI CONTABILIDAD
   Gestión de negocios, ventas, productos, servicios,
   gastos, clientes y finanzas.
   Supabase - versión multi-negocio
========================================================= */

const SUPABASE_URL = "https://nouwdqeznmaphvisrxyq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WhcUZvNR-Rn1ThN4qnF6Vg_4jZJ5qoN";
const APP_URL = "https://donayandres777.github.io/sistema-tiendas-ropa/";

let supabaseClient = null;
let usuarioActual = null;
let tiendaActual = null;
let productosServicios = [];
let gastos = [];
let clientes = [];
let ventas = [];
let cuentas = [];
let pagos = [];
let periodoActual = "mes";

function cargarSupabase() {
    return new Promise((resolve, reject) => {
        if (window.supabase) return resolve();
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload = resolve;
        s.onerror = () => reject(new Error("No se pudo cargar Supabase."));
        document.head.appendChild(s);
    });
}

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const num = value => Number(value) || 0;
const dinero = value => new Intl.NumberFormat("es-CO", {style:"currency", currency: tiendaActual?.moneda || "COP", maximumFractionDigits:0}).format(num(value));
const fechaHoy = () => new Date().toISOString().slice(0,10);
const fechaTexto = value => value ? new Date(value).toLocaleDateString("es-CO") : "—";

function errorUI(error, mensaje = "No se pudo completar la operación.") {
    console.error(error);
    alert("❌ " + mensaje + "\n\n" + (error?.message || "Revisa tu conexión."));
}

function ponerTexto(ids, texto) {
    ids.forEach(id => { if ($(id)) $(id).textContent = texto; });
}

function mostrarAplicacion(visible) {
    const app = $("app");
    if (app) app.style.display = visible ? "" : "none";
    const login = $("login-supabase");
    if (login) login.classList.toggle("oculto", visible);
    const carga = $("pantalla-carga");
    if (carga) carga.style.display = visible ? "none" : "flex";
}

function actualizarNombreNegocio() {
    const nombre = tiendaActual?.nombre || "Mi negocio";
    document.title = "MI CONTABILIDAD | " + nombre;
    document.querySelectorAll("[data-nombre-tienda]").forEach(el => el.textContent = nombre);
    document.querySelectorAll(".nombre-tienda, #nombre-tienda, #titulo-tienda").forEach(el => el.textContent = nombre);
}

function crearLogin() {
    if ($("login-supabase")) return;
    const box = document.createElement("div");
    box.id = "login-supabase";
    box.innerHTML = `
      <div class="login-caja">
        <div class="login-logo">📊</div>
        <h1>MI CONTABILIDAD</h1>
        <p>Administra tu negocio desde tu celular.</p>
        <div id="modo-login">
          <form id="form-login-supabase">
            <input id="login-email" type="email" placeholder="Correo electrónico" autocomplete="email" required>
            <input id="login-password" type="password" placeholder="Contraseña" autocomplete="current-password" required>
            <button type="submit">🔐 Iniciar sesión</button>
          </form>
          <button type="button" id="mostrar-registro" class="boton-secundario">🏪 Crear mi negocio</button>
        </div>
        <div id="modo-registro" class="oculto-login">
          <form id="form-registro-supabase">
            <input id="registro-tienda" type="text" placeholder="Nombre de tu negocio" autocomplete="organization" required>
            <input id="registro-email" type="email" placeholder="Correo electrónico" autocomplete="email" required>
            <input id="registro-password" type="password" placeholder="Crea una contraseña" minlength="6" autocomplete="new-password" required>
            <select id="registro-tipo-negocio">
              <option value="productos">Vendo productos</option>
              <option value="servicios">Ofrezco servicios</option>
              <option value="ambos">Productos y servicios</option>
            </select>
            <button type="submit">🚀 Crear mi cuenta</button>
          </form>
          <button type="button" id="volver-login" class="boton-secundario">← Ya tengo una cuenta</button>
        </div>
        <p id="login-mensaje" class="login-mensaje"></p>
      </div>`;
    document.body.appendChild(box);
    $("mostrar-registro").onclick = () => { $("modo-login").classList.add("oculto-login"); $("modo-registro").classList.remove("oculto-login"); };
    $("volver-login").onclick = () => { $("modo-registro").classList.add("oculto-login"); $("modo-login").classList.remove("oculto-login"); };
    $("form-login-supabase").onsubmit = iniciarSesion;
    $("form-registro-supabase").onsubmit = registrarCuenta;
}

async function iniciarSesion(e) {
    e.preventDefault();
    const msg = $("login-mensaje");
    msg.textContent = "Conectando...";
    const {error} = await supabaseClient.auth.signInWithPassword({email: $("login-email").value.trim(), password: $("login-password").value});
    if (error) { msg.textContent = "❌ " + error.message; return; }
    msg.textContent = "Entrando...";
    await cargarSistema();
}

async function registrarCuenta(e) {
    e.preventDefault();
    const nombre = $("registro-tienda").value.trim();
    const email = $("registro-email").value.trim();
    const password = $("registro-password").value;
    const tipo = $("registro-tipo-negocio").value;
    const msg = $("login-mensaje");
    msg.textContent = "Creando tu negocio...";
    const {data, error} = await supabaseClient.auth.signUp({
        email,
        password,
        options: {data: {nombre_tienda: nombre, tipo_negocio: tipo}, emailRedirectTo: APP_URL}
    });
    if (error) { msg.textContent = "❌ " + error.message; return; }
    if (data.session) {
        await cargarSistema();
    } else {
        msg.textContent = "✅ Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.";
    }
}

async function cargarSistema() {
    const {data:{session}} = await supabaseClient.auth.getSession();
    if (!session) { crearLogin(); mostrarAplicacion(false); return; }
    usuarioActual = session.user;
    try {
        await cargarTienda();
        await cargarTodo();
        actualizarNombreNegocio();
        mostrarAplicacion(true);
        configurarEventos();
        mostrarSeccion("inicio");
        renderTodo();
    } catch (e) {
        errorUI(e, "No se pudieron cargar los datos de tu negocio.");
    }
}

async function cargarTienda() {
    const {data: perfil, error: pe} = await supabaseClient.from("perfiles").select("tienda_id, nombre, rol").eq("id", usuarioActual.id).maybeSingle();
    if (pe) throw pe;
    if (!perfil?.tienda_id) throw new Error("Tu cuenta todavía no tiene un negocio asociado.");
    const {data: tienda, error: te} = await supabaseClient.from("tiendas").select("*").eq("id", perfil.tienda_id).single();
    if (te) throw te;
    tiendaActual = tienda;
}

async function cargarTodo() {
    const [p,g,c,v,cc,pp] = await Promise.all([
        supabaseClient.from("productos_servicios").select("*").order("created_at", {ascending:false}),
        supabaseClient.from("gastos").select("*").order("fecha_gasto", {ascending:false}),
        supabaseClient.from("clientes").select("*").order("created_at", {ascending:false}),
        supabaseClient.from("ventas").select("*").order("fecha_venta", {ascending:false}),
        supabaseClient.from("cuentas_por_cobrar").select("*").order("fecha", {ascending:false}),
        supabaseClient.from("pagos_cuentas").select("*").order("fecha_pago", {ascending:false})
    ]);
    if (p.error) throw p.error; if (g.error) throw g.error; if (c.error) throw c.error; if (v.error) throw v.error; if (cc.error) throw cc.error; if (pp.error) throw pp.error;
    productosServicios = p.data || []; gastos = g.data || []; clientes = c.data || []; ventas = v.data || []; cuentas = cc.data || []; pagos = pp.data || [];
}

function rangoPeriodo() {
    const hoy = new Date(); hoy.setHours(23,59,59,999);
    if (periodoActual === "hoy") { const d = new Date(); d.setHours(0,0,0,0); return [d, hoy]; }
    if (periodoActual === "semana") { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); d.setHours(0,0,0,0); return [d,hoy]; }
    if (periodoActual === "mes") { const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1); return [d,hoy]; }
    return [new Date(2000,0,1), hoy];
}

function enPeriodo(fecha) { const [ini,fin] = rangoPeriodo(); const d = new Date(fecha); return d >= ini && d <= fin; }
function ventasPeriodo() { return ventas.filter(v => enPeriodo(v.fecha_venta)); }
function gastosPeriodo() { return gastos.filter(g => enPeriodo(g.fecha_gasto)); }
function totalVentas() { return ventasPeriodo().reduce((s,v)=>s+num(v.precio)*Math.max(1,num(v.cantidad)||1),0); }
function totalCostos() { return ventasPeriodo().reduce((s,v)=>s+num(v.costo)*Math.max(1,num(v.cantidad)||1),0); }
function totalGastos() { return gastosPeriodo().reduce((s,g)=>s+num(g.monto),0); }
function gananciaBruta() { return totalVentas()-totalCostos(); }
function gananciaNeta() { return gananciaBruta()-totalGastos(); }
function inventarioInvertido() { return productosServicios.filter(p=>p.tipo==="producto"&&p.activo!==false).reduce((s,p)=>s+num(p.stock)*num(p.costo),0); }
function valorInventarioVenta() { return productosServicios.filter(p=>p.tipo==="producto"&&p.activo!==false).reduce((s,p)=>s+num(p.stock)*num(p.precio),0); }
function utilidadPotencial() { return valorInventarioVenta()-inventarioInvertido(); }
function cuentasPendientes() { return cuentas.filter(c=>c.estado!=="paid").reduce((s,c)=>s+Math.max(0,num(c.monto_total)-num(c.monto_pagado)),0); }

function renderTodo() {
    renderInicio(); renderProductos(); renderVentas(); renderGastos(); renderClientes(); renderFinanzas(); renderReportes(); renderNegocio();
}

function poner(id, html) { if ($(id)) $(id).innerHTML = html; }

function renderInicio() {
    ponerTexto(["total-ventas","inicio-ventas","resumen-ventas"], dinero(totalVentas()));
    ponerTexto(["dinero-ventas","inicio-ingresos"], dinero(totalVentas()));
    ponerTexto(["ganancia-ventas","inicio-ganancia"], dinero(gananciaNeta()));
    ponerTexto(["inicio-costos"], dinero(totalCostos()));
    ponerTexto(["inicio-gastos"], dinero(totalGastos()));
    ponerTexto(["inicio-inventario"], dinero(inventarioInvertido()));
    ponerTexto(["inicio-por-cobrar"], dinero(cuentasPendientes()));
    ponerTexto(["contador-clientes"], String(clientes.length));
    ponerTexto(["contador-productos"], String(productosServicios.filter(p=>p.tipo==="producto").length));
    ponerTexto(["contador-servicios"], String(productosServicios.filter(p=>p.tipo==="servicio").length));
    const rec = ventasPeriodo().slice(0,5);
    poner("lista-ventas-inicio", rec.length ? rec.map(v=>`<div class="fila-lista"><b>${esc(v.producto || "Venta")}</b><span>${dinero(num(v.precio)*Math.max(1,num(v.cantidad)||1))}</span></div>`).join("") : `<div class="vacio">Aún no hay ventas en este periodo.</div>`);
}

function renderProductos() {
    const lista = productosServicios;
    const html = lista.length ? lista.map(p => {
        const stock = num(p.stock), costo = num(p.costo), precio = num(p.precio);
        const potencial = (precio-costo)*stock;
        return `<div class="tarjeta-item">
          <div><strong>${esc(p.nombre)}</strong><small>${esc(p.tipo)}${p.categoria?" · "+esc(p.categoria):""}</small></div>
          <div><span>Stock: <b>${stock}</b></span><span>Costo: ${dinero(costo)}</span><span>Venta: ${dinero(precio)}</span><span>Ganancia: <b>${dinero(precio-costo)}</b></span></div>
          <button class="boton-peligro boton-eliminar-producto" data-id="${p.id}">Eliminar</button>
        </div>`;
    }).join("") : `<div class="vacio">No tienes productos ni servicios registrados.</div>`;
    poner("lista-productos-servicios", html);
    poner("lista-inventario", html);
}

function renderVentas() {
    const html = ventas.length ? ventas.map(v=>`<div class="tarjeta-item"><div><strong>${esc(v.producto||"Venta")}</strong><small>${fechaTexto(v.fecha_venta)} · ${esc(v.metodo_pago||"Pago")}</small></div><div><span>Cantidad: ${num(v.cantidad)||1}</span><span>Venta: ${dinero(num(v.precio)*(num(v.cantidad)||1))}</span><span>Ganancia: <b>${dinero((num(v.precio)-num(v.costo))*(num(v.cantidad)||1))}</b></span></div></div>`).join("") : `<div class="vacio">No hay ventas registradas.</div>`;
    poner("lista-ventas", html);
    poner("lista-ventas-finanzas", html);
}

function renderGastos() {
    poner("lista-gastos", gastos.length ? gastos.map(g=>`<div class="tarjeta-item"><div><strong>${esc(g.descripcion)}</strong><small>${esc(g.categoria||"Sin categoría")} · ${fechaTexto(g.fecha_gasto)}</small></div><div><b>${dinero(g.monto)}</b><button class="boton-peligro boton-eliminar-gasto" data-id="${g.id}">Eliminar</button></div></div>`).join("") : `<div class="vacio">No hay gastos registrados.</div>`);
}

function renderClientes() {
    const q = ($("buscador")?.value || "").toLowerCase();
    const estado = $("filtro-estado")?.value || "todos";
    const filtrados = clientes.filter(c => (!q || [c.nombre,c.whatsapp,c.producto].join(" ").toLowerCase().includes(q)) && (estado==="todos" || c.estado===estado));
    poner("lista-clientes", filtrados.length ? filtrados.map(c=>`<div class="tarjeta-item"><div><strong>${esc(c.nombre)}</strong><small>${esc(c.whatsapp||"")} · ${esc(c.producto||"")}</small></div><div><span>${esc(c.estado||"pendiente")}</span><span>${dinero(c.precio)}</span><span>Ganancia: ${dinero(num(c.precio)-num(c.costo))}</span></div></div>`).join("") : `<div class="vacio">No se encontraron clientes.</div>`);
}

function renderFinanzas() {
    ponerTexto(["fin-ventas","fin-ingresos"], dinero(totalVentas()));
    ponerTexto(["fin-costos"], dinero(totalCostos()));
    ponerTexto(["fin-gastos"], dinero(totalGastos()));
    ponerTexto(["fin-bruta"], dinero(gananciaBruta()));
    ponerTexto(["fin-neta"], dinero(gananciaNeta()));
    ponerTexto(["fin-inventario"], dinero(inventarioInvertido()));
    ponerTexto(["fin-potencial"], dinero(utilidadPotencial()));
    ponerTexto(["fin-cobrar"], dinero(cuentasPendientes()));
    const margen = totalVentas() ? (gananciaBruta()/totalVentas()*100) : 0;
    ponerTexto(["fin-margen"], margen.toFixed(1)+"%");
}

function renderReportes() {
    const margen = totalVentas() ? gananciaBruta()/totalVentas()*100 : 0;
    poner("reporte-resumen", `<div class="reporte-grid"><div><span>Ventas</span><b>${dinero(totalVentas())}</b></div><div><span>Costos</span><b>${dinero(totalCostos())}</b></div><div><span>Gastos</span><b>${dinero(totalGastos())}</b></div><div><span>Ganancia neta</span><b>${dinero(gananciaNeta())}</b></div><div><span>Margen bruto</span><b>${margen.toFixed(1)}%</b></div><div><span>Por cobrar</span><b>${dinero(cuentasPendientes())}</b></div></div>`);
}

function renderNegocio() {
    ponerTexto(["config-nombre-tienda","negocio-nombre"], tiendaActual?.nombre || "");
    if ($("config-tipo-negocio")) $("config-tipo-negocio").value = tiendaActual?.tipo_negocio || "productos";
    if ($("config-moneda")) $("config-moneda").value = tiendaActual?.moneda || "COP";
}

function mostrarSeccion(nombre) {
    document.querySelectorAll(".seccion").forEach(s=>s.classList.remove("activa"));
    const sec = $("seccion-"+nombre) || $(nombre);
    if (sec) sec.classList.add("activa");
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("activo", b.dataset.seccion===nombre || b.dataset.target===nombre));
    window.scrollTo({top:0,behavior:"smooth"});
}

function configurarNavegacion() {
    document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>mostrarSeccion(btn.dataset.seccion || btn.dataset.target || btn.getAttribute("data-section"))));
}

function configurarEventos() {
    if (window.__miContabilidadEventos) return;
    window.__miContabilidadEventos = true;
    configurarNavegacion();
    ["buscador","filtro-estado"].forEach(id=>$(id)?.addEventListener("input",renderClientes));
    document.addEventListener("click", manejarClick);
    document.addEventListener("submit", manejarSubmit);
    document.addEventListener("change", e=>{
        if (e.target.matches("[data-periodo], #periodo-finanzas, #periodo-reporte")) { periodoActual=e.target.value; renderTodo(); }
    });
}

async function manejarSubmit(e) {
    if (!e.target.matches("form")) return;
    const id = e.target.id;
    if (!id) return;
    if (["form-producto-servicio","form-producto","form-servicio"].includes(id)) { e.preventDefault(); await guardarProductoServicio(e.target); }
    else if (["form-gasto","formulario-gasto"].includes(id)) { e.preventDefault(); await guardarGasto(e.target); }
    else if (["form-venta","formulario-venta"].includes(id)) { e.preventDefault(); await guardarVenta(e.target); }
    else if (["form-cliente","formulario-clientes"].includes(id)) { e.preventDefault(); await guardarCliente(e.target); }
    else if (["form-negocio","form-config-negocio"].includes(id)) { e.preventDefault(); await guardarNegocio(e.target); }
    else if (["form-cuenta","form-cobro"].includes(id)) { e.preventDefault(); await guardarCuenta(e.target); }
}

function valorForm(form, nombres, defecto="") { for (const n of nombres) { const el=form.querySelector(`[name="${n}"]`) || $(n); if (el) return el.value; } return defecto; }

async function guardarProductoServicio(form) {
    const tipo = valorForm(form,["tipo","producto_tipo"],"producto");
    const data = {tienda_id:tiendaActual.id,tipo,nombre:valorForm(form,["nombre","producto","nombre_producto"]),categoria:valorForm(form,["categoria"]),descripcion:valorForm(form,["descripcion"]),unidad:valorForm(form,["unidad"],"unidad"),stock:num(valorForm(form,["stock","cantidad"])),costo:num(valorForm(form,["costo"])),precio:num(valorForm(form,["precio","precio_venta"])),activo:true};
    if (!data.nombre) return alert("Escribe el nombre.");
    const {error}=await supabaseClient.from("productos_servicios").insert(data); if(error)return errorUI(error,"No se pudo guardar.");
    form.reset(); await cargarTodo(); renderTodo(); alert("✅ Guardado correctamente.");
}

async function guardarGasto(form) {
    const data={tienda_id:tiendaActual.id,descripcion:valorForm(form,["descripcion","gasto"]),categoria:valorForm(form,["categoria"],"General"),monto:num(valorForm(form,["monto","valor"])),fecha_gasto:valorForm(form,["fecha","fecha_gasto"],fechaHoy()),notas:valorForm(form,["notas","nota"])};
    if(!data.descripcion || data.monto<=0)return alert("Escribe una descripción y un monto válido.");
    const {error}=await supabaseClient.from("gastos").insert(data); if(error)return errorUI(error,"No se pudo guardar el gasto.");
    form.reset(); await cargarTodo(); renderTodo();
}

async function guardarVenta(form) {
    const psId=valorForm(form,["producto_servicio_id","productoId","producto-servicio"]);
    const ps=productosServicios.find(p=>p.id===psId);
    const nombre=valorForm(form,["producto","nombre_producto"],ps?.nombre||"");
    const cantidad=Math.max(1,num(valorForm(form,["cantidad"],1)));
    const precio=num(valorForm(form,["precio","precio_venta"],ps?.precio||0));
    const costo=num(valorForm(form,["costo"],ps?.costo||0));
    const data={tienda_id:tiendaActual.id,producto_servicio_id:psId||null,cantidad,tipo:ps?.tipo||valorForm(form,["tipo"],"producto"),cliente_id:valorForm(form,["cliente_id"])||null,cliente_nombre:valorForm(form,["cliente_nombre","cliente"]),whatsapp:valorForm(form,["whatsapp"]),producto:nombre,marca:valorForm(form,["marca"]),talla:valorForm(form,["talla"]),precio,costo,ganancia:(precio-costo)*cantidad,fecha_venta:valorForm(form,["fecha","fecha_venta"],new Date().toISOString()),metodo_pago:valorForm(form,["metodo_pago","metodo"],"efectivo"),notas:valorForm(form,["notas"]) };
    if(!nombre || precio<=0)return alert("Selecciona un producto/servicio o escribe nombre y precio.");
    const {error}=await supabaseClient.from("ventas").insert(data); if(error)return errorUI(error,"No se pudo registrar la venta.");
    if(ps?.tipo==="producto") await supabaseClient.from("productos_servicios").update({stock:Math.max(0,num(ps.stock)-cantidad)}).eq("id",ps.id);
    form.reset(); await cargarTodo(); renderTodo(); alert("✅ Venta registrada.");
}

async function guardarCliente(form) {
    const data={tienda_id:tiendaActual.id,nombre:valorForm(form,["nombre"]),whatsapp:valorForm(form,["whatsapp"]),producto:valorForm(form,["producto"]),marca:valorForm(form,["marca"]),categoria:valorForm(form,["categoria"]),talla:valorForm(form,["talla"]),precio:num(valorForm(form,["precio"])),costo:num(valorForm(form,["costo"])),estado:"pendiente"};
    if(!data.nombre)return alert("Escribe el nombre del cliente.");
    const {error}=await supabaseClient.from("clientes").insert(data); if(error)return errorUI(error,"No se pudo guardar el cliente.");
    form.reset(); await cargarTodo(); renderTodo();
}

async function guardarCuenta(form) {
    const data={tienda_id:tiendaActual.id,cliente_id:valorForm(form,["cliente_id"])||null,cliente_nombre:valorForm(form,["cliente_nombre","cliente"]),descripcion:valorForm(form,["descripcion"]),monto_total:num(valorForm(form,["monto_total","monto"])),monto_pagado:0,fecha:valorForm(form,["fecha"],fechaHoy()),fecha_vencimiento:valorForm(form,["fecha_vencimiento"]),estado:"pending",notas:valorForm(form,["notas"])};
    if(!data.cliente_nombre||data.monto_total<=0)return alert("Completa cliente y monto.");
    const {error}=await supabaseClient.from("cuentas_por_cobrar").insert(data); if(error)return errorUI(error,"No se pudo crear la cuenta por cobrar.");
    form.reset(); await cargarTodo(); renderTodo();
}

async function guardarNegocio(form) {
    const nombre=valorForm(form,["nombre","nombre_tienda"],tiendaActual.nombre).trim();
    const tipo=valorForm(form,["tipo_negocio","tipo"],tiendaActual.tipo_negocio||"productos");
    const moneda=valorForm(form,["moneda"],tiendaActual.moneda||"COP");
    const {error}=await supabaseClient.from("tiendas").update({nombre,tipo_negocio:tipo,moneda}).eq("id",tiendaActual.id);
    if(error)return errorUI(error,"No se pudo actualizar el negocio.");
    tiendaActual={...tiendaActual,nombre,tipo_negocio:tipo,moneda}; actualizarNombreNegocio(); renderTodo(); alert("✅ Datos actualizados.");
}

async function manejarClick(e) {
    const nav=e.target.closest(".nav-btn"); if(nav){mostrarSeccion(nav.dataset.seccion||nav.dataset.target);return;}
    const delP=e.target.closest(".boton-eliminar-producto"); if(delP){if(confirm("¿Eliminar este registro?")){const {error}=await supabaseClient.from("productos_servicios").delete().eq("id",delP.dataset.id);if(error)return errorUI(error);await cargarTodo();renderTodo();}return;}
    const delG=e.target.closest(".boton-eliminar-gasto"); if(delG){if(confirm("¿Eliminar este gasto?")){const {error}=await supabaseClient.from("gastos").delete().eq("id",delG.dataset.id);if(error)return errorUI(error);await cargarTodo();renderTodo();}return;}
    const logout=e.target.closest("#cerrar-sesion, #btn-cerrar-sesion, [data-accion='logout']"); if(logout){await supabaseClient.auth.signOut();location.reload();return;}
    const periodo=e.target.closest("[data-periodo]"); if(periodo){periodoActual=periodo.dataset.periodo;document.querySelectorAll("[data-periodo]").forEach(x=>x.classList.remove("activo"));periodo.classList.add("activo");renderTodo();}
    const exportar=e.target.closest("#exportar-clientes, [data-exportar='clientes']"); if(exportar) exportarClientes();
}

function exportarClientes() {
    if(!clientes.length)return alert("No hay clientes para exportar.");
    const filas=[["Nombre","WhatsApp","Producto","Estado","Precio","Costo"],...clientes.map(c=>[c.nombre,c.whatsapp,c.producto,c.estado,c.precio,c.costo])];
    const csv=filas.map(f=>f.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download="clientes-mi-contabilidad.csv"; a.click(); URL.revokeObjectURL(a.href);
}

async function iniciar() {
    try {
        await cargarSupabase();
        supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
        crearLogin();
        supabaseClient.auth.onAuthStateChange((event,session)=>{ if(event==="SIGNED_OUT") mostrarAplicacion(false); });
        await cargarSistema();
    } catch(e) { errorUI(e,"No se pudo iniciar MI CONTABILIDAD."); }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",iniciar); else iniciar();
