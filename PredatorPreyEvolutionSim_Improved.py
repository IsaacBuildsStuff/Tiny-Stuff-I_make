"""
Predator/Prey Evolution Simulator
==================================
A little ecosystem where prey and predators evolve their physical traits
(speed, vision, size, energy efficiency) purely through survival pressure.

There's no hand-coded "intelligence" beyond simple instinctive steering
(flee / chase / seek food / wander) -- the interesting behavior emerges
because individuals with better genomes survive and reproduce more,
generation after generation.

Run it:
    python3 sim.py

Controls:
    SPACE        pause / resume
    + / -        speed up / slow down simulation
    Click        select an agent to inspect its genome
    R            reset the simulation
    ESC          quit
"""

import math
import random
from collections import deque

import pygame
from pygame.math import Vector2

# --------------------------------------------------------------------------
# Configuration -- tweak these to change how the ecosystem behaves
# --------------------------------------------------------------------------

SCREEN_W, SCREEN_H = 1280, 800
SIDEBAR_W = 300
SIM_W = SCREEN_W - SIDEBAR_W
SIM_H = SCREEN_H
FPS = 60
MAX_SIM_SPEED = 8

GRID_CELL = 50          # spatial hash cell size, for fast neighbor queries
STEER_LERP = 0.18        # how quickly agents turn toward their desired direction
WANDER_JITTER = 0.35      # how much a wandering agent's heading drifts per tick

# Population limits
INITIAL_PREY = 60
INITIAL_PRED = 14
MAX_PREY = 160
MAX_PRED = 50
FOOD_MAX = 100
FOOD_RADIUS = 3
FOOD_ENERGY = 38
FOOD_REGROW_TICKS = 140

# Energy economy
START_ENERGY = 45
MOVE_COST_FACTOR = 0.0035
BASE_COST_FACTOR = 0.006
REPRO_PREY = 75
REPRO_PRED = 95
REPRO_GIVE_FRACTION = 0.45
REPRO_COST = 4
CATCH_ENERGY_FRACTION = 0.75
CATCH_FLAT_BONUS = 14

MAX_AGE_PREY = 2600
MAX_AGE_PRED = 3200

# Genetics
MUTATION_RATE = 0.18
MUTATION_STRENGTH = 0.14
TRAIT_BOUNDS = {
    "speed": (0.6, 3.4),
    "vision": (35.0, 170.0),
    "size": (3.0, 11.0),
    "efficiency": (0.6, 1.7),
}

# Migration safety net -- prevents permanent dead-ends. Represents genetic
# diversity occasionally wandering in from neighboring populations.
MIGRATION_INTERVAL = 150
MIGRATION_MIN_PREY = 12
MIGRATION_MIN_PRED = 4

HISTORY_INTERVAL = 5
HISTORY_LEN = 400

# Colors
BG_COLOR = (10, 10, 14)
SIM_BG_COLOR = (16, 18, 22)
SIDEBAR_BG = (26, 27, 34)
FOOD_COLOR = (90, 150, 90)
PREY_GRAPH_COLOR = (110, 220, 110)
PRED_GRAPH_COLOR = (230, 90, 70)
WHITE = (255, 255, 255)


# --------------------------------------------------------------------------
# Genetics
# --------------------------------------------------------------------------

class Genome:
    __slots__ = ("speed", "vision", "size", "efficiency")

    def __init__(self, speed, vision, size, efficiency):
        self.speed = speed
        self.vision = vision
        self.size = size
        self.efficiency = efficiency

    @staticmethod
    def random():
        return Genome(
            speed=random.uniform(1.0, 2.1),
            vision=random.uniform(55, 115),
            size=random.uniform(4.5, 8.0),
            efficiency=random.uniform(0.9, 1.3),
        )

    def mutate(self):
        def m(val, key):
            lo, hi = TRAIT_BOUNDS[key]
            if random.random() < MUTATION_RATE:
                val += random.gauss(0, (hi - lo) * MUTATION_STRENGTH)
            return max(lo, min(hi, val))

        return Genome(
            speed=m(self.speed, "speed"),
            vision=m(self.vision, "vision"),
            size=m(self.size, "size"),
            efficiency=m(self.efficiency, "efficiency"),
        )


