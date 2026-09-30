"use client";

export default function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.")) e.preventDefault();
      }}
    >
      <button type="submit" className="text-sm text-expense hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        Hapus
      </button>
    </form>
  );
}
