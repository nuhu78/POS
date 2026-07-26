import client from "./client";

export const createSale = (data) => client.post("/sales/", data);
export const listSales = (params) => client.get("/sales/", { params });
