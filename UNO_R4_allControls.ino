/* Song of storms - Legend of Zelda 
  Fixed for "Multitasking" (Buttons work while music plays)
*/

#define NOTE_B0  31
#define NOTE_C1  33
#define NOTE_CS1 35
#define NOTE_D1  37
#define NOTE_DS1 39
#define NOTE_E1  41
#define NOTE_F1  44
#define NOTE_FS1 46
#define NOTE_G1  49
#define NOTE_GS1 52
#define NOTE_A1  55
#define NOTE_AS1 58
#define NOTE_B1  62
#define NOTE_C2  65
#define NOTE_CS2 69
#define NOTE_D2  73
#define NOTE_DS2 78
#define NOTE_E2  82
#define NOTE_F2  87
#define NOTE_FS2 93
#define NOTE_G2  98
#define NOTE_GS2 104
#define NOTE_A2  110
#define NOTE_AS2 117
#define NOTE_B2  123
#define NOTE_C3  131
#define NOTE_CS3 139
#define NOTE_D3  147
#define NOTE_DS3 156
#define NOTE_E3  165
#define NOTE_F3  175
#define NOTE_FS3 185
#define NOTE_G3  196
#define NOTE_GS3 208
#define NOTE_A3  220
#define NOTE_AS3 233
#define NOTE_B3  247
#define NOTE_C4  262
#define NOTE_CS4 277
#define NOTE_D4  294
#define NOTE_DS4 311
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_FS4 370
#define NOTE_G4  392
#define NOTE_GS4 415
#define NOTE_A4  440
#define NOTE_AS4 466
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_CS5 554
#define NOTE_D5  587
#define NOTE_DS5 622
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_FS5 740
#define NOTE_G5  784
#define NOTE_GS5 831
#define NOTE_A5  880
#define NOTE_AS5 932
#define NOTE_B5  988
#define NOTE_C6  1047
#define NOTE_CS6 1109
#define NOTE_D6  1175
#define NOTE_DS6 1245
#define NOTE_E6  1319
#define NOTE_F6  1397
#define NOTE_FS6 1480
#define NOTE_G6  1568
#define NOTE_GS6 1661
#define NOTE_A6  1760
#define NOTE_AS6 1865
#define NOTE_B6  1976
#define NOTE_C7  2093
#define NOTE_CS7 2217
#define NOTE_D7  2349
#define NOTE_DS7 2489
#define NOTE_E7  2637
#define NOTE_F7  2794
#define NOTE_FS7 2960
#define NOTE_G7  3136
#define NOTE_GS7 3322
#define NOTE_A7  3520
#define NOTE_AS7 3729
#define NOTE_B7  3951
#define NOTE_C8  4186
#define NOTE_CS8 4435
#define NOTE_D8  4699
#define NOTE_DS8 4978
#define REST      0

int tempo = 108;
int buzzer = 7;

int melody[] = {
  NOTE_D4,4, NOTE_A4,4, NOTE_A4,4,
  REST,8, NOTE_E4,8, NOTE_B4,2,
  NOTE_F4,4, NOTE_C5,4, NOTE_C5,4,
  REST,8, NOTE_E4,8, NOTE_B4,2,
  NOTE_D4,4, NOTE_A4,4, NOTE_A4,4,
  REST,8, NOTE_E4,8, NOTE_B4,2,
  NOTE_F4,4, NOTE_C5,4, NOTE_C5,4,
  REST,8, NOTE_E4,8, NOTE_B4,2,
  NOTE_D4,8, NOTE_F4,8, NOTE_D5,2,
  
  NOTE_D4,8, NOTE_F4,8, NOTE_D5,2,
  NOTE_E5,-4, NOTE_F5,8, NOTE_E5,8, NOTE_E5,8,
  NOTE_E5,8, NOTE_C5,8, NOTE_A4,2,
  NOTE_A4,4, NOTE_D4,4, NOTE_F4,8, NOTE_G4,8,
  NOTE_A4,-2,
  NOTE_A4,4, NOTE_D4,4, NOTE_F4,8, NOTE_G4,8,
  NOTE_E4,-2,
  NOTE_D4,8, NOTE_F4,8, NOTE_D5,2,
  NOTE_D4,8, NOTE_F4,8, NOTE_D5,2,

  NOTE_E5,-4, NOTE_F5,8, NOTE_E5,8, NOTE_E5,8,
  NOTE_E5,8, NOTE_C5,8, NOTE_A4,2,
  NOTE_A4,4, NOTE_D4,4, NOTE_F4,8, NOTE_G4,8,
  NOTE_A4,2, NOTE_A4,4,
  NOTE_D4,1,
};

int notes = sizeof(melody) / sizeof(melody[0]) / 2;
int wholenote = (60000 * 4) / tempo;
int divider = 0, noteDuration = 0;

// --- PIN DEFINITIONS ---
int buttPinR = 2;
int buttPinG = 3;
int buttPinB = 4;

