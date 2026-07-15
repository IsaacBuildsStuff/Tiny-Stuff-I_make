# Prestige System Implementation

Implement a 14-tier prestige system where players reset progress to unlock one new unit per prestige level, with progressive lesson sets and feature unlocks.

## System Design

### Prestige Tiers (14 levels total)
Prestige 0 starts with 3 units (pyros, ironclad, oortho via tutorial). Each subsequent prestige unlocks exactly 1 new unit and a new set of lessons.

**Current Units Available (16 total):**
1. pyros, 2. ironclad, 3. oortho, 4. glacius, 5. shade, 6. rifter, 7. templar, 8. voidmage, 9. stormcaller, 10. warden, 11. hexblade, 12. gunner, 13. berserker, 14. tempus, 15. glitch1, 16. glitch2

**Unit Assignment:**
- **Prestige 0 (No Stars)**: pyros (starter) + ironclad + oortho (via battle tutorial), max level 2, roster tab only
- **Prestige 1 (★)**: glacius, max level 3
- **Prestige 2 (★★)**: shade, max level 4, separate lesson set (12 lessons)
- **Prestige 3 (★★★)**: rifter, max level 5, separate lesson set (12 lessons)
- **Prestige 4 (★★★★)**: templar, max level 6, separate lesson set (12 lessons)
- **Prestige 5 (★★★★★)**: voidmage, max level 7, separate lesson set (12 lessons)
- **Prestige 6 (★★★★★★)**: stormcaller, max level 8, separate lesson set (12 lessons)
- **Prestige 7 (★★★★★★★)**: warden, max level 9, separate lesson set (12 lessons)
- **Prestige 8 (★★★★★★★★)**: hexblade, max level 10, separate lesson set (12 lessons)
- **Prestige 9 (★★★★★★★★★)**: gunner, max level 10, separate lesson set (12 lessons)
- **Prestige 10 (★★★★★★★★★★)**: berserker, max level 10, separate lesson set (12 lessons)
- **Prestige 11 (★★★★★★★★★★★)**: tempus, max level 10, separate lesson set (12 lessons)
- **Prestige 12 (★★★★★★★★★★★★)**: glitch1, max level 10, separate lesson set (24 lessons)
- **Prestige 13 (★★★★★★★★★★★★★)**: glitch2, max level 10, all features

### Feature Restrictions by Prestige
- **Prestige 0**: Roster tab only, basic battle
- **Prestige 1**: Editor tab (Identity page only)
- **Prestige 2**: Get visuals page in editor and first 12 lessons
- **Prestige 3**: Get 1/2 of magic page in editor and lessons 13-24
- **Prestige 4**: other half of magic page, next 12 lessons
- **Prestige 5**: meelee page
- **Prestige 6**: next 12 lessons, passives
- **Prestige 7**: export json button
- **Prestige 8**: next 12 lessons
- **Prestige 9**: new unit button, ranged tab
- **Prestige 10**: next 12 lessons
- **Prestige 11**: Behavior tab and next 12 lessons
- **Prestige 12**: all lessons unlocked
- **Prestige 13**: All remaining features unlocked (complete game)

## Implementation Steps

### 1. Data Structure Updates (JS/7.js)
- Add `prestigeLevel` to Progression stats
- Create `PRESTIGE_CONFIG` with tier definitions
- Add unit unlock groups and lesson sets per tier
- Create feature unlock matrix

### 2. Prestige Logic (JS/7.js)
- Add `canPrestige()` check when reaching level cap
- Implement `prestige()` function to reset progress
- Add `getUnlockedUnits()` based on prestige
- Add `getUnlockedLessons()` based on prestige
- Add `isFeatureUnlocked()` for feature restrictions

### 3. UI Restrictions (JS/3.js, JS/9.js)
- Filter unit list by prestige unlocks
- Hide/disable editor tabs based on prestige
- Show locked indicators for unavailable content
- Add prestige requirement tooltips

### 4. Visual Feedback (CSS/1.css, JS/3.js)
- Add star display in header/panel
- Prestige badge on unit cards
- Progress bar for current prestige tier
- Prestige level indicator in battle view
- Visual distinction for locked content

### 5. Lesson System Integration (JS/5.js)
- Create lesson sets for each prestige tier
- Filter available lessons by prestige
- Add prestige requirement to lesson validation
- Update lesson completion tracking

### 6. Save/Load Updates (JS/7.js)
- Save prestige level to localStorage
- Load and apply prestige restrictions on startup
- Handle prestige migration if structure changes

## Technical Details

### Prestige Reset Behavior
- Reset: level, XP, battles won/lost, missions completed
- Keep: prestige level, custom units (locked until unlocked)
- Auto-select: first available unit from current tier

### Level Caps by Prestige
- Prestige 0: Level 2 max (100 XP)
- Prestige 1: Level 4 max (450 XP)  
- Prestige 2: Level 6 max (1000 XP)
- Prestige 3: Level 8 max (1900 XP)
- Prestige 4+: Level 10 max (3200 XP)

### Visual Elements
- Stars: ★★★★★ display in header
- Badge: Prestige tier name (NOVICE, APPRENTICE, etc.)
- Progress: "Level X/Y (Prestige ★)"
- Locked content: Grayed out with lock icon and tooltip
