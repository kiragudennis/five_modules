export const ProductCardSkeleton = () => (
  <div className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-300 animate-pulse">
    {/* Image placeholder */}
    <div className="aspect-square relative bg-muted">
      <div className="absolute inset-0 bg-gray-200" />

      {/* Overlay gradient (to mimic real card) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

      {/* Fake text on overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="h-5 w-3/4 bg-gray-300 rounded mb-2"></div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
          <div className="h-4 w-12 bg-gray-300 rounded"></div>
        </div>
        <div className="mt-2 h-3 w-20 bg-gray-300 rounded"></div>
      </div>
    </div>

    {/* Floating Add to Cart button skeleton */}
    <div className="absolute top-2 right-2">
      <div className="h-8 w-20 bg-gray-300 rounded-md"></div>
    </div>
  </div>
);
