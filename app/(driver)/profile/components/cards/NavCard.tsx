//app/(driver)/profile/components/cards/NavCard.tsx
import Link from "next/link";

export default function NavCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:bg-gray-50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-gray-900">{title}</div>
          <div className="mt-1 text-xs text-gray-600">{desc}</div>
        </div>
        <span className="text-gray-400">›</span>
      </div>
    </Link>
  );
}