import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onEnterPress?: () => void;
  isValid?: boolean;
  isInvalid?: boolean;
  showValidation?: boolean;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, icon, onEnterPress, onKeyDown, isValid, isInvalid, showValidation = true, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnterPress && props.type !== 'textarea') {
        e.preventDefault();
        onEnterPress();
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const showValidationIcon = showValidation && (isValid || isInvalid);
    const validationBorderClass = isInvalid 
      ? "border-destructive focus-visible:ring-destructive" 
      : isValid 
        ? "border-green-500 focus-visible:ring-green-500" 
        : "";

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        <Input
          ref={ref}
          className={cn(
            icon && "pl-10",
            showValidationIcon && "pr-10",
            validationBorderClass,
            className
          )}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {showValidationIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isValid && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {isInvalid && <XCircle className="w-4 h-4 text-destructive" />}
          </div>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };
