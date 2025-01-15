async function submitComment(event) {
    event.preventDefault();
    
    const content = document.getElementById('commentContent').value;
    const postId = window.location.pathname.split('/').pop();
    
    if (!content.trim()) {
        alert('評論內容不能為空');
        return;
    }
    
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post_id: postId,
                content: content
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // 清空評論框
            document.getElementById('commentContent').value = '';
            // 重新載入頁面以顯示新評論
            window.location.reload();
        } else {
            if (data.message === '請先登入') {
                window.location.href = '/login';
            } else {
                alert('評論失敗：' + data.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('評論失敗，請稍後再試');
    }
}

// 確保表單提交時調用我們的函數
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('commentForm');
    if (form) {
        form.addEventListener('submit', submitComment);
    }
}); 