"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, getCategories } from "@/services/productApi";
import { getAccessToken, logoutUser } from "@/utils/auth";
import { useDebounce } from "@/hooks/useDebounce";
const VALID_PAGE_SIZES = [10, 20, 50];
const VALID_SORTS = [
  "price-asc",
  "price-desc",
  "rating-desc",
  "title-asc",
  "title-desc",
];
export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Products
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  // Categories
  const [categories, setCategories] = useState([]);
  // Search
  const [search, setSearch] = useState("");
  // Debounce search before API request
  const debouncedSearch = useDebounce(search, 500);
  // Category
  const [category, setCategory] = useState("");
  // Sort
  const [sortBy, setSortBy] = useState("");
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  /* Read values from URL when the page first loads. */
  useEffect(() => {
    const urlPage = Number(searchParams.get("page"));
    const urlPageSize = Number(searchParams.get("pageSize"));
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlSort = searchParams.get("sort") || "";
    // Validate page
    if (Number.isInteger(urlPage) && urlPage > 0) {
      setPage(urlPage);
    } else {
      setPage(1);
    } // Validate page size if (VALID_PAGE_SIZES.includes(urlPageSize)) { setPageSize(urlPageSize); } else { setPageSize(10); } setSearch(urlSearch); setCategory(urlCategory);
    // Validate sort
    if (VALID_SORTS.includes(urlSort)) {
      setSortBy(urlSort);
    } else {
      setSortBy("");
    }
  }, [searchParams]);
  /* Calculate API pagination. */ const skip = (page - 1) * pageSize;
  /* Total pages. */ const totalPages = Math.ceil(totalProducts / pageSize);
  /* Get API sorting values. */ const getSortParams = () => {
    switch (sortBy) {
      case "price-asc":
        return { sortBy: "price", order: "asc" };
      case "price-desc":
        return { sortBy: "price", order: "desc" };
      case "rating-desc":
        return { sortBy: "rating", order: "desc" };
      case "title-asc":
        return { sortBy: "title", order: "asc" };
      case "title-desc":
        return { sortBy: "title", order: "desc" };
      default:
        return { sortBy: "", order: "" };
    }
  };
  /* Update URL without refreshing the page. */ const updateUrl = ({
    newPage = page,
    newPageSize = pageSize,
    newSearch = search,
    newCategory = category,
    newSort = sortBy,
  }) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));
    if (newSearch.trim()) {
      params.set("search", newSearch.trim());
    }
    if (newCategory) {
      params.set("category", newCategory);
    }
    if (newSort) {
      params.set("sort", newSort);
    }
    router.push(`/products?${params.toString()}`);
  };
  /* Authentication + categories. */ useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchCategories();
  }, [router]);
  /* Fetch products whenever URL-controlled state changes. */ useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    fetchProducts();
  }, [page, pageSize, debouncedSearch, category, sortBy]);
  /* Fetch categories. */ const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Category error:", error);
    }
  };
  /* Fetch products. */ 
  const fetchProducts = async () => {
  const requestId = ++requestIdRef.current;

  try {
    setLoading(true);
    setError("");

    const {
      sortBy: apiSortBy,
      order,
    } = getSortParams();

    const data = await getProducts({
      limit: pageSize,
      skip,
      search: debouncedSearch,
      category,
      sortBy: apiSortBy,
      order,
      delay: 0,
    });

    // Ignore old responses
    if (requestId !== requestIdRef.current) {
      return;
    }

    setProducts(data.products);
    setTotalProducts(data.total);
  } catch (error) {
    // Ignore errors from old requests
    if (requestId !== requestIdRef.current) {
      return;
    }

    console.error(error);

    setError("Failed to load products.");
  } finally {
    // Only the latest request controls loading state
    if (requestId === requestIdRef.current) {
      setLoading(false);
    }
  }
};
  /* Search change. We update URL immediately. API waits for debounce. */ 
 const handleSearchChange = (event) => {
  const value = event.target.value;

  setSearch(value);
  setPage(1);

  // Search and category cannot be active together.
  // Starting a search clears the category.
  const newCategory = "";

  setCategory(newCategory);

  updateUrl({
    newPage: 1,
    newSearch: value,
    newCategory,
  });
};
  /* Category change. */ const handleCategoryChange = (event) => {
    const value = event.target.value;
    setCategory(value);
    setPage(1);
    updateUrl({ newPage: 1, newCategory: value });
  };
  /* Sort change. */ const handleSortChange = (event) => {
    const value = event.target.value;
    setSortBy(value);
    setPage(1);
    updateUrl({ newPage: 1, newSort: value });
  };
  /* Page change. */ const handlePageChange = (newPage) => {
    if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) {
      return;
    }
    setPage(newPage);
    updateUrl({ newPage });
  };
  /* Page size change. */ const handlePageSizeChange = (event) => {
    const value = Number(event.target.value);
    if (!VALID_PAGE_SIZES.includes(value)) {
      return;
    }
    setPageSize(value);
    setPage(1);
    updateUrl({ newPage: 1, newPageSize: value });
  };
  /* Logout. */ const handleLogout = () => {
    logoutUser();
    router.replace("/login");
  };
  /* Product range. */ const startProduct = totalProducts === 0 ? 0 : skip + 1;
  const endProduct = Math.min(skip + pageSize, totalProducts);
  /* Prevent invalid page from requesting an impossible API page. Example: ?page=999 */ useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
      updateUrl({ newPage: totalPages });
    }
  }, [totalPages, page]);
  /* Initial loading. */ if (loading && products.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        
        <p className="text-gray-600"> Loading products... </p>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-gray-100">
      
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-6">
        
        <h1 className="text-lg font-bold text-gray-900 md:text-xl">
          
          Product Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          
          Logout
        </button>
      </header>
      <section className="p-4 md:p-6">
        
        {/* Title */}
        <div className="mb-6">
          
          <h2 className="text-2xl font-bold text-gray-900"> Products </h2>
          <p className="mt-1 text-gray-600">
            
            Manage your products from here.
          </p>
        </div>
        {/* Search / Filter / Sort */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            
            {/* Search */}
            <div>
              
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                
                Search
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {/* Category */}
            <div>
              
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={handleCategoryChange}
                  disabled={Boolean(search.trim())}

                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                
                <option value=""> All Categories </option>
                {categories.map((item) => (
                  <option key={item.slug || item} value={item.slug || item}>
                    
                    {item.name || item}
                  </option>
                ))}
              </select>
            </div>
            {/* Sort */}
            <div>
              
              <label
                htmlFor="sort"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                
                Sort
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={handleSortChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                
                <option value=""> Default </option>
                <option value="price-asc"> Price: Low to High </option>
                <option value="price-desc"> Price: High to Low </option>
                <option value="rating-desc"> Rating: High to Low </option>
                <option value="title-asc"> Title: A-Z </option>
                <option value="title-desc"> Title: Z-A </option>
              </select>
            </div>
          </div>
          {debouncedSearch && category && (
            <p className="mt-3 text-sm text-amber-700">
             Search is active. Category filtering is disabled
    until you clear the search.
            </p>
          )}
        </div>
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
            
            <p>{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-2 font-medium underline"
            >
              
              Retry
            </button>
          </div>
        )}
        {/* Empty */}
        {!error && products.length === 0 && (
          <div className="rounded-md bg-white p-6 text-center">
            
            <p className="text-gray-600"> No products found. </p>
          </div>
        )}
        {/* Products */}
        {!error && products.length > 0 && (
          <>
            
            {/* Desktop */}
            <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
              
              <table className="w-full min-w-[800px]">
                
                <thead className="border-b bg-gray-50">
                  
                  <tr>
                    
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  
                  {products.map((product) => (
                    <tr key={product.id} className="border-b last:border-b-0">
                      
                      <td className="px-4 py-4">
                        
                        <div className="flex items-center gap-3">
                          
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                          <span className="font-medium text-gray-900">
                            
                            {product.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        
                        {product.category}
                      </td>
                      <td className="px-4 py-4 text-gray-900">
                        
                        ${product.price}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        
                        {product.rating}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        
                        {product.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="space-y-4 md:hidden">
              
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg bg-white p-4 shadow"
                >
                  
                  <div className="flex gap-4">
                    
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-20 w-20 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      
                      <h3 className="font-semibold text-gray-900">
                        
                        {product.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
                    
                    <div>
                      
                      <p className="text-xs text-gray-500"> Price </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        
                        ${product.price}
                      </p>
                    </div>
                    <div>
                      
                      <p className="text-xs text-gray-500"> Rating </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        
                        {product.rating}
                      </p>
                    </div>
                    <div>
                      
                      <p className="text-xs text-gray-500"> Stock </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        
                        {product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Information */}
            <div className="mt-6 flex flex-col gap-4 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
              
              <p className="text-sm text-gray-600">
                
                Showing
                <span className="font-semibold text-gray-900">
                  
                  {startProduct}–{endProduct}
                </span>
                of
                <span className="font-semibold text-gray-900">
                  
                  {totalProducts}
                </span>
              </p>
              <div className="flex items-center gap-2">
                
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  
                  Page size:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  
                  <option value="10">10</option> <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                
                Previous
              </button>
              <div className="flex flex-wrap gap-2">
                
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${page === pageNumber ? "bg-blue-600 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                
                Next
              </button>
            </div>
            {loading && (
              <p className="mt-4 text-center text-sm text-gray-500">
                
                Loading products...
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
