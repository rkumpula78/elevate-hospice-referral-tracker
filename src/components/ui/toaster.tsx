import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastIcon,
  ToastProgress,
} from "@/components/ui/toast"
import { useState } from "react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const [pausedToasts, setPausedToasts] = useState<Set<string>>(new Set())

  const handleMouseEnter = (id: string) => {
    setPausedToasts(prev => new Set(prev).add(id))
  }

  const handleMouseLeave = (id: string) => {
    setPausedToasts(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isPaused = pausedToasts.has(id)
        
        return (
          <Toast 
            key={id} 
            variant={variant}
            onMouseEnter={() => handleMouseEnter(id)}
            onMouseLeave={() => handleMouseLeave(id)}
            onClick={() => dismiss(id)}
            {...props}
          >
            <ToastIcon variant={variant} />
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastProgress 
              duration={5000}
              isPaused={isPaused}
              onComplete={() => dismiss(id)}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
