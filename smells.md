# Backend Code Smells

## Critical

1. Hard-coded JWT secrets in source control.
   - `src/auth/constants.ts:4`
   - `src/auth/constants.ts:6`
   - Secrets are committed directly in code instead of being injected from environment/config.

2. Authentication token is accepted in request body instead of using an auth guard.
   - `src/users/users.controller.ts:21`
   - `src/users/users.controller.ts:23`
   - This encourages insecure token handling patterns and bypasses standard Nest auth middleware/guards.

3. Game endpoints have no authorization or ownership checks.
   - `src/game/game.controller.ts:8`
   - `src/game/game.controller.ts:13`
   - `src/game/game.service.ts:49`
   - `src/game/game.service.ts:130`
   - Any caller can operate on any `sessionId`/`roundId` if they know the ID.

## High

4. Type safety is disabled for database access in core modules.
   - `src/game/game.service.ts:8`
   - `src/flags/flag.controller.ts:8`
   - `type DB = any` removes compile-time safety in the most critical logic paths.

5. Schema/type mismatch exists between generated DB types and SQL schema.
   - `src/database/db.types.ts:23`
   - `src/database/schema.sql:30`
   - `src/game/game.service.ts:103`
   - The generated type uses `round_flagids` while schema/code use `flagId`, indicating drift.

6. UsersService bypasses DI and imports a global DB singleton directly.
   - `src/users/users.service.ts:4`
   - Other modules inject `'DB'`, but this service bypasses Nest lifecycle and hurts testability.

7. Hard-to-recover race condition in round creation.
   - `src/game/game.service.ts:58`
   - `src/game/game.service.ts:66`
   - `src/game/game.service.ts:99`
   - `nextRoundNumber` is computed from current rows, then inserted without transaction/retry handling.

8. Non-atomic multi-table write in answer flow.
   - `src/game/game.service.ts:139`
   - `src/game/game.service.ts:150`
   - Round update and session score update are separate statements without transaction.

9. File upload endpoints lack file type/size validation.
   - `src/files/files.controller.ts:36`
   - `src/files/files.controller.ts:46`
   - `src/files/files.controller.ts:24`
   - Allows arbitrary file uploads and trusts original filenames.

10. User enumeration risk via different login error messages.
    - `src/users/users.service.ts:101`
    - `src/users/users.service.ts:104`
    - Distinct messages reveal whether username exists.

## Medium

11. Duplicate and inconsistent validation pipe registration.
    - `src/main.ts:3`
    - `src/main.ts:17`
    - `src/app.module.ts:2`
    - `src/app.module.ts:59`
    - Two different Zod pipe implementations are configured globally.

12. Environment loading is duplicated via side effects.
    - `src/main.ts:8`
    - `src/database/database.ts:1`
    - Multiple dotenv entry points make startup/config order brittle.

13. Global prototype mutation for BigInt serialization.
    - `src/main.ts:10`
    - Mutating `BigInt.prototype` globally can create hidden side effects across app/library code.

14. Blocking sync filesystem access in request path.
    - `src/game/game.service.ts:21`
    - `src/game/game.service.ts:23`
    - `src/flags/flag.controller.ts:32`
    - Sync IO can reduce throughput under load.

15. Placeholder column usage indicates unfinished design.
    - `src/game/game.service.ts:103`
    - `flagId` is always set to `'flag'`, so stored value is meaningless.

16. `@Res()` is used directly in controller.
    - `src/flags/flag.controller.ts:15`
    - `src/flags/flag.controller.ts:36`
    - This bypasses Nest response mapping/interceptors and complicates cross-cutting behavior.

17. Dead/placeholder auth layer.
    - `src/auth/auth.controller.ts:3`
    - `src/auth/auth.service.ts:3`
    - Auth module classes are effectively empty while auth logic lives in `UsersService`.

18. Redundant provider registration creates unclear ownership.
    - `src/auth/auth.module.ts:18`
    - `UsersService` is provided by both `UsersModule` and `AuthModule`.

## Low

19. Duplicate upload configuration file appears unused.
    - `src/files/upload.ts:21`
    - No backend module imports/uses `upload`.

20. Naming/style inconsistencies reduce readability.
    - `src/users/users.controller.ts:21`
    - `src/users/users.service.ts:31`
    - `startsession` and `deletePerson` do not match surrounding naming conventions.
