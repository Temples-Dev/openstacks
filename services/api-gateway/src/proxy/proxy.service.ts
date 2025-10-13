import { Injectable, BadGatewayException } from '@nestjs/common';
import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
  private readonly serviceUrls = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3003',
    circulation: process.env.CIRCULATION_SERVICE_URL || 'http://localhost:3004',
    acquisitions: process.env.ACQUISITIONS_SERVICE_URL || 'http://localhost:3005',
    discovery: process.env.DISCOVERY_SERVICE_URL || 'http://localhost:3006',
    reporting: process.env.REPORTING_SERVICE_URL || 'http://localhost:3007',
  };

  async proxyRequest(req: Request, res: Response, service: string) {
    const serviceUrl = this.serviceUrls[service];
    
    if (!serviceUrl) {
      throw new BadGatewayException(`Service ${service} not configured`);
    }

    try {
      const proxy = createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^/api/v1/${service}`]: '', // Remove /api/v1/service prefix
        },
      });

      return proxy(req, res, (err) => {
        if (err) {
          console.error(`Proxy error for ${service}:`, err);
          if (!res.headersSent) {
            res.status(502).json({
              success: false,
              message: `Service ${service} unavailable`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      });
    } catch (error) {
      console.error(`Proxy setup error for ${service}:`, error);
      res.status(502).json({
        success: false,
        message: `Service ${service} unavailable`,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
