import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * UI is the base class for all 2D UI elements.
 */
export class UI {
    static camera_transform = Mat4.identity();
    static camera_inverse = Mat4.identity();

    constructor() {
    }

    /**
     * Update camera transform. Must be called before display each time the camera is moved.
     * @param look_at The current camera transform of the scene.
     */
    static update_camera(look_at) {
        UI.camera_transform = look_at;
        UI.camera_inverse = Mat4.inverse(look_at);
    }

    /**
     * Calculate the transform of the UI given the camera transform.
     * @param projection The projection matrix of the scene.
     * @param x_offset The x offset of the UI.
     * @param y_offset The y offset of the UI.
     * @param width The width of the UI.
     * @param height The height of the UI.
     */
    static get_transform(projection, x_offset, y_offset, width, height) {
        const camera_projection_inverse = Mat4.inverse(projection);

        // First, get the transform of the UI in camera space.
        const transform = Mat4.identity();
        transform.post_multiply(UI.camera_inverse);
        transform.post_multiply(camera_projection_inverse);

        // Then, properly scale and translate the UI.
        transform.post_multiply(Mat4.translation(x_offset, y_offset, 0));
        transform.post_multiply(Mat4.scale(width, height, 1));

        return transform;
    }

    display(context, program_state) {
    }
}

export class Scoreboard extends UI {
    constructor() {
        super();

        this.shapes = {
            square: new defs.Square(),
        };
        this.materials = {
            background: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: color(1, 1, 1, 1)
            }),
        }
    }

    display(context, program_state) {
        const transform = UI.get_transform(program_state.projection_transform, 0, 0.85, 0.25, 0.15);

        this.shapes.square.draw(context, program_state, transform, this.materials.background);
    }
}

