from flask import Flask ,Blueprint
from config import Config
from extensions import db
import routes
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # 設置更安全的 session cookie
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # session 保持7天
    app.secret_key = 'your-secret-key-here'  # 請更換為更安全的密鑰
    
    # 初始化 db
    db.init_app(app)
    
    # 註冊藍圖
    app.register_blueprint(routes.main)
    
    return app

app = create_app()

# 確保在應用上下文中創建所有表
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
