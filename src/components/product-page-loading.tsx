// components/ProductPageLoading.tsx
export default function ProductPageLoading() {
  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      {/* Breadcrumb skeleton */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 w-20 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Image gallery skeleton */}
        <div className="lg:col-span-2">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse mb-4"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-16 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>

            {/* Price skeleton */}
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>

            {/* Features skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add to cart skeleton */}
            <div className="space-y-4">
              <div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex items-center border rounded-lg w-fit">
                  <div className="px-4 py-2 w-12 h-10 bg-gray-200 animate-pulse"></div>
                  <div className="px-4 py-2 w-12 h-10 bg-gray-200 animate-pulse"></div>
                  <div className="px-4 py-2 w-12 h-10 bg-gray-200 animate-pulse"></div>
                </div>
              </div>
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mb-12">
        <div className="flex gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-32 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Related products skeleton */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
