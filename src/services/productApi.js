import api from "@/lib/axios";

export const getProducts = async ({
  limit,
  skip,
  search = "",
  category = "",
  sortBy = "",
  order = "",
  delay = 0,
}) => {
  let url = "/products";

  // Search has priority over category
  if (search.trim()) {
    url = "/products/search";
  } else if (category) {
    url = `/products/category/${category}`;
  }

  const params = {
    limit,
    skip,
  };

  // Search
  if (search.trim()) {
    params.q = search.trim();
  }

  // Sort
  if (sortBy && order) {
    params.sortBy = sortBy;
    params.order = order;
  }

  // Only used for testing slow API responses
  if (delay > 0) {
    params.delay = delay;
  }

  const response = await api.get(url, {
    params,
  });

  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/products/categories");

  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);

  return response.data;
};

export const addProduct = async (productData) => {
  const response = await api.post("/products/add", productData);

  return response.data;
};


export const updateProduct = async (
  id,
  productData
) => {
  const response = await api.put(
    `/products/${id}`,
    productData
  );

  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};