Project Management Tool

Full Name: Bibek Kumar Patro
Contact :- 7205293190

Deployment Link (Vercel): https://pmt-git-main-bibek-kumar-patros-projects.vercel.app?_vercel_share=wwXBSRAoArr6ZpsNWTd0cEOdXg2RBpfh

GitHub Repository: https://github.com/Bibek-101/pmt.git
How to Run This Project Locally

1. Backend (Python/Flask)

Navigate to the backend folder:

cd backend


Create and activate a virtual environment:

# Windows
python -m venv venv
.\venv\Scripts\activate


Install dependencies:

pip install -r requirements.txt


(Note: You need to create this file. Run this command in your venv: pip freeze > requirements.txt)

Create your .env file in the backend folder and add your Groq key:

GROQ_API_KEY=your_key_here


Initialize the database:

flask db upgrade


Run the server:

flask run --debug


The backend will be running at http://127.0.0.1:5000.

2. Frontend (React/Vite)

Open a new terminal and navigate to the frontend folder:

cd frontend


Install dependencies:

npm install


Run the development server:

npm run dev


The frontend will be running at http://localhost:5173.

API Endpoint Summary

POST /api/auth/register - Creates a new user.

POST /api/auth/login - Logs in a user, returns a JWT.

GET /api/projects - Gets all projects (for Admin) or assigned projects (for Dev).

POST /api/projects - Creates a new project (Admin/Manager only).

GET /api/projects/<id> - Gets details for one project.

POST /api/projects/<id>/tasks - Creates a new task in a project.

PUT /api/tasks/<id> - Updates a task (e.g., status, assignee).

GET /api/users - Gets a list of all users.

POST /api/ai/generate-user-stories - (Bonus) Generates user stories from a description.

