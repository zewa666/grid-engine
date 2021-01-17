import { GridTilemap } from "./../GridTilemap/GridTilemap";
import { VectorUtils } from "./../Utils/VectorUtils";
import { GridCharacter } from "../GridCharacter/GridCharacter";
import * as Phaser from "phaser";
import { Direction } from "../Direction/Direction";
import { Bfs } from "../Algorithms/ShortestPath/Bfs/Bfs";

type Vector2 = Phaser.Math.Vector2;
const Vector2 = Phaser.Math.Vector2;

interface MovementTuple {
  character: GridCharacter;
  config: MovementConfig;
}

interface MovementConfig {
  targetPos: Phaser.Math.Vector2;
}

export class TargetMovement {
  private characters: Map<string, MovementTuple>;
  constructor(private tilemap: GridTilemap) {
    this.characters = new Map();
  }

  addCharacter(character: GridCharacter, targetPos: Phaser.Math.Vector2) {
    this.characters.set(character.getId(), {
      character,
      config: { targetPos },
    });
  }

  removeCharacter(character: GridCharacter) {
    this.characters.delete(character.getId());
  }

  update() {
    this.getStandingCharacters().forEach(({ character, config }) => {
      if (
        VectorUtils.vec2str(character.getTilePos()) ==
        VectorUtils.vec2str(config.targetPos)
      ) {
        this.characters.delete(character.getId());
      } else {
        const dir = this.getDirOnShortestPath(character, config.targetPos);
        character.move(dir);
      }
    });
  }

  isBlocking = (pos: Vector2): boolean => {
    return this.tilemap.isBlocking(pos);
  };

  private getDirOnShortestPath(
    character: GridCharacter,
    targetPos: Phaser.Math.Vector2
  ): Direction {
    const shortestPath = Bfs.getShortestPath(
      character.getTilePos(),
      targetPos,
      this.isBlocking
    );

    if (shortestPath.length < 1) return Direction.NONE;

    const nextField = shortestPath[1];
    if (nextField.x > character.getTilePos().x) {
      return Direction.RIGHT;
    } else if (nextField.x < character.getTilePos().x) {
      return Direction.LEFT;
    } else if (nextField.y < character.getTilePos().y) {
      return Direction.UP;
    } else if (nextField.y > character.getTilePos().y) {
      return Direction.DOWN;
    }
    return Direction.NONE;
  }

  private getStandingCharacters(): MovementTuple[] {
    return [...this.characters.values()].filter(
      (tuple) => !tuple.character.isMoving()
    );
  }
}