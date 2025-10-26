import os
import datetime
from flask import Flask
from flask_restful import Api
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

# --- Load environment variables (.env must exist in the same directory) ---
load_dotenv()

# --- Import your models and routes ---
from app.models import db
from app.routes import initialize_routes

# --- Flask App Initialization ---
app = Flask(__name__)

# --- Database Configuration ---
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'main.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- JWT Configuration ---
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-key-12345')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']

# --- Initialize Extensions ---
CORS(app)
db.init_app(app)
migrate = Migrate(app, db)
api = Api(app, prefix="/api")
jwt = JWTManager(app)

# --- Ensure instance folder exists ---
instance_folder = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance')
if not os.path.exists(instance_folder):
    os.makedirs(instance_folder)

# --- Load All API Routes ---
initialize_routes(api)

# --- Root Test Route ---
@app.route('/')
def hello():
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return "✅ Backend running. GROQ_API_KEY loaded successfully."
    else:
        return "⚠️ Backend running, but GROQ_API_KEY not found in .env file."

# --- Run the App ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

