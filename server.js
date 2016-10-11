//Amazon Web Services
var AWS = require("aws-sdk");
//Express server
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var net = require('net');
var mensajesMonitor = [];
app.use(express.static('public'));

//VARIABLES PARA TCP.
var TCP_PORT = process.env.TCP_PORT || 3150;
var HTTP_PORT = process.env.PORT || 8080;
var connections_number = 0;
//LIBRERIAS PARA TCP
var querystring = require('querystring');
var deviceConnections = {};

//AWS & DynamoDB
AWS.config.update({
    region: "us-west-2",
});

var docClient = new AWS.DynamoDB.DocumentClient();

//Dashboards
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/dashboard.html');
});

//MONITOR DE CONEXIONES.
app.get('/monitor', function (req, res) {
    res.sendFile(__dirname + '/views/monitor.html');
});

//404
app.get('*', function (req, res) {
    res.status(404).sendFile(__dirname + '/views/404.html');
});
//Socket.io Service
io.on("connection", function (socket) {
    console.log("New socket.io client connected");
    socket.emit("connectionsUpdated", {
        "cantidad": connections_number
    });
    io.emit("newDatafromTCP", {
        "data": mensajesMonitor
    });

    socket.on("dashboard", function (data) {
        console.log("querying for dashboard.", data);

        var params = {
            TableName: 'raincube_garden_settings',
            KeyConditionExpression: 'install_id = :install_id',
            ExpressionAttributeValues: {
                ':install_id': data.installID
            },
        };

        docClient.query(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", err);
                socket.emit("dashboardResult", err);
            } else {
                console.log("Query succeeded.");
                socket.emit("dashboardResult", data.Items[0]);
            }
        });
    });

    socket.on("openValve", function (userData) {
        console.log("openValve: ", userData);
        var params = {
            TableName: 'raincube_garden_settings',
            KeyConditionExpression: 'install_id = :install_id',
            ExpressionAttributeValues: {
                ':install_id': userData.installID
            },
        };

        docClient.query(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", err);
                socket.emit("dashboardResult", err);
            } else {
                console.log("Query succeeded.", data.Items[0]);
                var installationInfo = data.Items[0];

                try {
                    deviceConnections[installationInfo.device_id].write("0" + userData.zone + "OP" + "00");
                    socket.emit("openValveResult", {
                        success: true
                    });
                } catch (e) {
                    console.log("error foo!");
                    socket.emit("openValveResult", {
                        success: false,
                        errorMessage: "The device is not connected. Unable to complete the action."
                    });
                }
            }
        });
    });

    socket.on("closeValve", function (userData) {
        console.log("closeValve: ", userData);
        var params = {
            TableName: 'raincube_garden_settings',
            KeyConditionExpression: 'install_id = :install_id',
            ExpressionAttributeValues: {
                ':install_id': userData.installID
            },
        };

        docClient.query(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", err);
                socket.emit("dashboardResult", err);
            } else {
                console.log("Query succeeded.", data.Items[0]);
                var installationInfo = data.Items[0];

                try {
                    deviceConnections[installationInfo.device_id].write("0" + userData.zone + "CL" + "00");
                    socket.emit("openValveResult", {
                        success: true
                    });
                } catch (e) {
                    console.log("error foo!");
                    socket.emit("closeValveResult", {
                        success: false,
                        errorMessage: "The device is not connected. Unable to complete the action."
                    });
                }
            }
        });

    });

});

function newMonitorInfo(newString) {

    if (mensajesMonitor.length === 20) {
        mensajesMonitor.shift();
    }

    var fecha = new Date().getTime();

    var contenido = {
        fechaObjeto: fecha,
        contenido: newString
    }

    mensajesMonitor.push(contenido);

    io.emit("newDatafromTCP", {
        "data": mensajesMonitor
    });
}
//TCP server
net.createServer(function (connection) {
    connections_number++
    io.emit("connectionsUpdated", {
        "cantidad": connections_number
    });

    newMonitorInfo("NEW CONNECTION");

    connection.on('data', function (data) {
        //Converting buffer data to String
        var data_str = data.toString();
        //dump all carrier return
        data_str = data_str.replace('\r\n', '');
        newMonitorInfo(data_str);
        //CONVIRTIENDO DATA DE STRING A JSON.
        var telemetry_data = querystring.parse(data_str);

        if (telemetry_data.id == undefined || telemetry_data.r == undefined) {
            //If the keys have undefined data, do nothing.
            console.log("undefined data");
            return;
        } else {
            console.log("New Good DATA");
            //Verify if it's a new connection or if it exists
            if (typeof deviceConnections[telemetry_data.id] === "undefined") {
                //if the connection is not on in the object, Add it to the deviceConnections object.
                deviceConnections[telemetry_data.id] = connection;
            } else {
                //If there is a connection with the same ID in the object, check if it is the same as this one.
                //If it is different close and destroy the previous one, and replace it with the new one.
                //Else do nothing.
                console.log("existing key")
                if (deviceConnections[telemetry_data.id] !== connection) {
                    console.log("different connection value")
                    deviceConnections[telemetry_data.id].destroy();
                    deviceConnections[telemetry_data.id] = connection;
                } else {
                    console.log("same connection value");
                }
            }

            //ADD THE DATA TO THE SETTINGS.

        }
    });

    connection.on('close', function () {
        connections_number--;
        newMonitorInfo("DEVICE DISCONNECTED");
        io.emit("connectionsUpdated", {
            "cantidad": connections_number
        });
    });

}).listen(TCP_PORT, function () {
    console.log('TCP Server listening 😎');
});

http.listen(HTTP_PORT, function () {
    console.log("Web Server Started 😎");
});

process.on("uncaughtException", function (err) {
    console.log("uncaughtException", err);
});
