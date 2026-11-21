// MyoWare Link Shields: OUTPUT=ENV; connect TRS cables to jacks A0 and A3.
// Envelope monitoring only; not raw EMG or force measurement.
// Target: Arduino UNO R3 (ATmega328P).
void setup() {
  Serial.begin(115200);
}
void loop() {
  const int a0 = analogRead(A0);
  const int a3 = analogRead(A3);
  Serial.print(F("A0:"));
  Serial.print(a0);
  Serial.print(F(",A3:"));
  Serial.println(a3);
  delay(10); // Approximately 100 sample pairs per second.
}