int buttPinYellowCivilian = 8;
int buttPinRedPatrol    = 9;
int buttPinGreenMine   = 10;
int buttPinRedAir    = 11;
int buttPinWhiteSupport   = 12;
int buttPinBlueIcebreaker   = 13;

// --- STATE VARIABLES ---
int buttValR = 1, buttValOldR = 1;
int buttValG = 1, buttValOldG = 1;
int buttValB = 1, buttValOldB = 1;

int buttValYellowCiv = 1, buttOldYellowCiv = 1;
int buttValRedPatrol = 1, buttOldRedPatrol = 1;
int buttValGreenMine = 1, buttOldGreenMine = 1;
int buttValRedAir = 1,    buttOldRedAir = 1;
int buttValWhiteSupport = 1, buttOldWhiteSupport = 1;
int buttValBlueIce = 1,   buttOldBlueIce = 1;

void setup() {
  Serial.begin(115200);

  // Initialize Input Pins
  pinMode(buttPinR, INPUT_PULLUP);
  pinMode(buttPinG, INPUT_PULLUP);
  pinMode(buttPinB, INPUT_PULLUP);

  pinMode(buttPinYellowCivilian, INPUT_PULLUP);
  pinMode(buttPinRedPatrol, INPUT_PULLUP);
  pinMode(buttPinGreenMine, INPUT_PULLUP);
  pinMode(buttPinRedAir, INPUT_PULLUP);
  pinMode(buttPinWhiteSupport, INPUT_PULLUP);
  pinMode(buttPinBlueIcebreaker, INPUT_PULLUP);
}

void loop() {
  // We play the music note by note
  for (int thisNote = 0; thisNote < notes * 2; thisNote = thisNote + 2) {

    // 1. Calculate duration
    divider = melody[thisNote + 1];
    if (divider > 0) {
      noteDuration = (wholenote) / divider;
    } else if (divider < 0) {
      noteDuration = (wholenote) / abs(divider);
      noteDuration *= 1.5; 
    }

    // 2. Start playing the note
    tone(buzzer, melody[thisNote], noteDuration * 0.9);

    // 3. THE FIX: "Smart Delay"
    // Instead of freezing with delay(), we wait in small steps and check buttons constantly!
    smartDelay(noteDuration);

    // 4. Stop note
    noTone(buzzer);
  }
}

// --- NEW FUNCTION: Smart Delay ---
// This waits for the requested time, but KEEPS checking buttons while waiting!
void smartDelay(int waitTime) {
  unsigned long start = millis();
  
  while (millis() - start < waitTime) {
    checkButtons(); // <--- This ensures we never miss a press
    // No delay() needed here, we just loop really fast
  }
}

// --- NEW FUNCTION: Button Logic ---
// I moved all your button checks here so we can call it easily from anywhere
void checkButtons() {
  // Read All Buttons
  buttValR = digitalRead(buttPinR);
  buttValG = digitalRead(buttPinG);
  buttValB = digitalRead(buttPinB);
  
  buttValYellowCiv = digitalRead(buttPinYellowCivilian);
  buttValRedPatrol = digitalRead(buttPinRedPatrol);
  buttValGreenMine = digitalRead(buttPinGreenMine);
  buttValRedAir    = digitalRead(buttPinRedAir);
  buttValWhiteSupport = digitalRead(buttPinWhiteSupport);
  buttValBlueIce   = digitalRead(buttPinBlueIcebreaker);

  // --- LOGIC CHECKS ---
  
  if (buttValR == 0 && buttValOldR == 1) {
    Serial.println("RED (Stop)");
  }

  if (buttValG == 0 && buttValOldG == 1) {
    Serial.println("YES (Start)");
  }

  if (buttValB == 0 && buttValOldB == 1) {
    Serial.println("BBLEK (Reset)");
  }

  if (buttValYellowCiv == 0 && buttOldYellowCiv == 1) {
    Serial.println("Yellow Pressed");
  }

  if (buttValRedPatrol == 0 && buttOldRedPatrol == 1) {
    Serial.println("Red 1 Pressed");
  }

  if (buttValGreenMine == 0 && buttOldGreenMine == 1) {
    Serial.println("Green Pressed");
  }

  if (buttValRedAir == 0 && buttOldRedAir == 1) {
    Serial.println("Red 2 Pressed");
  }

  if (buttValWhiteSupport == 0 && buttOldWhiteSupport == 1) {
    Serial.println("White Pressed");
  }

  if (buttValBlueIce == 0 && buttOldBlueIce == 1) {
    Serial.println("Blue Pressed");
  }

  // Update Old Values
  buttValOldR = buttValR;
  buttValOldG = buttValG;
  buttValOldB = buttValB;
  buttOldYellowCiv = buttValYellowCiv;
  buttOldRedPatrol = buttValRedPatrol;
  buttOldGreenMine = buttValGreenMine;
  buttOldRedAir = buttValRedAir;
  buttOldWhiteSupport = buttValWhiteSupport;
  buttOldBlueIce = buttValBlueIce;
}