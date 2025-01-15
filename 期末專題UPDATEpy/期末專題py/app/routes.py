from flask import Flask, render_template, request, jsonify, session ,Blueprint, redirect, url_for
from models import User, Game, Message, Post, Comment
from extensions import db
from functools import wraps
from steam_api import fetch_steam_deals, get_deals
from math import ceil
from flask_login import current_user, login_required
from datetime import datetime
import requests
main = Blueprint('main', __name__)

# 檢查登入狀態的裝飾器
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'})
        return f(*args, **kwargs)
    return decorated_function

# 檢查管理員權限的裝飾器
def manager_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('main.index'))
        
        user = User.query.get(session['user_id'])
        if not user or user.role != 'manager':
            return redirect(url_for('main.index'))
            
        return f(*args, **kwargs)
    return decorated_function

@main.route('/')
def index():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    search = request.args.get('search', '')
    sort = request.args.get('sort', 'discount_desc')
    page = request.args.get('page', 1, type=int)
    
    # 建立基本查詢
    query = Game.query
    
    # 如果有搜尋關鍵字
    if search:
        query = query.filter(Game.title.ilike(f'%{search}%'))
    
    # 排序
    if sort == 'discount_desc':
        query = query.order_by(Game.discount_percent.desc())
    elif sort == 'price_asc':
        query = query.order_by(Game.discount_price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Game.discount_price.desc())
    
    # 分頁
    pagination = query.paginate(page=page, per_page=10, error_out=False)
    games = pagination.items
    total_games = query.count()
    
    return render_template('steam.html', 
                         user=user,
                         games=games,
                         pagination=pagination,
                         total_games=total_games,
                         current_sort=sort,
                         search_query=search)

@main.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'username': user.username,
                    'role': user.role
                }
            })
    return jsonify({'success': False})

@main.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    user_exists = User.query.filter_by(username=data.get('username')).first()
    email_exists = User.query.filter_by(email=data.get('email')).first()
    
    if user_exists:
        return jsonify({'success': False, 'message': '用戶名已被使用'})
    if email_exists:
        return jsonify({'success': False, 'message': '郵箱已被使用'})
    
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        role='user'  # 預設為普通用戶
    )
    new_user.set_password(data.get('password'))
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'success': True, 'message': '註冊成功！'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '註冊失敗，請稍後再試'})

@main.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    
    if user and user.check_password(data.get('password')):
        session.permanent = True  # 設置為永久 session
        session['user_id'] = user.id
        return jsonify({
            'success': True,
            'message': '登入成功！',
            'user': {
                'username': user.username,
                'role': user.role
            }
        })
    return jsonify({'success': False, 'message': '用戶名或密碼錯誤'})

@main.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True, 'message': '已登出'}) 

@main.route('/api/games/deals')
def get_game_deals():
    # 更新特價遊戲資料
    fetch_steam_deals()
    
    # 獲取特價遊戲列表
    deals = get_deals()
    
    return jsonify({
        'success': True,
        'deals': [{
            'id': game.id,
            'title': game.title,
            'original_price': game.original_price,
            'discount_price': game.discount_price,
            'discount_percent': game.discount_percent,
            'image_url': game.image_url
        } for game in deals]
    }) 

# 管理頁面路由
@main.route('/admin')
@manager_required
def admin():
    return render_template('admin.html')

# 管理 API 路由
@main.route('/api/admin/users', methods=['GET'])
@manager_required
def get_users():
    users = User.query.all()
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        } for user in users]
    })

@main.route('/api/admin/users', methods=['POST'])
@manager_required
def add_user():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'success': False, 'message': '用戶名已存在'})
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': '郵箱已存在'})
    
    user = User(
        username=data['username'],
        email=data['email'],
        role=data['role']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': '用戶創建成功'})

@main.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@manager_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if data.get('username') != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'success': False, 'message': '用戶名已存在'})
    
    if data.get('email') != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': '郵箱已存在'})
    
    user.username = data['username']
    user.email = data['email']
    user.role = data['role']
    
    if data.get('password'):
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify({'success': True, 'message': '用戶更新成功'})

