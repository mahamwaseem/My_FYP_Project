// src/COA/Useaccountcategory.js
import { useState, useEffect, useCallback } from "react";
import Accountcategoryservice from "./Accountcategoryservice";

const Useaccountcategory = () => {
  const [categories,  setCategories]  = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [form,        setForm]        = useState({ name: "", group_id: "", is_active: true });
  const [editingId,   setEditingId]   = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);
  const [nextId,      setNextId]      = useState(1);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };
  const showError   = (msg) => { setError(msg);      setTimeout(() => setError(null), 4000); };

  const fetchGroups = useCallback(async () => {
    try {
      const res = await Accountcategoryservice.getAllGroups();
      if (res.data.success) {
        const data = res.data.data || [];
        setGroups(data);
      }
    } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Accountcategoryservice.getAll();
      const data = res.data.data || [];
      setCategories(data);
      const maxId = data.length > 0 ? Math.max(...data.map(c => c.id)) : 0;
      setNextId(maxId + 1);
    } catch {
      showError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchCategories();
  }, [fetchGroups, fetchCategories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showError("Category name is required."); return; }
    if (!form.group_id)    { showError("Please select a group.");     return; }

    setSaving(true);
    try {
      const payload = {
        name:      form.name.trim(),
        group_id:  parseInt(form.group_id, 10),
        is_active: form.is_active,
      };
      if (editingId) {
        await Accountcategoryservice.update(editingId, payload);
        showSuccess("Category updated successfully.");
      } else {
        await Accountcategoryservice.create(payload);
        showSuccess("Category created successfully.");
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      showError(err?.response?.data?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (!selectedRow) { showError("Please select a row to edit."); return; }
    setEditingId(selectedRow.id);
    setForm({
      name:      selectedRow.name,
      group_id:  String(selectedRow.group_id),
      is_active: selectedRow.is_active,
    });
  };

  const handleDelete = async () => {
    if (!selectedRow) { showError("Please select a row to delete."); return; }
    if (!window.confirm(`Delete category "${selectedRow.name}"?`)) return;
    try {
      await Accountcategoryservice.delete(selectedRow.id);
      showSuccess(`Category "${selectedRow.name}" deleted.`);
      resetForm();
      fetchCategories();
    } catch {
      showError("Failed to delete category.");
    }
  };

  const resetForm = () => {
    setForm({ name: "", group_id: "", is_active: true });
    setEditingId(null);
    setSelectedRow(null);
  };

  const handleRowClick = (cat) => setSelectedRow(cat);

  return {
    categories, groups, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  };
};

export default Useaccountcategory;