// Carrito de compras y flujo de pedidos
let cart = JSON.parse(localStorage.getItem('pizzeria_cart')) || [];

function saveCart() {
    localStorage.setItem('pizzeria_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId, name, price) {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.cantidad += 1;
    } else {
        cart.push({ id: productId, nombre: name, precio: parseFloat(price), cantidad: 1 });
    }
    saveCart();
    
    // Abrir el sidebar para mostrar el cambio
    document.getElementById('cart-sidebar').classList.add('open');
}

function changeQty(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.cantidad += delta;
    if (item.cantidad <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total-amount');
    
    // Contar total de productos
    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
    cartCount.textContent = totalItems;
    
    // Renderizar items
    cartItems.innerHTML = '';
    let totalMoney = 0;
    
    cart.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalMoney += subtotal;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.nombre}</h4>
                <span>S/ ${item.precio.toFixed(2)}</span>
            </div>
            <div class="cart-item-qty">
                <button onclick="changeQty(${item.id}, -1)">-</button>
                <span>${item.cantidad}</span>
                <button onclick="changeQty(${item.id}, 1)">+</button>
            </div>
        `;
        cartItems.appendChild(itemEl);
    });
    
    cartTotal.textContent = `S/ ${totalMoney.toFixed(2)}`;
}

// Confirmar y realizar el pedido (Inicia pasarela de pago)
function checkout() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Debes iniciar sesión para realizar un pedido.');
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    
    // Crear el modal de pasarela de pago dinámicamente si no existe
    let paymentModal = document.getElementById('payment-modal');
    if (!paymentModal) {
        paymentModal = document.createElement('div');
        paymentModal.id = 'payment-modal';
        paymentModal.className = 'payment-modal';
        paymentModal.innerHTML = `
            <div class="payment-modal-content">
                <div class="payment-modal-header">
                    <h3>Pasarela de Pago (Prueba)</h3>
                    <button class="payment-modal-close" onclick="closePaymentModal()">&times;</button>
                </div>
                <div id="payment-form-container">
                    <p style="margin-bottom: 16px; font-size: 0.9rem; color: #666;">Ingresa los datos para completar tu pedido de <strong>S/ ${total.toFixed(2)}</strong>.</p>
                    <form id="payment-form">
                        <div class="pay-form-group">
                            <label>Nombre Titular</label>
                            <input type="text" id="pay-name" value="${user.nombre}" required placeholder="Juan Pérez">
                        </div>
                        <div class="pay-form-group">
                            <label>Dirección de Envío</label>
                            <input type="text" id="pay-address" required placeholder="Av. Los Próceres 123, SJL">
                        </div>
                        <div class="pay-form-group">
                            <label>Número de Tarjeta</label>
                            <input type="text" id="pay-card" maxlength="19" required placeholder="4000 1234 5678 9010" oninput="formatCardNumber(this)">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="pay-form-group">
                                <label>Vencimiento (MM/AA)</label>
                                <input type="text" id="pay-expiry" maxlength="5" required placeholder="12/29" oninput="formatExpiry(this)">
                            </div>
                            <div class="pay-form-group">
                                <label>CVV</label>
                                <input type="password" id="pay-cvv" maxlength="3" required placeholder="123">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 16px;">Pagar y Confirmar Pedido</button>
                    </form>
                </div>
                <div id="payment-loading" style="display: none; text-align: center; padding: 32px 0;">
                    <div class="spinner"></div>
                    <h4 style="margin-top: 16px;">Procesando pago...</h4>
                    <p style="font-size: 0.85rem; color: #777; margin-top: 8px;">Por favor, no cierre esta ventana.</p>
                </div>
            </div>
        `;
        document.body.appendChild(paymentModal);
        
        document.getElementById('payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            processPayment(user.id, total);
        });
    } else {
        // Actualizar monto si cambió el carrito antes de abrir
        paymentModal.querySelector('strong').textContent = `S/ ${total.toFixed(2)}`;
    }
    
    paymentModal.classList.add('open');
}

function closePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.classList.remove('open');
    }
}

// Formateadores automáticos de input de tarjeta
function formatCardNumber(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
        input.value = parts.join(' ');
    } else {
        input.value = value;
    }
}

function formatExpiry(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
        input.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
        input.value = value;
    }
}

// Simular el procesamiento del pago y enviar al servidor
async function processPayment(userId, total) {
    const formContainer = document.getElementById('payment-form-container');
    const loadingContainer = document.getElementById('payment-loading');
    
    // Mostrar spinner de procesamiento
    formContainer.style.display = 'none';
    loadingContainer.style.display = 'block';
    
    // Simular retraso de pasarela de pago (2 segundos)
    setTimeout(async () => {
        const orderData = {
            usuario_id: userId,
            total: total,
            items: cart.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }))
        };
        
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            if (response.ok) {
                alert('¡Pago procesado con éxito y pedido registrado!');
                cart = [];
                saveCart();
                closePaymentModal();
                document.getElementById('cart-sidebar').classList.remove('open');
            } else {
                const data = await response.json();
                alert(data.message || 'Error al procesar el pedido.');
                // Regresar al formulario si falla
                formContainer.style.display = 'block';
                loadingContainer.style.display = 'none';
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión con el servidor.');
            formContainer.style.display = 'block';
            loadingContainer.style.display = 'none';
        }
    }, 2000);
}


// Inicializar elementos de UI al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Generar e insertar el HTML del carrito dinámicamente si no existe
    if (!document.getElementById('cart-sidebar')) {
        // Botón flotante del carrito
        const btn = document.createElement('button');
        btn.className = 'cart-floating-btn';
        btn.id = 'cart-btn';
        btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i><span class="cart-count" id="cart-count">0</span>`;
        document.body.appendChild(btn);
        
        // Sidebar del carrito
        const sidebar = document.createElement('div');
        sidebar.className = 'cart-sidebar';
        sidebar.id = 'cart-sidebar';
        sidebar.innerHTML = `
            <div class="cart-header">
                <h2>Tu Pedido</h2>
                <button class="btn-close-cart" id="close-cart-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cart-items" id="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Total:</span>
                    <span id="cart-total-amount">S/ 0.00</span>
                </div>
                <button class="btn-primary btn-checkout" onclick="checkout()">Confirmar Pedido</button>
            </div>
        `;
        document.body.appendChild(sidebar);
        
        // Event Listeners para abrir/cerrar
        btn.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.getElementById('close-cart-btn').addEventListener('click', () => sidebar.classList.remove('open'));
    }
    
    updateCartUI();
});
