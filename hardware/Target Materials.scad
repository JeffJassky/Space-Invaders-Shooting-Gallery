$fn=32;

/********************************************************************************************
 * Fat Cat Hot Shot target materials. Creates one servo bracket and target stick.
 * Designed by Zack Freedman of Voidstar Lab
 *
 * Export to DXF, use AutoCAD to convert to DWG, and open in Illustrator
 * Or, add sizing dots, export to SVG, open in Illustrator, and manually scale
 *
 * Instructions:
 *  - Cut out of 1/8" plywood
 *  - Glue braces into servo mounts
 *  - Glue those parts onto the baseplate
 *  - Mount stick to servo in place of adjustable arm
 *  - Snap servo into place
 */

thickness = 3.3;
tabLength = 5;
tabDepth = thickness;
kerf = -0.05;
doubleKerf = kerf * 2;

distanceBetweenClips = 57;
distanceBetweenServoMountingHolesY = 47.26;
distanceBetweenServoMountBraceTabs = 10;
servoMountBraceTabInset = 5 + tabLength / 2;
servoMountTabToTabOffset = 1.6;

mountingHoleDiameter = 5;
mountingTabDiameter = 25;

module tabHole(angle=0) {
    rotate([0, 0, angle]) square([tabLength + doubleKerf, thickness + doubleKerf], center=true);
}

module tab(angle=0) {
    rotate([0, 0, angle]) translate([-tabLength / 2, -tabDepth, 0]) square([tabLength, tabDepth]);
}

module baseplate() {
    baseplateWidth = 50;
    baseplateLength = 70;
   
    aftLowerServoMountBraceTabToLowerHingeTabX = 43;
    aftLowerServoMountBraceTabToLowerHingeTabY = 39;
    
    difference() {
        union() {
            square([baseplateWidth, baseplateLength]);
            translate([0, baseplateLength / 2, 0]) circle(d=mountingTabDiameter);
            translate([baseplateWidth, baseplateLength / 2, 0]) circle(d=mountingTabDiameter);
        }
 
        translate([10, (baseplateLength - distanceBetweenClips) / 2, 0]) {
            tabHole();
            
            translate([distanceBetweenServoMountBraceTabs, 0, 0]) {
                tabHole();
                translate([servoMountBraceTabInset + (thickness / 2), servoMountTabToTabOffset, 0]) 
                    tabHole(angle=90);
            }
            
            translate([0, distanceBetweenClips, 0]) {
                tabHole();
                translate([distanceBetweenServoMountBraceTabs, 0, 0]) {
                    tabHole();
                    translate([servoMountBraceTabInset + (thickness / 2), -servoMountTabToTabOffset, 0]) 
                        tabHole(angle=90);
                }
            }
        }
        
        // TODO: The following dimension sucks. Make it relative to the servo
        translate([0, baseplateLength / 2, 0]) circle(d=mountingHoleDiameter);
        translate([baseplateWidth, baseplateLength / 2, 0]) circle(d=mountingHoleDiameter);
    }
}


module servoMount() {  
    servoMountHeight = 27.5;
    servoHeight = 20;
    servoMountWidth = 14;
    servoClipLength = 1.5;
    
    lowerServoMountingHoleHeight = 4.9;
    servoMountingHoleDiameter = 3;
    distanceBetweenServoMountingHolesZ = 10.2;
    
    difference() {
        union() {
            square([servoMountWidth, servoMountHeight]);
            polygon(points=[[servoMountWidth, servoHeight], [servoMountWidth, servoMountHeight], [servoMountWidth + servoClipLength, servoHeight]]);
            
            translate([(servoMountWidth / 2), 0, 0]) tab();
        }
        
        translate([(servoMountWidth / 2) - servoMountTabToTabOffset, servoMountBraceTabInset]) {
            tabHole(angle=90);
            translate([0, distanceBetweenServoMountBraceTabs, 0]) tabHole(angle=90);
        }
        
        translate([(servoMountWidth / 2 - servoMountTabToTabOffset) + ((distanceBetweenClips - distanceBetweenServoMountingHolesY) / 2), lowerServoMountingHoleHeight, 0]) {
            circle(d=3);
            translate([0, distanceBetweenServoMountingHolesZ, 0]) circle(d=3);
        }
    }
}
   
module brace() {
 polygon(points=[[0, 0], 
    [servoMountBraceTabInset * 2 + distanceBetweenServoMountBraceTabs, 0],
    [servoMountBraceTabInset * 2 + distanceBetweenServoMountBraceTabs, 5],
    [5, servoMountBraceTabInset * 2 + distanceBetweenServoMountBraceTabs],
    [0, servoMountBraceTabInset * 2 + distanceBetweenServoMountBraceTabs]]);
    
    translate([servoMountBraceTabInset, 0, 0]) tab();
    translate([servoMountBraceTabInset + distanceBetweenServoMountBraceTabs, 0, 0]) tab();
    
    translate([0, servoMountBraceTabInset, 0]) tab(angle=-90);
    translate([0, servoMountBraceTabInset + distanceBetweenServoMountBraceTabs, 0]) tab(angle=-90);
}
module stick(magnetHole=false) {
    stickWidth = 7.5;
    stickLength = 120;
    
    difference() {
        union() {
            circle(d=stickWidth);
            translate([-stickWidth / 2, 0, 0]) square([stickWidth, stickLength - (stickWidth / 2)]);
        }
        
        translate([0, 3, 0]) circle(d=3);
        translate([0, 15, 0]) circle(d=3);
        
        translate([0, 65, 0]) circle(d=3);
        translate([0, 80, 0]) circle(d=3);
        translate([0, 90, 0]) circle(d=3);
    }
}

baseplate();

translate([-60, 45, 0]) servoMount();
translate([-35, 45, 0]) servoMount();

translate([-60, 5, 0]) brace();
translate([-30, 5, 0]) brace();

translate([-55, 80, 0]) rotate([0, 0, -90]) stick();

// Dirty hack to register dimensions manually in Illustrator
//translate([-200, -200, 0]) square([1, 1]);
//translate([200, 200, 0]) rotate([0, 0, 180]) square([1, 1]);