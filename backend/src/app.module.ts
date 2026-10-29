import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './domains/auth/auth.module';
import { DemoModule } from './domains/demo/demo.module';
import { HackathonsModule } from './domains/hackathons/hackathons.module';
import { EmailModule } from './shared/email/email.module';
import { UserModule } from './users/user.module';

// Configures the application by loading environment variables globally, establishing the PostgreSQL
// database connection through TypeORM with automatic entity loading and migrations required for schema
// changes, and importing the authentication and email modules. The AppController and AppService handle
// the application's base endpoints and services.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,

      autoLoadEntities: true,
      synchronize: false,
    }),
    AuthModule,
    EmailModule,
    DemoModule,
    HackathonsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
