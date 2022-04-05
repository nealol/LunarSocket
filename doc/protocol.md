# Overview

| Packet ID | Name           | Bound to |
|-----------|----------------|----------|
| 2         | ConsoleCommand | Server   |
| 3         | Notification   | Client   |
| 4         |                |          |
| 5         |                |          |
| 6         | JoinServer     | Server   |
| 7         |                |          |
| 8         | PlayerInfo     | Client   |
| 9         |                |          |
| 16        |                |          |
| 17        |                |          |
| 18        |                |          |
| 20        | ApplyCosmetics | Server   |
| 21        |                |          |
| 22        |                |          |
| 24        |                |          |
| 25        |                |          |
| 33        |                |          |
| 35        |                |          |
| 36        |                |          |
| 39        | DoEmote        | Server   |
| 40        |                |          |
| 48        |                |          |
| 50        |                |          |
| 51        | PlayEmote      | Client   |
| 52        |                |          |
| 53        |                |          |
| 54        |                |          |
| 55        |                |          |
| 56        | EquipEmote     | Server   |
| 57        | GiveEmotes     | Client   |
| 64        |                |          |
| 65        |                |          |
| 67        |                |          |
| 68        |                |          |
| 69        |                |          |
| 70        |                |          |
| 71        |                |          |
| 72        |                |          |
| 73        |                |          |
| 1056      |                |          |

# Clientbound packets

## Notification - `3`

```js
{
  title: 'string',
  message: 'string'
}
```

## PlayerInfo - `8`

```js
{
  uuid: 'UUID',
  cosmetics: 'Array<{ id: number, equipped: boolean }>',
  color: 'int',
  unknownBooleanA: 'boolean',
  premium: 'boolean',
  clothCloak: 'boolean',
  unknownBooleanC: 'boolean',
  unknownBooleanD: 'boolean',
  unknownHashMap: 'HashMap<int, float>',
  plusColor: 'int'
}
```

## PlayEmote - `51`

```js
{
  uuid: 'UUID',
  id: 'int'
}
```

# Serverbound packets

## ConsoleCommand - `2`

```js
{
  command: 'string'
}
```

## JoinServer - `6`

```js
{
  ip: 'string'
}
```

## ApplyCosmetics - `20`

```js
{
  cosmetics: 'Array<{ id: number, equipped: boolean }>',
  update: 'boolean'
}
```

## DoEmote - `39`

```js
{
  id: 'int'
}
```

## EquipEmotes - `56`

```js
{
  emotes: 'Array<int>'
}
```