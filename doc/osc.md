### Miotto OSC
miotto 支持使用 OSC 协议对软件进行操控，包括播放音频，上下首，音量调节等

以下为Miotto OSC路由文档

## Client
以下为你可以监听的事件

1. /audio/pause
2. /audio/play
3. /audio/playstate/update
4. /audio/time/update
5. /audio/volume/change
6. /audio/duration
7. /audio/canplay

8. /playing/track/update
9. /playing/track/id/update
10. /playing/song/update
11. /playing/lyric/update

12. /player/play/song
13. /player/playlist/update
14. /player/playmode/update


















## Server
1. /player/pause
暂停音频，不接收参数
``` python
    from pythonosc import udp_client
    client = udp_client.SimpleUDPClient("127.0.0.1", 15051)
    # 暂停音频播放
    client.send_message('/player/pause','')
```
注意:当前没有播放的音频时，该操作不会执行

2. /player/play
开始播放音频，不接受参数
例如:
``` python
    from pythonosc import udp_client
    client = udp_client.SimpleUDPClient("127.0.0.1", 15051)
    client.send_message('/player/play','')
```
3. /player/play/track
播放音轨，默认为插入当前并立即播放
接受参数 trackId 
在miotto使用trackId来标记一首音频，trackId是一个统称，目前有三种格式，分别是

- IBiliTrackId B站音频
- INCMTrackId 云音乐音频
- ILocalTrackId 本地音频
他们的类型标注如下
``` typescript
interface IBiliTrackId {
        id: string, //B站的BV号 为String类型
        platform: 'bili'
    }

interface INCMTrackId {
        id: number, //云音乐Id 为Int类型
        platform: 'ncm'
    }

interface ILocalTrackId {
        id: string, //本地音乐的MD5摘要哈希值
        platform: 'local',
        file:string //本地音乐的音频路径（只有本地音频有这一点）
    }

```
参数：
你需要将需要播放的音频按照如上三种trackId类型书写，并且将其序列化成JSON字符串，之后将其使用Base64进行编码，作为路由的第一个参数传入
例如：
``` python
    from pythonosc import udp_client
    client = udp_client.SimpleUDPClient("127.0.0.1", 15051)

    # 序列化字符串
    # '{"id":1235541,"platform":"ncm"}'
    # Base64编码
    # 'eyJpZCI6MTIzNTU0MSwicGxhdGZvcm0iOiJuY20ifQ=='

    client.send_message('/player/play/track',
    'eyJpZCI6MTIzNTU0MSwicGxhdGZvcm0iOiJuY20ifQ==')
```
之后你应该可以操控播放器播放你想要的歌曲，如果你正在使用osc协议对接适用于AI的MCP服务器，这一点应该很有用！

4. 播放歌单
路由：/player/play/playlist
这个接口相对来说比较复杂，请仔细阅读

在Miotto中，歌单分为两种，一种为从网易云音乐导入的云音乐歌单，还有一种是播单，也就是允许用户导入本地音乐，bilibili音频以及云音乐音频的混合歌单

对于云音乐的歌单相对简单，音乐云音乐的每个歌单拥有自身的id
对于混合歌单，Miotto将其存放在IndexDB中，每个歌单分配一个唯一的uuid作为标识

这个路由接口接收参数的格式如下
``` typescript
interface OSCPlaylistFormat {
    type:"custom" | "ncm",
    id:number | string，
    start?:AppTypes.ITrackId 
}
```
如果你是云音乐的歌单，请确保type为ncm，id为云音乐歌单的id
如果你是混合歌单，请确保type为custom，id为uuid
start参数是一个可选参数，也就是歌单从那首歌开始播放，你需要传入一个trackId 在这里我用AppTypes.ITrackId 来表示,和刚才相同，这个id分为三种

- IBiliTrackId B站音频
- INCMTrackId 云音乐音频
- ILocalTrackId 本地音频

**如果start不被传入，那么将默认从第一首开始播放**
接下来你需要将如上格式进行JSON序列化为字符串，并且进行Base64编码，这很容易。
