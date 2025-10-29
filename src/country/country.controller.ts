import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CountryService } from './country.service';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post('refresh')
  refresh() {
    return this.countryService.refreshCountries();
  }

  @Get()
  findAll(
    @Query('region') region?: string,
    @Query('currency') currency?: string,
    @Query('sort') sort?: string,
  ) {
    return this.countryService.findAll({ region, currency, sort });
  }

  @Get('status')
  getStatus() {
    return this.countryService.getStatus();
  }

  @Get('image')
  async getSummaryImage(@Res() res: Response) {
    const imagePath = await this.countryService.getSummaryImage();
    return res.sendFile(imagePath);
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.countryService.findOne(name);
  }

  @Delete(':name')
  remove(@Param('name') name: string) {
    return this.countryService.remove(name);
  }
}
