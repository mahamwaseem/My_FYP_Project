// src/services/Accountgroupservice.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/coa/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: global error logging
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response || error.message);
    return Promise.reject(error);
  }
);

const Accountgroupservice = {
  // GET all groups
  getAll: () => API.get("groups/"),

  // CREATE group
  create: (data) => API.post("groups/", data),

  // UPDATE group
  update: (id, data) => API.put(`groups/${id}/`, data),

  // DELETE group
  delete: (id) => API.delete(`groups/${id}/`),
};

export default Accountgroupservice;