const publicCartKey = "care4petsPublicCart";

export const getPublicCart = () => {
  try {
    return JSON.parse(localStorage.getItem(publicCartKey) || "[]");
  } catch {
    return [];
  }
};

export const savePublicCart = (items) => {
  localStorage.setItem(publicCartKey, JSON.stringify(items));
  window.dispatchEvent(new Event("public-cart-updated"));
};

export const addPublicCartItem = (product) => {
  const productId = product?._id || product?.id;
  if (!productId) return [];

  const items = getPublicCart();
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      productId,
      quantity: 1,
      product: {
        _id: productId,
        productName: product.productName || product.name || "Product",
        images: product.images || [],
        price: product.price || 0,
        discountPrice: product.discountPrice,
        stock: product.stock || 0,
        brand: product.brand || "",
      },
    });
  }

  savePublicCart(items);
  return items;
};

export const updatePublicCartItem = (productId, quantity) => {
  const items = getPublicCart()
    .map((item) => (item.productId === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  savePublicCart(items);
  return items;
};

export const removePublicCartItem = (productId) => {
  const items = getPublicCart().filter((item) => item.productId !== productId);
  savePublicCart(items);
  return items;
};

export const clearPublicCart = () => {
  savePublicCart([]);
};
