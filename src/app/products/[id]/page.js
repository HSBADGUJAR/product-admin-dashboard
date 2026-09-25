"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getProductById } from "@/services/productApi";
import { useProductContext } from "@/context/ProductContext";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const {
    addedProducts,
    updatedProducts,
    deletedProductIds,
  } = useProductContext();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const productId = Number(params.id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------
        // 1. Check if product was locally added
        // -----------------------------------------

        const localProduct = addedProducts.find(
          (item) => item.id === productId
        );

        if (localProduct) {
          setProduct(localProduct);
          setSelectedImage(
            localProduct.thumbnail ||
              localProduct.images?.[0] ||
              ""
          );

          return;
        }

        // -----------------------------------------
        // 2. Check if product was locally updated
        // -----------------------------------------

        const updatedProduct =
          updatedProducts[productId];

        if (updatedProduct) {
          setProduct(updatedProduct);
          setSelectedImage(
            updatedProduct.thumbnail ||
              updatedProduct.images?.[0] ||
              ""
          );

          return;
        }

        // -----------------------------------------
        // 3. Check if product was locally deleted
        // -----------------------------------------

        if (
          deletedProductIds.includes(productId)
        ) {
          setProduct(null);
          setError(
            "This product is no longer available."
          );

          return;
        }

        // -----------------------------------------
        // 4. Otherwise get product from API
        // -----------------------------------------

        const data =
          await getProductById(productId);

        setProduct(data);

        setSelectedImage(
          data.thumbnail ||
            data.images?.[0] ||
            ""
        );
      } catch (error) {
        console.error(error);

        setProduct(null);

        setError(
          error.response?.data?.message ||
            "Product not found."
        );
      } finally {
        setLoading(false);
      }
    };

    if (
      Number.isInteger(productId) &&
      productId > 0
    ) {
      fetchProduct();
    } else {
      setLoading(false);
      setError("Invalid product ID.");
    }
  }, [
    productId,
    addedProducts,
    updatedProducts,
    deletedProductIds,
  ]);

  // -----------------------------------------
  // Loading
  // -----------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-gray-600">
              Loading product...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // -----------------------------------------
  // Error / Not Found
  // -----------------------------------------

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="text-xl font-bold text-gray-900">
              Product Not Found
            </h1>

            <p className="mt-2 text-gray-600">
              {error ||
                "The requested product does not exist."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/products")
              }
              className="mt-5 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  // -----------------------------------------
  // Product images
  // -----------------------------------------

 const productImages = [
  ...(product.thumbnail
    ? [product.thumbnail]
    : []),

  ...(product.images || []).filter(
    (image) => image !== product.thumbnail
  ),
];

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-5xl">

        {/* Back button */}

        <button
          type="button"
          onClick={() =>
            router.push("/products")
          }
          className="mb-4 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Products
        </button>

        {/* Product */}

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="grid gap-8 md:grid-cols-2">

            {/* -------------------------------- */}
            {/* Images */}
            {/* -------------------------------- */}

            <div>
              {/* Main Image */}

              <div className="flex h-96 items-center justify-center rounded-lg bg-gray-50 p-6">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="max-h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-gray-500">
                    No image available
                  </p>
                )}
              </div>

              {/* Thumbnails */}

              {productImages.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {productImages.map(
                    (image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            image
                          )
                        }
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-md border-2 bg-white p-1 ${
                          selectedImage === image
                            ? "border-blue-600"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.title} ${
                            index + 1
                          }`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* -------------------------------- */}
            {/* Product Information */}
            {/* -------------------------------- */}

            <div>
              <p className="text-sm font-medium uppercase text-blue-600">
                {product.category}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {product.title}
              </h1>

              <p className="mt-4 text-gray-600">
                {product.description}
              </p>

              <div className="mt-6">
                <p className="text-3xl font-bold text-gray-900">
                  ${product.price}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Rating:{" "}
                  {product.rating ?? "N/A"}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Stock:{" "}
                  {product.stock ?? "N/A"}
                </p>
              </div>

              <div className="mt-6 border-t pt-5">
                <p className="text-sm text-gray-600">
                  Brand
                </p>

                <p className="font-medium text-gray-900">
                  {product.brand || "N/A"}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  SKU
                </p>

                <p className="font-medium text-gray-900">
                  {product.sku || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

     
        {/* Reviews */}
       

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Reviews
          </h2>

          {!product.reviews ||
          product.reviews.length === 0 ? (
            <p className="mt-4 text-gray-600">
              No reviews available.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {product.reviews.map(
                (review, index) => (
                  <div
                    key={`${review.reviewerEmail}-${index}`}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {review.reviewerName}
                      </p>

                      <p className="text-sm text-gray-600">
                        Rating:{" "}
                        {review.rating}/5
                      </p>
                    </div>

                    <p className="mt-2 text-gray-700">
                      {review.comment}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(
                        review.date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}