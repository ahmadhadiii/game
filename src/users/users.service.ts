import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DB } from 'src/database/db.types';
import type { Insertable, Updateable } from 'kysely';
import { db } from 'src/database/database';
import { CreateUserDto } from 'src/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
type UserRow = DB['users'];
type NewUser = Insertable<UserRow>;
type UserUpdate = Updateable<UserRow>;
type UserCriteria = { id?: number; username?: string; password?: string };
@Injectable()
export class UsersService {
  constructor(private jwtService: JwtService) {}
  createUser(person: NewUser) {
    return db
      .insertInto('users')
      .values(person)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  findUserByName(username: string) {
    return db
      .selectFrom('users')
      .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();
  }

  deletePerson(id: number) {
    return db
      .deleteFrom('users')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  updateUser(id: number, updateWith: UserUpdate) {
    return db
      .updateTable('users')
      .set(updateWith)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  async startSession(userId: number) {
    const session = await db
      .insertInto('game_sessions')
      .values({ userId })
      .returningAll()
      .executeTakeFirstOrThrow();

    const result = await db
      .selectFrom('users')
      .leftJoin('game_sessions', (join) =>
        join
          .onRef('game_sessions.userId', '=', 'users.id')
          .on('game_sessions.id', '=', session.id),
      )
      .select([
        'users.id as userId',
        'users.username',
        'users.createdAt',
        'game_sessions.id as sessionId',
        'game_sessions.status',
        'game_sessions.score',
        'game_sessions.totalRounds',
        'game_sessions.startedAt',
        'game_sessions.endedAt',
      ])
      .where('users.id', '=', userId)
      .executeTakeFirst();

    if (result?.totalRounds === 10) {
      return { score: result.score };
    }

    return result;
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.createUser({
      username: createUserDto.username,
      passwordHash: hashedPassword,
    });

    const payload = {
      id: user.id,
      username: user.username,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async login(username: string, pass: string) {
    const user = await this.findUserByName(username);

    if (!user) throw new UnauthorizedException('wrong user name');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('wrong passowrd');

    const payload = { id: user.id, username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
