import axios from 'axios';

const API_BASE_URL = 'https://mogotech-backend.onrender.com/api/v1';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export default API;