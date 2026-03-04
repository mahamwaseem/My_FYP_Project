// src/COA/Accountclassservice.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/coa/",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response || error.message);
    return Promise.reject(error);
  }
);

const Accountclassservice = {
  getAll:         ()         => API.get("classes/"),
  getAllCategories: ()        => API.get("categories/"),
  create:         (data)     => API.post("classes/", data),
  update:         (id, data) => API.put(`classes/${id}/`, data),
  delete:         (id)       => API.delete(`classes/${id}/`),
};

export default Accountclassservice;