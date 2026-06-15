// ==================== БАЗА ДАННЫХ ЗНАЧКОВ ====================
const badgesDB = {
    common: { 
        name: 'Обычный', 
        icon: '⚪', 
        chance: 90, 
        commission: 4, 
        discount: 0,
        minPrice: 19
    },
    rare: { 
        name: 'Редкий', 
        icon: '🟣', 
        chance: 8, 
        commission: 3, 
        discount: 0,
        minPrice: 99
    },
    veryRare: { 
        name: 'Очень редкий', 
        icon: '🟠', 
        chance: 1.5, 
        commission: 2, 
        discount: 3,
        minPrice: 299
    },
    elite: { 
        name: 'Элитный', 
        icon: '🔴', 
        chance: 0.4, 
        commission: 1, 
        discount: 5,
        minPrice: 499
    },
    legendary: { 
        name: 'Легендарный', 
        icon: '👑', 
        chance: 0.09, 
        commission: 0, 
        discount: 10,
        minPrice: 1499
    },
    absolute: { 
        name: 'Абсолют', 
        icon: '💎', 
        chance: 0.001, 
        commission: 0, 
        discount: 20,
        minPrice: 4999
    }
};

// ==================== РАБОТА С ПОЛЬЗОВАТЕЛЕМ ====================
function getUser() {
    return JSON.parse(localStorage.getItem('neoPlay_userData')) || null;
}

function saveUser(userData) {
    localStorage.setItem('neoPlay_userData', JSON.stringify(userData));
}

function updateUserBadges(badges) {
    const user = getUser();
    if (user) {
        user.badges = badges;
        saveUser(user);
        updateUserBonuses();
    }
}

function updateUserBonuses() {
    const user = getUser();
    if (!user) return;
    
    let bestCommission = 4;
    let bestDiscount = 0;
    
    user.badges.forEach(badge => {
        const badgeInfo = badgesDB[badge.id];
        if (badgeInfo && badgeInfo.commission < bestCommission) {
            bestCommission = badgeInfo.commission;
        }
        if (badgeInfo && badgeInfo.discount > bestDiscount) {
            bestDiscount = badgeInfo.discount;
        }
    });
    
    user.activeCommission = bestCommission;
    user.activeDiscount = bestDiscount;
    saveUser(user);
    
    // Обновляем отображение на странице
    if (document.getElementById('userCommission')) {
        document.getElementById('userCommission').innerText = user.activeCommission + '%';
    }
    if (document.getElementById('userDiscount')) {
        document.getElementById('userDiscount').innerText = user.activeDiscount + '%';
    }
}

// ==================== ОТКРЫТИЕ КЕЙСА ====================
function openCase() {
    const user = getUser();
    if (!user) {
        alert('Войдите в профиль, чтобы открыть кейс');
        return null;
    }
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [id, badge] of Object.entries(badgesDB)) {
        cumulative += badge.chance;
        if (random <= cumulative) {
            const newBadge = {
                id: id,
                name: badge.name,
                icon: badge.icon,
                obtainedAt: new Date().toISOString()
            };
            user.badges.push(newBadge);
            saveUser(user);
            updateUserBonuses();
            return newBadge;
        }
    }
    return null;
}

// ==================== БИРЖА ЗНАЧКОВ ====================
function getExchangeListings() {
    return JSON.parse(localStorage.getItem('neoPlay_exchange')) || [];
}

function saveExchangeListings(listings) {
    localStorage.setItem('neoPlay_exchange', JSON.stringify(listings));
}

