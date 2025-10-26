import os
from flask import request, jsonify
from flask_restful import Resource
from app.models import db, User, UserRole, Project, Task, TaskStatus
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from groq import Groq
from dotenv import load_dotenv

# Load environment variables (like GROQ_API_KEY)
load_dotenv()


# ------------------------------
# User Registration
# ------------------------------
class Register(Resource):
    def post(self):
        data = request.get_json()

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return {"message": "User already exists"}, 400

        # Validate and convert role string to Enum
        role_string = data.get('role', 'Developer')
        try:
            user_role = UserRole(role_string)
        except ValueError:
            return {"message": f"Invalid role: '{role_string}'"}, 400

        # Create new user
        user = User(
            username=data['username'],
            role=user_role
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        return {"message": "User created successfully"}, 201


# ------------------------------
# User Login
# ------------------------------
class Login(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()

        # Check credentials
        if user and user.check_password(data['password']):
            # Convert user.id to string for JWT compatibility
            access_token = create_access_token(identity=str(user.id))
            return {"access_token": access_token, "role": user.role.value}, 200

        return {"message": "Invalid credentials"}, 401


# ------------------------------
# Project List (GET / POST)
# ------------------------------
class ProjectList(Resource):
    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404

        # Admin/Manager → all projects; Developer → only assigned ones
        if user.role.value in ['Admin', 'Manager']:
            projects = Project.query.all()
        else:
            projects = Project.query.join(Task).filter(Task.assignee_id == user_id).distinct().all()

        return [
            {"id": p.id, "name": p.name, "description": p.description}
            for p in projects
        ], 200

    @jwt_required()
    def post(self):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        # Only Admin/Manager can create projects
        if not user or user.role.value not in ['Admin', 'Manager']:
            return {"message": "Permission denied"}, 403

        data = request.get_json()
        if not data.get('name'):
            return {"message": "Project name is required"}, 400

        new_project = Project(
            name=data['name'],
            description=data.get('description')
        )

        db.session.add(new_project)
        db.session.commit()

        return {
            "id": new_project.id,
            "name": new_project.name,
            "description": new_project.description
        }, 201


# ------------------------------
# Single Project (Details + Tasks)
# ------------------------------
class ProjectDetail(Resource):
    @jwt_required()
    def get(self, project_id):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404

        project = Project.query.get(project_id)
        if not project:
            return {"message": "Project not found"}, 404

        # Permission logic
        if user.role.value in ['Admin', 'Manager']:
            all_tasks = project.tasks
        else:
            all_tasks = Task.query.filter_by(project_id=project.id, assignee_id=user_id).all()

        # Format tasks
        tasks_list = [{
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status.value,
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "assignee_id": t.assignee_id
        } for t in all_tasks]

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "tasks": tasks_list
        }, 200


# ------------------------------
# Task Creation
# ------------------------------
class TaskList(Resource):
    @jwt_required()
    def post(self, project_id):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user or user.role.value not in ['Admin', 'Manager']:
            return {"message": "Permission denied"}, 403

        project = Project.query.get(project_id)
        if not project:
            return {"message": "Project not found"}, 404

        data = request.get_json()
        if not data.get('title'):
            return {"message": "Task title is required"}, 400

        new_task = Task(
            title=data['title'],
            description=data.get('description'),
            project_id=project.id,
            assignee_id=data.get('assignee_id')
        )

        db.session.add(new_task)
        db.session.commit()

        return {
            "id": new_task.id,
            "title": new_task.title,
            "status": new_task.status.value,
            "assignee_id": new_task.assignee_id
        }, 201


# ------------------------------
# Single Task (Update)
# ------------------------------
class TaskDetail(Resource):
    @jwt_required()
    def put(self, task_id):
        task = Task.query.get(task_id)
        if not task:
            return {"message": "Task not found"}, 404

        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        # Only Admin/Manager or assigned Developer can update
        if not user or (user.role.value not in ['Admin', 'Manager'] and task.assignee_id != user_id):
            return {"message": "Permission denied"}, 403

        data = request.get_json()

        if 'status' in data:
            try:
                # Use the TaskStatus Enum for robust assignment
                task.status = TaskStatus[data['status'].replace(" ", "_").upper()]
            except KeyError:
                return {"message": "Invalid status value"}, 400

        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'assignee_id' in data:
            task.assignee_id = data['assignee_id']

        db.session.commit()

        return {
            "id": task.id,
            "title": task.title,
            "status": task.status.value
        }, 200


# ------------------------------
# User List (For Assigning Tasks)
# ------------------------------
class UserList(Resource):
    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404

        if user.role.value not in ['Admin', 'Manager']:
            return [{"id": user.id, "username": user.username}], 200

        users = User.query.all()
        return [
            {"id": u.id, "username": u.username, "role": u.role.value}
            for u in users
        ], 200


# ------------------------------
# AI User Story Generator
# ------------------------------
class AIUserStoryGenerator(Resource):
    @jwt_required()
    def post(self):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user or user.role.value not in ['Admin', 'Manager']:
            return {"message": "Permission denied"}, 403

        data = request.get_json()
        project_description = data.get('projectDescription')
        if not project_description:
            return {'message': 'Project description is required'}, 400

        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return {"message": "Missing GROQ_API_KEY in environment"}, 500

        try:
            client = Groq(api_key=groq_key)
            chat_completion = client.chat.completions.create(
                # --- THIS IS THE FIX ---
                model="llama-3.1-8b-instant", 
                # --- END OF FIX ---
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful AI that generates Agile user stories in JSON format. "
                            "Respond only with valid JSON having a 'stories' key, containing a list "
                            "of strings in the format 'As a [role], I want to [action], so that [benefit].'"
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Generate user stories for this project: {project_description}"
                    }
                ],
                response_format={"type": "json_object"}
            )

            # The Groq API returns JSON text, which we can pass directly to jsonify
            return jsonify(chat_completion.choices[0].message.content)

        except Exception as e:
            print(f"GROQ API Error: {e}") 
            return {"message": "Error generating stories", "error": str(e)}, 500


# ------------------------------
# Initialize All Routes
# ------------------------------
def initialize_routes(api):
    api.add_resource(Register, '/auth/register')
    api.add_resource(Login, '/auth/login')
    api.add_resource(ProjectList, '/projects')
    api.add_resource(ProjectDetail, '/projects/<int:project_id>')
    api.add_resource(TaskList, '/projects/<int:project_id>/tasks')
    api.add_resource(TaskDetail, '/tasks/<int:task_id>')
    api.add_resource(UserList, '/users')
    api.add_resource(AIUserStoryGenerator, '/ai/generate-user-stories')

