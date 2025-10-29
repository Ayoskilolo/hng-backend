import { Module } from '@nestjs/common';
import { CountryService } from './country.service';
import { CountryController } from './country.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/countries.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Country]),
    HttpModule.register({ timeout: 5000 }),
  ],
  controllers: [CountryController],
  providers: [CountryService],
})
export class CountryModule {}
