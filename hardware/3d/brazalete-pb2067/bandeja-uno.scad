// UNO Rev3, PCB de 1.6 mm nominal. El shield permanece por encima de las uñas.
// Túnel dorsal transversal para una correa de extremo libre. Imprimir sobre la base.
// Fuente de los centros de los agujeros: UNO-TH_Rev3e.brd, Arduino.
ancho_correa = 30;
grosor_correa = 2;
largo = 68.58;
ancho = 53.34;
grosor_placa = 1.6;
altura_apoyo = 5.5;
juego_lateral = 0.45;
grosor_una = 1.6;
$fn = 48;
// Espacio detrás de las uñas para flexionar al insertar el Uno.
espacio = 4.4;
pared = 2.4;
margen = espacio + pared;
alto_pared = 26; // Desde el piso interior hasta el borde frontal.
base = 2.6 + grosor_correa + 1.2 + 2.6;
nivel = base + altura_apoyo;
agujeros = [[66.04,35.56],[66.04,7.62],[15.24,50.8],[13.97,2.54]];
assert(ancho_correa+2 < largo-12);
// Clip con rampa de entrada que abraza el canto de la placa inferior.
module una(x){
    d = juego_lateral;
    w = grosor_una;
    z = nivel + grosor_placa + 0.3;
    translate([x,0,0]) multmatrix([[0,0,1,0],[1,0,0,0],[0,1,0,0],[0,0,0,1]])
        linear_extrude(6) polygon([[-d-w,base-0.2],[-d,base-0.2],
            [-d,z-0.85],[0.5,z],[0.5,z+0.35],[-d,z+1.6],[-d-w,z+1.6]]);
}
module contorno(r,h){
    hull() for(x=[0,largo],y=[0,ancho])
        translate([x,y,0]) cylinder(r=r,h=h);
}
module caja(){
    difference(){
        contorno(margen,base+alto_pared);
        translate([0,0,base]) contorno(espacio,alto_pared+1);
        // Hombro: rebaje para los cuatro TRS, con dintel inferior y esquinas enteras.
        translate([largo-1,1,nivel+6])
            cube([margen+2,ancho-2,base+alto_pared-2.6-(nivel+6)]);
        // Extremo opuesto: los dos TRS sobre el Uno.
        translate([-margen-1,4,nivel+6])
            cube([margen+2,ancho-8,base+alto_pared-2.6-(nivel+6)]);
        // Ventanas USB-B y alimentación. Bocas accesibles con el shield puesto.
        for (rango=[[1,18],[29,50]])
            translate([-margen-1,rango[0],nivel-1])
                cube([margen+2,rango[1]-rango[0],14]);
        translate([(largo-ancho_correa-2)/2,-margen-1,2.6])
            cube([ancho_correa+2,ancho+2*margen+2,grosor_correa+1.2]);
    }
}
union(){
    caja();
    for(i=[0:3]){
        p=agujeros[i];
        translate([p[0],p[1],base-0.2]) cylinder(d=4.8,h=altura_apoyo+0.2);
        if(i==0 || i==3)
            translate([p[0],p[1],nivel-0.1]) cylinder(d1=2.8,d2=2.5,h=grosor_placa+0.1);
    }
    for(x=[21,48]){
        una(x);
        translate([0,ancho,0]) mirror([0,1,0]) una(x);
    }
}
