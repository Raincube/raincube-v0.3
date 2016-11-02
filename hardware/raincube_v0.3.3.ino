/*
 * 
 * RAINCUBE V0.3
 * SUMMER - FALL 2016
 * RAINCUBE LLC
 * VER V0.3
 * BY CARLOS V.
 * CONT BY GUA DESIGN TEAM
 * 
 * DESCRIPTION:
 * HARDWARE CONTROLS IRRIGATION EQUIPMENT VIA TCP/IP STACK FROM
 * INCOMING COMMANDS, WHILE SENDING SENSOR FEEDBACK IN PRE-DETERMINED
 * TIME INTERVALS.
 * 
 * CIRCUIT:
 * RELAYS (4) CONNECTED VIA PD6, PD7, PB0, PB1
 * ULTRASONIC SENSOR (1) CONNECTED VIA PD4
 * ESP8266 ESP-01 CONNECTED VIA PD2, PD3
 * 
 */

/*
 * LIBRARIES
 * ESP8266.h Arduino library for ESP8266 ESP-01 WiFi module
 * NewPing.h Arduino library for distance sensor
 * SoftwareSerial.h Arduino library defines serial com
 */
#include <doxygen.h>
#include <ESP8266.h>
#include <NewPing.h>
#include <SoftwareSerial.h>

/*
 * CONSTANTS
 * CUBE_PIN     -> input for distance sensor
 * MAX_DISTANCE -> max ping distance (cm) for rangefinder
 * SSID         -> WiFi network name/identifier
 * PASSWORD     -> WiFi network password
 * HOST_NAME    -> server ip
 * HOST_PORT    -> server com port
 */
#define CUBE_PIN 4
#define MAX_DISTANCE 200
#define SSID "network_name"
#define PASSWORD "network_password"
#define HOST_NAME "52.42.73.83"
#define HOST_PORT (3150)

NewPing cubeSonar(CUBE_PIN, CUBE_PIN, MAX_DISTANCE);    // rangefinder ping prototype definition
SoftwareSerial mySerial(2, 3);                          // assign ports for serial com with WiFi module
ESP8266 wifi(mySerial);                                 // PD2 -> RX, PD3 -> TX

unsigned long previousMillis = 0;
const long interval = 10000;

/* 
 *  Function setup
 *  Setup baud rate to 9600 bits per second
 *  Initialize WiFi module with SSID and PASSWORD
 *  Establish TCP connection with HOST_NAME and HOST_PORT
 *  Pre-determine digital pins (PD6, PD7, PB0PB1)
 */
void setup(){

  // Set baud rate
  Serial.begin(9600);

  // Define digital pins
  pinMode(6, OUTPUT);                                   // AC MOTOR
  pinMode(7, OUTPUT);                                   // VALVE #1
  pinMode(8, OUTPUT);                                   // VALVE #2
  pinMode(9, OUTPUT);                                   // VALVE #3

  // Ensure equipment initial shut down status
  motorSwitchOFF();
  valveOneSwitchOFF();
  valveTwoSwitchOFF();
  valveThreeSwitchOFF();
  
  // Join wifi network
  if(wifi.joinAP(SSID, PASSWORD)){
    Serial.print("WIFI NETWORK ACCESS: SUCCESS\n");
  }else{
    Serial.print("WIFI NETWORK ACCESS: FAILED\n");
  }

  // Verify eMUX status
  if(wifi.disableMUX()){
    Serial.print("eMUX STATUS: OK\n");
  }else{
    Serial.print("eMUX STATUS: ER\n");
  }

  // Serial monitor final feedback
  Serial.print("-----------------------\n");
  Serial.print("SETUP PROCESS COMPLETED\n");
  Serial.print("-----------------------\n");

  // Establish TCP connectivity based on given parameters
  disconnectTCPServer();
  connectTCPServer();
}

/*
 * Function loop
 * Loop through all different processes
 * All functions available while powered
 * 
 * Provide feedback to server
 * Upload sensor data in a given timeframe
 * Operate all peripherals only by incoming commands
 */
