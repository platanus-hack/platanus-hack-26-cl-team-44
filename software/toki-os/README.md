# Toki OS

Interfaz de Emmy. Para probar con mouse o con los MyoWare:

### Demo sin sensor

Desde la raíz del repositorio:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/toki-os
```

Abrir http://localhost:8000/woki-os.html y elegir **Usar mouse (demo)**. Se mantiene el nombre del archivo para conservar la URL del prototipo. Cámara y servicios externos requieren su propia configuración.

### Clic con la ceja (MyoWare A0 y A3)

1. Inicia el [monitor MyoWare](../myoware-monitor/README.md). Confirma `OUTPUT=ENV` en ambos sensores: **A0 mandíbula**, **A3 ceja**. Con electrodos puestos, sigue las [precauciones de alimentación](../../docs/validation/MYOWARE.md).
2. En el monitor, pulsa **Calibrar gestos**. Sigue los avisos: hablar y parpadear normalmente, cinco levantadas de ceja y cinco contracciones suaves de mandíbula. Pulsa **Probar gestos** para confirmar las etiquetas antes de usar el clic.
3. Selecciona **Abrir Woki OS con esta calibración** desde el monitor. En la bienvenida, pulsa **Usar mouse + clic con la ceja**. Si prefieres otro puntero, actívalo y usa **Activar clic** en la barra inferior. También puedes calibrar desde esa barra.
4. En el modo **Mirada + ceja**, enfoca una tarjeta hasta que esté lista y levanta la ceja. La mandíbula no activa ninguna acción. Para otro gesto, relaja la frente y la mandíbula.

La calibración acepta al menos tres detecciones por gesto, siempre que no haya activaciones en reposo, confusiones ni gestos repetidos en la prueba. El resultado muestra cuántos intentos detectó.

El detector espera 150 ms desde el inicio de la señal de ceja para darle prioridad a la mandíbula. No interpreta gestos dobles, largos ni comandos de emergencia. Usa **‹ Inicio** para regresar con la ceja o el mouse, o **Atrás** y **Adelante** del navegador para recorrer las pantallas visitadas.

El clic se pausa cuando la página está oculta y, si seguía activo, se reanuda al regresar a la misma página tras relajar la cara. La calibración se conserva al recargar o abrir otra pestaña con la misma dirección y navegador; solo tienes que activar el clic. Una conexión USB nueva requiere recalibrar. Si recolocas los electrodos, desactiva el clic antes de moverlos y vuelve a calibrar.

[Guía de diseño](../../docs/product/GUIA-DISENO.md) · [Plan](../../docs/product/PLAN.md)
