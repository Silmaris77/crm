"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AccountOption = {
  id: string;
  name: string;
};

type AccountsListProps = {
  items: AccountOption[];
};

export function AccountsList({ items }: AccountsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("accQuery") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("accSort") ?? "name_asc");
  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get("accPage") ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 6;

  const updateUrlState = (next: { q?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      if (next.q) params.set("accQuery", next.q);
      else params.delete("accQuery");
    }

    if (next.sort !== undefined) {
      if (next.sort && next.sort !== "name_asc") params.set("accSort", next.sort);
      else params.delete("accSort");
    }

    if (next.page !== undefined) {
      if (next.page > 1) params.set("accPage", String(next.page));
      else params.delete("accPage");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let next = items;

    if (q) {
      next = next.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (sortBy === "name_desc") {
      next = [...next].sort((a, b) => b.name.localeCompare(a.name));
    } else {
      next = [...next].sort((a, b) => a.name.localeCompare(b.name));
    }

    return next;
  }, [items, searchQuery, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
      updateUrlState({ page: safePage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, safePage]);

  const startEdit = (id: string, name: string) => {
    setError(null);
    setEditingId(id);
    setDraftName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
    setSaving(false);
  };

  const onSave = async (id: string) => {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/v1/prospecting/accounts?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draftName }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Nie udalo sie zapisac zmian account.");
      }

      cancelEdit();
      router.refresh();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unknown error";
      setError(message);
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/v1/prospecting/accounts?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Nie udalo sie usunac account.");
      }

      router.refresh();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unknown error";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Accounts</h2>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2">
          Search
          <input
            className="rounded-md border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
            value={searchQuery}
            onChange={(event) => {
              const next = event.target.value;
              setSearchQuery(next);
              setPage(1);
              updateUrlState({ q: next, page: 1 });
            }}
            placeholder="szukaj po nazwie"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sort
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
            value={sortBy}
            onChange={(event) => {
              const next = event.target.value;
              setSortBy(next);
              setPage(1);
              updateUrlState({ sort: next, page: 1 });
            }}
          >
            <option value="name_asc">name a-z</option>
            <option value="name_desc">name z-a</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      {filteredAndSortedItems.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Brak kont.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {paginatedItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              {editingId === item.id ? (
                <div className="flex w-full items-center gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => onSave(item.id)}
                    disabled={saving}
                    className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-slate-800">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item.id, item.name)}
                      disabled={deletingId === item.id}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {filteredAndSortedItems.length > pageSize ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, safePage - 1);
              setPage(next);
              updateUrlState({ page: next });
            }}
            disabled={safePage <= 1}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {safePage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => {
              const next = Math.min(pageCount, safePage + 1);
              setPage(next);
              updateUrlState({ page: next });
            }}
            disabled={safePage >= pageCount}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
