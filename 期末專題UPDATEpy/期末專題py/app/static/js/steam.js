const searchBar = document.querySelector('.search-bar');
const gameCards = document.querySelectorAll('.game-card');
const tags = document.querySelectorAll('.tag');
const sortSelect = document.querySelector('.sort-select');
let searchTerm = '';
let activeFilters = {
  discount: null,
  category: null
};

// 搜尋功能
function performSearch() {
  searchTerm = document.getElementById('searchInput').value.toLowerCase();
  currentPage = 1; // 重置到第一頁
  filterAndDisplayGames();
}


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
function filterAndDisplayGames() {
  const startIndex = (currentPage - 1) * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  
  // 先過濾遊戲
  const filteredGames = allGames.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchTerm);
      const matchesPrice = (minPrice === null || game.discount_price >= minPrice) &&
                         (maxPrice === null || game.discount_price <= maxPrice);
      return matchesSearch && matchesPrice;
  });

  // 更新總頁數
  totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  
  // 獲取當前頁的遊戲
  const currentPageGames = filteredGames.slice(startIndex, endIndex);
  
  // 更新遊戲卡片顯示
  const gameCards = document.querySelectorAll('.game-card');
  gameCards.forEach(card => {
      const gameId = parseInt(card.getAttribute('data-game-id'));
      const shouldShow = currentPageGames.some(game => game.id === gameId);
      card.style.display = shouldShow ? 'block' : 'none';
  });
  
  // 更新分頁控制
  updatePaginationControls();
  
  // 如果沒有搜尋結果，顯示提示
  const noResultsMsg = document.getElementById('noResultsMessage');
  if (filteredGames.length === 0) {
      if (!noResultsMsg) {
          const msg = document.createElement('div');
          msg.id = 'noResultsMessage';
          msg.className = 'no-results';
          msg.textContent = '沒有找到符合的遊戲';
          document.querySelector('.game-container').appendChild(msg);
      }
  } else if (noResultsMsg) {
      noResultsMsg.remove();
  }
}
// 確保在輸入框按下 Enter 時也會觸發搜尋
document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
      performSearch();
  }
});


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
              <div class="game-card" onclick="showGameDetails(${game.id}, '${game.title}')">
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
              <a href="https://store.steampowered.com/app/${games.id}" target="_blank" class="social-button steam-button">       //詭異bug裡面的連結式steam的連結但導向的卻是我自己的網頁
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
async function sendTestNotification() {
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

       
  //以下是程式新增區

    const response =  fetch('/api/LineNotify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            discount: discount,
            price: price,
            imageUrl: image
        })
    });
    const result = await response.json();
    if (result.success) {
        console.log('Line notification sent successfully');
    } else {
        console.error('Failed to send Line notification:', result.message);
    }

//新增程式到這裡結束
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
const chat=document.getElementById('community-chat');
chat.addEventListener('click',()=>{
  window.location.href='/forum';
  alert('這是討論區');
});


// 更新 UI 函數
function updateUIForLoggedInUser(user) {
  console.log('Updating UI for logged in user:', user); // 調試用
  
  // 更新用戶信息顯示
  document.getElementById('userInfo').textContent = `歡迎, ${user.username}!`;
  
  // 隱藏登入註冊按鈕，顯示登出按鈕
  document.getElementById('logoutBtn').style.display = 'inline';
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('registerBtn').style.display = 'none';
  
  // 檢查並更新管理員按鈕
  const adminBtn = document.getElementById('adminBtn');
  console.log('User role:', user.role); // 調試用
  if (user.role === 'manager') {
      console.log('Showing admin button'); // 調試用
      adminBtn.style.display = 'inline-block';
      // 添加點擊事件
      adminBtn.onclick = function() {
          window.location.href = '/admin';
      };
  } else {
      console.log('Hiding admin button'); // 調試用
      adminBtn.style.display = 'none';
  }
}

// 更新未登入用戶的 UI
function updateUIForLoggedOutUser() {
  // 清空用戶信息
  document.getElementById('userInfo').textContent = '';
  
  // 顯示登入註冊按鈕，隱藏登出按鈕
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('loginBtn').style.display = 'inline';
  document.getElementById('registerBtn').style.display = 'inline';
  
  // 隱藏管理員按鈕
  document.getElementById('adminBtn').style.display = 'none';
}

