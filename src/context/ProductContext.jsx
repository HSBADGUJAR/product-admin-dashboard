"use client";

import { createContext, useContext, useState } from "react";

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [addedProducts, setAddedProducts] = useState([]);

  const [updatedProducts, setUpdatedProducts] = useState({});

  const [deletedProductIds, setDeletedProductIds] = useState([]);

  const addLocalProduct = (product) => {
    setAddedProducts((previous) => [
      product,
      ...previous,
    ]);
  };

  const updateLocalProduct = (product) => {
    setAddedProducts((previous) => {
      const isLocalProduct = previous.some(
        (item) => item.id === product.id
      );

      if (isLocalProduct) {
        return previous.map((item) =>
          item.id === product.id
            ? product
            : item
        );
      }

      return previous;
    });

    setUpdatedProducts((previous) => ({
      ...previous,
      [product.id]: product,
    }));
  };

  const deleteLocalProduct = (productId) => {
    setDeletedProductIds((previous) => {
      if (previous.includes(productId)) {
        return previous;
      }

      return [
        ...previous,
        productId,
      ];
    });

    setAddedProducts((previous) =>
      previous.filter(
        (product) =>
          product.id !== productId
      )
    );
  };

  return (
    <ProductContext.Provider
      value={{
        addedProducts,
        updatedProducts,
        deletedProductIds,
        addLocalProduct,
        updateLocalProduct,
        deleteLocalProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProductContext must be used inside ProductProvider"
    );
  }

  return context;
}