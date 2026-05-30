import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../hooks/useFinTrack';
import { voucherAPI } from '../../services/api';
import { formatCurrency, formatDate, STATUS_CONFIG, VOUCHER_TYPE_CONFIG } from '../../utils/helpers';
import { TableSkeleton, ErrorBoundary, ConfirmDialog, Pagination } from '../shared/UI';
import VoucherForm from './VoucherForm';
import VoucherDetail from './VoucherDetail';
import './VoucherList.css';

const PAGE_SIZE = 20;

// ── Fetch vouchers directly (handles { success, data } wrapper) ───────────────
function useVouchersList() {
  const [vouchers, setVouchers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await voucherAPI.list();
      // Backend wraps response: { success: true, data: [...] }
      // But DRF pagination may return { count, results: [...] }
      // Handle all three shapes:
      let list = [];
      if (Array.isArray(res))             list = res;
      else if (Array.isArray(res.data))   list = res.data;
      else if (Array.isArray(res.results)) list = res.results;
      setVouchers(list);
    } catch (err) {
      setError(err.message || 'Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVouchers(); }, []);

  return { vouchers, loading, error, refetch: fetchVouchers };
}

export default function VoucherList() {
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [sortField,     setSortField]     = useState('date');
  const [sortDir,       setSortDir]       = useState('desc');
  const [page,          setPage]          = useState(1);
  const [showForm,      setShowForm]      = useState(false);
  const [editVoucher,   setEditVoucher]   = useState(null);
  const [viewVoucher,   setViewVoucher]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPost,   setConfirmPost]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();
  const { vouchers, loading, error, refetch } = useVouchersList();

  // ── Client-side filter / sort / paginate ──────────────────────────────────
  // All comparisons use backend field names: v_type, date, narration, voucher_no
  const filtered = useMemo(() => {
    let data = [...vouchers];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((v) =>
        (v.voucher_no  || '').toLowerCase().includes(q) ||
        (v.narration   || '').toLowerCase().includes(q) ||
        (v.reference   || '').toLowerCase().includes(q)
      );
    }

    // filterStatus and filterType match backend values exactly (DRAFT/POSTED/REVERSED and PV/RV/JV)
    if (filterStatus) data = data.filter((v) => v.status === filterStatus);
    if (filterType)   data = data.filter((v) => v.v_type === filterType);

    data.sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb), undefined, { numeric: true })
        : String(vb).localeCompare(String(va), undefined, { numeric: true });
    });

    return data;
  }, [vouchers, search, filterStatus, filterType, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) =>
    sortField !== field
      ? <span style={{ opacity: 0.3 }}> ⇅</span>
      : <span> {sortDir === 'asc' ? '↑' : '↓'}</span>;

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await voucherAPI.delete(confirmDelete.id);
      toast.success('Voucher deleted.', 'Deleted');
      refetch();
    } catch (err) {
      toast.error(err.message, 'Delete Failed');
    } finally {
      setActionLoading(false);
      setConfirmDelete(null);
    }
  };

  const handlePost = async () => {
    setActionLoading(true);
    try {
      await voucherAPI.post(confirmPost.id);
      toast.success(`${confirmPost.voucher_no} posted successfully.`, 'Posted');
      refetch();
    } catch (err) {
      toast.error(err.message, 'Post Failed');
    } finally {
      setActionLoading(false);
      setConfirmPost(null);
    }
  };

  return (
    <ErrorBoundary>
      {/* ── Toolbar ── */}
      <div className="voucher-toolbar">
        <input
          type="search"
          className="form-control voucher-search"
          placeholder="Search by voucher no, description or reference…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="voucher-filters">
          <select
            className="form-control filter-select"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="REVERSED">Reversed</option>
          </select>
          <select
            className="form-control filter-select"
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="PV">Payment Voucher</option>
            <option value="RV">Receipt Voucher</option>
            <option value="JV">Journal Voucher</option>
          </select>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditVoucher(null); setShowForm(true); }}
        >
          + New Voucher
        </button>
      </div>

      {/* ── Results count ── */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {loading ? '…' : `${filtered.length} voucher${filtered.length !== 1 ? 's' : ''}`}
        {(filterStatus || filterType || search) && ' (filtered)'}
      </div>

      {error && (
        <div className="error-alert" style={{ marginBottom: '16px' }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="data-table-wrapper">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗒</div>
            <h3>No vouchers found</h3>
            <p>Try adjusting your filters or create a new voucher.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('voucher_no')}>
                  Voucher No.<SortIcon field="voucher_no" />
                </th>
                <th>Type</th>
                <th className="sortable" onClick={() => handleSort('date')}>
                  Date<SortIcon field="date" />
                </th>
                <th>Description</th>
                <th>Status</th>
                <th className="sortable amount-cell" onClick={() => handleSort('total_debit')}>
                  Amount<SortIcon field="total_debit" />
                </th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => {
                const typeConf   = VOUCHER_TYPE_CONFIG[v.v_type] || {};
                const statusConf = STATUS_CONFIG[v.status]       || {};
                return (
                  <tr key={v.id}>
                    <td>
                      <button
                        className="voucher-number-btn"
                        onClick={() => setViewVoucher(v)}
                      >
                        {v.voucher_no}
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${typeConf.color || ''}`}>
                        {typeConf.abbr || v.v_type}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(v.date)}</td>
                    <td className="desc-cell">{v.narration || '—'}</td>
                    <td>
                      <span className={`badge ${statusConf.color || ''}`}>
                        {statusConf.label || v.status}
                      </span>
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(v.total_debit, v.currency_code)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="View"
                          onClick={() => setViewVoucher(v)}
                        >👁</button>
                        {v.status === 'DRAFT' && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Edit"
                              onClick={() => { setEditVoucher(v); setShowForm(true); }}
                            >✏</button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Post"
                              onClick={() => setConfirmPost(v)}
                            >✓</button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Delete"
                              style={{ color: 'var(--color-error)' }}
                              onClick={() => setConfirmDelete(v)}
                            >🗑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ── Modals ── */}
      {showForm && (
        <VoucherForm
          voucher={editVoucher}
          onClose={() => { setShowForm(false); setEditVoucher(null); }}
          onSaved={() => { setShowForm(false); setEditVoucher(null); refetch(); }}
        />
      )}

      {viewVoucher && (
        <VoucherDetail
          voucherId={viewVoucher.id}
          onClose={() => setViewVoucher(null)}
          onRefresh={refetch}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Voucher"
        message={`Delete voucher ${confirmDelete?.voucher_no}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={actionLoading}
      />

      <ConfirmDialog
        open={!!confirmPost}
        onClose={() => setConfirmPost(null)}
        onConfirm={handlePost}
        title="Post Voucher"
        message={`Post ${confirmPost?.voucher_no}? Once posted it cannot be edited or deleted.`}
        confirmLabel="Post Voucher"
        loading={actionLoading}
      />
    </ErrorBoundary>
  );
}