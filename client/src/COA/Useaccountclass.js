// src/COA/Useaccountclass.js
import { useState, useEffect, useCallback } from "react";
import Accountclassservice from "./Accountclassservice";

// category_id kept as STRING in form state (matches <select> value).
// Converted to Number() only in the payload before sending.
const INITIAL_FORM = { name: "", category_id: "", is_active: true };

const Useaccountclass = () => {
  const [classes,     setClasses]     = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [editingId,   setEditingId]   = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);
  const [nextId,      setNextId]      = useState(1);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };
  const showError   = (msg) => { setError(msg);      setTimeout(() => setError(null), 4000); };

  /* ── Fetch categories for dropdown ── */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await Accountclassservice.getAllCategories();
      if (res.data.success) {
        const data = res.data.data || [];
        setCategories(data);
        // String so it matches <option value={String(cat.id)}>
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, category_id: String(data[0].id) }));
        }
      }
    } catch { /* silently fail */ }
  }, []);

  /* ── Fetch classes ── */
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Accountclassservice.getAll();
      if (!res.data.success) throw new Error("Invalid response");
      const data = res.data.data || [];
      setClasses(data);
      const maxId = data.length > 0 ? Math.max(...data.map((c) => c.id)) : 0;
      setNextId(maxId + 1);
    } catch {
      showError("Failed to load account classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchClasses();
  }, [fetchCategories, fetchClasses]);

  /* ── Handle input change — keep category_id as string ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ── Save — convert to Number() only here ── */
  const handleSave = async () => {
    if (!form.name.trim()) { showError("Class name is required.");   return; }

    const catId = Number(form.category_id);
    if (!catId)            { showError("Please select a category."); return; }

    const payload = {
      name:        form.name.trim(),
      category_id: catId,
      is_active:   form.is_active,
    };

    setSaving(true);
    try {
      if (editingId) {
        await Accountclassservice.update(editingId, payload);
        showSuccess("Account class updated successfully.");
      } else {
        await Accountclassservice.create(payload);
        showSuccess("Account class created successfully.");
      }
      resetForm();
      fetchClasses();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.name?.[0]        ||
        err?.response?.data?.errors?.category_id?.[0] ||
        err?.response?.data?.message                  ||
        "Operation failed.";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = () => {
    if (!selectedRow) { showError("Please select a row to edit."); return; }
    setEditingId(selectedRow.id);
    setForm({
      name:        selectedRow.name,
      category_id: String(selectedRow.category_id),  // string for <select>
      is_active:   selectedRow.is_active,
    });
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selectedRow) { showError("Please select a row to delete."); return; }
    if (!window.confirm(`Delete class "${selectedRow.name}"?`)) return;
    try {
      await Accountclassservice.delete(selectedRow.id);
      showSuccess(`Class "${selectedRow.name}" deleted.`);
      resetForm();
      fetchClasses();
    } catch {
      showError("Failed to delete. This class may be in use.");
    }
  };

  /* ── Reset ── */
  const resetForm = () => {
    const firstCatId = categories.length > 0 ? String(categories[0].id) : "";
    setForm({ ...INITIAL_FORM, category_id: firstCatId });
    setEditingId(null);
    setSelectedRow(null);
  };

  const handleRowClick = (cls) => setSelectedRow(cls);

  return {
    classes, categories, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  };
};

export default Useaccountclass;