// Lógica general y carga dinámica de la carta de pizzas
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupAuthNavbar();
});

// Cargar productos de la base de datos a la grilla
async function loadProducts() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Error al obtener productos');
        
        let products = await response.json();
        
        // Detectar si estamos en la página de promociones
        const isPromosPage = window.location.pathname.includes('promos.html');
        
        if (isPromosPage) {
            // Cargar solo promociones
            products = products.filter(prod => prod.categoria === 'Promociones');
        } else {
            // Cargar pizzas estándar (excluyendo la categoría Promociones)
            products = products.filter(prod => prod.categoria !== 'Promociones');
        }

        // Limpiar el contenido estático/de carga
        grid.innerHTML = '';
        
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--gray);">No hay elementos disponibles en esta sección por el momento.</p>';
            return;
        }

        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';

            // Lógica para deshabilitar promociones de Sábado si hoy no es sábado
            let isDisabled = false;
            let buttonText = '+ Pedir';
            let buttonStyle = '';

            const isSaturdayPromo = prod.nombre.toLowerCase().includes('sábado') || 
                                    prod.descripcion.toLowerCase().includes('sábado') || 
                                    prod.descripcion.toLowerCase().includes('sábados');

            if (isSaturdayPromo) {
                const todayDay = new Date().getDay(); // 0: Domingo, 6: Sábado
                if (todayDay !== 6) {
                    isDisabled = true;
                    buttonText = 'Solo Sábados';
                    buttonStyle = 'background-color: #888; cursor: not-allowed;';
                }
            }

            // Lógica de Stock Agotado (prioridad sobre el sábado)
            if (prod.stock !== null && prod.stock <= 0) {
                isDisabled = true;
                buttonText = 'Agotado';
                buttonStyle = 'background-color: #f39c12; cursor: not-allowed;';
            }

            const stockLabel = prod.stock > 0 ? `Stock: ${prod.stock} u.` : '<span style="color: var(--red); font-weight:700;">Agotado</span>';

            card.innerHTML = `
                <img src="${prod.imagen || 'img/img9.png'}" alt="${prod.nombre}"/>
                <div class="product-card-body">
                    <div style="display:flex; justify-content:space-between; font-size:.7rem; font-weight:800; text-transform:uppercase;">
                        <span class="product-tag">${prod.categoria}</span>
                        <span style="color: #666;">${stockLabel}</span>
                    </div>
                    <h3>${prod.nombre}</h3>
                    <p>${prod.descripcion || 'Sin descripción disponible.'}</p>
                    <div class="product-footer">
                        <span class="price">S/ ${parseFloat(prod.precio).toFixed(2)}</span>
                        <button class="btn-add" ${isDisabled ? 'disabled' : ''} style="${buttonStyle}" onclick="addToCart(${prod.id}, '${prod.nombre}', ${prod.precio})">${buttonText}</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p style="color: red; text-align: center; grid-column: 1/-1;">Error al cargar los productos. Por favor intente más tarde.</p>';
    }
}

// Configurar navbar según el estado de sesión
function setupAuthNavbar() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        
        // Reemplazar botón "Iniciar Sesión" con el nombre del usuario y cerrar sesión
        let html = `
            <a href="/#menu">Carta</a>
            <a href="promos.html">Promos</a>
        `;
        
        if (user.rol === 'admin') {
            html += `<a href="admin.html" style="color: var(--yellow); font-weight: 800;">Panel Admin</a>`;
        }
        
        html += `
            <span style="color: #fff; font-weight: 700;">Hola, ${user.nombre.split(' ')[0]}</span>
            <a href="#" id="logout-btn" class="btn-nav btn-logout">Salir</a>
        `;
        navLinks.innerHTML = html;

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            localStorage.removeItem('pizzeria_cart');
            window.location.href = '/index.html';
        });
    }
}
