from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

login_manager = LoginManager()
bcrypt = Bcrypt()
cors = CORS()
jwt = JWTManager()
mail = Mail()