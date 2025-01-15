import requests
import time
from bs4 import BeautifulSoup
from models import Game
from extensions import db
from datetime import datetime

def fetch_steam_deals():
    # Steam Featured API
    url = "https://store.steampowered.com/api/featuredcategories"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        # 獲取特價遊戲列表
        specials = data.get('specials', {}).get('items', [])
        
        for item in specials:
            # 檢查遊戲是否已存在
            game = Game.query.filter_by(steam_appid=item['id']).first()
            
            if not game:
                game = Game(
                    steam_appid=item['id'],
                    title=item['name'],
                    original_price=item['original_price'] / 100,  # Steam 價格以分為單位
                    discount_price=item['final_price'] / 100,
                    discount_percent=item['discount_percent'],
                    image_url=item['large_capsule_image']
                )
                db.session.add(game)
            else:
                # 更新現有遊戲資訊
                game.discount_price = item['final_price'] / 100
                game.discount_percent = item['discount_percent']
            
        db.session.commit()
        return True
        
    except Exception as e:
        print(f"Error fetching Steam deals: {str(e)}")
        db.session.rollback()
        return False

def get_deals():
    return Game.query.filter(Game.discount_percent > 0).order_by(Game.discount_percent.desc()).all() 

def get_all_sale_games():
    all_games = []
    page = 1
    
    while True:
        url = f'https://store.steampowered.com/search/results'
        params = {
            'query': '',
            'start': (page - 1) * 50,  # Steam 搜索頁面每頁 50 個遊戲
            'count': 50,
            'specials': 1,  # 只顯示特價遊戲
            'infinite': 1,
            'cc': 'tw',     # 台灣地區
            'l': 'tchinese' # 繁體中文
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if not data.get('results_html'):
                break
                
            # 解析返回的 HTML
            soup = BeautifulSoup(data['results_html'], 'html.parser')
            game_elements = soup.find_all('a', class_='search_result_row')
            
            if not game_elements:
                break
                
            for game in game_elements:
                app_id = game['data-ds-appid']
                
                # 獲取遊戲詳細信息
                game_details = get_game_details(app_id)
                if game_details:
                    all_games.append(game_details)
            
            # 檢查是否還有更多頁面
            if len(game_elements) < 50:
                break
                
            page += 1
            time.sleep(1)  # 避免請求過於頻繁
            
        except Exception as e:
            print(f"Error fetching games list on page {page}: {e}")
            break
    
    return all_games

def get_game_details(app_id):
    url = f'https://store.steampowered.com/api/appdetails'
    params = {
        'appids': app_id,
        'cc': 'tw',
        'l': 'tchinese'
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data[str(app_id)]['success']:
            game_data = data[str(app_id)]['data']
            
            # 確保遊戲有價格信息且正在特價
            if 'price_overview' in game_data and game_data['price_overview']['discount_percent'] > 0:
                return {
                    'title': game_data['name'],
                    'steam_appid': int(app_id),
                    'original_price': game_data['price_overview']['initial'],
                    'discount_price': game_data['price_overview']['final'],
                    'discount_percent': game_data['price_overview']['discount_percent'],
                    'image_url': game_data.get('header_image', '')
                }
                
        return None
        
    except Exception as e:
        print(f"Error fetching details for game {app_id}: {e}")
        return None

def update_games_database():
    """更新數據庫中的遊戲信息"""
    from app.models import Game, db
    
    new_games = get_all_sale_games()
    updated_count = 0
    added_count = 0
    
    for game_data in new_games:
        existing_game = Game.query.filter_by(steam_appid=game_data['steam_appid']).first()
        
        if existing_game:
            # 更新現有遊戲信息
            existing_game.title = game_data['title']
            existing_game.original_price = game_data['original_price']
            existing_game.discount_price = game_data['discount_price']
            existing_game.discount_percent = game_data['discount_percent']
            existing_game.image_url = game_data['image_url']
            updated_count += 1
        else:
            # 添加新遊戲
            new_game = Game(
                title=game_data['title'],
                steam_appid=game_data['steam_appid'],
                original_price=game_data['original_price'],
                discount_price=game_data['discount_price'],
                discount_percent=game_data['discount_percent'],
                image_url=game_data['image_url'],
                view_count=0
            )
            db.session.add(new_game)
            added_count += 1
    
    try:
        db.session.commit()
        print(f"Updated {updated_count} games, Added {added_count} new games")
    except Exception as e:
        db.session.rollback()
        print(f"Error updating database: {e}") 
