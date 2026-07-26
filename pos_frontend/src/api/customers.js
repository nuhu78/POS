import client from "./client";

export const listCustomers = (params) => client.get("/customers/", { params });
export const createCustomer = (data) => client.post("/customers/", data);
export const updateCustomer = (id, data) => client.put(`/customers/${id}/`, data);
export const deleteCustomer = (id) => client.delete(`/customers/${id}/`);
export const getPurchaseHistory = (id) => client.get(`/customers/${id}/purchase_history/`);
