var socket = io();
var spinner;
var INSTALL_ID = "FL0001"
var DEVICE_ID = "001"

$(document).ready(function () {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {} else {
        $('[data-toggle="tooltip"]').tooltip();
    }

    var opts = {
        lines: 13,
        length: 15,
        width: 8,
        radius: 15,
        scale: 1,
        corners: 1,
        color: '#000',
        opacity: 0.25,
        rotate: 0,
        direction: 1,
        speed: 1,
        trail: 60,
        fps: 20,
        zIndex: 2e9,
        className: 'spinner',
        top: '50%',
        left: '50%',
        shadow: false,
        hwaccel: false,
        position: 'absolute'
    }
    var target = document.getElementById('main-background');
    spinner = new Spinner(opts).spin(target);
    socket.emit("dashboard", {
        installID: INSTALL_ID
    });

});

socket.on("connect", function () {
    console.log("connected to socket.io");
    socket.emit("subToDevice", {
        deviceID: DEVICE_ID
    })
});

socket.on("disconnect", function () {
    console.log("disconnected from socket.io");
});

socket.on("reconnect", function () {
    console.log("reconnected to socket.io");
});

//This is how we get the dashboard info
socket.on("dashboardResult", function (data) {
    spinner.stop();
    console.log(data);
    $("#raincubeLevelBar").css('width', data.raincube_level + '%');
    $("#raincubeLevelBar").text(data.raincube_level + " %");
    if(data.raincube_level < 10) {
        $("#raincubeLevelBar").addClass("progress-bar-danger");
        if (data.raincube_level < 3) {
            $("#raincubeLevelBar").text("");
        }
    } else {
        $("#raincubeLevelBar").removeClass("progress-bar-danger");
    }
});


socket.on("newLevel", function(data){

    if (data.raincube_level < 10) {
        $("#raincubeLevelBar").addClass("progress-bar-danger");
    } else {
        $("#raincubeLevelBar").removeClass("progress-bar-danger");
    }

    $("#raincubeLevelBar").css('width', data.raincube_level + '%').attr('aria-valuenow', data.raincube_level);
    $("#raincubeLevelBar").text(data.raincube_level + " %");
})
function manualOpen(zone) {
    socket.once("openValveResult", function (data) {
        if (data.success !== true) {
            alert(data.errorMessage || "Error");
        }
    });

    socket.emit("openValve", {
        zone: zone,
        installID: INSTALL_ID
    });
}

function manualClose(zone) {

    socket.once("closeValveResult", function (data) {
        if (data.success !== true) {
            alert(data.errorMessage || "Error");
        }
    });
    socket.emit("closeValve", {
        zone: zone,
        installID: INSTALL_ID
    });
}

function setLength(length, zone) {
    socket.emit("updateLength", {
        zone: zone,
        length: length,
        installID: INSTALL_ID
    });
}

function setTime(time, zone) {
    socket.emit("updateTime", {
        zone: zone,
        length: length,
        installID: INSTALL_ID
    });
}
