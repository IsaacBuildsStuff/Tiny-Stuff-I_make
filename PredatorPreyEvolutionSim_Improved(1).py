"""
Predator / Prey Evolution Simulator
==================================

A little ecosystem where prey and predators evolve physical traits
(speed, vision, size, energy efficiency) purely through survival pressure.

Controls:
    SPACE        pause / resume
    + / -        speed up / slow down simulation
    Click        select an agent to inspect its genome
    R            reset the simulation
    ESC          quit
"""

from __future__ import annotations

import math
import random
from collections import deque
from dataclasses import dataclass
from typing import Callable, Deque, Dict, Iterable, List, Optional, Sequence, Tuple, TypeVar

import pygame
from pygame.math import Vector2

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

SCREEN_W: int = 1280
SCREEN_H: int = 800
SIDEBAR_W: int = 300
SIM_W: int = SCREEN_W - SIDEBAR_W
SIM_H: int = SCREEN_H
FPS: int = 60
MAX_SIM_SPEED: int = 8

GRID_CELL: int = 50
STEER_LERP: float = 0.18
WANDER_JITTER: float = 0.35

# Population limits
INITIAL_PREY: int = 60
INITIAL_PRED: int = 14
MAX_PREY: int = 160
MAX_PRED: int = 50
FOOD_MAX: int = 100
FOOD_RADIUS: int = 3
FOOD_ENERGY: float = 38.0
FOOD_REGROW_TICKS: int = 140

# Energy economy
START_ENERGY: float = 45.0
MOVE_COST_FACTOR: float = 0.0035
BASE_COST_FACTOR: float = 0.006
REPRO_PREY: float = 75.0
REPRO_PRED: float = 95.0
REPRO_GIVE_FRACTION: float = 0.45
REPRO_COST: float = 4.0
CATCH_ENERGY_FRACTION: float = 0.75
CATCH_FLAT_BONUS: float = 14.0

MAX_AGE_PREY: int = 2600
MAX_AGE_PRED: int = 3200

# Genetics
MUTATION_RATE: float = 0.18
MUTATION_STRENGTH: float = 0.14
TRAIT_BOUNDS: Dict[str, Tuple[float, float]] = {
    "speed": (0.6, 3.4),
    "vision": (35.0, 170.0),
    "size": (3.0, 11.0),
    "efficiency": (0.6, 1.7),
}

# Recovery safety net
MIGRATION_INTERVAL: int = 150
MIGRATION_MIN_PREY: int = 12
MIGRATION_MIN_PRED: int = 4

# History / trails
HISTORY_INTERVAL: int = 5
HISTORY_LEN: int = 400
TRAIL_LEN: int = 12
MAX_EFFECTS: int = 300

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

@dataclass(slots=True)
class Genome:
    speed: float
    vision: float
    size: float
    efficiency: float

    @staticmethod
    def random() -> "Genome":
        return Genome(
            speed=random.uniform(1.0, 2.1),
            vision=random.uniform(55.0, 115.0),
            size=random.uniform(4.5, 8.0),
            efficiency=random.uniform(0.9, 1.3),
        )

    def mutate(self) -> "Genome":
        def mutate_value(value: float, key: str) -> float:
            lo, hi = TRAIT_BOUNDS[key]
            if random.random() < MUTATION_RATE:
                value += random.gauss(0.0, (hi - lo) * MUTATION_STRENGTH)
            return max(lo, min(hi, value))

        return Genome(
            speed=mutate_value(self.speed, "speed"),
            vision=mutate_value(self.vision, "vision"),
            size=mutate_value(self.size, "size"),
            efficiency=mutate_value(self.efficiency, "efficiency"),
        )


# --------------------------------------------------------------------------
# Entities
# --------------------------------------------------------------------------