# --------------------------------------------------------------------------
# Entities
# --------------------------------------------------------------------------

class Agent:
    __slots__ = ("kind", "pos", "vel", "genome", "energy", "age", "wander_angle", "alive")

    def __init__(self, kind, pos, genome, energy):
        self.kind = kind  # "prey" or "predator"
        self.pos = Vector2(pos)
        self.vel = Vector2(0, 0)
        self.genome = genome
        self.energy = energy
        self.age = 0
        self.wander_angle = random.uniform(0, math.tau)
        self.alive = True


class Food:
    __slots__ = ("pos", "active", "regrow_timer")

    def __init__(self, pos):
        self.pos = Vector2(pos)
        self.active = True
        self.regrow_timer = 0


def random_pos(margin=12):
    return Vector2(random.uniform(margin, SIM_W - margin), random.uniform(margin, SIM_H - margin))


# --------------------------------------------------------------------------
# Spatial hashing -- avoids O(n^2) neighbor scans as populations grow
# --------------------------------------------------------------------------

class SpatialGrid:
    def __init__(self, cell_size=GRID_CELL):
        self.cell_size = cell_size
        self.cells = {}

    def _key(self, x, y):
        return (int(x // self.cell_size), int(y // self.cell_size))

    def insert(self, obj, x, y):
        self.cells.setdefault(self._key(x, y), []).append(obj)

    def nearby(self, x, y, radius):
        result = []
        r = int(radius // self.cell_size) + 1
        cx, cy = self._key(x, y)
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                bucket = self.cells.get((cx + dx, cy + dy))
                if bucket:
                    result.extend(bucket)
        return result


def nearest(candidates, x, y, predicate):
    best = None
    best_d2 = None
    for c in candidates:
        if not predicate(c):
            continue
        dx = c.pos.x - x
        dy = c.pos.y - y
        d2 = dx * dx + dy * dy
        if best_d2 is None or d2 < best_d2:
            best_d2 = d2
            best = c
    return best, (math.sqrt(best_d2) if best_d2 is not None else None)


# --------------------------------------------------------------------------
# World -- holds all state and runs one simulation tick at a time
# --------------------------------------------------------------------------

class World:
    def __init__(self):
        self.tick = 0
        self.total_births = 0
        self.records = {"prey_speed": 0.0, "pred_speed": 0.0, "prey_vision": 0.0, "pred_vision": 0.0}
        self.history_prey = deque(maxlen=HISTORY_LEN)
        self.history_pred = deque(maxlen=HISTORY_LEN)
        self.history_prey.append(INITIAL_PREY)
        self.history_pred.append(INITIAL_PRED)
        self.effects = []

        self.prey = [Agent("prey", random_pos(), Genome.random(), START_ENERGY) for _ in range(INITIAL_PREY)]
        self.predators = [Agent("predator", random_pos(), Genome.random(), START_ENERGY) for _ in range(INITIAL_PRED)]
        self.food = [Food(random_pos()) for _ in range(FOOD_MAX)]

    # ---- per-tick steps -----------------------------------------------

    def step(self):
        self.tick += 1
        self._update_food()

        grid_pred = SpatialGrid()
        for p in self.predators:
            grid_pred.insert(p, p.pos.x, p.pos.y)
        grid_prey = SpatialGrid()
        for p in self.prey:
            grid_prey.insert(p, p.pos.x, p.pos.y)
        grid_food = SpatialGrid()
        for f in self.food:
            if f.active:
                grid_food.insert(f, f.pos.x, f.pos.y)

        new_agents = []

        for prey in self.prey:
            self._steer_prey(prey, grid_pred, grid_food)
            self._apply_physics(prey)
            self._consume_food(prey, grid_food)
            self._maybe_reproduce(prey, self.prey, MAX_PREY, REPRO_PREY, new_agents)
            self._age_and_starve(prey, MAX_AGE_PREY)

        for pred in self.predators:
            self._steer_predator(pred, grid_prey)
            self._apply_physics(pred)
            self._maybe_catch(pred, grid_prey)
            self._maybe_reproduce(pred, self.predators, MAX_PRED, REPRO_PRED, new_agents)
            self._age_and_starve(pred, MAX_AGE_PRED)

        for a in new_agents:
            (self.prey if a.kind == "prey" else self.predators).append(a)

        self.prey = [a for a in self.prey if a.alive]
        self.predators = [a for a in self.predators if a.alive]

        self._migration_check()
        self._update_records()
        self._update_effects()

        if self.tick % HISTORY_INTERVAL == 0:
            self.history_prey.append(len(self.prey))
            self.history_pred.append(len(self.predators))

    # ---- behavior --------------------------------------------------

    def _steer_prey(self, prey, grid_pred, grid_food):
        vision = prey.genome.vision
        threats = grid_pred.nearby(prey.pos.x, prey.pos.y, vision)
        threat, td = nearest(threats, prey.pos.x, prey.pos.y, lambda a: a.alive)

        if threat is not None and td <= vision:
            flee = prey.pos - threat.pos
            desired = flee.normalize() if flee.length_squared() > 1e-6 else Vector2(1, 0)
        else:
            foods = grid_food.nearby(prey.pos.x, prey.pos.y, vision)
            f, fd = nearest(foods, prey.pos.x, prey.pos.y, lambda food: food.active)
            if f is not None and fd <= vision:
                diff = f.pos - prey.pos
                desired = diff.normalize() if diff.length_squared() > 1e-6 else Vector2(0, 0)
            else:
                prey.wander_angle += random.uniform(-WANDER_JITTER, WANDER_JITTER)
                desired = Vector2(math.cos(prey.wander_angle), math.sin(prey.wander_angle))

        prey.vel = prey.vel.lerp(desired * prey.genome.speed, STEER_LERP)

    def _steer_predator(self, pred, grid_prey):
        vision = pred.genome.vision
        targets = grid_prey.nearby(pred.pos.x, pred.pos.y, vision)
        target, td = nearest(targets, pred.pos.x, pred.pos.y, lambda a: a.alive)

        if target is not None and td <= vision:
            chase = target.pos - pred.pos
            desired = chase.normalize() if chase.length_squared() > 1e-6 else Vector2(0, 0)
        else:
            pred.wander_angle += random.uniform(-WANDER_JITTER, WANDER_JITTER)
            desired = Vector2(math.cos(pred.wander_angle), math.sin(pred.wander_angle))

        pred.vel = pred.vel.lerp(desired * pred.genome.speed, STEER_LERP)

    def _apply_physics(self, agent):
        agent.pos += agent.vel
        r = agent.genome.size
        if agent.pos.x < r:
            agent.pos.x = r
            agent.vel.x = abs(agent.vel.x)
        elif agent.pos.x > SIM_W - r:
            agent.pos.x = SIM_W - r
            agent.vel.x = -abs(agent.vel.x)
        if agent.pos.y < r:
            agent.pos.y = r
            agent.vel.y = abs(agent.vel.y)
        elif agent.pos.y > SIM_H - r:
            agent.pos.y = SIM_H - r
            agent.vel.y = -abs(agent.vel.y)

        speed_used = agent.vel.length()
        move_cost = (speed_used ** 2) * MOVE_COST_FACTOR / agent.genome.efficiency
        base_cost = BASE_COST_FACTOR * agent.genome.size
        agent.energy -= (move_cost + base_cost)
        agent.age += 1

    def _consume_food(self, prey, grid_food):
        radius = prey.genome.size + FOOD_RADIUS
        for f in grid_food.nearby(prey.pos.x, prey.pos.y, radius + 4):
            if not f.active:
                continue
            if prey.pos.distance_to(f.pos) <= radius:
                f.active = False
                f.regrow_timer = FOOD_REGROW_TICKS
                prey.energy += FOOD_ENERGY
                self._spawn_effect(f.pos, FOOD_COLOR, max_radius=10)
                break

    def _maybe_catch(self, pred, grid_prey):
        radius = pred.genome.size + 2  # prey's own size factors in via per-candidate check below
        for target in grid_prey.nearby(pred.pos.x, pred.pos.y, radius + 12):
            if not target.alive:
                continue
            catch_r = pred.genome.size + target.genome.size
            if pred.pos.distance_to(target.pos) <= catch_r:
                target.alive = False
                gain = target.energy * CATCH_ENERGY_FRACTION + CATCH_FLAT_BONUS
                pred.energy += gain
                self._spawn_effect(target.pos, (255, 110, 80), max_radius=20, growth=1.6)
                break

    def _maybe_reproduce(self, agent, population, max_pop, threshold, new_agents):
        if agent.energy < threshold:
            return
        same_kind_pending = sum(1 for a in new_agents if a.kind == agent.kind)
        if len(population) + same_kind_pending >= max_pop:
            return
        give = agent.energy * REPRO_GIVE_FRACTION
        agent.energy -= (give + REPRO_COST)
        offset = Vector2(random.uniform(-8, 8), random.uniform(-8, 8))
        child = Agent(agent.kind, agent.pos + offset, agent.genome.mutate(), give)
        new_agents.append(child)
        self._spawn_effect(agent.pos, WHITE, max_radius=16, growth=1.1)
        self.total_births += 1

    def _age_and_starve(self, agent, max_age):
        if agent.energy <= 0 or agent.age > max_age:
            agent.alive = False

    def _update_food(self):
        for f in self.food:
            if not f.active:
                f.regrow_timer -= 1
                if f.regrow_timer <= 0:
                    f.pos = random_pos()
                    f.active = True

    def _migration_check(self):
        if self.tick % MIGRATION_INTERVAL != 0:
            return
        if len(self.prey) < MIGRATION_MIN_PREY and len(self.prey) < MAX_PREY:
            for _ in range(3):
                self.prey.append(Agent("prey", random_pos(), Genome.random(), START_ENERGY))
        if len(self.predators) < MIGRATION_MIN_PRED and len(self.predators) < MAX_PRED:
            for _ in range(2):
                self.predators.append(Agent("predator", random_pos(), Genome.random(), START_ENERGY))

    def _update_records(self):
        for a in self.prey:
            if a.genome.speed > self.records["prey_speed"]:
                self.records["prey_speed"] = a.genome.speed
            if a.genome.vision > self.records["prey_vision"]:
                self.records["prey_vision"] = a.genome.vision
        for a in self.predators:
            if a.genome.speed > self.records["pred_speed"]:
                self.records["pred_speed"] = a.genome.speed
            if a.genome.vision > self.records["pred_vision"]:
                self.records["pred_vision"] = a.genome.vision

    # ---- visual effects (birth flashes, catch bursts) ------------------

    def _spawn_effect(self, pos, color, max_radius=14, growth=1.2):
        self.effects.append({"pos": Vector2(pos), "r": 1.0, "max_r": max_radius, "color": color, "growth": growth})

    def _update_effects(self):
        for e in self.effects:
            e["r"] += e["growth"]
        self.effects = [e for e in self.effects if e["r"] < e["max_r"]]

    # ---- queries for the UI --------------------------------------------

    def find_agent_near(self, x, y, radius):
        best, best_d = None, radius
        for a in self.prey:
            d = a.pos.distance_to((x, y))
            if d <= best_d:
                best_d, best = d, a
        for a in self.predators:
            d = a.pos.distance_to((x, y))
            if d <= best_d:
                best_d, best = d, a
        return best

    # ---- drawing --------------------------------------------------------

    def draw(self, surface):
        pygame.draw.rect(surface, SIM_BG_COLOR, (0, 0, SIM_W, SIM_H))
        for f in self.food:
            if f.active:
                pygame.draw.circle(surface, FOOD_COLOR, (int(f.pos.x), int(f.pos.y)), FOOD_RADIUS)
        for p in self.prey:
            _draw_agent(surface, p, _prey_color(p.genome))
        for p in self.predators:
            _draw_agent(surface, p, _pred_color(p.genome))
        for e in self.effects:
            pygame.draw.circle(surface, e["color"], (int(e["pos"].x), int(e["pos"].y)), int(e["r"]), 1)


# --------------------------------------------------------------------------
# Drawing helpers (free functions so World stays display-agnostic for tests)
# --------------------------------------------------------------------------

def _lerp_color(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def _prey_color(genome):
    lo, hi = TRAIT_BOUNDS["speed"]
    t = (genome.speed - lo) / (hi - lo)
    return _lerp_color((40, 110, 60), (150, 255, 120), t)


def _pred_color(genome):
    lo, hi = TRAIT_BOUNDS["speed"]
    t = (genome.speed - lo) / (hi - lo)
    return _lerp_color((120, 40, 40), (255, 90, 60), t)


def _draw_agent(surface, agent, color):
    if agent.vel.length_squared() > 1e-4:
        angle = math.atan2(agent.vel.y, agent.vel.x)
    else:
        angle = agent.wander_angle
    size = agent.genome.size
    tip = agent.pos + Vector2(math.cos(angle), math.sin(angle)) * size * 1.7
    left = agent.pos + Vector2(math.cos(angle + 2.5), math.sin(angle + 2.5)) * size
    right = agent.pos + Vector2(math.cos(angle - 2.5), math.sin(angle - 2.5)) * size
    pygame.draw.polygon(surface, color, [tip, left, right])


def draw_graph(surface, rect, hist_prey, hist_pred):
    pygame.draw.rect(surface, (15, 15, 20), rect)
    pygame.draw.rect(surface, (60, 60, 70), rect, 1)
    if len(hist_prey) < 2 and len(hist_pred) < 2:
        return
    max_val = max(max(hist_prey, default=1), max(hist_pred, default=1), 5)

    def to_points(hist):
        n = len(hist)
        pts = []
        for i, v in enumerate(hist):
            x = rect.left + (i / max(1, n - 1)) * rect.width
            y = rect.bottom - (v / max_val) * (rect.height - 4) - 2
            pts.append((x, y))
        return pts

    if len(hist_prey) >= 2:
        pygame.draw.lines(surface, PREY_GRAPH_COLOR, False, to_points(hist_prey), 2)
    if len(hist_pred) >= 2:
        pygame.draw.lines(surface, PRED_GRAPH_COLOR, False, to_points(hist_pred), 2)


def draw_sidebar(screen, world, font, font_small, font_title, sim_speed, paused, selected):
    rect = pygame.Rect(SIM_W, 0, SIDEBAR_W, SCREEN_H)
    pygame.draw.rect(screen, SIDEBAR_BG, rect)
    pygame.draw.line(screen, (60, 60, 70), (SIM_W, 0), (SIM_W, SCREEN_H), 2)

    x = SIM_W + 16
    y = 14
    screen.blit(font_title.render("EVOLUTION SIM", True, (230, 230, 235)), (x, y))
    y += 30

    # legend
    pygame.draw.polygon(screen, (150, 255, 120), [(x, y + 10), (x + 12, y + 5), (x + 12, y + 15)])
    screen.blit(font_small.render("prey", True, (190, 190, 195)), (x + 18, y + 2))
    pygame.draw.polygon(screen, (255, 90, 60), [(x + 70, y + 10), (x + 82, y + 5), (x + 82, y + 15)])
    screen.blit(font_small.render("predator", True, (190, 190, 195)), (x + 88, y + 2))
    pygame.draw.circle(screen, FOOD_COLOR, (x + 160, y + 8), FOOD_RADIUS)
    screen.blit(font_small.render("food", True, (190, 190, 195)), (x + 168, y + 2))
    y += 28

    lines = [
        f"Tick: {world.tick}",
        f"Prey: {len(world.prey)}    Predators: {len(world.predators)}",
        f"Food active: {sum(1 for f in world.food if f.active)}/{len(world.food)}",
        f"Total births: {world.total_births}",
        f"Speed: {'PAUSED' if paused else f'{sim_speed}x'}",
    ]
    for line in lines:
        screen.blit(font_small.render(line, True, (200, 200, 205)), (x, y))
        y += 20

    y += 6
    screen.blit(font.render("Average traits", True, (220, 220, 225)), (x, y))
    y += 22
    if world.prey:
        n = len(world.prey)
        avg_speed = sum(p.genome.speed for p in world.prey) / n
        avg_vision = sum(p.genome.vision for p in world.prey) / n
        avg_size = sum(p.genome.size for p in world.prey) / n
        screen.blit(font_small.render(
            f"Prey  spd {avg_speed:.2f}  vis {avg_vision:.0f}  sz {avg_size:.1f}",
            True, PREY_GRAPH_COLOR), (x, y))
        y += 18
    if world.predators:
        n = len(world.predators)
        avg_speed = sum(p.genome.speed for p in world.predators) / n
        avg_vision = sum(p.genome.vision for p in world.predators) / n
        avg_size = sum(p.genome.size for p in world.predators) / n
        screen.blit(font_small.render(
            f"Pred  spd {avg_speed:.2f}  vis {avg_vision:.0f}  sz {avg_size:.1f}",
            True, PRED_GRAPH_COLOR), (x, y))
        y += 18

    y += 6
    screen.blit(font.render("All-time max speed", True, (220, 220, 225)), (x, y))
    y += 22
    screen.blit(font_small.render(f"Prey: {world.records['prey_speed']:.2f}", True, PREY_GRAPH_COLOR), (x, y))
    y += 18
    screen.blit(font_small.render(f"Pred: {world.records['pred_speed']:.2f}", True, PRED_GRAPH_COLOR), (x, y))
    y += 26

    screen.blit(font_small.render("Population history", True, (160, 160, 168)), (x, y))
    y += 18
    graph_rect = pygame.Rect(x, y, SIDEBAR_W - 32, 110)
    draw_graph(screen, graph_rect, world.history_prey, world.history_pred)
    y += 122

    if selected is not None and selected.alive:
        y += 6
        pygame.draw.line(screen, (60, 60, 70), (x, y), (x + SIDEBAR_W - 32, y), 1)
        y += 10
        screen.blit(font.render(f"Selected: {selected.kind}", True, (255, 255, 255)), (x, y))
        y += 20
        g = selected.genome
        info = [
            f"speed       {g.speed:.2f}",
            f"vision      {g.vision:.0f}",
            f"size        {g.size:.1f}",
            f"efficiency  {g.efficiency:.2f}",
            f"energy      {selected.energy:.0f}",
            f"age         {selected.age}",
        ]
        for line in info:
            screen.blit(font_small.render(line, True, (210, 210, 215)), (x, y))
            y += 18

    help_lines = [
        "SPACE pause   +/- speed",
        "click: inspect agent",
        "R reset    ESC quit",
    ]
    hy = SCREEN_H - 18 * len(help_lines) - 12
    for line in help_lines:
        screen.blit(font_small.render(line, True, (110, 110, 120)), (x, hy))
        hy += 18


# --------------------------------------------------------------------------
# Main loop
# --------------------------------------------------------------------------

def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    pygame.display.set_caption("Predator / Prey Evolution Sim")
    clock = pygame.time.Clock()

    font = pygame.font.SysFont("consolas", 16)
    if font is None:
        font = pygame.font.Font(None, 18)
    font_small = pygame.font.SysFont("consolas", 14) or pygame.font.Font(None, 15)
    font_title = pygame.font.SysFont("consolas", 20, bold=True) or pygame.font.Font(None, 22)

    world = World()
    sim_speed = 1
    paused = False
    selected = None
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    paused = not paused
                elif event.key in (pygame.K_EQUALS, pygame.K_PLUS, pygame.K_KP_PLUS):
                    sim_speed = min(MAX_SIM_SPEED, sim_speed + 1)
                elif event.key in (pygame.K_MINUS, pygame.K_KP_MINUS):
                    sim_speed = max(1, sim_speed - 1)
                elif event.key == pygame.K_r:
                    world = World()
                    selected = None
                elif event.key == pygame.K_ESCAPE:
                    running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mx, my = event.pos
                if mx < SIM_W:
                    found = world.find_agent_near(mx, my, 16)
                    selected = found

        if not paused:
            for _ in range(sim_speed):
                world.step()

        if selected is not None and not selected.alive:
            selected = None

        screen.fill(BG_COLOR)
        world.draw(screen)

        if selected is not None and selected.alive:
            pygame.draw.circle(screen, (255, 255, 255),
                                (int(selected.pos.x), int(selected.pos.y)),
                                int(selected.genome.size) + 4, 1)
            pygame.draw.circle(screen, (90, 90, 100),
                                (int(selected.pos.x), int(selected.pos.y)),
                                int(selected.genome.vision), 1)

        draw_sidebar(screen, world, font, font_small, font_title, sim_speed, paused, selected)
        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()


if __name__ == "__main__":
    main()
