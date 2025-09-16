"""Type stubs for Flask extensions"""
from typing import Any
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager

__all__ = ['db', 'migrate', 'cors', 'bcrypt', 'login_manager', 'jwt']

db: SQLAlchemy = SQLAlchemy()
migrate: Migrate = Migrate()
cors: CORS = CORS()
bcrypt: Bcrypt = Bcrypt()
login_manager: LoginManager = LoginManager()
jwt: JWTManager = JWTManager()