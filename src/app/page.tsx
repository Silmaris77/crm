export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-14 sm:px-10">
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#1e3c72_0%,#152b54_100%)] p-8 text-white shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
        <p className="mb-3 inline-block rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
          Phase 1 started
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">CRM</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
          Separate app scaffold is ready. Next steps: configure Supabase env, create
          dashboard route, and start the first prospecting API endpoints.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Stack</h2>
          <p className="mt-2 text-sm text-slate-600">Next.js 16, React 19, TypeScript, Tailwind 4</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Auth/Data</h2>
          <p className="mt-2 text-sm text-slate-600">Supabase JS + SSR package installed</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Brand</h2>
          <p className="mt-2 text-sm text-slate-600">Project name set to plain CRM</p>
        </article>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Immediate TODO</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Create Supabase project envs in .env.local</li>
          <li>Add organizations-aware RLS policy baseline</li>
          <li>Create first route: /api/v1/prospecting/opportunities</li>
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          Quick check after deploy: <span className="font-semibold">/api/health</span>
        </p>
      </section>
    </main>
  );
}
