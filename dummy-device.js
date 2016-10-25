var net = require('net');
var id = process.env.DEVICE_ID || "001"
var local = process.env.LOCAL || true
var socket;

if (local === true) {
     socket = net.connect(3150);
} else {
    socket = net.connect(3150, "raincube-garden.us-west-2.elasticbeanstalk.com");
}

socket.on("connect", function (data) {
    console.log("Client: -> " + "id=" + id + "&r=0& (connect)");
    socket.write("id=" + id + "&r=0&");
});

socket.on("data", function (data) {
    var dataString = data.toString();
    console.log("Server: -> " + dataString);
});

setInterval(function () {
    var randomValue = (Math.random() * (90 - 10) + 10).toFixed(0);
    console.log("Client: -> " + "id=" + id + "&r="+ randomValue + "& (Sending Random Values)");
    socket.write("id=" + id + "&r="+ randomValue + "&");
}, 10000);
