---
sidebar_title: 'Height Shift'
sidebar_position: 5
---

# Height Shift

You might have noticed the [layer property](layerproperties) `ge_heightShift` or seen [its demo](/examples/heightshift). Great! Here's a bit deeper of an explanation about how height shifting works.

For characters, their depth depends on the y-coordinate they are on. If the y-coordinate of a character is higher than that of another character, it means that the first character is more "south" on the map and therefore needs a higher depth than the second character.

With tile-layers it becomes more complicated; sometimes you want a layer to be rendered on top of a character, so it's y-coordinate needs to be *greater than or equal to* the tile's y-coordinate. A common example is high grass the character is walking through. You don't want the character to be above *all* grass tiles, but only the ones "north" of the character. This requires that the grass be one layer "above" the character.

This can be done by giving the grass layer a `ge_heightShift` of 1; then the depth of the grass will be the y-coordinate + 1, so it will be rendered on top of the player.

This picture is an example of that solution in application.

<p align="center">
    <img src="/img/helpers/heightShift.png" alt="Example of a height shift." />
</p>