$(document).ready(function () {

    // Add scrollspy to <body>
    $('body').scrollspy({
        target: ".navbar",
        offset: 50
    });

    // Add smooth scrolling on all links inside the navbar
    $("#myNavbar a").on('click', function (event) {
        // Make sure this.hash has a value before overriding default behavior
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();

            // Store hash
            var hash = this.hash;

            // Using jQuery's animate() method to add smooth page scroll
            // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 250, function () {

                // Add hash (#) to URL when done scrolling (default click behavior)
                window.location.hash = hash;
            });
        } // End if
    });
});

var socket = io();

socket.on("connect", function () {
    console.log("connected to socket.io");
});

socket.on("disconnect", function () {
    console.log("disconnected from socket.io");
});

socket.on("reconnect", function () {
    console.log("reconnected to socket.io");
});


function fullPila() {
    socket.emit("fullPila");
}

function halfPila() {
    socket.emit("halfPila");
}

socket.on("pilaRequest", function (data) {
    if (data.success === true) {

    } else {
        alert("No se pudo comunicar con el equipo. Verifique conexión.");
    }
});

socket.on("newLevel", function (levels) {

    var pilaHeight = 50;
    var raincubeHeight = 90;
    var correccionPila  = levels.pila - 35;
    var pilaWaterHeight = pilaHeight - correccionPila;
    var raincubeWaterHeight = raincubeHeight - levels.raincube;

    var pilaFirstStep = pilaWaterHeight * 100;
    var pilaPercentage = pilaFirstStep / pilaHeight;

    var raincubeFirstStep = raincubeWaterHeight * 100;
    var raincubePercentage = raincubeFirstStep / raincubeHeight;

    if (pilaPercentage < 0) {
        pilaPercentage = 0
    }

    if (raincubePercentage < 0) {
        raincubePercentage = 0
    }

    if (pilaPercentage < 10) {
        $("#pilaBar").addClass("progress-bar-danger");

    } else {
        $("#pilaBar").removeClass("progress-bar-danger");
    }

    if (raincubePercentage < 10) {
        $("#raincubeBar").addClass("progress-bar-danger");
    } else {
        $("#raincubeBar").removeClass("progress-bar-danger");
    }

    if (raincubePercentage > 100) {
        raincubePercentage = 100
    }

    if (pilaPercentage > 100) {
        pilaPercentage = 100
    }

    var noDecimalasRaincubePercentage = Number(raincubePercentage).toFixed(0);
    var noDecimalsPilaPercentage = Number(pilaPercentage).toFixed(0);

    $("#raincubeBar").css('width', noDecimalasRaincubePercentage + '%').attr('aria-valuenow', noDecimalasRaincubePercentage);
    $("#pilaBar").css('width', noDecimalsPilaPercentage + '%').attr('aria-valuenow', noDecimalsPilaPercentage);

    $("#raincubeBar").text(noDecimalasRaincubePercentage + " %");
    $("#pilaBar").text(noDecimalsPilaPercentage + " %");

});
