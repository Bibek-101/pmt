import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api.js';

function ProjectDetailPage() {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  
  const [users, setUsers] = useState([]); 
  const [assigneeId, setAssigneeId] = useState(''); 
  
  // Get user role from local storage
  const userRole = localStorage.getItem('userRole');
  
  const { projectId } = useParams();

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      try {
        // Fetch project details
        const projectResponse = await apiClient.get(`/projects/${projectId}`);
        setProject(projectResponse.data);
        setTasks(projectResponse.data.tasks || []);
        
        // Fetch the user list
        const usersResponse = await apiClient.get('/users');
        setUsers(usersResponse.data);

        setError('');
      } catch (err) {
        console.error('Failed to fetch page data:', err);
        setError('Failed to load project data.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchPageData();
  }, [projectId]); 

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(`/projects/${projectId}/tasks`, {
        title: taskTitle,
        assignee_id: assigneeId || null 
      });
      // Add the new task to our list
      setTasks([...tasks, response.data]);
      setTaskTitle(''); // Clear input
      setAssigneeId(''); // Clear dropdown
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Check permissions.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      // Call the new backend endpoint
      const response = await apiClient.put(`/tasks/${taskId}`, {
        status: newStatus
      });
      
      // Update the task in our local 'tasks' list
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: response.data.status } : task
      ));
    } catch (err)
 {
      console.error('Failed to update task:', err);
      setError('Failed to update task status.');
    }
  };

  // Helper function to get username from ID
  const getUsername = (id) => {
    if (!id) return 'Unassigned';
    const user = users.find(u => u.id === id);
    return user ? user.username : 'Unknown User';
  };

  if (loading) return <p>Loading project...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!project) return <p>Project not found.</p>;

  // Filter tasks by status
  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">Back to Dashboard</Link>
      <h1>{project.name}</h1>
      <p>{project.description}</p>

      <hr />

      {/* --- Create Task Form (conditional) --- */}
      {userRole !== 'Developer' && (
        <form onSubmit={handleCreateTask} style={{ marginBottom: '20px' }}>
          <h3>Create New Task</h3>
          <input 
            type="text" 
            placeholder="New task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required 
          />
          <select 
            value={assigneeId} 
            onChange={(e) => setAssigneeId(e.target.value)}
            style={{ marginLeft: '5px' }}
          >
            <option value="">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <button type="submit" style={{ marginLeft: '5px' }}>Add Task</button>
        </form>
      )}

      {/* --- Task Columns --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
        
        {/* To Do Column */}
        <div style={{ width: '33%', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
          <h2>To Do</h2>
          {todoTasks.map(task => (
            <div key={task.id} style={{ border: '1px solid gray', padding: '10px', margin: '5px', borderRadius: '5px' }}>
              <strong>{task.title}</strong>
              <p style={{ fontSize: '0.9em', color: 'gray', margin: '5px 0 0 0' }}>
                {getUsername(task.assignee_id)}
              </p>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}>
                  Start 
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* In Progress Column */}
        <div style={{ width: '33%', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
          <h2>In Progress</h2>
          {inProgressTasks.map(task => (
            <div key={task.id} style={{ border: '1px solid gray', padding: '10px', margin: '5px', borderRadius: '5px' }}>
              <strong>{task.title}</strong>
              <p style={{ fontSize: '0.9em', color: 'gray', margin: '5px 0 0 0' }}>
                {getUsername(task.assignee_id)}
              </p>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleUpdateTaskStatus(task.id, 'To Do')}>
                  To Do
                </button>
                <button onClick={() => handleUpdateTaskStatus(task.id, 'Done')} style={{ marginLeft: '5px' }}>
                  Finish
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Done Column */}
        <div style={{ width: '33%', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
          <h2>Done</h2>
          {doneTasks.map(task => (
            <div key={task.id} style={{ border: '1px solid gray', padding: '10px', margin: '5px', borderRadius: '5px' }}>
              <strong>{task.title}</strong>
              <p style={{ fontSize: '0.9em', color: 'gray', margin: '5px 0 0 0' }}>
                {getUsername(task.assignee_id)}
              </p>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}>
                  Re-Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;

