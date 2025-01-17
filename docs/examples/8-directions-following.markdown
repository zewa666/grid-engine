---
layout: default
title: Following
parent: Examples (8 directions)
---

# Following

**Press the arrow keys to move.** This demo demonstrates how you can make a character follow another character using 8 directions.

<div id="game"></div>

<script src="js/phaser.min.js"></script>
<script src="js/grid-engine-2.13.0.min.js"></script>
<script src="js/getBasicConfig.js"></script>

<script>
  const config = getBasicConfig(preload, create, update);
  const game = new Phaser.Game(config);

  function preload () {
    this.load.image("tiles", "assets/cloud_tileset.png");
    this.load.tilemapTiledJSON("cloud-city-map", "assets/cloud_city_large.json");
    this.load.spritesheet("player", "assets/characters.png", {
      frameWidth: 52,
      frameHeight: 72,
    });
  }

  function create () {
    const cloudCityTilemap = this.make.tilemap({ key: "cloud-city-map" });
    cloudCityTilemap.addTilesetImage("cloud_tileset", "tiles");
    for (let i = 0; i < cloudCityTilemap.layers.length; i++) {
      const layer = cloudCityTilemap.createLayer(i, "cloud_tileset", 0, 0);
      layer.scale = 3;
    }
    const playerSprite = this.add.sprite(0, 0, "player");
    playerSprite.scale = 1.5;
    this.cameras.main.startFollow(playerSprite, true);
    this.cameras.main.setFollowOffset(- (playerSprite.width), -(playerSprite.height));

    const npcSprite = this.add.sprite(0, 0, "player");
    npcSprite.scale = 1.5;

    const npcSprite1 = this.add.sprite(0, 0, "player");
    npcSprite1.scale = 1.5;

    const npcSprite2 = this.add.sprite(0, 0, "player");
    npcSprite2.scale = 1.5;

    const gridEngineConfig = {
      characters: [
        {
          id: "player",
          sprite: playerSprite,
          walkingAnimationMapping: 6,
          startPosition: {x: 8, y: 8},
        },
        {
          id: "npc0",
          sprite: npcSprite,
          walkingAnimationMapping: 0,
          startPosition: {x: 12, y: 5},
          speed: 3,
        },
        {
          id: "npc1",
          sprite: npcSprite1,
          walkingAnimationMapping: 1,
          startPosition: {x: 14, y: 8},
        },
        {
          id: "npc2",
          sprite: npcSprite2,
          walkingAnimationMapping: 3,
          startPosition: {x: 5, y: 10},
          speed: 2,
        },
      ],
      numberOfDirections: 8
    };

    this.gridEngine.create(cloudCityTilemap, gridEngineConfig);
    this.gridEngine.follow('npc0', 'player', 2, true);
    this.gridEngine.follow('npc1', 'player', 1, true);
    this.gridEngine.follow('npc2', 'player', 0, true);
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
  }
</script>

## The Code

```javascript
// Your game config
const game = new Phaser.Game(config);

function preload() {
  this.load.image("tiles", "assets/cloud_tileset.png");
  this.load.tilemapTiledJSON("cloud-city-map", "assets/cloud_city_large.json");
  this.load.spritesheet("player", "assets/characters.png", {
    frameWidth: 52,
    frameHeight: 72,
  });
}

function create() {
  const cloudCityTilemap = this.make.tilemap({ key: "cloud-city-map" });
  cloudCityTilemap.addTilesetImage("cloud_tileset", "tiles");
  for (let i = 0; i < cloudCityTilemap.layers.length; i++) {
    const layer = cloudCityTilemap.createLayer(i, "cloud_tileset", 0, 0);
    layer.scale = 3;
  }
  const playerSprite = this.add.sprite(0, 0, "player");
  playerSprite.scale = 1.5;
  this.cameras.main.startFollow(playerSprite, true);
  this.cameras.main.setFollowOffset(-playerSprite.width, -playerSprite.height);

  const npcSprite = this.add.sprite(0, 0, "player");
  npcSprite.scale = 1.5;

  const npcSprite1 = this.add.sprite(0, 0, "player");
  npcSprite1.scale = 1.5;

  const npcSprite2 = this.add.sprite(0, 0, "player");
  npcSprite2.scale = 1.5;

  const gridEngineConfig = {
    characters: [
      {
        id: "player",
        sprite: playerSprite,
        walkingAnimationMapping: 6,
        startPosition: { x: 8, y: 8 },
      },
      {
        id: "npc0",
        sprite: npcSprite,
        walkingAnimationMapping: 0,
        startPosition: { x: 12, y: 5 },
        speed: 3,
      },
      {
        id: "npc1",
        sprite: npcSprite1,
        walkingAnimationMapping: 1,
        startPosition: { x: 14, y: 8 },
      },
      {
        id: "npc2",
        sprite: npcSprite2,
        walkingAnimationMapping: 3,
        startPosition: { x: 5, y: 10 },
        speed: 2,
      },
    ],
    numberOfDirections: 8,
  };

  this.gridEngine.create(cloudCityTilemap, gridEngineConfig);
  this.gridEngine.follow("npc0", "player", 2, true);
  this.gridEngine.follow("npc1", "player", 1, true);
  this.gridEngine.follow("npc2", "player", 0, true);
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
}
```
