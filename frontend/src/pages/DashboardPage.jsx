import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api.js';

function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  
  // --- New State for AI Bonus ---
  const [aiDescription, setAiDescription] = useState('');
  const [generatedStories, setGeneratedStories] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Get user role from local storage
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    fetchProjects();
  }, []);

  // Function to get all projects from the backend
  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects.');
    }
  };

  // Function to create a new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError(''); // Clear old errors
    try {
      const response = await apiClient.post('/projects', { name: projectName });
      // Add the new project to our list without a full refresh
      setProjects([...projects, response.data]);
      setProjectName(''); // Clear the input
    } catch (err) {
      console.error('Failed to create project:', err);
      if (err.response && err.response.status === 403) {
        setError('Permission denied: Only Admins or Managers can create projects.');
      } else {
        setError('Failed to create project.');
      }
    }
  };

  // --- New Handler for AI Bonus ---
  const handleGenerateStories = async (e) => {
    e.preventDefault();
    setGeneratedStories([]);
    setLoadingAi(true);
    setError(''); // Clear old errors
    try {
        const response = await apiClient.post('/ai/generate-user-stories', {
            projectDescription: aiDescription
        });
        
        // The API returns a JSON *string*, so we must parse it
        const data = JSON.parse(response.data); 
        
        setGeneratedStories(data.stories || ['No stories generated.']);
    } catch (err) {
        console.error('Failed to generate stories:', err);
        setError('Failed to generate AI stories. Check your GROQ_API_KEY.');
    } finally {
        setLoadingAi(false);
    }
  };

  // Function to log out
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Clear role on logout
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>
      <h1>Project Dashboard</h1>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* --- Section for Admins/Managers --- */}
      {userRole !== 'Developer' && (
        <>
          {/* --- Create Project Form --- */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                placeholder="New project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
              <button type="submit">Create</button>
            </form>
          </div>

          {/* --- AI User Story Generator (Bonus) --- */}
          <div style={{ margin: '20px 0', border: '1px solid gray', padding: '10px' }}>
            <h3>Bonus: AI User Story Generator</h3>
            <form onSubmit={handleGenerateStories}>
              <textarea
                placeholder="Enter a simple project description... e.g., 'An e-commerce site for selling plants.'"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                style={{ width: '90%', minHeight: '80px' }}
                required
              />
              <br />
              <button type="submit" disabled={loadingAi}>
                {loadingAi ? 'Generating...' : 'Generate Stories'}
              </button>
            </form>
            
            {generatedStories.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <h4>Generated Stories:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                  {generatedStories.map((story, index) => (
                    <li key={index}>{story}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}


      {/* --- Project List (Visible to all) --- */}
      <div>
        <h2>Your Projects</h2>
        {projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            {projects.map(project => (
              <li key={project.id}>
                <Link to={`/projects/${project.id}`}>
                  <strong>{project.name}</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;


