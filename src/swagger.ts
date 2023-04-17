import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options, { extraModels: [UserDto] });
  SwaggerModule.setup('api', app, document);
}
