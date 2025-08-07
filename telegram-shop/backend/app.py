from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

# Загрузка данных о товарах
with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

@app.route('/')
def home():
    return "Telegram Shop Backend"

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products)

@app.route('/api/init-data', methods=['GET'])
def init_data():
    # Данные для инициализации WebApp
    init_data = {
        "user": {
            "id": request.args.get('user_id', ''),
            "username": request.args.get('username', ''),
            "language_code": request.args.get('language_code', 'en')
        },
        "products": products
    }
    return jsonify(init_data)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)