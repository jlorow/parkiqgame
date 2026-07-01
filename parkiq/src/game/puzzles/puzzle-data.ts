import type { Puzzle } from './puzzle-types';

/**
 * All 15 launch puzzles for ParkIQ.
 *
 * Grouping:
 *   Puzzles  1–5  — type: 'parallel'    (street environment, difficulty 1–2)
 *   Puzzles  6–10 — type: 'garage'      (garage environment, difficulty 3)
 *   Puzzles 11–15 — type: 'reverse_bay' (open_lot environment, difficulty 4–5)
 */
export const puzzles: Puzzle[] = [
  // ==========================================================================
  // PARALLEL PARK — Street environment (puzzles 1–5, difficulty 1–2)
  // ==========================================================================
  {
    id: 1,
    type: 'parallel',
    difficulty: 1,
    question: 'You are parked parallel between two cars. What is the safest way to exit?',
    environment: 'street',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 4, y: 1, angle: 0 },
      { type: 'suv', x: 0, y: 1, angle: 0 },
    ],
    options: {
      A: 'Turn full lock left and pull forward sharply',
      B: 'Turn slight right, ease forward, then straighten',
      C: 'Reverse hard to the right',
      D: 'Full lock right and accelerate out',
    },
    correctAnswer: 'B',
    wrongPaths: {
      A: 'Hits the front sedan — not enough clearance turning left',
      C: 'Rear bumper collides with the SUV parked behind',
      D: 'Sideswipes the front sedan on the way out',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Check mirrors',
        description: 'Check your rear-view and side mirrors for approaching traffic',
        highlightWord: 'mirrors',
      },
      {
        stepNumber: 2,
        title: 'Signal',
        description: 'Indicate your intention to pull out, alerting drivers behind you',
        highlightWord: 'Signal',
      },
      {
        stepNumber: 3,
        title: 'Creep forward',
        description: 'With slight right lock, creep forward until your front bumper clears the car ahead',
        highlightWord: 'creep',
      },
      {
        stepNumber: 4,
        title: 'Straighten and go',
        description: 'Straighten the wheel and merge smoothly into the traffic flow',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'When exiting a parallel park, turn your wheels toward the kerb first — it prevents your rear wheels from mounting the pavement.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟩'],
  },
  {
    id: 2,
    type: 'parallel',
    difficulty: 1,
    question: 'You need to exit a parallel parking spot with traffic approaching. What do you do?',
    environment: 'street',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 4, y: 1, angle: 0 },
      { type: 'sedan', x: 0, y: 1, angle: 0 },
    ],
    options: {
      A: 'Check mirror, signal, wait for gap, ease out when clear',
      B: 'Full lock left and pull out immediately regardless of traffic',
      C: 'Reverse all the way out first, then check for traffic',
      D: 'Pull forward hard and cut across at speed',
    },
    correctAnswer: 'A',
    wrongPaths: {
      B: 'Swing into the front sedan\'s bumper',
      C: 'Rear end collides with the sedan parked behind',
      D: 'Sideswipes the car ahead while cutting across',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Observe',
        description: 'Check all mirrors and blind spots for oncoming vehicles and cyclists',
        highlightWord: 'blind spots',
      },
      {
        stepNumber: 2,
        title: 'Signal',
        description: 'Activate your indicator to communicate your intention to other road users',
        highlightWord: 'indicator',
      },
      {
        stepNumber: 3,
        title: 'Wait',
        description: 'Wait for a safe gap in traffic — rushing forces other drivers to brake for you',
        highlightWord: 'safe gap',
      },
      {
        stepNumber: 4,
        title: 'Exit',
        description: 'Ease out in one smooth arc, accelerating gently to match traffic speed',
        highlightWord: 'smooth arc',
      },
    ],
    expertTip: 'Patience is a skill — the average wait to exit a parallel park is only 8 seconds. Rushing causes 73% of parallel-park exit collisions.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟩'],
  },
  {
    id: 3,
    type: 'parallel',
    difficulty: 2,
    question: 'Your parallel parking space is tight with minimal gap front and back. How do you escape?',
    environment: 'street',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'suv', x: 4, y: 1, angle: 0 },
      { type: 'sedan', x: 0, y: 1, angle: 0 },
    ],
    options: {
      A: 'Reverse to the left, then pull forward in one motion',
      B: 'Small forward and backward adjustments, exit to the right',
      C: 'Full lock right and accelerate quickly out of the space',
      D: 'Reverse straight back two car lengths before turning',
    },
    correctAnswer: 'B',
    wrongPaths: {
      A: 'Reversing left clips the SUV parked in front',
      C: 'Oversteers into the front SUV\'s rear bumper',
      D: 'Rear bumper collides with the sedan behind during the reverse',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Assess space',
        description: 'Judge how much clearance you have front and back — less than a car door width means multi-point exit',
        highlightWord: 'clearance',
      },
      {
        stepNumber: 2,
        title: 'Creep back',
        description: 'Reverse gently a few inches to create forward turning space, checking your rear camera',
        highlightWord: 'Reverse',
      },
      {
        stepNumber: 3,
        title: 'Turn and creep',
        description: 'With slight right lock, creep forward until your front bumper passes the SUV\'s rear bumper',
        highlightWord: 'creep',
      },
      {
        stepNumber: 4,
        title: 'Straighten',
        description: 'Straighten the wheel and merge, using small corrections to maintain lane position',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'In tight parallel parks, use the "kerb check" — turn your wheel slightly left before exiting to confirm your rear wheel isn\'t wedged against the pavement.',
    shareBlocks: ['🟩', '🟥', '🟩', '🟩', '🟩'],
  },
  {
    id: 4,
    type: 'parallel',
    difficulty: 2,
    question: 'You are parked parallel on a narrow street with cars close front and back. Which exit maneuver is correct?',
    environment: 'street',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 4, y: 1, angle: 0 },
      { type: 'suv', x: 0, y: 1, angle: 0 },
    ],
    options: {
      A: 'Pull forward with full left lock to swing out wide',
      B: 'Reverse toward the kerb, then pull forward and turn right',
      C: 'Full right lock, pull forward quickly to minimise steering time',
      D: 'Ease forward, apply slight right lock, then straighten and merge',
    },
    correctAnswer: 'D',
    wrongPaths: {
      A: 'Left lock swings your bonnet into the front sedan',
      B: 'Reversing toward the kerb traps your rear tyre against the pavement',
      C: 'Sideswipes the car ahead when pulling forward at speed',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Prepare',
        description: 'Select drive, keep the wheel straight, and release the handbrake',
        highlightWord: 'handbrake',
      },
      {
        stepNumber: 2,
        title: 'Creep',
        description: 'Creep forward slowly while applying gentle right lock to angle away from the car ahead',
        highlightWord: 'Creep',
      },
      {
        stepNumber: 3,
        title: 'Check',
        description: 'Check your passenger-side mirror to confirm clearance with the SUV behind',
        highlightWord: 'mirror',
      },
      {
        stepNumber: 4,
        title: 'Merge',
        description: 'Straighten the wheel and merge into traffic, matching the flow speed',
        highlightWord: 'Merge',
      },
    ],
    expertTip: 'On narrow streets, your passenger-side mirror is your best friend — if you can see pavement in it, your rear wheels are clear of the kerb.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟩'],
  },
  {
    id: 5,
    type: 'parallel',
    difficulty: 2,
    question: 'A delivery van is double-parked ahead of your parallel spot. How do you exit safely?',
    environment: 'street',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 4, y: 1, angle: 0 },
      { type: 'suv', x: 0, y: 1, angle: 0 },
    ],
    options: {
      A: 'Signal, check for cyclists, ease out in a smooth arc when clear',
      B: 'Reverse out without checking — the gap behind you is visible',
      C: 'Full lock right and accelerate to merge before the van blocks you',
      D: 'Reverse first, then pull forward sharply to avoid the van',
    },
    correctAnswer: 'A',
    wrongPaths: {
      B: 'Reversing without checking collides with the SUV parked behind',
      C: 'Sideswipes the front sedan while accelerating blindly',
      D: 'Rear bumper hits the SUV during the reverse phase',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Scan',
        description: 'Check for approaching cyclists and vehicles — delivery vans create extra blind spots',
        highlightWord: 'blind spots',
      },
      {
        stepNumber: 2,
        title: 'Signal',
        description: 'Signal right early to warn the delivery driver and approaching traffic of your intention',
        highlightWord: 'Signal',
      },
      {
        stepNumber: 3,
        title: 'Forward creep',
        description: 'With gentle right lock, creep forward watching the front gap to the sedan',
        highlightWord: 'forward creep',
      },
      {
        stepNumber: 4,
        title: 'Merge',
        description: 'Straighten and merge — the delivery van actually shields you from traffic behind',
        highlightWord: 'Merge',
      },
    ],
    expertTip: 'A double-parked vehicle limits visibility but also creates a protected exit zone — use it to your advantage by checking that no cyclists are filtering through.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟩'],
  },

  // ==========================================================================
  // GARAGE — Garage environment (puzzles 6–10, difficulty 3)
  // ==========================================================================
  {
    id: 6,
    type: 'garage',
    difficulty: 3,
    question: 'You are reversing out of a garage bay with a concrete pillar on your left. What is your exit path?',
    environment: 'garage',
    playerCar: { x: 2, y: 1, angle: 180 },
    obstacles: [
      { type: 'pillar', x: 0, y: 1, angle: 0 },
      { type: 'suv', x: 4, y: 1, angle: 0 },
    ],
    options: {
      A: 'Reverse straight back then turn left past the pillar',
      B: 'Reverse at an angle right, clear the pillar, then straighten',
      C: 'Full lock left and reverse out in one motion',
      D: 'Reverse hard right without stopping until clear',
    },
    correctAnswer: 'B',
    wrongPaths: {
      A: 'Rear bumper hits the concrete pillar when reversing straight back',
      C: 'Swing into the adjacent SUV on the right',
      D: 'Sideswipes the pillar on the left during hard right turn',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Identify pivot',
        description: 'Identify the pillar position — you need to angle away from it before straightening',
        highlightWord: 'pillar',
      },
      {
        stepNumber: 2,
        title: 'Reverse right',
        description: 'Reverse with gentle right lock to create distance from the left-side pillar',
        highlightWord: 'right lock',
      },
      {
        stepNumber: 3,
        title: 'Clear pillar',
        description: 'Once your front bumper passes the pillar, pause and check clearance in your side mirror',
        highlightWord: 'side mirror',
      },
      {
        stepNumber: 4,
        title: 'Straighten',
        description: 'Straighten the wheel and reverse the rest of the way, checking for cross-traffic',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'Pillars in garages are deceptively wide at bumper height — your mirror shows the pillar top but the base is 6 inches wider in most parking structures.',
    shareBlocks: ['🟩', '🟥', '🟩', '🟩', '🟩'],
  },
  {
    id: 7,
    type: 'garage',
    difficulty: 3,
    question: 'A wall is directly behind your parking bay and a car is parked in the next space. How do you exit?',
    environment: 'garage',
    playerCar: { x: 2, y: 1, angle: 180 },
    obstacles: [
      { type: 'wall', x: 2, y: 0, angle: 0 },
      { type: 'sedan', x: 4, y: 1, angle: 0 },
    ],
    options: {
      A: 'Reverse straight back, then turn right once past the sedan',
      B: 'Full lock right and reverse out at speed',
      C: 'Reverse left sharply toward the wall',
      D: 'Pull forward further into the bay, then reverse right',
    },
    correctAnswer: 'A',
    wrongPaths: {
      B: 'Swing into the sedan parked in the adjacent bay',
      C: 'Rear end collides with the wall behind',
      D: 'Pulling forward traps you — front bumper contacts the wall',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Check mirrors',
        description: 'Check your rear-view for the wall distance and side mirrors for adjacent cars',
        highlightWord: 'rear-view',
      },
      {
        stepNumber: 2,
        title: 'Reverse steady',
        description: 'Reverse straight back at walking speed, monitoring the wall distance in your mirror',
        highlightWord: 'walking speed',
      },
      {
        stepNumber: 3,
        title: 'Turn right',
        description: 'Once your rear bumper passes the adjacent sedan, begin turning right',
        highlightWord: 'turning right',
      },
      {
        stepNumber: 4,
        title: 'Exit aisle',
        description: 'Straighten and proceed down the aisle — you have cleared both the wall and the sedan',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'The "bumper-to-wall" rule: when the wall disappears under your rear bumper in the camera view, you have 18 inches — stop and assess before continuing.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟩'],
  },
  {
    id: 8,
    type: 'garage',
    difficulty: 3,
    question: 'You are parked between two structural pillars in a tight garage. What is the safest exit path?',
    environment: 'garage',
    playerCar: { x: 2, y: 1, angle: 180 },
    obstacles: [
      { type: 'pillar', x: 0, y: 1, angle: 0 },
      { type: 'pillar', x: 4, y: 1, angle: 0 },
      { type: 'suv', x: 2, y: 0, angle: 180 },
    ],
    options: {
      A: 'Reverse through the gap between pillars, then turn right',
      B: 'Reverse straight back between both pillars, centred',
      C: 'Full lock left and accelerate out before the gap narrows',
      D: 'Reverse hard right past the right pillar to maximise space',
    },
    correctAnswer: 'B',
    wrongPaths: {
      A: 'Sideswipes the left pillar when angling right',
      C: 'Front wing clips the right pillar during the left turn',
      D: 'Rear bumper collides with the right pillar during hard reverse',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Centre yourself',
        description: 'Look at both pillars in your side mirrors — centre yourself so each appears equally distant',
        highlightWord: 'centre',
      },
      {
        stepNumber: 2,
        title: 'Reverse straight',
        description: 'Reverse straight back at idle speed, keeping equal distance to both pillars',
        highlightWord: 'straight',
      },
      {
        stepNumber: 3,
        title: 'Pass pillars',
        description: 'Once your front bumper clears the pillars, check for the SUV ahead in the aisle',
        highlightWord: 'clears',
      },
      {
        stepNumber: 4,
        title: 'Exit',
        description: 'Turn right and proceed — maintain awareness of the SUV parked opposite',
        highlightWord: 'Turn right',
      },
    ],
    expertTip: 'Two-pillar exits are easier if you focus on the space between them, not on the pillars themselves — target fixation causes drivers to steer toward obstacles.',
    shareBlocks: ['🟩', '🟩', '🟥', '🟩', '🟩'],
  },
  {
    id: 9,
    type: 'garage',
    difficulty: 3,
    question: 'A large SUV is parked next to you in the garage, reducing visibility. How do you reverse out?',
    environment: 'garage',
    playerCar: { x: 2, y: 1, angle: 180 },
    obstacles: [
      { type: 'suv', x: 4, y: 1, angle: 0 },
      { type: 'pillar', x: 0, y: 1, angle: 0 },
    ],
    options: {
      A: 'Reverse with slight left lock, clear the pillar, then straighten',
      B: 'Full lock right and reverse — the SUV blocks that side anyway',
      C: 'Reverse straight back quickly to minimise exposure',
      D: 'Angle right toward the SUV, then cut left hard',
    },
    correctAnswer: 'A',
    wrongPaths: {
      B: 'Swing into the adjacent SUV on the right',
      C: 'Rear bumper hits the pillar on the left',
      D: 'Sideswipes the SUV when cutting toward it',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Angle left',
        description: 'Apply gentle left lock to create distance from the large SUV beside you',
        highlightWord: 'left lock',
      },
      {
        stepNumber: 2,
        title: 'Clear pillar',
        description: 'Watch the left pillar in your mirror — the SUV blocks your right-side view so focus left',
        highlightWord: 'left pillar',
      },
      {
        stepNumber: 3,
        title: 'Check right',
        description: 'Creep further back until you can see past the SUV\'s bonnet for cross-traffic',
        highlightWord: 'Creep',
      },
      {
        stepNumber: 4,
        title: 'Exit',
        description: 'Straighten and proceed — you have cleared the pillar and can now see the aisle',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'When parked beside a large SUV or van, sit higher in your seat or lean forward — an extra 4 inches of eye height can reveal cross-traffic hidden by the larger vehicle.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟥'],
  },
  {
    id: 10,
    type: 'garage',
    difficulty: 3,
    question: 'Three obstacles block your garage exit — a pillar, a sedan, and an SUV. What is the correct sequence?',
    environment: 'garage',
    playerCar: { x: 2, y: 1, angle: 180 },
    obstacles: [
      { type: 'pillar', x: 0, y: 1, angle: 0 },
      { type: 'sedan', x: 3, y: 1, angle: 0 },
      { type: 'suv', x: 4, y: 0, angle: 180 },
    ],
    options: {
      A: 'Reverse right to avoid the pillar, then forward left past the sedan, then exit',
      B: 'Full lock left and accelerate out ignoring the pillar',
      C: 'Reverse straight back without checking the pillar position',
      D: 'Angle toward the sedan then cut right past the SUV',
    },
    correctAnswer: 'A',
    wrongPaths: {
      B: 'Front corner hits the pillar on the left during acceleration',
      C: 'Rear bumper collides with the pillar behind the bay',
      D: 'Sideswipes the sedan when cutting toward it',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Reverse right',
        description: 'Reverse with right lock to avoid the left-side pillar — this also aligns you with the aisle',
        highlightWord: 'right lock',
      },
      {
        stepNumber: 2,
        title: 'Forward left',
        description: 'Shift to drive and move forward left past the sedan, using a full steering lock',
        highlightWord: 'forward left',
      },
      {
        stepNumber: 3,
        title: 'Check SUV',
        description: 'Pause and check the SUV ahead — you now have a clear line to reverse straight out',
        highlightWord: 'check',
      },
      {
        stepNumber: 4,
        title: 'Exit',
        description: 'Reverse straight back into the main aisle and proceed — three-point maneuver complete',
        highlightWord: 'three-point',
      },
    ],
    expertTip: 'Multi-point maneuvers in garages require "thinking in reverse" — picture your car\'s pivot point (centre of rear axle) and plan each turn around it.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟥', '🟩'],
  },

  // ==========================================================================
  // REVERSE BAY — Open lot environment (puzzles 11–15, difficulty 4–5)
  // ==========================================================================
  {
    id: 11,
    type: 'reverse_bay',
    difficulty: 4,
    question: 'You are in a busy car park aisle. How do you reverse into the bay between two parked cars?',
    environment: 'open_lot',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 0, y: 1, angle: 0 },
      { type: 'sedan', x: 4, y: 1, angle: 0 },
    ],
    options: {
      A: 'Approach the bay at a sharp angle and reverse in directly',
      B: 'Pull forward into the space head-first for simplicity',
      C: 'Pull 1.5 car lengths past the bay, reverse with full lock, then straighten',
      D: 'Reverse in a wide arc from the far side of the aisle',
    },
    correctAnswer: 'C',
    wrongPaths: {
      A: 'Sharp angle clips the left sedan — not enough clearance for the front bumper',
      B: 'Sideswipes the left sedan when entering head-first — not enough turning radius',
      D: 'Sideswipes the right sedan during the wide arc approach',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Position',
        description: 'Position your car 1.5 car lengths past the bay, about 3 feet from the parked cars',
        highlightWord: '1.5 car lengths',
      },
      {
        stepNumber: 2,
        title: 'Turn and reverse',
        description: 'Turn the wheel full lock towards the space and begin reversing at walking pace',
        highlightWord: 'full lock',
      },
      {
        stepNumber: 3,
        title: 'Check alignment',
        description: 'At 45 degrees, check both mirrors to ensure you are centred between the cars',
        highlightWord: '45 degrees',
      },
      {
        stepNumber: 4,
        title: 'Straighten',
        description: 'Straighten the wheel and reverse fully into the space — centred and clear',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'The "1.5 car length" reference point is the most common reversal mistake — most drivers start too early, which forces a sharper angle and increases the risk of hitting the adjacent car.',
    shareBlocks: ['🟩', '🟥', '🟩', '🟩', '🟩'],
  },
  {
    id: 12,
    type: 'reverse_bay',
    difficulty: 4,
    question: 'One side of your target bay has a large SUV reducing visibility. How do you reverse in safely?',
    environment: 'open_lot',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'suv', x: 0, y: 1, angle: 0 },
      { type: 'sedan', x: 4, y: 1, angle: 0 },
    ],
    options: {
      A: 'Reverse at a tight angle from alongside the SUV',
      B: 'Pull past the bay on the left, reverse with full right lock into the space',
      C: 'Reverse straight back at full speed to reduce exposure time',
      D: 'Full lock right and reverse in from the far side',
    },
    correctAnswer: 'B',
    wrongPaths: {
      A: 'Sideswipes the SUV when reversing at a tight angle — not enough clearance',
      C: 'Rear bumper collides with the sedan parked behind',
      D: 'Swing into the right sedan during the far-side approach',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Offset right',
        description: 'Pull forward and position your car slightly right of centre — the SUV\'s bulk on the left needs extra clearance',
        highlightWord: 'slightly right',
      },
      {
        stepNumber: 2,
        title: 'Reverse right',
        description: 'Reverse with gentle right lock to angle away from the large SUV and create a smooth entry arc',
        highlightWord: 'right lock',
      },
      {
        stepNumber: 3,
        title: 'Monitor left',
        description: 'Check your left mirror — the SUV\'s front corner is your tightest clearance point',
        highlightWord: 'left mirror',
      },
      {
        stepNumber: 4,
        title: 'Straighten',
        description: 'Straighten the wheel and reverse fully — you are centred and clear of both vehicles',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'When reversing next to a large SUV, their body overhangs the bay line by up to 8 inches — add an extra 6 inches of clearance to avoid a wing-mirror collision.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟥'],
  },
  {
    id: 13,
    type: 'reverse_bay',
    difficulty: 4,
    question: 'A concrete pillar limits your forward positioning. How do you reverse into the bay?',
    environment: 'open_lot',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 0, y: 1, angle: 0 },
      { type: 'suv', x: 4, y: 1, angle: 0 },
      { type: 'pillar', x: 3, y: 0, angle: 0 },
    ],
    options: {
      A: 'Pull forward past the bay and reverse in from the far side',
      B: 'Full lock left and reverse in a wide arc from the far side',
      C: 'Reverse straight back and cut the wheel at the bay entrance',
      D: 'Reverse with full left lock from your current position, clearing the pillar on your right',
    },
    correctAnswer: 'D',
    wrongPaths: {
      A: 'Front bumper clips the pillar ahead when pulling forward past it',
      B: 'Swing into the SUV on the right during the wide arc',
      C: 'Rear bumper hits the sedan behind — too late to create enough angle',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Early reverse',
        description: 'Because the pillar blocks forward movement, begin reversing immediately from your current position',
        highlightWord: 'begin reversing',
      },
      {
        stepNumber: 2,
        title: 'Full left lock',
        description: 'Apply full left lock as you reverse — the early tight turn compensates for the limited forward space',
        highlightWord: 'full left lock',
      },
      {
        stepNumber: 3,
        title: 'Clear pillar',
        description: 'Monitor the gap between your right front corner and the pillar — this is your tightest clearance point',
        highlightWord: 'clearance point',
      },
      {
        stepNumber: 4,
        title: 'Straighten',
        description: 'Straighten the wheel once aligned with the bay and reverse fully — the pillar is cleared and you are centred',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'Forward obstacles force an earlier turn-in, which means a sharper angle — counter-intuitively, this often makes the reverse bay easier because your rear wheels pivot more directly into the space.',
    shareBlocks: ['🟩', '🟩', '🟥', '🟩', '🟩'],
  },
  {
    id: 14,
    type: 'reverse_bay',
    difficulty: 5,
    question: 'A crowded car park with cars on both sides — you need to reverse into a bay at the end of a row.',
    environment: 'open_lot',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 0, y: 1, angle: 0 },
      { type: 'suv', x: 4, y: 1, angle: 0 },
      { type: 'sedan', x: 2, y: 0, angle: 0 },
    ],
    options: {
      A: 'Pull forward past the end bay, reverse with full lock into the space',
      B: 'Reverse immediately from your current position at an angle',
      C: 'Pull forward perpendicular to the bay and reverse straight in',
      D: 'Full lock left and reverse in from the far side of the aisle',
    },
    correctAnswer: 'A',
    wrongPaths: {
      B: 'Immediate reverse collides with the sedan ahead — not enough approach distance',
      C: 'Perpendicular approach hits the SUV on the right — turning circle is too tight',
      D: 'Swing into the right SUV during the far-side approach',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Drive past',
        description: 'Pull forward past the target bay, angling slightly away from the parked cars to create space',
        highlightWord: 'angling slightly',
      },
      {
        stepNumber: 2,
        title: 'Full lock',
        description: 'Turn the wheel full lock towards the bay and begin reversing — your rear wheels arc into the space',
        highlightWord: 'full lock',
      },
      {
        stepNumber: 3,
        title: 'Monitor both sides',
        description: 'Check both mirrors simultaneously — the end bay gives you no buffer on either side',
        highlightWord: 'both mirrors',
      },
      {
        stepNumber: 4,
        title: 'Centre',
        description: 'Straighten at the last moment and centre — end-row bays require perfect final positioning',
        highlightWord: 'centre',
      },
    ],
    expertTip: 'End-row bays are higher risk because there is no buffer car on one side — use a "two-stage" reverse: stop at 45 degrees, reassess, then complete the entry.',
    shareBlocks: ['🟩', '🟩', '🟥', '🟩', '🟩'],
  },
  {
    id: 15,
    type: 'reverse_bay',
    difficulty: 5,
    question: 'A tight lot with cars on both sides of the aisle — you must reverse bay park under pressure.',
    environment: 'open_lot',
    playerCar: { x: 2, y: 1, angle: 0 },
    obstacles: [
      { type: 'sedan', x: 0, y: 1, angle: 0 },
      { type: 'suv', x: 4, y: 1, angle: 0 },
      { type: 'sedan', x: 2, y: 0, angle: 0 },
    ],
    options: {
      A: 'Reverse with full lock from the standard position alongside the bay',
      B: 'Full lock left and reverse hard — speed is your advantage here',
      C: 'Signal early, reverse at 45 degrees with smooth steering, then straighten',
      D: 'Reverse straight back and cut the wheel at the last second',
    },
    correctAnswer: 'C',
    wrongPaths: {
      A: 'Hits the sedan ahead — standard position does not account for the tight lot layout',
      B: 'Hard reverse at full lock swings your front wing into the sedan ahead',
      D: 'Last-second steering collides with the right-side SUV',
    },
    escapeSteps: [
      {
        stepNumber: 1,
        title: 'Position and signal',
        description: 'Position 1.5 lengths past the bay, signal your intention, and check for traffic behind',
        highlightWord: '1.5 lengths',
      },
      {
        stepNumber: 2,
        title: 'Reverse with lock',
        description: 'Reverse with smooth full lock, using clutch or brake control to maintain walking pace',
        highlightWord: 'walking pace',
      },
      {
        stepNumber: 3,
        title: 'Check both sides',
        description: 'At 45 degrees, check both mirrors — the sedan ahead and SUV behind create a narrow corridor',
        highlightWord: '45 degrees',
      },
      {
        stepNumber: 4,
        title: 'Straighten and centre',
        description: 'Straighten the wheel and reverse fully — smooth, slow inputs prevent over-correction',
        highlightWord: 'Straighten',
      },
    ],
    expertTip: 'Under pressure, drivers rush the steering — the most common reverse bay error is turning too early. Count "one-thousand-one, one-thousand-two" after passing the bay before starting your turn.',
    shareBlocks: ['🟩', '🟩', '🟩', '🟩', '🟩'],
  },
];

/**
 * Returns the puzzle for a given sequential ID (1-based).
 * Returns undefined if the ID is out of range (1–15).
 */
export function getPuzzleById(id: number): Puzzle | undefined {
  return puzzles.find((p) => p.id === id);
}
