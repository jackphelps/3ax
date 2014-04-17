var express = require('express'),
    app = express(),
    port = 3000;

app.get('/', function(req, res){
    res.sendfile('client/views/index.html');
});
 
app.listen(port);
console.log('Listening on port ' + port);