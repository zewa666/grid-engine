---
layout: default
title: Facing Direction (8 directions)
parent: Examples (8 directions)
---

# Facing Direction Observable

**Press the arrow keys to move.** This demo demonstrates how to use the `facingDirection` observable on a character using 8 directions, allowing you to know when a character is facing a certain direction. This demo also uses the [Phaser Containers](phaser-container) feature.

<div id="game"></div>

<script src="js/phaser.min.js"></script>
<script src="js/grid-engine-2.13.0.min.js"></script>
<script src="js/getBasicConfig.js"></script>

<script>
  const config = getBasicConfig(preload, create, update);
  const game = new Phaser.Game(config);
  let facingDirectionText;
  let facingPositionText;

  function preload () {
    this.load.image("tiles", "assets/tf_jungle_tileset.png");
    this.load.tilemapTiledJSON("jungle", "assets/jungle-small.json");
    this.load.spritesheet("player", "assets/characters.png", {
      frameWidth: 52,
      frameHeight: 72,
    });
  }

  function create () {
    const jungleTilemap = this.make.tilemap({ key: "jungle" });
    jungleTilemap.addTilesetImage("jungle", "tiles");
    for (let i = 0; i < jungleTilemap.layers.length; i++) {
      const layer = jungleTilemap.createLayer(i, "jungle", 0, 0);
      layer.scale = 3;
    }
    const playerSprite = this.add.sprite(0, 0, "player");
    playerSprite.scale = 1.5;

    facingDirectionText = this.add.text(-60, -30, '');
    facingPositionText = this.add.text(-60, -10, '');

    const container = this.add.container(0, 0, [ playerSprite, facingDirectionText, facingPositionText]);

    this.cameras.main.startFollow(container, true);
    this.cameras.main.setFollowOffset(- (playerSprite.width), -(playerSprite.height));

    const gridEngineConfig = {
      characters: [
        {
          id: "player",
          sprite: playerSprite,
          walkingAnimationMapping: 6,
          startPosition: {x: 8, y: 12},
          container
        },
      ],
      numberOfDirections: 8,
    };

    this.gridEngine.create(jungleTilemap, gridEngineConfig);
    this.gridEngine.turnTowards("player", 'left');
  }

  function update () {
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown && cursors.up.isDown) {
      this.gridEngine.move("player", "up-left");
    } else if (cursors.left.isDown && cursors.down.isDown) {
      this.gridEngine.move("player", "down-left");
    } else if (cursors.right.isDown && cursors.up.isDown) {
      this.gridEngine.move("player", "up-right");
    } else if (cursors.right.isDown && cursors.down.isDown) {
      this.gridEngine.move("player", "down-right");
    } else if (cursors.left.isDown) {
      this.gridEngine.move("player", "left");
    } else if (cursors.right.isDown) {
      this.gridEngine.move("player", "right");
    } else if (cursors.up.isDown) {
      this.gridEngine.move("player", "up");
    } else if (cursors.down.isDown) {
      this.gridEngine.move("player", "down");
    }
    facingDirectionText.text = `facingDirection: ${this.gridEngine.getFacingDirection('player')}`;
    facingPositionText.text = `facingPosition: (${this.gridEngine.getFacingPosition('player').x}, ${this.gridEngine.getFacingPosition('player').y})`;
  }
</script>

## The Code

```javascript
const game = new Phaser.Game(config);
let facingDirectionText;
let facingPositionText;

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

  facingDirectionText = this.add.text(-60, -30, "");
  facingPositionText = this.add.text(-60, -10, "");

  const container = this.add.container(0, 0, [
    playerSprite,
    facingDirectionText,
    facingPositionText,
  ]);

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
    numberOfDirections: 8,
  };

  this.gridEngine.create(jungleTilemap, gridEngineConfig);
  this.gridEngine.turnTowards("player", "left");
}

function update() {
  const cursors = this.input.keyboard.createCursorKeys();
  if (cursors.left.isDown && cursors.up.isDown) {
    this.gridEngine.move("player", "up-left");
  } else if (cursors.left.isDown && cursors.down.isDown) {
    this.gridEngine.move("player", "down-left");
  } else if (cursors.right.isDown && cursors.up.isDown) {
    this.gridEngine.move("player", "up-right");
  } else if (cursors.right.isDown && cursors.down.isDown) {
    this.gridEngine.move("player", "down-right");
  } else if (cursors.left.isDown) {
    this.gridEngine.move("player", "left");
  } else if (cursors.right.isDown) {
    this.gridEngine.move("player", "right");
  } else if (cursors.up.isDown) {
    this.gridEngine.move("player", "up");
  } else if (cursors.down.isDown) {
    this.gridEngine.move("player", "down");
  }
  facingDirectionText.text = `facingDirection: ${this.gridEngine.getFacingDirection(
    "player"
  )}`;
  facingPositionText.text = `facingPosition: (${
    this.gridEngine.getFacingPosition("player").x
  }, ${this.gridEngine.getFacingPosition("player").y})`;
}
```
