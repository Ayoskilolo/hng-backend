import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CatFact } from './model/cat.model';
import { AxiosResponse } from 'axios';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}
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
    try {
      const catFactsResponse: AxiosResponse<CatFact> = await firstValueFrom(
        this.httpService.get('https://catfact.ninja/fact'),
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
