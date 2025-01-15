// 頁籤切換功能
function showTab(tabName) {
    // 隱藏所有頁籤內容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 取消所有頁籤按鈕的活動狀態
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // 顯示選中的頁籤內容
    document.getElementById(tabName).classList.add('active');
    // 設置選中的頁籤按鈕為活動狀態
    event.target.classList.add('active');
    
    // 載入對應的數據
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'games') {
        loadGames();
    }
}

// 載入用戶數據
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        const table = document.getElementById('usersTable');
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>用戶名</th>
                        <th>郵箱</th>
                        <th>角色</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>
                                <button class="action-button" onclick="editUser(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-button" onclick="deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// 載入遊戲數據
async function loadGames() {
    try {
        const response = await fetch('/api/admin/games');
        const data = await response.json();
        
        const table = document.getElementById('gamesTable');
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>遊戲名稱</th>
                        <th>Steam AppID</th>
                        <th>原價</th>
                        <th>折扣價</th>
                        <th>折扣比例</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.games.map(game => `
                        <tr>
                            <td>${game.id}</td>
                            <td>${game.title}</td>
                            <td>${game.steam_appid}</td>
                            <td>${game.original_price}</td>
                            <td>${game.discount_price}</td>
                            <td>${game.discount_percent}%</td>
                            <td>
                                <button class="action-button" onclick="editGame(${JSON.stringify(game).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-button" onclick="deleteGame(${game.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// 用戶相關操作
function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = '新增用戶';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModal').style.display = 'block';
}

function editUser(user) {
    document.getElementById('userModalTitle').textContent = '編輯用戶';
    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    document.getElementById('role').value = user.role;
    document.getElementById('password').value = '';
    document.getElementById('userModal').style.display = 'block';
}

async function deleteUser(userId) {
    if (!confirm('確定要刪除此用戶嗎？')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            loadUsers();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

// 遊戲相關操作
function showAddGameModal() {
    document.getElementById('gameModalTitle').textContent = '新增遊戲';
    document.getElementById('gameForm').reset();
    document.getElementById('gameId').value = '';
    document.getElementById('gameModal').style.display = 'block';
}

function editGame(game) {
    document.getElementById('gameModalTitle').textContent = '編輯遊戲';
    document.getElementById('gameId').value = game.id;
    document.getElementById('gameTitle').value = game.title;
    document.getElementById('steamAppId').value = game.steam_appid;
    document.getElementById('originalPrice').value = game.original_price;
    document.getElementById('discountPrice').value = game.discount_price;
    document.getElementById('discountPercent').value = game.discount_percent;
    document.getElementById('imageUrl').value = game.image_url;
    document.getElementById('gameModal').style.display = 'block';
}

async function deleteGame(gameId) {
    if (!confirm('確定要刪除此遊戲嗎？')) return;
    
    try {
        const response = await fetch(`/api/admin/games/${gameId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            loadGames();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting game:', error);
    }
}

// 表單提交處理
document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        password: document.getElementById('password').value
    };
    
    try {
        const url = userId ? 
            `/api/admin/users/${userId}` : 
            '/api/admin/users';
            
        const response = await fetch(url, {
            method: userId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeUserModal();
            loadUsers();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error saving user:', error);
    }
});

document.getElementById('gameForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const gameId = document.getElementById('gameId').value;
    const gameData = {
        title: document.getElementById('gameTitle').value,
        steam_appid: document.getElementById('steamAppId').value,
        original_price: document.getElementById('originalPrice').value,
        discount_price: document.getElementById('discountPrice').value,
        discount_percent: document.getElementById('discountPercent').value,
        image_url: document.getElementById('imageUrl').value
    };
    
    try {
        const url = gameId ? 
            `/api/admin/games/${gameId}` : 
            '/api/admin/games';
            
        const response = await fetch(url, {
            method: gameId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeGameModal();
            loadGames();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error saving game:', error);
    }
});

// 關閉模態框
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function closeGameModal() {
    document.getElementById('gameModal').style.display = 'none';
}

// 初始化：載入用戶數據
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
}); 