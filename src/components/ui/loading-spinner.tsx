import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400",
        sizeClasses[size],
        className
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50">
        <div className="text-center space-y-4">
          {spinner}
          {text && (
            <p
              className={cn(
                "text-gray-600 dark:text-gray-400",
                textSizeClasses[size]
              )}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        {spinner}
        <p
          className={cn(
            "text-gray-600 dark:text-gray-400",
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      </div>
    );
  }

  return spinner;
}
