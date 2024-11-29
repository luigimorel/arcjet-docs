import { ARCJET, type ArcjetNest, fixedWindow } from "@arcjet/nest";
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  Req,
  Res,
} from "@nestjs/common";
import type { Request } from "express";

// This would normally go in your service file e.g.
// src/page/page.service.ts
@Injectable()
export class PageService {
  message(): { message: string } {
    return {
      message: "Hello world",
    };
  }
}

// This would normally go in your controller file e.g.
// src/page/page.controller.ts
@Controller("page")
// Sets up the Arcjet protection without using a guard so we can access the
// decision and use it in the controller.
export class PageController {
  // Make use of the NestJS logger: https://docs.nestjs.com/techniques/logger
  // See
  // https://github.com/arcjet/example-nestjs/blob/ec742e58c8da52d0a399327182c79e3f4edc8f3b/src/app.module.ts#L29
  // and https://github.com/arcjet/example-nestjs/blob/main/src/arcjet-logger.ts
  // for an example of how to connect Arcjet to the NestJS logger
  private readonly logger = new Logger(PageController.name);

  constructor(
    private readonly pageService: PageService,
    @Inject(ARCJET) private readonly arcjet: ArcjetNest,
  ) {}

  @Get()
  async index(@Req() req: Request) {
    const decision = await this.arcjet
      .withRule(
        fixedWindow({
          mode: "LIVE",
          window: "1h",
          max: 60,
        }),
      )
      .protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new HttpException(
          "Too many requests",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
      }
    } else if (decision.isErrored()) {
      if (decision.reason.message.includes("missing User-Agent header")) {
        // Requests without User-Agent headers can not be identified as any
        // particular bot and will be marked as an errored decision. Most
        // legitimate clients always send this header, so we recommend blocking
        // requests without it.
        this.logger.warn("User-Agent header is missing");
        throw new HttpException("Bad request", HttpStatus.BAD_REQUEST);
      } else {
        // Fail open to prevent an Arcjet error from blocking all requests. You
        // may want to fail closed if this controller is very sensitive
        this.logger.error(`Arcjet error: ${decision.reason.message}`);
      }
    }

    return this.pageService.message();
  }
}
