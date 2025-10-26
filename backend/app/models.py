from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import enum

# This line creates the 'db' object
db = SQLAlchemy()

# Enum for user roles
class UserRole(enum.Enum):
    ADMIN = 'Admin'
    MANAGER = 'Manager'
    DEVELOPER = 'Developer'

# Enum for task status
class TaskStatus(enum.Enum):
    TO_DO = 'To Do'
    IN_PROGRESS = 'In Progress'
    DONE = 'Done'

# User Table
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.DEVELOPER)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Project Table
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tasks = db.relationship('Task', backref='project', lazy=True, cascade="all, delete-orphan")

# Task Table
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum(TaskStatus), nullable=False, default=TaskStatus.TO_DO)
    deadline = db.Column(db.DateTime, nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Define relationship to User
    assignee = db.relationship('User', backref='tasks')