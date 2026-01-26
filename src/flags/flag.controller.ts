import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';

type DB = any;

@Controller()
export class FlagController {
  constructor(@Inject('DB') private readonly db: Kysely<DB>) {}

  @Get('flag/:roundId')
  async getFlag(@Param('roundId') roundId: string, @Res() res: Response) {
    const round = await this.db
      .selectFrom('game_rounds')
      .select(['correctCountryCode'])
      .where('id', '=', Number(roundId))
      .executeTakeFirst();

    if (!round) throw new NotFoundException('Round not found');

    const code = round.correctCountryCode.toLowerCase();
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'flags',
      `${code}.webp`,
    );

    if (!fs.existsSync(filePath))
      throw new NotFoundException('Flag file missing');

    res.setHeader('Content-Type', 'image/webp');
    return res.sendFile(filePath);
  }
}
