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

  // Dedicated WebSocket Proxy (No pathRewrite, No changeOrigin) to prevent "Invalid frame header"
  const notifyWsProxy = createProxyMiddleware({
    target: `http://${hrm_notify_host}:${hrm_notify_port}`,
    changeOrigin: false,
    ws: true,
    logger: console,
  });

  const s3MinioProxy = createProxyMiddleware({
    target: `http://minio:9000`,
    changeOrigin: true,
    pathRewrite: { '^/s3-minio': '' },
    logger: console,
  });

  app.use('/hrm-api', apiProxy);
  app.use('/hrm-notify', notifyProxy);
  app.use('/hrm-ats', atsProxy);
  app.use('/hrm-social', socialProxy);
  
  // Dùng middleware bọc trước s3MinioProxy để lột sạch các nhãn dán X-Forwarded của Nginx
  // Tránh việc sửa proxyReq gây treo stream (ECONNRESET/504 Timeout)
  app.use('/s3-minio', (req: any, res: any, next: any) => {
    delete req.headers['x-forwarded-host'];
    delete req.headers['x-forwarded-proto'];
    delete req.headers['x-forwarded-for'];
    delete req.headers['x-forwarded-port'];
    // Xóa luôn header Host gốc để http-proxy-middleware tự động gán Host: minio:9000 (nhờ changeOrigin: true)
    delete req.headers['host'];
    next();
  }, s3MinioProxy);

  const server = await app.listen(config.get('PORT', 3100));

  // Bind upgrade events for WebSockets
  server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/hrm-notify')) {
      req.url = req.url.replace(/^\/hrm-notify/, '');
      notifyWsProxy.upgrade(req, socket, head);
    }
  });
}
bootstrap();