// 檢查登入狀態
async function checkAuthStatus() {
  try {
      const response = await fetch('/api/check_auth');
      const data = await response.json();
      
      console.log('Auth check response:', data); // 調試用
      
      if (data.success) {
          updateUIForLoggedInUser(data.user);
      } else {
          updateUIForLoggedOutUser();
      }
  } catch (error) {
      console.error('Error checking auth status:', error);
      updateUIForLoggedOutUser();
  }
}

// 登入成功後的處理
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
          updateUIForLoggedInUser(data.user);
          setTimeout(closeLoginModal, 1000);
      } else {
          messageDiv.className = 'error-message';
          messageDiv.textContent = data.message;
      }
  } catch (error) {
      console.error('Error:', error);
  }
}

// 頁面載入時檢查登入狀態
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded, checking auth status'); // 調試用
  checkAuthStatus();
});

function showGameDetails(appId, title) {
  const modal = document.getElementById('gameModal');
  const modalContent = document.getElementById('gameModalContent');
  
  modalContent.innerHTML = `
      <div class="game-details">
          <h2>${title}</h2>
          <div class="social-links">
              <a href="https://store.steampowered.com/app/${appId}/${title}/" target="_blank" class="social-button steam-button">
                  <div class="platform-logo">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="steam-icon">
                          <path fill="currentColor" d="M395.5 177.5c0 33.8-27.5 61-61 61-33.8 0-61-27.3-61-61s27.3-61 61-61c33.5 0 61 27.2 61 61zm52.5.2c0 63-51 113.8-113.7 113.8L225 371.3c-4 43-40.5 76.8-84.5 76.8-40.5 0-74.7-28.8-83-67L0 358V250.7L97.2 290c15.1-9.2 32.2-13.3 52-11.5l71-101.7c.5-62.3 51.5-112.8 114-112.8C397 64 448 115 448 177.7zM203 363c0-34.7-27.8-62.5-62.5-62.5-4.5 0-9 .5-13.5 1.5l26 10.5c25.5 10.2 38 39 27.7 64.5-10.2 25.5-39 38-64.5 27.7-10.2-4-20.5-8.3-30.7-12.2 10.5 19.7 31.2 33 54.5 33 34.7 0 62.5-27.8 62.5-62.5zm207.5-185.3c0-42-34.3-76.2-76.2-76.2-42 0-76.2 34.2-76.2 76.2 0 42 34.2 76.2 76.2 76.2 42-.1 76.2-34.2 76.2-76.2z"/>
                      </svg>
                  </div>
                  在 Steam 上查看
              </a>
              <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' gameplay')}" 
                 target="_blank" class="social-button youtube-button">
                  <div class="platform-logo">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="youtube-icon">
                          <path fill="currentColor" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/>
                      </svg>
                  </div>
                  YouTube
              </a>
              <a href="https://www.twitch.tv/directory/game/${encodeURIComponent(title)}" 
                 target="_blank" class="social-button twitch-button">
                  <div class="platform-logo">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="twitch-icon">
                          <path fill="currentColor" d="M391.17,103.47H352.54v109.7h38.63ZM285,103H246.37V212.75H285ZM120.83,0,24.31,91.42V420.58H140.14V512l96.53-91.42h77.25L487.69,256V0M449.07,237.75l-77.22,73.12H294.61l-67.6,64v-64H140.14V36.58H449.07Z"/>
                      </svg>
                  </div>
                  Twitch
              </a>
              <a href="https://www.reddit.com/search/?q=${encodeURIComponent(title)}" 
                 target="_blank" class="social-button reddit-button">
                  <div class="platform-logo">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="reddit-icon">
                          <path fill="currentColor" d="M201.5 305.5c-13.8 0-24.9-11.1-24.9-24.6 0-13.8 11.1-24.9 24.9-24.9 13.6 0 24.6 11.1 24.6 24.9 0 13.6-11.1 24.6-24.6 24.6zM504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-132.3-41.2c-9.4 0-17.7 3.9-23.8 10-22.4-15.5-52.6-25.5-86.1-26.6l17.4-78.3 55.4 12.5c0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.3 24.9-24.9s-11.1-24.9-24.9-24.9c-9.7 0-18 5.8-22.1 13.8l-61.2-13.6c-3-.8-6.1 1.4-6.9 4.4l-19.1 86.4c-33.2 1.4-63.1 11.3-85.5 26.8-6.1-6.4-14.7-10.2-24.1-10.2-34.9 0-46.3 46.9-14.4 62.8-1.1 5-1.7 10.2-1.7 15.5 0 52.6 59.2 95.2 132 95.2 73.1 0 132.3-42.6 132.3-95.2 0-5.3-.6-10.8-1.9-15.8 31.3-16 19.8-62.5-14.9-62.5zM302.8 331c-18.2 18.2-76.1 17.9-93.6 0-2.2-2.2-6.1-2.2-8.3 0-2.5 2.5-2.5 6.4 0 8.6 22.8 22.8 87.3 22.8 110.2 0 2.5-2.2 2.5-6.1 0-8.6-2.2-2.2-6.1-2.2-8.3 0zm7.7-75c-13.6 0-24.6 11.1-24.6 24.9 0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.1 24.9-24.6 0-13.8-11-24.9-24.9-24.9z"/>
                      </svg>
                  </div>
                  Reddit
              </a>
          </div>
      </div>
  `;
  
  modal.style.display = "flex";
}

