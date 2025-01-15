function showCreatePostModal() {
    document.getElementById('createPostModal').style.display = 'block';
}

function closeCreatePostModal() {
    document.getElementById('createPostModal').style.display = 'none';
}

async function submitPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const gameId = document.getElementById('gameSelect').value;
    const content = document.getElementById('postContent').value;
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                game_id: gameId,
                content
            })
        });
        
        const data = await response.json();
        if (data.success) {
            window.location.reload();
        } else {
            if (data.message === '請先登入') {
                window.location.href = '/login';
            } else {
                alert('發文失敗：' + data.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('發文失敗，請稍後再試');
    }
}

function searchPosts() {
    const searchTerm = document.getElementById('searchInput').value;
    window.location.href = `/forum?search=${encodeURIComponent(searchTerm)}`;
}

function sortPosts() {
    const sortBy = document.getElementById('sortSelect').value;
    window.location.href = `/forum?sort=${sortBy}`;
}

// 點擊模態框外部時關閉
window.onclick = function(event) {
    if (event.target == document.getElementById('createPostModal')) {
        closeCreatePostModal();
    }
} 