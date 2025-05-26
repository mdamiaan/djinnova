// ============ CONFIGURACIÓN ===========
// API de Airtable y nombres de tablas
const API_TOKEN = "patqqQkGTEwDrKjVW.4283263da6c66a9232f013b0b35e86a0588103715443f66adc4cc07049940fb2";
const BASE_ID = "appKNRvkgazeA5iIZ";
const TABLE_STOCK = "sotck";      // Productos
const TABLE_VENTAS = "ventas";    // Ventas
const TABLE_CLIENTES = "clientes"; // Clientes

const AIRTABLE_STOCK_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_STOCK}`;
const AIRTABLE_VENTAS_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_VENTAS}`;
const AIRTABLE_CLIENTES_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_CLIENTES}`;

const app = document.getElementById('app');

let productos = [];
let ultimoStock = [];

// ======================= CARGA Y GRID =======================
async function cargarStock() {
  app.innerHTML = `
    <input id="busqueda" class="busqueda" placeholder="Buscar producto...">
    <button id="btnAgregar">+ Agregar producto</button>
    <form id="formAgregar" class="form-nuevo" style="display:none">
      <input id="nombreProd" placeholder="Nombre del producto" required>
      <input id="precioClienteProd" placeholder="Precio de venta" type="number" required>
      <input id="stockProd" placeholder="Stock inicial" type="number" required>
      <input id="proveedorProd" placeholder="Proveedor" required>
      <input id="skuProd" placeholder="SKU/Código">
      <input id="imgProd" placeholder="URL imagen (opcional)">
      <button type="submit">Guardar</button>
      <button type="button" id="cancelarAgregar">Cancelar</button>
    </form>
    <div class="grid" id="grid"></div>
  `;

  const grid = document.getElementById('grid');
  productos = [];
  // Cargar productos desde Airtable
  const resp = await fetch(AIRTABLE_STOCK_URL, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const data = await resp.json();
  productos = data.records.map(rec => ({
    id: rec.id,
    nombre: rec.fields.nombre || '',
    precio: rec.fields.precioCliente || '',
    imagen: rec.fields.imagen || '',
    stock: rec.fields.stock || 0,
    proveedor: rec.fields.proveedor || '',
    sku: rec.fields.sku || ''
  }));

  ultimoStock = productos;

  renderGrid(productos);

  // Buscador
  document.getElementById('busqueda').oninput = function() {
    const q = this.value.toLowerCase();
    renderGrid(productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.proveedor && p.proveedor.toLowerCase().includes(q))
    ));
  };

  // Mostrar/ocultar formulario agregar producto
  const btnAgregar = document.getElementById('btnAgregar');
  const formAgregar = document.getElementById('formAgregar');
  btnAgregar.onclick = () => formAgregar.style.display = 'block';
  document.getElementById('cancelarAgregar').onclick = () => formAgregar.style.display = 'none';

  // Agregar producto nuevo
  formAgregar.onsubmit = async function(e) {
    e.preventDefault();
    const nuevo = {
      nombre: document.getElementById('nombreProd').value,
      precioCliente: Number(document.getElementById('precioClienteProd').value),
      stock: Number(document.getElementById('stockProd').value),
      proveedor: document.getElementById('proveedorProd').value,
      sku: document.getElementById('skuProd').value,
      imagen: document.getElementById('imgProd').value
    };
    const body = {
      records: [{
        fields: {
          nombre: nuevo.nombre,
          precioCliente: nuevo.precioCliente,
          stock: nuevo.stock,
          proveedor: nuevo.proveedor,
          sku: nuevo.sku,
          imagen: nuevo.imagen
        }
      }]
    };
    // Guarda en Airtable
    const resp = await fetch(AIRTABLE_STOCK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (resp.ok) {
      alert('¡Producto agregado!');
      formAgregar.reset();
      formAgregar.style.display = 'none';
      cargarStock();
    } else {
      alert('Error guardando producto');
    }
  }
}

// ---------- Renderiza cuadrícula ----------
function renderGrid(list) {
  const grid = document.getElementById('grid');
  grid.innerHTML = list.map((p, idx) => `
    <div class="card" onclick="verDetalle(${idx})">
      <img src="${p.imagen || 'https://cdn-icons-png.flaticon.com/512/6598/6598516.png'}" alt="">
      <div><b>${p.nombre}</b></div>
      <div>$${p.precio}</div>
      <div>Stock: ${p.stock}</div>
      <div style="font-size:0.9em;opacity:0.8">${p.sku ? 'SKU: ' + p.sku : ''}</div>
      <div style="font-size:0.85em;color:#21e1d0">${p.proveedor || ''}</div>
    </div>
  `).join('');
}

// ========== DETALLE + VENTA ==========

window.verDetalle = async function(idx) {
  const p = ultimoStock[idx];

  // Cargar clientes para autocompletar
  const clientesResp = await fetch(AIRTABLE_CLIENTES_URL, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const clientesData = await clientesResp.json();
  const clientes = clientesData.records.map(c => ({
    id: c.id,
    nombre: c.fields.nombre || '',
    telefono: c.fields.telefono || '',
    direccion: c.fields.direccion || ''
  }));

  // Render de detalle + formulario de venta
  app.innerHTML = `
    <button onclick="cargarStock()" style="margin-bottom:10px;">← Volver</button>
    <div class="card" style="max-width:350px;margin:auto">
      <img src="${p.imagen || 'https://cdn-icons-png.flaticon.com/512/6598/6598516.png'}" alt="" style="width:140px;height:140px;">
      <h2 style="margin:0 0 10px;">${p.nombre}</h2>
      <div>Precio de venta: <b>$${p.precio}</b></div>
      <div>Stock disponible: <b>${p.stock}</b></div>
      <div style="font-size:0.9em;opacity:0.8">${p.sku ? 'SKU: ' + p.sku : ''}</div>
      <div style="font-size:0.85em;color:#21e1d0">${p.proveedor || ''}</div>
      <form id="formVender" style="margin-top:20px;">
        <label>Cantidad: <input id="cantidadVender" type="number" min="1" max="${p.stock}" value="1" required style="width:80px;"></label>
        <label>Cliente:
          <input id="nombreCliente" list="clientesList" placeholder="Nombre cliente" required autocomplete="off">
          <datalist id="clientesList">
            ${clientes.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('')}
          </datalist>
        </label>
        <label>Teléfono: <input id="telCliente" type="text" placeholder="Teléfono"></label>
        <label>Dirección: <input id="dirCliente" type="text" placeholder="Dirección"></label>
        <label>Método de pago: 
          <select id="metodoPago" required>
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
            <option value="Débito">Débito</option>
            <option value="Crédito">Crédito</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Otro">Otro</option>
          </select>
        </label>
        <button type="submit">Vender</button>
      </form>
    </div>
  `;

  // Autocompletar datos si seleccionás un cliente existente
  document.getElementById('nombreCliente').oninput = function() {
    const cli = clientes.find(c => c.nombre === this.value);
    if (cli) {
      document.getElementById('telCliente').value = cli.telefono;
      document.getElementById('dirCliente').value = cli.direccion;
    } else {
      document.getElementById('telCliente').value = '';
      document.getElementById('dirCliente').value = '';
    }
  };

  document.getElementById('formVender').onsubmit = async function(e) {
    e.preventDefault();
    const cantidad = Number(document.getElementById('cantidadVender').value);
    if (cantidad > p.stock) return alert("No hay suficiente stock.");

    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const telCliente = document.getElementById('telCliente').value.trim();
    const dirCliente = document.getElementById('dirCliente').value.trim();
    const metodoPago = document.getElementById('metodoPago').value;

    // Si el cliente no existe, lo crea; si existe, lo usa
    let clienteId = '';
    let cli = clientes.find(c => c.nombre === nombreCliente);
    if (!cli) {
      // Nuevo cliente
      const crearCli = await fetch(AIRTABLE_CLIENTES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          records: [{
            fields: {
              nombre: nombreCliente,
              telefono: telCliente,
              direccion: dirCliente
            }
          }]
        })
      });
      if (crearCli.ok) {
        const cliData = await crearCli.json();
        clienteId = cliData.records[0].id;
      }
    } else {
      clienteId = cli.id;
    }

    // Registrar venta en Airtable (incluye vínculo al cliente si tu tabla tiene el campo "cliente")
    const venta = {
      records: [{
        fields: {
          producto: p.nombre,
          cantidad,
          precioUnitario: p.precio,
          total: p.precio * cantidad,
          fecha: (new Date()).toISOString().slice(0,10),
          cliente: clienteId ? [clienteId] : nombreCliente,
          telefono: telCliente,
          direccion: dirCliente,
          metPago: metodoPago
        }
      }]
    };
    const ventaResp = await fetch(AIRTABLE_VENTAS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(venta)
    });
    if (!ventaResp.ok) return alert('Error guardando la venta');

    // Actualizar stock en Airtable
    const stockResp = await fetch(`${AIRTABLE_STOCK_URL}/${p.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          stock: p.stock - cantidad
        }
      })
    });
    if (stockResp.ok) {
      alert('¡Venta realizada!');
      cargarStock();
    } else {
      alert('Error actualizando stock');
    }
  };
}

// ========== INICIO ==========
cargarStock();
