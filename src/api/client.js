import axios from 'axios';

const API = axios.create({
  const API_BASE_URL = 'https://mogotech-backend.onrender.com/api/v1';
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export default API;