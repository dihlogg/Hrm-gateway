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
  const apiProxy = createProxyMiddleware({
    target: `http://${hrm_api_host}:${hrm_api_port}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/hrm-api': '' },
    logger: console,
  });

  const notifyProxy = createProxyMiddleware({
    target: `http://${hrm_notify_host}:${hrm_notify_port}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/hrm-notify': '' },
    logger: console,
  });

  const atsProxy = createProxyMiddleware({
    target: `http://${hrm_ats_host}:${hrm_ats_port}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/hrm-ats': '' },
    logger: console,
  });

  const socialProxy = createProxyMiddleware({
    target: `http://${hrm_social_host}:${hrm_social_port}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/hrm-social': '' },
    logger: console,
  });

  app.use('/hrm-api', apiProxy);
  app.use('/hrm-notify', notifyProxy);
  app.use('/hrm-ats', atsProxy);
  app.use('/hrm-social', socialProxy);

  const server = await app.listen(config.get('PORT', 3100));
  
  // Bind upgrade events for WebSockets
  server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/hrm-notify')) {
      notifyProxy.upgrade(req, socket, head);
    } else if (req.url.startsWith('/hrm-api')) {
      apiProxy.upgrade(req, socket, head);
    } else if (req.url.startsWith('/hrm-ats')) {
      atsProxy.upgrade(req, socket, head);
    } else if (req.url.startsWith('/hrm-social')) {
      socialProxy.upgrade(req, socket, head);
    }
  });
}
bootstrap();
