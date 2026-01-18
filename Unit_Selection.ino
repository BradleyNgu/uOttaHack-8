// --- PIN DEFINITIONS ---
// Buttons (Pins 2-7)
int buttPinYellowCivilian = 2;
int buttPinRedPatrol   = 3;
int buttPinGreenMine  = 4;
int buttPinRedAir   = 5;
int buttPinWhiteSupport  = 6;
int buttPinBlueIcebreaker   = 7;

// LEDs (Pins 8-13)
int ledPinYellowCivilian = 8;
int ledPinRedPatrol   = 9;
int ledPinGreenMine  = 10;
int ledPinRedAir   = 11;
int ledPinWhiteSupport  = 12;
int ledPinBlueIcebreaker   = 13;

// --- VARIABLES ---
// Current State
int buttValYellowCiv = 1, buttValRedPatrol = 1, buttValGreenMine = 1;
int buttValRedAir = 1,   buttValWhiteSupport = 1, buttValBlueIce = 1;

// Old State (for tracking presses)
int buttOldYellowCiv = 1, buttOldRedPatrol = 1, buttOldGreenMine = 1;
int buttOldRedAir = 1,   buttOldWhiteSupport = 1, buttOldBlueIce = 1;


void setup() {
  Serial.begin(115200);

  // Initialize LED Pins
  pinMode(ledPinYellowCivilian, OUTPUT);
  pinMode(ledPinRedPatrol, OUTPUT);
  pinMode(ledPinGreenMine, OUTPUT);
  pinMode(ledPinRedAir, OUTPUT);
  pinMode(ledPinWhiteSupport, OUTPUT);
  pinMode(ledPinBlueIcebreaker, OUTPUT);

  // Initialize Button Pins
  pinMode(buttPinYellowCivilian, INPUT_PULLUP);
  pinMode(buttPinRedPatrol, INPUT_PULLUP);
  pinMode(buttPinGreenMine, INPUT_PULLUP);
  pinMode(buttPinRedAir, INPUT_PULLUP);
  pinMode(buttPinWhiteSupport, INPUT_PULLUP);
  pinMode(buttPinBlueIcebreaker, INPUT_PULLUP);
}

void loop() {
  // 1. Read All Buttons
  buttValYellowCiv = digitalRead(buttPinYellowCivilian);
  buttValRedPatrol   = digitalRead(buttPinRedPatrol);
  buttValGreenMine  = digitalRead(buttPinGreenMine);
  buttValRedAir   = digitalRead(buttPinRedAir);
  buttValWhiteSupport  = digitalRead(buttPinWhiteSupport);
  buttValBlueIce   = digitalRead(buttPinBlueIcebreaker);


  // ---------------- YELLOW BUTTON CIV (Pin 2 -> LED 8) ----------------
  if (buttValYellowCiv == 0 && buttOldYellowCiv == 1) {
    digitalWrite(ledPinYellowCivilian, HIGH);
    digitalWrite(ledPinRedPatrol, LOW);
    digitalWrite(ledPinGreenMine, LOW);
    digitalWrite(ledPinRedAir, LOW);
    digitalWrite(ledPinWhiteSupport, LOW);
    digitalWrite(ledPinBlueIcebreaker, LOW);
    Serial.println("Yellow Pressed");
  }

  // ---------------- RED PATROL BUTTON (Pin 3 -> LED 9) ----------------
  if (buttValRedPatrol == 0 && buttOldRedPatrol == 1) {
    digitalWrite(ledPinYellowCivilian, LOW);
    digitalWrite(ledPinRedPatrol, HIGH);
    digitalWrite(ledPinGreenMine, LOW);
    digitalWrite(ledPinRedAir, LOW);
    digitalWrite(ledPinWhiteSupport, LOW);
    digitalWrite(ledPinBlueIcebreaker, LOW);
    Serial.println("Red 1 Pressed");
  }

  // ---------------- GREEN BUTTON MINING (Pin 4 -> LED 10) ----------------
  if (buttValGreenMine == 0 && buttOldGreenMine == 1) {
    digitalWrite(ledPinYellowCivilian, LOW);
    digitalWrite(ledPinRedPatrol, LOW);
    digitalWrite(ledPinGreenMine, HIGH);
    digitalWrite(ledPinRedAir, LOW);
    digitalWrite(ledPinWhiteSupport, LOW);
    digitalWrite(ledPinBlueIcebreaker, LOW);
    Serial.println("Green Pressed");
  }

  // ---------------- RED BUTTON AIR(Pin 5 -> LED 11) ----------------
  if (buttValRedAir == 0 && buttOldRedAir == 1) {
    digitalWrite(ledPinYellowCivilian, LOW);
    digitalWrite(ledPinRedPatrol, LOW);
    digitalWrite(ledPinGreenMine, LOW);
    digitalWrite(ledPinRedAir, HIGH);
    digitalWrite(ledPinWhiteSupport, LOW);
    digitalWrite(ledPinBlueIcebreaker, LOW);
    Serial.println("Red 2 Pressed");
  }

  // ---------------- WHITE BUTTON (Pin 6 -> LED 12) ----------------
  if (buttValWhiteSupport == 0 && buttOldWhiteSupport == 1) {
    digitalWrite(ledPinYellowCivilian, LOW);
    digitalWrite(ledPinRedPatrol, LOW);
    digitalWrite(ledPinGreenMine, LOW);
    digitalWrite(ledPinRedAir, LOW);
    digitalWrite(ledPinWhiteSupport, HIGH);
    digitalWrite(ledPinBlueIcebreaker, LOW);
    Serial.println("White Pressed");
  }

  // ---------------- BLUE BUTTON IceBreaker (Pin 7 -> LED 13) ----------------
  if (buttValBlueIce == 0 && buttOldBlueIce == 1) {
    digitalWrite(ledPinYellowCivilian, LOW);
    digitalWrite(ledPinRedPatrol, LOW);
    digitalWrite(ledPinGreenMine, LOW);
    digitalWrite(ledPinRedAir, LOW);
    digitalWrite(ledPinWhiteSupport, LOW);
    digitalWrite(ledPinBlueIcebreaker, HIGH);
    Serial.println("Blue Pressed");
  }

  // Update Old Values
  buttOldYellowCiv = buttValYellowCiv;
  buttOldRedPatrol   = buttValRedPatrol;
  buttOldGreenMine  = buttValGreenMine;
  buttOldRedAir   = buttValRedAir;
  buttOldWhiteSupport  = buttValWhiteSupport;
  buttOldBlueIce  = buttValBlueIce;

  delay(10);
}