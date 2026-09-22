import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DemoService } from './demo.service';
import { CreateDemoDto } from './dto/create-demo.dto';
import { UpdateDemoDto } from './dto/update-demo.dto';
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

  @Post()
  create(@Body() createDemoDto: CreateDemoDto) {
    return this.demoService.create(createDemoDto);
  }

  @Get()
  findAll() {
    return this.demoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.demoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDemoDto: UpdateDemoDto) {
    return this.demoService.update(+id, updateDemoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demoService.remove(+id);
  }
}
