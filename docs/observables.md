---
sidebar_label: 'Observables'
sidebar_position: 3
---

# 👀 Observables

A list of Grid Engine methods that return [Observables](https://www.stackchief.com/tutorials/JavaScript%20Observables%20in%205%20Minutes), allowing you to "subscribe" to or "watch" for certain events.

### `movementStarted(): Observable<{charId: string, direction: Direction}>`

Returns an Observable that, on each start of a movement, will provide the character's [`id`](/api/characterdata#id-string) as `charId` and [`Direction`](/api/direction) as `direction`.

<div class="separator"></div>

### `movementStopped(): Observable<{charId: string, direction: Direction}>`

Returns an Observable that, at the end of a movement, will provide the character's [`id`](/api/characterdata#id-string) as `charId` and [`Direction`](/api/direction) as `direction`.

<div class="separator"></div>

### `directionChanged(): Observable<{charId: string, direction: Direction}>`

Returns an Observable that will notify about every change of direction that is not part of a movement. This is the case if the character tries to walk towards a blocked tile. The character will turn but not move. Provides the character's [`id`](/api/characterdata#id-string) as `charId` and [`Direction`](/api/direction) as `direction`.

<div class="separator"></div>

### `positionChangeStarted(): Observable<{charId: string, exitTile: Position, enterTile: Position}>`

Returns an Observable that will notify about every change of tile position. It will notify at the **beginning** of the movement. Provides the character's [`id`](/api/characterdata#id-string) as `charId` and the `exitTile` and `enterTile` as [`Position`](/api/position).

<div class="separator"></div>

### `positionChangeFinished(): Observable<{charId: string, exitTile: Position, enterTile: Position}>`

Returns an Observable that will notify about every change of tile position. It will notify at the **end** of the movement. Provides the character's [`id`](/api/characterdata#id-string) as `charId` and the `exitTile` and `enterTile` as [`Position`](/api/position).