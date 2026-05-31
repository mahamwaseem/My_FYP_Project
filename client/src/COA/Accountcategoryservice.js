// src/COA/Accountcategoryservice.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/coa/",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("fintrack_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response || error.message);
    return Promise.reject(error);
  }
);

const Accountcategoryservice = {
  getAll:      ()         => API.get("categories/"),
  getAllGroups: ()         => API.get("groups/"),
  create:      (data)     => API.post("categories/", data),
  update:      (id, data) => API.put(`categories/${id}/`, data),
  delete:      (id)       => API.delete(`categories/${id}/`),
};

export default Accountcategoryservice;