from chatterbot import ChatBot
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080"],  # React dev server
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

bot = ChatBot("chatbot",
    storage_adapter="chatterbot.storage.SQLStorageAdapter",
    database_uri="sqlite:///database.sqlite3",
    read_only=True,
    logic_adapters=[
        {
            "import_path": "chatterbot.logic.BestMatch",
            "default_response": "Sorry, I don't understand that.",
            "max_similarity_threshold": 0.9
        }
    ]
)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get")  # Add this endpoint for browser testing
def get_bot_response_get():
    user_text = request.args.get('msg')
    response = str(bot.get_response(user_text))
    return jsonify({"response": response})

@app.route("/api/chat", methods=["POST"])

def get_bot_response():
    data = request.get_json()
    user_text = data.get('message')
    response = str(bot.get_response(user_text))
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(port=5001)
