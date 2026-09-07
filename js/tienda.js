// js/tienda.js
import { inicializarFiltros } from './filters.js';

const API = 'https://zama-1qrc.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    let productosBaseDatos = [];

    const contenedorProductos = document.getElementById('contenedor-productos');
    const contadorProductosTexto = document.getElementById('contador-productos-texto');

    async function cargarProductosDesdeBD() {
        try {
            const respuesta = await fetch(`${API}/api/productos`);
            if (!respuesta.ok) throw new Error('Error al traer los datos');

            productosBaseDatos = await respuesta.json();
            renderizarProductos(productosBaseDatos);
            inicializarFiltros(productosBaseDatos, renderizarProductos);

        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            if (contenedorProductos) {
                contenedorProductos.innerHTML = `<p class="text-danger text-center">Error al conectar con el servidor de Zama.</p>`;
            }
        }
    }

    function renderizarProductos(lista) {
        if (!contenedorProductos) return;
        contenedorProductos.innerHTML = '';

        if (contadorProductosTexto) {
            contadorProductosTexto.innerText = `${lista.length} productos`;
        }

        if (lista.length === 0) {
            contenedorProductos.innerHTML = `<div class="col-12"><p class="text-muted text-center py-5">No hay productos disponibles en esta categoría.</p></div>`;
            return;
        }

        lista.forEach(producto => {
            const precioFormateado = `$${parseFloat(producto.precio).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
            // La imagen ya viene con URL completa desde el server
            const rutaImagen = producto.imagen || '';

            contenedorProductos.innerHTML += `
            <div class="col-6 col-md-4">
                <div class="card h-100 border-0 rounded-0 shadow-sm">
                    <a href="producto.html?id=${producto.id}">
                        <img src="${rutaImagen}" class="card-img-top rounded-0" alt="${producto.nombre}" style="height: 400px; object-fit: cover; cursor: pointer;">
                    </a>
                    <div class="card-body p-3 bg-white text-center d-flex flex-column justify-content-between">
                        <div>
                            <h3 class="fs-6 m-0 fw-semibold text-dark text-uppercase tracking-wide">${producto.nombre}</h3>
                            <p class="text-muted small my-1">${producto.descripcion || 'Diseño exclusivo de temporada'}</p>
                            <a href="producto.html?id=${producto.id}" class="text-dark small text-decoration-underline d-block mt-1" style="font-size: 0.8rem;">Ver detalles</a>
                        </div>
                        <div class="d-flex align-items-center justify-content-between gap-2 mt-3">
                            <span class="fw-bold text-dark">${precioFormateado}</span>
                            <button class="btn btn-dark btn-sm rounded-0 px-2 py-1 small btn-agregar" style="font-size: 0.75rem;">+ Añadir</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });

        asignarEventosBotonesAgregar();
    }

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

    function asignarEventosBotonesAgregar() {
        document.querySelectorAll('.btn-agregar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const tarjeta = e.target.closest('.card');
                const nombre = tarjeta.querySelector('h3').innerText.trim();
                const precioTexto = tarjeta.querySelector('span').innerText;
                const precio = parseInt(precioTexto.replace(/[^0-9]/g, ''), 10);
                const imagen = tarjeta.querySelector('img').getAttribute('src');

                let carrito = obtenerCarrito();
                const existente = carrito.find(item => item.nombre === nombre);
                if (existente) {
                    existente.cantidad = (existente.cantidad || 1) + 1;
                } else {
                    carrito.push({ nombre, precio, imagen, cantidad: 1 });
                }
                guardarCarrito(carrito);
            });
        });
    }

    actualizarContadorInterfaz();
    cargarProductosDesdeBD();
});