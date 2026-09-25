"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  getProductById,
  updateProduct,
} from "@/services/productApi";

import { useProductContext } from "@/context/ProductContext";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = Number(params.id);

  const {
    addedProducts,
    updatedProducts,
    deletedProductIds,
    updateLocalProduct,
  } = useProductContext();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    thumbnail: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [productExists, setProductExists] =
    useState(true);

  // -----------------------------------------
  // Find product
  // -----------------------------------------

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setApiError("");

        if (
          !Number.isInteger(productId) ||
          productId <= 0
        ) {
          setProductExists(false);
          return;
        }

        // -----------------------------------------
        // Check locally added product
        // -----------------------------------------

        const localProduct =
          addedProducts.find(
            (product) =>
              product.id === productId
          );

        if (localProduct) {
          setFormData({
            title: localProduct.title || "",
            category:
              localProduct.category || "",
            price:
              localProduct.price ?? "",
            stock:
              localProduct.stock ?? "",
            description:
              localProduct.description || "",
            thumbnail:
              localProduct.thumbnail || "",
          });

          return;
        }

        // -----------------------------------------
        // Check locally updated product
        // -----------------------------------------

        const locallyUpdatedProduct =
          updatedProducts[productId];

        if (locallyUpdatedProduct) {
          setFormData({
            title:
              locallyUpdatedProduct.title || "",
            category:
              locallyUpdatedProduct.category ||
              "",
            price:
              locallyUpdatedProduct.price ?? "",
            stock:
              locallyUpdatedProduct.stock ?? "",
            description:
              locallyUpdatedProduct.description ||
              "",
            thumbnail:
              locallyUpdatedProduct.thumbnail ||
              "",
          });

          return;
        }

        // -----------------------------------------
        // Check deleted product
        // -----------------------------------------

        if (
          deletedProductIds.includes(
            productId
          )
        ) {
          setProductExists(false);
          return;
        }

        // -----------------------------------------
        // Get from API
        // -----------------------------------------

        const product =
          await getProductById(productId);

        setFormData({
          title: product.title || "",
          category: product.category || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          description:
            product.description || "",
          thumbnail:
            product.thumbnail || "",
        });
      } catch (error) {
        console.error(error);

        setProductExists(false);
        setApiError(
          error.response?.data?.message ||
            "Product not found."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [
    productId,
    addedProducts,
    updatedProducts,
    deletedProductIds,
  ]);

  // -----------------------------------------
  // Handle input changes
  // -----------------------------------------

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setApiError("");
  };

  // -----------------------------------------
  // Validation
  // -----------------------------------------

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title =
        "Product title is required";
    }

    if (!formData.category.trim()) {
      newErrors.category =
        "Category is required";
    }

    if (formData.price === "") {
      newErrors.price =
        "Price is required";
    } else if (
      Number.isNaN(
        Number(formData.price)
      ) ||
      Number(formData.price) <= 0
    ) {
      newErrors.price =
        "Price must be greater than 0";
    }

    if (formData.stock === "") {
      newErrors.stock =
        "Stock is required";
    } else if (
      !Number.isInteger(
        Number(formData.stock)
      ) ||
      Number(formData.stock) < 0
    ) {
      newErrors.stock =
        "Stock must be a valid non-negative number";
    }

    if (!formData.description.trim()) {
      newErrors.description =
        "Description is required";
    }

    return newErrors;
  };

  // -----------------------------------------
  // Save
  // -----------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setApiError("");

    const validationErrors =
      validateForm();

    if (
      Object.keys(validationErrors)
        .length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);

      const productData = {
        title:
          formData.title.trim(),

        category:
          formData.category.trim(),

        price:
          Number(formData.price),

        stock:
          Number(formData.stock),

        description:
          formData.description.trim(),
      };

      if (
        formData.thumbnail.trim()
      ) {
        productData.thumbnail =
          formData.thumbnail.trim();
      }

      // -----------------------------------------
      // Check whether this is a locally added
      // product
      // -----------------------------------------

      const isLocalProduct =
        addedProducts.some(
          (product) =>
            product.id === productId
        );

      let savedProduct;

      if (isLocalProduct) {
        /*
         * This product only exists inside our
         * application because DummyJSON does not
         * permanently store POST mutations.
         *
         * Therefore we update it directly in
         * ProductContext.
         */

        const existingProduct =
          addedProducts.find(
            (product) =>
              product.id === productId
          );

        savedProduct = {
          ...existingProduct,
          ...productData,
        };
      } else {
        /*
         * Existing API product.
         *
         * DummyJSON accepts the PUT request and
         * returns the updated product.
         */

        savedProduct =
          await updateProduct(
            productId,
            productData
          );
      }

      // -----------------------------------------
      // Update application state
      // -----------------------------------------

      updateLocalProduct(
        savedProduct
      );

      // -----------------------------------------
      // Go to product details
      // -----------------------------------------

      router.push(
        `/products/${productId}`
      );
    } catch (error) {
      console.error(error);

      setApiError(
        error.response?.data?.message ||
          "Failed to update product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // Loading
  // -----------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-3xl">
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
  // Product not found
  // -----------------------------------------

  if (!productExists) {
    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="text-xl font-bold text-gray-900">
              Product Not Found
            </h1>

            <p className="mt-2 text-gray-600">
              {apiError ||
                "The requested product does not exist."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/products"
                )
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

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-3xl">

        {/* Back */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/products/${productId}`
            )
          }
          className="mb-4 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Product
        </button>

        {/* Form */}

        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Product
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Update product information.
          </p>

          {apiError && (
            <div className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            {/* Title */}

            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Product Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter product title"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              />

              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category */}

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                value={
                  formData.category
                }
                onChange={handleChange}
                placeholder="Enter category"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              />

              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category}
                </p>
              )}
            </div>

            {/* Price + Stock */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                />

                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Stock
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Enter stock"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                />

                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.stock}
                  </p>
                )}
              </div>

            </div>

            {/* Description */}

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={5}
                value={
                  formData.description
                }
                onChange={handleChange}
                placeholder="Enter product description"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Image */}

            <div>
              <label
                htmlFor="thumbnail"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Product Image URL
              </label>

              <input
                id="thumbnail"
                name="thumbnail"
                type="url"
                value={
                  formData.thumbnail
                }
                onChange={handleChange}
                placeholder="https://example.com/product-image.jpg"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              />

              <p className="mt-1 text-xs text-gray-500">
                Enter a publicly accessible
                image URL.
              </p>
            </div>

            {/* Buttons */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/products/${productId}`
                  )
                }
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          </form>
        </div>
      </div>
    </main>
  );
}