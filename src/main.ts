import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const hrm_api_host = config.get('HRM_API_HOST', 'Hrm-api');
  const hrm_api_port = config.get('HRM_API_PORT');
  const hrm_notify_host = config.get('HRM_NOTIFY_HOST', 'Hrm-notify')
  const hrm_notify_port = config.get('HRM_NOTIFY_PORT');
  const hrm_ats_host = config.get('HRM_ATS_HOST', 'Hrm-ats');
  const hrm_ats_port = config.get('HRM_ATS_PORT');
  const hrm_social_host = config.get('HRM_SOCIAL_HOST', 'Hrm-social');
  const hrm_social_port = config.get('HRM_SOCIAL_PORT');
  app.enableCors({
    origin: ['http://localhost:3000', 'https://hrm-tool.vercel.app', 'https://ltdhrm.me', 'https://www.ltdhrm.me'],
    credentials: true,
  });
  // Proxy cho hrm-api service
  app.use(
    '/hrm-api',
    createProxyMiddleware({
      target: `http://${hrm_api_host}:${hrm_api_port}`,
      // target: `http://localhost:${hrm_api_port}`,
      changeOrigin: true,
      ws: true, //using with web-socket
      pathRewrite: { '^/hrm-api': '' }, //xóa prefix /hrm-api
      logger: console,
    }),
  );
  // Proxy cho hrm-notify service
  app.use(
    '/hrm-notify',
    createProxyMiddleware({
      target: `http://${hrm_notify_host}:${hrm_notify_port}`,
      // target: `http://localhost:${hrm_notify_port}`,
      changeOrigin: true,
      ws: true, //using with web-socket
      pathRewrite: { '^/hrm-notify': '' }, // xóa prefix /hrm-notify
      logger: console,
    }),
  );
  // Proxy cho hrm-ats service
  app.use(
    '/hrm-ats',
    createProxyMiddleware({
      target: `http://${hrm_ats_host}:${hrm_ats_port}`,
      changeOrigin: true,
      ws: true, //using with web-socket
      pathRewrite: { '^/hrm-ats': '' }, // xóa prefix /hrm-ats
      logger: console,
    }),
  );
  // Proxy cho hrm-social service
  app.use(
    '/hrm-social',
    createProxyMiddleware({
      target: `http://${hrm_social_host}:${hrm_social_port}`,
      changeOrigin: true,
      ws: true, //using with web-socket
      pathRewrite: { '^/hrm-social': '' }, // xóa prefix /hrm-social
      logger: console,
    }),
  );
  await app.listen(config.get('PORT', 3100));
}
bootstrap();
