// src/COA/Accountaccountservice.js
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

const Accountaccountservice = {
  getAll:      ()         => API.get("accounts/"),
  getAllClasses: ()        => API.get("classes/"),
  create:      (data)     => API.post("accounts/", data),
  update:      (id, data) => API.put(`accounts/${id}/`, data),
  delete:      (id)       => API.delete(`accounts/${id}/`),
};

export default Accountaccountservice;