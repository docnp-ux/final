/*
  ESP32-S3 Solar Tracker — stage 1: LDR sensors only.

  Samples the 4 quadrant LDR sensors locally every SAMPLE_INTERVAL_MS,
  and POSTs one sensor reading — averaged over the window — to the
  Solar Tracker backend every REPORT_INTERVAL_MS. Posting a raw
  reading every few seconds would flood the backend with mostly-noise
  rows (a day of 5s readings is >17,000 rows per device); averaging
  over a longer window on-device keeps the data representative while
  cutting write volume drastically. Uses the same X-Device-API-Key
  auth and /measurements/sensor endpoint the simulator
  (simulate_esp32.py) uses. This is just to prove real device <->
  backend communication — servo control and the INA219 power sensors
  aren't wired in yet, so x_angle/y_angle are sent as a fixed
  placeholder until that code is added.

  Onboard ARGB LED status (WS2812 on GPIO48 — diymore ESP32-S3
  DevKitC-1 N16R8):
    Blue,   0.5s on / 0.5s off  — connecting to WiFi / not connected
    Green,  0.5s on / 4.5s off  — connected, idle
    Purple, 0.5s on / 0.5s off  — sending a reading
    Red,    0.5s on / 0.5s off  — connection error

  Required Arduino libraries (install via Library Manager):
    - ArduinoJson (by Benoit Blanchon)
    - Adafruit NeoPixel (by Adafruit)

  Board: ESP32-S3. Uses ADC1 pins only (GPIO1-10) — ADC2 can't be read
  reliably while WiFi is active on the ESP32/ESP32-S3.
*/

#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

// --- Fill in for your own network/device ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
// Your computer's LAN IP, NOT "localhost" — the ESP32 is a separate
// device on the network. On Windows, run `ipconfig` and use the IPv4
// address of your active adapter; re-check if it changes (e.g. after a
// router restart or reconnecting to a different network).
const char* BACKEND_URL = "http://192.168.1.100:8000";
// From POST /devices (via the frontend's "Register Device" page, as admin).
const char* DEVICE_API_KEY = "PASTE_DEVICE_API_KEY_HERE";

// --- LDR wiring (all ADC1 — safe to read alongside WiFi) ---
const int PIN_LDR_TOP_LEFT = 6;
const int PIN_LDR_TOP_RIGHT = 7;
const int PIN_LDR_BOTTOM_LEFT = 8;
const int PIN_LDR_BOTTOM_RIGHT = 9;

// Reserved for later stages (not used yet):
//   INA219 power sensors (I2C): GPIO4 (SDA), GPIO5 (SCL)
//   Servo PWM (LEDC):           GPIO1, GPIO2

// How often to sample the LDRs locally, and how often to POST the
// averaged reading. Shorten REPORT_INTERVAL_MS while testing (e.g. to
// 30000 for 30s) if you want to see updates faster — set it back to
// the full 5 minutes afterwards so the backend isn't flooded.
const unsigned long SAMPLE_INTERVAL_MS = 5000;
const unsigned long REPORT_INTERVAL_MS = 5UL * 60 * 1000;  // 5 minutes

// --- Onboard ARGB LED ---
// GPIO48 confirmed by this board's own pins_arduino.h (defines PIN_RGB_LED).

const int PIN_ONBOARD_RGB_LED = 48;
Adafruit_NeoPixel rgbLed(1, PIN_ONBOARD_RGB_LED, NEO_GRB + NEO_KHZ800);

enum LedState { LED_CONNECTING, LED_CONNECTED, LED_SENDING, LED_ERROR };
LedState ledState = LED_CONNECTING;
bool ledPhaseOn = false;
unsigned long ledPhaseStartedAt = 0;

struct BlinkPattern {
  unsigned long onMs;
  unsigned long offMs;
  uint8_t r, g, b;
};

BlinkPattern patternFor(LedState state) {
  switch (state) {
    case LED_CONNECTED:
      return {500, 4500, 0, 255, 0};  // green heartbeat
    case LED_SENDING:
      return {500, 500, 160, 0, 160};  // purple blink
    case LED_ERROR:
      return {500, 500, 255, 0, 0};  // red blink
    case LED_CONNECTING:
    default:
      return {500, 500, 0, 0, 255};  // blue blink
  }
}

