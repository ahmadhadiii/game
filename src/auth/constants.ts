import type { StringValue } from 'ms';

export const jwtConstants = {
  secret: 'djfhvdshkfbhdksbfkjdsbfkdsjbkfd',
  expiresIn: '15h',
  refreshSecret: '8f4c8481f1c040a9b69af2b5b1d7c2de',
  refreshExpiresIn: '7d',
} as const satisfies {
  secret: string;
  expiresIn: StringValue | number;
  refreshSecret: string;
  refreshExpiresIn: StringValue | number;
};
