# LunarSocket

Lunar Socket is a Websocket server for Lunar Client.
It allows you to proxy the connection between Lunar Client and Lunar Servers. (To give you cosmetics or emotes for example)

Lunar Client <-> Lunar Socket <-> Lunar Servers

It can intercepts and edit the data in the packets.

# Protocol

You can see Lunar Client protocol detailed [here](https://github.com/Solar-Tweaks/LunarSocket/blob/main/protocol.md)

# Installation

```bash
$ git clone https://github.com/Solar-Tweaks/LunarSocket # Clone repo
$ cd LunarSocket # Go to LunarSocket folder
$ npm install # Install dependencies
```

# Configuration

Open the `config.example.json` file and edit the values
```jsonc
{
  "port": 80, // Port of the server
  "secure": false, // Whether or not to enable SSL (wss protocol)
  "certificates": {
    // Certificates path (only if secure is true)
    "key": "/path/to/key.key",
    "cert": "/path/to/cert.crt"
  }
}
```
Once you have edited the file save it as `config.json` and start the server.

# Start the server

```bash
$ npm start
```