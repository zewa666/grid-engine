---
sidebar_title: 'GridEngineConfig'
sidebar_position: 1
---

# GridEngineConfig

Grid Engine accepts an Object for configuration. This is usually through the `GridEngineConfig` interface. Here you'll find properties of `GridEngineConfig` and a description as well.

## Properties

### `characters: CharacterData[]`

An array containing `CharacterData` Objects. Each Object contains information and properties regarding players registered into Grid Engine. See [CharacterData](/api/characterdata).

<div class="separator"></div>

### `collisionTilePropertyName: string`

<span class="badge badge--info badge--bm">Optional</span> <span class="badge badge--primary badge--bm">Default: 'ge_collide'</span>

This can be set to change the default collision tile property name from `ge_collide` to whatever you wish.

<div class="separator"></div>

### `numberOfDirections: number`

<div class="alert alert--danger badge--bm" role="alert">
    Setting this config to any value other than 4 or 8 will break the plugin.
</div>

<span class="badge badge--info badge--bm">Optional</span> <span class="badge badge--primary badge--bm">Default: 4</span>

The possible number of directions for moving a character. Default is 4 (up, down, left, right). If set to 8 it additionaly enables diagonal movement (up-left, up-right, down-left, down-right). Any value other than 4 or 8 will break the plugin.