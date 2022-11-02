import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * UI is the base class for all 2D UI elements.
 */
export class UI {
    constructor() {
    }

    display(context, program_state) {
    }
}

export class Scoreboard extends UI {

}