@main.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@manager_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': '用戶刪除成功'})

@main.route('/api/admin/games', methods=['GET'])
@manager_required
def get_games():
    games = Game.query.all()
    return jsonify({
        'games': [{
            'id': game.id,
            'steam_appid': game.steam_appid,
            'title': game.title,
            'original_price': game.original_price,
            'discount_price': game.discount_price,
            'discount_percent': game.discount_percent,
            'image_url': game.image_url
        } for game in games]
    })

@main.route('/api/admin/games', methods=['POST'])
@manager_required
def add_game():
    data = request.get_json()
    
    if Game.query.filter_by(steam_appid=data['steam_appid']).first():
        return jsonify({'success': False, 'message': '遊戲已存在'})
    
    game = Game(
        steam_appid=data['steam_appid'],
        title=data['title'],
        original_price=data['original_price'],
        discount_price=data['discount_price'],
        discount_percent=data['discount_percent'],
        image_url=data['image_url']
    )
    
    db.session.add(game)
    db.session.commit()
    
    return jsonify({'success': True, 'message': '遊戲添加成功'})

@main.route('/api/admin/games/<int:game_id>', methods=['PUT'])
@manager_required
def update_game(game_id):
    game = Game.query.get_or_404(game_id)
    data = request.get_json()
    
    game.title = data['title']
    game.steam_appid = data['steam_appid']
    game.original_price = data['original_price']
    game.discount_price = data['discount_price']
    game.discount_percent = data['discount_percent']
    game.image_url = data['image_url']
    
    db.session.commit()
    return jsonify({'success': True, 'message': '遊戲更新成功'})

@main.route('/api/admin/games/<int:game_id>', methods=['DELETE'])
@manager_required
def delete_game(game_id):
    game = Game.query.get_or_404(game_id)
    db.session.delete(game)
    db.session.commit()
    return jsonify({'success': True, 'message': '遊戲刪除成功'})

@main.route('/contact')
def contact():
    return render_template('contact.html')

@main.route('/api/send-message', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    user = User.query.get(session['user_id'])
    
    message = Message(
        subject=data.get('subject'),
        message=data.get('message'),
        username=user.username,
        email=user.email
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({'success': True, 'message': '訊息已送出'})

@main.route('/api/admin/messages')
@manager_required
def get_messages():
    messages = Message.query.order_by(Message.timestamp.desc()).all()
    return jsonify({
        'success': True,
        'messages': [message.to_dict() for message in messages]
    })

@main.route('/api/games')
def get_games_list():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    sort = request.args.get('sort', 'discount_desc')
    
    query = Game.query

    # 處理排序邏輯
    if sort == 'discount_desc':
        query = query.order_by(Game.discount_percent.desc())
    elif sort == 'discount_asc':
        query = query.order_by(Game.discount_percent.asc())
    elif sort == 'price_desc':
        query = query.order_by(Game.discount_price.desc())
    elif sort == 'price_asc':
        query = query.order_by(Game.discount_price.asc())
    elif sort == 'title_asc':
        query = query.order_by(Game.title.asc())
    elif sort == 'title_desc':
        query = query.order_by(Game.title.desc())
    elif sort == 'views_desc':
        query = query.order_by(Game.view_count.desc())
    
    # 獲取分頁數據
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    total_pages = ceil(query.count() / per_page)
    
    return jsonify({
        'success': True,
        'games': [{
            'id': game.id,
            'title': game.title,
            'steam_appid': game.steam_appid,
            'original_price': game.original_price,
            'discount_price': game.discount_price,
            'discount_percent': game.discount_percent,
            'image_url': game.image_url,
            'view_count': game.view_count
        } for game in pagination.items],
        'current_page': page,
        'total_pages': total_pages
    })

@main.route('/api/game/view/<int:game_id>', methods=['POST'])
def increment_view_count(game_id):
    game = Game.query.get_or_404(game_id)
    game.view_count += 1
    db.session.commit()
    return jsonify({'success': True, 'view_count': game.view_count})

@main.route('/forum')
def forum():
    # 檢查用戶是否登入
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    sort = request.args.get('sort', 'newest')
    
    query = Post.query
    
    # 搜尋
    if search:
        query = query.filter(Post.title.ilike(f'%{search}%'))
    
    # 排序
    if sort == 'newest':
        query = query.order_by(Post.created_at.desc())
    elif sort == 'most_comments':
        query = query.join(Comment).group_by(Post.id).order_by(db.func.count(Comment.id).desc())
    elif sort == 'most_views':
        query = query.order_by(Post.views.desc())
    
    # 分頁
    pagination = query.paginate(page=page, per_page=10, error_out=False)
    posts = pagination.items
    
    # 獲取所有遊戲用於發文選擇
    games = Game.query.all()
    
    return render_template('forum.html', 
                         posts=posts, 
                         pagination=pagination,
                         games=games,
                         user=user)  # 傳遞用戶資訊到模板

@main.route('/api/posts', methods=['POST'])
def create_post():
    # 檢查用戶是否登入
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '請先登入'})
    
    user_id = session.get('user_id')
    data = request.get_json()
    
    if not data.get('title') or not data.get('content') or not data.get('game_id'):
        return jsonify({'success': False, 'message': '所有欄位都是必填的'})
    
    try:
        post = Post(
            title=data['title'],
            content=data['content'],
            game_id=data['game_id'],
            user_id=user_id
        )
        db.session.add(post)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@main.route('/post/<int:post_id>')
