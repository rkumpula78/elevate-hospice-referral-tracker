import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProgressiveLoaderProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  delay?: number;
  staggerDelay?: number;
  index?: number;
}

export const ProgressiveLoader = ({
  isLoading,
  skeleton,
  children,
  delay = 300,
  staggerDelay = 0,
  index = 0,
}: ProgressiveLoaderProps) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Wait for minimum delay before showing content
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        // Small delay before showing content for fade transition
        setTimeout(() => {
          setShowContent(true);
        }, 50);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
      setShowContent(false);
    }
  }, [isLoading, delay]);

  const totalDelay = staggerDelay * index;

  if (showSkeleton) {
    return <div className="animate-in fade-in duration-200">{skeleton}</div>;
  }

  return (
    <div
      className={cn(
        "animate-in fade-in duration-300",
        showContent && "opacity-100"
      )}
      style={{
        animationDelay: `${totalDelay}ms`,
      }}
    >
      {children}
    </div>
  );
};

interface ProgressiveListLoaderProps {
  isLoading: boolean;
  skeletonCount?: number;
  skeleton: ReactNode;
  children: ReactNode[];
  staggerDelay?: number;
}

export const ProgressiveListLoader = ({
  isLoading,
  skeletonCount = 6,
  skeleton,
  children,
  staggerDelay = 50,
}: ProgressiveListLoaderProps) => {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="animate-in fade-in duration-200">
            {skeleton}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in duration-300"
          style={{
            animationDelay: `${staggerDelay * index}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
};
