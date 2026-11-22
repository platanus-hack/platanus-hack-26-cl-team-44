# Comandos del equipo. Detalle en deploy/toki.sh.
.PHONY: deploy estado logs semilla rotar-token clave escena rappi llave
deploy:      ; @bash deploy/toki.sh deploy $(RAMA)
estado:      ; @bash deploy/toki.sh estado
logs:        ; @bash deploy/toki.sh logs $(S)
semilla:     ; @bash deploy/toki.sh semilla
rotar-token: ; @bash deploy/toki.sh rotar-token
clave:       ; @bash deploy/toki.sh clave
escena:      ; @bash deploy/toki.sh escena
rappi:       ; @bash deploy/toki.sh rappi
llave:       ; @bash deploy/toki.sh llave "$(K)"
