import { Inject, Injectable } from '@nestjs/common';
import { CreateDemoDto } from './dto/create-demo.dto';
import { UpdateDemoDto } from './dto/update-demo.dto';
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

  create(createDemoDto: CreateDemoDto) {
    return 'This action adds a new demo';
  }

  findAll() {
    return `This action returns all demo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} demo`;
  }

  update(id: number, updateDemoDto: UpdateDemoDto) {
    return `This action updates a #${id} demo`;
  }

  remove(id: number) {
    return `This action removes a #${id} demo`;
  }
}
