const searchBar = document.querySelector('.search-bar');
const gameCards = document.querySelectorAll('.game-card');
const tags = document.querySelectorAll('.tag');
const sortSelect = document.querySelector('.sort-select');

let activeFilters = {
  discount: null,
  category: null
};

searchBar.addEventListener('input', filterAndSortGames);
tags.forEach(tag => tag.addEventListener('click', toggleTag));
sortSelect.addEventListener('change', filterAndSortGames);

function toggleTag(e) {
  const tag = e.target;
  const discount = tag.dataset.discount;
  const category = tag.dataset.category;
  
  if (tag.classList.contains('active')) {
    tag.classList.remove('active');
    if (discount) activeFilters.discount = null;
    if (category) activeFilters.category = null;
  } else {
    tags.forEach(t => {
      if ((discount && t.dataset.discount) || (category && t.dataset.category)) {
        t.classList.remove('active');
      }
    });
    tag.classList.add('active');
    if (discount) activeFilters.discount = parseInt(discount);
    if (category) activeFilters.category = category;
  }
  
  filterAndSortGames();
}

function filterAndSortGames() {
  const searchTerm = searchBar.value.toLowerCase();
  const sortValue = sortSelect.value;
  let visibleCards = [];
  
  gameCards.forEach(card => {
    const title = card.querySelector('.game-title').textContent.toLowerCase();
    const cardDiscount = parseInt(card.dataset.discount);
    const cardDownloads = parseInt(card.dataset.downloads);
    const cardRating = parseFloat(card.dataset.rating);
    const cardCategories = card.dataset.categories.split(',');
    
    const matchesSearch = title.includes(searchTerm);
    const matchesDiscount = !activeFilters.discount || cardDiscount >= activeFilters.discount;
    const matchesCategory = !activeFilters.category || cardCategories.includes(activeFilters.category);
    
    if (matchesSearch && matchesDiscount && matchesCategory) {
      card.style.display = 'flex';
      visibleCards.push(card);
    } else {
      card.style.display = 'none';
    }
  });
  
  if (sortValue !== 'default') {
    const container = document.querySelector('.search-container');
    visibleCards.sort((a, b) => {
      const priceA = parseFloat(a.querySelector('.final-price').textContent.replace('$', ''));
      const priceB = parseFloat(b.querySelector('.final-price').textContent.replace('$', ''));
      const discountA = parseInt(a.dataset.discount);
      const discountB = parseInt(b.dataset.discount);
      const downloadsA = parseInt(a.dataset.downloads);
      const downloadsB = parseInt(b.dataset.downloads);
      const ratingA = parseFloat(a.dataset.rating);
      const ratingB = parseFloat(b.dataset.rating);
      
      switch(sortValue) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'discount-desc':
          return discountB - discountA;
        case 'downloads-desc':
          return downloadsB - downloadsA;
        case 'downloads-asc':
          return downloadsA - downloadsB;
        case 'rating-desc':
          return ratingB - ratingA;
        case 'rating-asc':
          return ratingA - ratingB;
      }
    });
    
    visibleCards.forEach(card => container.appendChild(card));
  }
}

const modal = document.getElementById('gameModal');
const modalGameTitle = document.getElementById('modalGameTitle');
const steamLink = document.querySelector('.steam-link');
const closeModal = document.querySelector('.close-modal');



gameCards.forEach(card => {
  card.addEventListener('click', () => {
    const title = card.querySelector('.game-title').textContent;
    modalGameTitle.textContent = title;
    steamLink.href = gameLinks[title];
    modal.style.display = 'block';
  });
});

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Add new menu interaction JavaScript
const menuItems = document.querySelectorAll('.menu-item');
const submenuItems = document.querySelectorAll('.submenu-item');

menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    if (e.target === item) {
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
    }
  });
});

submenuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const menuCategory = e.target.parentElement.parentElement.textContent.trim();
    const selectedOption = e.target.textContent;
    console.log(`Selected ${selectedOption} from ${menuCategory}`);
  });
});


// 顯示登入彈窗
function showLoginModal() {
  document.getElementById('loginModal').classList.add('show');
}

// 關閉登入彈窗
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('show');
  document.getElementById('loginMessage').innerHTML = '';
}

