// app/api/products/search/route.ts (Final version)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { nextUrl } = request;
    const searchParams = nextUrl.searchParams;

    // Parse parameters with defaults
    const query = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "24")),
    );
    const category = searchParams.get("category") || "";
    const tags = (searchParams.get("tags") || "").split(",").filter((t) => t);
    const sortBy = searchParams.get("sort") || "featured";

    const offset = (page - 1) * limit;

    // Start building query
    let queryBuilder = supabaseAdmin
      .from("products")
      .select("*", { count: "exact" });

    // Apply search if query exists
    if (query.trim()) {
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
      );
    }

    // Apply filters
    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    if (tags.length > 0) {
      queryBuilder = queryBuilder.contains("tags", tags);
    }

    if (searchParams.get("featured") === "true") {
      queryBuilder = queryBuilder.eq("featured", true);
    }

    if (searchParams.get("deals") === "true") {
      queryBuilder = queryBuilder.eq("isDealOfTheDay", true);
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        queryBuilder = queryBuilder.order("created_at", { ascending: false });
        break;
      case "price-asc":
        queryBuilder = queryBuilder.order("price", { ascending: true });
        break;
      case "price-desc":
        queryBuilder = queryBuilder.order("price", { ascending: false });
        break;
      case "rating-desc":
        queryBuilder = queryBuilder.order("rating", { ascending: false });
        break;
      case "featured":
      default:
        queryBuilder = queryBuilder
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    // Execute query
    const { data: products, error, count } = await queryBuilder;

    // Handle errors gracefully
    if (error) {
      console.error("Database query error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // Return empty results with error info
      return NextResponse.json({
        products: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalProducts: 0,
          limit,
          hasNextPage: false,
          hasPreviousPage: page > 1,
        },
        error: {
          code: error.code,
          message: "Search failed",
          suggestion: "Try a simpler search term",
        },
      });
    }

    // Calculate pagination info
    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Prepare response
    const responseData = {
      products: products || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
      searchInfo: {
        query,
        filters: {
          category: category || "none",
          tags: tags.length > 0 ? tags : "none",
          featured: searchParams.get("featured") === "true",
          deals: searchParams.get("deals") === "true",
        },
      },
    };

    // Create response with caching
    const response = NextResponse.json(responseData);

    // Set cache headers
    const cacheTime = query ? 60 : 300; // 1 minute for searches, 5 minutes for no search
    response.headers.set(
      "Cache-Control",
      `public, s-maxage=${cacheTime}, stale-while-revalidate=${Math.floor(cacheTime / 2)}`,
    );

    return response;
  } catch (error: any) {
    // Catch-all error handler
    console.error("Unhandled search error:", error);

    return NextResponse.json(
      {
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
          limit: 24,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        error: {
          message: "Service temporarily unavailable",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 },
    ); // Return 200 with empty results
  }
}
