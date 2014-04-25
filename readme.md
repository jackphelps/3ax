3ax
=======================
* [3ax.co](http://3ax.co)
* http://github.com/jackphelps/3ax
* Author: Jack Phelps

3ax (as in 3-axis) is a simple API that makes smartphone inputs -- such as accelerometer motion -- available to 3rd party applications over web sockets. Developers can build browser games or other applications that can easily be controlled with the user's phone.

Actually, right now it's not so much API as example, because I'm not really offering it as a service yet. But if you want to try it out, you can use the example key (very limited concurrent connections), and if you want to put some load on it you can just fork it and run it on heroku easily yourself. Get in touch if you want to discuss!

How it works
=======================
* The client app registers with the server using socket.io, as seen in 3ax-receiver.js 
* The server hands back a "stream" endpoint which will be used to pass device input through the API to the correct client app
* The route `http://3ax.co/:stream_id` (e.g. `http://3ax.co/abcd`) provides a "controller" -- a smartphone-optimized page (prevents device sleep, hides navbars) that streams device input up through a socket and over to the watching client app
* Device input currently supports orientation and buttons; acceleration coming soon
* 3ax-receiver.js triggers callbacks on successful registration, disconnection, and the receipt of device input that can be used in the app as desired
* The stream endpoint is stored in the client's local browser storage so that reconnection is easy and automatic between sessions
* There is also a RESTful API for creating, listing, and managing streams
* Unused endpoints are periodically cleaned up

Performance
=======================
Haven't really profiled performance yet but think it's going to be fairly good (many concurrent connections streaming constant input) given the amount of traffic being poured through the sockets -- stay tuned

Rough API -- not done yet
=======================
route                                | description (response) 
-------------------------------------|--------------------------
`GET /{api-key}/stream/`             | list all streams created by your API key
`POST /{api-key}/stream/{int}`       | create a new stream of type {int}
`GET /{api-key}/stream/{id}`         | view a stream
`PUT /{api-key}/stream/{id}`         | update a stream
`DELETE /{api-key}/stream/{id}`      | delete a stream

For the future
=======================
* Different/custom controller interfaces
* Smoothing options to improve responsiveness and reduce traffice (refresh primarily at motion start/end, lerp more, smooth minor differences)
* Touch gesture controls, e.g. scrolling
* Custom controller vibration effects (these do not appear to be supported in most mobile browsers)

License
=======================
3ax is provided freely under the MIT license: http://opensource.org/licenses/MIT