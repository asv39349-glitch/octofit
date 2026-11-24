# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build route-specific React components on the existing React Router pages and centralize API URL construction and fetch error handling in `src/api/client.ts`. Display accessible loading, empty, success, and error states in each capability view.
- Logic tier decision: Keep Express routes thin and place validation and business behavior in explicit service functions in `src/services/octofitService.ts`. Convert invalid IDs, missing records, and invalid payloads into deliberate 4xx responses rather than allowing Mongoose cast errors or unhandled failures.
- Data tier decision: Define Mongoose schemas for users, teams, activities, and workouts with required fields and defaults. Implement the shared MongoDB connection and an idempotent seed that upserts stable demo records without clearing unrelated data or orphaning a moved demo user's previous team membership.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes`; verify both references exist; reject malformed or missing references with a 4xx. Create an activity with the submitted references and computed positive points plus the current occurrence date, then expose list and create routes.
- Team management approach: Require a team name and mascot, default `members` to an empty array, and preserve submitted names and mascots. Create teams through a validated service and expose team members in list responses.
- Leaderboard approach: Aggregate activity points by team, sort descending, and add a 1-based rank. Include only the contract fields `teamName`, `totalPoints`, and `rank`.
- Workout suggestions approach: Find the seeded or stored user by email and base the first suggestion on that user's recent activity and fitness goal. Return a deliberate 404 for an unknown email and include a reason tied to the matching activity or goal.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Purpose: verify Mongoose validation and idempotent seed behavior.
  - Baseline: 4 failed tests (missing user, team, activity, and workout validation) and 1 passed test (seed contract).
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Purpose: verify activity/team validation and all `/api/*` behavior.
  - Baseline: 4 failed tests. Activity and team creation return the unimplemented `501`, leaderboard has no results, and workout suggestions ignore the user's activity pattern.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Purpose: verify route rendering, API requests, and accessible loading, empty, success, and error states.
  - Baseline: 15 failed tests; no capability currently renders contract data or the required accessible states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Purpose: verify backend TypeScript type correctness.
  - Baseline: passes.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Purpose: verify frontend TypeScript correctness and produce a Vite build.
  - Baseline: passes.
