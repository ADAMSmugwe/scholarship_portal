"""Type stubs for Flask extensions"""
from typing import Any
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_caching import Cache

__all__ = ['db', 'migrate', 'cors', 'bcrypt', 'login_manager', 'jwt', 'mail', 'cache']

db: SQLAlchemy = SQLAlchemy()
migrate: Migrate = Migrate()
cors: CORS = CORS()
bcrypt: Bcrypt = Bcrypt()
login_manager: LoginManager = LoginManager()
jwt: JWTManager = JWTManager()
mail: Mail = Mail()
cache: Cache = Cache()