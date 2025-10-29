export interface Country {
  id: number;
  name: string;
  capital?: string;
  region?: string;
  population: number;
  currency_code: string;
  exchange_rate: number;
  estimated_gdp: number;
  flag_url?: string;
  last_refreshed_at: Date;
}

export interface ExchangeRateResponse {
  rates: { [key: string]: number }[];
}

export interface CountryApiResponse {
  name: string;
  capital?: string;
  region?: string;
  population: number;
  currencies: { code: string; name: string; symbol: string }[];
  flag?: string;
}

export interface StatusResponse {
  total_countries: number;
  last_refreshed_at: string | null;
}

export interface RefreshResponse {
  message: string;
}

export interface CountryFilters {
  region?: string;
  currency?: string;
  sort?: string;
}

export type CountryCreateInput = {
  name: string;
  capital?: string;
  region?: string;
  population: number;
  currencyCode?: string;
  exchangeRate?: number;
  estimatedGdp?: number;
  flagUrl?: string;
};
