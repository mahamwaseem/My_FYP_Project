// src/COA/Accountaccountservice.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/coa/",
  headers: { "Content-Type": "application/json" },
});

// Attach the FinTrack auth token (stored by the Auth module) to every request
// so writes (create / update / delete) pass the backend's RBAC checks.
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

const Accountaccountservice = {
  getAll:      ()         => API.get("accounts/"),
  getAllClasses: ()        => API.get("classes/"),
  create:      (data)     => API.post("accounts/", data),
  update:      (id, data) => API.put(`accounts/${id}/`, data),
  delete:      (id)       => API.delete(`accounts/${id}/`),
};

export default Accountaccountservice;