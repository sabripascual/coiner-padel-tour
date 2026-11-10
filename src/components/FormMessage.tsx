import type { ActionState } from "@/app/admin/actions";

export default function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>;
  if (state.message) return <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">{state.message}</p>;
  return null;
}
