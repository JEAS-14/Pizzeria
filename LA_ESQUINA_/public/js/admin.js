// JavaScript completo para el Panel de Administración Avanzado
document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar que el usuario sea Admin
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    if (user.rol !== 'admin') {
        alert('Acceso denegado. No tienes permisos de administrador.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('admin-name').textContent = user.nombre;

    // 2. Configurar botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // 3. Inicializar Navegación de Pestañas (Tabs)
    setupTabNavigation();

    // 4. Cargar datos iniciales
    loadDashboardData();
    loadStatsData();
    loadUsersData();
    loadProductsData();

    // 5. Manejador del Formulario de Productos
    document.getElementById('product-form').addEventListener('submit', handleProductFormSubmit);
});

// ==========================================
// 1. NAVEGACIÓN ENTRE VISTAS (TABS)
// ==========================================
function setupTabNavigation() {
    const menuLinks = document.querySelectorAll('.menu-links li[data-view]');
    const views = document.querySelectorAll('.dashboard-view');
    const viewTitle = document.getElementById('view-title');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Cambiar clase activa en menú lateral
            menuLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');

            // Mostrar vista correspondiente
            const targetView = link.getAttribute('data-view');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${targetView}`) {
                    view.classList.add('active');
                }
            });

            // Actualizar título de cabecera
            viewTitle.textContent = link.textContent.trim();
        });
    });
}

// ==========================================
// 2. GESTIÓN DE PEDIDOS Y METRICAS
// ==========================================
async function loadDashboardData() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/admin/orders');
        if (!response.ok) throw new Error('Error al cargar pedidos');

        const orders = await response.json();
        renderOrders(orders);
        calculateMetrics(orders);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent);">Error al conectar con la base de datos.</td></tr>`;
    }
}

