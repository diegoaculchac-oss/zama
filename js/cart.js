// ==========================================
// 1. FUNCIONES GLOBALES DE CONTROL
// ==========================================

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorInterfaz();
}

function actualizarContadorInterfaz() {
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        const carrito = obtenerCarrito();
        const totalItems = carrito.reduce((sum, p) => sum + (p.cantidad || 1), 0);
        contador.innerText = totalItems;
    }
}

// ==========================================
// 2. INICIALIZACIÓN DE COMPORTAMIENTOS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorInterfaz();

    // --- CAPTURA DE BOTONES EN LA TIENDA ---
    const botonesAgregar = document.querySelectorAll('.btn-agregar');
    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            const tarjeta = e.target.closest('.card');
            const h3 = tarjeta.querySelector('h3');
            const span = tarjeta.querySelector('.fw-bold') || tarjeta.querySelector('span');
            const img = tarjeta.querySelector('img');

            if (h3 && span && img) {
                const nombre = h3.innerText.trim();
                const precioTexto = span.innerText;

                const precio = parseInt(precioTexto.replace(/[^0-9]/g, ''), 10);
                const imagen = img.getAttribute('src');

                let carrito = obtenerCarrito();
                const productoExistente = carrito.find(item => item.nombre === nombre);

                if (productoExistente) {
                    productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
                } else {
                    carrito.push({ nombre, precio, imagen, cantidad: 1 });
                }

                guardarCarrito(carrito);
                alert(`¡${nombre} añadido al carrito con éxito!`);
            }
        });
    });

    // --- MANEJO DE LA VISTA DE CARRITO.HTML ---
    const listaContenedor = document.getElementById('lista-carrito');
    const totalContenedor = document.getElementById('total-precio');
    const btnVaciar = document.getElementById('btn-vaciar');

    const btnProcederPago = document.getElementById('btn-proceder-pago');
    const opcionWhatsapp = document.getElementById('opcion-whatsapp-directo');
    const opcionNequi = document.getElementById('opcion-nequi-mostrar');
    const seccionFormNequi = document.getElementById('seccion-formulario-nequi');
    const formNequi = document.getElementById('form-nequi');

    let modalPagoBS = null;
    if (document.getElementById('modalMetodoPago')) {
        modalPagoBS = new bootstrap.Modal(document.getElementById('modalMetodoPago'));
    }

    // --- 🔄 RENDERIZAR CARRITO CON CONTROLES +/- ---
    function renderizarCarritoHTML() {
        if (!listaContenedor) return;

        const carrito = obtenerCarrito();
        listaContenedor.innerHTML = '';
        let sumaTotal = 0;

        if (carrito.length === 0) {
            listaContenedor.innerHTML = `<p class="text-muted fs-5 text-center my-4 w-100">Tu carrito está vacío actualmente.</p>`;
            if (totalContenedor) totalContenedor.innerText = `$0`;
            return;
        }

        carrito.forEach((producto, index) => {
            const cantidad = producto.cantidad || 1;
            const subtotal = producto.precio * cantidad;
            sumaTotal += subtotal;

            listaContenedor.innerHTML += `
                <div class="d-flex align-items-center justify-content-between bg-white p-3 border shadow-sm mb-2 flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${producto.imagen}" style="width: 70px; height: 90px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <h4 class="fs-6 fw-bold m-0 text-uppercase">${producto.nombre}</h4>
                            <p class="text-muted small m-0">Precio: $${producto.precio.toLocaleString('es-CO')}</p>
                            <small class="text-dark fw-semibold">Subtotal: $${subtotal.toLocaleString('es-CO')}</small>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center gap-2 ms-auto">
                        <div class="input-group input-group-sm border" style="width: 110px;">
                            <button class="btn btn-light rounded-0 btn-disminuir" data-index="${index}">-</button>
                            <span class="form-control text-center bg-white border-0 fw-bold small">${cantidad}</span>
                            <button class="btn btn-light rounded-0 btn-aumentar" data-index="${index}">+</button>
                        </div>
                        <button class="btn btn-sm btn-outline-danger border-0 btn-eliminar-item" data-index="${index}" title="Eliminar todo">❌</button>
                    </div>
                </div>
            `;
        });

        if (totalContenedor) {
            totalContenedor.innerText = `$${sumaTotal.toLocaleString('es-CO')}`;
        }

        // Eventos de botones (+, -, ❌) heredados correctamente
        document.querySelectorAll('.btn-aumentar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                let actualCarrito = obtenerCarrito();
                actualCarrito[idx].cantidad = (actualCarrito[idx].cantidad || 1) + 1;
                guardarCarrito(actualCarrito);
                renderizarCarritoHTML();
            });
        });

        document.querySelectorAll('.btn-disminuir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                let actualCarrito = obtenerCarrito();
                if (actualCarrito[idx].cantidad > 1) {
                    actualCarrito[idx].cantidad -= 1;
                } else {
                    actualCarrito.splice(idx, 1);
                }
                guardarCarrito(actualCarrito);
                renderizarCarritoHTML();
            });
        });

        document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.btn-eliminar-item');
                const idx = parseInt(targetBtn.getAttribute('data-index'), 10);
                let actualCarrito = obtenerCarrito();
                actualCarrito.splice(idx, 1);
                guardarCarrito(actualCarrito);
                renderizarCarritoHTML();
            });
        });
    }

    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            localStorage.removeItem('carrito');
            actualizarContadorInterfaz();
            renderizarCarritoHTML();
        });
    }

    // --- MOTOR PARA ARMAR EL TEXTO EN WHATSAPP ---
    function generarMensajePedido(carrito, metodoPago, refPedido, extraInfo = '') {
        const numeroTelefono = '573214403548';

        let mensaje = `¡Hola Zama! 🛍️✨\nHe armado un pedido desde la web.\n*Referencia:* #${refPedido}\n*Método:* ${metodoPago}\n\n`;
        let totalPedido = 0;

        carrito.forEach(p => {
            const cantidad = p.cantidad || 1;
            const subtotal = p.precio * cantidad;
            totalPedido += subtotal;

            let urlImagenCompleta = p.imagen;
            if (!p.imagen.startsWith('http')) {
                urlImagenCompleta = `http://localhost:3000/${p.imagen}`;
            }

            mensaje += `• *${p.nombre}* \n`;
            mensaje += `   Cantidad: ${cantidad} x $${p.precio.toLocaleString('es-CO')} \n`;
            mensaje += `   Subtotal: $${subtotal.toLocaleString('es-CO')}\n`;
            mensaje += `   📸 Foto: ${urlImagenCompleta}\n\n`;
        });

        mensaje += `💰 *TOTAL:* $${totalPedido.toLocaleString('es-CO')}\n`;

        if (extraInfo) {
            mensaje += `${extraInfo}\n`;
        }

        mensaje += '\n¿Me confirman los pasos para proceder con el despacho? Muchas gracias. 🙏';

        const mensajeEncriptado = encodeURIComponent(mensaje);
        return `https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${mensajeEncriptado}`;
    }

    // --- FUNCIÓN MOTOR: REGISTRAR EN MYSQL SOLO AL ESTAR CONFIRMADO EL PAGO ---
    async function guardarPedidoEnBaseDeDatos(metodoPagoUsado) {
        const carrito = obtenerCarrito();
        const datosLocales = localStorage.getItem('usuarioLogueado');

        if (!datosLocales) {
            alert('Por favor, inicia sesión para que tu pedido quede registrado en tu historial.');
            window.location.href = 'ingreso.html';
            return null;
        }

        const usuario = JSON.parse(datosLocales);
        const totalPedido = carrito.reduce((sum, p) => sum + (p.precio * (p.cantidad || 1)), 0);

        const cuerpoPeticion = {
            usuario_id: usuario.id,
            total: totalPedido,
            metodo_pago: metodoPagoUsado,
            productos: carrito.map(p => ({
                nombre: p.nombre,
                cantidad: p.cantidad || 1,
                precio_unitario: p.precio
            }))
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/pedidos/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpoPeticion)
            });

            const resultado = await respuesta.json();
            if (respuesta.ok) {
                return resultado.pedidoId;
            } else {
                alert(resultado.error || 'Hubo un problema al registrar tu pedido.');
                return null;
            }
        } catch (error) {
            console.error('❌ Error de conexión con el backend:', error);
            alert('No se pudo conectar con el servidor para registrar la orden.');
            return null;
        }
    }

    // --- ACTIVAR EL MODAL CON EL BOTÓN ÚNICO ---
    if (btnProcederPago) {
        btnProcederPago.addEventListener('click', () => {
            const carrito = obtenerCarrito();
            if (carrito.length === 0) {
                alert('Tu carrito está vacío actualmente.');
                return;
            }
            if (seccionFormNequi) seccionFormNequi.classList.add('d-none');
            if (modalPagoBS) modalPagoBS.show();
        });
    }

    // --- ⚠️ WHATSAPP DIRECTO: NO SUBE A MYSQL (EVITA ÓRDENES FALSAS SIN PAGAR) ---
    if (opcionWhatsapp) {
        opcionWhatsapp.addEventListener('click', () => {
            const carrito = obtenerCarrito();
            if (modalPagoBS) modalPagoBS.hide();

            // Creamos un código provisional basado en la hora para identificar el mensaje del chat
            const refProvisional = "PROV-" + Date.now().toString().slice(-6);

            const urlFinal = generarMensajePedido(carrito, 'Coordinar Pago por Chat', refProvisional, '⚠️ _Pendiente por definir medio de pago con el administrador._');

            // NO limpiamos el carrito todavía por si el cliente quiere devolverse a corregir algo
            window.open(urlFinal, '_blank');
        });
    }

    // --- MOSTRAR CAMPO NEQUI AL DARLE CLIC A LA OPCIÓN ---
    if (opcionNequi) {
        opcionNequi.addEventListener('click', () => {
            if (seccionFormNequi) {
                seccionFormNequi.classList.remove('d-none');
            }
        });
    }

    // --- ✅ NEQUI: SÍ TIENE REPORTE DE TRANSFERENCIA -> VA DIRECTO A MYSQL ---
    if (formNequi) {
        formNequi.addEventListener('submit', async (e) => {
            e.preventDefault();

            const carrito = obtenerCarrito();
            const referencia = document.getElementById('nequi-referencia').value.trim();

            if (!referencia) {
                alert('Por favor ingresa un código de referencia válido de Nequi.');
                return;
            }

            // 1. Como el cliente ya digitó el comprobante, guardamos el pedido en MySQL
            const pedidoId = await guardarPedidoEnBaseDeDatos(`Nequi`);
            if (!pedidoId) return; // Si falla la base de datos, no avanza

            if (modalPagoBS) modalPagoBS.hide();

            const extraNequi = `🆔 *Referencia Nequi:* ${referencia}\n💵 *Estado:* Transacción reportada a la base de datos de Zama.`;

            // 2. Armamos el mensaje de WhatsApp usando el ID real autoincrementable
            const urlFinal = generarMensajePedido(carrito, 'Nequi', pedidoId, extraNequi);

            // 3. Limpiamos carrito e interfaz ya que la compra está registrada y asegurada en MySQL
            formNequi.reset();
            localStorage.removeItem('carrito');
            actualizarContadorInterfaz();
            renderizarCarritoHTML();

            window.open(urlFinal, '_blank');
        });
    }

    renderizarCarritoHTML();
});