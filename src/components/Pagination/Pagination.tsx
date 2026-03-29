import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-6 text-sm">
      {/* Previous */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`flex items-center gap-1 px-3 py-1 rounded-md transition ${
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed"
            : "text-foreground hover:bg-accent/10"
        }`}
      >
        ‹ Previous
      </button>

      {/* Pages */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg font-medium transition ${
            page === currentPage
              ? "bg-blue-600 text-white shadow"
              : "text-foreground hover:bg-muted"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`flex items-center gap-1 px-3 py-1 rounded-md transition ${
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed"
            : "text-accent hover:bg-accent/10"
        }`}
      >
        Next ›
      </button>
    </div>
  );
}
