"use client";

export default function DeleteButton({
  action,
  confirmMessage = "Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-sm text-expense hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        Hapus
      </button>
    </form>
  );
}
