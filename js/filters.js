// js/filters.js - Controla el filtrado dinámico de los productos de MySQL

export function inicializarFiltros(productosBaseDatos, renderizarProductos) {
    const botonesFiltro = document.querySelectorAll('.btn-filtro');

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', (e) => {
            // 🎨 Cambio estético de los botones
            botonesFiltro.forEach(b => {
                b.classList.remove('btn-dark');
                b.classList.add('btn-outline-dark');
            });
            e.target.classList.remove('btn-outline-dark');
            e.target.classList.add('btn-dark');

            const categoriaSeleccionada = e.target.getAttribute('data-categoria');

            if (!categoriaSeleccionada) return;

            // 🔍 Filtrado seguro
            if (categoriaSeleccionada === 'todos') {
                renderizarProductos(productosBaseDatos);
            } else {
                // 🔥 Evita que se rompa si hay categorías NULL o en mayúsculas/minúsculas
                const filtrados = productosBaseDatos.filter(p => {
                    if (!p.categoria) return false;
                    return p.categoria.trim().toLowerCase() === categoriaSeleccionada.trim().toLowerCase();
                });
                renderizarProductos(filtrados);
            }
        });
    });
}