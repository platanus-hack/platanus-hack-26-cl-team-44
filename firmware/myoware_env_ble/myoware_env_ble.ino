#include <Arduino.h>
#include <BLE.h>

// Use a different advertising name for each Wireless Shield.
constexpr char kDeviceName[] = "MyoWareENV";
constexpr uint8_t kEnvPin = 39;
constexpr unsigned long kSampleIntervalMs = 50;
const BLEUUID kServiceUuid("EC3AF789-2154-49F4-A9FC-BC6C88E9E930");
const BLEUUID kEnvUuid("F3A56EDF-8F1E-4533-93BF-5601B2E91308");

BLECharacteristic env;

void fail(const char* step, const char* reason) {
  Serial.printf("%s failed: %s\n", step, reason);
  while (true) {
    delay(1000);
  }
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  BTStatus status = BLE.begin(kDeviceName);
  if (!status) {
    fail("BLE initialization", status.toString());
  }

  BLEServer server = BLE.createServer();
  if (!server) {
    fail("BLE server", "could not create server");
  }

  server.onDisconnect([](BLEServer server, const BLEConnInfo&, uint8_t) {
    server.startAdvertising();
  });

  BLEService service = server.createService(kServiceUuid);
  if (!service) {
    fail("BLE service", "could not create service");
  }

  env = service.createCharacteristic(
    kEnvUuid, BLEProperty::Read | BLEProperty::Notify, BLEPermission::ReadOpen);
  if (!env) {
    fail("ENV characteristic", "could not create characteristic");
  }

  status = server.start();
  if (!status) {
    fail("BLE server startup", status.toString());
  }

  BLEAdvertising advertising = BLE.getAdvertising();
  advertising.addServiceUUID(kServiceUuid);
  status = advertising.start();
  if (!status) {
    fail("BLE advertising", status.toString());
  }

  Serial.printf("%s is advertising. Enable notifications to read GPIO39.\n", kDeviceName);
}

void loop() {
  char sample[5];
  snprintf(sample, sizeof(sample), "%u", static_cast<unsigned int>(analogRead(kEnvPin)));
  env.setValue(sample);
  if (env.getSubscribedCount() > 0) {
    env.notify();
  }
  delay(kSampleIntervalMs);
}
