import { cn } from "../../lib/utils.js";

function Progress({ value = 0, className, indicatorClassName }) {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, 100));

  return (
    <div
      className={cn("relative h-2.5 w-full overflow-hidden rounded-md bg-secondary", className)}
    >
      <div
        className={cn(
          "h-full w-full flex-1 rounded-md bg-primary transition-all",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </div>
  );
}

export { Progress };
