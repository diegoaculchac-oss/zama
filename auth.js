// js/auth.js
const API = 'https://zama-1qrc.onrender.com';

document.addEventListener('DOMContentLoaded', () => {

    const seccionLogin = document.getElementById('seccion-login');
    const seccionRegistro = document.getElementById('seccion-registro');
    const seccionRecuperar = document.getElementById('seccion-recuperar');

    const btnIrARegistro = document.getElementById('btn-ir-a-registro');
    const btnIrALogin = document.getElementById('btn-ir-a-login');
    const btnIrARecuperar = document.getElementById('btn-ir-a-recuperar');
    const btnRecuperarALogin = document.getElementById('btn-recuperar-a-login');

    const formRegistro = document.getElementById('form-registro');
    const formLogin = document.getElementById('form-login');
    const formRecuperar = document.getElementById('form-recuperar');
    const formEditarPerfil = document.getElementById('form-editar-perfil');

    const perfilNombre = document.getElementById('perfil-nombre');
    const perfilEmail = document.getElementById('perfil-email');
    const perfilDireccion = document.getElementById('perfil-direccion');
    const perfilTelefono = document.getElementById('perfil-telefono');
    const avatarInicial = document.getElementById('avatar-inicial');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    // --- INTERCAMBIO DE VISTAS ---
    if (btnIrARegistro && btnIrALogin) {
        btnIrARegistro.addEventListener('click', () => {
            seccionRecuperar?.classList.add('d-none');
            seccionLogin.classList.add('d-none');
            seccionRegistro.classList.remove('d-none');
        });
        btnIrALogin.addEventListener('click', () => {
            seccionRecuperar?.classList.add('d-none');
            seccionRegistro.classList.add('d-none');
            seccionLogin.classList.remove('d-none');
        });
    }
    btnIrARecuperar?.addEventListener('click', () => {
        seccionLogin?.classList.add('d-none');
        seccionRegistro?.classList.add('d-none');
        seccionRecuperar?.classList.remove('d-none');
    });
    btnRecuperarALogin?.addEventListener('click', () => {
        seccionRecuperar?.classList.add('d-none');
        seccionRegistro?.classList.add('d-none');
        seccionLogin?.classList.remove('d-none');
    });

    // --- REGISTRO ---
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('reg-nombre').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;

            if (password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres.'); return; }

            try {
                const respuesta = await fetch(`${API}/api/usuarios/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password })
                });
                const resultado = await respuesta.json();
                if (respuesta.ok) {
                    alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                    formRegistro.reset();
                    seccionRegistro.classList.add('d-none');
                    seccionLogin.classList.remove('d-none');
                } else {
                    alert(resultado.error || 'Hubo un error en el registro.');
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- LOGIN ---
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const respuesta = await fetch(`${API}/api/usuarios/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const resultado = await respuesta.json();
                if (respuesta.ok) {
                    localStorage.setItem('usuarioLogueado', JSON.stringify(resultado.usuario));
                    if (resultado.usuario.rol === 'administrador') {
                        alert(`¡Bienvenido al Administrador, ${resultado.usuario.nombre}!`);
                        window.location.href = 'admin.html';
                    } else {
                        alert(`¡Bienvenido de nuevo, ${resultado.usuario.nombre}!`);
                        window.location.href = 'tienda.html';
                    }
                } else {
                    alert(resultado.error || 'Correo o contraseña incorrectos.');
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- RECUPERAR CONTRASEÑA ---
    if (formRecuperar) {
        formRecuperar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('recuperar-email').value.trim();
            try {
                const respuesta = await fetch(`${API}/api/usuarios/recuperar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const resultado = await respuesta.json();
                if (respuesta.ok) {
                    alert('¡Código enviado! Revisa tu correo.');
                    const codigoToken = prompt('Ingresa el código de verificación:');
                    if (!codigoToken) return;
                    const nuevaPassword = prompt('Ingresa tu NUEVA contraseña (mínimo 6 caracteres):');
                    if (!nuevaPassword || nuevaPassword.length < 6) { alert('Contraseña muy corta.'); return; }

                    const respuestaConf = await fetch(`${API}/api/usuarios/restablecer-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, token: codigoToken, nuevaPassword })
                    });
                    const resultadoConf = await respuestaConf.json();
                    if (respuestaConf.ok) {
                        alert('¡Contraseña actualizada! Ya puedes ingresar.');
                        formRecuperar.reset();
                        seccionRecuperar.classList.add('d-none');
                        seccionLogin.classList.remove('d-none');
                    } else {
                        alert(resultadoConf.error || 'Código incorrecto o expirado.');
                    }
                } else {
                    alert(resultado.error || 'Correo no registrado.');
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- PERFIL ---
    if (perfilNombre) {
        const datosLocales = localStorage.getItem('usuarioLogueado');
        if (!datosLocales) {
            alert('Por favor, inicia sesión para acceder a tu perfil.');
            window.location.href = 'ingreso.html';
            return;
        }
        const usuario = JSON.parse(datosLocales);

        perfilNombre.innerText = usuario.nombre;
        perfilEmail.innerText = usuario.email;
        perfilDireccion.innerText = usuario.direccion || 'No registrada';
        perfilTelefono.innerText = usuario.telefono || 'No registrado';

        if (usuario.foto) {
            // La foto ya viene con URL completa desde el server
            avatarInicial.innerHTML = `<img src="${usuario.foto}" class="w-100 h-100" style="object-fit: cover;">`;
            avatarInicial.classList.remove('bg-dark', 'text-white');
        } else {
            avatarInicial.innerText = usuario.nombre.charAt(0).toUpperCase();
            avatarInicial.classList.add('bg-dark', 'text-white');
        }

        if (document.getElementById('input-nombre')) document.getElementById('input-nombre').value = usuario.nombre;
        if (document.getElementById('input-email')) document.getElementById('input-email').value = usuario.email;
        if (document.getElementById('input-direccion')) document.getElementById('input-direccion').value = usuario.direccion || '';
        if (document.getElementById('input-telefono')) document.getElementById('input-telefono').value = usuario.telefono || '';

        cargarHistorialPedidos(usuario.id);
    }

    async function cargarHistorialPedidos(usuarioId) {
        const tablaPedidos = document.getElementById('tabla-pedidos');
        if (!tablaPedidos) return;
        try {
            const respuesta = await fetch(`${API}/api/pedidos/usuario/${usuarioId}`);
            if (!respuesta.ok) throw new Error('Error');
            const pedidos = await respuesta.json();
            if (pedidos.length === 0) {
                tablaPedidos.innerHTML = `<tr><td colspan="4" class="text-center text-muted small py-4">Aún no has realizado ninguna compra.</td></tr>`;
                return;
            }
            tablaPedidos.innerHTML = '';
            pedidos.forEach(pedido => {
                let claseBadge = 'bg-secondary';
                if (pedido.estado === 'Pendiente') claseBadge = 'bg-info text-dark';
                if (pedido.estado === 'En camino') claseBadge = 'bg-warning text-dark';
                if (pedido.estado === 'Entregado') claseBadge = 'bg-success';
                const totalFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pedido.total);
                tablaPedidos.innerHTML += `
                    <tr>
                        <td class="fw-bold text-secondary small">#ZM-${pedido.id}</td>
                        <td class="text-muted small">${pedido.fecha_formateada || 'N/A'}</td>
                        <td class="fw-semibold">${totalFormateado}</td>
                        <td class="text-end"><span class="badge ${claseBadge} rounded-0 text-uppercase">${pedido.estado}</span></td>
                    </tr>`;
            });
        } catch (error) {
            console.error('❌ Error historial:', error);
        }
    }

    // --- CERRAR SESIÓN ---
    btnCerrarSesion?.addEventListener('click', () => {
        localStorage.removeItem('usuarioLogueado');
        alert('Sesión cerrada correctamente.');
        window.location.href = 'tienda.html';
    });

    // --- EDITAR PERFIL ---
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datosLocales = localStorage.getItem('usuarioLogueado');
            if (!datosLocales) return;
            const usuarioActual = JSON.parse(datosLocales);
            const formData = new FormData(formEditarPerfil);
            try {
                const respuesta = await fetch(`${API}/api/usuarios/${usuarioActual.id}`, {
                    method: 'PUT',
                    body: formData
                });
                const resultado = await respuesta.json();
                if (respuesta.ok) {
                    alert('¡Información actualizada con éxito!');
                    const usuarioActualizado = {
                        ...usuarioActual,
                        nombre: resultado.nombre,
                        email: resultado.email,
                        direccion: resultado.direccion,
                        telefono: resultado.telefono,
                        foto: resultado.foto || usuarioActual.foto
                    };
                    localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioActualizado));
                    window.location.reload();
                } else {
                    alert(resultado.error || 'Hubo un error al actualizar.');
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- NAVBAR GLOBAL ---
    function renderizarBotonUsuarioGlobal() {
        const contenedor = document.getElementById('contenedor-usuario-nav');
        if (!contenedor) return;
        const datosLocales = localStorage.getItem('usuarioLogueado');
        if (datosLocales) {
            const usuario = JSON.parse(datosLocales);
            const destinoLink = usuario.rol === 'administrador' ? 'admin.html' : 'perfil.html';
            if (usuario.foto) {
                contenedor.innerHTML = `
                    <a href="${destinoLink}" class="d-flex align-items-center justify-content-center bg-light text-dark fw-bold rounded-circle shadow-sm overflow-hidden"
                       style="width:35px;height:35px;text-decoration:none;" title="Mi Perfil (${usuario.nombre})">
                       <img src="${usuario.foto}" class="w-100 h-100" style="object-fit:cover;">
                    </a>`;
            } else {
                const inicial = usuario.nombre.charAt(0).toUpperCase();
                contenedor.innerHTML = `
                    <a href="${destinoLink}" class="d-flex align-items-center justify-content-center bg-light text-dark fw-bold rounded-circle shadow-sm"
                       style="width:35px;height:35px;text-decoration:none;font-size:0.9rem;" title="Mi Perfil (${usuario.nombre})">
                       ${inicial}
                    </a>`;
            }
        } else {
            contenedor.innerHTML = `
                <a href="ingreso.html" class="btn btn-outline-light btn-sm rounded-0 text-uppercase fw-semibold" style="font-size:0.8rem;">
                    👤 Ingresar
                </a>`;
        }
    }

    renderizarBotonUsuarioGlobal();
});