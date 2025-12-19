import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export const LoadingSpinner = ({ className, size = 16 }: LoadingSpinnerProps) => {
  return (
    <Loader2 
      className={cn("animate-spin", className)} 
      size={size}
    />
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots = ({ className }: LoadingDotsProps) => {
  return (
    <span className={cn("inline-flex items-center space-x-1", className)}>
      <span className="animate-bounce [animation-delay:-0.3s]">.</span>
      <span className="animate-bounce [animation-delay:-0.15s]">.</span>
      <span className="animate-bounce">.</span>
    </span>
  );
};

interface LoadingProgressProps {
  value?: number;
  className?: string;
}

export const LoadingProgress = ({ value, className }: LoadingProgressProps) => {
  return (
    <div className={cn("h-1 w-full bg-muted rounded-full overflow-hidden", className)}>
      <div 
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out",
          value === undefined && "animate-pulse"
        )}
        style={{ width: value !== undefined ? `${value}%` : "60%" }}
      />
    </div>
  );
};
