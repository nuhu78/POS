import client from "./client";

export const getSettings = () => client.get("/shop-settings/");
export const updateSettings = (data) => client.put("/shop-settings/", data);
