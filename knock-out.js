import {defs, tiny} from './tiny-graphics/common.js';
import {Camera} from "./camera.js";
import {Table} from "./entity.js";

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
        this.camera = new Camera()
           
        const phong = new defs.Phong_Shader();
        this.materials = {

            plastic: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .5, color: color(.9, .5, .9, 1)}),
            metal: new Material(phong,
                {ambient: 1, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1)}),
            table: new Material(phong,
                {ambient: 1, diffusivity: 0, specularity: 0, color: color(0.2, .5, 1, 1)})
      
            };
        
    }

    make_control_panel() {
    }

    /**
     * Handles the display and update of all objects.
     */
    display(context, program_state) {

        program_state.set_camera(
           this.camera.birdEye(10, vec3(1,0,0)));  

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        const light_position = vec4(0,0,0,1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        
        this.entities = {table: new Table(this.materials.table)};
        this.entities.table.draw(context, program_state);
    }
}
