import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class DemoService {
  greetings: string[] = [];

  constructor(@Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka) {}

  async onModuleInit() {
    // Connects to the broker immediately when the app starts
    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  sendName(name: string) {
    this.kafkaClient.emit('name', name);
  }

  addGreeting(greeting: string) {
    this.greetings.push(greeting);
    console.log(`Greeting added: ${this.greetings}`);
  }

  getGreetings() {
    return this.greetings;
  }
}
