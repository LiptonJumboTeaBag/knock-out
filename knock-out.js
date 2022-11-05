import {defs, tiny} from './tiny-graphics/common.js';
import {Camera} from "./camera.js";
import {Obstacle, Table} from "./entity.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * Main scene of the game.
 */
export class KnockOut extends Scene {
    constructor() {
        super();

        this.entities = {};
        this.colliders = [];
        this.cameras = [];
        this.ui = [];
        this.game = null;        
        this.cameras = [new Camera()]
        this.entities = {
            table: new Table(),
            obstacle1: new Obstacle(),
        };

    }

    make_control_panel() {
    }

    /**
     * Handles the display and update of all objects.
     */
    display(context, program_state) {

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            program_state.set_camera(
            //this.cameras[0].birdEye(10, vec3(1,0,0)));  
            //this.cameras[0].LeftPerspective());
            this.cameras[0].RightPerspective());
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        const light_position = vec4(0,0,0,1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        
        for (var i in this.entities){
            console.log(i)
            this.entities[i].draw(context, program_state);
        }
    }
}
