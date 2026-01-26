import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('sessions/:sessionId/next-round')
  nextRound(@Param('sessionId') sessionId: string) {
    return this.gameService.nextRound(Number(sessionId));
  }

  @Post('rounds/:roundId/answer')
  answer(
    @Param('roundId') roundId: string,
    @Body() body: { selectedCountryCode: string },
  ) {
    return this.gameService.answerRound(
      Number(roundId),
      body.selectedCountryCode,
    );
  }
}
