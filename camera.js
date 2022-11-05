import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

/**
 * A camera class is a wrapper of the camera matrix.
 * It provides functions to control the camera and blend between two cameras.
 */
export class Camera {
    constructor() {
        this.camera_matrix = Mat4.identity();
    }

    update() {
    }

    // places camera at (0, y_pos, 0) looking at the origin, the top_vec is vec3 top vector
    birdEye(y_pos, top_vec){
        this.camera_matrix = Mat4.look_at(vec3(0, y_pos, 0), vec3(0,0,0), top_vec)
        return this.camera_matrix
    }
}
