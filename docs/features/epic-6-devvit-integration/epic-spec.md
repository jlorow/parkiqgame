# Epic 6: Devvit Integration
**PRD Reference:** All features (platform requirement)
**Tech Stack Reference:** Sections 2, 5

## Goal
Get ParkIQ running as a live Reddit Interactive Post
inside a test subreddit, with Devvit Redis wired up
for user identity and data persistence.

## Acceptance Criteria
- ParkIQ runs as a Devvit Web app accessible via a
  Reddit post in a public subreddit
- Devvit backend identifies the current Reddit user
  and passes userId to the webview
- Devvit Redis reads and writes work for streak and
  leaderboard data
- The Interactive Post renders correctly in the Reddit
  mobile app feed

## Design Reference
See `epic-images/stitch-layout-reference.png` for the
expected mobile layout inside Reddit.

## Stories
1. story-1-devvit-setup
2. story-2-redis-bridge
3. story-3-reddit-post

## Build Order Note
This epic is partially done first (Story 1) and
partially done last (Story 3). Story 1 must be
complete before Epic 1. Stories 2-3 come after
Epic 4 is complete.

---

# Story 6-1: Devvit Environment Setup
**Epic:** Devvit Integration
**Build Order:** FIRST — before all other epics

## User Story
As a developer, I want the Devvit development environment
running locally so that I can test every story inside
Reddit as I build it.

## Functional Requirements
- Node.js 22.x installed
- Devvit CLI installed and authenticated
- Devvit React template cloned and running
- A test subreddit created on Reddit.com
- "Hello World" renders inside a Reddit Interactive Post
- `npm run dev` starts the dev server connected to the
  test subreddit

## Implementation Steps

1. Verify Node 22: `node --version` must show v22.x.x
   If not, install from nodejs.org

2. Install Devvit CLI: `npm install -g devvit`

3. Authenticate: `devvit login`
   Follow the browser OAuth flow

4. Clone template:
   `git clone https://github.com/reddit/devvit-template-react parkiq`
   `cd parkiq && npm install`

5. Create a subreddit at reddit.com. Go to left sidebar
   → Communities → Create a Community. Name it something
   like r/ParkIQGame (private is fine for testing)

6. Update `package.json` dev:devvit command to include
   your subreddit name

7. Update `devvit.yaml`: set name to `ParkIQGame`
   (must be ≤16 characters)

8. Upload app: `npm run upload`

9. Start dev server: `npm run dev`

10. Navigate to your subreddit → three dots menu →
    "Make my experience post"

🔴 REPORT BEFORE CONTINUING
Show a screenshot of the "Hello World" or default
template content rendering inside the Reddit post
on your test subreddit. Confirm you can see it on
mobile Reddit app.

## VERIFIED
- [ ] Node 22.x confirmed
- [ ] Devvit CLI authenticated
- [ ] Template running locally
- [ ] Test subreddit created
- [ ] Interactive Post visible in subreddit
- [ ] Post renders on mobile Reddit app

---

# Story 6-2: Redis + Message Bridge
**Epic:** Devvit Integration
**Build Order:** After Epic 3, before Epic 4

## User Story
As a developer, I want Devvit Redis reads/writes and
the postMessage bridge working, so that user data
persists across sessions.

## Functional Requirements
- Devvit backend (`main.tsx`) reads current user's
  Reddit userId from Devvit context on every app load
- Backend sends USER_DATA to webview:
  `{ userId, streak, lastPlayed, serverDate }`
- Webview sends PUZZLE_COMPLETE to backend:
  `{ timeTaken, wasCorrect, shareBlocks }`
- Backend handles PUZZLE_COMPLETE: updates streak,
  lastPlayed, score, and result in Redis
- Backend handles GET_LEADERBOARD: returns top 10
  from today's sorted set
- All Redis operations wrapped in try/catch — failures
  logged, never crash the game

## Redis Keys (from Tech Stack Spec Section 5.2)
- `streak:{userId}` → integer
- `lastPlayed:{userId}` → ISO date string
- `score:{date}:{userId}` → integer
- `leaderboard:{date}` → sorted set
- `result:{userId}:{date}` → shareBlocks JSON string

## Implementation Steps

1. In `main.tsx` Devvit backend, add useChannel or
   onMessage handler for webview messages

2. On app mount, read userId from context.userId

3. Read streak and lastPlayed from Redis for this user

4. Send USER_DATA message to webview with all fields
   including server date (new Date().toISOString())

5. Add handler for PUZZLE_COMPLETE message:
   - Validate timeTaken is a positive number
   - Calculate score
   - Write all Redis keys
   - Send PUZZLE_COMPLETE_ACK back to webview

6. Add handler for GET_LEADERBOARD:
   - Read sorted set for today
   - Return top 10 with scores
   - Send LEADERBOARD_DATA to webview

7. Create `src/lib/devvit-client.ts` in webview:
   - sendMessage(type, payload) helper
   - onMessage(type, callback) listener helper

🔴 REPORT BEFORE CONTINUING
Test Redis bridge manually:
- Load the app, check USER_DATA received in console
- Complete a puzzle, check PUZZLE_COMPLETE_ACK received
- Check Redis values via Devvit dashboard or logs
Show console output confirming all message types work.

## VERIFIED
- [ ] USER_DATA received on every app load
- [ ] userId present in USER_DATA
- [ ] serverDate present and accurate
- [ ] PUZZLE_COMPLETE writes all Redis keys
- [ ] GET_LEADERBOARD returns correct sorted data
- [ ] All Redis ops have try/catch

---

# Story 6-3: Public Reddit Post
**Epic:** Devvit Integration
**Build Order:** LAST — after all other epics complete

## User Story
As a hackathon judge, I want to find and play ParkIQ
from a public Reddit post, so that I can evaluate it
without any setup.

## Functional Requirements
- App deployed to production via `npm run upload`
- A public subreddit created for ParkIQ (not the dev one)
- A pinned post in the subreddit runs the live game
- Post title clearly explains what ParkIQ is
- Post description explains how to play (1–2 sentences)
- App runs correctly for any logged-in Reddit user
- Devpost submission links to this public post

## Implementation Steps

1. Create a public subreddit: r/ParkIQGame or similar

2. Run final production build: `npm run upload`

3. Navigate to public subreddit → create Interactive Post
   with title: "ParkIQ — Daily Parking Puzzle #1"
   Description: "Top-down parking puzzle. Pick the right
   escape direction. One puzzle per day."

4. Test the live post with a second Reddit account to
   confirm it works for non-developer users

5. Record a 60-second screen capture of full gameplay
   for the Devpost demo video

🔴 REPORT BEFORE CONTINUING
Share the public Reddit post URL. Test with a second
account and confirm the full flow works: puzzle →
answer → feedback → share card. No developer tools
or special access required.

## VERIFIED
- [ ] Public subreddit created
- [ ] Production app deployed
- [ ] Interactive Post live and accessible
- [ ] Works for non-developer Reddit accounts
- [ ] Demo video recorded
- [ ] Devpost submission ready with post URL
