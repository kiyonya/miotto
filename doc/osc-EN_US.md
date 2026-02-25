### Miotto OSC
Miotto supports using the OSC protocol to control the software, including playing audio, previous/next track, volume adjustment, etc.

The following is the Miotto OSC routing documentation

## Server
1. /player/pause
Pause audio playback, accepts no parameters
``` python
    from pythonosc import udp_client
    client = udp_client.SimpleUDPClient("127.0.0.1", 15051)
    # Pause audio playback
    client.send_message('/player/pause','')
```
Note: This operation will not execute when no audio is currently playing

2. /player/play
Start audio playback, accepts no parameters
For example:
``` python
    from pythonosc import udp_client
    client = udp_client.SimpleUDPClient("127.0.0.1", 15051)
    client.send_message('/player/play','')
```

3. /player/play/track
Play a track, defaults to inserting and playing immediately
Accepts trackId parameter
In Miotto, trackId is used to identify an audio track. TrackId is a general term, currently available in three formats:

- IBiliTrackId Bilibili audio
- INCMTrackId NetEase Cloud Music audio
- ILocalTrackId Local audio

Their type definitions are as follows:
``` typescript
interface IBiliTrackId {
        id: string, //Bilibili BV number, String type
        platform: 'bili'
    }

interface INCMTrackId {
        id: number, //NetEase Cloud Music ID, Int type
        platform: 'ncm'
    }

interface ILocalTrackId {
        id: string, //MD5 hash digest of local music
        platform: 'local',
        file:string //Local music file path (only for local audio)
    }

```
Parameters:
You need to write the audio to be played according to one of the three trackId types above, serialize it into a JSON string, then encode it using Base64, and pass it as the first parameter of the route

For example:
``` python
    from pythonosc import udp_client
    client = udp_client.SimpleUDPClient("127.0.0.1", 15051)

    # Serialized string
    # '{"id":1235541,"platform":"ncm"}'
    # Base64 encoded
    # 'eyJpZCI6MTIzNTU0MSwicGxhdGZvcm0iOiJuY20ifQ=='

    client.send_message('/player/play/track',
    'eyJpZCI6MTIzNTU0MSwicGxhdGZvcm0iOiJuY20ifQ==')
```
You should then be able to control the player to play your desired song. If you're using the OSC protocol to interface with an MCP server suitable for AI, this should be very useful!

4. Play Playlist
Route: /player/play/playlist
This interface is relatively complex, please read carefully

In Miotto, playlists are divided into two types: NetEase Cloud Music playlists imported from the cloud, and mixed playlists that allow users to import local music, Bilibili audio, and NetEase Cloud Music audio

For NetEase Cloud Music playlists, it's relatively simple as each playlist has its own ID
For mixed playlists, Miotto stores them in IndexDB, assigning each playlist a unique UUID as an identifier

This route interface accepts parameters in the following format:
``` typescript
interface OSCPlaylistFormat {
    type:"custom" | "ncm",
    id:number | string，
    start?:AppTypes.ITrackId 
}
```
If it's a NetEase Cloud Music playlist, ensure type is "ncm" and id is the NetEase Cloud Music playlist ID
If it's a mixed playlist, ensure type is "custom" and id is the UUID
The start parameter is optional, specifying which track in the playlist to start playing from. You need to pass a trackId, represented here as AppTypes.ITrackId, which, as before, comes in three types:

- IBiliTrackId Bilibili audio
- INCMTrackId NetEase Cloud Music audio
- ILocalTrackId Local audio

**If start is not provided, playback will start from the first track by default**
Next, you need to serialize the above format into a JSON string and encode it with Base64, which is very easy to do.