let currentPage = 1;
let totalPages = 1;
let currentSort = 'discount_desc';
let allGames = [];

async function loadAllGames() {
  try {
      const params = new URLSearchParams({
          sort: currentSort
      });
      
      const response = await fetch(`/api/games?${params}`);
      const data = await response.json();
      
      if (data.success) {
          allGames = data.games;
          totalPages = data.total_pages;
          
          // 更新總遊戲數顯示
          document.getElementById('totalGames').textContent = 
              `共 ${data.total_games} 個特價遊戲`;
          
          // 創建所有遊戲卡片
          const gamesContainer = document.getElementById('gamesContainer');
          gamesContainer.innerHTML = '';
          
          allGames.forEach(game => {
              const gameCard = document.createElement('div');
              gameCard.className = 'game-card';
              gameCard.dataset.gameId = game.id;
              
              // 預設顯示第一頁的遊戲 (ID 1-10)
              if (game.id <= 10) {
                  gameCard.style.display = 'block';
              } else {
                  gameCard.style.display = 'none';
              }
              
              gameCard.onclick = () => showGameDetails(game.id, game.title);
              
              const originalPrice = (game.original_price / 100).toFixed(0);
              const discountPrice = (game.discount_price / 100).toFixed(0);
              
              gameCard.innerHTML = `
                  <img src="${game.image_url}" alt="${game.title}">
                  <div class="game-info">
                      <h3>${game.title}</h3>
                      <div class="price-info">
                          <div class="discount">-${game.discount_percent}%</div>
                          <div class="prices">
                              <span class="original-price">NT$ ${originalPrice}</span>
                              <span class="discount-price">NT$ ${discountPrice}</span>
                          </div>
                      </div>
                      <div class="view-count">
                          <i class="fas fa-eye"></i> ${game.view_count || 0}
                      </div>
                      <div class="game-id">ID: ${game.id}</div>
                  </div>
              `;
              
              gamesContainer.appendChild(gameCard);
          });
          
          // 更新分頁控制
          updatePaginationControls();
      }
  } catch (error) {
      console.error('Error loading games:', error);
  }
}

function showPage(page) {
  currentPage = page;
  const startId = (page - 1) * 10 + 1;
  const endId = page * 10;
  
  // 更新所有遊戲卡片的顯示狀態
  const allCards = document.querySelectorAll('.game-card');
  allCards.forEach(card => {
      const gameId = parseInt(card.dataset.gameId);
      if (gameId >= startId && gameId <= endId) {
          card.style.display = 'block';
      } else {
          card.style.display = 'none';
      }
  });
  
  // 更新分頁控制
  updatePaginationControls();
}

function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
      showPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updatePaginationControls() {
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
  
  const startId = (currentPage - 1) * 10 + 1;
  const endId = currentPage * 10;
  pageInfo.textContent = `第 ${currentPage} 頁 (ID: ${startId}-${endId})，共 ${totalPages} 頁`;
}

