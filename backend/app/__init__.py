from flask import Flask, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from datetime import timedelta
import logging

load_dotenv()

Base = declarative_base()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # ============================================================================
    # CONFIG
    # ============================================================================
    
    secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    jwt_secret = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    
    app.config['SECRET_KEY'] = secret_key
    app.config['JWT_SECRET_KEY'] = jwt_secret
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not set")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # ============================================================================
    # CORS
    # ============================================================================
    
    CORS(app, 
         origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    )
    
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return make_response('', 200)
    
    # ============================================================================
    # JWT
    # ============================================================================
    
    JWTManager(app)
    logger.info("✅ JWT initialized")
    
    # ============================================================================
    # DATABASE
    # ============================================================================
    
    try:
        engine = create_engine(database_url, echo=False)
        SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
        app.engine = engine
        app.SessionLocal = SessionLocal
        logger.info("✅ Database connection configured")
    except Exception as e:
        logger.error(f"❌ DB error: {str(e)}")
        raise
    
    # ============================================================================
    # BLUEPRINTS
    # ============================================================================
    
    try:
        from app.routes.auth import auth_bp
        from app.routes.employees import employees_bp
        from app.routes.dashboard import dashboard_bp
        from app.routes.tickets import tickets_bp
        from app.routes.appointments import appointments_bp
        from app.routes.attendance import attendance_bp
        from app.routes.interactions import interactions_bp
        
        app.register_blueprint(auth_bp)
        app.register_blueprint(employees_bp, url_prefix='/api')
        app.register_blueprint(dashboard_bp, url_prefix='/api')
        app.register_blueprint(tickets_bp, url_prefix='/api')
        app.register_blueprint(appointments_bp, url_prefix='/api')
        app.register_blueprint(attendance_bp, url_prefix='/api')
        app.register_blueprint(interactions_bp, url_prefix='/api')
        
        logger.info("✅ All routes registered")
    except ImportError as e:
        logger.error(f"❌ Routes error: {str(e)}")
        raise
    
    return app