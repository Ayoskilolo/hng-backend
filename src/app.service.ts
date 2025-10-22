import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CatFact } from './model/cat.model';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

@Injectable()
export class AppService {
  private readonly stringStore = new Map<
    string,
    {
      value: string;
      length: number;
      wordCount: number;
      palindrome: boolean;
      uniqueChars: number;
      freq: { [key: string]: number };
      hash: string;
    }
  >();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async getMe() {
    const catFact: CatFact = await this.getCatFact();

    const response = {
      status: 'success',
      user: {
        email: 'ayomideninuoluwa.afolabi@gmail.com',
        name: 'Ayomide Afolabi',
        stack: 'NestJS | NodeJS | TypeScript',
      },
      timestamp: new Date().toISOString(),
      fact: catFact.fact,
    };

    return response;
  }

  async getCatFact() {
    const catApiUrl = this.configService.get<string>('catAPI');

    if (!catApiUrl) {
      throw new HttpException(
        'Cat API URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const catFactsResponse: AxiosResponse<CatFact> = await firstValueFrom(
        this.httpService.get(catApiUrl),
      );

      const responseData: CatFact = catFactsResponse.data;
      return responseData;
    } catch (error) {
      console.error('Error fetching cat fact:', error);
      throw new HttpException(
        'Failed to fetch cat fact',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  getStringAnalysis(value: string) {
    if (!this.stringStore.has(value)) {
      throw new HttpException('String not found', HttpStatus.NOT_FOUND);
    }

    return this.stringStore.get(value);
  }

  analyzeStrings(value: string) {
    if (value === undefined) {
      throw new HttpException('No value provided', HttpStatus.BAD_REQUEST);
    }

    if (typeof value !== 'string') {
      throw new HttpException(
        'Value type is not string',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (value.length === 1) {
      throw new HttpException(
        'valueing already exists in the system',
        HttpStatus.CONFLICT,
      );
    }

    const processed = this.processString(value);
    this.stringStore.set(value, processed);

    return processed;
  }

  processString(value: string): {
    value: string;
    length: number;
    wordCount: number;
    palindrome: boolean;
    uniqueChars: number;
    freq: { [key: string]: number };
    hash: string;
  } {
    const length = value.length;
    const words = value.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const reversed = value.split('').reverse().join('');
    const palindrome = value === reversed;
    const uniqueChars = new Set(value).size;
    const freq: { [key: string]: number } = {};

    for (const ch of value) {
      freq[ch] = (freq[ch] || 0) + 1;
    }
    const hash = createHash('sha256').update(value).digest('hex');

    return {
      value: value,
      length,
      wordCount,
      palindrome,
      uniqueChars,
      freq,
      hash,
    };
  }

  getFilteredStrings(
    palindrome?: string,
    minLength?: number,
    maxLength?: number,
    contains?: string,
  ) {
    try {
      let results = Array.from(this.stringStore.values());

      if (palindrome !== undefined) {
        results = results.filter(
          (r: any) => r.palindrome === (palindrome === 'true'),
        );
      }
      if (minLength) {
        results = results.filter((r: any) => r.length >= Number(minLength));
      }
      if (maxLength) {
        results = results.filter((r: any) => r.length <= Number(maxLength));
      }
      if (contains) {
        results = results.filter((r: any) => r.value.includes(contains));
      }

      return results;
    } catch {
      throw new HttpException(
        'Invalid query parameters',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  queryStrings(q: string) {
    if (!q) {
      throw new HttpException('Missing query', HttpStatus.BAD_REQUEST);
    }

    const lower = q.toLowerCase();
    let results = Array.from(this.stringStore.values());

    try {
      if (lower.includes('palindrome')) {
        results = results.filter((r) => r.palindrome);
      } else if (lower.includes('longer than')) {
        const match = lower.match(/longer than (\d+)/);
        if (!match) {
          throw new HttpException(
            'Invalid number in query',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        const n = parseInt(match[1]);
        if (isNaN(n)) {
          throw new HttpException(
            'Invalid number in query',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        results = results.filter((r) => r.length > n);
      } else if (lower.includes('shorter than')) {
        const match = lower.match(/shorter than (\d+)/);
        if (!match) {
          throw new HttpException(
            'Invalid number in query',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        const n = parseInt(match[1]);
        if (isNaN(n)) {
          throw new HttpException(
            'Invalid number in query',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        results = results.filter((r) => r.length < n);
      } else if (lower.includes('single word')) {
        results = results.filter((r) => r.wordCount === 1);
      } else {
        throw new HttpException(
          'Could not interpret query',
          HttpStatus.BAD_REQUEST,
        );
      }

      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error processing query',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  deleteString(value: string) {
    if (!this.stringStore.has(value)) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    this.stringStore.delete(value);
  }
}
