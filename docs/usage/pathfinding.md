---
sidebar_title: 'Pathfinding'
sidebar_position: 2
---

# Pathfinding

Grid Engine provides various config options for character pathfinding.

## MoveToConfig

As found in the docs for the [`moveTo`](methods#movetoid-string-target-position-config-movetoconfig-void) method, you can pass an Object with the `MoveToConfig` type. Here's what that config looks like.

### Shape
```js
{
  noPathFoundStrategy?: NoPathFoundStrategy,
  pathBlockedStrategy?: PathBlockedStrategy,
  noPathFoundRetryBackoffMs?: number,
  noPathFoundMaxRetries?: number,
  pathBlockedMaxRetries?: number,
  pathBlockedRetryBackoffMs?: number,
  pathBlockedWaitTimeoutMs?: number
}
```

## Strategies

The `MoveToConfig` allows for a couple different "strategies" for when characters can't find a usable path, or a path is blocked. These are handled by the `noPathFoundStrategy` and `pathBlockedStrategy` enums.

<div class="separator"></div>

### `noPathFoundStrategy`

```js
"STOP" | "CLOSEST_REACHABLE" | "RETRY"
```

This strategy determines what happens if no path could be found.

`STOP` will simply stop the pathfinding if no path could be found.

`CLOSEST_REACHABLE` will look for the closest point ([Manhattan distance](https://en.wikipedia.org/wiki/Taxicab_geometry)) to the target position that is reachable.

`RETRY` will try again after `noPathFoundRetryBackoffMs` milliseconds until the maximum amount of retries (`noPathFoundMaxRetries`) has been reached. By default, `noPathFoundMaxRetries` is `-1`, which means that there is no maximum number of retries.

<div class="separator"></div>

### `pathBlockedStrategy`

```js
"WAIT" | "RETRY" | "STOP"
```

This strategy determines what happens if a previously calculated path is suddenly blocked. This can happen if a path existed and while the character was moving along that path it became blocked.

`WAIT` will make the character wait (forever or until given `pathBlockedWaitTimeoutMs`) until the path will be free again.

`RETRY` will make the character look for a new path. You can provide a custom backoff time in milliseconds: `pathBlockedRetryBackoffMs`. You can also specify a maximum number of retries using `pathBlockedMaxRetries`.

`STOP` will make the character stop the movement