import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  aj,
  botRule,
  emailRule,
  rateLimitRule,
  type ArcjetDecision,
} from '../arcjet/arcjet.client.js';
import { ArcjetGuard } from '../arcjet/arcjet.guard.js';

@ApiTags('Arcjet demos')
@Controller('api')
export class ProtectedController {
  private readonly logger = new Logger(ProtectedController.name);

  // Scenario 1 - rate limiting. 5 requests per 10 seconds per IP.
  @Get('limited')
  @ApiOperation({ summary: 'Rate limit demo: 5 requests per 10 seconds per IP.' })
  @ApiOkResponse({ description: 'Within the rate limit.', schema: { example: { message: 'Within the rate limit' } } })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded.', schema: { example: { error: 'Rate limit exceeded', rule: 'fixedWindow' } } })
  async limited(@Req() req: Request) {
    const decision = await aj.withRule(rateLimitRule).protect(req);
    this.reject(decision);
    return { message: 'Within the rate limit' };
  }

  // Scenario 2 - bot detection. Any automated client is blocked.
  @Get('bots')
  @ApiOperation({ summary: 'Bot detection demo: blocks any automated client (e.g. curl\'s user agent).' })
  @ApiOkResponse({ description: 'Looks like a browser.', schema: { example: { message: 'You look like a real browser' } } })
  @ApiForbiddenResponse({ description: 'Looks like a bot.', schema: { example: { error: 'Automated client detected', rule: 'detectBot' } } })
  async bots(@Req() req: Request) {
    const decision = await aj.withRule(botRule).protect(req);
    this.reject(decision);
    return { message: 'You look like a real browser' };
  }

  // Scenario 3 - Shield (WAF), applied through the guard rather than inline.
  // Try a suspicious query string, e.g. ?q=' OR 1=1--
  @Get('shielded')
  @UseGuards(ArcjetGuard)
  @ApiOperation({ summary: "Shield (WAF) demo. Try a suspicious query, e.g. ?q=' OR 1=1--" })
  @ApiQuery({ name: 'q', required: false, description: 'Free text; Shield inspects it for attack patterns.' })
  @ApiOkResponse({ description: 'Shield allowed the request.', schema: { example: { message: 'Shield allowed this request', received: null } } })
  @ApiForbiddenResponse({ description: 'Shield judged the request malicious.', schema: { example: { error: 'Request looks malicious', rule: 'shield' } } })
  shielded(@Query('q') q?: string) {
    return { message: 'Shield allowed this request', received: q ?? null };
  }

  // Scenario 4 - email validation. The email must be passed to protect().
  @Post('signup')
  @ApiOperation({ summary: 'Email validation demo: denies disposable, invalid, or no-MX addresses.' })
  @ApiOkResponse({ description: 'Email accepted.', schema: { example: { message: 'Email accepted', email: 'a@b.com' } } })
  @ApiBadRequestResponse({
    description: 'Missing email field, or email rejected by the rule.',
    schema: { example: { error: 'Email rejected', rule: 'validateEmail' } },
  })
  async signup(@Req() req: Request, @Body() body: { email?: string }) {
    const email = body?.email;
    if (!email) {
      throw new HttpException(
        'Body must include an "email" field',
        HttpStatus.BAD_REQUEST,
      );
    }

    const decision = await aj.withRule(emailRule).protect(req, { email });
    this.reject(decision, HttpStatus.BAD_REQUEST);

    return { message: 'Email accepted', email };
  }

  // Turns a denied decision into an HTTP error, naming the rule that fired so
  // the four scenarios are distinguishable from the response alone.
  // In DRY_RUN nothing is denied, so the would-be blocks are logged instead.
  private reject(
    decision: ArcjetDecision,
    deniedStatus: HttpStatus = HttpStatus.FORBIDDEN,
  ): void {
    for (const result of decision.results) {
      if (result.isDenied()) {
        this.logger.warn(
          `Rule "${result.reason.type}" denied the request (mode: ${result.state})`,
        );
      }
    }

    if (!decision.isDenied()) {
      return;
    }

    if (decision.reason.isRateLimit()) {
      throw new HttpException(
        { error: 'Rate limit exceeded', rule: 'fixedWindow' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (decision.reason.isBot()) {
      throw new HttpException(
        { error: 'Automated client detected', rule: 'detectBot' },
        HttpStatus.FORBIDDEN,
      );
    }
    if (decision.reason.isEmail()) {
      throw new HttpException(
        { error: 'Email rejected', rule: 'validateEmail' },
        deniedStatus,
      );
    }
    if (decision.reason.isShield()) {
      throw new HttpException(
        { error: 'Request looks malicious', rule: 'shield' },
        HttpStatus.FORBIDDEN,
      );
    }

    throw new HttpException({ error: 'Denied' }, HttpStatus.FORBIDDEN);
  }
}
