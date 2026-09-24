
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getProducts } from "@/services/productApi";
import { getAccessToken, logoutUser } from "@/utils/auth";

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();

      setProducts(data.products);
    } catch (error) {
      console.error(error);

      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading products...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          Product Admin Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <section className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Products
          </h2>

          <p className="mt-1 text-gray-600">
            Manage your products from here.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            <p>{error}</p>

            <button
              onClick={fetchProducts}
              className="mt-2 font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {!error && products.length === 0 && (
          <div className="rounded-md bg-white p-6 text-center">
            <p className="text-gray-600">
              No products found.
            </p>
          </div>
        )}

       
{!error && products.length > 0 && (
  <>
    {/* Desktop Table */}
    <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
      <table className="w-full min-w-200">
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
            <tr
              key={product.id}
              className="border-b last:border-b-0"
            >
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

    {/* Mobile Cards */}
    <div className="space-y-4 md:hidden">
      {products.map((product) => (
        <div
          key={product.id}
          className="rounded-lg bg-white p-4 shadow"
        >
          {/* Product Information */}
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

          {/* Product Details */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
            <div>
              <p className="text-xs text-gray-500">
                Price
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                ${product.price}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Rating
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {product.rating}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Stock
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {product.stock}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}


      </section>
    </main>
  );
}

