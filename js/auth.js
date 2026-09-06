// js/auth.js - Manejo de Registro, Inicio de Sesión, Perfil y Recuperación en Zama

document.addEventListener('DOMContentLoaded', () => {

    // Elementos para alternar las vistas en ingreso.html
    const seccionLogin = document.getElementById('seccion-login');
    const seccionRegistro = document.getElementById('seccion-registro');
    const seccionRecuperar = document.getElementById('seccion-recuperar');

    const btnIrARegistro = document.getElementById('btn-ir-a-registro');
    const btnIrALogin = document.getElementById('btn-ir-a-login');
    const btnIrARecuperar = document.getElementById('btn-ir-a-recuperar');
    const btnRecuperarALogin = document.getElementById('btn-recuperar-a-login');

    // Captura de formularios
    const formRegistro = document.getElementById('form-registro');
    const formLogin = document.getElementById('form-login');
    const formRecuperar = document.getElementById('form-recuperar');
    const formEditarPerfil = document.getElementById('form-editar-perfil');

    // Elementos visuales de la página de perfil
    const perfilNombre = document.getElementById('perfil-nombre');
    const perfilEmail = document.getElementById('perfil-email');
    const perfilDireccion = document.getElementById('perfil-direccion');
    const perfilTelefono = document.getElementById('perfil-telefono');
    const avatarInicial = document.getElementById('avatar-inicial');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    // ==========================================
    // 🔄 CONTROL DE INTERFAZ (INTERCAMBIO DE VISTAS)
    // ==========================================
    if (btnIrARegistro && btnIrALogin) {
        btnIrARegistro.addEventListener('click', () => {
            if (seccionRecuperar) seccionRecuperar.classList.add('d-none');
            seccionLogin.classList.add('d-none');
            seccionRegistro.classList.remove('d-none');
        });

        btnIrALogin.addEventListener('click', () => {
            if (seccionRecuperar) seccionRecuperar.classList.add('d-none');
            seccionRegistro.classList.add('d-none');
            seccionLogin.classList.remove('d-none');
        });
    }

    if (btnIrARecuperar) {
        btnIrARecuperar.addEventListener('click', () => {
            if (seccionLogin) seccionLogin.classList.add('d-none');
            if (seccionRegistro) seccionRegistro.classList.add('d-none');
            if (seccionRecuperar) seccionRecuperar.classList.remove('d-none');
        });
    }

    if (btnRecuperarALogin) {
        btnRecuperarALogin.addEventListener('click', () => {
            if (seccionRecuperar) seccionRecuperar.classList.add('d-none');
            if (seccionRegistro) seccionRegistro.classList.add('d-none');
            if (seccionLogin) seccionLogin.classList.remove('d-none');
        });
    }

    // ==========================================
    // 1. LÓGICA DE REGISTRO DE CUENTA
    // ==========================================
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('reg-nombre').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;

            if (password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres.');
                return;
            }

            try {
                const respuesta = await fetch('http://localhost:3000/api/usuarios/registro', {
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
                console.error('Error al conectar con la API de registro:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE INICIO DE SESIÓN
    // ==========================================
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const respuesta = await fetch('http://localhost:3000/api/usuarios/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    localStorage.setItem('usuarioLogueado', JSON.stringify(resultado.usuario));

                    if (resultado.usuario.rol === 'administrador') {
                        alert(`¡Bienvenido al Administrador de Zama Shop, ${resultado.usuario.nombre}!`);
                        window.location.href = 'admin.html';
                    } else {
                        alert(`¡Bienvenido de nuevo, ${resultado.usuario.nombre}!`);
                        window.location.href = 'tienda.html';
                    }
                } else {
                    alert(resultado.error || 'Correo o contraseña incorrectos.');
                }
            } catch (error) {
                console.error('Error en el login:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // ==========================================
    // ✉️ 2.1 LÓGICA DE SOLICITUD DE RECUPERACIÓN
    // ==========================================
    if (formRecuperar) {
        formRecuperar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('recuperar-email').value.trim();

            try {
                const respuesta = await fetch('http://localhost:3000/api/usuarios/recuperar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Código enviado con éxito! Por favor, revisa la bandeja de entrada o spam de tu correo electrónico.');

                    const codigoToken = prompt('Ingresa el código numérico de verificación enviado a tu correo:');
                    if (!codigoToken) return;

                    const nuevaPassword = prompt('Ingresa tu NUEVA contraseña de acceso (mínimo 6 caracteres):');
                    if (!nuevaPassword) return;

                    if (nuevaPassword.length < 6) {
                        alert('La contraseña es demasiado corta. Operación cancelada.');
                        return;
                    }

                    const respuestaConfirmacion = await fetch('http://localhost:3000/api/usuarios/restablecer-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, token: codigoToken, nuevaPassword })
                    });

                    const resultadoConfirmacion = await respuestaConfirmacion.json();

                    if (respuestaConfirmacion.ok) {
                        alert('¡Contraseña actualizada correctamente! Ya puedes ingresar con tus nuevas credenciales.');
                        formRecuperar.reset();
                        seccionRecuperar.classList.add('d-none');
                        seccionLogin.classList.remove('d-none');
                    } else {
                        alert(resultadoConfirmacion.error || 'El código introducido es incorrecto o ha caducado.');
                    }
                } else {
                    alert(resultado.error || 'Este correo electrónico no se encuentra registrado.');
                }
            } catch (error) {
                console.error('Error al procesar la solicitud de recuperación:', error);
                alert('No se pudo establecer conexión con el servidor.');
            }
        });
    }

    // ==========================================
    // 3. CARGAR DATOS REALES EN LA PÁGINA PERFIL
    // ==========================================
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
            avatarInicial.innerHTML = `<img src="http://localhost:3000/${usuario.foto}" class="w-100 h-100" style="object-fit: cover;">`;
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

    // ==========================================
    // 📦 3.1 FUNCIÓN PARA TRAER LOS PEDIDOS
    // ==========================================
    async function cargarHistorialPedidos(usuarioId) {
        const tablaPedidos = document.getElementById('tabla-pedidos');
        if (!tablaPedidos) return;

        try {
            const respuesta = await fetch(`http://localhost:3000/api/pedidos/usuario/${usuarioId}`);
            if (!respuesta.ok) throw new Error('Error al consultar pedidos');

            const pedidos = await respuesta.json();

            if (pedidos.length === 0) {
                tablaPedidos.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted small py-4">
                            Aún no has realizado ninguna compra en Zama.
                        </td>
                    </tr>`;
                return;
            }

            tablaPedidos.innerHTML = '';
            pedidos.forEach(pedido => {
                let claseBadge = 'bg-secondary';
                if (pedido.estado === 'Pendiente') claseBadge = 'bg-info text-dark';
                if (pedido.estado === 'En camino') claseBadge = 'bg-warning text-dark';
                if (pedido.estado === 'Entregado') claseBadge = 'bg-success';

                const totalFormateado = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                }).format(pedido.total);

                tablaPedidos.innerHTML += `
                    <tr>
                        <td class="fw-bold text-secondary small">#ZM-${pedido.id}</td>
                        <td class="text-muted small">${pedido.fecha_formateada || 'N/A'}</td>
                        <td class="fw-semibold">${totalFormateado}</td>
                        <td class="text-end">
                            <span class="badge ${claseBadge} rounded-0 text-uppercase">${pedido.estado}</span>
                        </td>
                    </tr>`;
            });
        } catch (error) {
            console.error('❌ Error al mapear el historial:', error);
        }
    }

    // ==========================================
    // 4. LÓGICA DE CERRAR SESIÓN
    // ==========================================
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogueado');
            alert('Sesión cerrada correctamente.');
            window.location.href = 'tienda.html';
        });
    }

    // ==========================================
    // 🔥 5. GUARDAR CAMBIOS (AJUSTADO PARA SERVER.JS)
    // ==========================================
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datosLocales = localStorage.getItem('usuarioLogueado');
            if (!datosLocales) return;
            const usuarioActual = JSON.parse(datosLocales);

            // FormData extrae automáticamente los valores de los inputs por su 'name'
            const formData = new FormData(formEditarPerfil);

            try {
                const respuesta = await fetch(`http://localhost:3000/api/usuarios/${usuarioActual.id}`, {
                    method: 'PUT',
                    body: formData
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Información actualizada con éxito!');

                    // Sincronizamos los datos actualizados del servidor al localStorage
                    const usuarioActualizado = {
                        ...usuarioActual,
                        nombre: resultado.nombre,
                        email: resultado.email,
                        direccion: resultado.direccion,
                        telefono: resultado.telefono,
                        foto: resultado.foto || usuarioActual.foto // Mantiene la foto anterior si no se subió una nueva
                    };

                    localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioActualizado));
                    window.location.reload();
                } else {
                    alert(resultado.error || 'Hubo un error al actualizar los datos.');
                }
            } catch (error) {
                console.error('Error al conectar con la API:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // ==========================================
    // 👤 NAVBAR GLOBAL
    // ==========================================
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
                       style="width: 35px; height: 35px; text-decoration: none;" 
                       title="Mi Panel/Perfil (${usuario.nombre})">
                       <img src="http://localhost:3000/${usuario.foto}" class="w-100 h-100" style="object-fit: cover;">
                    </a>
                `;
            } else {
                const inicial = usuario.nombre.charAt(0).toUpperCase();
                contenedor.innerHTML = `
                    <a href="${destinoLink}" class="d-flex align-items-center justify-content-center bg-light text-dark fw-bold rounded-circle shadow-sm" 
                       style="width: 35px; height: 35px; text-decoration: none; font-size: 0.9rem;" 
                       title="Mi Panel/Perfil (${usuario.nombre})">
                       ${inicial}
                    </a>
                `;
            }
        } else {
            contenedor.innerHTML = `
                <a href="ingreso.html" class="btn btn-outline-light btn-sm rounded-0 text-uppercase fw-semibold" style="font-size: 0.8rem;">
                    👤 Ingresar
                </a>
            `;
        }
    }

    renderizarBotonUsuarioGlobal();
});