// 顯示註冊彈窗
function showRegisterModal() {
  document.getElementById('registerModal').classList.add('show');
}

// 關閉註冊彈窗
function closeRegisterModal() {
  document.getElementById('registerModal').classList.remove('show');
  document.getElementById('registerMessage').innerHTML = '';
}

// 登入功能
async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
      const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      const messageDiv = document.getElementById('loginMessage');
      
      if (data.success) {
          messageDiv.className = 'success-message';
          messageDiv.textContent = data.message;
          document.getElementById('userInfo').textContent = `歡迎, ${data.user.username}!`;
          document.getElementById('logoutBtn').style.display = 'inline';
          setTimeout(closeLoginModal, 1000);
      } else {
          messageDiv.className = 'error-message';
          messageDiv.textContent = data.message;
      }
  } catch (error) {
      console.error('Error:', error);
  }
}

// 註冊功能
async function register() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
      const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      const messageDiv = document.getElementById('registerMessage');
      
      if (data.success) {
          messageDiv.className = 'success-message';
          messageDiv.textContent = data.message;
          setTimeout(() => {
              closeRegisterModal();
              showLoginModal();
          }, 1000);
      } else {
          messageDiv.className = 'error-message';
          messageDiv.textContent = data.message;
      }
  } catch (error) {
      console.error('Error:', error);
  }
}

