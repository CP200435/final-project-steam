from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
from datetime import datetime
from werkzeug.security import generate_password_hash
from models import Game
# 創建 Flask 應用
app = Flask(__name__)
app.config.from_object(Config)

# 初始化資料庫
db = SQLAlchemy(app)

# 定義模型
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    push_subscription =db.Column(db.Text , nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_manager(self):
        return self.role == 'manager'

class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    steam_appid = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    original_price = db.Column(db.Integer)
    discount_price = db.Column(db.Integer)
    discount_percent = db.Column(db.Integer)
    image_url = db.Column(db.String(500))
    release_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    view_count = db.Column(db.Integer, default=0)


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    username = db.Column(db.String(100))
    email = db.Column(db.String(120))
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'subject': self.subject,
            'message': self.message,
            'username': self.username,
            'email': self.email
        }

def init_db():
    with app.app_context():
        # 創建所有表
        db.create_all()
        print("資料表創建成功！")

        # 創建一個預設管理員帳號
        admin_exists = User.query.filter_by(username='admin').first()
        if not admin_exists:
            admin = User(
                username='admin',
                email='admin@example.com',
                role='manager'
            )
            admin.password_hash = generate_password_hash('admin123')
            db.session.add(admin)
            db.session.commit()
            print("預設管理員帳號創建成功！")
            print("帳號: admin")
            print("密碼: admin123")
        else:
            print("管理員帳號已存在")

if __name__ == "__main__":
    try:
        init_db()
        print("資料庫初始化完成！")
    except Exception as e:
        print(f"發生錯誤: {str(e)}")