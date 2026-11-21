// Xiaomi PB2067. Colocar el fondo en la cama. Medidas en mm.
// La correa se enhebra lateralmente por el túnel de la pared trasera.
ancho_bateria = 72;
grosor_bateria = 31.2;
holgura_por_cara = 1;
profundidad = 105;
ancho_correa = 30;
grosor_correa = 2;
pared = 2.4;
fondo = 3.2;
$fn = 48;
a = ancho_bateria + 2*holgura_por_cara;
g = grosor_bateria + 2*holgura_por_cara;
paso = grosor_correa + 1.4;
dorso = pared*2 + paso;
alto = fondo + profundidad;
z_correa = fondo + profundidad*0.63;
assert(z_correa + ancho_correa/2 + paso < alto);
module planta(x,y,w,d,r,h) {
    hull() for(i=[x+r,x+w-r], j=[y+r,y+d-r])
        translate([i,j,0]) cylinder(r=r,h=h);
}
difference(){
    planta(-pared,-dorso,a+2*pared,g+dorso+pared,4,alto);
    translate([0,0,fondo]) planta(0,0,a,g,1,profundidad+1);
    // Túnel transversal, abre en ambos cantos, separado de la batería.
    translate([-pared-1,-dorso+pared,z_correa-(ancho_correa+2)/2])
        cube([a+2*pared+2,paso,ancho_correa+2]);
}
