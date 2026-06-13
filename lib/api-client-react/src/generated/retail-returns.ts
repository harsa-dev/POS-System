import type { RetailReturnInput, RetailReturnResponse } from "./api.schemas";

import { customFetch } from "../custom-fetch";

export const getRetailPreviewReturnUrl = () => "/api/retail/returns/preview";
export const getRetailPersistReturnUrl = () => "/api/retail/returns";

export const retailPreviewReturn = async (
  retailReturnInput: RetailReturnInput,
  options?: RequestInit,
): Promise<RetailReturnResponse> => {
  return customFetch<RetailReturnResponse>(getRetailPreviewReturnUrl(), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailReturnInput),
  });
};

export const retailPersistReturn = async (
  retailReturnInput: RetailReturnInput,
  options?: RequestInit,
): Promise<RetailReturnResponse> => {
  return customFetch<RetailReturnResponse>(getRetailPersistReturnUrl(), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailReturnInput),
  });
};
