// Concepto de sobremesa. Milímetros. Panel de referencia MPI7002 y case VILP014.
$fn=48;
taladros=[156.9,114.96];
case_pi=[92.6,63.4];
module planta(w,h,r){
    hull() for(x=[-1,1],y=[-1,1]) translate([x*(w/2-r),y*(h/2-r)]) circle(r);
}
module pantalla(){translate([0,-28,3]) rotate([77,0,0]) children();}
module marco(){
    difference(){
        union(){
            translate([0,68,-4]) linear_extrude(4) difference(){
                planta(180,136,5); planta(159,101,3);
            }
            for(x=[-1,1], y=[-1,1])
                translate([x*taladros[0]/2,68+y*taladros[1]/2,-0.1]) cylinder(d=6.5,h=4.1);
            // Lengüeta superior para que el clip agarre el plástico.
            translate([-22.5,133,-4]) cube([45,14,5]);
        }
        for(x=[-1,1], y=[-1,1])
            translate([x*taladros[0]/2,68+y*taladros[1]/2,-5]) cylinder(d=3.3,h=11);
    }
}
union(){
    translate([0,22,0]) linear_extrude(4) planta(180,131,6);
    pantalla() marco();
    // Refuerzos laterales entre marco y base.
    for(x=[-83,79]) hull(){
        translate([x,-26,2]) cube([4,3,3]);
        translate([x,45,2]) cube([4,4,2]);
        pantalla() translate([x,55,-3]) cube([4,3,2]);
    }
    // Cuatro guías cortas dejan libres puertos y ventilación.
    for(i=[-1,1],j=[-1,1]) {
        x=i*(case_pi[0]/2+1); y=49+j*(case_pi[1]/2+1);
        translate([i>0?x:x-2.4,j>0?y-6:y-2.4,3.9]) cube([2.4,8.4,8]);
        translate([i>0?x-6:x-2.4,j>0?y:y-2.4,3.9]) cube([8.4,2.4,8]);
        translate([i*(case_pi[0]/2-4),49+j*(case_pi[1]/2-4),3.9]) cylinder(d=6,h=3.1);
    }
}
