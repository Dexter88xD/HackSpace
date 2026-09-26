import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { logLevel } from '@nestjs/microservices/external/kafka.interface';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'demo-producer',
            brokers: [process.env.KAFKA_BROKER!],
            // logLevel: logLevel.DEBUG,
          },
          producer: {
            allowAutoTopicCreation: true,
          },
          consumer: {
            groupId: 'demo-consumer-group',
          },
          subscribe: {
            fromBeginning: true,
          },
        },
      },
    ]),
  ],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
