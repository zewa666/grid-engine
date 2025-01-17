import { CollisionStrategy } from "./Collisions/CollisionStrategy";
import { GlobalConfig } from "./GlobalConfig/GlobalConfig";
import { Subject, of } from "rxjs";
import { take } from "rxjs/operators";
import { Direction, NumberOfDirections } from "./Direction/Direction";
import { GridCharacter, PositionChange } from "./GridCharacter/GridCharacter";

const mockGridCharacter = {
  setTilePosition: jest.fn(),
  move: jest.fn(),
  update: jest.fn(),
  getTilePos: jest.fn(() => ({
    position: new Vector2(0, 0),
    layer: "someLayer",
  })),
  getNextTilePos: jest.fn(() => ({
    position: new Vector2(0, 0),
    layer: "someLayer",
  })),
  setSpeed: jest.fn(),
  setWalkingAnimationMapping: jest.fn(),
  movementStarted: jest.fn(),
  movementStopped: jest.fn(),
  directionChanged: jest.fn(),
  positionChangeStarted: jest.fn(),
  positionChangeFinished: jest.fn(),
  isMoving: jest.fn(),
  getFacingDirection: jest.fn(),
  getFacingPosition: jest.fn(),
  turnTowards: jest.fn(),
  setMovement: jest.fn(),
  getMovement: jest.fn(),
  getSprite: jest.fn(),
  setSprite: jest.fn(),
  setCharLayer: jest.fn(),
  getCharLayer: jest.fn(),
  getTransition: jest.fn(),
  getCollisionGroups: jest.fn().mockReturnValue(["cGroup1"]),
  setCollisionGroups: jest.fn(),
};
const mockFollowMovement = {
  setCharacter: jest.fn(),
  update: jest.fn(),
};
const mockGridTileMap = {
  addCharacter: jest.fn(),
  removeCharacter: jest.fn(),
  getTileWidth: () => 32,
  getTileHeight: () => 32,
  getTransition: jest.fn(),
  setTransition: jest.fn(),
  isIsometric: jest.fn().mockReturnValue(false),
  isBlocking: jest.fn().mockReturnValue(false),
  hasBlockingTile: jest.fn().mockReturnValue(false),
};
const mockGridTilemapConstructor = jest.fn(function (
  _tilemap,
  _firstLayerAboveChar?
) {
  return mockGridTileMap;
});

const mockNewSprite = { setCrop: jest.fn(), setOrigin: jest.fn() };

expect.extend({
  toBeCharacter(receivedChar: GridCharacter, expectedCharId: string) {
    const pass = receivedChar.getId() == expectedCharId;
    if (pass) {
      return {
        message: () =>
          `expected ${receivedChar.getId()} not to be ${expectedCharId}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${receivedChar.getId()} to be ${expectedCharId}`,
        pass: false,
      };
    }
  },
});

jest.mock("./GridTilemap/GridTilemap", function () {
  return {
    GridTilemap: mockGridTilemapConstructor,
  };
});

function createMockCharConstr() {
  return (id: string) => {
    return {
      ...mockGridCharacter,
      getId: () => id,
    };
  };
}

jest.mock("./GridCharacter/GridCharacter", function () {
  return {
    GridCharacter: jest.fn(createMockCharConstr()),
  };
});

const mockRandomMovement = {
  addCharacter: jest.fn(),
  update: jest.fn(),
  setNumberOfDirections: jest.fn(),
};

const mockTargetMovement = {
  setCharacter: jest.fn(),
  update: jest.fn(),
  removeCharacter: jest.fn(),
  finishedObs: jest.fn().mockReturnValue(of()),
};

jest.mock("./Movement/RandomMovement/RandomMovement", () => ({
  RandomMovement: jest.fn(() => mockRandomMovement),
}));

jest.mock("./Movement/TargetMovement/TargetMovement", () => ({
  TargetMovement: jest.fn(() => mockTargetMovement),
}));

jest.mock("./Movement/FollowMovement/FollowMovement", () => ({
  FollowMovement: jest.fn(function () {
    return mockFollowMovement;
  }),
}));

jest.mock("./GridTilemap/GridTilemap");

import { GridEngine } from "./GridEngine";
import { RandomMovement } from "./Movement/RandomMovement/RandomMovement";
import {
  Finished,
  TargetMovement,
} from "./Movement/TargetMovement/TargetMovement";
import { FollowMovement } from "./Movement/FollowMovement/FollowMovement";
import { Vector2 } from "./Utils/Vector2/Vector2";
import { NoPathFoundStrategy } from "./Pathfinding/NoPathFoundStrategy";
import { PathBlockedStrategy } from "./Pathfinding/PathBlockedStrategy";

