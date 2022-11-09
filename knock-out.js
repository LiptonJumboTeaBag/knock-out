import {defs, tiny} from './tiny-graphics/common.js';
import {Camera} from "./camera.js";
import {Chip, Obstacle, Table} from "./entity.js";
import {Scoreboard, UI} from "./ui.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * Main scene of the game.
 */
export class KnockOut extends Scene {
    constructor() {
        super();

        // Objects
        this.entities = {
            table: new Table(),
            obstacle_left: new Obstacle( "left" ),
            obstacle_right: new Obstacle( "right" ), 
        };
        this.player1_chips = [new Chip( "player1", 1), new Chip( "player1", 2 ), new Chip( "player1", 3  ), ];
        this.player2_chips = [new Chip( "player2", 4 ), new Chip( "player2", 5 ), new Chip( "player2", 6 ), ],
        this.colliders = [];
        this.ui = [new Scoreboard()];

        // Game control
        this.game = null;

        // Camera and view
        this.view = 0;
        this.currentView = null;
        this.orthographic = false;
        this.cameras = [new Camera()];

        // Frame rate
        this.frame_rate = 0;
    }

    make_control_panel() {
        this.live_string(box => {
            box.textContent = `Frame rate: ${this.frame_rate.toFixed(2)}`;
        });
        this.new_line();

        this.key_triggered_button("Change Perspective", ["v"], function () {
            this.view += 1;
            this.view %= 3;
        });
        this.key_triggered_button("Toggle Orthographic View", ["0"], function () {
            this.orthographic = !this.orthographic;
        });
    }

    /**
     * Handles the display and update of all objects.
     */
    display(context, program_state) {
        // Setup control panel
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
        }

        // Switch camera view
        if (this.view !== this.currentView) {
            this.currentView = this.view;
            switch (this.view) {
                case 0:
                    this.cameras[0].LeftPerspective();
                    break;
                case 1:
                    this.cameras[0].RightPerspective();
                    break;
                case 2:
                    this.cameras[0].birdEye();
                    break;
            }
            program_state.set_camera(this.cameras[0].camera_matrix);
        }

        // Calculate time
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // Update frame rate
        this.frame_rate = 1 / dt;

        // Setup projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 10000);

        if (this.orthographic) {
            const right = -10;
            const left = 10;
            const bottom = -6;
            const top = 6;
            const near = 1;
            const far = 100;
            program_state.projection_transform = Mat4.scale(1 / (right - left), 1 / (top - bottom), 1 / (far - near))
                .times(Mat4.translation(-right / (right - left), -top / (top - bottom), -far / (far - near)))
                .times(Mat4.scale(-3, 3, -3));
        }
        
        
            // Setup light
        const light_position = vec4(0, 0, 0, 1);
        const top_light_position = vec4(0, 10, 0, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000), new Light(top_light_position, color(1, 1, 1, 1), 10000)];
        
        // Update and draw all ui
        UI.update_camera(program_state.camera_inverse);  // Only need to update camera once
        // console.log(program_state.camera_inverse.toString())
        for (const i in this.ui) {
            this.ui[i].display(context, program_state);
        }

        // Update and draw all entities
        for (const i in this.entities) {
            // console.log(i)
            this.entities[i].draw(context, program_state);
            // console.log(this.entities[i].get_info())
        }
        for (const i in this.player1_chips) {
            this.player1_chips[i].draw(context, program_state);
            // console.log(this.player1_chips[i].get_info())
        }
        for (const i in this.player2_chips) {
            this.player2_chips[i].draw(context, program_state);
        }

    }
}