// 排序功能
async function applySorting() {
  const sortSelect = document.getElementById('sortSelect');
  currentSort = sortSelect.value;
  currentPage = 1;
  await loadAllGames();  // 重新載入所有遊戲並顯示第一頁
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
  const sortSelect = document.getElementById('sortSelect');
  sortSelect.value = currentSort;
  loadAllGames();
});

/**
 * 搜尋遊戲功能
 * @param {Event} event - 輸入事件對象
 * 當用戶在搜尋框輸入時觸發，根據輸入內容過濾遊戲列表
 */
function searchGames(event) {
    const searchTerm = event.target.value.toLowerCase();
    try {
        currentGames = allGames.filter(game => 
            game.title.toLowerCase().includes(searchTerm)
        );
        displayGames(currentGames);
        updateTotalGames(currentGames.length);
    } catch (error) {
        console.error('搜尋遊戲時發生錯誤：', error);
    }
}

/**
 * 根據折扣率過濾遊戲
 * @param {number|null} discountPercent - 折扣百分比
 * 過濾出大於等於指定折扣率的遊戲
 */
function filterByDiscount(discountPercent) {
    try {
        if (!discountPercent) {
            currentGames = [...allGames];
        } else {
            currentGames = allGames.filter(game => 
                game.discount_percent >= parseInt(discountPercent)
            );
        }
        displayGames(currentGames);
        updateTotalGames(currentGames.length);
    } catch (error) {
        console.error('過濾折扣遊戲時發生錯誤：', error);
    }
}

/**
 * 遊戲排序功能
 * 根據選擇的排序方式對遊戲列表進行排序
 */
function sortGames() {
    try {
        const sortType = document.getElementById('sortSelect').value;
        
        switch(sortType) {
            case 'price-asc':
                currentGames.sort((a, b) => a.discount_price - b.discount_price);
                break;
            case 'price-desc':
                currentGames.sort((a, b) => b.discount_price - a.discount_price);
                break;
            case 'discount-desc':
                currentGames.sort((a, b) => b.discount_percent - a.discount_percent);
                break;
            default:
                // 默認排序，恢復原始順序
                currentGames = [...allGames];
        }
        
        displayGames(currentGames);
    } catch (error) {
        console.error('排序遊戲時發生錯誤：', error);
    }
}

/**
 * 初始化頁面事件監聽器
 * 在頁面加載完成後設置所有必要的事件監聽器
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 添加搜尋框事件監聽
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', searchGames);
        } else {
            console.warn('找不到搜尋輸入框元素');
        }
        
        // 添加排序選擇事件監聽
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', sortGames);
        } else {
            console.warn('找不到排序選擇元素');
        }
        
        // 添加折扣標籤事件監聽
        const discountTags = document.querySelectorAll('.tag[data-discount]');
        if (discountTags.length > 0) {
            discountTags.forEach(tag => {
                tag.addEventListener('click', function() {
                    // 移除其他標籤的活動狀態
                    discountTags.forEach(t => t.classList.remove('active'));
                    
                    if (this.classList.contains('active')) {
                        // 如果點擊已激活的標籤，取消過濾
                        this.classList.remove('active');
                        filterByDiscount(null);
                    } else {
                        // 激活點擊的標籤並過濾
                        this.classList.add('active');
                        const discount = this.getAttribute('data-discount');
                        filterByDiscount(discount);
                    }
                });
            });
        } else {
            console.warn('找不到折扣標籤元素');
        }
    } catch (error) {
        console.error('初始化頁面時發生錯誤：', error);
        alert('頁面初始化失敗，請重新整理頁面');
    }
});

// CSS 樣式定義
const style = document.createElement('style');
style.textContent = `
    /* 折扣標籤的基本樣式 */
    .tag {
        cursor: pointer;
        padding: 5px 10px;
        margin: 5px;
        border-radius: 3px;
        background-color: #2a475e;
        color: #66c0f4;
        transition: all 0.3s ease;
    }
    
    /* 滑鼠懸停效果 */
    .tag:hover {
        background-color: #66c0f4;
        color: #1b2838;
    }
    
    /* 選中狀態樣式 */
    .tag.active {
        background-color: #66c0f4;
        color: #1b2838;
    }
`;
document.head.appendChild(style);

