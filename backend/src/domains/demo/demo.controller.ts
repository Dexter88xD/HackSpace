import { Controller, Get, Post, Body } from '@nestjs/common';
import { DemoService } from './demo.service';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @EventPattern('greeting')
  handleGreeting(
    @Payload() message: string,
    @Ctx() context: KafkaContext
  ) {
    // NestJS automatically parses the JSON payload for you
    console.log(`Received message payload:`, message);

    this.demoService.addGreeting(message);
  }

  @Get('greetings')
  getGreetings() {
    return this.demoService.getGreetings();
  }

  @Post('send-name')
  sendName(@Body('name') name: string) {
    this.demoService.sendName(name);
    return { message: `Name ${name} sent to Kafka topic.` };
  }
}
