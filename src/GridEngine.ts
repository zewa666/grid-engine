import { FollowMovement } from "./Movement/FollowMovement/FollowMovement";
import { TargetMovement } from "./Movement/TargetMovement/TargetMovement";
import {
  CharacterIndex,
  CharConfig,
  FrameRow,
  GridCharacter,
  PositionChange,
} from "./GridCharacter/GridCharacter";
import "phaser";
import { Direction } from "./Direction/Direction";
import { GridTilemap } from "./GridTilemap/GridTilemap";
import { RandomMovement } from "./Movement/RandomMovement/RandomMovement";
import { Observable, Subject } from "rxjs";
import { takeUntil, filter } from "rxjs/operators";

const Vector2 = Phaser.Math.Vector2;
type Vector2 = Phaser.Math.Vector2;

export type TileSizePerSecond = number;

export interface GridEngineConfig {
  characters: CharacterData[];
  firstLayerAboveChar?: number; // deprecated
  collisionTilePropertyName?: string;
}

export interface WalkingAnimationMapping {
  [Direction.UP]: FrameRow;
  [Direction.RIGHT]: FrameRow;
  [Direction.DOWN]: FrameRow;
  [Direction.LEFT]: FrameRow;
}

export interface CharacterData {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  walkingAnimationMapping?: CharacterIndex | WalkingAnimationMapping;
  walkingAnimationEnabled?: boolean;
  characterIndex?: number; // deprecated
  speed?: TileSizePerSecond;
  startPosition?: Vector2;
  container?: Phaser.GameObjects.Container;
  offsetX?: number;
  offsetY?: number;
  facingDirection?: Direction;
}

export class GridEngine extends Phaser.Plugins.ScenePlugin {
  private gridCharacters: Map<string, GridCharacter>;
  private tilemap: Phaser.Tilemaps.Tilemap;
  private gridTilemap: GridTilemap;
  private isCreated = false;
  private movementStopped$ = new Subject<[string, Direction]>();
  private movementStarted$ = new Subject<[string, Direction]>();
  private directionChanged$ = new Subject<[string, Direction]>();
  private positionChanged$ = new Subject<{ charId: string } & PositionChange>();
  private positionChangeFinished$ = new Subject<
    { charId: string } & PositionChange
  >();
  private charRemoved$ = new Subject<string>();

  constructor(
    public scene: Phaser.Scene,
    pluginManager: Phaser.Plugins.PluginManager
  ) {
    super(scene, pluginManager);
  }

  boot(): void {
    this.systems.events.on("update", this.update, this);
  }

  create(tilemap: Phaser.Tilemaps.Tilemap, config: GridEngineConfig): void {
    this.isCreated = true;
    this.gridCharacters = new Map();
    this.tilemap = tilemap;
    this.gridTilemap = this.createTilemap(tilemap, config);
    if (config.collisionTilePropertyName) {
      this.gridTilemap.setCollisionTilePropertyName(
        config.collisionTilePropertyName
      );
    }
    this.addCharacters(config);
  }

