3ax
=======================
* 3ax.co
* http://github.com/jackphelps/3ax
* Author: Jack Phelps
* License: coming soon, see below

3ax is a simple API that makes smartphone inputs -- such as accelerometer motion -- available to 3rd party applications. Developers can build browser games or interactive apps that can easily be controlled by the user's phone. 

Actually, right now it's not so much API as example, because I'm not really offering it as a service yet. But if you want to try it out, you can use the example key, and if you want to put some load on it you can just fork it and run it on heroku easily yourself. Get in touch if you 

How it works
=======================
* The client app registers with the server using socket.io, as seen in 3ax-receiver.js 
* The server hands back an input endpoint which will be used to pass device input through the API to the correct client app
* The route `http://3ax.co/:inputID` (e.g. `http://3ax.co/abcd`) provides a "controller" -- a smartphone-optimized page (prevents device sleep, hides navbars) that streams device input up through a socket and over to the watching client app
* Device input currently supports orientation and buttons; acceleration coming soon
* 3ax-receiver.js triggers callbacks on successful registration and the receipt of device input that can be used in the app as desired
* The input endpoint is stored in the client's local browser storage so that reconnection is easy and automatic between sessions
* There is also a RESTful API for creating, listing, and managing streams
* Unused input endpoints will be periodically cleaned up

Performance
=======================
Haven't really profiled performance yet but think it's going to be fairly good (many concurrent connections streaming constant input) given the amount of traffic being poured through the sockets -- stay tuned

Rough API -- not done yet
=======================
route                            | description (response) 
---------------------------------|--------------------------
/{api-key}/controller/{id}       | get a snapshot of the data (JSON device data)
/{api-key}/controller/new/{int}  | create a new controller of type {int} (ID of controller)
/{api-key}/delete                | delete a controller created by your API api-key (delete controller at ID)

For the future
=======================
* Custom controller interfaces
* Smoothing options to improve responsiveness (refresh primarily at motion start/end, smooth away minor wobbles)
* Touch gesture controls, e.g. scrolling
* Custom controller vibration effects (these do not appear to be supported in most mobile browsers)

License
=======================
3ax is provided freely under the MIT license: http://opensource.org/licenses/MIT