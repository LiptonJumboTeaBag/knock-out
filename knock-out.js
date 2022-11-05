import {defs, tiny} from './tiny-graphics/common.js';
import {Camera} from "./camera.js";

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
        this.camera = new Camera()
        this.shapes = {
            'box': new defs.Cube(),
        };
    
           
        const phong = new defs.Phong_Shader();
        this.materials = {
            plastic: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .5, color: color(.9, .5, .9, 1)}),
            metal: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1)})
        };
        
    }

    make_control_panel() {
    }

    /**
     * Handles the display and update of all objects.
     */
    display(context, program_state) {

        program_state.set_camera(
            this.camera.camera_matrix.times(
                Mat4.look_at(vec3(10,10,10), vec3(0,0,0), vec3(0,1,0))));  

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        let model_transform = Mat4.identity();
        model_transform = model_transform
            .times(Mat4.scale(1, 2, 1))
        
        const t = this.t = program_state.animation_time / 1000;
        const angle = Math.sin(t);
        const light_position = Mat4.rotation(angle, 1, 0, 0).times(vec4(0, -1, 1, 0));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        this.shapes.box.draw(context, program_state, model_transform, this.materials.plastic.override({color:color(1,1,1,1)}));

    }
}
