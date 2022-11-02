import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * Main scene of the game.
 */
export class KnockOut extends Scene {
    constructor() {
        super();

        this.entities = [];
        this.colliders = [];
        this.cameras = [];
        this.ui = [];
        this.game = null;
    }

    make_control_panel() {
    }

    /**
     * Handles the display and update of all objects.
     */
    display(context, program_state) {
    }
}
