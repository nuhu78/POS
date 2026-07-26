import client from "./client";

export const createSale = (data) => client.post("/sales/", data);
export const listSales = (params) => client.get("/sales/", { params });
export const getSale = (id) => client.get(`/sales/${id}/`);
export const getInvoice = (id) => client.get(`/sales/${id}/invoice/`);
