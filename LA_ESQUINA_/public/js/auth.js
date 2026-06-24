// Lógica de Autenticación para Clientes
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form[action="login.html"]');
    const registerForm = document.querySelector('form[action="registro.html"]');
    
    // Mostrar errores en un div de alerta
    const showAlert = (message, parentForm) => {
        let alertDiv = parentForm.querySelector('.alert');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.className = 'alert';
            parentForm.insertBefore(alertDiv, parentForm.firstChild);
        }
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
    };

    // Formulario de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    if (data.user.rol === 'admin') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                } else {
                    showAlert(data.message || 'Error al iniciar sesión', loginForm);
                }
            } catch (err) {
                console.error(err);
                showAlert('Error de conexión con el servidor', loginForm);
            }
        });
    }

    // Formulario de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombres = registerForm.querySelector('input[name="nombres"]').value;
            const apellidos = registerForm.querySelector('input[name="apellidos"]').value;
            const email = registerForm.querySelector('input[name="email"]').value;
            const telefono = registerForm.querySelector('input[name="telefono"]').value;
            const password = registerForm.querySelector('input[name="password"]').value;
            const password2 = registerForm.querySelector('input[name="password2"]').value;

            if (password !== password2) {
                showAlert('Las contraseñas no coinciden', registerForm);
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: `${nombres} ${apellidos}`,
                        email,
                        password,
                        telefono
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Registro exitoso. Ahora puedes iniciar sesión.');
                    window.location.href = '/login.html';
                } else {
                    showAlert(data.message || 'Error en el registro', registerForm);
                }
            } catch (err) {
                console.error(err);
                showAlert('Error de conexión con el servidor', registerForm);
            }
        });
    }

    // Configurar inicio de sesión simulado con Google
    const btnSocial = document.querySelector('.btn-social');
    if (btnSocial) {
        btnSocial.addEventListener('click', () => {
            // Crear el modal de Google si no existe
            let googleModal = document.getElementById('google-modal');
            if (!googleModal) {
                googleModal = document.createElement('div');
                googleModal.id = 'google-modal';
                googleModal.className = 'google-modal';
                googleModal.innerHTML = `
                    <div class="google-modal-content">
                        <div class="google-header">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google">
                            <h3>Selecciona una cuenta</h3>
                            <p style="font-size: 0.85rem; color: #666; margin-top: 4px;">para continuar en LA ESQUINA</p>
                        </div>
                        <div id="google-accounts-container" class="google-users">
                            <div class="google-user-item" onclick="loginWithGoogleSimulated('Juan Pérez', 'cliente@laesquina.com', 2)">
                                <div class="google-avatar">JP</div>
                                <div>
                                    <strong style="font-size: 0.9rem;">Juan Pérez (Prueba)</strong><br>
                                    <span style="font-size: 0.8rem; color: #777;">cliente@laesquina.com</span>
                                </div>
                            </div>
                            <div class="google-user-item" onclick="loginWithGoogleSimulated('Invitado Google', 'invitado@gmail.com', 2)">
                                <div class="google-avatar" style="background: #4285f4;">G</div>
                                <div>
                                    <strong style="font-size: 0.9rem;">Invitado Google</strong><br>
                                    <span style="font-size: 0.8rem; color: #777;">invitado@gmail.com</span>
                                </div>
                            </div>
                        </div>
                        <div id="google-loading-spinner" class="google-loading">
                            <div class="google-spinner"></div>
                            <h4>Verificando cuenta...</h4>
                        </div>
                    </div>
                `;
                document.body.appendChild(googleModal);
            }
            googleModal.classList.add('open');
        });
    }
});

// Función global para manejar el login de Google simulado
function loginWithGoogleSimulated(name, email, userId) {
    const container = document.getElementById('google-accounts-container');
    const loading = document.getElementById('google-loading-spinner');
    
    container.style.display = 'none';
    loading.style.display = 'block';

    setTimeout(() => {
        const simulatedUser = {
            id: userId,
            nombre: name,
            email: email,
            rol: 'cliente'
        };
        localStorage.setItem('user', JSON.stringify(simulatedUser));
        document.getElementById('google-modal').classList.remove('open');
        window.location.href = '/index.html';
    }, 1500);
}

