import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

// Creates the Nest application, configures Swagger/OpenAPI documentation with the HackSpace API metadata
// and exposes it at /api, enables global request validation with whitelist/forbidNonWhitelisted to reject
// unexpected fields, enables CORS for the React frontend running on localhost:5173, and starts the server
// using the configured PORT or 3000 as the default.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('HackSpace API')
    .setDescription('HackSpace backend API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  // 1. Configure the consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKER || 'broker:9092'] },
      consumer: { groupId: 'demo-consumer-group' },
    },
  });

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