class Agent:
    __slots__ = (
        "kind",
        "pos",
        "vel",
        "genome",
        "energy",
        "age",
        "generation",
        "wander_angle",
        "alive",
        "trail",
    )

    def __init__(
        self,
        kind: str,
        pos: Vector2 | Tuple[float, float],
        genome: Genome,
        energy: float,
        generation: int = 0,
    ) -> None:
        self.kind = kind
        self.pos = Vector2(pos)
        self.vel = Vector2(0, 0)
        self.genome = genome
        self.energy = float(energy)
        self.age = 0
        self.generation = generation
        self.wander_angle = random.uniform(0, math.tau)
        self.alive = True
        self.trail: Deque[Vector2] = deque(maxlen=TRAIL_LEN)


class Food:
    __slots__ = ("pos", "active", "regrow_timer")

    def __init__(self, pos: Vector2 | Tuple[float, float]) -> None:
        self.pos = Vector2(pos)
        self.active = True
        self.regrow_timer = 0


def random_pos(margin: float = 12.0) -> Vector2:
    return Vector2(
        random.uniform(margin, SIM_W - margin),
        random.uniform(margin, SIM_H - margin),
    )


def clamp_point(p: Vector2) -> Vector2:
    p.x = max(0.0, min(float(SIM_W), p.x))
    p.y = max(0.0, min(float(SIM_H), p.y))
    return p


# --------------------------------------------------------------------------
# Spatial hashing
# --------------------------------------------------------------------------

T = TypeVar("T")


