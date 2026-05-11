import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

export const fieldsAPI = {
  getAll: () => api.get('/fields'),
  getById: (id) => api.get(`/fields/${id}`),
  create: (data) => api.post('/fields', data),
  update: (id, data) => api.put(`/fields/${id}`, data),
  delete: (id) => api.delete(`/fields/${id}`)
};

export const sensorsAPI = {
  getAll: () => api.get('/sensors'),
  getByField: (fieldId) => api.get(`/sensors/field/${fieldId}`),
  getReadings: (id) => api.get(`/sensors/${id}/readings`),
  getLatest: (id) => api.get(`/sensors/${id}/latest`)
};

export const weatherAPI = {
  getCurrent: (lat, lng) => api.get(`/weather/current?lat=${lat}&lng=${lng}`),
  getForecast: (lat, lng) => api.get(`/weather/forecast?lat=${lat}&lng=${lng}`)
};

export const aiAPI = {
  analyzeCrop: (image) => api.post('/ai/crop-health', { image }),
  predictYield: (fieldId) => api.get(`/ai/yield-prediction/${fieldId}`)
};

export default api;