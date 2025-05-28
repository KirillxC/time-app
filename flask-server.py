from threading import Thread
from flask import Flask, request, jsonify, send_from_directory
import telebot
from telebot import TeleBot
import os
import json
from datetime import datetime


app = Flask(__name__, static_folder='public')

token = os.environ.get("TOKEN") 
bot = TeleBot(token)

EVENTS_FILE = 'server/events.json'
USER_EVENTS_FILE = 'database/db.json'
WEB_APP_URL = "https://time-app-nu.vercel.app"  

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
    with open(EVENTS_PATH, 'r', encoding='utf-8') as f:
        events = json.load(f)
    return jsonify(events)

@app.route('/api/user-events', methods=['GET'])
def get_user_events():
    if not os.path.exists(USER_EVENTS_PATH):
        with open(USER_EVENTS_PATH, 'w') as f:
            json.dump([], f)
    with open(USER_EVENTS_PATH, 'r', encoding='utf-8') as f:
        user_events = json.load(f)
    return jsonify(user_events)

@app.route('/api/user-events', methods=['POST'])
def add_user_event():
    data = request.get_json()
    if not data.get('title') or not data.get('date'):
        return jsonify({"error": "Title and date are required"}), 400
    
    display = data.get('display', 'default')
    if display not in ['default', 'hidden', 'birthday']:
        return jsonify({"error": "Invalid display value"}), 400

    with open(USER_EVENTS_PATH, 'r', encoding='utf-8') as f:
        user_events = json.load(f)
    
    user_events.append({
        "title": data['title'],
        "date": data['date'],
        "display": display
    })
    
    with open(USER_EVENTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(user_events, f, ensure_ascii=False, indent=2)
    
    return jsonify({"message": "Event added"}), 201



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
