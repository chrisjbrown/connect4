# connect4

1. replace your ip in peerConnect.js with your own local 
ip in order to connect across seperate machines on the same network

var pc_config = {"iceServers": [{"url":"turn:172.16.1.46:2013"}]};

2. from root directory. 'node server.js' to run server.

3. in the browser connect to url 'yourIP':2013 on two seperate devices. Your won't be able to play until both users have connected.

4. accepting the option to share camera is optional. but cooler if you do.
