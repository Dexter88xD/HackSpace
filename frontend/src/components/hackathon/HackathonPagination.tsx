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

// This component displays pagination controls for hackathon results.
// When a page is selected, it calls onPageChange to notify the parent.
// The parent updates the page in its filters state, triggering a new API request.
export function HackathonPagination({
  currentPage,
  totalPages,
  onPageChange,
}: HackathonPaginationProps) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#"  onClick={() => onPageChange(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}/>
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              isActive={page === currentPage}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        {totalPages > 1 && (
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>)}
        <PaginationItem>
          <PaginationNext href="#" onClick={() => onPageChange(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}/>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
