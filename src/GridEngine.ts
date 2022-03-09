import { GlobalConfig } from "./GlobalConfig/GlobalConfig";
import { CollisionStrategy } from "./Collisions/CollisionStrategy";
import { FollowMovement } from "./Movement/FollowMovement/FollowMovement";
import {
  Finished,
  MoveToConfig,
  MoveToResult,
  TargetMovement,
} from "./Movement/TargetMovement/TargetMovement";
import {
  CharacterIndex,
  CharConfig,
  FrameRow,
  GridCharacter,
  PositionChange,
} from "./GridCharacter/GridCharacter";
import {
  Direction,
  isDiagonal,
  NumberOfDirections,
} from "./Direction/Direction";
import { GridTilemap } from "./GridTilemap/GridTilemap";
import { RandomMovement } from "./Movement/RandomMovement/RandomMovement";
import { Observable, Subject } from "rxjs";
import { takeUntil, filter, map, take } from "rxjs/operators";
import { Vector2 } from "./Utils/Vector2/Vector2";
import { NoPathFoundStrategy } from "./Pathfinding/NoPathFoundStrategy";
import { PathBlockedStrategy } from "./Pathfinding/PathBlockedStrategy";
import { Concrete } from "./Utils/TypeUtils";

export { Direction, MoveToConfig, MoveToResult, Finished };

export type TileSizePerSecond = number;

export interface Position {
  x: number;
  y: number;
}

export interface GridEngineConfig {
  characters: CharacterData[];
  collisionTilePropertyName?: string;
  numberOfDirections?: NumberOfDirections;
  characterCollisionStrategy?: CollisionStrategy;
  layerOverlay?: boolean;
}

export interface WalkingAnimationMapping {
  [Direction.UP]: FrameRow;
  [Direction.RIGHT]: FrameRow;
  [Direction.DOWN]: FrameRow;
  [Direction.LEFT]: FrameRow;
  [Direction.UP_LEFT]?: FrameRow;
  [Direction.UP_RIGHT]?: FrameRow;
  [Direction.DOWN_LEFT]?: FrameRow;
  [Direction.DOWN_RIGHT]?: FrameRow;
}

export interface CollisionConfig {
  collidesWithTiles?: boolean;
  collisionGroups?: string[];
}

export interface CharacterData {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  walkingAnimationMapping?: CharacterIndex | WalkingAnimationMapping;
  speed?: TileSizePerSecond;
  startPosition?: Position;
  container?: Phaser.GameObjects.Container;
  offsetX?: number;
  offsetY?: number;
  facingDirection?: Direction;
  // TODO Release 3.0: remove
  collides?: boolean | CollisionConfig;
  charLayer?: string;
}

export class GridEngine {
  private gridCharacters: Map<string, GridCharacter>;
  private gridTilemap: GridTilemap;
  private isCreated = false;
  private movementStopped$: Subject<{ charId: string; direction: Direction }>;
  private movementStarted$: Subject<{ charId: string; direction: Direction }>;
  private directionChanged$: Subject<{ charId: string; direction: Direction }>;
  private positionChangeStarted$: Subject<{ charId: string } & PositionChange>;
  private positionChangeFinished$: Subject<{ charId: string } & PositionChange>;
  private charRemoved$: Subject<string>;

  constructor(private scene: Phaser.Scene) {
    this.scene.sys.events.once("boot", this.boot, this);
  }

  /** @internal */
  boot(): void {
    this.scene.sys.events.on("update", this.update, this);
    this.scene.sys.events.on("destroy", this.destroy, this);
  }

  /** @internal */
  destroy(): void {
    this.scene = undefined;
    this.gridCharacters = undefined;
    this.gridTilemap = undefined;
    this.movementStarted$ = undefined;
    this.movementStopped$ = undefined;
    this.directionChanged$ = undefined;
    this.positionChangeStarted$ = undefined;
    this.positionChangeFinished$ = undefined;
    this.charRemoved$ = undefined;
  }

