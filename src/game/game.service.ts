import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { countriesArray } from './countries';
import * as fs from 'fs';
import * as path from 'path';

type DB = any;

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

@Injectable()
export class GameService {
  constructor(@Inject('DB') private readonly db: Kysely<DB>) {}

  // ✅ reads your uploads/flags folder and returns available country codes like ["US","SE"...]
  private getAvailableFlagCodes(): Set<string> {
    const dir = path.join(process.cwd(), 'uploads', 'flags');
    if (!fs.existsSync(dir)) return new Set();

    const files = fs.readdirSync(dir);

    // Supports BOTH:
    // 1) us.webp
    // 2) 1769413362528-us.webp (your old uploads)
    const codes = files
      .map((f) => {
        const m1 = f.match(/^([a-z]{2})\.(webp|png|jpg|jpeg)$/i);
        if (m1) return m1[1];

        const m2 = f.match(/-([a-z]{2})\.(webp|png|jpg|jpeg)$/i);
        if (m2) return m2[1];

        return null;
      })
      .filter(Boolean)
      .map((c) => c!.toUpperCase());

    return new Set(codes);
  }

  async nextRound(sessionId: number) {
    // 1) session exists + active
    const session = await this.db
      .selectFrom('game_sessions')
      .select(['id', 'status'])
      .where('id', '=', sessionId)
      .executeTakeFirst();

    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'ACTIVE') {
      return { done: true, message: 'Session is not active.' };
    }

    // 2) used codes in this session
    const usedRows = await this.db
      .selectFrom('game_rounds')
      .select(['correctCountryCode', 'roundNumber'])
      .where('sessionId', '=', sessionId)
      .execute();

    const usedCodes = new Set(usedRows.map((r) => r.correctCountryCode));
    const nextRoundNumber =
      (usedRows.reduce((m, r) => Math.max(m, r.roundNumber), 0) || 0) + 1;

    // 3) only countries that have a flag file + not used yet
    const availableFlagCodes = this.getAvailableFlagCodes();

    const pool = countriesArray.filter(
      (c) => availableFlagCodes.has(c.code) && !usedCodes.has(c.code),
    );

    if (pool.length < 4) {
      return {
        done: true,
        message: 'Not enough flags left to create a round.',
      };
    }

    // 4) pick correct
    const correct = pool[Math.floor(Math.random() * pool.length)];

    // 5) pick 3 wrong from same pool
    const wrong = shuffle(pool.filter((c) => c.code !== correct.code)).slice(
      0,
      3,
    );

    // 6) shuffle choices and return labels
    const choices = shuffle([correct, ...wrong]).map((c) => ({
      code: c.code, // backend uses this
      label: c.name, // user sees this
    }));

    // 7) insert round (so /flag/:roundId works)
    const inserted = await this.db
      .insertInto('game_rounds')
      .values({
        sessionId,
        roundNumber: nextRoundNumber,
        flagId: 'flag', // can keep or remove later
        correctCountryCode: correct.code,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();

    // 8) update totalRounds (optional)
    await this.db
      .updateTable('game_sessions')
      .set({ totalRounds: nextRoundNumber })
      .where('id', '=', sessionId)
      .execute();

    return {
      roundId: inserted.id,
      roundNumber: nextRoundNumber,
      flagUrl: `/flag/${inserted.id}`,
      choices,
    };
  }

  async answerRound(roundId: number, selectedCountryCode: string) {
    const selected = selectedCountryCode.toUpperCase();

    const round = await this.db
      .selectFrom('game_rounds')
      .select(['id', 'sessionId', 'correctCountryCode', 'answeredAt'])
      .where('id', '=', roundId)
      .executeTakeFirst();

    if (!round) throw new NotFoundException('Round not found');

    if (round.answeredAt) return { alreadyAnswered: true };

    const isCorrect = selected === round.correctCountryCode;

    await this.db
      .updateTable('game_rounds')
      .set({
        selectedCountryCode: selected,
        isCorrect,
        answeredAt: new Date(),
      })
      .where('id', '=', roundId)
      .execute();

    if (isCorrect) {
      await this.db
        .updateTable('game_sessions')
        .set({ score: (eb) => eb('score', '+', 1) })
        .where('id', '=', round.sessionId)
        .execute();
    }

    return { correct: isCorrect };
  }
}
