import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * Game object that manages all game logic and events.
 */
export class Game {
    constructor() {}

    // USAGE: this function should be used once after the total number of chips knocked out on both sides is known when the current round ends
    //          it allows for us to consider to possibility of a tie
    knockout(p1, p2) {
        if (p1 === 0 && p2 === 0) {
            return 2;   // can decide on the output later
        } else if (p1 === 0) {
            return 1;
        } else if (p2 === 0) {
            return 0;
        } else {
            return "next round";
        }
    }

    //  GAME LOGIC, play turns:
    //      player1 chooses the direction and strength for each available chip1
    //      player2 chooses the direction and strength for each available chip2
    //      game animation
    //      update on remaining chips for each side

    //  GAME LOGIC, play until:
    //      no chips for one player ==> other player wins
    //      no chips for both players ==> draw
}
