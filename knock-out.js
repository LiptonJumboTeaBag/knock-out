import {defs, tiny} from './tiny-graphics/common.js';
import {Camera} from "./camera.js";
import {Chip, obbox, Obstacle, SkyBox, Table} from "./entity.js";
import {GameAnimation, PlayerAvatar, TopBanner, TurnAnimation, UI} from "./ui.js";
import {Scene2Texture} from "./scene2texture.js";
import {BoxCollider, CylinderBoxCollision, CylinderCollider, CylinderCylinderCollision} from './collider.js';
import {MousePicking} from "./mouse-picking.js";
import {collide, move} from './physics.js';
import {Game} from './game.js';

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
            obstacle_left: new Obstacle("left"),
            obstacle_right: new Obstacle("right"),
            skybox: new SkyBox(),
        };
        this.player1_chips = [new Chip("player1", 1), new Chip("player1", 2), new Chip("player1", 3),];
        this.player2_chips = [new Chip("player2", 4), new Chip("player2", 5), new Chip("player2", 6),];
        this.obs = [new obbox(Math.atan(2), -2.5, 1, vec(2 / Math.sqrt(5), 1 / Math.sqrt(5))),
            new obbox(Math.atan(-2), 2.5, 1, vec(-2 / Math.sqrt(5), 1 / Math.sqrt(5))),
            new obbox(Math.atan(-2), -2.5, -1, vec(2 / Math.sqrt(5), -1 / Math.sqrt(5))),
            new obbox(Math.atan(2), 2.5, -1, vec(-2 / Math.sqrt(5), -1 / Math.sqrt(5)))];
        for (const ob of this.obs) {
            ob.collider = new BoxCollider(ob);
        }
        for (const chip of this.player1_chips) {
            chip.collider = new CylinderCollider(chip);
        }
        for (const chip of this.player2_chips) {
            chip.collider = new CylinderCollider(chip);
        }

        // UI
        this.game_animation = new GameAnimation();
        this.turn_animation = new TurnAnimation();
        this.ui = [new TopBanner(), new PlayerAvatar(), this.game_animation, this.turn_animation];

        // Game control
        this.game = new Game();
        this.player1_turn = true;
        this.player2_turn = true;
        this.begin_game = false;
        this.chip1_count = 3;
        this.chip2_count = 3;
        this.game_over = false;
        this.simulating = false;

        // Camera and view
        this.view = 0;
        this.currentView = null;
        this.orthographic = false;
        this.cameras = [new Camera()];

        // Frame rate
        this.frame_rate = 0;
        this.initialized = false;

        this.ticks = 0;

        // Register physics simulation routine
        setInterval(this.calculate_physics.bind(this), 1);
        this.last_physics_time = 0;
        this.start_time = Date.now();

        this.debug = false;
    }

    make_control_panel() {
        this.live_string(box => box.textContent = "Game control");
        this.new_line();
        this.key_triggered_button("Start Game!", ["0"], function () {
            this.initialized = true;
            this.begin_game = true;
            this.turn_animation.start();
            // remove third child from this.control_panel
            this.control_panel.removeChild(this.control_panel.childNodes[2]);
        }.bind(this));

        this.key_triggered_button("End turn", ["c"], () => {
            if (this.begin_game && this.ticks > this.cameras[0].pace && this.turn_animation.ended) {
                if (this.view === 2) {
                    // pass
                } else if (UI.player === 1) {
                    this.view = 0;
                    this.player1_turn = false;
                } else if (UI.player === 0) {
                    this.turn_animation.start();
                    this.view = 1;
                    this.player2_turn = false;
                    UI.switch_player();
                }
                this.ticks = 0;
            }
        });
        this.key_triggered_button("Toggle Orthographic View", ["0"], function () {
            this.orthographic = !this.orthographic;
        });
        this.new_line();
        this.new_line();

        this.live_string(box => box.textContent = "Want some fresh looks?");
        this.new_line();
        this.key_triggered_button("Are you High?", ["h"], function () {
            for (const i in this.entities) {
                // console.log(i)
                this.entities[i].change_texture();
                // console.log(this.entities[i].get_info())
            }
            for (const i in this.player1_chips) {
                this.player1_chips[i].change_texture();
            }
            for (const i in this.player2_chips) {
                this.player2_chips[i].change_texture();
            }
        });
        this.key_triggered_button("Reset texture", ["t"], function () {
            for (const i in this.entities) {
                this.entities[i].reset_texture();
            }
            for (const i in this.player1_chips) {
                this.player1_chips[i].reset_texture();
            }
            for (const i in this.player2_chips) {
                this.player2_chips[i].reset_texture();
            }
        });
        this.new_line();
        this.new_line();

        this.live_string(box => box.textContent = "Camera controls");
        this.new_line();
        // this.key_triggered_button("Change Perspective", ["v"], function () {
        //     this.view += 1;
        //     this.view %= 3;
        // });
        this.key_triggered_button("Reset Camera", ["x"], function () {
            this.cameras[0].reset();
        });

        this.new_line();
        this.new_line();
        this.live_string(box => box.textContent = "Debug");
        this.new_line();
        // this.key_triggered_button("Change Perspective", ["v"], function () {
        //     this.view += 1;
        //     this.view %= 3;
        // });
        this.key_triggered_button("Toggle Colliders", ["b"], function () {
            this.debug = !this.debug;
        });

        this.new_line();
        this.new_line();
        this.live_string(box => {
            box.textContent = `Frame rate: ${this.frame_rate.toFixed(2)}`;
        });
    }

    calculate_physics() {
        const context = this.context;
        const program_state = this.program_state;
        if (!context || !program_state) return;

        let dt = Date.now() - this.last_physics_time;
        dt /= 1000;
        this.last_physics_time = Date.now();
        if (Date.now() - this.start_time < 500) return;
        for (const i in this.player1_chips) {
            for (const j in this.obs) {
                if (CylinderBoxCollision(this.player1_chips[i].collider, this.obs[j].collider)) {
                    // console.log("collision: " + i + " " + j);
                    if (this.player1_chips[i].collider.register_collision(this.obs[j].collider)) {
                        console.log(this.player1_chips[i].get_info());
                        collide(this.player1_chips[i], this.obs[j]);
                    }
                } else {
                    this.player1_chips[i].collider.unregister_collision(this.obs[j].collider);
                }
            }
            move(this.player1_chips[i], dt);
            for (const j in this.player2_chips) {
                if (CylinderCylinderCollision(this.player1_chips[i].collider, this.player2_chips[j].collider)) {
                    console.log("collision");
                    // this.player1_chips[i].velocity = vec(0, 0);
                    collide(this.player1_chips[i], this.player2_chips[j]);
                }
            }
            for (const j in this.player1_chips) {
                if (i !== j && CylinderCylinderCollision(this.player1_chips[i].collider, this.player1_chips[j].collider)) {
                    console.log("collision");
                    collide(this.player1_chips[i], this.player1_chips[j]);
                }
            }
        }

        for (const i in this.player2_chips) {
            for (const j of this.obs) {
                if (CylinderBoxCollision(this.player2_chips[i].collider, j.collider)) {
                    if (this.player2_chips[i].collider.register_collision(j.collider)) {
                        console.log("collision");
                        collide(this.player2_chips[i], j);
                    }
                } else {
                    this.player2_chips[i].collider.unregister_collision(j.collider);
                }
            }
            move(this.player2_chips[i], dt);
            for (const j in this.player1_chips) {
                if (CylinderCylinderCollision(this.player2_chips[i].collider, this.player1_chips[j].collider)) {
                    console.log("collision");
                    collide(this.player2_chips[i], this.player1_chips[j]);
                }
            }
            for (const j in this.player2_chips) {
                if (i !== j && CylinderCylinderCollision(this.player2_chips[i].collider, this.player2_chips[j].collider)) {
                    console.log("collision");
                    collide(this.player2_chips[i], this.player2_chips[j]);
                }
            }
        }
    }

    /**
     * Handles the display and update of all objects.
     */
    display(context, program_state) {
        this.context = context;
        this.program_state = program_state;

        // Setup control panel
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
        }

        // Setup mouse picking
        if (!this.mouse_picking_p1 || !this.mouse_picking_p2) {
            const canvas = document.querySelector("#knockout-canvas");
            if (canvas) {
                this.mouse_picking_p1 = new MousePicking(canvas, this.player1_chips, hex_color("#ff314f"));
                this.mouse_picking_p2 = new MousePicking(canvas, this.player2_chips, hex_color("#3894fe"));
            }
        }

        // Switch camera view based on this.view
        if (this.view !== this.currentView) {
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

            this.ticks = 0;
            this.currentView = this.view;
        }

        this.cameras[0].update();
        program_state.set_camera(this.cameras[0].camera_matrix);

        // Calculate time
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // Update frame rate
        this.frame_rate = 1 / dt;
        if (!this.initialized) {
            this.initialized = true;
            program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 10000);
        }

        // Setup projection matrix
        if (!this.orthographic) {
            var desired = Mat4.perspective(
                Math.PI / 4, context.width / context.height, 1, 10000);
            program_state.projection_transform = desired.map((x, i) => Vector.from(program_state.projection_transform[i]).mix(x, 0.05));
        } else {
            const right = -10;
            const left = 10;
            const bottom = -6;
            const top = 8;
            const near = 1;
            const far = 100;
            var desired = Mat4.scale(1 / (right - left), 1 / (top - bottom), 1 / (far - near))
                .times(Mat4.translation(-right / (right - left), -top / (top - bottom), -far / (far - near)))
                .times(Mat4.scale(-3, 3, -3));
            program_state.projection_transform = desired.map((x, i) => Vector.from(program_state.projection_transform[i]).mix(x, 0.2));
        }

        // Setup light
        const light_position = vec4(0, 0, 0, 1);
        const top_light_position = vec4(0, 10, 0, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000), new Light(top_light_position, color(1, 1, 1, 1), 10000)];

        // Do sub-scene graphics before the main scene
        Scene2Texture.draw(context, program_state);

        for (const chip of this.player1_chips) {
            chip.collider.update();
        }
        for (const chip of this.player2_chips) {
            chip.collider.update();
        }

        // Mouse picking
        this.mouse_picking_p1.update(context, program_state);
        this.mouse_picking_p2.update(context, program_state);
        if (UI.player === 0) {
            this.mouse_picking_p1.enable_mouse_picking();
            this.mouse_picking_p2.disable_mouse_picking();
        } else {
            this.mouse_picking_p1.disable_mouse_picking();
            this.mouse_picking_p2.enable_mouse_picking();
        }
        if (!this.begin_game) {
            this.mouse_picking_p1.disable_mouse_picking();
            this.mouse_picking_p2.disable_mouse_picking();
        }

        // disable player avatar highlight if it is not any player's turn
        if (!this.begin_game) {
            this.ui[1].disable_highlight();
        } else {
            this.ui[1].enable_highlight();
        }

        // game starts, update chips information
        // collect forces
        if (this.start_simulate) {
            this.start_simulate = !this.start_simulate;
            for (const i in this.player1_chips) {
                if (this.mouse_picking_p1.forces[i][1] !== null) {
                    this.player1_chips[i].velocity = this.mouse_picking_p1.forces[i][1];
                }
            }
            for (const i in this.player2_chips) {
                if (this.mouse_picking_p2.forces[i][1] !== null) {
                    this.player2_chips[i].velocity = this.mouse_picking_p2.forces[i][1];
                }
            }
            this.mouse_picking_p1.reset();
            this.mouse_picking_p2.reset();
        }

        // Update and draw all entities
        for (const i in this.entities) {
            this.entities[i].draw(context, program_state);
        }

        // Draw chips
        for (const chip of this.player1_chips) {
            chip.draw(context, program_state);
        }
        for (const chip of this.player2_chips) {
            chip.draw(context, program_state);
        }

        // draw colliders
        if (this.debug) {
            this.obs[0].draw(context, program_state);
            this.obs[1].draw(context, program_state);
            this.obs[2].draw(context, program_state);
            this.obs[3].draw(context, program_state);
            if (this.player1_chips[0]) {
                CylinderBoxCollision(this.player1_chips[0].collider, this.obs[0].collider, true, context, program_state);
                CylinderBoxCollision(this.player1_chips[0].collider, this.obs[1].collider, true, context, program_state);
                CylinderBoxCollision(this.player1_chips[0].collider, this.obs[2].collider, true, context, program_state);
                CylinderBoxCollision(this.player1_chips[0].collider, this.obs[3].collider, true, context, program_state);
            }
        }

        // if a chip is out of bounds, remove that chip from game
        // we can do a concurrent check for velocity to help with the winning decision later
        this.are_chips_moving = 0;
        for (const i in this.player1_chips) {
            this.are_chips_moving = this.are_chips_moving || this.player1_chips[i].velocity[0] || this.player1_chips[i].velocity[1];
            if (this.player1_chips[i].collider.x > 3 || this.player1_chips[i].collider.x < -3) {
                console.log("out of bounds");
                this.player1_chips.splice(i, 1);
                this.chip1_count -= 1;
            } else if (this.player1_chips[i].collider.z > 5 || this.player1_chips[i].collider.z < -5) {
                console.log("out of bounds");
                this.player1_chips.splice(i, 1);
                this.chip1_count -= 1;
            }
        }
        this.ui[0].set_player_remain(0, this.chip1_count);
        for (const i in this.player2_chips) {
            this.are_chips_moving = this.are_chips_moving || this.player2_chips[i].velocity[0] || this.player2_chips[i].velocity[1]
            if (this.player2_chips[i].collider.x > 3 || this.player2_chips[i].collider.x < -3) {
                console.log("out of bounds");
                this.player2_chips.splice(i, 1);
                this.chip2_count -= 1;
            } else if (this.player2_chips[i].collider.z > 5 || this.player2_chips[i].collider.z < -5) {
                console.log("out of bounds");
                this.player2_chips.splice(i, 1);
                this.chip2_count -= 1;
            }
        }
        this.ui[0].set_player_remain(1, this.chip2_count);

        if (!this.game_over && !this.are_chips_moving) {
            let result = this.game.knockout(this.chip1_count, this.chip2_count);
            if (result === 0) {
                // console.log("1 wins");
                this.game_animation.set_winner(0);
                this.game_over = true;
            } else if (result === 1) {
                // console.log("2 wins");
                this.game_animation.set_winner(1);
                this.game_over = true;
            } else if (result === 2) {
                // console.log("draw");
                this.game_animation.set_winner(2);
                this.game_over = true;
            }

            if (this.game_over) {
                this.game_animation.start();
                this.begin_game = false;
                this.start_simulate = false;
                this.simulating = false;
                this.debug = false;
            }
        }

        // Automatically go to next turn after simulation is done
        if (this.simulating && !this.are_chips_moving && this.ticks >= this.cameras[0].pace) {
            this.simulating = false;
            setTimeout((() => {
                this.turn_animation.start();
                this.begin_game = true;
                this.view = 0;
            }).bind(this), 500);
        }

        // If both players finished their turn, do this
        if (!this.player1_turn && !this.player2_turn) {
            this.start_simulate = true;
            this.simulating = true;
            this.begin_game = false;
            this.player1_turn = true;
            this.player2_turn = true;
            this.view = 2;
            this.ticks = 0;

            UI.switch_player();
        }
        this.ticks++;
        // Update and draw all ui
        UI.update_camera(program_state.camera_inverse);  // Only need to update camera once
        for (const i in this.ui) {
            this.ui[i].display(context, program_state);
        }
    }
}
