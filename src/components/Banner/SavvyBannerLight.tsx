// components/SavvyBannerModal.tsx
"use client";

interface SavvyBannerModalProps {
  title: string;
  subtitle?: string;
}

export default function SavvyBannerLight({
  title,
  subtitle,
}: SavvyBannerModalProps) {
  return (
    <div
      className="
        w-full rounded-xl
        px-5 py-4 mb-4
        bg-gradient-to-br from-white to-gray-50
        border border-gray-200
      "
    >
      <h1 className="text-xl font-semibold text-gray-800">
        {title}
      </h1>

      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
