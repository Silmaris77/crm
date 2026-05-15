"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type OpportunityRow = {
  id: string;
  title: string;
  stage: string;
  training_days: number;
  weighted_days: number;
  created_at?: string;
};

type RecentOpportunitiesListProps = {
  items: OpportunityRow[];
};

export function RecentOpportunitiesList({ items }: RecentOpportunitiesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stageFilter, setStageFilter] = useState(searchParams.get("oppStage") ?? "all");
  const [sortBy, setSortBy] = useState(searchParams.get("oppSort") ?? "newest");
  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get("oppPage") ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftStage, setDraftStage] = useState("target");
  const [draftTrainingDays, setDraftTrainingDays] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUrlState = (next: { stage?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.stage !== undefined) {
      if (next.stage && next.stage !== "all") params.set("oppStage", next.stage);
      else params.delete("oppStage");
    }

    if (next.sort !== undefined) {
      if (next.sort && next.sort !== "newest") params.set("oppSort", next.sort);
      else params.delete("oppSort");
    }

    if (next.page !== undefined) {
      if (next.page > 1) params.set("oppPage", String(next.page));
      else params.delete("oppPage");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const pageSize = 5;

  const stageOptions = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.stage))).sort();
    return ["all", ...values];
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let next = items;

    if (stageFilter !== "all") {
      next = next.filter((item) => item.stage === stageFilter);
    }

    if (sortBy === "newest") {
      next = [...next].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    } else if (sortBy === "training_desc") {
      next = [...next].sort((a, b) => b.training_days - a.training_days);
    } else if (sortBy === "training_asc") {
      next = [...next].sort((a, b) => a.training_days - b.training_days);
    } else if (sortBy === "title") {
      next = [...next].sort((a, b) => a.title.localeCompare(b.title));
    }

    return next;
  }, [items, stageFilter, sortBy]);

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

  const startEdit = (item: OpportunityRow) => {
    setError(null);
    setEditingId(item.id);
    setDraftTitle(item.title);
    setDraftStage(item.stage);
    setDraftTrainingDays(String(item.training_days));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftTitle("");
    setDraftStage("target");
    setDraftTrainingDays("1");
    setSaving(false);
  };

  const onSave = async (id: string) => {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/v1/prospecting/opportunities?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          stage: draftStage,
          training_days: Number(draftTrainingDays),
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Nie udalo sie zapisac zmian opportunity.");
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
      const response = await fetch(`/api/v1/prospecting/opportunities?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Nie udalo sie usunac opportunity.");
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
      <h2 className="text-sm font-semibold text-slate-900">Recent Opportunities</h2>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Stage
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-sm font-normal text-slate-900"
            value={stageFilter}
            onChange={(event) => {
              const next = event.target.value;
              setStageFilter(next);
              setPage(1);
              updateUrlState({ stage: next, page: 1 });
            }}
          >
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
            <option value="newest">newest</option>
            <option value="training_desc">training days desc</option>
            <option value="training_asc">training days asc</option>
            <option value="title">title a-z</option>
          </select>
        </label>

        <div className="flex items-end text-xs text-slate-500">
          Showing {paginatedItems.length} of {filteredAndSortedItems.length}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      {filteredAndSortedItems.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Brak rekordow dla aktualnej sesji. Dodaj opportunity przez API lub UI.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {paginatedItems.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              {editingId === item.id ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                    />
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      value={draftStage}
                      onChange={(event) => setDraftStage(event.target.value)}
                    >
                      <option value="target">target</option>
                      <option value="qualified">qualified</option>
                      <option value="proposal">proposal</option>
                      <option value="won">won</option>
                      <option value="lost">lost</option>
                    </select>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      value={draftTrainingDays}
                      onChange={(event) => setDraftTrainingDays(event.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">Stage: {item.stage}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700">
                      {item.training_days}d | weighted {item.weighted_days}d
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
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
