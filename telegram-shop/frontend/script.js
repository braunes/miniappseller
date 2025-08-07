// Инициализация WebApp Telegram
const tg = window.Telegram.WebApp;

// Расширяем WebApp на весь экран
tg.expand();

// Получаем данные от Telegram
const initData = tg.initData || {};
const initDataUnsafe = tg.initDataUnsafe || {};

// Отображаем информацию о пользователе
if (initDataUnsafe.user) {
    const userInfo = document.getElementById('user-info');
    userInfo.innerHTML = `
        Привет, ${initDataUnsafe.user.first_name || 'пользователь'}!
        ${initDataUnsafe.user.username ? `(@${initDataUnsafe.user.username})` : ''}
    `;
}

// Корзина
let cart = [];
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

// Загрузка товаров
async function loadProducts() {
    try {
        // Если запущено внутри Telegram, используем initData
        let url = '/api/init-data';
        if (initDataUnsafe.user) {
            const params = new URLSearchParams();
            params.append('user_id', initDataUnsafe.user.id);
            params.append('username', initDataUnsafe.user.username || '');
            params.append('language_code', initDataUnsafe.user.language_code || 'en');
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        displayProducts(data.products || data);
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback: попробуем загрузить без initData
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            displayProducts(data);
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
            document.getElementById('products').innerHTML = '<p>Не удалось загрузить товары. Пожалуйста, попробуйте позже.</p>';
        }
    }
}

// Отображение товаров
function displayProducts(products) {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">$${product.price.toFixed(2)}</div>
            <button class="add-to-cart" data-id="${product.id}">Добавить в корзину</button>
        `;
        productsContainer.appendChild(productElement);
    });
    
    // Добавляем обработчики событий для кнопок
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.getAttribute('data-id'));
            const product = products.find(p => p.id === productId);
            addToCart(product);
        });
    });
}

// Добавление товара в корзину
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    
    // Показываем feedback
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Обновление корзины
function updateCart() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Корзина пуста</p>';
        cartTotal.textContent = 'Итого: $0.00';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <span>${item.name} x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    cartTotal.textContent = `Итого: $${total.toFixed(2)}`;
}

// Оформление заказа
document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    if (tg && tg.sendData) {
        // Отправляем данные о заказе в Telegram бота
        const orderData = {
            user: initDataUnsafe.user || {},
            cart: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        
        tg.sendData(JSON.stringify(orderData));
        
        // Закрываем WebApp с сообщением об успехе
        tg.close();
    } else {
        // Для тестирования вне Telegram
        alert(`Заказ оформлен! Сумма: $${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`);
        cart = [];
        updateCart();
    }
});

// Загружаем товары при загрузке страницы
document.addEventListener('DOMContentLoaded', loadProducts);