class SpatialGrid:
    def __init__(self, cell_size: int = GRID_CELL) -> None:
        self.cell_size = cell_size
        self.cells: Dict[Tuple[int, int], List[T]] = {}

    def clear(self) -> None:
        self.cells.clear()

    def _key(self, x: float, y: float) -> Tuple[int, int]:
        return (int(x // self.cell_size), int(y // self.cell_size))

    def insert(self, obj: T, x: float, y: float) -> None:
        self.cells.setdefault(self._key(x, y), []).append(obj)

    def nearby(self, x: float, y: float, radius: float) -> List[T]:
        result: List[T] = []
        r = int(radius // self.cell_size) + 1
        cx, cy = self._key(x, y)
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                bucket = self.cells.get((cx + dx, cy + dy))
                if bucket:
                    result.extend(bucket)
        return result


def dist2(a: Vector2, b: Vector2) -> float:
    d = a - b
    return d.x * d.x + d.y * d.y


def nearest(
    candidates: Sequence[T],
    x: float,
    y: float,
    predicate: Callable[[T], bool],
) -> Tuple[Optional[T], Optional[float]]:
    best: Optional[T] = None
    best_d2: Optional[float] = None
    target = Vector2(x, y)
    for c in candidates:
        if not predicate(c):
            continue
        d2 = dist2(c.pos, target)  # type: ignore[attr-defined]
        if best_d2 is None or d2 < best_d2:
            best_d2 = d2
            best = c
    return best, (math.sqrt(best_d2) if best_d2 is not None else None)


# --------------------------------------------------------------------------
# World
# --------------------------------------------------------------------------

class World:
    def __init__(self) -> None:
        self.tick = 0
        self.total_births = 0
        self.total_deaths = 0
        self.records = {
            "prey_speed": 0.0,
            "pred_speed": 0.0,
            "prey_vision": 0.0,
            "pred_vision": 0.0,
        }
        self.history_prey: Deque[int] = deque(maxlen=HISTORY_LEN)
        self.history_pred: Deque[int] = deque(maxlen=HISTORY_LEN)
        self.effects: List[Dict[str, object]] = []

        self.prey: List[Agent] = [
            Agent("prey", random_pos(), Genome.random(), START_ENERGY, generation=0)
            for _ in range(INITIAL_PREY)
        ]
        self.predators: List[Agent] = [
            Agent("predator", random_pos(), Genome.random(), START_ENERGY, generation=0)
            for _ in range(INITIAL_PRED)
        ]
        self.food: List[Food] = [Food(random_pos()) for _ in range(FOOD_MAX)]

        self.history_prey.append(len(self.prey))
        self.history_pred.append(len(self.predators))

        self.grid_pred = SpatialGrid()
        self.grid_prey = SpatialGrid()
        self.grid_food = SpatialGrid()

    def reset(self) -> None:
        self.__init__()

    def step(self) -> None:
        self.tick += 1
        self._update_food()

        self.grid_pred.clear()
        self.grid_prey.clear()
        self.grid_food.clear()

        for p in self.predators:
            self.grid_pred.insert(p, p.pos.x, p.pos.y)
        for p in self.prey:
            self.grid_prey.insert(p, p.pos.x, p.pos.y)
        for f in self.food:
            if f.active:
                self.grid_food.insert(f, f.pos.x, f.pos.y)

        new_agents: List[Agent] = []

        for prey in self.prey:
            self._steer_prey(prey)
            self._apply_physics(prey)
            self._consume_food(prey)
            self._maybe_reproduce(prey, self.prey, MAX_PREY, REPRO_PREY, new_agents)
            self._age_and_starve(prey, MAX_AGE_PREY)

        for pred in self.predators:
            self._steer_predator(pred)
            self._apply_physics(pred)
            self._maybe_catch(pred)
            self._maybe_reproduce(pred, self.predators, MAX_PRED, REPRO_PRED, new_agents)
            self._age_and_starve(pred, MAX_AGE_PRED)

        for a in new_agents:
            if a.kind == "prey":
                self.prey.append(a)
            else:
                self.predators.append(a)

        before_prey = len(self.prey)
        before_pred = len(self.predators)

        self.prey = [a for a in self.prey if a.alive]
        self.predators = [a for a in self.predators if a.alive]

        self.total_deaths += (before_prey - len(self.prey)) + (before_pred - len(self.predators))

        self._migration_check()
        self._update_records()
        self._update_effects()

        if self.tick % HISTORY_INTERVAL == 0:
            self.history_prey.append(len(self.prey))
            self.history_pred.append(len(self.predators))

    # ---- behavior --------------------------------------------------

    def _steer_prey(self, prey: Agent) -> None:
        vision = prey.genome.vision
        threats = self.grid_pred.nearby(prey.pos.x, prey.pos.y, vision)
        threat, td = nearest(threats, prey.pos.x, prey.pos.y, lambda a: a.alive)

        if threat is not None and td is not None and td <= vision:
            flee = prey.pos - threat.pos
            desired = flee.normalize() if flee.length_squared() > 1e-6 else Vector2(1, 0)
        else:
            foods = self.grid_food.nearby(prey.pos.x, prey.pos.y, vision)
            f, fd = nearest(foods, prey.pos.x, prey.pos.y, lambda food: food.active)
            if f is not None and fd is not None and fd <= vision:
                diff = f.pos - prey.pos
                desired = diff.normalize() if diff.length_squared() > 1e-6 else Vector2(0, 0)
            else:
                prey.wander_angle += random.uniform(-WANDER_JITTER, WANDER_JITTER)
                desired = Vector2(math.cos(prey.wander_angle), math.sin(prey.wander_angle))

        prey.vel = prey.vel.lerp(desired * prey.genome.speed, STEER_LERP)

    def _steer_predator(self, pred: Agent) -> None:
        vision = pred.genome.vision
        targets = self.grid_prey.nearby(pred.pos.x, pred.pos.y, vision)
        target, td = nearest(targets, pred.pos.x, pred.pos.y, lambda a: a.alive)

        if target is not None and td is not None and td <= vision:
            chase = target.pos - pred.pos
            desired = chase.normalize() if chase.length_squared() > 1e-6 else Vector2(0, 0)
        else:
            pred.wander_angle += random.uniform(-WANDER_JITTER, WANDER_JITTER)
            desired = Vector2(math.cos(pred.wander_angle), math.sin(pred.wander_angle))

        pred.vel = pred.vel.lerp(desired * pred.genome.speed, STEER_LERP)

    def _apply_physics(self, agent: Agent) -> None:
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

        agent.trail.append(Vector2(agent.pos))

    def _consume_food(self, prey: Agent) -> None:
        radius = prey.genome.size + FOOD_RADIUS
        radius2 = radius * radius
        for f in self.grid_food.nearby(prey.pos.x, prey.pos.y, radius + 4):
            if not f.active:
                continue
            if dist2(prey.pos, f.pos) <= radius2:
                f.active = False
                f.regrow_timer = FOOD_REGROW_TICKS
                prey.energy += FOOD_ENERGY
                self._spawn_effect(f.pos, FOOD_COLOR, max_radius=10, growth=1.2)
                break

    def _maybe_catch(self, pred: Agent) -> None:
        search_r = pred.genome.size + 12.0
        search_r2 = search_r * search_r
        for target in self.grid_prey.nearby(pred.pos.x, pred.pos.y, search_r):
            if not target.alive:
                continue
            catch_r = pred.genome.size + target.genome.size
            if dist2(pred.pos, target.pos) <= catch_r * catch_r:
                target.alive = False
                gain = target.energy * CATCH_ENERGY_FRACTION + CATCH_FLAT_BONUS
                pred.energy += gain
                self._spawn_effect(target.pos, (255, 110, 80), max_radius=20, growth=1.6)
                break

    def _maybe_reproduce(
        self,
        agent: Agent,
        population: List[Agent],
        max_pop: int,
        threshold: float,
        new_agents: List[Agent],
    ) -> None:
        if agent.energy < threshold:
            return

        same_kind_pending = sum(1 for a in new_agents if a.kind == agent.kind)
        if len(population) + same_kind_pending >= max_pop:
            return

        give = agent.energy * REPRO_GIVE_FRACTION
        agent.energy -= (give + REPRO_COST)

        spawn = clamp_point(agent.pos + Vector2(random.uniform(-8, 8), random.uniform(-8, 8)))
        child = Agent(
            agent.kind,
            spawn,
            agent.genome.mutate(),
            give,
            generation=agent.generation + 1,
        )
        new_agents.append(child)
        self._spawn_effect(agent.pos, WHITE, max_radius=16, growth=1.1)
        self.total_births += 1

    def _age_and_starve(self, agent: Agent, max_age: int) -> None:
        if agent.energy <= 0 or agent.age > max_age:
            agent.alive = False

    def _update_food(self) -> None:
        for f in self.food:
            if not f.active:
                f.regrow_timer -= 1
                if f.regrow_timer <= 0:
                    f.pos = random_pos()
                    f.active = True

    def _migration_check(self) -> None:
        if self.tick % MIGRATION_INTERVAL != 0:
            return

        if not self.prey:
            self.prey.append(Agent("prey", random_pos(), Genome.random(), START_ENERGY))
        elif len(self.prey) < MIGRATION_MIN_PREY and len(self.prey) < MAX_PREY:
            for _ in range(3):
                self.prey.append(Agent("prey", random_pos(), Genome.random(), START_ENERGY))

        if not self.predators:
            self.predators.append(Agent("predator", random_pos(), Genome.random(), START_ENERGY))
        elif len(self.predators) < MIGRATION_MIN_PRED and len(self.predators) < MAX_PRED:
            for _ in range(2):
                self.predators.append(Agent("predator", random_pos(), Genome.random(), START_ENERGY))

    def _update_records(self) -> None:
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

    def _spawn_effect(self, pos: Vector2, color: Tuple[int, int, int], max_radius: int = 14, growth: float = 1.2) -> None:
        if len(self.effects) >= MAX_EFFECTS:
            self.effects.pop(0)
        self.effects.append(
            {
                "pos": Vector2(pos),
                "r": 1.0,
                "max_r": float(max_radius),
                "color": color,
                "growth": float(growth),
            }
        )

    def _update_effects(self) -> None:
        for e in self.effects:
            e["r"] = float(e["r"]) + float(e["growth"])
        self.effects = [e for e in self.effects if float(e["r"]) < float(e["max_r"])]

    def find_agent_near(self, x: float, y: float, radius: float) -> Optional[Agent]:
        best: Optional[Agent] = None
        best_d2 = radius * radius
        click = Vector2(x, y)

        for a in self.prey:
            d2 = dist2(a.pos, click)
            if d2 <= best_d2:
                best_d2 = d2
                best = a
        for a in self.predators:
            d2 = dist2(a.pos, click)
            if d2 <= best_d2:
                best_d2 = d2
                best = a
        return best

    # ---- drawing --------------------------------------------------------

    def draw(self, surface: pygame.Surface) -> None:
        pygame.draw.rect(surface, SIM_BG_COLOR, (0, 0, SIM_W, SIM_H))

        for f in self.food:
            if f.active:
                pygame.draw.circle(surface, FOOD_COLOR, (int(f.pos.x), int(f.pos.y)), FOOD_RADIUS)

        for p in self.prey:
            _draw_agent(surface, p, _prey_color(p.genome))
        for p in self.predators:
            _draw_agent(surface, p, _pred_color(p.genome))

        for e in self.effects:
            pygame.draw.circle(
                surface,
                e["color"],  # type: ignore[arg-type]
                (int(float(e["pos"].x)), int(float(e["pos"].y))),  # type: ignore[union-attr]
                max(1, int(float(e["r"]))),
                1,
            )


# --------------------------------------------------------------------------
# Drawing helpers
# --------------------------------------------------------------------------

def _lerp_color(c1: Tuple[int, int, int], c2: Tuple[int, int, int], t: float) -> Tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def _prey_color(genome: Genome) -> Tuple[int, int, int]:
    lo, hi = TRAIT_BOUNDS["speed"]
    t = (genome.speed - lo) / (hi - lo)
    return _lerp_color((40, 110, 60), (150, 255, 120), t)


def _pred_color(genome: Genome) -> Tuple[int, int, int]:
    lo, hi = TRAIT_BOUNDS["speed"]
    t = (genome.speed - lo) / (hi - lo)
    return _lerp_color((120, 40, 40), (255, 90, 60), t)


def _draw_agent(surface: pygame.Surface, agent: Agent, color: Tuple[int, int, int]) -> None:
    if agent.vel.length_squared() > 1e-4:
        angle = math.atan2(agent.vel.y, agent.vel.x)
    else:
        angle = agent.wander_angle

    size = agent.genome.size
    tip = agent.pos + Vector2(math.cos(angle), math.sin(angle)) * size * 1.7
    left = agent.pos + Vector2(math.cos(angle + 2.5), math.sin(angle + 2.5)) * size
    right = agent.pos + Vector2(math.cos(angle - 2.5), math.sin(angle - 2.5)) * size
    pygame.draw.polygon(surface, color, [tip, left, right])

    # Tiny trail accent for readability
    if len(agent.trail) >= 2:
        pts = [(int(p.x), int(p.y)) for p in agent.trail]
        pygame.draw.lines(surface, color, False, pts, 1)


def draw_graph(
    surface: pygame.Surface,
    rect: pygame.Rect,
    hist_prey: Sequence[int],
    hist_pred: Sequence[int],
) -> None:
    pygame.draw.rect(surface, (15, 15, 20), rect)
    pygame.draw.rect(surface, (60, 60, 70), rect, 1)

    if len(hist_prey) < 2 and len(hist_pred) < 2:
        return

    max_val = max(max(hist_prey, default=1), max(hist_pred, default=1), 5)

    def to_points(hist: Sequence[int]) -> List[Tuple[float, float]]:
        n = len(hist)
        pts: List[Tuple[float, float]] = []
        for i, v in enumerate(hist):
            x = rect.left + (i / max(1, n - 1)) * rect.width
            y = rect.bottom - (v / max_val) * (rect.height - 4) - 2
            pts.append((x, y))
        return pts

    if len(hist_prey) >= 2:
        pygame.draw.lines(surface, PREY_GRAPH_COLOR, False, to_points(hist_prey), 2)
    if len(hist_pred) >= 2:
        pygame.draw.lines(surface, PRED_GRAPH_COLOR, False, to_points(hist_pred), 2)


def draw_sidebar(
    screen: pygame.Surface,
    world: World,
    font: pygame.font.Font,
    font_small: pygame.font.Font,
    font_title: pygame.font.Font,
    sim_speed: int,
    paused: bool,
    selected: Optional[Agent],
) -> None:
    rect = pygame.Rect(SIM_W, 0, SIDEBAR_W, SCREEN_H)
    pygame.draw.rect(screen, SIDEBAR_BG, rect)
    pygame.draw.line(screen, (60, 60, 70), (SIM_W, 0), (SIM_W, SCREEN_H), 2)

    x = SIM_W + 16
    y = 14
    screen.blit(font_title.render("EVOLUTION SIM", True, (230, 230, 235)), (x, y))
    y += 30

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
        f"Total deaths: {world.total_deaths}",
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
        avg_eff = sum(p.genome.efficiency for p in world.prey) / n
        screen.blit(
            font_small.render(
                f"Prey  spd {avg_speed:.2f}  vis {avg_vision:.0f}  sz {avg_size:.1f}  eff {avg_eff:.2f}",
                True,
                PREY_GRAPH_COLOR,
            ),
            (x, y),
        )
        y += 18

    if world.predators:
        n = len(world.predators)
        avg_speed = sum(p.genome.speed for p in world.predators) / n
        avg_vision = sum(p.genome.vision for p in world.predators) / n
        avg_size = sum(p.genome.size for p in world.predators) / n
        avg_eff = sum(p.genome.efficiency for p in world.predators) / n
        screen.blit(
            font_small.render(
                f"Pred  spd {avg_speed:.2f}  vis {avg_vision:.0f}  sz {avg_size:.1f}  eff {avg_eff:.2f}",
                True,
                PRED_GRAPH_COLOR,
            ),
            (x, y),
        )
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
            f"generation  {selected.generation}",
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

def main() -> None:
    pygame.init()
    pygame.font.init()

    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    pygame.display.set_caption("Predator / Prey Evolution Sim")
    clock = pygame.time.Clock()

    try:
        font = pygame.font.SysFont("consolas", 16)
        font_small = pygame.font.SysFont("consolas", 14)
        font_title = pygame.font.SysFont("consolas", 20, bold=True)
    except Exception:
        font = pygame.font.Font(None, 18)
        font_small = pygame.font.Font(None, 15)
        font_title = pygame.font.Font(None, 22)

    world = World()
    sim_speed = 1
    paused = False
    selected: Optional[Agent] = None
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
                    selected = world.find_agent_near(mx, my, 16)

        if not paused:
            for _ in range(sim_speed):
                world.step()

        if selected is not None and not selected.alive:
            selected = None

        screen.fill(BG_COLOR)
        world.draw(screen)

        if selected is not None and selected.alive:
            pygame.draw.circle(
                screen,
                (255, 255, 255),
                (int(selected.pos.x), int(selected.pos.y)),
                int(selected.genome.size) + 4,
                1,
            )
            pygame.draw.circle(
                screen,
                (90, 90, 100),
                (int(selected.pos.x), int(selected.pos.y)),
                int(selected.genome.vision),
                1,
            )

        draw_sidebar(screen, world, font, font_small, font_title, sim_speed, paused, selected)
        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()


if __name__ == "__main__":
    main()
