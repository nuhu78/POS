import client from "./client";

export const listProducts = (params) => client.get("/products/", { params });
export const createProduct = (data) => client.post("/products/", data);
export const updateProduct = (id, data) => client.put(`/products/${id}/`, data);
export const deleteProduct = (id) => client.delete(`/products/${id}/`);
export const getLowStock = () => client.get("/products/low_stock/");
export const exportProducts = () => client.get("/products/export/", { responseType: "blob" });
export const importProducts = (file) => {
  const form = new FormData();
  form.append("file", file);
  return client.post("/products/import/", form);
};
