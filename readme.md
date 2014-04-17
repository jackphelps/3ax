3ax
=======================
* 3ax.co
* http://github.com/jackphelps/3ax
* Author: Jack Phelps
* License: coming soon, see below

3ax is a simple API that makes smartphone inputs -- such as accelerometer motion -- available to 3rd party applications. Developers can build browser games or interactive apps that can easily be controlled by the user's phone. 

How it should work
=======================
* users can go to a simple, unique url in their smartphone browser, e.g. `http://3ax.co/abcd1234`
* they will see a simple control interface
* JSON feed is available in JSON at a URL such as `http://3ax.co/{api-key}/action/abcd1234`
* data may be accessed via API, e.g. `http://3ax.co/get/abcd1234`
* game possibilities: flying, swordfighting, music, 

Rough API
=======================
route                         | description (response) 
------------------------------|--------------------------
/{api-key}/key/get/{id}       | get a snapshot of the data (JSON device data)
/{api-key}/watch/{id}         | data continually updated via websockets (JSON device data)
/{api-key}/vibrate/{id}       | if available causes user's device to vibrate (true)
/{api-key}/create/{int}       | create a new controller of type {int} (ID of controller)
/{api-key}/delete             | delete a controller created by your API api-key (delete controller at ID)

JSON format
=======================
* Connected: boolean
* Axes: 
* Buttons:

For the future
=======================
* Custom controller interfaces
* Custom controller vibration effects
* Smoothing options to improve responsiveness (refresh primarily at motion start/end, smooth away minor wobbles)
* Find a way to p2p the data? Doesn't look easy...
* Touch gesture controls, e.g. scrolling

License
=======================
I will probably release this under an MIT license, but haven't yet attached that any other license to it, so it's currently all rights reserved (sorry!). Please feel free to ask me if you have any questions or want to discuss this. 