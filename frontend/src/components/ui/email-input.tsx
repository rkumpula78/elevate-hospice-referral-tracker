
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmailInputProps extends React.ComponentProps<typeof Input> {
  onValidationChange?: (isValid: boolean) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, onValidationChange, onChange, ...props }, ref) => {
    const [isValid, setIsValid] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const valid = value === '' || emailRegex.test(value);
      
      setIsValid(valid);
      onValidationChange?.(valid);
      onChange?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="email"
        onChange={handleChange}
        className={cn(
          className,
          !isValid && "border-red-500 focus-visible:ring-red-500"
        )}
      />
    );
  }
);

EmailInput.displayName = 'EmailInput';
