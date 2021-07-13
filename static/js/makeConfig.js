function makeConfig(preload, create, update, GridEngine) {
    return {
      title: "GridEngineExample",
      pixelArt: true,
      type: Phaser.AUTO,
      plugins: {
        scene: [
          {
            key: "GridEngine",
            plugin: GridEngine,
            mapping: "GridEngine",
          },
        ],
      },
      scale: {
        width: 720,
        height: 528,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
  
      parent: "game",
      backgroundColor: "#48C4F8",
    };
  }
  