void setLedState(LedState state) {
  if (state == ledState) return;
  ledState = state;
  ledPhaseOn = false;
  ledPhaseStartedAt = 0;  // force an immediate phase flip on the next update
}

// Advances the blink pattern for the current LED state. Call this often
// (every loop() iteration, and inside any wait loop) — never delay()
// here, or WiFi/HTTP timing stalls along with it.
void updateLed() {
  BlinkPattern pattern = patternFor(ledState);
  unsigned long phaseLength = ledPhaseOn ? pattern.onMs : pattern.offMs;
  if (millis() - ledPhaseStartedAt < phaseLength) return;

  ledPhaseOn = !ledPhaseOn;
  ledPhaseStartedAt = millis();
  if (ledPhaseOn) {
    rgbLed.setPixelColor(0, rgbLed.Color(pattern.r, pattern.g, pattern.b));
  } else {
    rgbLed.setPixelColor(0, 0);
  }
  rgbLed.show();
}

// --- WiFi / networking ---

bool connectToWiFi() {
  setLedState(LED_CONNECTING);
  Serial.printf("Connecting to WiFi \"%s\"...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const unsigned long WIFI_TIMEOUT_MS = 20000;
  unsigned long attemptStartedAt = millis();

  while (WiFi.status() != WL_CONNECTED) {
    updateLed();
    if (millis() - attemptStartedAt > WIFI_TIMEOUT_MS) {
      Serial.println("\nWiFi connection timed out.");
      setLedState(LED_ERROR);
      unsigned long errorShownAt = millis();
      while (millis() - errorShownAt < 3000) updateLed();
      return false;
    }
  }

  Serial.printf("\nConnected. IP address: %s\n", WiFi.localIP().toString().c_str());
  setLedState(LED_CONNECTED);
  return true;
}

// --- LDR sampling / averaging ---

long sumTopLeft = 0, sumTopRight = 0, sumBottomLeft = 0, sumBottomRight = 0;
unsigned int sampleCount = 0;

void sampleLdrs() {
  sumTopLeft += analogRead(PIN_LDR_TOP_LEFT);
  sumTopRight += analogRead(PIN_LDR_TOP_RIGHT);
  sumBottomLeft += analogRead(PIN_LDR_BOTTOM_LEFT);
  sumBottomRight += analogRead(PIN_LDR_BOTTOM_RIGHT);
  sampleCount++;
}

void postAveragedReading() {
  if (sampleCount == 0) return;  // nothing sampled yet this window

  setLedState(LED_SENDING);

  JsonDocument doc;
  doc["ldr_top_left"] = (float)sumTopLeft / sampleCount;
  doc["ldr_top_right"] = (float)sumTopRight / sampleCount;
  doc["ldr_bottom_left"] = (float)sumBottomLeft / sampleCount;
  doc["ldr_bottom_right"] = (float)sumBottomRight / sampleCount;
  // TODO: replace with the real servo position once servo control is wired in.
  doc["x_angle"] = 90.0;
  doc["y_angle"] = 90.0;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/measurements/sensor");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-API-Key", DEVICE_API_KEY);

  int statusCode = http.POST(body);
  if (statusCode >= 200 && statusCode < 300) {
    Serial.printf("POST /measurements/sensor (avg of %u samples) -> %d\n", sampleCount, statusCode);
    Serial.println(http.getString());
    setLedState(LED_CONNECTED);
  } else {
    Serial.printf(
        "POST /measurements/sensor -> %d: %s\n", statusCode, http.errorToString(statusCode).c_str());
    setLedState(LED_ERROR);
  }
  http.end();

  sumTopLeft = sumTopRight = sumBottomLeft = sumBottomRight = 0;
  sampleCount = 0;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);  // 0-4095, matches the ESP32-S3's ADC
  rgbLed.begin();
  rgbLed.show();  // off at boot
  connectToWiFi();
}

unsigned long lastSampleAt = 0;
unsigned long lastReportAt = 0;

void loop() {
  updateLed();

  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  unsigned long now = millis();
  if (now - lastSampleAt >= SAMPLE_INTERVAL_MS) {
    lastSampleAt = now;
    sampleLdrs();
  }
  if (now - lastReportAt >= REPORT_INTERVAL_MS) {
    lastReportAt = now;
    postAveragedReading();
  }
}
