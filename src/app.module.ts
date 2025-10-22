import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
// import * as Joi from 'joi';
import catConfig from 'config/cat.config';

@Module({
  imports: [
    HttpModule.register({ timeout: 5000 }),
    ConfigModule.forRoot({
      // validationSchema: Joi.object({ catAPI: Joi.string().uri().required() }),
      isGlobal: true,
      load: [catConfig],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
