import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const login = async (username, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  return response.data;
};

export const fetchPages = async () => {
  const response = await axios.get(`${API_BASE}/pages`);
  return response.data;
};

export const createPage = async (page, token) => {
  const response = await axios.post(`${API_BASE}/pages`, page, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchTags = async () => {
  const response = await axios.get(`${API_BASE}/tags`);
  return response.data;
};
