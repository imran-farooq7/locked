// components/admin/users-pagination.tsx
"use client";

export type PaginationProps = {
  page: number;
  totalPages: number;
  totalUsers: number;
  showingFrom: number;
  showingTo: number;
  onPageChange: (nextPage: number) => void;
};

export default function UsersPagination({
  page,
  totalPages,
  totalUsers,
  showingFrom,
  showingTo,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        Showing {showingFrom} to {showingTo} of {totalUsers} users
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>

        <div className="flex items-center">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 mx-1 rounded-lg ${
                  page === pageNum
                    ? "bg-black text-white"
                    : "border hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && (
            <>
              <span className="mx-2">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-10 border rounded-lg hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
