// components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-amber-200"></div>
        <div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    </div>
  );
}
