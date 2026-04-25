import { Button } from "./button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-md border-t border-slate-100 rounded-b-[2rem]">
      <div className="text-sm text-slate-500 font-medium">
        Hiển thị <span className="font-bold text-slate-900">{currentPage * pageSize + 1}</span> - <span className="font-bold text-slate-900">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> trong tổng số <span className="font-bold text-slate-900">{totalElements}</span> bản ghi
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          className="h-8 w-8 rounded-lg border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm disabled:opacity-30"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="h-8 w-8 rounded-lg border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1 mx-2">
          <span className="text-sm font-black text-slate-400 italic">Trang</span>
          <span className="flex items-center justify-center min-w-[2rem] h-8 px-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md shadow-primary/20">
            {currentPage + 1}
          </span>
          <span className="text-sm font-black text-slate-400 italic">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="h-8 w-8 rounded-lg border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          className="h-8 w-8 rounded-lg border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm disabled:opacity-30"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
