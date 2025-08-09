
import React from 'react';
import { Input } from '@/components/ui/input';
import { parsePhoneNumber } from 'libphonenumber-js/min';

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      try {
        // Remove all non-digits
        const digits = inputValue.replace(/\D/g, '');
        
        if (digits.length === 0) {
          onChange('');
          return;
        }
        
        // Format as US phone number
        if (digits.length <= 10) {
          const phoneNumber = parsePhoneNumber(digits, 'US');
          if (phoneNumber) {
            onChange(phoneNumber.formatNational());
          } else {
            // Fallback formatting for partial numbers
            if (digits.length <= 3) {
              onChange(`(${digits}`);
            } else if (digits.length <= 6) {
              onChange(`(${digits.slice(0, 3)}) ${digits.slice(3)}`);
            } else {
              onChange(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`);
            }
          }
        }
      } catch {
        // If parsing fails, just clean the input
        const digits = inputValue.replace(/\D/g, '');
        if (digits.length <= 10) {
          onChange(inputValue);
        }
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder="(XXX) XXX-XXXX"
        maxLength={14}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
