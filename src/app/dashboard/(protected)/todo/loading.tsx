// Shown instantly on in-app navigation to /dashboard/todo while the server fetches the data.
export default function TodoLoading() {
  return (
    <div className="flex w-full max-w-[1320px] flex-col pb-10" aria-busy="true" aria-label="loading todo">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="m-0 text-[1.85rem] font-medium leading-none tracking-[0.14em] text-[var(--text)]">todo</h1>
          <div className="mt-2.5 h-1.5 w-24 animate-pulse rounded-full bg-[var(--tab)] opacity-40" />
        </div>
      </div>
      <div className="mb-4 flex gap-1.5">
        {[88, 112, 96, 80].map((w, i) => (
          <div key={i} className="h-8 animate-pulse rounded-full bg-[var(--bg-alt)]" style={{ width: w, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-raised)]">
        <div className="h-[3px] w-full bg-[var(--tab)]" />
        <div className="todo-textarea flex-1 px-8 py-6">
          {[62, 48, 70, 35, 55].map((w, i) => (
            <div key={i} className="mb-4 h-3 animate-pulse rounded bg-[var(--bg-alt)]" style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
