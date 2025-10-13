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

    const proxy = createProxyMiddleware({
      target: serviceUrl,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/v1/${service}`]: '', // Remove service prefix
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${service}:`, err);
        res.status(502).json({
          success: false,
          message: `Service ${service} unavailable`,
          timestamp: new Date().toISOString(),
        });
      },
      onProxyReq: (proxyReq, req) => {
        // Add user context to headers for downstream services
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.userId);
          proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles));
          proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
        }
      },
    });

    return proxy(req, res);
  }
}