def view_post(post_id):
    if 'user_id' not in session:
        return redirect(url_for('main.login'))
    
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    post = Post.query.get_or_404(post_id)
    # 增加觀看次數
    post.views = (post.views or 0) + 1
    db.session.commit()
    
    # 獲取所有評論並按時間倒序排序
    comments = Comment.query.filter_by(post_id=post_id)\
                          .order_by(Comment.created_at.desc())\
                          .all()
    
    return render_template('post_detail.html', 
                         post=post, 
                         comments=comments,
                         user=user)

@main.route('/api/comments', methods=['POST'])
def create_comment():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '請先登入'})
    
    user_id = session.get('user_id')
    data = request.get_json()
    
    if not data.get('content') or not data.get('post_id'):
        return jsonify({'success': False, 'message': '評論內容不能為空'})
    
    try:
        # 確保 post_id 是整數
        post_id = int(data['post_id'])
        # 檢查文章是否存在
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'success': False, 'message': '文章不存在'})
            
        comment = Comment(
            content=data['content'],
            post_id=post_id,
            user_id=user_id
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Error creating comment: {str(e)}")  # 添加錯誤日誌
        return jsonify({'success': False, 'message': str(e)})

@main.route('/api/LineNotify',methods=['post'] )
def send_line_notify():
    data = request.get_json()
    title = data.get('title')
    discount = data.get('discount')
    price = data.get('price')
    image_url = data.get('imageUrl')

        # 驗證必要資料
    if not all([title, discount, price]):
        return jsonify({
            'success': False,
            'message': '缺少必要的遊戲資訊'
        }), 400

    
    line_token = "ZfewZq1jRVRcdPdRTvAHw2dhPGdZRkOl0yBGWlCBw2w"
    url = "https://notify-api.line.me/api/notify"
    
    message = f"""
            🎮 Steam 遊戲特價通知！

            遊戲名稱：{title}
            折扣：{discount}
            特價：{price}

            查看遊戲圖片：{image_url}
            """
    headers = {"Authorization": f"Bearer {line_token}"}
    data = {"message": message ,  'imageFullsize': image_url,'imageThumbnail': image_url}
    response = requests.post(url, headers=headers, data=data)
    if response.status_code == 200:
        return jsonify({
            'success':True ,
            'message':'Line Notify 發送成功！'
            })
    else:
        return jsonify({
            'success':False, 
            'message':f"發送失敗，錯誤代碼：{response.status_code},原因：{response.text}"
            })




