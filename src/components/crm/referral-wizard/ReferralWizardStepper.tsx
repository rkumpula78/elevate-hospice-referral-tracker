import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Patient Info", number: 1 },
  { label: "Source", number: 2 },
  { label: "Clinical", number: 3 },
  { label: "Review", number: 4 },
];

interface ReferralWizardStepperProps {
  currentStep: number;
}

export function ReferralWizardStepper({ currentStep }: ReferralWizardStepperProps) {
  return (
    <div className="flex items-center justify-between w-full px-2">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary animate-pulse",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs font-medium whitespace-nowrap",
                isCurrent ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 mt-[-16px]",
                isCompleted ? "bg-primary" : "bg-border border-dashed border-t"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