  getPosition(charId: string): Vector2 {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).getTilePos();
  }

  moveLeft(charId: string): void {
    this.moveChar(charId, Direction.LEFT);
  }

  moveRight(charId: string): void {
    this.moveChar(charId, Direction.RIGHT);
  }

  moveUp(charId: string): void {
    this.moveChar(charId, Direction.UP);
  }

  moveDown(charId: string): void {
    this.moveChar(charId, Direction.DOWN);
  }

  move(charId: string, direction: Direction): void {
    this.moveChar(charId, direction);
  }

  moveRandomly(charId: string, delay = 0, radius = -1): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    const randomMovement = new RandomMovement(delay, radius);
    this.gridCharacters.get(charId).setMovement(randomMovement);
  }

  moveTo(
    charId: string,
    targetPos: Vector2,
    closestPointIfBlocked = false
  ): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    const targetMovement = new TargetMovement(
      this.gridTilemap,
      targetPos,
      0,
      closestPointIfBlocked
    );
    this.gridCharacters.get(charId).setMovement(targetMovement);
  }

  // deprecated
  stopMovingRandomly(charId: string): void {
    console.warn(
      "GridEngine: `stopMovingRandomly` is deprecated. Use `stopMovement()` instead."
    );
    this._stopMovement(charId);
  }

  stopMovement(charId: string): void {
    this._stopMovement(charId);
  }

  private _stopMovement(charId: string) {
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
    if (this.isCreated) {
      if (this.gridCharacters) {
        for (const [_key, val] of this.gridCharacters) {
          val.update(delta);
        }
      }
    }
  }

  addCharacter(charData: CharacterData): void {
    this.initGuard();

    if (charData.characterIndex != undefined) {
      console.warn(
        "GridEngine: CharacterConfig property `characterIndex` is deprecated. Use `walkingAnimtionMapping` instead."
      );
    }

    const charConfig: CharConfig = {
      sprite: charData.sprite,
      speed: charData.speed || 4,
      tilemap: this.gridTilemap,
      tileSize: new Vector2(
        this.gridTilemap.getTileWidth(),
        this.gridTilemap.getTileHeight()
      ),
      isometric:
        this.tilemap.orientation == `${Phaser.Tilemaps.Orientation.ISOMETRIC}`,
      walkingAnimationMapping: charData.walkingAnimationMapping,
      walkingAnimationEnabled: charData.walkingAnimationEnabled,
      container: charData.container,
      offsetX: charData.offsetX,
      offsetY: charData.offsetY,
    };
    if (charConfig.walkingAnimationMapping == undefined) {
      charConfig.walkingAnimationMapping = charData.characterIndex;
    }
    if (charConfig.walkingAnimationEnabled == undefined) {
      charConfig.walkingAnimationEnabled = true;
    }
    const gridChar = new GridCharacter(charData.id, charConfig);

    if (charData.facingDirection) {
      gridChar.turnTowards(charData.facingDirection);
    }

    this.gridCharacters.set(charData.id, gridChar);

    gridChar.setTilePosition(charData.startPosition || new Vector2(0, 0));

    this.gridTilemap.addCharacter(gridChar);

    gridChar
      .movementStopped()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((direction: Direction) => {
        this.movementStopped$.next([gridChar.getId(), direction]);
      });

    gridChar
      .movementStarted()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((direction: Direction) => {
        this.movementStarted$.next([gridChar.getId(), direction]);
      });

    gridChar
      .directionChanged()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe((direction: Direction) => {
        this.directionChanged$.next([gridChar.getId(), direction]);
      });

    gridChar
      .positionChanged()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe(({ exitTile, enterTile }) => {
        this.positionChanged$.next({
          charId: gridChar.getId(),
          exitTile,
          enterTile,
        });
      });

    gridChar
      .positionChangeFinished()
      .pipe(this.takeUntilCharRemoved(gridChar.getId()))
      .subscribe(({ exitTile, enterTile }) => {
        this.positionChangeFinished$.next({
          charId: gridChar.getId(),
          exitTile,
          enterTile,
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
      this.gridTilemap,
      this.gridCharacters.get(charIdToFollow),
      distance,
      closestPointIfBlocked
    );
    this.gridCharacters.get(charId).setMovement(followMovement);
  }

  // deprecated
  stopFollowing(charId: string): void {
    console.warn(
      "GridEngine: `stopFollowing` is deprecated. Use `stopMovement()` instead."
    );
    this._stopMovement(charId);
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

  turnTowards(charId: string, direction: Direction): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    return this.gridCharacters.get(charId).turnTowards(direction);
  }

  movementStarted(): Observable<[string, Direction]> {
    return this.movementStarted$;
  }

  movementStopped(): Observable<[string, Direction]> {
    return this.movementStopped$;
  }

  directionChanged(): Observable<[string, Direction]> {
    return this.directionChanged$;
  }

  positionChanged(): Observable<{ charId: string } & PositionChange> {
    return this.positionChanged$;
  }

  positionChangeFinished(): Observable<{ charId: string } & PositionChange> {
    return this.positionChangeFinished$;
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

  private createTilemap(
    tilemap: Phaser.Tilemaps.Tilemap,
    config: GridEngineConfig
  ) {
    if (config.firstLayerAboveChar != undefined) {
      console.warn(
        "GridEngine: Config property `firstLayerAboveChar` is deprecated. Use a property `alwaysTop` on the tilemap layers instead."
      );
      return new GridTilemap(tilemap, config.firstLayerAboveChar);
    } else {
      return new GridTilemap(tilemap);
    }
  }

  private addCharacters(config: GridEngineConfig) {
    config.characters.forEach((charData) => this.addCharacter(charData));
  }

  private moveChar(charId: string, direction: Direction): void {
    this.initGuard();
    this.unknownCharGuard(charId);
    this.gridCharacters.get(charId).move(direction);
  }
}