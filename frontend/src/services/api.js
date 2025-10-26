import axios from 'axios';

// Create an 'instance' of axios
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000/api' // Your backend API's base URL
});

// This part adds the login token (JWT) to every API request
// after the user has logged in.
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;