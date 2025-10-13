import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProxyService } from './proxy.service';

@ApiTags('proxy')
@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('catalog/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCatalog(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'catalog');
  }

  @All('circulation/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyCirculation(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'circulation');
  }

  @All('acquisitions/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyAcquisitions(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'acquisitions');
  }

  @All('discovery/*')
  async proxyDiscovery(@Req() req: Request, @Res() res: Response) {
    // Discovery endpoints are public (no auth required)
    return this.proxyService.proxyRequest(req, res, 'discovery');
  }

  @All('reporting/*')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async proxyReporting(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(req, res, 'reporting');
  }
}