function addListing(badgeId, price) {
    const user = getUser();
    if (!user) return { success: false, message: 'Войдите в профиль' };
    
    const badgeIndex = user.badges.findIndex(b => b.id === badgeId);
    if (badgeIndex === -1) {
        return { success: false, message: 'У вас нет такого значка' };
    }
    
    const badge = user.badges[badgeIndex];
    const badgeInfo = badgesDB[badgeId];
    if (price < badgeInfo.minPrice) {
        return { success: false, message: `Минимальная цена ${badgeInfo.minPrice} ₽` };
    }
    
    const listing = {
        id: Date.now(),
        seller: user.username,
        badgeId: badgeId,
        badgeName: badge.name,
        badgeIcon: badge.icon,
        price: price,
        createdAt: new Date().toISOString()
    };
    
    const listings = getExchangeListings();
    listings.push(listing);
    saveExchangeListings(listings);
    
    // Удаляем значок у продавца
    user.badges.splice(badgeIndex, 1);
    saveUser(user);
    updateUserBonuses();
    
    return { success: true, message: 'Значок выставлен на продажу' };
}

function buyListing(listingId) {
    const user = getUser();
    if (!user) return { success: false, message: 'Войдите в профиль' };
    
    const listings = getExchangeListings();
    const listingIndex = listings.findIndex(l => l.id === listingId);
    if (listingIndex === -1) {
        return { success: false, message: 'Объявление не найдено' };
    }
    
    const listing = listings[listingIndex];
    if (user.balance < listing.price) {
        return { success: false, message: 'Недостаточно средств' };
    }
    
    // Комиссия NeoPlay 2%
    const commission = Math.floor(listing.price * 0.02);
    const sellerGets = listing.price - commission;
    
    // Списываем деньги у покупателя
    user.balance -= listing.price;
    
    // Начисляем продавцу (находим продавца)
    const sellers = JSON.parse(localStorage.getItem('neoPlay_users')) || [];
    const seller = sellers.find(u => u.username === listing.seller);
    if (seller) {
        seller.balance = (seller.balance || 0) + sellerGets;
        const allUsers = sellers.map(u => u.username === listing.seller ? seller : u);
        localStorage.setItem('neoPlay_users', JSON.stringify(allUsers));
    }
    
    // Добавляем значок покупателю
    const newBadge = {
        id: listing.badgeId,
        name: listing.badgeName,
        icon: listing.badgeIcon,
        obtainedAt: new Date().toISOString()
    };
    user.badges.push(newBadge);
    saveUser(user);
    
    // Удаляем объявление
    listings.splice(listingIndex, 1);
    saveExchangeListings(listings);
    
    updateUserBonuses();
    return { success: true, message: `Значок куплен! Комиссия NeoPlay: ${commission} ₽` };
}

// ==================== ПОПОЛНЕНИЕ БАЛАНСА ====================
function addBalance(amount) {
    const user = getUser();
    if (!user) return { success: false, message: 'Войдите в профиль' };
    
    user.balance += amount;
    saveUser(user);
    return { success: true, message: `Баланс пополнен на ${amount} ₽` };
}

// ==================== РОЗЫГРЫШ АБСОЛЮТА ====================
const giveawayTickets = JSON.parse(localStorage.getItem('neoPlay_tickets')) || [];
const GIVEAWAY_END_TIME = new Date().setHours(20, 0, 0, 0); // Сегодня 20:00

function buyTicket() {
    const user = getUser();
    if (!user) {
        alert('Войдите в профиль, чтобы купить билет');
        return false;
    }
    
    if (user.balance < 100) {
        alert('Недостаточно средств. Пополните баланс.');
        return false;
    }
    
    user.balance -= 100;
    saveUser(user);
    
    giveawayTickets.push({
        username: user.username,
        ticketId: Date.now() + Math.random(),
        purchasedAt: new Date().toISOString()
    });
    localStorage.setItem('neoPlay_tickets', JSON.stringify(giveawayTickets));
    
    alert('Билет куплен! Удачи в розыгрыше!');
    return true;
}

