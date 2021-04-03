import { Direction } from "../Direction/Direction";
import * as Phaser from "phaser";
import { GridTilemap } from "../GridTilemap/GridTilemap";
import { Subject } from "rxjs";
import { WalkingAnimationMapping } from "../GridEngine";
declare const Vector2: typeof Phaser.Math.Vector2;
declare type Vector2 = Phaser.Math.Vector2;
export interface FrameRow {
    leftFoot: number;
    standing: number;
    rightFoot: number;
}
export declare type CharacterIndex = number;
export interface PositionChange {
    exitTile: Vector2;
    enterTile: Vector2;
}
export interface CharConfig {
    sprite: Phaser.GameObjects.Sprite;
    tilemap: GridTilemap;
    tileSize: Vector2;
    speed: number;
    walkingAnimationEnabled: boolean;
    isometric: boolean;
    walkingAnimationMapping?: CharacterIndex | WalkingAnimationMapping;
    container?: Phaser.GameObjects.Container;
    offsetX?: number;
    offsetY?: number;
}
export declare class GridCharacter {
    private id;
    private static readonly FRAMES_CHAR_ROW;
    private static readonly FRAMES_CHAR_COL;
    private directionToFrameRow;
    private movementDirection;
    private speedPixelsPerSecond;
    private tileSizePixelsWalked;
    private lastFootLeft;
    private _tilePos;
    private prevTilePos;
    private sprite;
    private container?;
    private tilemap;
    private tileDistance;
    private tileSize;
    private speed;
    private characterIndex;
    private walkingAnimationMapping;
    private walkingAnimation;
    private customOffset;
    private movementStarted$;
    private movementStopped$;
    private directionChanged$;
    private positionChanged$;
    private lastMovementImpulse;
    private facingDirection;
    private isIsometric;
    constructor(id: string, config: CharConfig);
    getId(): string;
    getSpeed(): number;
    setSpeed(speed: number): void;
    setWalkingAnimationMapping(walkingAnimationMapping: WalkingAnimationMapping): void;
    setTilePosition(tilePosition: Phaser.Math.Vector2): void;
    getTilePos(): Vector2;
    move(direction: Direction): void;
    update(delta: number): void;
    getMovementDirection(): Direction;
    isBlockingTile(tilePos: Vector2): boolean;
    isBlockingDirection(direction: Direction): boolean;
    isMoving(): boolean;
    turnTowards(direction: Direction): void;
    getFacingDirection(): Direction;
    movementStarted(): Subject<Direction>;
    movementStopped(): Subject<Direction>;
    directionChanged(): Subject<Direction>;
    positionChanged(): Subject<PositionChange>;
    private getOffset;
    private get tilePos();
    private set tilePos(value);
    private updateZindex;
    private setStandingFrame;
    private setWalkingFrame;
    private setPosition;
    private getPosition;
    private isCurrentFrameStanding;
    private framesOfDirection;
    private getFramesForAnimationMapping;
    private getFramesForCharIndex;
    private startMoving;
    private updateTilePos;
    private tilePosInDirection;
    private updateCharacterPosition;
    private shouldContinueMoving;
    private getSpeedPerDelta;
    private willCrossTileBorderThisUpdate;
    private moveCharacterSpriteRestOfTile;
    private getDirectionVecs;
    private moveCharacterSprite;
    private stopMoving;
    private updateCharacterFrame;
    private hasWalkedHalfATile;
}
export {};
