export const ProductDetailSkeleton = () => {
  return (
    <div className="container mx-auto py-8 px-2 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-32 bg-muted rounded mb-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Left: Image carousel skeleton */}
        <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
          <div className="h-3/4 w-3/4 bg-gray-300 rounded"></div>
        </div>

        {/* Right: Product details */}
        <div className="space-y-4">
          {/* Title */}
          <div className="h-8 w-2/3 bg-muted rounded"></div>

          {/* Price + badges */}
          <div className="flex gap-4">
            <div className="h-6 w-20 bg-muted rounded"></div>
            <div className="h-6 w-16 bg-muted rounded"></div>
            <div className="h-6 w-20 bg-muted rounded"></div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-5/6 bg-muted rounded"></div>
            <div className="h-4 w-4/6 bg-muted rounded"></div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-4">
            <div className="h-5 w-12 bg-muted rounded-full"></div>
            <div className="h-5 w-16 bg-muted rounded-full"></div>
            <div className="h-5 w-10 bg-muted rounded-full"></div>
          </div>

          {/* Availability */}
          <div className="h-4 w-32 bg-muted rounded"></div>

          {/* Button */}
          <div className="h-10 w-40 bg-muted rounded mt-6"></div>
        </div>
      </div>

      {/* Related products */}
      <div className="mt-16">
        <div className="h-6 w-40 bg-muted rounded mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="group overflow-hidden rounded-lg border bg-background shadow-sm"
            >
              <div className="aspect-square bg-muted"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-12 bg-muted rounded"></div>
                  <div className="h-4 w-16 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
