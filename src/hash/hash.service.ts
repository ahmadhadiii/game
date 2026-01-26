import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  private readonly saltRounds = 10;

  async hashData(data: string): Promise<string> {
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid data to hash');
    }
    return await bcrypt.hash(data, this.saltRounds);
  }

  async compareData(data: string, hash: string): Promise<boolean> {
    if (!data || !hash) {
      throw new Error('Invalid comparison data');
    }
    return await bcrypt.compare(data, hash);
  }
}
