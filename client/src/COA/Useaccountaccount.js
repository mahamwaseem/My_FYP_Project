// src/COA/Useaccountaccount.js
import { useState, useEffect, useCallback } from "react";
import Accountaccountservice from "./Accountaccountservice";

// class_id kept as STRING in form (matches <select> value)
// Converted to Number() only in the payload before sending
const INITIAL_FORM = { name: "", class_id: "", is_active: true };

const Useaccountaccount = () => {
  const [accounts,    setAccounts]    = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [editingId,   setEditingId]   = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);
  const [nextId,      setNextId]      = useState(1);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };
  const showError   = (msg) => { setError(msg);      setTimeout(() => setError(null),      4000); };

  /* ── Fetch classes for dropdown ── */
  const fetchClasses = useCallback(async () => {
    try {
      const res = await Accountaccountservice.getAllClasses();
      if (res.data.success) setClasses(res.data.data || []);
    } catch { /* silently fail — dropdown will be empty */ }
  }, []);

  /* ── Fetch all accounts ── */
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Accountaccountservice.getAll();
      if (!res.data.success) throw new Error("Invalid response");
      const data = res.data.data || [];
      setAccounts(data);
      const maxId = data.length > 0 ? Math.max(...data.map((a) => a.id)) : 0;
      setNextId(maxId + 1);
    } catch {
      showError("Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchAccounts();
  }, [fetchClasses, fetchAccounts]);

  /* ── Handle input change ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.name.trim()) { showError("Account name is required.");  return; }
    const classId = Number(form.class_id);
    if (!classId)          { showError("Please select a class.");     return; }

    const payload = {
      name:            form.name.trim(),
      class_id:        classId,
      is_active:       form.is_active,
    };

    setSaving(true);
    try {
      if (editingId) {
        await Accountaccountservice.update(editingId, payload);
        showSuccess("Account updated successfully.");
      } else {
        await Accountaccountservice.create(payload);
        showSuccess("Account created successfully.");
      }
      resetForm();
      fetchAccounts();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.name?.[0]     ||
        err?.response?.data?.errors?.class_id?.[0] ||
        err?.response?.data?.message               ||
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
      name:            selectedRow.name,
      class_id:        String(selectedRow.class_id),
      is_active:       selectedRow.is_active,
    });
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selectedRow) { showError("Please select a row to delete."); return; }
    if (!window.confirm(`Delete account "${selectedRow.name}"?`)) return;
    try {
      await Accountaccountservice.delete(selectedRow.id);
      showSuccess(`Account "${selectedRow.name}" deleted.`);
      resetForm();
      fetchAccounts();
    } catch {
      showError("Failed to delete. This account may be in use.");
    }
  };

  /* ── Reset ── */
  const resetForm = () => {
    const firstClassId = classes.length > 0 ? String(classes[0].id) : "";
    setForm({ ...INITIAL_FORM, class_id: firstClassId });
    setEditingId(null);
    setSelectedRow(null);
  };

  const handleRowClick = (acc) => setSelectedRow(acc);

  return {
    accounts, classes, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  };
};

export default Useaccountaccount;