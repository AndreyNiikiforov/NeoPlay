// Загрузка данных пользователя из localStorage
document.addEventListener('DOMContentLoaded', () => {
    // Профиль
    if (document.getElementById('username')) {
        document.getElementById('username').innerText = localStorage.getItem('neoPlay_user') || 'Гость';
        document.getElementById('balance').innerText = localStorage.getItem('neoPlay_balance') || '0 ₽';
        document.getElementById('dealsCount').innerText = localStorage.getItem('neoPlay_deals') || '0';
    }
    
    // Мои значки
    if (document.getElementById('userBadges')) {
        const badges = JSON.parse(localStorage.getItem('neoPlay_badges')) || [];
        const container = document.getElementById('userBadges');
        if (badges.length === 0) {
            container.innerHTML = '<p style="text-align:center">У вас пока нет значков. Участвуйте в розыгрыше!</p>';
        } else {
            container.innerHTML = badges.map(b => `<div class="badge">${b.icon} ${b.name}</div>`).join('');
        }
        
        // Бонусы
        const commission = localStorage.getItem('neoPlay_userCommission') || '4%';
        const discount = localStorage.getItem('neoPlay_userDiscount') || '0%';
        document.getElementById('userCommission').innerText = commission;
        document.getElementById('userDiscount').innerText = discount;
    }
});

// Кнопка выхода
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('neoPlay_user');
    localStorage.removeItem('neoPlay_balance');
    alert('Вы вышли из профиля');
    location.reload();
});

// Кнопки покупки билета
document.getElementById('buyTicketBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Оплата через ЮMoney скоро. Напиши @neoplay_support для покупки билета.');
});

document.getElementById('giveawayBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Оплата через ЮMoney скоро. Напиши @neoplay_support для покупки билета.');
});