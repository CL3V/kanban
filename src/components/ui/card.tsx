import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 shadow-sm",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: CardProps) {
  return (
    <p className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, style }: CardProps) {
  return (
    <div className={cn("p-6 pt-0", className)} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
}