  /**
   * Returns the character layer of the given character.
   * You can read more about character layers and transitions {@link https://annoraaq.github.io/grid-engine/api/features/character-layers.html | here}
   */
  getCharLayer(charId: string): string {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).getTilePos().layer;
  }

  /**
   * @returns The character layer that the transition on the given position and character layer leads to.
   *
   * @beta
   */
  getTransition(position: Position, fromLayer: string): string | undefined {
    this.initGuard();
    return this.gridTilemap.getTransition(new Vector2(position), fromLayer);
  }

  /**
   * Sets the character layer `toLayer` that the transition on position `position` from character layer `fromLayer` should lead to.
   * You can read more about character layers and transitions {@link https://annoraaq.github.io/grid-engine/api/features/character-layers.html | here}
   *
   * @param position Position of the new transition
   * @param fromLayer Character layer the new transition should start at
   * @param toLayer Character layer the new transition should lead to
   *
   * @beta
   */
  setTransition(position: Position, fromLayer: string, toLayer: string): void {
    this.initGuard();
    return this.gridTilemap.setTransition(
      new Vector2(position),
      fromLayer,
      toLayer
    );
  }

  /**
   * Initializes GridEngine. Must be called before any other methods of GridEngine are called.
   */
  create(tilemap: Phaser.Tilemaps.Tilemap, config: GridEngineConfig): void {
    this.isCreated = true;
    this.gridCharacters = new Map();

    const concreteConfig = this.setConfigDefaults(config);

    GlobalConfig.set(concreteConfig);
    this.movementStopped$ = new Subject<{
      charId: string;
      direction: Direction;
    }>();
    this.movementStarted$ = new Subject<{
      charId: string;
      direction: Direction;
    }>();
    this.directionChanged$ = new Subject<{
      charId: string;
      direction: Direction;
    }>();
    this.positionChangeStarted$ = new Subject<
      { charId: string } & PositionChange
    >();
    this.positionChangeFinished$ = new Subject<
      { charId: string } & PositionChange
    >();
    this.charRemoved$ = new Subject<string>();
    this.gridTilemap = new GridTilemap(tilemap);

    this.addCharacters();
  }

  /**
   * @returns The tile position of the character with the given id
   */
  getPosition(charId: string): Position {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).getTilePos().position;
  }

  /**
   * Initiates movement of the character with the given id. If the character is
   * already moving nothing happens. If the movement direction is currently
   * blocked, the character will only turn towards that direction. Movement
   * commands are **not** queued.
   */
  move(charId: string, direction: Direction): void {
    this.moveChar(charId, direction);
  }

  /**
   * Initiates random movement of the character with the given id. The
   * character will randomly pick one of the non-blocking directions.
   * Optionally a `delay` in milliseconds can be provided. This represents the
   * waiting time after a finished movement, before the next is being initiated.
   * If a `radius` other than -1 is provided, the character will not move further
   * than that radius from its initial position (the position it has been, when
   * `moveRandomly` was called). The distance is calculated with the
   * {@link https://en.wikipedia.org/wiki/Taxicab_geometry |
   * manhattan distance}. Additionally, if a `radius` other than -1 was given, the
   * character might move more than one tile into a random direction in one run
   * (as long as the route is neither blocked nor outside of the radius).
   */
  moveRandomly(charId: string, delay = 0, radius = -1): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    const randomMovement = new RandomMovement(
      this.gridCharacters.get(charId),
      GlobalConfig.get().numberOfDirections,
      delay,
      radius
    );
    this.gridCharacters.get(charId).setMovement(randomMovement);
  }

  /**
   * Initiates movement toward the specified `targetPos`. The movement will
   * happen along one shortest path. Check out {@link MoveToConfig} for
   * pathfinding configurations.
   *
   * @returns an observable that will fire
   * whenever the moveTo movement is finished or aborted. It will provide a
   * {@link MoveToResult | result code} as well as a description and a character
   * layer.
   */
  moveTo(
    charId: string,
    targetPos: Position,
    config?: MoveToConfig
  ): Observable<{ charId: string } & Finished> {
    const moveToConfig = this.assembleMoveToConfig(config);

    this.initGuard();
    this.unknownCharGuard(charId);
    const targetMovement = new TargetMovement(
      this.gridCharacters.get(charId),
      this.gridTilemap,
      {
        position: new Vector2(targetPos),
        layer:
          config?.targetLayer ||
          this.gridCharacters.get(charId).getNextTilePos().layer,
      },
      GlobalConfig.get().numberOfDirections,
      0,
      moveToConfig
    );
    this.gridCharacters.get(charId).setMovement(targetMovement);
    return targetMovement.finishedObs().pipe(
      take(1),
      map((finished: Finished) => ({
        charId,
        position: finished.position,
        result: finished.result,
        description: finished.description,
        layer: finished.layer,
      }))
    );
  }

  stopMovement(charId: string): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.gridCharacters.get(charId).setMovement(undefined);
  }

  setSpeed(charId: string, speed: number): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.gridCharacters.get(charId).setSpeed(speed);
  }

  setWalkingAnimationMapping(
    charId: string,
    walkingAnimationMapping: WalkingAnimationMapping
  ): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.gridCharacters
      .get(charId)
      .setWalkingAnimationMapping(walkingAnimationMapping);
  }

  update(_time: number, delta: number): void {
    if (this.isCreated && this.gridCharacters) {
      for (const [_key, val] of this.gridCharacters) {
        val.update(delta);
      }
    }
  }

  addCharacter(charData: CharacterData): void {
    this.initGuard();

    const layerOverlaySprite = GlobalConfig.get().layerOverlay
      ? this.scene.add.sprite(0, 0, charData.sprite.texture)
      : undefined;

    const charConfig: CharConfig = {
      sprite: charData.sprite,
      layerOverlaySprite,
      speed: charData.speed || 4,
      tilemap: this.gridTilemap,
      walkingAnimationMapping: charData.walkingAnimationMapping,
      container: charData.container,
      offsetX: charData.offsetX,
      offsetY: charData.offsetY,
      collidesWithTiles: true,
      collisionGroups: ["geDefault"],
      charLayer: charData.charLayer,
    };

    if (typeof charData.collides === "boolean") {
      if (charData.collides === false) {
        charConfig.collidesWithTiles = false;
        charConfig.collisionGroups = [];
      }
    } else if (charData.collides !== undefined) {
      if (charData.collides.collidesWithTiles === false) {
        charConfig.collidesWithTiles = false;
      }
      if (charData.collides.collisionGroups) {
        charConfig.collisionGroups = charData.collides.collisionGroups;
      }
    }

    const gridChar = this.createCharacter(charData.id, charConfig);

    if (charData.facingDirection) {
      gridChar.turnTowards(charData.facingDirection);
    }

    this.gridCharacters.set(charData.id, gridChar);

    const startPos = charData.startPosition
      ? new Vector2(charData.startPosition)
      : new Vector2(0, 0);
    gridChar.setTilePosition({
      position: startPos,
      layer: gridChar.getTilePos().layer,
    });

    this.gridTilemap.addCharacter(gridChar);

    gridChar
      .movementStopped()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((direction: Direction) => {
        this.movementStopped$.next({ charId: gridChar.getId(), direction });
      });

    gridChar
      .movementStarted()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((direction: Direction) => {
        this.movementStarted$.next({ charId: gridChar.getId(), direction });
      });

    gridChar
      .directionChanged()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((direction: Direction) => {
        this.directionChanged$.next({ charId: gridChar.getId(), direction });
      });

    gridChar
      .positionChangeStarted()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((positionChange: PositionChange) => {
        this.positionChangeStarted$.next({
          charId: gridChar.getId(),
          ...positionChange,
        });
      });

    gridChar
      .positionChangeFinished()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((positionChange: PositionChange) => {
        this.positionChangeFinished$.next({
          charId: gridChar.getId(),
          ...positionChange,
        });
      });
  }

  hasCharacter(charId: string): boolean {
    this.initGuard();
    return this.gridCharacters.has(charId);
  }

  removeCharacter(charId: string): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.gridTilemap.removeCharacter(charId);
    this.gridCharacters.delete(charId);
    this.charRemoved$.next(charId);
  }

  removeAllCharacters(): void {
    this.initGuard();
    for (const charId of this.gridCharacters.keys()) {
      this.removeCharacter(charId);
    }
  }

  getAllCharacters(): string[] {
    this.initGuard();
    return [...this.gridCharacters.keys()];
  }

  follow(
    charId: string,
    charIdToFollow: string,
    distance = 0,
    closestPointIfBlocked = false
  ): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.unknownCharGuard(charIdToFollow);
    const followMovement = new FollowMovement(
      this.gridCharacters.get(charId),
      this.gridTilemap,
      this.gridCharacters.get(charIdToFollow),
      GlobalConfig.get().numberOfDirections,
      distance,
      closestPointIfBlocked
        ? NoPathFoundStrategy.CLOSEST_REACHABLE
        : NoPathFoundStrategy.STOP
    );
    this.gridCharacters.get(charId).setMovement(followMovement);
  }

  isMoving(charId: string): boolean {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).isMoving();
  }

  getFacingDirection(charId: string): Direction {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).getFacingDirection();
  }

  getFacingPosition(charId: string): Position {
    this.initGuard();
    this.unknownCharGuard(charId);
    const vectorPos = this.gridCharacters.get(charId).getFacingPosition();
    return { x: vectorPos.x, y: vectorPos.y };
  }

  turnTowards(charId: string, direction: Direction): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).turnTowards(direction);
  }

  setPosition(charId: string, pos: Position, layer?: string): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    if (!layer) {
      this.gridCharacters.get(charId).setTilePosition({
        position: new Vector2(pos),
        layer: this.gridCharacters.get(charId).getTilePos().layer,
      });
    }
    this.gridCharacters
      .get(charId)
      .setTilePosition({ position: new Vector2(pos), layer });
  }

  getSprite(charId: string): Phaser.GameObjects.Sprite {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).getSprite();
  }

  setSprite(charId: string, sprite: Phaser.GameObjects.Sprite): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    sprite.setOrigin(0, 0);
    this.gridCharacters.get(charId).setSprite(sprite);
  }

  isBlocked(
    position: Position,
    layer: string,
    collisionGroups: string[] = ["geDefault"]
  ): boolean {
    this.initGuard();
    return this.gridTilemap.isBlocking(
      layer,
      new Vector2(position),
      collisionGroups
    );
  }

  isTileBlocked(position: Position, layer: string): boolean {
    this.initGuard();
    return this.gridTilemap.hasBlockingTile(layer, new Vector2(position));
  }

  getCollisionGroups(charId: string): string[] {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).getCollisionGroups();
  }

  setCollisionGroups(charId: string, collisionGroups: string[]): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.gridCharacters.get(charId).setCollisionGroups(collisionGroups);
  }

  movementStarted(): Observable<{ charId: string; direction: Direction }> {
    return this.movementStarted$;
  }

  movementStopped(): Observable<{ charId: string; direction: Direction }> {
    return this.movementStopped$;
  }

  directionChanged(): Observable<{ charId: string; direction: Direction }> {
    return this.directionChanged$;
  }

  positionChangeStarted(): Observable<{ charId: string } & PositionChange> {
    return this.positionChangeStarted$;
  }

  positionChangeFinished(): Observable<{ charId: string } & PositionChange> {
    return this.positionChangeFinished$;
  }

  private setConfigDefaults(
    config: GridEngineConfig
  ): Concrete<GridEngineConfig> {
    return {
      collisionTilePropertyName: "ge_collide",
      numberOfDirections: NumberOfDirections.FOUR,
      characterCollisionStrategy: CollisionStrategy.BLOCK_TWO_TILES,
      layerOverlay: false,
      ...config,
    };
  }

  private takeUntilCharRemoved(charId: string) {
    return takeUntil(this.charRemoved$.pipe(filter((cId) => cId == charId)));
  }

  private initGuard() {
    if (!this.isCreated) {
      throw new Error(
        "Plugin not initialized. You need to call create() first."
      );
    }
  }

  private unknownCharGuard(charId: string) {
    if (!this.gridCharacters.has(charId)) {
      throw new Error(`Character unknown: ${charId}`);
    }
  }

  private createCharacter(id: string, config: CharConfig): GridCharacter {
    return new GridCharacter(id, config);
  }

  private addCharacters() {
    GlobalConfig.get().characters.forEach((charData) =>
      this.addCharacter(charData)
    );
  }

  private moveChar(charId: string, direction: Direction): void {
    this.initGuard();
    this.unknownCharGuard(charId);

    if (GlobalConfig.get().numberOfDirections === NumberOfDirections.FOUR) {
      if (!this.gridTilemap.isIsometric() && isDiagonal(direction)) {
        console.warn(
          `GridEngine: Character '${charId}' can't be moved '${direction}' in 4 direction mode.`
        );
        return;
      } else if (this.gridTilemap.isIsometric() && !isDiagonal(direction)) {
        console.warn(
          `GridEngine: Character '${charId}' can't be moved '${direction}' in 4 direction isometric mode.`
        );
        return;
      }
    }

    this.gridCharacters.get(charId).move(direction);
  }

  private assembleMoveToConfig(config: MoveToConfig): MoveToConfig {
    const moveToConfig = {
      ...config,
      noPathFoundStrategy: NoPathFoundStrategy.STOP,
      pathBlockedStrategy: PathBlockedStrategy.WAIT,
    };
    if (config?.noPathFoundStrategy) {
      if (
        Object.values(NoPathFoundStrategy).includes(config.noPathFoundStrategy)
      ) {
        moveToConfig.noPathFoundStrategy = config.noPathFoundStrategy;
      } else {
        console.warn(
          `GridEngine: Unknown NoPathFoundStrategy '${config.noPathFoundStrategy}'. Falling back to '${NoPathFoundStrategy.STOP}'`
        );
      }
    }

    if (config?.pathBlockedStrategy) {
      if (
        Object.values(PathBlockedStrategy).includes(config.pathBlockedStrategy)
      ) {
        moveToConfig.pathBlockedStrategy = config.pathBlockedStrategy;
      } else {
        console.warn(
          `GridEngine: Unknown PathBlockedStrategy '${config.pathBlockedStrategy}'. Falling back to '${PathBlockedStrategy.WAIT}'`
        );
      }
    }
    return moveToConfig;
  }
}
