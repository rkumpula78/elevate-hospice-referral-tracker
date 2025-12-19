import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface CharacterCounterTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  showCounter?: boolean;
}

const CharacterCounterTextarea = React.forwardRef<HTMLTextAreaElement, CharacterCounterTextareaProps>(
  ({ className, maxLength = 500, showCounter = true, value, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0);

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      if (maxLength && newValue.length > maxLength) {
        return; // Prevent typing beyond max length
      }
      
      setCharCount(newValue.length);
      
      if (onChange) {
        onChange(e);
      }
    };

    const percentUsed = maxLength ? (charCount / maxLength) * 100 : 0;
    const isNearLimit = percentUsed > 80;
    const isAtLimit = percentUsed >= 100;

    return (
      <div className="relative">
        <Textarea
          ref={ref}
          className={cn(showCounter && "pb-8", className)}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {showCounter && (
          <div className="absolute bottom-2 right-3 text-xs font-medium pointer-events-none">
            <span className={cn(
              "transition-colors duration-200",
              isAtLimit && "text-red-600",
              isNearLimit && !isAtLimit && "text-orange-600",
              !isNearLimit && "text-gray-500"
            )}>
              {charCount}/{maxLength}
            </span>
            {isNearLimit && (
              <span className="ml-2 text-orange-600 animate-pulse">
                {isAtLimit ? '⚠️ Limit reached' : '⚠️ Approaching limit'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

CharacterCounterTextarea.displayName = "CharacterCounterTextarea";

export { CharacterCounterTextarea };
