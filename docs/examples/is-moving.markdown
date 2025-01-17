---
layout: default
title: Is Moving
parent: Examples
---

# Is Moving Observable

**Press the arrow keys to move.** This demo demonstrates how to use the `isMoving` observable for characters, allowing you to change behavior depending on whether or not they're in motion! This demo also uses the [Phaser Containers](phaser-container) feature.

<div id="game"></div>

<script src="js/phaser.min.js"></script>
<script src="js/grid-engine-2.13.0.min.js"></script>
<script src="js/getBasicConfig.js"></script>

<script>
  const config = getBasicConfig(preload, create, update);
  const game = new Phaser.Game(config);

  function preload() {
    this.load.image("tiles", "assets/tf_jungle_tileset.png");
    this.load.tilemapTiledJSON("jungle", "assets/jungle-small.json");
    this.load.spritesheet("player", "assets/characters.png", {
      frameWidth: 52,
      frameHeight: 72,
    });
  }

  function create() {
    const jungleTilemap = this.make.tilemap({ key: "jungle" });
    jungleTilemap.addTilesetImage("jungle", "tiles");
    for (let i = 0; i < jungleTilemap.layers.length; i++) {
      const layer = jungleTilemap.createLayer(i, "jungle", 0, 0);
      layer.scale = 3;
    }
    const playerSprite = this.add.sprite(0, 0, "player");
    playerSprite.scale = 1.5;

    isMovingText = this.add.text(-20, -10, "");

    const container = this.add.container(0, 0, [playerSprite, isMovingText]);

    this.cameras.main.startFollow(container, true);
    this.cameras.main.setFollowOffset(-playerSprite.width, -playerSprite.height);

    const gridEngineConfig = {
      characters: [
        {
          id: "player",
          sprite: playerSprite,
          walkingAnimationMapping: 6,
          startPosition: {x: 8, y: 12},
          container,
        },
      ],
    };

    this.gridEngine.create(jungleTilemap, gridEngineConfig);
  }

  function update() {
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) {
      this.gridEngine.move("player", "left");
    } else if (cursors.right.isDown) {
      this.gridEngine.move("player", "right");
    } else if (cursors.up.isDown) {
      this.gridEngine.move("player", "up");
    } else if (cursors.down.isDown) {
      this.gridEngine.move("player", "down");
    }

    isMovingText.text = `isMoving: ${this.gridEngine.isMoving("player")}`;
  }
</script>

## The Code

```javascript
// Your game config
const game = new Phaser.Game(config);

function preload() {
  this.load.image("tiles", "assets/tf_jungle_tileset.png");
  this.load.tilemapTiledJSON("jungle", "assets/jungle-small.json");
  this.load.spritesheet("player", "assets/characters.png", {
    frameWidth: 52,
    frameHeight: 72,
  });
}

function create() {
  const jungleTilemap = this.make.tilemap({ key: "jungle" });
  jungleTilemap.addTilesetImage("jungle", "tiles");
  for (let i = 0; i < jungleTilemap.layers.length; i++) {
    const layer = jungleTilemap.createLayer(i, "jungle", 0, 0);
    layer.scale = 3;
  }
  const playerSprite = this.add.sprite(0, 0, "player");
  playerSprite.scale = 1.5;

  isMovingText = this.add.text(-20, -10, "");

  const container = this.add.container(0, 0, [playerSprite, isMovingText]);

  this.cameras.main.startFollow(container, true);
  this.cameras.main.setFollowOffset(-playerSprite.width, -playerSprite.height);

  const gridEngineConfig = {
    characters: [
      {
        id: "player",
        sprite: playerSprite,
        walkingAnimationMapping: 6,
        startPosition: { x: 8, y: 12 },
        container,
      },
    ],
  };

  this.gridEngine.create(jungleTilemap, gridEngineConfig);
}

function update() {
  const cursors = this.input.keyboard.createCursorKeys();
  if (cursors.left.isDown) {
    this.gridEngine.move("player", "left");
  } else if (cursors.right.isDown) {
    this.gridEngine.move("player", "right");
  } else if (cursors.up.isDown) {
    this.gridEngine.move("player", "up");
  } else if (cursors.down.isDown) {
    this.gridEngine.move("player", "down");
  }

  isMovingText.text = `isMoving: ${this.gridEngine.isMoving("player")}`;
}
```
