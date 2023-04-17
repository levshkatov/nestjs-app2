import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NatsOptions, Transport } from '@nestjs/microservices';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { credential, initializeApp, ServiceAccount } from 'firebase-admin';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as responseTime from 'response-time';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as serviceAccount from '../../firebase.json';
import { AppModule } from './app.module';
import { ErrorInterceptor } from './error.interceptor';
import { setupSwagger } from './swagger';

const fbCert: ServiceAccount = {
  projectId: serviceAccount.project_id,
  clientEmail: serviceAccount.client_email,
  privateKey: serviceAccount.private_key,
};

const httpsOptions = {
  key: fs.readFileSync('./secrets/private_key.pem'),
  cert: fs.readFileSync('./secrets/certificate_full_chain.pem'),
};
async function bootstrap() {
  const server = express();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server));
  app.set('trust proxy', true);

  app.use(responseTime({ digits: 0, suffix: false }));

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ErrorInterceptor());

  app.enableCors();

  initializeApp({
    credential: credential.cert(fbCert),
    databaseURL: '*',
  });

  setupSwagger(app);
  const configService = app.get(ConfigService);

  app.connectMicroservice<NatsOptions>(
    {
      transport: Transport.NATS,
      options: {
        name: 'Back queue',
        url: configService.get('nats.url'),
        queue: configService.get('nats.backQueue'),
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservicesAsync();

  await app.init();

  if (process.env.NODE_ENV === 'production') {
    http.createServer(server).listen(80);
    https.createServer(httpsOptions, server).listen(443);
  } else {
    const port = configService.get('server.port');
    await app.listen(port);
  }
}
bootstrap();
