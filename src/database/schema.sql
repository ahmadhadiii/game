CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE game_session_status AS ENUM ('ACTIVE', 'COMPLETED');


CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  status game_session_status NOT NULL DEFAULT 'ACTIVE',
  score INTEGER NOT NULL DEFAULT 0,
  "totalRounds" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "endedAt" TIMESTAMP NULL,

  CONSTRAINT fk_game_sessions_user
    FOREIGN KEY ("userId")
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_rounds (
  id SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "flagId" TEXT NOT NULL,
  "correctCountryCode" CHAR(2) NOT NULL,
  "selectedCountryCode" CHAR(2),
  "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
  "answeredAt" TIMESTAMP,

  CONSTRAINT fk_game_rounds_session
    FOREIGN KEY ("sessionId")
    REFERENCES game_sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_game_rounds_session_round
    UNIQUE ("sessionId", "roundNumber"),

  CONSTRAINT chk_roundNumber_positive
    CHECK ("roundNumber" > 0),

  CONSTRAINT chk_country_codes_upper
    CHECK (
      "correctCountryCode" = UPPER("correctCountryCode")
      AND ("selectedCountryCode" IS NULL OR "selectedCountryCode" = UPPER("selectedCountryCode"))
    )
);


CREATE TABLE IF NOT EXISTS leaderboard_entries (
  "userId" INTEGER PRIMARY KEY,
  "bestScore" INTEGER NOT NULL DEFAULT 0,
  "bestTimeMs" BIGINT,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_leaderboard_user
    FOREIGN KEY ("userId")
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_bestScore_nonnegative
    CHECK ("bestScore" >= 0),

  CONSTRAINT chk_bestTimeMs_positive
    CHECK ("bestTimeMs" IS NULL OR "bestTimeMs" >= 0)
);
