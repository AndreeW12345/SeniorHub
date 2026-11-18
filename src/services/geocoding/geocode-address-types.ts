export type GeocodeAddressInput = {
  placeName: string;
  city: string;
  street?: string;
  postalCode?: string;
};

export type GeocodeAddressSuccess = {
  fullAddress: string;
  latitude: number;
  longitude: number;
};

export type GeocodeAddressResult =
  | ({ ok: true } & GeocodeAddressSuccess)
  | { ok: false; errorMessage: string };