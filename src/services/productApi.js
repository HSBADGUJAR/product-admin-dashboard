
import api from "@/lib/axios";

export const getProducts = async () => {
  const response = await api.get("/products");

  return response.data;
};
