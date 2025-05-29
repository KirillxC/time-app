from threading import Thread
from flask import Flask, request, jsonify, send_from_directory
import telebot
from telebot import TeleBot
import os
import json
from datetime import datetime
from dotenv import load_dotenv

app = Flask(__name__, static_folder='public')

load_dotenv()
token = os.environ.get("TOKEN") 
bot = TeleBot("token")

EVENTS_PATH = os.path.join(os.path.dirname(__file__), 'server/events.json')
USER_EVENTS_PATH = os.path.join(os.path.dirname(__file__), 'database/db.json')
WEB_APP_URL = "https://time-app-nu.vercel.app/"  

os.makedirs(os.path.dirname(EVENTS_PATH), exist_ok=True)
os.makedirs(os.path.dirname(USER_EVENTS_PATH), exist_ok=True)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = telebot.types.InlineKeyboardMarkup()
    btn = telebot.types.InlineKeyboardButton(
        text="Открыть Таймер Событий", 
        url=WEB_APP_URL
    )
    markup.add(btn)
    
    bot.send_message(
        message.chat.id,
        "Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение.",
        reply_markup=markup
    )

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        if not os.path.exists(EVENTS_PATH):
            with open(EVENTS_PATH, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        with open(EVENTS_PATH, 'r', encoding='utf-8') as f:
            events = json.load(f)
        return jsonify(events)
    except Exception as e:
        app.logger.error(f"Error loading events: {str(e)}")
        return jsonify({"error": "Failed to load events"}), 500

@app.route('/api/user-events', methods=['GET'])
def get_user_events():
    try:
        if not os.path.exists(USER_EVENTS_PATH):
            with open(USER_EVENTS_PATH, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        with open(USER_EVENTS_PATH, 'r', encoding='utf-8') as f:
            user_events = json.load(f)
        return jsonify(user_events)
    except Exception as e:
        app.logger.error(f"Error loading user events: {str(e)}")
        return jsonify({"error": "Failed to load user events"}), 500

@app.route('/api/user-events', methods=['POST'])
def add_user_event():
    try:
        data = request.get_json()
        if not data or not data.get('title') or not data.get('date'):
            return jsonify({"error": "Title and date are required"}), 400
        
        display = data.get('display', 'default')
        if display not in ['default', 'hidden', 'birthday']:
            return jsonify({"error": "Invalid display value"}), 400

        if os.path.exists(USER_EVENTS_PATH):
            with open(USER_EVENTS_PATH, 'r', encoding='utf-8') as f:
                user_events = json.load(f)
        else:
            user_events = []
            
        user_events.append({
            "title": data['title'],
            "date": data['date'],
            "display": display
        })
        
        with open(USER_EVENTS_PATH, 'w', encoding='utf-8') as f:
            json.dump(user_events, f, ensure_ascii=False, indent=2)
        
        return jsonify({"message": "Event added"}), 201
    except Exception as e:
        app.logger.error(f"Error adding user event: {str(e)}")
        return jsonify({"error": "Failed to add event"}), 500

def run_bot():
    bot.infinity_polling()

if __name__ == '__main__':
    Thread(target=run_bot).start()
    app.run(host='0.0.0.0', port=5000)
