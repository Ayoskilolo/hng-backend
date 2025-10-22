import {
  Body,
  Controller,
  Delete,
  Get,
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

  @Get('strings/:value')
  getStringAnalysis(@Param('value') value: string) {
    return this.appService.getStringAnalysis(value);
  }

  @Post('strings')
  analyzeStrings(@Body() { value }: { value: string }) {
    return this.appService.analyzeStrings(value);
  }

  @Get('strings')
  getFilteredStrings(
    @Query('palindrome') palindrome?: string,
    @Query('minLength') minLength?: number,
    @Query('maxLength') maxLength?: number,
    @Query('contains') contains?: string,
  ) {
    return this.appService.getFilteredStrings(
      palindrome,
      minLength,
      maxLength,
      contains,
    );
  }

  @Get('query')
  queryStrings(@Query('q') q: string) {
    return this.appService.queryStrings(q);
  }

  @Delete('strings/:value')
  deleteString(@Param('value') value: string) {
    return this.appService.deleteString(value);
  }
}