// 登出功能
async function logout() {
  try {
      const response = await fetch('/api/logout', {
          method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
          document.getElementById('userInfo').textContent = '';
          document.getElementById('logoutBtn').style.display = 'none';
      }
  } catch (error) {
      console.error('Error:', error);
  }
}


// 獲取並顯示特價遊戲
async function loadGameDeals() {
  try {
      const response = await fetch('/api/games/deals');
      const data = await response.json();
      
      if (data.success) {
          const dealsContainer = document.getElementById('gameDeals');
          dealsContainer.innerHTML = data.deals.map(game => `
              <div class="game-card">
                  <div class="game-card-inner">
                      <div class="game-image">
                          <img src="${game.image_url}" alt="${game.title}">
                          <div class="game-hover">
                              <div class="game-description">
                                  <h3>${game.title}</h3>
                                  <div class="tags">
                                      <span class="tag">動作</span>
                                      <span class="tag">冒險</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div class="game-info">
                          <div class="price-block">
                              <div class="discount-badge">-${game.discount_percent}%</div>
                              <div class="price-info">
                                  <div class="original-price">NT$ ${game.original_price}</div>
                                  <div class="final-price">NT$ ${game.discount_price}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `).join('');
      }
  } catch (error) {
      console.error('Error loading deals:', error);
  }
}

// 頁面載入時獲取特價遊戲
document.addEventListener('DOMContentLoaded', loadGameDeals);
async function loadGameDeals() {
  try {
      const response = await fetch('/api/games/deals');
      const data = await response.json();
      
      if (data.success) {
          const dealsContainer = document.getElementById('gameDeals');
          dealsContainer.innerHTML = data.deals.map(game => `
              <div class="game-card" onclick="showGameDetails(${game.steam_appid}, '${game.title}')">
                  <div class="game-card-inner">
                      <div class="game-image">
                          <img src="${game.image_url}" alt="${game.title}">
                          <div class="game-hover">
                              <div class="game-description">
                                  <h3>${game.title}</h3>
                                  <div class="tags">
                                      <span class="tag">動作</span>
                                      <span class="tag">冒險</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div class="game-info">
                          <div class="price-block">
                              <div class="discount-badge">-${game.discount_percent}%</div>
                              <div class="price-info">
                                  <div class="original-price">NT$ ${game.original_price}</div>
                                  <div class="final-price">NT$ ${game.discount_price}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `).join('');
      }
  } catch (error) {
      console.error('Error loading deals:', error);
  }
}

function showGameDetails(appId, title) {
  const modal = document.getElementById('gameModal');
  const modalContent = document.getElementById('gameModalContent');
  
  modalContent.innerHTML = `
      <div class="game-details">
          <h2>${title}</h2>
          <div class="social-links">
              <a href="https://store.steampowered.com/app/${appId}" target="_blank" class="social-button steam-button">       //詭異bug裡面的連結式steam的連結但導向的卻是我自己的網頁
                  <i class="fab fa-steam"></i> 在 Steam 上查看
              </a>
              <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' gameplay')}" 
                 target="_blank" class="social-button youtube-button">
                  <i class="fab fa-youtube"></i> YouTube
              </a>
              <a href="https://www.twitch.tv/directory/game/${encodeURIComponent(title)}" 
                 target="_blank" class="social-button twitch-button">
                  <i class="fab fa-twitch"></i> Twitch
              </a>
              <a href="https://www.reddit.com/search/?q=${encodeURIComponent(title)}" 
                 target="_blank" class="social-button reddit-button">
                  <i class="fab fa-reddit"></i> Reddit
              </a>
          </div>
      </div>
  `;
  
  modal.style.display = "flex";
}

function closeGameModal() {
  document.getElementById('gameModal').style.display = "none";
}

// 點擊模態框外部關閉
window.onclick = function(event) {
  const modal = document.getElementById('gameModal');
  if (event.target == modal) {
      modal.style.display = "none";
  }
}

// 頁面載入時獲取特價遊戲
document.addEventListener('DOMContentLoaded', loadGameDeals);


// 檢查瀏覽器是否支援通知
function checkNotificationSupport() {
  if (!("Notification" in window)) {
      alert("此瀏覽器不支援通知功能");
      return false;
  }
  return true;
}

// 請求通知權限
function requestNotificationPermission() {
  if (!checkNotificationSupport()) return;

  Notification.requestPermission()
      .then(function(permission) {
          console.log('Notification permission:', permission); // 調試用
          updateNotificationButtons(permission);
          
          // 如果獲得權限，立即顯示測試按鈕
          if (permission === 'granted') {
              document.getElementById('testNotificationBtn').style.display = 'inline-block';
          }
      })
      .catch(function(error) {
          console.error('Error requesting permission:', error);
      });
}

// 更新按鈕狀態
function updateNotificationButtons(permission) {
  const notificationBtn = document.getElementById('notificationBtn');
  const testBtn = document.getElementById('testNotificationBtn');
  
  console.log('Updating buttons for permission:', permission); // 調試用
  
  if (permission === 'granted') {
      notificationBtn.innerHTML = '<i class="fas fa-bell"></i> 通知已開啟';
      notificationBtn.classList.add('active');
      testBtn.style.display = 'inline-block';
  } else {
      notificationBtn.innerHTML = '<i class="fas fa-bell"></i> 開啟通知';
      notificationBtn.classList.remove('active');
      testBtn.style.display = 'none';
  }
}

// 發送測試通知
function sendTestNotification() {
  console.log('Attempting to send notification...'); // 調試用
  
  if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted'); // 調試用
      return;
  }

  try {
      // 獲取第一個遊戲的資料
      const firstGame = document.querySelector('.game-card');
      if (!firstGame) {
          console.log('No game card found'); // 調試用
          return;
      }

      const title = firstGame.querySelector('h3').textContent;
      const image = firstGame.querySelector('img').src;
      const discount = firstGame.querySelector('.discount-badge').textContent;
      const price = firstGame.querySelector('.final-price').textContent;

      console.log('Creating notification with:', { title, image, discount, price }); // 調試用

      const notification = new Notification('Steam 遊戲特價通知', {
          body: `${title}\n${discount} ${price}`,
          icon: image,
          badge: image,
          image: image,
          requireInteraction: true // 通知會保持直到用戶互動
      });

      notification.onclick = function() {
          window.focus();
          notification.close();
      };

      console.log('Notification sent successfully'); // 調試用
  } catch (error) {
      console.error('Error sending notification:', error);
  }
}

// 初始化通知功能
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing notification system...'); // 調試用
  
  const notificationBtn = document.getElementById('notificationBtn');
  const testBtn = document.getElementById('testNotificationBtn');
  
  // 確保按鈕存在
  if (!notificationBtn || !testBtn) {
      console.error('Notification buttons not found');
      return;
  }
  
  notificationBtn.addEventListener('click', requestNotificationPermission);
  testBtn.addEventListener('click', sendTestNotification);
  
  // 檢查現有權限
  if (checkNotificationSupport()) {
      console.log('Current notification permission:', Notification.permission); // 調試用
      updateNotificationButtons(Notification.permission);
  }
});