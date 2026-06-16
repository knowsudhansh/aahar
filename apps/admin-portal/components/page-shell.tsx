import { Button } from '@aahar/ui';

interface PageShellProps {
  actionLabel?: string;
  eyebrow: string;
  title: string;
}

export function PageShell({ actionLabel, eyebrow, title }: PageShellProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
        </div>
        {actionLabel ? (
          <Button disabled type="button">
            {actionLabel}
          </Button>
        ) : null}
      </div>
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600"
            disabled
            placeholder="Search"
            type="search"
          />
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600"
            disabled
          >
            <option>Status</option>
          </select>
        </div>
        <div className="grid min-h-40 place-items-center p-6 text-sm text-slate-500">No records</div>
      </div>
    </section>
  );
}
