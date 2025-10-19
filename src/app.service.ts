import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CatFact } from './model/cat.model';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
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
}
