# ESP32-S3 Firmware

Real hardware firmware for the solar tracker, built up in stages. **Stage 1
(current)**: LDR sensors only, to prove the device can talk to the backend.
Servo control and the INA219 power sensors come in a later stage.

## What you need

- An ESP32-S3 board, wired to 4 LDR voltage-divider circuits.
- [Arduino IDE](https://www.arduino.cc/en/software) with ESP32 board support
  installed (Boards Manager → search "esp32", install the Espressif package).
- Two libraries (Library Manager):
  - **ArduinoJson** (by Benoit Blanchon)
  - **Adafruit NeoPixel** (by Adafruit) — drives the onboard status LED

## Pinout (planned for the full build)

Chosen so every peripheral stays clear of the ADC2/WiFi conflict (see
Troubleshooting) — LDRs need reliable analog reads while WiFi is active, so
they're the only ones that actually require ADC1; INA219 (I2C) and the
servos (PWM) are digital and can go anywhere.

| Peripheral | Pins                     | Bus        |
| ---------- | ------------------------ | ---------- |
| LDR ×4     | GPIO6, 7, 8, 9           | ADC1       |
| INA219     | GPIO4 (SDA), GPIO5 (SCL) | I2C        |
| Servo ×2   | GPIO1, GPIO2             | PWM (LEDC) |

Only the LDR pins are wired and used in stage 1 — INA219 and servo pins are
reserved for later stages.

## Onboard status LED

The board's onboard WS2812 ARGB LED (GPIO48) shows connection state at a
glance:

| Color  | Pattern              | Meaning                     |
| ------ | --------------------- | ---------------------------- |
| Blue   | 0.5s on / 0.5s off    | Connecting to WiFi / not connected |
| Green  | 0.5s on / 4.5s off    | Connected, idle               |
| Purple | 0.5s on / 0.5s off    | Sending a reading             |
| Red    | 0.5s on / 0.5s off    | Connection error (WiFi timeout or failed POST) |

## Setup

1. **Register the device.** With the backend running and logged in as admin
   on the frontend, go to "Register Device", give it a name (e.g.
   `esp32-s3-01`), and copy the API key shown — it's only shown once.

2. **Find your computer's LAN IP.** The ESP32 is a separate device on your
   WiFi network, so it can't reach the backend via `localhost` — it needs
   your computer's actual IP address on that network. On Windows, run
   `ipconfig` in a terminal and use the IPv4 address of your active adapter
   (e.g. `192.168.1.100`).

3. **Edit `esp32_solar_tracker/esp32_solar_tracker.ino`** and fill in:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `BACKEND_URL` — `http://<your-lan-ip>:8000`
   - `DEVICE_API_KEY` — from step 1
   - The 4 `PIN_LDR_*` constants, if your wiring differs from the pinout
     above. Stick to GPIO1-10 (ADC1) — ADC2 (GPIO11-20) doesn't give
     reliable analog reads while WiFi is active on the ESP32-S3.

4. **Flash it.** Open the sketch in Arduino IDE, select your board (Tools →
   Board → ESP32 Arduino → your specific ESP32-S3 board) and port, then
   Upload.

5. **Watch the onboard LED and Serial Monitor** (115200 baud). You should
   see blue while it connects, then green once connected. The LDRs are
   sampled locally every 5 seconds and averaged; the LED briefly flashes
   purple and the Serial Monitor prints the averaged reading once every
   **5 minutes** — posting raw readings every few seconds would flood the
   backend with mostly-noise rows. Shorten `REPORT_INTERVAL_MS` near the
   top of the sketch (e.g. to `30000` for 30s) if you want faster feedback
   while testing — just set it back to 5 minutes afterwards.
   ```
   POST /measurements/sensor (avg of 60 samples) -> 201
   {"id":1,"device_id":1,"timestamp":"...","ldr_top_left":2048.0,...}
   ```
   If you see readings appear on the device's dashboard in the frontend
   (as admin, under "Raw LDR sensor readings"), it's working end to end.

## Troubleshooting

- **LED stays blue / never turns green**: WiFi isn't connecting. Check
  `WIFI_SSID`/`WIFI_PASSWORD`, and that the ESP32-S3 is in range of a
  2.4GHz network (it doesn't support 5GHz).
- **LED blinks red**: either the WiFi connection attempt timed out, or the
  last POST failed — check the Serial Monitor for the actual error.
- **LED never lights up at all**: double-check `PIN_ONBOARD_RGB_LED` is 48
  for your board — the sketch's own board headers confirmed this for the
  diymore ESP32-S3 DevKitC-1 N16R8, but a different board/clone may differ.
- **`POST failed: connection refused` / no response**: usually the backend
  isn't reachable from the ESP32's network. Double-check `BACKEND_URL` uses
  your LAN IP (not `localhost`), and that your firewall allows inbound
  connections on port 8000 (Windows Defender Firewall can block this by
  default for other devices on the network).
- **`401` response**: the API key doesn't match a registered device, or has
  a typo. Re-check what was copied at registration time.
- **`400`/`422` response**: check the Serial Monitor's printed response body
  for the validation error — usually a missing/malformed field.

## What's next

INA219 power sensors and servo control are planned for this same sketch,
matching the `/measurements/power` and `/servo/*` endpoints the simulator
already exercises.