async function loadStatsData() {
    const salesTbody = document.getElementById('sales-today-tbody');
    const topList = document.getElementById('top-products-list');
    if (!salesTbody || !topList) return;

    try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('Error al obtener estadísticas');
        const data = await response.json();

        // 1. Renderizar ventas del día
        salesTbody.innerHTML = '';
        if (data.sales_today.length === 0) {
            salesTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No hay ventas entregadas hoy aún.</td></tr>';
        } else {
            data.sales_today.forEach(sale => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sale.hora} hs</td>
                    <td><strong>${sale.cliente || 'Invitado'}</strong></td>
                    <td style="font-weight: 700; color: var(--green);">S/ ${parseFloat(sale.total).toFixed(2)}</td>
                `;
                salesTbody.appendChild(tr);
            });
        }

        // 2. Renderizar pizzas más vendidas
        topList.innerHTML = '';
        if (data.top_products.length === 0) {
            topList.innerHTML = '<li style="color: var(--text-secondary); text-align: center;">No hay pizzas vendidas todavía.</li>';
        } else {
            data.top_products.forEach((prod, index) => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justify = 'space-between';
                li.style.alignItems = 'center';
                li.style.padding = '8px 12px';
                li.style.background = 'rgba(255,255,255,0.03)';
                li.style.borderRadius = '8px';
                li.innerHTML = `
                    <span><strong>#${index + 1}</strong> ${prod.nombre}</span>
                    <span style="font-weight: 700; color: var(--accent);">${prod.total_vendido} u.</span>
                `;
                topList.appendChild(li);
            });
        }
    } catch (err) {
        console.error(err);
        salesTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--accent);">Error al cargar.</td></tr>';
        topList.innerHTML = '<li style="color: var(--accent);">Error al cargar estadísticas.</li>';
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No se encontraron pedidos registrados.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');
        const fecha = new Date(order.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' });
        
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td><strong>${order.cliente_nombre}</strong><br><span style="font-size:0.8rem; color:var(--text-secondary);">${order.cliente_email}</span></td>
            <td>${fecha}</td>
            <td>${order.detalles || 'Sin detalles'}</td>
            <td style="font-weight:700;">S/ ${parseFloat(order.total).toFixed(2)}</td>
            <td>
                <span class="badge ${order.estado}">${order.estado}</span>
            </td>
            <td>
                <select class="select-status" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pendiente" ${order.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="preparando" ${order.estado === 'preparando' ? 'selected' : ''}>Preparando</option>
                    <option value="enviado" ${order.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="entregado" ${order.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateMetrics(orders) {
    let salesToday = 0;
    let pendingCount = 0;
    let completedCount = 0;

    const todayStr = new Date().toDateString();

    orders.forEach(order => {
        const orderDateStr = new Date(order.fecha).toDateString();
        
        if (orderDateStr === todayStr && order.estado === 'entregado') {
            salesToday += parseFloat(order.total);
        }

        if (order.estado === 'pendiente' || order.estado === 'preparando' || order.estado === 'enviado') {
            pendingCount++;
        } else if (order.estado === 'entregado') {
            completedCount++;
        }
    });

    document.getElementById('metric-sales').textContent = `S/ ${salesToday.toFixed(2)}`;
    document.getElementById('metric-pending').textContent = pendingCount;
    document.getElementById('metric-completed').textContent = completedCount;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: newStatus })
        });

        if (response.ok) {
            loadDashboardData();
            loadStatsData();
        } else {
            const data = await response.json();
            alert(data.message || 'Error al cambiar estado de pedido');
        }
    } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor.');
    }
}

// ==========================================
// 3. GESTIÓN DE USUARIOS
// ==========================================
async function loadUsersData() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Error al cargar usuarios');

        const users = await response.json();
        renderUsers(users);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent);">Error al cargar usuarios.</td></tr>`;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        const fecha = new Date(user.fecha_registro).toLocaleString('es-PE', { timeZone: 'America/Lima' });

        tr.innerHTML = `
            <td>#${user.id}</td>
            <td><strong>${user.nombre}</strong></td>
            <td>${user.email}</td>
            <td>${fecha}</td>
            <td><span class="badge ${user.rol === 'admin' ? 'entregado' : 'pendiente'}">${user.rol}</span></td>
            <td>
                <select class="select-status" onchange="updateUserRole(${user.id}, this.value)">
                    <option value="cliente" ${user.rol === 'cliente' ? 'selected' : ''}>Cliente</option>
                    <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rol: newRole })
        });

        if (response.ok) {
            loadUsersData();
            alert('Rol de usuario actualizado.');
        } else {
            const data = await response.json();
            alert(data.message || 'Error al actualizar rol');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión.');
    }
}

// ==========================================
// 4. GESTIÓN DE PRODUCTOS (CARTA CRUD)
// ==========================================
let allProducts = []; // Caché local para edición fácil

async function loadProductsData() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Error al obtener carta');

        allProducts = await response.json();
        renderProductsTable(allProducts);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent);">Error al cargar carta.</td></tr>`;
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';

    products.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${prod.id}</td>
            <td><img src="${prod.imagen || 'img/img9.png'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
            <td><strong>${prod.nombre}</strong></td>
            <td><span class="badge" style="background: rgba(255,255,255,0.05); color:#fff;">${prod.categoria}</span></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.descripcion || ''}</td>
            <td style="font-weight: 700; color: var(--accent);">S/ ${parseFloat(prod.precio).toFixed(2)}</td>
            <td><strong style="color: ${prod.stock <= 0 ? 'var(--accent)' : 'var(--text-primary)'}">${prod.stock} u.</strong></td>
            <td>
                <div class="actions">
                    <button class="btn-icon" onclick="openEditProductModal(${prod.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon delete" onclick="deleteProduct(${prod.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal open/close functions
function openAddProductModal() {
    document.getElementById('modal-title').textContent = 'Agregar Nuevo Producto';
    document.getElementById('product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').classList.add('open');
}

function openEditProductModal(productId) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('product-id').value = prod.id;
    document.getElementById('prod-nombre').value = prod.nombre;
    document.getElementById('prod-descripcion').value = prod.descripcion || '';
    document.getElementById('prod-precio').value = prod.precio;
    document.getElementById('prod-categoria').value = prod.categoria;
    document.getElementById('prod-imagen').value = prod.imagen || '';
    document.getElementById('prod-stock').value = prod.stock;

    document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('open');
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const nombre = document.getElementById('prod-nombre').value;
    const descripcion = document.getElementById('prod-descripcion').value;
    const precio = parseFloat(document.getElementById('prod-precio').value);
    const categoria = document.getElementById('prod-categoria').value;
    const imagen = document.getElementById('prod-imagen').value;
    const stock = parseInt(document.getElementById('prod-stock').value);

    const payload = { nombre, descripcion, precio, categoria, imagen, stock };

    let url = '/api/admin/products';
    let method = 'POST';

    if (id) {
        url = `/api/admin/products/${id}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(id ? 'Producto actualizado con éxito.' : 'Producto agregado a la carta.');
            closeProductModal();
            loadProductsData();
        } else {
            const data = await response.json();
            alert(data.message || 'Error al guardar producto');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión.');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto de la carta?')) return;

    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Producto eliminado con éxito.');
            loadProductsData();
        } else {
            const data = await response.json();
            alert(data.message || 'Error al eliminar producto.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión.');
    }
}
