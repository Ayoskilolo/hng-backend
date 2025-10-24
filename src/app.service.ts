import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CatFact } from './model/cat.model';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  NaturalLanguageResponse,
  ParsedFilters,
} from './dto/natural-language-response.dto';

interface StringAnalysis {
  value: string;
  length: number;
  wordCount: number;
  palindrome: boolean;
  uniqueChars: number;
  freq: { [key: string]: number };
  hash: string;
}

@Injectable()
export class AppService {
  public readonly stringStore = new Map<string, any>();

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

  getString(value: string) {
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

    if (this.stringStore.has(value)) {
      throw new HttpException(
        'String already exists in the system',
        HttpStatus.CONFLICT,
      );
    }

    const processed = this.processString(value);
    const response = {
      id: processed.sha256_hash,
      value,
      properties: processed,
      created_at: new Date().toISOString(),
    };

    this.stringStore.set(value, response);

    return response;
  }

  processString(value: string) {
    const length = value.length;
    const words = value.trim().split(/\s+/).filter(Boolean);
    const word_count = words.length;
    const reversed = value.split('').reverse().join('');
    const is_palindrome = value === reversed;
    const unique_characters = new Set(value).size;
    const character_frequency_map: { [key: string]: number } = {};

    for (const ch of value) {
      character_frequency_map[ch] = (character_frequency_map[ch] || 0) + 1;
    }
    const sha256_hash = createHash('sha256').update(value).digest('hex');

    return {
      length,
      is_palindrome,
      unique_characters,
      word_count,
      sha256_hash,
      character_frequency_map,
    };
  }

  getFilteredStrings(
    palindrome?: boolean,
    minLength?: number,
    maxLength?: number,
    wordCount?: number,
    contains?: string,
  ) {
    try {
      let results = Array.from(this.stringStore.values());

      const filters_applied = {
        is_palindrome: palindrome,
        min_length: minLength,
        max_length: maxLength,
        word_count: wordCount,
        contains_character: contains,
      };

      if (palindrome !== undefined) {
        results = results.filter((r: any) => {
          return r.properties.is_palindrome === Boolean(palindrome);
        });
      }

      if (minLength) {
        results = results.filter(
          (r: any) => r.properties.length >= Number(minLength),
        );
      }

      if (maxLength) {
        results = results.filter(
          (r: any) => r.properties.length <= Number(maxLength),
        );
      }
      if (contains) {
        results = results.filter((r: any) => r.value.includes(contains));
      }

      return {
        data: results,
        count: results.length,
        filters_applied: filters_applied,
      };
    } catch {
      throw new HttpException(
        'Invalid query parameter values or type',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  filterByNaturalLanguage(query: string) {
    if (!query) {
      throw new HttpException('Missing query', HttpStatus.BAD_REQUEST);
    }

    const lower = query.toLowerCase();
    let results = Array.from(this.stringStore.values());
    const parsedFilters: {
      word_count?: number;
      is_palindrome?: boolean;
      min_length?: number;
      max_length?: number;
      contains_character?: string;
    } = {};

    try {
      // Parse word count filter
      if (lower.includes('single word')) {
        parsedFilters.word_count = 1;
        results = results.filter((r) => r.properties.word_count === 1);
      }

      // Parse palindrome filter
      if (lower.includes('palindrome') || lower.includes('palindromic')) {
        parsedFilters.is_palindrome = true;
        results = results.filter((r) => r.properties.is_palindrome);
      }

      // Parse length filters
      const longerThanMatch = lower.match(/longer than (\d+)/);
      if (longerThanMatch) {
        const n = parseInt(longerThanMatch[1]);
        if (isNaN(n)) {
          throw new HttpException(
            'Invalid number in query',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        parsedFilters.min_length = n + 1;
        results = results.filter((r) => r.properties.length > n);
      }

      const shorterThanMatch = lower.match(/shorter than (\d+)/);
      if (shorterThanMatch) {
        const n = parseInt(shorterThanMatch[1]);
        if (isNaN(n)) {
          throw new HttpException(
            'Invalid number in query',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        parsedFilters.max_length = n - 1;
        results = results.filter((r) => r.properties.length < n);
      }

      // Parse character containment
      const containsMatch = lower.match(
        /contain(?:s|ing) (?:the )?(?:letter )?([a-z])/,
      );
      if (containsMatch) {
        const char = containsMatch[1];
        parsedFilters.contains_character = char;
        results = results.filter((r) => r.value.includes(char));
      }

      // Special case for first vowel
      if (lower.includes('first vowel')) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        for (const vowel of vowels) {
          if (results.some((r) => r.value.includes(vowel))) {
            parsedFilters.contains_character = vowel;
            results = results.filter((r) => r.value.includes(vowel));
            break;
          }
        }
      }

      // Check for conflicting filters
      if (
        parsedFilters.min_length &&
        parsedFilters.max_length &&
        parsedFilters.min_length > parsedFilters.max_length
      ) {
        throw new HttpException(
          'Query parsed but resulted in conflicting filters',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // If no filters were applied, the query couldn't be interpreted
      if (Object.keys(parsedFilters).length === 0) {
        throw new HttpException(
          'Unable to parse natural language query',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        data: results,
        count: results.length,
        interpreted_query: {
          original: query,
          parsed_filters: parsedFilters,
        },
      };
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

    return;
  }
}
