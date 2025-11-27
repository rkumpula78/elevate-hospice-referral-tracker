import { cn } from "@/lib/utils";

interface RequiredFieldsIndicatorProps {
  total: number;
  completed: number;
  className?: string;
}

export function RequiredFieldsIndicator({ total, completed, className }: RequiredFieldsIndicatorProps) {
  const percentage = (completed / total) * 100;
  
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Required fields:</span>
        <span className={cn(
          "font-medium",
          completed === total ? "text-green-600" : "text-foreground"
        )}>
          {completed}/{total}
        </span>
      </div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
        <div 
          className={cn(
            "h-full transition-all duration-300",
            completed === total ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}