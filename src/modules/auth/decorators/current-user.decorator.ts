import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

/**
 * Custom decorator to extract authenticated user from request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 *
 * @example Extract specific field
 * ```typescript
 * @Get('my-orders')
 * @UseGuards(JwtAuthGuard)
 * getMyOrders(@CurrentUser('userId') userId: string) {
 *   return this.ordersService.findByUserId(userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // If a specific field is requested, return just that field
    if (data) {
      return user?.[data];
    }

    // Otherwise return the entire user object
    return user;
  },
);
