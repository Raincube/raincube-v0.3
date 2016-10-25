var net = require('net');
var socket = net.connect(3150);
var id = "001"
var enviarPesoCore = true;

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
