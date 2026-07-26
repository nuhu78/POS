import client from "./client";

export const getDashboard = () => client.get("/reports/dashboard/");
export const getDailySales = (params) => client.get("/reports/daily/", { params });
export const getMonthlySales = (params) => client.get("/reports/monthly/", { params });
export const getProductSales = (params) => client.get("/reports/products/", { params });
export const getBestSellers = (params) => client.get("/reports/best-sellers/", { params });
