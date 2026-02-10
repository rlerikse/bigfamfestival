import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware to extract and set tenant/festival ID from request
 *
 * Tenant ID can come from:
 * 1. X-Festival-Id header
 * 2. Query parameter ?festivalId=
 * 3. Environment variable (single tenant mode)
 *
 * The tenant ID is attached to the request object for use in controllers/services
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Try to get tenant ID from header first
    let tenantId = req.headers['x-festival-id'] as string;

    // Fall back to query parameter
    if (!tenantId) {
      tenantId = req.query.festivalId as string;
    }

    // Fall back to environment variable (single tenant mode)
    if (!tenantId) {
      tenantId = this.configService.get<string>('FESTIVAL_ID');
    }

    // Attach tenant ID to request
    (req as any).tenantId = tenantId;

    next();
  }
}
