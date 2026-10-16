import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { HackathonPaginationProps } from "@/types/hackathon";
import React from "react";

// This component displays pagination controls for hackathon results.
// When a page is selected, it calls onPageChange to notify the parent.
// The parent updates the page in its filters state, triggering a new API request.
export function HackathonPagination({
  currentPage,
  totalPages,
  onPageChange,
}: HackathonPaginationProps) {
  const visiblePages: number[] = [];
  for (let page = 1; page <= totalPages; page++) {
    if (
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1)
    )
      visiblePages.push(page);
  }
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => {
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
        {visiblePages.map((page, index) => (
          <React.Fragment key={page}>
            {index > 0 && page - visiblePages[index - 1] > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                className="cursor-pointer"
                isActive={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          </React.Fragment>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => {
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
