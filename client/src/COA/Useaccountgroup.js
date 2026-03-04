// src/COA/Useaccountgroup.js
import { useState, useEffect, useCallback } from "react";
import Accountgroupservice from "./Accountgroupservice";

const INITIAL_FORM = { name: "", location_id: 1 };

const Useaccountgroup = () => {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [nextId, setNextId] = useState(1);

  /* ───────── Toast Helpers ───────── */
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  /* ───────── Fetch Groups ───────── */
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Accountgroupservice.getAll();

      if (!res.data.success) {
        throw new Error("Invalid response");
      }

      const data = res.data.data || [];
      setGroups(data);

      const maxId =
        data.length > 0 ? Math.max(...data.map((g) => g.id)) : 0;
      setNextId(maxId + 1);
    } catch (err) {
      showError("Failed to load account groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  /* ───────── Handle Input Change ───────── */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "location_id" ? parseInt(value || 0) : value,
    }));
  };

  /* ───────── Save ───────── */
  const handleSave = async () => {
    if (!form.name.trim()) {
      showError("Group name is required.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await Accountgroupservice.update(editingId, form);
        showSuccess("Group updated successfully.");
      } else {
        await Accountgroupservice.create(form);
        showSuccess("Group created successfully.");
      }

      resetForm();
      fetchGroups();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.name?.[0] ||
        err?.response?.data?.message ||
        "Operation failed.";

      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Edit ───────── */
  const handleEdit = () => {
    if (!selectedRow) {
      showError("Please select a row to edit.");
      return;
    }

    setEditingId(selectedRow.id);
    setForm({
      name: selectedRow.name,
      location_id: selectedRow.location_id,
    });
  };

  /* ───────── Delete ───────── */
  const handleDelete = async () => {
    if (!selectedRow) {
      showError("Please select a row to delete.");
      return;
    }

    if (!window.confirm(`Delete group "${selectedRow.name}"?`))
      return;

    try {
      await Accountgroupservice.delete(selectedRow.id);
      showSuccess(`Group "${selectedRow.name}" deleted.`);
      resetForm();
      fetchGroups();
    } catch {
      showError("Failed to delete group.");
    }
  };

  /* ───────── Reset ───────── */
  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setSelectedRow(null);
  };

  const handleRowClick = (group) => {
    setSelectedRow(group);
  };

  return {
    groups,
    form,
    editingId,
    selectedRow,
    loading,
    saving,
    error,
    successMsg,
    nextId,
    handleChange,
    handleSave,
    handleEdit,
    handleDelete,
    resetForm,
    handleRowClick,
  };
};

export default Useaccountgroup;