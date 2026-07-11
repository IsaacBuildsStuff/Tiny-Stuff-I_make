
"""
Predator/Prey Evolution Simulator
==================================
A little ecosystem where prey and predators evolve their physical traits
(speed, vision, size, energy efficiency) through survival pressure.

Multi-window version:
- Main simulation window
- Population stats window
- Genetics / inspector window
- History graph window

Run it:
    python3 sim.py

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
from typing import Any, Callable, Deque, Iterable, Optional

import pygame
from pygame.math import Vector2

try:
    from pygame._sdl2.video import Renderer, Texture, Window  # type: ignore
    HAVE_SDL2_VIDEO = True
except Exception:  # pragma: no cover - fallback for older Pygame builds
    Renderer = None  # type: ignore
    Texture = None  # type: ignore
    Window = None  # type: ignore
    HAVE_SDL2_VIDEO = False

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

MAIN_W, MAIN_H = 980, 800
STATS_W, STATS_H = 420, 360
GEN_W, GEN_H = 420, 420
HIST_W, HIST_H = 420, 300
FPS = 60
MAX_SIM_SPEED = 8

GRID_CELL = 50
STEER_LERP = 0.18
WANDER_JITTER = 0.35
TRAIL_LEN = 12

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

# Migration safety net
MIGRATION_INTERVAL = 150
MIGRATION_MIN_PREY = 12
MIGRATION_MIN_PRED = 4

HISTORY_INTERVAL = 5
HISTORY_LEN = 400

# Colors
BG_COLOR = (10, 10, 14)
SIM_BG_COLOR = (16, 18, 22)
PANEL_BG = (22, 24, 30)
PANEL_BG_2 = (26, 27, 34)
LINE_COLOR = (60, 60, 70)
TEXT = (225, 225, 230)
TEXT_DIM = (160, 160, 170)
FOOD_COLOR = (90, 150, 90)
PREY_COLOR = (140, 255, 120)
PRED_COLOR = (255, 95, 70)
WHITE = (255, 255, 255)

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def safe_font(name: str | None, size: int, bold: bool = False) -> pygame.font.Font:
    try:
        font = pygame.font.SysFont(name, size, bold=bold)
        if font is not None:
            return font
    except Exception:
        pass
    return pygame.font.Font(None, size)


def random_pos(margin: int = 12) -> Vector2:
    return Vector2(
        random.uniform(margin, MAIN_W - margin),
        random.uniform(margin, MAIN_H - margin),
    )


def lerp_color(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = clamp(t, 0.0, 1.0)
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def prey_color(speed: float) -> tuple[int, int, int]:
    lo, hi = TRAIT_BOUNDS["speed"]
    return lerp_color((40, 110, 60), PREY_COLOR, (speed - lo) / (hi - lo))


def pred_color(speed: float) -> tuple[int, int, int]:
    lo, hi = TRAIT_BOUNDS["speed"]
    return lerp_color((120, 40, 40), PRED_COLOR, (speed - lo) / (hi - lo))


# --------------------------------------------------------------------------
# Genetics / entities
# --------------------------------------------------------------------------

class Genome:
    __slots__ = ("speed", "vision", "size", "efficiency")

    def __init__(self, speed: float, vision: float, size: float, efficiency: float):
        self.speed = speed
        self.vision = vision
        self.size = size
        self.efficiency = efficiency

    @staticmethod
    def random() -> "Genome":
        return Genome(
            speed=random.uniform(1.0, 2.1),
            vision=random.uniform(55.0, 115.0),
            size=random.uniform(4.5, 8.0),
            efficiency=random.uniform(0.9, 1.3),
        )

    def mutate(self) -> "Genome":
        def m(val: float, key: str) -> float:
            lo, hi = TRAIT_BOUNDS[key]
            if random.random() < MUTATION_RATE:
                val += random.gauss(0.0, (hi - lo) * MUTATION_STRENGTH)
            return clamp(val, lo, hi)

        return Genome(
            speed=m(self.speed, "speed"),
            vision=m(self.vision, "vision"),
            size=m(self.size, "size"),
            efficiency=m(self.efficiency, "efficiency"),
        )


class Agent:
    __slots__ = (
        "kind",
        "pos",
        "vel",
        "genome",
        "energy",
        "age",
        "wander_angle",
        "alive",
        "generation",
        "birth_tick",
        "food_eaten",
        "kills",
        "trail",
    )

    def __init__(
        self,
        kind: str,
        pos: Vector2 | tuple[float, float],
        genome: Genome,
        energy: float,
        generation: int = 1,
        birth_tick: int = 0,
    ):
        self.kind = kind
        self.pos = Vector2(pos)
        self.vel = Vector2(0, 0)
        self.genome = genome
        self.energy = energy
        self.age = 0
        self.wander_angle = random.uniform(0, math.tau)
        self.alive = True
        self.generation = generation
        self.birth_tick = birth_tick
        self.food_eaten = 0
        self.kills = 0
        self.trail: Deque[Vector2] = deque(maxlen=TRAIL_LEN)


class Food:
    __slots__ = ("pos", "active", "regrow_timer")

    def __init__(self, pos: Vector2 | tuple[float, float]):
        self.pos = Vector2(pos)
        self.active = True
        self.regrow_timer = 0


class SpatialGrid:
    def __init__(self, cell_size: int = GRID_CELL):
        self.cell_size = cell_size
        self.cells: dict[tuple[int, int], list[Any]] = {}

    def clear(self) -> None:
        self.cells.clear()

    def _key(self, x: float, y: float) -> tuple[int, int]:
        return (int(x // self.cell_size), int(y // self.cell_size))

    def insert(self, obj: Any, x: float, y: float) -> None:
        self.cells.setdefault(self._key(x, y), []).append(obj)

    def nearby(self, x: float, y: float, radius: float) -> list[Any]:
        result: list[Any] = []
        r = int(radius // self.cell_size) + 1
        cx, cy = self._key(x, y)
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                bucket = self.cells.get((cx + dx, cy + dy))
                if bucket:
                    result.extend(bucket)
        return result


def nearest(candidates: Iterable[Any], x: float, y: float, predicate: Callable[[Any], bool]) -> tuple[Any | None, float | None]:
    best: Any | None = None
    best_d2: float | None = None
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
        self.history_prey_speed: Deque[float] = deque(maxlen=HISTORY_LEN)
        self.history_pred_speed: Deque[float] = deque(maxlen=HISTORY_LEN)
        self.history_food: Deque[int] = deque(maxlen=HISTORY_LEN)
        self.effects: list[dict[str, Any]] = []

        self.prey = [Agent("prey", random_pos(), Genome.random(), START_ENERGY, generation=1, birth_tick=0) for _ in range(INITIAL_PREY)]
        self.predators = [Agent("predator", random_pos(), Genome.random(), START_ENERGY, generation=1, birth_tick=0) for _ in range(INITIAL_PRED)]
        self.food = [Food(random_pos()) for _ in range(FOOD_MAX)]

        self._append_history()

    def reset(self) -> None:
        self.__init__()

    def step(self) -> None:
        self.tick += 1
        self._update_food()

        grid_pred = SpatialGrid()
        grid_prey = SpatialGrid()
        grid_food = SpatialGrid()

        for pred in self.predators:
            grid_pred.insert(pred, pred.pos.x, pred.pos.y)
        for prey in self.prey:
            grid_prey.insert(prey, prey.pos.x, prey.pos.y)
        for food in self.food:
            if food.active:
                grid_food.insert(food, food.pos.x, food.pos.y)

        new_agents: list[Agent] = []

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

        for agent in new_agents:
            if agent.kind == "prey":
                self.prey.append(agent)
            else:
                self.predators.append(agent)

        self.prey = [a for a in self.prey if a.alive]
        self.predators = [a for a in self.predators if a.alive]

        self._migration_check()
        self._update_records()
        self._update_effects()

        if self.tick % HISTORY_INTERVAL == 0:
            self._append_history()

    def _append_history(self) -> None:
        self.history_prey.append(len(self.prey))
        self.history_pred.append(len(self.predators))
        self.history_food.append(sum(1 for f in self.food if f.active))
        self.history_prey_speed.append(self._avg_trait(self.prey, "speed"))
        self.history_pred_speed.append(self._avg_trait(self.predators, "speed"))

    @staticmethod
    def _avg_trait(agents: list[Agent], trait: str) -> float:
        if not agents:
            return 0.0
        return sum(getattr(a.genome, trait) for a in agents) / len(agents)

    def _steer_prey(self, prey: Agent, grid_pred: SpatialGrid, grid_food: SpatialGrid) -> None:
        vision = prey.genome.vision
        threats = grid_pred.nearby(prey.pos.x, prey.pos.y, vision)
        threat, td = nearest(threats, prey.pos.x, prey.pos.y, lambda a: a.alive)

        if threat is not None and td is not None and td <= vision:
            flee = prey.pos - threat.pos
            desired = flee.normalize() if flee.length_squared() > 1e-6 else Vector2(1, 0)
        else:
            foods = grid_food.nearby(prey.pos.x, prey.pos.y, vision)
            food, fd = nearest(foods, prey.pos.x, prey.pos.y, lambda f: f.active)
            if food is not None and fd is not None and fd <= vision:
                diff = food.pos - prey.pos
                desired = diff.normalize() if diff.length_squared() > 1e-6 else Vector2(0, 0)
            else:
                prey.wander_angle += random.uniform(-WANDER_JITTER, WANDER_JITTER)
                desired = Vector2(math.cos(prey.wander_angle), math.sin(prey.wander_angle))

        prey.vel = prey.vel.lerp(desired * prey.genome.speed, STEER_LERP)

    def _steer_predator(self, pred: Agent, grid_prey: SpatialGrid) -> None:
        vision = pred.genome.vision
        targets = grid_prey.nearby(pred.pos.x, pred.pos.y, vision)
        target, td = nearest(targets, pred.pos.x, pred.pos.y, lambda a: a.alive)

        if target is not None and td is not None and td <= vision:
            chase = target.pos - pred.pos
            desired = chase.normalize() if chase.length_squared() > 1e-6 else Vector2(0, 0)
        else:
            pred.wander_angle += random.uniform(-WANDER_JITTER, WANDER_JITTER)
            desired = Vector2(math.cos(pred.wander_angle), math.sin(pred.wander_angle))

        pred.vel = pred.vel.lerp(desired * pred.genome.speed, STEER_LERP)

    def _apply_physics(self, agent: Agent) -> None:
        agent.trail.append(Vector2(agent.pos))
        agent.pos += agent.vel

        r = agent.genome.size
        if agent.pos.x < r:
            agent.pos.x = r
            agent.vel.x = abs(agent.vel.x)
        elif agent.pos.x > MAIN_W - r:
            agent.pos.x = MAIN_W - r
            agent.vel.x = -abs(agent.vel.x)

        if agent.pos.y < r:
            agent.pos.y = r
            agent.vel.y = abs(agent.vel.y)
        elif agent.pos.y > MAIN_H - r:
            agent.pos.y = MAIN_H - r
            agent.vel.y = -abs(agent.vel.y)

        speed_used = agent.vel.length()
        move_cost = (speed_used ** 2) * MOVE_COST_FACTOR / agent.genome.efficiency
        base_cost = BASE_COST_FACTOR * agent.genome.size
        agent.energy -= (move_cost + base_cost)
        agent.age += 1

    def _consume_food(self, prey: Agent, grid_food: SpatialGrid) -> None:
        radius = prey.genome.size + FOOD_RADIUS
        radius2 = radius * radius
        for food in grid_food.nearby(prey.pos.x, prey.pos.y, radius + 4):
            if not food.active:
                continue
            if (prey.pos - food.pos).length_squared() <= radius2:
                food.active = False
                food.regrow_timer = FOOD_REGROW_TICKS
                prey.energy += FOOD_ENERGY
                prey.food_eaten += 1
                self._spawn_effect(food.pos, FOOD_COLOR, max_radius=10, growth=1.3)
                break

    def _maybe_catch(self, pred: Agent, grid_prey: SpatialGrid) -> None:
        search_radius = pred.genome.size + 14
        for target in grid_prey.nearby(pred.pos.x, pred.pos.y, search_radius):
            if not target.alive:
                continue
            catch_r = pred.genome.size + target.genome.size
            if (pred.pos - target.pos).length_squared() <= catch_r * catch_r:
                target.alive = False
                gain = target.energy * CATCH_ENERGY_FRACTION + CATCH_FLAT_BONUS
                pred.energy += gain
                pred.kills += 1
                self.total_deaths += 1
                self._spawn_effect(target.pos, (255, 110, 80), max_radius=20, growth=1.6)
                break

    def _maybe_reproduce(
        self,
        agent: Agent,
        population: list[Agent],
        max_pop: int,
        threshold: float,
        new_agents: list[Agent],
    ) -> None:
        if agent.energy < threshold:
            return

        same_kind_pending = sum(1 for a in new_agents if a.kind == agent.kind)
        if len(population) + same_kind_pending >= max_pop:
            return

        give = agent.energy * REPRO_GIVE_FRACTION
        agent.energy -= (give + REPRO_COST)

        spawn = agent.pos + Vector2(random.uniform(-8, 8), random.uniform(-8, 8))
        spawn.x = clamp(spawn.x, agent.genome.size, MAIN_W - agent.genome.size)
        spawn.y = clamp(spawn.y, agent.genome.size, MAIN_H - agent.genome.size)

        child = Agent(
            agent.kind,
            spawn,
            agent.genome.mutate(),
            give,
            generation=agent.generation + 1,
            birth_tick=self.tick,
        )
        new_agents.append(child)
        self._spawn_effect(agent.pos, WHITE, max_radius=16, growth=1.1)
        self.total_births += 1

    def _age_and_starve(self, agent: Agent, max_age: int) -> None:
        if agent.energy <= 0 or agent.age > max_age:
            agent.alive = False
            self.total_deaths += 1

    def _update_food(self) -> None:
        for food in self.food:
            if not food.active:
                food.regrow_timer -= 1
                if food.regrow_timer <= 0:
                    food.pos = random_pos()
                    food.active = True

    def _migration_check(self) -> None:
        if self.tick % MIGRATION_INTERVAL != 0:
            return

        if not self.prey:
            self.prey.append(Agent("prey", random_pos(), Genome.random(), START_ENERGY, generation=1, birth_tick=self.tick))
        elif len(self.prey) < MIGRATION_MIN_PREY and len(self.prey) < MAX_PREY:
            for _ in range(3):
                self.prey.append(Agent("prey", random_pos(), Genome.random(), START_ENERGY, generation=1, birth_tick=self.tick))

        if not self.predators:
            self.predators.append(Agent("predator", random_pos(), Genome.random(), START_ENERGY, generation=1, birth_tick=self.tick))
        elif len(self.predators) < MIGRATION_MIN_PRED and len(self.predators) < MAX_PRED:
            for _ in range(2):
                self.predators.append(Agent("predator", random_pos(), Genome.random(), START_ENERGY, generation=1, birth_tick=self.tick))

    def _update_records(self) -> None:
        for agent in self.prey:
            self.records["prey_speed"] = max(self.records["prey_speed"], agent.genome.speed)
            self.records["prey_vision"] = max(self.records["prey_vision"], agent.genome.vision)
        for agent in self.predators:
            self.records["pred_speed"] = max(self.records["pred_speed"], agent.genome.speed)
            self.records["pred_vision"] = max(self.records["pred_vision"], agent.genome.vision)

    def _spawn_effect(self, pos: Vector2, color: tuple[int, int, int], max_radius: int = 14, growth: float = 1.2) -> None:
        self.effects.append(
            {"pos": Vector2(pos), "r": 1.0, "max_r": max_radius, "color": color, "growth": growth}
        )

    def _update_effects(self) -> None:
        for effect in self.effects:
            effect["r"] += effect["growth"]
        self.effects = [e for e in self.effects if e["r"] < e["max_r"]]

    def find_agent_near(self, x: float, y: float, radius: float) -> Agent | None:
        best: Agent | None = None
        best_d2 = radius * radius
        for agent in self.prey:
            d2 = (agent.pos.x - x) ** 2 + (agent.pos.y - y) ** 2
            if d2 <= best_d2:
                best_d2 = d2
                best = agent
        for agent in self.predators:
            d2 = (agent.pos.x - x) ** 2 + (agent.pos.y - y) ** 2
            if d2 <= best_d2:
                best_d2 = d2
                best = agent
        return best

    def draw_world(self, surface: pygame.Surface) -> None:
        surface.fill(SIM_BG_COLOR)

        # food
        for food in self.food:
            if food.active:
                pygame.draw.circle(surface, FOOD_COLOR, (int(food.pos.x), int(food.pos.y)), FOOD_RADIUS)

        # trails
        for agent in self.prey:
            _draw_trail(surface, agent, (80, 160, 80))
        for agent in self.predators:
            _draw_trail(surface, agent, (180, 80, 70))

        # agents
        for agent in self.prey:
            _draw_agent(surface, agent, prey_color(agent.genome.speed))
        for agent in self.predators:
            _draw_agent(surface, agent, pred_color(agent.genome.speed))

        # transient effects
        for effect in self.effects:
            pygame.draw.circle(
                surface,
                effect["color"],
                (int(effect["pos"].x), int(effect["pos"].y)),
                int(effect["r"]),
                1,
            )

        # small overlay
        overlay = [
            f"tick {self.tick}",
            f"prey {len(self.prey)}",
            f"pred {len(self.predators)}",
            f"births {self.total_births}",
        ]
        x, y = 12, 10
        for text in overlay:
            _draw_text(surface, text, x, y, TEXT_DIM, 14)
            y += 16


# --------------------------------------------------------------------------
# Rendering helpers
# --------------------------------------------------------------------------

def _draw_text(surface: pygame.Surface, text: str, x: int, y: int, color: tuple[int, int, int], size: int = 16, bold: bool = False) -> None:
    font = safe_font("consolas", size, bold=bold)
    img = font.render(text, True, color)
    surface.blit(img, (x, y))


def _draw_agent(surface: pygame.Surface, agent: Agent, color: tuple[int, int, int]) -> None:
    if agent.vel.length_squared() > 1e-4:
        angle = math.atan2(agent.vel.y, agent.vel.x)
    else:
        angle = agent.wander_angle

    size = agent.genome.size
    tip = agent.pos + Vector2(math.cos(angle), math.sin(angle)) * size * 1.7
    left = agent.pos + Vector2(math.cos(angle + 2.5), math.sin(angle + 2.5)) * size
    right = agent.pos + Vector2(math.cos(angle - 2.5), math.sin(angle - 2.5)) * size
    pygame.draw.polygon(surface, color, [tip, left, right])


def _draw_trail(surface: pygame.Surface, agent: Agent, color: tuple[int, int, int]) -> None:
    if len(agent.trail) < 2:
        return
    points = [(int(p.x), int(p.y)) for p in agent.trail]
    pygame.draw.lines(surface, color, False, points, 1)


def draw_graph(surface: pygame.Surface, rect: pygame.Rect, histories: list[tuple[Deque[float | int], tuple[int, int, int], int]], title: str) -> None:
    pygame.draw.rect(surface, PANEL_BG, rect)
    pygame.draw.rect(surface, LINE_COLOR, rect, 1)
    _draw_text(surface, title, rect.x + 8, rect.y + 7, TEXT, 16, bold=True)

    if not histories:
        return

    max_val = 1.0
    for hist, _, _ in histories:
        if hist:
            max_val = max(max_val, float(max(hist)))

    graph_area = rect.inflate(-16, -32)
    graph_area.y += 24
    graph_area.h -= 8

    for hist, color, width in histories:
        if len(hist) < 2:
            continue
        n = len(hist)
        pts: list[tuple[float, float]] = []
        for i, v in enumerate(hist):
            x = graph_area.left + (i / max(1, n - 1)) * graph_area.width
            y = graph_area.bottom - (float(v) / max_val) * graph_area.height
            pts.append((x, y))
        pygame.draw.lines(surface, color, False, pts, width)


# --------------------------------------------------------------------------
# Multi-window presenter
# --------------------------------------------------------------------------

@dataclass(slots=True)
class SDLWindowView:
    title: str
    size: tuple[int, int]
    window: Any | None = None
    renderer: Any | None = None
    texture: Any | None = None
    surface: pygame.Surface | None = None
    alive: bool = True

    def create(self) -> None:
        if not HAVE_SDL2_VIDEO:
            raise RuntimeError("pygame._sdl2.video is not available")
        self.window = Window(title=self.title, size=self.size)  # type: ignore[misc]
        try:
            self.window.resizable = False  # type: ignore[union-attr]
        except Exception:
            pass
        self.renderer = Renderer(self.window, vsync=True)  # type: ignore[misc]
        self.renderer.logical_size = self.size  # type: ignore[union-attr]
        self.surface = pygame.Surface(self.size, pygame.SRCALPHA)
        self.texture = Texture.from_surface(self.renderer, self.surface)  # type: ignore[misc]

    @property
    def window_id(self) -> int:
        if self.window is None:
            return -1
        return int(self.window.id)  # type: ignore[union-attr]

    def close(self) -> None:
        self.alive = False
        if self.window is not None:
            try:
                self.window.destroy()  # type: ignore[union-attr]
            except Exception:
                pass
        self.window = None
        self.renderer = None
        self.texture = None
        self.surface = None

    def present(self) -> None:
        if not self.alive or self.surface is None or self.renderer is None or self.texture is None:
            return
        self.texture.update(self.surface)
        self.renderer.draw_color = (0, 0, 0, 255)
        self.renderer.clear()
        self.texture.draw()
        self.renderer.present()


# --------------------------------------------------------------------------
# View renderers
# --------------------------------------------------------------------------

def render_main_view(surface: pygame.Surface, world: World, selected: Agent | None, paused: bool, sim_speed: int) -> None:
    world.draw_world(surface)

    # bottom-right compact controls / selected summary
    box = pygame.Rect(MAIN_W - 320, MAIN_H - 132, 308, 120)
    pygame.draw.rect(surface, PANEL_BG_2, box, border_radius=10)
    pygame.draw.rect(surface, LINE_COLOR, box, width=1, border_radius=10)

    status = "PAUSED" if paused else f"{sim_speed}x"
    _draw_text(surface, f"Speed: {status}", box.x + 10, box.y + 8, TEXT, 16, bold=True)
    _draw_text(surface, f"Food active: {sum(1 for f in world.food if f.active)}/{len(world.food)}", box.x + 10, box.y + 30, TEXT_DIM, 14)
    _draw_text(surface, f"Total births: {world.total_births}", box.x + 10, box.y + 48, TEXT_DIM, 14)
    _draw_text(surface, f"Deaths: {world.total_deaths}", box.x + 10, box.y + 66, TEXT_DIM, 14)

    if selected is not None and selected.alive:
        pygame.draw.line(surface, (200, 200, 210), (selected.pos.x, selected.pos.y), (selected.pos.x, selected.pos.y), 0)
        pygame.draw.circle(surface, WHITE, (int(selected.pos.x), int(selected.pos.y)), int(selected.genome.size) + 4, 1)
        pygame.draw.circle(surface, (100, 100, 110), (int(selected.pos.x), int(selected.pos.y)), int(selected.genome.vision), 1)

        sel_box = pygame.Rect(12, MAIN_H - 132, 268, 120)
        pygame.draw.rect(surface, PANEL_BG_2, sel_box, border_radius=10)
        pygame.draw.rect(surface, LINE_COLOR, sel_box, width=1, border_radius=10)
        _draw_text(surface, f"Selected: {selected.kind}", sel_box.x + 10, sel_box.y + 8, TEXT, 16, bold=True)
        _draw_text(surface, f"gen {selected.generation}   age {selected.age}", sel_box.x + 10, sel_box.y + 30, TEXT_DIM, 14)
        _draw_text(surface, f"speed {selected.genome.speed:.2f}", sel_box.x + 10, sel_box.y + 48, TEXT_DIM, 14)
        _draw_text(surface, f"vision {selected.genome.vision:.0f}", sel_box.x + 10, sel_box.y + 66, TEXT_DIM, 14)
        _draw_text(surface, f"size {selected.genome.size:.1f}   eff {selected.genome.efficiency:.2f}", sel_box.x + 10, sel_box.y + 84, TEXT_DIM, 14)
    else:
        hint = pygame.Rect(12, MAIN_H - 132, 268, 120)
        pygame.draw.rect(surface, PANEL_BG_2, hint, border_radius=10)
        pygame.draw.rect(surface, LINE_COLOR, hint, width=1, border_radius=10)
        _draw_text(surface, "Click an agent to inspect it", hint.x + 10, hint.y + 18, TEXT, 15, bold=True)
        _draw_text(surface, "SPACE pause/resume", hint.x + 10, hint.y + 42, TEXT_DIM, 14)
        _draw_text(surface, "+ / - speed", hint.x + 10, hint.y + 60, TEXT_DIM, 14)
        _draw_text(surface, "R reset   ESC quit", hint.x + 10, hint.y + 78, TEXT_DIM, 14)


def render_stats_view(surface: pygame.Surface, world: World, paused: bool, sim_speed: int) -> None:
    surface.fill(PANEL_BG)
    _draw_text(surface, "Population Stats", 14, 12, TEXT, 18, bold=True)

    y = 44
    lines = [
        f"Tick: {world.tick}",
        f"Prey: {len(world.prey)}",
        f"Predators: {len(world.predators)}",
        f"Food active: {sum(1 for f in world.food if f.active)} / {len(world.food)}",
        f"Births: {world.total_births}",
        f"Deaths: {world.total_deaths}",
        f"Speed: {'PAUSED' if paused else f'{sim_speed}x'}",
    ]
    for line in lines:
        _draw_text(surface, line, 14, y, TEXT_DIM, 15)
        y += 22

    y += 10
    _draw_text(surface, "Records", 14, y, TEXT, 16, bold=True)
    y += 24
    record_lines = [
        f"Prey speed: {world.records['prey_speed']:.2f}",
        f"Pred speed: {world.records['pred_speed']:.2f}",
        f"Prey vision: {world.records['prey_vision']:.0f}",
        f"Pred vision: {world.records['pred_vision']:.0f}",
    ]
    for line in record_lines:
        _draw_text(surface, line, 14, y, TEXT_DIM, 15)
        y += 20

    y += 8
    _draw_text(surface, "Current averages", 14, y, TEXT, 16, bold=True)
    y += 24
    if world.prey:
        _draw_text(surface, f"Prey speed avg: {world._avg_trait(world.prey, 'speed'):.2f}", 14, y, PREY_COLOR, 15)
        y += 20
        _draw_text(surface, f"Prey vision avg: {world._avg_trait(world.prey, 'vision'):.0f}", 14, y, PREY_COLOR, 15)
        y += 20
        _draw_text(surface, f"Prey size avg: {world._avg_trait(world.prey, 'size'):.1f}", 14, y, PREY_COLOR, 15)
        y += 20

    if world.predators:
        y += 4
        _draw_text(surface, f"Pred speed avg: {world._avg_trait(world.predators, 'speed'):.2f}", 14, y, PRED_COLOR, 15)
        y += 20
        _draw_text(surface, f"Pred vision avg: {world._avg_trait(world.predators, 'vision'):.0f}", 14, y, PRED_COLOR, 15)
        y += 20
        _draw_text(surface, f"Pred size avg: {world._avg_trait(world.predators, 'size'):.1f}", 14, y, PRED_COLOR, 15)


def render_genetics_view(surface: pygame.Surface, world: World, selected: Agent | None) -> None:
    surface.fill(PANEL_BG)
    _draw_text(surface, "Genetics / Inspector", 14, 12, TEXT, 18, bold=True)

    y = 46
    if selected is not None and selected.alive:
        _draw_text(surface, f"Selected: {selected.kind}", 14, y, TEXT, 16, bold=True)
        y += 24
        details = [
            f"Generation: {selected.generation}",
            f"Age: {selected.age}",
            f"Energy: {selected.energy:.0f}",
            f"Speed: {selected.genome.speed:.2f}",
            f"Vision: {selected.genome.vision:.0f}",
            f"Size: {selected.genome.size:.1f}",
            f"Efficiency: {selected.genome.efficiency:.2f}",
            f"Food eaten: {selected.food_eaten}",
            f"Kills: {selected.kills}",
            f"Trail points: {len(selected.trail)}",
            f"Born at tick: {selected.birth_tick}",
        ]
        for line in details:
            _draw_text(surface, line, 14, y, TEXT_DIM, 15)
            y += 20
    else:
        _draw_text(surface, "No agent selected.", 14, y, TEXT_DIM, 15)
        y += 24
        _draw_text(surface, "Click an agent in the main window.", 14, y, TEXT_DIM, 15)

    y += 18
    _draw_text(surface, "Species summary", 14, y, TEXT, 16, bold=True)
    y += 24

    prey = world.prey
    preds = world.predators
    if prey:
        _draw_text(surface, f"Prey count: {len(prey)}", 14, y, PREY_COLOR, 15)
        y += 18
        _draw_text(surface, f"Avg generation: {sum(a.generation for a in prey) / len(prey):.1f}", 14, y, PREY_COLOR, 15)
        y += 18
    if preds:
        y += 4
        _draw_text(surface, f"Pred count: {len(preds)}", 14, y, PRED_COLOR, 15)
        y += 18
        _draw_text(surface, f"Avg generation: {sum(a.generation for a in preds) / len(preds):.1f}", 14, y, PRED_COLOR, 15)
        y += 18


def render_history_view(surface: pygame.Surface, world: World) -> None:
    surface.fill(PANEL_BG)
    _draw_text(surface, "History", 14, 12, TEXT, 18, bold=True)

    rect1 = pygame.Rect(14, 42, HIST_W - 28, 106)
    draw_graph(
        surface,
        rect1,
        [
            (world.history_prey, PREY_COLOR, 2),
            (world.history_pred, PRED_COLOR, 2),
        ],
        "Population",
    )

    rect2 = pygame.Rect(14, 160, HIST_W - 28, 106)
    draw_graph(
        surface,
        rect2,
        [
            (world.history_prey_speed, PREY_COLOR, 2),
            (world.history_pred_speed, PRED_COLOR, 2),
        ],
        "Average speed",
    )

    rect3 = pygame.Rect(14, 278, HIST_W - 28, 106)
    draw_graph(
        surface,
        rect3,
        [
            (world.history_food, FOOD_COLOR, 2),
        ],
        "Active food",
    )


# --------------------------------------------------------------------------
# Fallback single-window renderer
# --------------------------------------------------------------------------

def render_single_window(surface: pygame.Surface, world: World, selected: Agent | None, paused: bool, sim_speed: int) -> None:
    surface.fill(BG_COLOR)
    main_rect = pygame.Rect(0, 0, MAIN_W, MAIN_H)
    tmp = pygame.Surface((MAIN_W, MAIN_H))
    render_main_view(tmp, world, selected, paused, sim_speed)
    surface.blit(tmp, (0, 0))

    stats = pygame.Surface((STATS_W, STATS_H))
    render_stats_view(stats, world, paused, sim_speed)
    surface.blit(stats, (MAIN_W, 0))

    gen = pygame.Surface((GEN_W, GEN_H))
    render_genetics_view(gen, world, selected)
    surface.blit(gen, (MAIN_W, STATS_H))

    hist = pygame.Surface((HIST_W, HIST_H))
    render_history_view(hist, world)
    surface.blit(hist, (MAIN_W, STATS_H + GEN_H))


# --------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------

def create_font_bundle() -> dict[str, pygame.font.Font]:
    return {
        "title": safe_font("consolas", 20, bold=True),
        "body": safe_font("consolas", 16),
        "small": safe_font("consolas", 14),
    }


class App:
    def __init__(self) -> None:
        self.world = World()
        self.sim_speed = 1
        self.paused = False
        self.selected: Agent | None = None
        self.running = True
        self.fonts = create_font_bundle()

        self.multi = HAVE_SDL2_VIDEO
        self.views: dict[str, SDLWindowView] = {}

    def setup_views(self) -> None:
        if self.multi:
            self.views = {
                "main": SDLWindowView("Predator / Prey - Simulation", (MAIN_W, MAIN_H)),
                "stats": SDLWindowView("Predator / Prey - Stats", (STATS_W, STATS_H)),
                "genetics": SDLWindowView("Predator / Prey - Inspector", (GEN_W, GEN_H)),
                "history": SDLWindowView("Predator / Prey - History", (HIST_W, HIST_H)),
            }
            for view in self.views.values():
                view.create()

    def run(self) -> None:
        if self.multi:
            self.setup_views()

        clock = pygame.time.Clock()

        while self.running:
            for event in pygame.event.get():
                self._handle_event(event)

            if not self.paused:
                for _ in range(self.sim_speed):
                    self.world.step()

            if self.selected is not None and not self.selected.alive:
                self.selected = None

            self._draw_all()

            clock.tick(FPS)

        self._shutdown()

    def _handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.running = False
            return

        if event.type == pygame.WINDOWCLOSE:
            window_id = getattr(event, "window", None)
            if not self.multi or window_id is None:
                self.running = False
                return

            for name, view in list(self.views.items()):
                if view.window_id == window_id:
                    if name == "main":
                        self.running = False
                    view.close()
                    break
            return

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                self.paused = not self.paused
            elif event.key in (pygame.K_EQUALS, pygame.K_PLUS, pygame.K_KP_PLUS):
                self.sim_speed = min(MAX_SIM_SPEED, self.sim_speed + 1)
            elif event.key in (pygame.K_MINUS, pygame.K_KP_MINUS):
                self.sim_speed = max(1, self.sim_speed - 1)
            elif event.key == pygame.K_r:
                self.world.reset()
                self.selected = None
            elif event.key == pygame.K_ESCAPE:
                self.running = False
            return

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            mx, my = event.pos
            self.selected = self.world.find_agent_near(mx, my, 16)
            return

    def _draw_all(self) -> None:
        if self.multi:
            main = self.views.get("main")
            stats = self.views.get("stats")
            genetics = self.views.get("genetics")
            history = self.views.get("history")

            if main is not None and main.alive and main.surface is not None:
                render_main_view(main.surface, self.world, self.selected, self.paused, self.sim_speed)
                main.present()

            if stats is not None and stats.alive and stats.surface is not None:
                render_stats_view(stats.surface, self.world, self.paused, self.sim_speed)
                stats.present()

            if genetics is not None and genetics.alive and genetics.surface is not None:
                render_genetics_view(genetics.surface, self.world, self.selected)
                genetics.present()

            if history is not None and history.alive and history.surface is not None:
                render_history_view(history.surface, self.world)
                history.present()
        else:
            screen = pygame.display.get_surface()
            if screen is None:
                return
            render_single_window(screen, self.world, self.selected, self.paused, self.sim_speed)
            pygame.display.flip()

    def _shutdown(self) -> None:
        if self.multi:
            for view in self.views.values():
                view.close()
        pygame.quit()


def main() -> None:
    pygame.init()
    pygame.font.init()

    if HAVE_SDL2_VIDEO:
        app = App()
        app.run()
    else:
        # Fallback single-window mode for older installs.
        screen = pygame.display.set_mode((MAIN_W + STATS_W, STATS_H + GEN_H + HIST_H))
        pygame.display.set_caption("Predator / Prey Evolution Simulator")
        clock = pygame.time.Clock()

        world = World()
        sim_speed = 1
        paused = False
        selected: Agent | None = None
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
                        world.reset()
                        selected = None
                    elif event.key == pygame.K_ESCAPE:
                        running = False
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    if event.pos[0] < MAIN_W and event.pos[1] < MAIN_H:
                        selected = world.find_agent_near(*event.pos, 16)

            if not paused:
                for _ in range(sim_speed):
                    world.step()

            if selected is not None and not selected.alive:
                selected = None

            render_single_window(screen, world, selected, paused, sim_speed)
            pygame.display.flip()
            clock.tick(FPS)

        pygame.quit()


if __name__ == "__main__":
    main()