function drawGiveaway() {
    if (giveawayTickets.length === 0) {
        return [];
    }
    
    // Перемешиваем и выбираем 3 победителей
    const shuffled = [...giveawayTickets];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const winners = shuffled.slice(0, 3);
    
    // Награждаем победителей значком Абсолют
    const users = JSON.parse(localStorage.getItem('neoPlay_users')) || [];
    winners.forEach(winner => {
        const user = users.find(u => u.username === winner.username);
        if (user) {
            user.badges.push({
                id: 'absolute',
                name: 'Абсолют',
                icon: '💎',
                obtainedAt: new Date().toISOString()
            });
        }
    });
    localStorage.setItem('neoPlay_users', JSON.stringify(users));
    
    // Очищаем билеты
    localStorage.setItem('neoPlay_tickets', JSON.stringify([]));
    
    return winners;
}

// ==================== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ ====================
document.addEventListener('DOMContentLoaded', () => {
    // Профиль
    if (document.getElementById('username')) {
        const user = getUser();
        if (user) {
            document.getElementById('username').innerText = user.username;
            document.getElementById('balance').innerText = user.balance + ' ₽';
            document.getElementById('dealsCount').innerText = user.dealsCount || '0';
        } else {
            document.getElementById('username').innerText = 'Гость';
        }
    }
    
    // Мои значки
    if (document.getElementById('userBadges')) {
        const user = getUser();
        const container = document.getElementById('userBadges');
        if (!user || user.badges.length === 0) {
            container.innerHTML = '<p style="text-align:center">У вас пока нет значков. Участвуйте в розыгрыше!</p>';
        } else {
            container.innerHTML = user.badges.map(b => `
                <div class="badge-card">
                    <div class="badge-icon">${b.icon}</div>
                    <h3>${b.name}</h3>
                    <button class="btn-small" onclick="sellBadge('${b.id}')">Продать</button>
                </div>
            `).join('');
        }
    }
    
    // Биржа
    if (document.getElementById('exchangeList')) {
        renderExchange();
    }
});

function renderExchange() {
    const container = document.getElementById('exchangeList');
    if (!container) return;
    
    const listings = getExchangeListings();
    if (listings.length === 0) {
        container.innerHTML = '<p style="text-align:center">Нет значков в продаже</p>';
        return;
    }
    
    container.innerHTML = listings.map(l => `
        <div class="exchange-item">
            <div class="badge-icon">${l.badgeIcon}</div>
            <h3>${l.badgeName}</h3>
            <div class="price">${l.price} ₽</div>
            <button class="btn-small" onclick="buyListing(${l.id})">Купить</button>
        </div>
    `).join('');
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML ====================
window.openCase = function() {
    const result = openCase();
    if (result) {
        alert(`Поздравляем! Вы получили значок ${result.name} ${result.icon}`);
        location.reload();
    }
};

window.buyTicket = function() {
    if (buyTicket()) {
        location.reload();
    }
};

window.sellBadge = function(badgeId) {
    const price = prompt('Укажите цену продажи (в рублях):');
    if (price && !isNaN(price)) {
        const result = addListing(badgeId, parseInt(price));
        alert(result.message);
        if (result.success) location.reload();
    }
};

window.buyListing = function(listingId) {
    const result = buyListing(listingId);
    alert(result.message);
    if (result.success) location.reload();
};

window.addBalance = function() {
    const amount = prompt('Сумма пополнения (от 100 ₽):');
    if (amount && !isNaN(amount) && amount >= 100) {
        // Здесь будет редирект на ЮMoney
        alert(`Для пополнения на ${amount} ₽ перейдите по ссылке: https://yoomoney.ru/...`);
    }
};

// Проверяем, не пора ли провести розыгрыш
if (new Date() >= new Date(GIVEAWAY_END_TIME) && giveawayTickets.length > 0) {
    const winners = drawGiveaway();
    if (winners.length > 0) {
        console.log('Розыгрыш проведён! Победители:', winners);
        alert(`🎉 РОЗЫГРЫШ СОСТОЯЛСЯ! Победители: ${winners.map(w => w.username).join(', ')}`);
    }
}
