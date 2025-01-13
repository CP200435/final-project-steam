from flask import Flask, render_template, request, jsonify, session ,Blueprint, redirect, url_for
from models import User, Game, Message
from extensions import db
from functools import wraps
from steam_api import fetch_steam_deals, get_deals
from math import ceil

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
    return render_template('steam.html', user=user)

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
def get_all_games():
    page = request.args.get('page', 1, type=int)
    per_page = 10  # 每頁顯示10個遊戲
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
    
    # 計算總遊戲數和總頁數
    total_games = query.count()
    total_pages = ceil(total_games / per_page)
    
    # 獲取當前頁的遊戲
    games = query.offset((page - 1) * per_page).limit(per_page).all()
    
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
        } for game in games],
        'current_page': page,
        'total_pages': total_pages,
        'total_games': total_games
    })

@main.route('/api/game/view/<int:game_id>', methods=['POST'])
def increment_view_count(game_id):
    game = Game.query.get_or_404(game_id)
    game.view_count += 1
    db.session.commit()
    return jsonify({'success': True, 'view_count': game.view_count})