void loop(){
  
  unsigned long currentMillis = millis();

  // Data upload
  if(currentMillis - previousMillis >= interval){
    previousMillis = currentMillis;
    sendData();
  }
  
  uint8_t buffer[128] = {0};
  uint32_t len = wifi.recv(buffer, sizeof(buffer), 10000);
  
  /*
   * Operate peripherals based on incoming commands
   * Data string size: 6 characters (0 thru 5)
   * Char 0 & 1: zone number
   * Char 2 & 3: open (OP) or close (CL) 
   * Char 4 & 5: irrigation time
   */
  if(len>0){
    Serial.print("DATA RECEIVED\n");
    for (uint32_t i = 0; i<len; i++){
      Serial.print((char)buffer[i]);
    }
    Serial.print("\n");
    if((char)buffer[1] == '1'){
      if((char)buffer[2] == 'O'){
        motorSwitchON();
        valveOneSwitchON();
      }else if((char)buffer[2] == 'C'){
        motorSwitchOFF();
        valveOneSwitchOFF();
      }
    }else if((char)buffer[1] == '2'){
      if((char)buffer[2] == 'O'){
        motorSwitchON();
        valveTwoSwitchON();
      }else if((char)buffer[2] == 'C'){
        motorSwitchOFF();
        valveTwoSwitchOFF();
      }
    }else if((char)buffer[1] == '3'){
      if((char)buffer[2] == 'O'){
        motorSwitchON();
        valveThreeSwitchON();
      }else if((char)buffer[1] == 'C'){
        motorSwitchOFF();
        valveThreeSwitchOFF();
      }
    }
    Serial.print("\n");
  }
}

/*
 * Function connectTCPServer
 * Establish communication with server
 * Provides feedback to serial monitor for troubleshooting
 */
void connectTCPServer(){
  
  Serial.print("TCP SERVER CONNECTION\n");

  if(wifi.createTCP(HOST_NAME, HOST_PORT)){
    Serial.print("CREATE TCP OK!\n");
    delay(500);
  }else{
    Serial.print("ERROR\n");
    delay(500);
  }

  Serial.print("\n");
  
}

/*
 * Function disconnectTCPServer
 * Disconnets from server
 * Provides feedback to serial monitor for troubleshooting
 */
void disconnectTCPServer(){
  
  Serial.print("TCP SERVER DISCONNECTION\n");

  if(wifi.releaseTCP()){
    Serial.print("TCP SERVER DISCONNECTION\n");
    delay(500);
  }else{
    Serial.print("ERROR\n");
    delay(500);
  }
  Serial.print("\n");
  
}

/*
 * Function sendData
 * Uploads sensor data to server
 */
void sendData(){
  
  String temp1 = String(getRaincubeLevel());
  
  String temp3 = "id=001&r=" + temp1 + "&";
  int str_len = temp3.length();
  Serial.print("-");
  Serial.println(temp3);
  char charBuf[50];
  temp3.toCharArray(charBuf, str_len);

  char *dataStream = charBuf;

  wifi.send((const uint8_t*)dataStream, strlen(dataStream));
  
}

/*
 * Function getRaincubeLevel
 * Obtains water level on the cube
 */
unsigned int getRaincubeLevel(){
  
  unsigned int uS = cubeSonar.ping();
  return (uS/US_ROUNDTRIP_CM);
  
}

/*
 * Function motorSwitchON
 * Write HIGH to PD6 to activate pump
 */
void motorSwitchON(){
  
  digitalWrite(6, HIGH);
  
}

/*
 * Function motorSwitchOFF
 * Write LOW to PD6 to deactivate pump
 */
void motorSwitchOFF(){
  
  digitalWrite(6, LOW);
  
}

/*
 * Function valveOneSwitchON
 * Write HIGH to PD7 to activate valve #1
 */
void valveOneSwitchON(){
  
  digitalWrite(7, HIGH);
  
}

/*
 * Function valveOneSwitchOFF
 * Write LOW to PD7 to deactivate valve #1
 */
void valveOneSwitchOFF(){
  
  digitalWrite(7, LOW);
  
}

/*
 * Function valveTwoSwitchON
 * Write HIGH to PB0 to activate valve #2
 */
void valveTwoSwitchON(){
  
  digitalWrite(8, HIGH);
  
}

/*
 * Function valveTwoSwitchOFF
 * Write LOW to PB0 to deactivate valve #2
 */
void valveTwoSwitchOFF(){
  
  digitalWrite(8, LOW);
  
}

/*
 * Function valveThreeSwitchON
 * Write HIGH to PB1 to activate valve #3
 */
void valveThreeSwitchON(){
  
  digitalWrite(9, HIGH);
  
}

/*
 * Function valveThreeSwitchOFF
 * Write LOW to PB1 to deactivate valve #3
 */
void valveThreeSwitchOFF(){
  
  digitalWrite(9, LOW);
  
}
