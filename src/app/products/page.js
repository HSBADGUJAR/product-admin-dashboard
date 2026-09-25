"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  getCategories,
  getProducts,
  deleteProduct
} from "@/services/productApi";

import {
  getAccessToken,
  logoutUser,
} from "@/utils/auth";
import ConfirmModal from "@/components/ConfirmModal";
import { useDebounce } from "@/hooks/useDebounce";

import { useProductContext } from "@/context/ProductContext";

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
  const searchParams = useSearchParams();

  // --------------------------------------------------
  // Local product context
  // --------------------------------------------------

  const {
    addedProducts,
    updatedProducts,
    deletedProductIds,
    deleteLocalProduct,
  } = useProductContext();

  // --------------------------------------------------
  // Product state
  // --------------------------------------------------

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
const [deletingId, setDeletingId] = useState(null);
const [productToDelete, setProductToDelete] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // --------------------------------------------------
  // URL controlled state
  // --------------------------------------------------

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [sortBy, setSortBy] = useState("");

  // --------------------------------------------------
  // Debounced search
  // --------------------------------------------------

  const debouncedSearch = useDebounce(search, 500);

  // --------------------------------------------------
  // Request ID
  // Prevents old API response from replacing newer data
  // --------------------------------------------------

  const requestIdRef = useRef(0);

  // --------------------------------------------------
  // Calculate pagination
  // --------------------------------------------------

  const skip = (page - 1) * pageSize;

  const totalPages = Math.ceil(
    totalProducts / pageSize
  );

  // --------------------------------------------------
  // Read URL parameters
  // --------------------------------------------------

  useEffect(() => {
    const urlPage = Number(
      searchParams.get("page")
    );

    const urlPageSize = Number(
      searchParams.get("pageSize")
    );

    const urlSearch =
      searchParams.get("search") || "";

    const urlCategory =
      searchParams.get("category") || "";

    const urlSort =
      searchParams.get("sort") || "";

    // Page
    if (
      Number.isInteger(urlPage) &&
      urlPage > 0
    ) {
      setPage(urlPage);
    } else {
      setPage(1);
    }

    // Page size
    if (
      VALID_PAGE_SIZES.includes(urlPageSize)
    ) {
      setPageSize(urlPageSize);
    } else {
      setPageSize(10);
    }

    // Search
    setSearch(urlSearch);

    // Category
    setCategory(urlCategory);

    // Sort
    if (VALID_SORTS.includes(urlSort)) {
      setSortBy(urlSort);
    } else {
      setSortBy("");
    }
  }, [searchParams]);

  // --------------------------------------------------
  // Update URL
  // --------------------------------------------------

  const updateUrl = ({
    newPage = page,
    newPageSize = pageSize,
    newSearch = search,
    newCategory = category,
    newSort = sortBy,
  } = {}) => {
    const params = new URLSearchParams();

    params.set(
      "page",
      String(newPage)
    );

    params.set(
      "pageSize",
      String(newPageSize)
    );

    if (newSearch.trim()) {
      params.set(
        "search",
        newSearch.trim()
      );
    }

    if (newCategory) {
      params.set(
        "category",
        newCategory
      );
    }

    if (newSort) {
      params.set(
        "sort",
        newSort
      );
    }

    router.replace(
      `/products?${params.toString()}`
    );
  };

  // --------------------------------------------------
  // Sort mapping
  // --------------------------------------------------

  const getSortParams = () => {
    switch (sortBy) {
      case "price-asc":
        return {
          sortBy: "price",
          order: "asc",
        };

      case "price-desc":
        return {
          sortBy: "price",
          order: "desc",
        };

      case "rating-desc":
        return {
          sortBy: "rating",
          order: "desc",
        };

      case "title-asc":
        return {
          sortBy: "title",
          order: "asc",
        };

      case "title-desc":
        return {
          sortBy: "title",
          order: "desc",
        };

      default:
        return {
          sortBy: "",
          order: "",
        };
    }
  };

  // --------------------------------------------------
  // Fetch categories
  // --------------------------------------------------

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);
        setCategoryError("");

        const data = await getCategories();

        setCategories(data);
      } catch (error) {
        console.error(error);

        setCategoryError(
          "Failed to load categories."
        );
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // --------------------------------------------------
  // Validate category from URL
  // --------------------------------------------------

  useEffect(() => {
    if (
      category &&
      categories.length > 0 &&
      !categories.some((item) => {
        if (typeof item === "string") {
          return item === category;
        }

        return (
          item.slug === category ||
          item.name === category
        );
      })
    ) {
      setCategory("");

      updateUrl({
        newCategory: "",
        newPage: 1,
      });
    }
  }, [categories, category]);

  // --------------------------------------------------
  // Fetch products
  // --------------------------------------------------

  const fetchProducts = async () => {
    const requestId =
      ++requestIdRef.current;

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
      });

      // Ignore old request
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );

      setTotalProducts(
        Number(data.total) || 0
      );
    } catch (error) {
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      console.error(error);

      setError(
        "Failed to load products."
      );

      setProducts([]);
      setTotalProducts(0);
    } finally {
      if (
        requestId ===
        requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  };

  // --------------------------------------------------
  // Fetch whenever filters/pagination/search change
  // --------------------------------------------------

  useEffect(() => {
    if (categoryLoading) {
      return;
    }

    fetchProducts();
  }, [
    page,
    pageSize,
    debouncedSearch,
    category,
    sortBy,
    categoryLoading,
  ]);

  // --------------------------------------------------
  // Correct page if URL contains page > total pages
  // --------------------------------------------------

  useEffect(() => {
    if (
      !loading &&
      totalPages > 0 &&
      page > totalPages
    ) {
      setPage(totalPages);

      updateUrl({
        newPage: totalPages,
      });
    }
  }, [
    loading,
    totalPages,
    page,
  ]);

  // --------------------------------------------------
  // Prepare visible products
  // --------------------------------------------------

  const displayProducts = useMemo(() => {
    // Apply locally updated products
    const updatedApiProducts =
      products.map((product) => {
        return (
          updatedProducts[product.id] ||
          product
        );
      });

    // Remove locally deleted products
    const visibleApiProducts =
      updatedApiProducts.filter(
        (product) =>
          !deletedProductIds.includes(
            product.id
          )
      );

    // Remove local products that are already deleted
    const visibleAddedProducts =
      addedProducts.filter(
        (product) =>
          !deletedProductIds.includes(
            product.id
          )
      );

    // Local added products appear first
    return [
      ...visibleAddedProducts,
      ...visibleApiProducts,
    ];
  }, [
    products,
    addedProducts,
    updatedProducts,
    deletedProductIds,
  ]);

  // --------------------------------------------------
  // Search change
  // --------------------------------------------------

  const handleSearchChange = (
    event
  ) => {
    const value =
      event.target.value;

    setSearch(value);

    setPage(1);

    // Search and category are mutually exclusive
    setCategory("");

    updateUrl({
      newPage: 1,
      newSearch: value,
      newCategory: "",
    });
  };

  // --------------------------------------------------
  // Category change
  // --------------------------------------------------

  const handleCategoryChange = (
    event
  ) => {
    const value =
      event.target.value;

    setCategory(value);

    setPage(1);

    updateUrl({
      newPage: 1,
      newCategory: value,
    });
  };

  // --------------------------------------------------
  // Sort change
  // --------------------------------------------------

  const handleSortChange = (
    event
  ) => {
    const value =
      event.target.value;

    setSortBy(value);

    setPage(1);

    updateUrl({
      newPage: 1,
      newSort: value,
    });
  };

  // --------------------------------------------------
  // Page size change
  // --------------------------------------------------

  const handlePageSizeChange = (
    event
  ) => {
    const value = Number(
      event.target.value
    );

    if (
      !VALID_PAGE_SIZES.includes(value)
    ) {
      return;
    }

    setPageSize(value);
    setPage(1);

    updateUrl({
      newPage: 1,
      newPageSize: value,
    });
  };

const handleDelete = async () => {
  if (!productToDelete || deletingId) return;

  const product = productToDelete;

  try {
    setDeletingId(product.id);

    const isLocalProduct = addedProducts.some(
      (item) => item.id === product.id
    );

    if (!isLocalProduct) {
      await deleteProduct(product.id);
    }

    deleteLocalProduct(product.id);

    setProductToDelete(null);
  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.message ||
        "Failed to delete product. Please try again."
    );
  } finally {
    setDeletingId(null);
  }
};

  // --------------------------------------------------
  // Page change
  // --------------------------------------------------

  const handlePageChange = (
    newPage
  ) => {
    if (
      newPage < 1 ||
      newPage > totalPages
    ) {
      return;
    }

    setPage(newPage);

    updateUrl({
      newPage,
    });
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const handleLogout = () => {
    logoutUser();

    router.replace("/login");
  };

  // --------------------------------------------------
  // Authentication check
  // --------------------------------------------------

  useEffect(() => {
    const token =
      getAccessToken();

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // --------------------------------------------------
  // Pagination numbers
  // --------------------------------------------------

  const pageNumbers = [];

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {
    pageNumbers.push(i);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl">

     
        {/* Header */}


        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage your products
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/products/add"
                )
              }
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              + Add Product
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filters */}
    

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-3">

            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Search
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={
                  handleSearchChange
                }
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={
                  handleCategoryChange
                }
                disabled={
                  Boolean(
                    search.trim()
                  ) ||
                  categoryLoading
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  All Categories
                </option>

                {categories.map(
                  (item) => {
                    const value =
                      typeof item ===
                      "string"
                        ? item
                        : item.slug;

                    const label =
                      typeof item ===
                      "string"
                        ? item
                        : item.name;

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label
                htmlFor="sort"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Sort
              </label>

              <select
                id="sort"
                value={sortBy}
                onChange={
                  handleSortChange
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              >
                <option value="">
                  Default
                </option>

                <option value="price-asc">
                  Price: Low to High
                </option>

                <option value="price-desc">
                  Price: High to Low
                </option>

                <option value="rating-desc">
                  Rating: High to Low
                </option>

                <option value="title-asc">
                  Title: A to Z
                </option>

                <option value="title-desc">
                  Title: Z to A
                </option>
              </select>
            </div>
          </div>

          {search.trim() && (
            <p className="mt-3 text-sm text-gray-500">
              Search is active. Category
              filtering is disabled until
              you clear the search.
            </p>
          )}

          {categoryError && (
            <p className="mt-3 text-sm text-red-600">
              {categoryError}
            </p>
          )}
        </div>

        {/* Loading */}
       

        {loading && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">
              Loading products...
            </p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchProducts}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          displayProducts.length === 0 && (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <h2 className="text-lg font-semibold text-gray-900">
                No products found
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Try changing your search or
                filter.
              </p>
            </div>
          )}

   
        {/* Desktop Table */}
  

        {!loading &&
          !error &&
          displayProducts.length > 0 && (
            <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
              <table className="min-w-225 w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Image
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Title
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

                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayProducts.map(
                    (product) => (
                      <tr
                        key={product.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <img
                            src={
                              product.thumbnail ||
                              "https://dummyjson.com/image/100x100"
                            }
                            alt={
                              product.title
                            }
                            className="h-12 w-12 rounded object-cover"
                          />
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {product.title}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {product.category}
                        </td>

                        <td className="px-4 py-3 text-gray-900">
                          $
                          {product.price}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {product.rating ??
                            "N/A"}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {product.stock ??
                            "N/A"}
                        </td>

                       <td className="px-4 py-3">
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() =>
        router.push(
          `/products/${product.id}`
        )
      }
      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      View
    </button>

    <button
      type="button"
      onClick={() =>
        router.push(
          `/products/${product.id}/edit`
        )
      }
      className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Edit
    </button>
    <button
    onClick={() => setProductToDelete(product)}
    disabled={deletingId === product.id}
    className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {deletingId === product.id ? "Deleting..." : "Delete"}
  </button>
  </div>
</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* Mobile Cards */}

        {!loading &&
          !error &&
          displayProducts.length > 0 && (
            <div className="space-y-4 md:hidden">
              {displayProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="rounded-lg bg-white p-4 shadow"
                  >
                    <div className="flex justify-center rounded-md bg-gray-50 p-4">
                      <img
                        src={
                          product.thumbnail ||
                          "https://dummyjson.com/image/100x100"
                        }
                        alt={
                          product.title
                        }
                        className="h-48 w-full object-contain"
                      />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-gray-900">
                      {product.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {product.category}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        $
                        {product.price}
                      </p>

                      <p className="text-sm text-gray-600">
                        Rating:{" "}
                        {product.rating ??
                          "N/A"}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      Stock:{" "}
                      {product.stock ??
                        "N/A"}
                    </p>

                  <div className="mt-4 flex gap-2">
  <button
    type="button"
    onClick={() =>
      router.push(
        `/products/${product.id}`
      )
    }
    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    View Details
  </button>

  <button
    type="button"
    onClick={() =>
      router.push(
        `/products/${product.id}/edit`
      )
    }
    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
    Edit
  </button>
  <button
    onClick={() => setProductToDelete(product)}
    disabled={deletingId === product.id}
    className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
  >
    {deletingId === product.id ? "Deleting..." : "Delete"}
  </button>
</div>
                  </div>
                )
              )}
            </div>
          )}

     
        {/* Pagination */}
       

        {!loading &&
          !error &&
          totalPages > 0 && (
            <div className="mt-6 flex flex-col gap-4 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">

              {/* Showing text */}
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(
                    skip + 1,
                    totalProducts
                  )}
                </span>{" "}
                –{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(
                    skip +
                      pageSize,
                    totalProducts
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {totalProducts}
                </span>
              </p>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">

                {/* Page size */}
                <select
                  value={pageSize}
                  onChange={
                    handlePageSizeChange
                  }
                  className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700"
                >
                  <option value={10}>
                    10 / page
                  </option>

                  <option value={20}>
                    20 / page
                  </option>

                  <option value={50}>
                    50 / page
                  </option>
                </select>

                {/* Previous */}
                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(
                      page - 1
                    )
                  }
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex flex-wrap gap-1">
                  {pageNumbers.map(
                    (pageNumber) => (
                      <button
                        key={
                          pageNumber
                        }
                        type="button"
                        onClick={() =>
                          handlePageChange(
                            pageNumber
                          )
                        }
                        className={`min-w-9 rounded-md px-3 py-2 text-sm font-medium ${
                          page ===
                          pageNumber
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {
                          pageNumber
                        }
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(
                      page + 1
                    )
                  }
                  disabled={
                    page ===
                    totalPages
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>
      <ConfirmModal
  isOpen={Boolean(productToDelete)}
  title="Delete Product"
  message={
    productToDelete
      ? `Are you sure you want to delete "${productToDelete.title}"? This action cannot be undone.`
      : ""
  }
  confirmText="Delete"
  cancelText="Cancel"
  loading={Boolean(deletingId)}
  onConfirm={handleDelete}
  onCancel={() => setProductToDelete(null)}
/>
    </main>
  );
}