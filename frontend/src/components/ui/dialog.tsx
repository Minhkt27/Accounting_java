import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { X } from "lucide-react"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within a Dialog")

  if (!React.isValidElement(children)) return <>{children}</>

  return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
    onClick: (e: React.MouseEvent) => {
      const childProps = (children as React.ReactElement<{ onClick?: React.MouseEventHandler }>).props
      if (childProps.onClick) childProps.onClick(e)
      context.setOpen(true)
    }
  })
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within a Dialog")
  if (!context.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={() => context.setOpen(false)} 
      />
      <div className={cn(
        "relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200",
        className
      )}>
        <button 
          onClick={() => context.setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
}
