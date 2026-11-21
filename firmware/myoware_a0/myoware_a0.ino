// MyoWare Link Shield: OUTPUT=ENV; cable TRS al jack A0.
// Validacion de envolvente, no adquisicion de EMG cruda ni fuerza en newtons.
// Destino comprobado por compilacion: Arduino UNO R3 (ATmega328P).
void setup() {
  Serial.begin(115200);
}
void loop() {
  Serial.print("ENV:");
  Serial.println(analogRead(A0));
  delay(10); // Aproximadamente 100 muestras/s, suficiente para visualizar ENV.
}
