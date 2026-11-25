// The stance acts start from. A pose only says what differs from standing easy (STAND in rig.js), in screen terms, px from
// the feet, y negative up. Give the hands and feet; the skeleton works out the rest.
//   x, y       where the feet are, from the effect's origin
//   crouch     hips lowered; lean  the spine bent forward (+) or back (-); hx, hy  the head rolled, nodded
//   fx, fy, fz the near (right) hand; bx, by, bz  the far (left) hand; ffx, ffy  the near foot; fbx, fby  the far foot
//   turn       how far the chest faces us, in radians (it follows the hands if you leave it out); yaw  the whole body turned
//              about its feet (0 faces right, pi faces left, in between towards us; a spin is really a spin)
//   twist      extra chest turn; armsFront  the far hand comes round in front of the chest
//   weapon, sa what the near hand holds and its angle on screen (radians, 0 points forward); two  both hands on it
//   wl, wz     foreshorten the weapon towards (or, wz -1, away from) the viewer: wl is its length on screen, 1 is full
//   pull, nocked  a bow drawn to the far hand, an arrow on the string
//   offWeapon, sb  a weapon in the far hand and its angle
//   toeF, toeB up on the toes; ghost  leave after-images
//
// How the body works. He faces right, three-quarters towards us, so his near shoulder is on the LEFT of the chest on screen and
// his far shoulder on the right: for arms raised or open to us, the near hand goes left (fx < 0) and the far hand right (bx > 0). A hand
// driving forward closes the chest and brings its shoulder round; a hand drawn back opens him up. Bones have fixed lengths: an arm reaches
// about 15 px from its shoulder (shoulders are near y = -29), a leg 17 px. Arms don't stretch, so step the body in rather than ask too much.
//
// How to hold things. Keep a little bend in the elbow. The blade lags the hand on a swing, so the wrist breaks and it whips. Long weapons
// rest in one hand with the butt on the floor and take the second hand to swing. Everything is in depth, so a weapon can swing round the front
// of him: turn the body (yaw) and the weapon goes with it.

export const READY = { crouch: 3, fx: 11, fy: -21, bx: 9, by: -21, ffx: 7, fbx: -7 };
