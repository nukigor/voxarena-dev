"use client";

import * as React from "react";
import TaxonomyTabs from "@/components/taxonomy/TaxonomyTabs";
import { DeleteDialog } from "@/components/ui/DeleteDialog";
import { Pagination } from "@/components/ui/Pagination";

type Category = {
  id: string;
  key: string | null;
  fullName: string;
  description: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  termUsage?: number; // provided by API
};

type ListResponse = {
  items: Category[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 10;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function TaxonomyCategoriesPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Category[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // Selection & UI
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [expandedDesc, setExpandedDesc] = React.useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);

  // Add/Edit modals
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);
  const [fId, setFId] = React.useState<string | null>(null);
  const [fFullName, setFFullName] = React.useState("");
  const [fKey, setFKey] = React.useState("");
  const [fDescription, setFDescription] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/taxonomycategories?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load categories");
      const data: ListResponse = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    load();
  }, [load]);

  function resetSelection() {
    setSelectedIds(new Set());
    setDeleteIds([]);
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDescription(id: string) {
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Delete flow
  function openRowDeleteDialog(id: string) {
    setDeleteOpen(true);
    setDeleteIds([id]);
  }

  function openBulkDeleteDialog() {
    setDeleteOpen(true);
    setDeleteIds(Array.from(selectedIds));
  }

  async function doDelete() {
    if (deleteIds.length === 0) return;
    try {
      for (const id of deleteIds) {
        const res = await fetch(`/api/taxonomycategories/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({} as any));
          throw new Error(d.error || "Failed to delete category");
        }
      }
      setDeleteOpen(false);
      setDeleteIds([]);
      resetSelection();
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to delete");
    }
  }

  // Add/Edit
  function openAddModal() {
    setFId(null);
    setFFullName("");
    setFKey("");
    setFDescription("");
    setAddOpen(true);
  }

  function openEditModal(cat: Category) {
    setFId(cat.id);
    setFFullName(cat.fullName || "");
    setFKey(cat.key || "");
    setFDescription(cat.description || "");
    setEditOpen(true);
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      fullName: fFullName,
      description: fDescription,
      key: fKey || undefined,
    };
    const url = fId
      ? `/api/taxonomycategories/${fId}`
      : "/api/taxonomycategories";
    const method = fId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setFormLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Save failed");
      return;
    }
    setAddOpen(false);
    setEditOpen(false);
    await load();
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="p-6">
      {/* Heading */}
      <div className="min-w-0 mb-4">
        <h2 className="text-2xl/7 font-bold text-gray-900 sm:text-3xl sm:tracking-tight dark:text-white">
          Taxonomy Categories
        </h2>
      </div>

      {/* Tabs */}
      <TaxonomyTabs />

      {/* Actions — EXACT same classes as taxonomy page */}
      <div className="mt-4 mb-3 flex items-center justify-end gap-2">
        {/* Add */}
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Add
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={openBulkDeleteDialog}
          disabled={!hasSelection}
          className={
            hasSelection
              ? "inline-flex items-center rounded-md border border-red-600 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950/20"
              : "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-black/5 cursor-not-allowed dark:text-gray-500 dark:ring-white/10 dark:bg-white/5 disabled:hover:bg-transparent"
          }
        >
          Delete
        </button>
      </div>

      {/* Table */}
      <div className="mt-0">
        <div className="overflow-hidden rounded-md border border-gray-200 shadow dark:border-white/10">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                {/* checkbox */}
                <th className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:pl-6">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label="Select all categories"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Full name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Key
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Terms usage
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="py-3 pr-4 pl-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-transparent">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-gray-500">
                    No categories yet.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                items.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const isExpanded = expandedDesc.has(item.id);
                  const short = (item.description || "").slice(0, 200);
                  const hasMore = (item.description || "").length > 200;
                  return (
                    <tr key={item.id}>
                      {/* checkbox */}
                      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`Select ${item.fullName}`}
                        />
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {item.fullName}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.key}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {isExpanded ? (
                          <>
                            {item.description || ""}
                            {hasMore && (
                              <button
                                type="button"
                                onClick={() => toggleDescription(item.id)}
                                className="ml-2 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Show less
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {short}
                            {hasMore && (
                              <button
                                type="button"
                                onClick={() => toggleDescription(item.id)}
                                className="ml-2 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Show more
                              </button>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                        {item.termUsage ?? 0}
                      </td>
                      <td className="px-3 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                        {fmtDate(item.createdAt)}
                      </td>
                      <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                        <button
                          onClick={() => openEditModal(item)}
                          className="mr-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openRowDeleteDialog(item.id)}
                          className="rounded-md border border-red-600 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => {
            setPage(p);
            resetSelection();
          }}
          className="mt-4"
        />
      </div>

      {/* Delete dialog */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        entityName={
          deleteIds.length > 1 ? `${deleteIds.length} categories` : "this category"
        }
        entityType="taxonomy category"
      />

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setAddOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add category
            </h3>
            <form onSubmit={submitCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full name
                </label>
                <input
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  value={fFullName}
                  onChange={(e) => setFFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key (optional — auto if blank)
                </label>
                <input
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  value={fKey}
                  onChange={(e) => setFKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => !formLoading && setAddOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {formLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setEditOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit category
            </h3>
            <form onSubmit={submitCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full name
                </label>
                <input
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  value={fFullName}
                  onChange={(e) => setFFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key
                </label>
                <input
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  value={fKey}
                  onChange={(e) => setFKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => !formLoading && setEditOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {formLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}