describe("GridEngine", () => {
  let gridEngine: GridEngine;
  let sceneMock;
  let tileMapMock;
  let playerSpriteMock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // hacky way of avoiding errors in Plugin Initialization because Phaser
    // is not mockable by jest
    sceneMock = {
      sys: { events: { once: jest.fn(), on: jest.fn() } },
      add: { sprite: jest.fn().mockReturnValue(mockNewSprite) },
    };
    tileMapMock = {
      layers: [
        {
          tilemapLayer: { scale: 2, setDepth: jest.fn() },
        },
      ],
      tileWidth: 16,
      tileHeight: 16,
    };
    playerSpriteMock = { setOrigin: jest.fn() };
    mockTargetMovement.update.mockReset();
    mockRandomMovement.update.mockReset();
    mockGridCharacter.update.mockReset();
    mockFollowMovement.setCharacter.mockReset();
    mockFollowMovement.update.mockReset();
    mockGridCharacter.movementStarted.mockReset().mockReturnValue(of());
    mockGridCharacter.movementStopped.mockReset().mockReturnValue(of());
    mockGridCharacter.directionChanged.mockReset().mockReturnValue(of());
    mockGridCharacter.positionChangeStarted.mockReset().mockReturnValue(of());
    mockGridCharacter.positionChangeFinished.mockReset().mockReturnValue(of());
    gridEngine = new GridEngine(sceneMock);
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
      ],
    });
  });

  it("should boot", () => {
    gridEngine.boot();
    expect(sceneMock.sys.events.on).toHaveBeenCalledWith(
      "update",
      gridEngine.update,
      gridEngine
    );
  });

  it("should init tilemap", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
      ],
    });
    expect(mockGridTilemapConstructor).toHaveBeenCalledWith(tileMapMock);
  });

  it("should init player", () => {
    const containerMock = {};
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          container: <any>containerMock,
        },
      ],
    });
    expect(GridCharacter).toHaveBeenCalledWith("player", {
      sprite: playerSpriteMock,
      tilemap: mockGridTileMap,
      speed: 4,
      container: containerMock,
      offsetX: undefined,
      offsetY: undefined,
      collidesWithTiles: true,
      walkingAnimationMapping: undefined,
      charLayer: undefined,
      collisionGroups: ["geDefault"],
    });
    expect(mockGridCharacter.setTilePosition).toHaveBeenCalledWith({
      position: new Vector2(0, 0),
      layer: "someLayer",
    });
    expect(mockGridCharacter.turnTowards).not.toHaveBeenCalled();
  });

  it("should init player with collisionGroups", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          collides: {
            collidesWithTiles: false,
            collisionGroups: ["cGroup1", "cGroup2"],
          },
        },
      ],
      layerOverlay: true,
    });
    expect(GridCharacter).toHaveBeenCalledWith(
      "player",
      expect.objectContaining({
        collidesWithTiles: false,
        collisionGroups: ["cGroup1", "cGroup2"],
      })
    );
  });

  it("should init player with layerOverlay", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
      ],
      layerOverlay: true,
    });
    expect(GridCharacter).toHaveBeenCalledWith(
      "player",
      expect.objectContaining({
        layerOverlaySprite: mockNewSprite,
      })
    );
  });

  it("should init player with facingDirection", () => {
    const containerMock = {};
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          container: <any>containerMock,
          facingDirection: Direction.LEFT,
        },
      ],
    });
    expect(mockGridCharacter.turnTowards).toHaveBeenCalledWith(Direction.LEFT);
  });

  it("should init player without walking animation", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
      ],
    });
    expect(GridCharacter).toHaveBeenCalledWith("player", {
      sprite: playerSpriteMock,
      tilemap: mockGridTileMap,
      speed: 4,
      collidesWithTiles: true,
      collisionGroups: ["geDefault"],
    });
    expect(mockGridCharacter.setTilePosition).toHaveBeenCalledWith({
      position: new Vector2(0, 0),
      layer: "someLayer",
    });
  });

  it("should init player with animation mapping", () => {
    const walkingAnimationMapping = {
      up: {
        leftFoot: 0,
        standing: 1,
        rightFoot: 2,
      },
      down: {
        leftFoot: 36,
        standing: 37,
        rightFoot: 38,
      },
      left: {
        leftFoot: 12,
        standing: 13,
        rightFoot: 14,
      },
      right: {
        leftFoot: 24,
        standing: 25,
        rightFoot: 26,
      },
    };
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping,
        },
      ],
    });
    expect(GridCharacter).toHaveBeenCalledWith("player", {
      sprite: playerSpriteMock,
      tilemap: mockGridTileMap,
      speed: 4,
      walkingAnimationMapping,
      collidesWithTiles: true,
      collisionGroups: ["geDefault"],
    });
    expect(mockGridCharacter.setTilePosition).toHaveBeenCalledWith({
      position: new Vector2(0, 0),
      layer: "someLayer",
    });
  });

  it("should init GlobalConfig with default values", () => {
    const setSpy = jest.spyOn(GlobalConfig, "set");
    const config = {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
          startPosition: new Vector2(3, 4),
        },
      ],
    };
    gridEngine.create(tileMapMock, config);
    expect(setSpy).toHaveBeenCalledWith({
      ...config,
      collisionTilePropertyName: "ge_collide",
      numberOfDirections: NumberOfDirections.FOUR,
      characterCollisionStrategy: CollisionStrategy.BLOCK_TWO_TILES,
      layerOverlay: false,
    });
  });

  it("should override GlobalConfig default values", () => {
    const setSpy = jest.spyOn(GlobalConfig, "set");
    const config = {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
          startPosition: new Vector2(3, 4),
        },
      ],
      collisionTilePropertyName: "custom_name",
      numberOfDirections: NumberOfDirections.EIGHT,
      characterCollisionStrategy: CollisionStrategy.BLOCK_ONE_TILE_AHEAD,
      layerOverlay: true,
    };
    gridEngine.create(tileMapMock, config);
    expect(setSpy).toHaveBeenCalledWith({
      ...config,
    });
  });

  it("should use config startPosition", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
          startPosition: new Vector2(3, 4),
        },
      ],
    });
    expect(mockGridCharacter.setTilePosition).toHaveBeenCalledWith({
      position: new Vector2(3, 4),
      layer: "someLayer",
    });
  });

  it("should use config speed", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
          speed: 2,
        },
      ],
    });
    expect(GridCharacter).toHaveBeenCalledWith(
      "player",
      expect.objectContaining({
        speed: 2,
      })
    );
  });

  it("should use config offset", () => {
    const offsetX = 5;
    const offsetY = 6;
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
          offsetX,
          offsetY,
        },
      ],
    });
    expect(GridCharacter).toHaveBeenCalledWith("player", {
      sprite: playerSpriteMock,
      tilemap: mockGridTileMap,
      speed: 4,
      walkingAnimationMapping: 3,
      offsetX,
      offsetY,
      collidesWithTiles: true,
      collisionGroups: ["geDefault"],
    });
  });

  describe("collision config", () => {
    it("should use config collides", () => {
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
            walkingAnimationMapping: 3,
            speed: 2,
            collides: false,
          },
        ],
      });
      expect(GridCharacter).toHaveBeenCalledWith(
        "player",
        expect.objectContaining({
          collidesWithTiles: false,
          collisionGroups: [],
        })
      );
    });

    it("should use config collidesWithTiles true", () => {
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
            walkingAnimationMapping: 3,
            speed: 2,
            collides: {
              collidesWithTiles: true,
            },
          },
        ],
      });
      expect(GridCharacter).toHaveBeenCalledWith(
        "player",
        expect.objectContaining({
          collidesWithTiles: true,
          collisionGroups: ["geDefault"],
        })
      );
    });

    it("should use config collidesWithTiles false", () => {
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
            walkingAnimationMapping: 3,
            speed: 2,
            collides: {
              collidesWithTiles: false,
            },
          },
        ],
      });
      expect(GridCharacter).toHaveBeenCalledWith(
        "player",
        expect.objectContaining({
          collidesWithTiles: false,
          collisionGroups: ["geDefault"],
        })
      );
    });

    it("should use config collisionGroups", () => {
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
            walkingAnimationMapping: 3,
            speed: 2,
            collides: {
              collisionGroups: ["test"],
            },
          },
        ],
      });
      expect(GridCharacter).toHaveBeenCalledWith(
        "player",
        expect.objectContaining({
          collidesWithTiles: true,
          collisionGroups: ["test"],
        })
      );
    });
  });

  it("should use config char layer", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
          startPosition: new Vector2(3, 4),
          charLayer: "someCharLayer",
        },
      ],
    });
    expect(GridCharacter).toHaveBeenCalledWith(
      "player",
      expect.objectContaining({
        charLayer: "someCharLayer",
      })
    );
  });

  describe("move 4 dirs", () => {
    it("should move player orthogonally", () => {
      gridEngine.move("player", Direction.LEFT);

      expect(mockGridCharacter.move).toHaveBeenCalledWith(Direction.LEFT);
    });

    it("should show warn on vertical move", () => {
      console.warn = jest.fn();
      gridEngine.move("player", Direction.DOWN_LEFT);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'down-left' in 4 direction mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();

      gridEngine.move("player", Direction.DOWN_RIGHT);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'down-right' in 4 direction mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();

      gridEngine.move("player", Direction.UP_RIGHT);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'up-right' in 4 direction mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();

      gridEngine.move("player", Direction.UP_LEFT);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'up-left' in 4 direction mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();
    });
  });

  describe("move 8 dirs", () => {
    it("should move player orthogonally", () => {
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
        numberOfDirections: NumberOfDirections.EIGHT,
      });

      gridEngine.move("player", Direction.LEFT);

      expect(mockGridCharacter.move).toHaveBeenCalledWith(Direction.LEFT);
    });

    it("should move player vertically", () => {
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
        numberOfDirections: NumberOfDirections.EIGHT,
      });

      gridEngine.move("player", Direction.UP_LEFT);

      expect(mockGridCharacter.move).toHaveBeenCalledWith(Direction.UP_LEFT);
    });
  });

  describe("move 4 dirs isometric", () => {
    it("should move player vertically", () => {
      mockGridTileMap.isIsometric.mockReturnValue(true);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.move("player", Direction.UP_LEFT);

      expect(mockGridCharacter.move).toHaveBeenCalledWith(Direction.UP_LEFT);
    });

    it("should show warn on orthogonal move", () => {
      console.warn = jest.fn();
      mockGridTileMap.isIsometric.mockReturnValue(true);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.move("player", Direction.DOWN);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'down' in 4 direction isometric mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();

      gridEngine.move("player", Direction.LEFT);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'left' in 4 direction isometric mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();

      gridEngine.move("player", Direction.RIGHT);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'right' in 4 direction isometric mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();

      gridEngine.move("player", Direction.UP);
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Character 'player' can't be moved 'up' in 4 direction isometric mode."
      );
      expect(mockGridCharacter.move).not.toHaveBeenCalled();
    });
  });

  it("should update", () => {
    gridEngine.update(123, 456);

    expect(mockGridCharacter.update).toHaveBeenCalledWith(456);
  });

  it("should get tile position", () => {
    mockGridCharacter.getTilePos.mockReturnValue({
      position: new Vector2(3, 4),
      layer: "someLayer",
    });

    expect(gridEngine.getPosition("player")).toEqual(new Vector2(3, 4));
  });

  it("should set tile position", () => {
    gridEngine.setPosition("player", { x: 3, y: 4 }, "someOtherLayer");

    expect(mockGridCharacter.setTilePosition).toHaveBeenCalledWith({
      position: new Vector2(3, 4),
      layer: "someOtherLayer",
    });
  });

  it("should set tile position without layer", () => {
    gridEngine.setPosition("player", { x: 3, y: 4 });

    expect(mockGridCharacter.setTilePosition).toHaveBeenCalledWith({
      position: new Vector2(3, 4),
      layer: "someLayer",
    });
  });

  it("should get sprite", () => {
    mockGridCharacter.getSprite.mockReturnValue("sprite");

    expect(gridEngine.getSprite("player")).toEqual("sprite");
  });

  it("should set sprite", () => {
    const mockSprite = <any>{ setOrigin: jest.fn() };
    gridEngine.setSprite("player", mockSprite);

    expect(mockGridCharacter.setSprite).toHaveBeenCalledWith(mockSprite);
  });

  it("should get facing position", () => {
    mockGridCharacter.getFacingPosition.mockReturnValue(new Vector2(2, 3));
    const res = gridEngine.getFacingPosition("player");

    expect(mockGridCharacter.getFacingPosition).toHaveBeenCalled();
    expect(res).toEqual({ x: 2, y: 3 });
  });

  it("should move randomly", () => {
    gridEngine.moveRandomly("player", 123, 3);
    expect(RandomMovement).toHaveBeenCalledWith(
      // @ts-ignore
      expect.toBeCharacter("player"),
      NumberOfDirections.FOUR,
      123,
      3
    );
    expect(mockGridCharacter.setMovement).toHaveBeenCalledWith(
      mockRandomMovement
    );
  });

  describe("moveTo", () => {
    it("should move to coordinates", () => {
      const targetVec = { position: new Vector2(3, 4), layer: "layer1" };
      gridEngine.moveTo("player", targetVec.position);
      expect(TargetMovement).toHaveBeenCalledWith(
        // @ts-ignore
        expect.toBeCharacter("player"),
        mockGridTileMap,
        { position: targetVec.position, layer: "someLayer" },
        NumberOfDirections.FOUR,
        0,
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
        }
      );
      expect(mockGridCharacter.setMovement).toHaveBeenCalledWith(
        mockTargetMovement
      );
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should move to layer", () => {
      const targetVec = { position: new Vector2(3, 4), layer: "layer1" };
      gridEngine.moveTo("player", targetVec.position, {
        targetLayer: "layer1",
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        // @ts-ignore
        expect.toBeCharacter("player"),
        mockGridTileMap,
        targetVec,
        NumberOfDirections.FOUR,
        0,
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
          targetLayer: "layer1",
        }
      );
    });

    it("should return observable", (done) => {
      const finishedSubject = new Subject<Finished>();
      mockTargetMovement.finishedObs.mockReturnValue(finishedSubject);
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec).subscribe((finished) => {
        expect(finished.charId).toEqual("player");
        expect(finished.position).toEqual({ x: 1, y: 2 });
        expect(finished.description).toEqual("errorReason");
        done();
      });
      finishedSubject.next(<Finished>{
        position: { x: 1, y: 2 },
        result: "PATH_BLOCKED",
        description: "errorReason",
      });
    });

    it("should return observable only once", (done) => {
      const finishedSubject = new Subject<Finished>();
      mockTargetMovement.finishedObs.mockReturnValue(finishedSubject);
      const targetVec = new Vector2(3, 4);
      const callMock = jest.fn();
      gridEngine.moveTo("player", targetVec).subscribe(callMock).add(done);
      finishedSubject.next(<Finished>{
        position: { x: 1, y: 2 },
        result: "PATH_BLOCKED",
        description: "errorReason",
      });
      finishedSubject.next(<Finished>{
        position: { x: 1, y: 2 },
        result: "PATH_BLOCKED",
        description: "errorReason",
      });

      expect(callMock).toHaveBeenCalledTimes(1);
    });

    it("should use backoff and retry", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundRetryBackoffMs: 500,
        noPathFoundMaxRetries: 10,
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
          noPathFoundRetryBackoffMs: 500,
          noPathFoundMaxRetries: 10,
        }
      );
    });

    it("should move to coordinates STOP", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundStrategy: NoPathFoundStrategy.STOP,
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
        }
      );
    });

    it("should move to coordinates CLOSEST_REACHABLE", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundStrategy: NoPathFoundStrategy.CLOSEST_REACHABLE,
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.CLOSEST_REACHABLE,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
        }
      );
    });

    it("should move to coordinates STOP on unknown strategy", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundStrategy: <NoPathFoundStrategy>"unknown strategy",
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
        }
      );
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Unknown NoPathFoundStrategy 'unknown strategy'. Falling back to 'STOP'"
      );
    });

    it("should use pathBlockedStrategy = WAIT", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundStrategy: NoPathFoundStrategy.STOP,
        pathBlockedStrategy: PathBlockedStrategy.WAIT,
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
        }
      );
    });

    it("should use pathBlockedStrategy = RETRY", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundStrategy: NoPathFoundStrategy.STOP,
        pathBlockedStrategy: PathBlockedStrategy.RETRY,
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.RETRY,
        }
      );
    });

    it("should use pathBlockedStrategy WAIT and warn on unkown input", () => {
      const targetVec = new Vector2(3, 4);
      gridEngine.moveTo("player", targetVec, {
        noPathFoundStrategy: NoPathFoundStrategy.STOP,
        pathBlockedStrategy: <PathBlockedStrategy>"unknown strategy",
      });
      expect(TargetMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        {
          noPathFoundStrategy: NoPathFoundStrategy.STOP,
          pathBlockedStrategy: PathBlockedStrategy.WAIT,
        }
      );
      expect(console.warn).toHaveBeenCalledWith(
        "GridEngine: Unknown PathBlockedStrategy 'unknown strategy'. Falling back to 'WAIT'"
      );
    });
  });

  it("should stop moving", () => {
    mockGridCharacter.getMovement.mockReturnValue({});
    gridEngine.stopMovement("player");
    expect(mockGridCharacter.setMovement).toHaveBeenCalledWith(undefined);
  });

  it("should set speed", () => {
    gridEngine.setSpeed("player", 2);
    expect(mockGridCharacter.setSpeed).toHaveBeenCalledWith(2);
  });

  it("should not call update before create", () => {
    gridEngine.update(123, 456);
    expect(mockRandomMovement.update).not.toHaveBeenCalled();
    expect(mockTargetMovement.update).not.toHaveBeenCalled();
  });

  it("should add chars on the go", () => {
    gridEngine.create(tileMapMock, {
      characters: [],
    });
    gridEngine.addCharacter({
      id: "player",
      sprite: playerSpriteMock,
    });
    gridEngine.update(123, 456);
    expect(mockGridCharacter.update).toHaveBeenCalledTimes(1);
  });

  it("should remove chars on the go", () => {
    gridEngine.removeCharacter("player");
    gridEngine.update(123, 456);
    expect(mockGridTileMap.removeCharacter).toHaveBeenCalledWith("player");
    expect(mockGridCharacter.update).not.toHaveBeenCalled();
  });

  it("should remove all chars", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
        {
          id: "player2",
          sprite: playerSpriteMock,
        },
      ],
    });
    gridEngine.removeAllCharacters();
    gridEngine.update(123, 456);
    expect(mockGridTileMap.removeCharacter).toHaveBeenCalledWith("player");
    expect(mockGridTileMap.removeCharacter).toHaveBeenCalledWith("player2");
    expect(mockGridCharacter.update).not.toHaveBeenCalled();
  });

  it("should get all chars", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
        {
          id: "player2",
          sprite: playerSpriteMock,
        },
      ],
    });
    const chars = gridEngine.getAllCharacters();
    expect(chars).toEqual(["player", "player2"]);
  });

  it("should check if char is registered", () => {
    gridEngine.addCharacter({
      id: "player2",
      sprite: playerSpriteMock,
    });
    expect(gridEngine.hasCharacter("player")).toBe(true);
    expect(gridEngine.hasCharacter("player2")).toBe(true);
    expect(gridEngine.hasCharacter("unknownCharId")).toBe(false);
  });

  it("should follow a char", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
        {
          id: "player2",
          sprite: playerSpriteMock,
        },
      ],
    });
    gridEngine.follow("player", "player2", 7, true);
    expect(FollowMovement).toHaveBeenCalledWith(
      // @ts-ignore
      expect.toBeCharacter("player"),
      mockGridTileMap,
      // @ts-ignore
      expect.toBeCharacter("player2"),
      NumberOfDirections.FOUR,
      7,
      NoPathFoundStrategy.CLOSEST_REACHABLE
    );
    expect(mockGridCharacter.setMovement).toHaveBeenCalledWith(
      mockFollowMovement
    );
  });

  it("should follow a char with default distance", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
        },
        {
          id: "player2",
          sprite: playerSpriteMock,
        },
      ],
    });
    gridEngine.follow("player", "player2");
    expect(FollowMovement).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      0,
      NoPathFoundStrategy.STOP
    );
    expect(mockGridCharacter.setMovement).toHaveBeenCalledWith(
      mockFollowMovement
    );
  });

  it("should set walkingAnimationMapping", () => {
    gridEngine.create(tileMapMock, {
      characters: [
        {
          id: "player",
          sprite: playerSpriteMock,
          walkingAnimationMapping: 3,
        },
      ],
    });
    const mockMapping = {
      up: {
        leftFoot: 0,
        standing: 1,
        rightFoot: 2,
      },
      right: {
        leftFoot: 3,
        standing: 4,
        rightFoot: 5,
      },
      down: {
        leftFoot: 6,
        standing: 7,
        rightFoot: 8,
      },
      left: {
        leftFoot: 9,
        standing: 10,
        rightFoot: 11,
      },
    };
    gridEngine.setWalkingAnimationMapping("player", mockMapping);
    expect(mockGridCharacter.setWalkingAnimationMapping).toHaveBeenCalledWith(
      mockMapping
    );
  });

  it("should delegate isMoving", () => {
    mockGridCharacter.isMoving.mockReturnValue(true);
    let isMoving = gridEngine.isMoving("player");
    expect(isMoving).toEqual(true);
    mockGridCharacter.isMoving.mockReturnValue(false);
    isMoving = gridEngine.isMoving("player");
    expect(isMoving).toEqual(false);
  });

  it("should delegate getFacingDirection", () => {
    mockGridCharacter.getFacingDirection.mockReturnValue(Direction.LEFT);
    const facingDirection = gridEngine.getFacingDirection("player");
    expect(facingDirection).toEqual(Direction.LEFT);
  });

  it("should delegate turnTowards", () => {
    gridEngine.turnTowards("player", Direction.RIGHT);
    expect(mockGridCharacter.turnTowards).toHaveBeenCalledWith(Direction.RIGHT);
  });

  it("should delegate getCharLayer", () => {
    mockGridCharacter.getCharLayer.mockReturnValue("someLayer");
    expect(gridEngine.getCharLayer("player")).toEqual("someLayer");
  });

  it("should delegate getTransition", () => {
    mockGridTileMap.getTransition.mockReturnValue("someLayer");
    expect(gridEngine.getTransition({ x: 3, y: 4 }, "fromLayer")).toEqual(
      "someLayer"
    );
  });

  it("should delegate setTransition", () => {
    gridEngine.setTransition({ x: 3, y: 4 }, "fromLayer", "toLayer");
    expect(mockGridTileMap.setTransition).toHaveBeenCalledWith(
      { x: 3, y: 4 },
      "fromLayer",
      "toLayer"
    );
  });

  it("should delegate isBlocking", () => {
    const result = gridEngine.isBlocked({ x: 3, y: 4 }, "someLayer", [
      "cGroup",
    ]);
    expect(mockGridTileMap.isBlocking).toHaveBeenCalledWith(
      "someLayer",
      new Vector2(3, 4),
      ["cGroup"]
    );
    expect(result).toBe(false);
  });

  it("should delegate isBlocking with default cGroup", () => {
    const result = gridEngine.isBlocked({ x: 3, y: 4 }, "someLayer");
    expect(mockGridTileMap.isBlocking).toHaveBeenCalledWith(
      "someLayer",
      new Vector2(3, 4),
      ["geDefault"]
    );
    expect(result).toBe(false);
  });

  it("should delegate isTilemapBlocking", () => {
    const result = gridEngine.isTileBlocked({ x: 3, y: 4 }, "someLayer");
    expect(mockGridTileMap.hasBlockingTile).toHaveBeenCalledWith(
      "someLayer",
      new Vector2(3, 4)
    );
    expect(result).toBe(false);
  });

  it("should delegate getCollisionGroups", () => {
    const result = gridEngine.getCollisionGroups("player");
    expect(mockGridCharacter.getCollisionGroups).toHaveBeenCalled();
    expect(result).toBe(mockGridCharacter.getCollisionGroups());
  });

  it("should delegate setCollisionGroups", () => {
    gridEngine.setCollisionGroups("player", ["cGroup1"]);
    expect(mockGridCharacter.setCollisionGroups).toHaveBeenCalledWith([
      "cGroup1",
    ]);
  });

  describe("Observables", () => {
    it("should get chars movementStarted observable", async () => {
      const mockSubject = new Subject<Direction>();
      mockGridCharacter.movementStarted.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      const prom = gridEngine.movementStarted().pipe(take(1)).toPromise();

      mockSubject.next(Direction.LEFT);
      const res = await prom;
      expect(res).toEqual({ charId: "player", direction: Direction.LEFT });
    });

    it("should unsubscribe from movementStarted if char removed", () => {
      const mockSubject = new Subject<Direction>();
      mockGridCharacter.movementStarted.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.removeCharacter("player");
      const nextMock = jest.fn();

      gridEngine.movementStarted().subscribe({
        complete: jest.fn(),
        next: nextMock,
      });

      mockSubject.next(Direction.LEFT);
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("should get chars movementStopped observable", async () => {
      const mockSubject = new Subject<Direction>();
      mockGridCharacter.movementStopped.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      const prom = gridEngine.movementStopped().pipe(take(1)).toPromise();

      mockSubject.next(Direction.LEFT);
      const res = await prom;
      expect(res).toEqual({ charId: "player", direction: Direction.LEFT });
    });

    it("should unsubscribe from movementStopped if char removed", () => {
      const mockSubject = new Subject<Direction>();
      mockGridCharacter.movementStopped.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.removeCharacter("player");
      const nextMock = jest.fn();

      gridEngine.movementStopped().subscribe({
        complete: jest.fn(),
        next: nextMock,
      });

      mockSubject.next(Direction.LEFT);
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("should get chars directionChanged observable", async () => {
      const mockSubject = new Subject<Direction>();
      mockGridCharacter.directionChanged.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      const prom = gridEngine.directionChanged().pipe(take(1)).toPromise();

      mockSubject.next(Direction.LEFT);
      const res = await prom;
      expect(res).toEqual({ charId: "player", direction: Direction.LEFT });
    });

    it("should unsubscribe from directionChanged if char removed", () => {
      const mockSubject = new Subject<Direction>();
      mockGridCharacter.directionChanged.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.removeCharacter("player");
      const nextMock = jest.fn();

      gridEngine.directionChanged().subscribe({
        complete: jest.fn(),
        next: nextMock,
      });

      mockSubject.next(Direction.LEFT);
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("should get chars positionChangeStarted observable", async () => {
      const mockSubject = new Subject<PositionChange>();
      mockGridCharacter.positionChangeStarted.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      const prom = gridEngine.positionChangeStarted().pipe(take(1)).toPromise();

      const exitTile = new Vector2(1, 2);
      const enterTile = new Vector2(2, 2);
      const exitLayer = "firstLayer";
      const enterLayer = "secondLayer";

      mockSubject.next({
        exitTile,
        enterTile,
        exitLayer,
        enterLayer,
      });
      const res = await prom;
      expect(res).toEqual({
        charId: "player",
        exitTile,
        enterTile,
        enterLayer,
        exitLayer,
      });
    });

    it("should unsubscribe from positionChangeStarted if char removed", () => {
      const mockSubject = new Subject<PositionChange>();
      mockGridCharacter.positionChangeStarted.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.removeCharacter("player");
      const nextMock = jest.fn();

      gridEngine.positionChangeStarted().subscribe({
        complete: jest.fn(),
        next: nextMock,
      });

      const exitTile = new Vector2(1, 2);
      const enterTile = new Vector2(2, 2);
      const exitLayer = "firstLayer";
      const enterLayer = "secondLayer";

      mockSubject.next({ exitTile, enterTile, enterLayer, exitLayer });
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("should get chars positionChangeFinished observable", async () => {
      const mockSubject = new Subject<PositionChange>();
      mockGridCharacter.positionChangeFinished.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      const prom = gridEngine
        .positionChangeFinished()
        .pipe(take(1))
        .toPromise();

      const exitTile = new Vector2(1, 2);
      const enterTile = new Vector2(2, 2);
      const exitLayer = "firstLayer";
      const enterLayer = "secondLayer";

      mockSubject.next({
        exitTile,
        enterTile,
        enterLayer,
        exitLayer,
      });
      const res = await prom;
      expect(res).toEqual({
        charId: "player",
        exitTile,
        enterTile,
        enterLayer,
        exitLayer,
      });
    });

    it("should notify if any provided character stepped on any of the given tiles on specified layers", () => {
      const mockSubject = new Subject<PositionChange & { charId: string }>();
      mockGridCharacter.positionChangeFinished.mockReturnValue(mockSubject);
      const nextMock = jest.fn();
      const player1 = "player1";
      const player2 = "player2";
      const expectedLayer = "anyLayer";
      const expectedTargetPosition = new Vector2(5, 5);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: player1,
            sprite: playerSpriteMock,
          },
          {
            id: player2,
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine
        .steppedOn(
          [player1, player2],
          [expectedTargetPosition],
          [expectedLayer]
        )
        .subscribe({
          complete: jest.fn(),
          next: nextMock,
        });

      mockSubject.next({
        exitTile: new Vector2(1, 1),
        enterTile: expectedTargetPosition,
        enterLayer: expectedLayer,
        exitLayer: expectedLayer,
        charId: player1,
      });
      expect(nextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          enterTile: expectedTargetPosition,
        })
      );

      nextMock.mockClear();
      mockSubject.next({
        exitTile: new Vector2(1, 1),
        enterTile: expectedTargetPosition,
        enterLayer: "not matching layer",
        exitLayer: expectedLayer,
        charId: player1,
      });
      expect(nextMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          enterTile: expectedTargetPosition,
        })
      );

      nextMock.mockClear();
      mockSubject.next({
        exitTile: new Vector2(1, 1),
        enterTile: expectedTargetPosition,
        enterLayer: expectedLayer,
        exitLayer: expectedLayer,
        charId: "non matching character",
      });
      expect(nextMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          enterTile: expectedTargetPosition,
        })
      );

      nextMock.mockClear();
      mockSubject.next({
        exitTile: new Vector2(1, 1),
        enterTile: new Vector2(10, 10), // non matching tile
        enterLayer: expectedLayer,
        exitLayer: expectedLayer,
        charId: player1,
      });
      expect(nextMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          enterTile: expectedTargetPosition,
        })
      );
    });

    it("should unsubscribe from positionChangeFinished if char removed", () => {
      const mockSubject = new Subject<PositionChange>();
      mockGridCharacter.positionChangeFinished.mockReturnValue(mockSubject);
      gridEngine.create(tileMapMock, {
        characters: [
          {
            id: "player",
            sprite: playerSpriteMock,
          },
        ],
      });

      gridEngine.removeCharacter("player");
      const nextMock = jest.fn();

      gridEngine.positionChangeFinished().subscribe({
        complete: jest.fn(),
        next: nextMock,
      });

      const exitTile = new Vector2(1, 2);
      const enterTile = new Vector2(2, 2);
      const exitLayer = "firstLayer";
      const enterLayer = "secondLayer";

      mockSubject.next({ exitTile, enterTile, enterLayer, exitLayer });
      expect(nextMock).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling unknown char id", () => {
    const UNKNOWN_CHAR_ID = "unknownCharId";

    function expectCharUnknownException(fn: () => any) {
      expect(() => fn()).toThrow("Character unknown");
    }

    it("should throw error if char id unknown", () => {
      expectCharUnknownException(() => gridEngine.getPosition(UNKNOWN_CHAR_ID));
      expectCharUnknownException(() =>
        gridEngine.setPosition(UNKNOWN_CHAR_ID, new Vector2(1, 2))
      );
      expectCharUnknownException(() =>
        gridEngine.move(UNKNOWN_CHAR_ID, Direction.LEFT)
      );
      expectCharUnknownException(() =>
        gridEngine.moveRandomly(UNKNOWN_CHAR_ID)
      );
      expectCharUnknownException(() =>
        gridEngine.stopMovement(UNKNOWN_CHAR_ID)
      );
      expectCharUnknownException(() => gridEngine.setSpeed(UNKNOWN_CHAR_ID, 4));
      expectCharUnknownException(() =>
        gridEngine.moveTo(UNKNOWN_CHAR_ID, new Vector2(3, 4))
      );
      expectCharUnknownException(() =>
        gridEngine.removeCharacter(UNKNOWN_CHAR_ID)
      );

      expectCharUnknownException(() =>
        gridEngine.setWalkingAnimationMapping(UNKNOWN_CHAR_ID, <any>{})
      );
      expectCharUnknownException(() => gridEngine.isMoving(UNKNOWN_CHAR_ID));
      expectCharUnknownException(() =>
        gridEngine.getFacingDirection(UNKNOWN_CHAR_ID)
      );
      expectCharUnknownException(() =>
        gridEngine.turnTowards(UNKNOWN_CHAR_ID, Direction.LEFT)
      );
      expectCharUnknownException(() =>
        gridEngine.setSprite(UNKNOWN_CHAR_ID, playerSpriteMock)
      );
      expectCharUnknownException(() => gridEngine.getSprite(UNKNOWN_CHAR_ID));
      expectCharUnknownException(() =>
        gridEngine.getFacingPosition(UNKNOWN_CHAR_ID)
      );
      expectCharUnknownException(() =>
        gridEngine.getCharLayer(UNKNOWN_CHAR_ID)
      );
      expectCharUnknownException(() =>
        gridEngine.getCollisionGroups(UNKNOWN_CHAR_ID)
      );
      expectCharUnknownException(() =>
        gridEngine.setCollisionGroups(UNKNOWN_CHAR_ID, ["cGroup"])
      );
    });

    it("should throw error if follow is invoked", () => {
      expect(() => gridEngine.follow("unknownCharId", "player")).toThrow(
        "Character unknown"
      );
      expect(() => gridEngine.follow("player", "unknownCharId")).toThrow(
        "Character unknown"
      );
      expect(() => gridEngine.follow("unknownCharId", "unknownCharId")).toThrow(
        "Character unknown"
      );
    });
  });

  describe("invokation of methods if not created properly", () => {
    const SOME_CHAR_ID = "someCharId";

    beforeEach(() => {
      gridEngine = new GridEngine(sceneMock);
    });

    function expectUninitializedException(fn: () => any) {
      expect(() => fn()).toThrow("Plugin not initialized");
    }

    it("should throw error if plugin not created", () => {
      expectUninitializedException(() => gridEngine.getPosition(SOME_CHAR_ID));
      expectUninitializedException(() =>
        gridEngine.setPosition(SOME_CHAR_ID, new Vector2(1, 2))
      );
      expectUninitializedException(() =>
        gridEngine.move(SOME_CHAR_ID, Direction.LEFT)
      );
      expectUninitializedException(() => gridEngine.moveRandomly(SOME_CHAR_ID));
      expectUninitializedException(() =>
        gridEngine.moveTo(SOME_CHAR_ID, new Vector2(2, 3))
      );
      expectUninitializedException(() => gridEngine.stopMovement(SOME_CHAR_ID));
      expectUninitializedException(() => gridEngine.setSpeed(SOME_CHAR_ID, 3));
      expectUninitializedException(() =>
        gridEngine.addCharacter({
          id: "player",
          sprite: playerSpriteMock,
        })
      );
      expectUninitializedException(() => gridEngine.hasCharacter(SOME_CHAR_ID));
      expectUninitializedException(() =>
        gridEngine.removeCharacter(SOME_CHAR_ID)
      );
      expectUninitializedException(() => gridEngine.removeAllCharacters());
      expectUninitializedException(() =>
        gridEngine.follow(SOME_CHAR_ID, "someOtherCharId")
      );
      expectUninitializedException(() =>
        gridEngine.setWalkingAnimationMapping(SOME_CHAR_ID, <any>{})
      );
      expectUninitializedException(() => gridEngine.isMoving(SOME_CHAR_ID));
      expectUninitializedException(() =>
        gridEngine.getFacingDirection(SOME_CHAR_ID)
      );
      expectUninitializedException(() =>
        gridEngine.turnTowards(SOME_CHAR_ID, Direction.LEFT)
      );
      expectUninitializedException(() => gridEngine.getAllCharacters());
      expectUninitializedException(() =>
        gridEngine.setSprite(SOME_CHAR_ID, playerSpriteMock)
      );
      expectUninitializedException(() => gridEngine.getSprite(SOME_CHAR_ID));
      expectUninitializedException(() =>
        gridEngine.getFacingPosition(SOME_CHAR_ID)
      );
      expectUninitializedException(() => gridEngine.getCharLayer(SOME_CHAR_ID));
      expectUninitializedException(() =>
        gridEngine.getTransition(new Vector2({ x: 2, y: 2 }), "someLayer")
      );
      expectUninitializedException(() =>
        gridEngine.setTransition(
          new Vector2({ x: 2, y: 2 }),
          "fromLayer",
          "toLayer"
        )
      );
      expectUninitializedException(() =>
        gridEngine.isBlocked({ x: 2, y: 2 }, "someLayer")
      );
      expectUninitializedException(() =>
        gridEngine.isTileBlocked({ x: 2, y: 2 }, "someLayer")
      );
      expectUninitializedException(() =>
        gridEngine.getCollisionGroups(SOME_CHAR_ID)
      );
      expectUninitializedException(() =>
        gridEngine.setCollisionGroups(SOME_CHAR_ID, ["cGroup"])
      );
    });
  });
});
