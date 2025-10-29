import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Country } from './entities/countries.entity';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { AxiosError, AxiosResponse } from 'axios';
import {
  ExchangeRateResponse,
  CountryApiResponse,
  RefreshResponse,
  CountryFilters,
} from './dto/country.interface';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private readonly logger = new Logger(CountryService.name);

  private getRandomMultiplier(): number {
    return Math.random() * (2000 - 1000) + 1000;
  }

  async refreshCountries(): Promise<RefreshResponse> {
    try {
      const countriesUrl = this.configService.get<string>(
        'init.api.countriesUrl',
      );
      const exchangeRateUrl = this.configService.get<string>(
        'init.api.exchangeRateUrl',
      );

      if (!countriesUrl || !exchangeRateUrl) {
        throw new HttpException(
          'API URLs not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Fetch countries data
      const countriesResponse: AxiosResponse<CountryApiResponse[]> =
        await firstValueFrom(
          this.httpService.get<CountryApiResponse[]>(countriesUrl),
        );

      // Fetch exchange rates
      const exchangeRatesResponse: AxiosResponse<ExchangeRateResponse> =
        await firstValueFrom(
          this.httpService.get<ExchangeRateResponse>(exchangeRateUrl),
        );

      const rates = exchangeRatesResponse.data.rates;

      let values: any = [];

      // Process and save each country
      for (const countryData of countriesResponse.data) {
        const currencyCode = countryData.currencies?.[0]?.code;

        const exchangeRate = currencyCode ? rates[currencyCode] : null;
        const multiplier = this.getRandomMultiplier();
        const estimatedGdp = exchangeRate
          ? (countryData.population * multiplier) / exchangeRate
          : null;

        values.push({
          name: countryData.name,
          capital: countryData.capital,
          region: countryData.region,
          population: countryData.population,
          currency_code: currencyCode,
          exchange_rate: exchangeRate,
          estimated_gdp: estimatedGdp,
          flag_url: countryData.flag,
          last_refreshed_at: new Date(),
        });
      }

      try {
        await this.countryRepository.save(values);
      } catch (error) {
        this.logger.warn(`Unable to refresh the  country values`);
        this.logger.error(error);
      }

      // Generate summary image
      await this.generateSummaryImage();

      return { message: 'Countries data refreshed successfully' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof AxiosError
          ? error.config?.url || 'external API'
          : 'external API';

      throw new HttpException(
        {
          error: 'External data source unavailable',
          details: `Could not fetch data from ${errorMessage}`,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findAll(filters: CountryFilters): Promise<Country[]> {
    const query = this.countryRepository.createQueryBuilder('country');

    if (filters.region) {
      query.andWhere('country.region = :region', { region: filters.region });
    }

    if (filters.currency) {
      query.andWhere('country.currency_code = :currency', {
        currency: filters.currency,
      });
    }

    if (filters.sort === 'gdp_desc') {
      query.orderBy('country.estimated_gdp', 'DESC');
    }

    return query.getMany();
  }

  async findOne(name: string) {
    const country = await this.countryRepository.findOne({
      where: { name: Like(`%${name}%`) },
    });

    if (!country) {
      throw new HttpException('Country not found', HttpStatus.NOT_FOUND);
    }

    return country;
  }

  async remove(name: string) {
    const country = await this.findOne(name);
    await this.countryRepository.remove(country);
    return { message: 'Country deleted successfully' };
  }

  async getStatus() {
    const [totalCountries, lastRefreshed] = await Promise.all([
      this.countryRepository.count(),
      this.countryRepository
        .createQueryBuilder('country')
        .select('MAX(country.last_refreshed_at)', 'lastRefreshed')
        .getRawOne(),
    ]);

    return {
      total_countries: totalCountries,
      last_refreshed_at: lastRefreshed?.lastRefreshed || null,
    };
  }

  private async generateSummaryImage(): Promise<void> {
    try {
      const status = await this.getStatus();
      const topCountries = await this.countryRepository.find({
        order: { estimated_gdp: 'DESC' },
        take: 5,
      });

      const text = [
        `Total Countries: ${status.total_countries}`,
        '\nTop 5 Countries by GDP:',
        ...topCountries.map(
          (c, i) =>
            `${i + 1}. ${c.name}: $${c.estimated_gdp?.toString() || 'N/A'}`,
        ),
        `\nLast Refreshed: ${status.last_refreshed_at}`,
      ].join('\n');

      const svg = `
        <svg width="800" height="600">
          <style>
            .text { fill: black; font-family: Arial; font-size: 14px; }
          </style>
          <text x="20" y="20" class="text">${text}</text>
        </svg>`;

      const imagePath = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(imagePath)) {
        fs.mkdirSync(imagePath, { recursive: true });
      }

      const sharpInstance = sharp(Buffer.from(svg)) as sharp.Sharp;
      await sharpInstance.png().toFile(path.join(imagePath, 'summary.png'));
    } catch (error) {
      console.error('Error generating summary image:', error);
    }
  }

  async getSummaryImage(): Promise<string> {
    const imagePath = path.join(process.cwd(), 'cache', 'summary.png');

    if (!fs.existsSync(imagePath)) {
      throw new HttpException('Summary image not found', HttpStatus.NOT_FOUND);
    }

    return imagePath;
  }
}
