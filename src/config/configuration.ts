import { registerAs } from '@nestjs/config';

export default registerAs('init', () => ({
  catAPI: process.env.CAT_FACT_API,
  api: {
    countriesUrl: process.env.COUNTRIES_API,
    exchangeRateUrl: process.env.EXCHANGE_RATE_API,
  },
}));
