import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  getMe() {
    return this.appService.getMe();
  }

  // @Get('strings/filter-by-natural-language')
  // filterByNaturalLanguage(@Query('query') q: string) {
  //   return this.appService.filterByNaturalLanguage(q);
  // }

  // @Get('strings')
  // getFilteredStrings(
  //   @Query('is_palindrome') palindrome?: boolean,
  //   @Query('min_length') minLength?: number,
  //   @Query('max_length') maxLength?: number,
  //   @Query('word_count') wordCount?: number,
  //   @Query('contains_character') contains?: string,
  // ) {
  //   return this.appService.getFilteredStrings(
  //     palindrome,
  //     minLength,
  //     maxLength,
  //     wordCount,
  //     contains,
  //   );
  // }

  // @Get('strings/:value')
  // getParticularString(@Param('value') value: string) {
  //   return this.appService.getString(value);
  // }

  // @Post('strings')
  // analyzeStrings(@Body() { value }: { value: string }) {
  //   return this.appService.analyzeStrings(value);
  // }

  // @Delete('strings/:value')
  // @HttpCode(204)
  // deleteString(@Param('value') value: string) {
  //   return this.appService.deleteString(value);
  // }
}
