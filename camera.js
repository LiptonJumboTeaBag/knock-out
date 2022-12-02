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
        this.camera_matrix = Mat4.look_at(vec3(0, 10, 9), vec3(0,0,0), vec3(0,1,0));
        this.current_view = "Left";
        this.previous_view = "Left";
        this.ticks = 0;
        this.pace = 30;
    }

    reset(){
        this.camera_matrix = Mat4.look_at(vec3(0, 10, 9), vec3(0,0,0), vec3(0,1,0));
        this.current_view = "Left";
        this.previous_view = "Left";
        this.ticks = 0;
    }

    update() {
        if (this.previous_view === "Left"){
            if (this.current_view === "Right"){
                if (this.ticks < this.pace)
                {
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0,1,0));
                }
                else
                    this.current_view = "Left";
            }
            else if (this.current_view === "birdEye"){
                if (this.ticks < this.pace/2){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0, 1, 0));
                }
                else if (this.ticks < this.pace){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(-Math.atan(9/10)/this.pace*2, 0, 0, 1));
                }
                else
                    this.current_view = "birdEye";
            }
        }
        else if (this.previous_view === "Right"){
            if (this.current_view === "Left"){
                if (this.ticks < this.pace)
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(-Math.PI/this.pace, 0, 1, 0));
                else
                    this.current_view = "Right";
            }
            else if (this.current_view === "birdEye"){
                if (this.ticks < this.pace/2){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0, 1, 0));

                }
                else if (this.ticks < this.pace){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(-Math.atan(9/10)/this.pace*2, 0, 0, 1));
                }
                else
                    this.current_view = "birdEye";
            }
        }
        else if (this.previous_view === "birdEye"){
            if (this.current_view === "Left"){
                if (this.ticks < this.pace/2){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.atan(9/10)/this.pace*2, 0, 0, 1));
                }
                else if (this.ticks < this.pace){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0, 1, 0));
                }
                else
                    this.current_view = "Left";
            }
            else if (this.current_view === "Right"){
                if (this.ticks < this.pace/2){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.atan(9/10)/this.pace*2, 0, 0, 1));
                }
                else if (this.ticks < this.pace){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0, 1, 0));
                }
                else
                    this.current_view = "Right";
            }
        }
        this.ticks ++;
    }

    setPace(pace){
        this.pace = pace;
    }

    // places camera at (0, y_pos, 0) looking at the origin, the top_vec is vec3 top vector
    birdEye(y_pos = 10, top_vec = vec3(1,0,0)){
        //this.camera_matrix = Mat4.look_at(vec3(0, y_pos, 0), vec3(0,0,0), top_vec)
        //    .times(Mat4.scale(1, 1, 1));
        this.previous_view = this.current_view;
        this.current_view = "birdEye";
        this.ticks = 0;
    }

    LeftPerspective(){
        // this.camera_matrix = Mat4.look_at(vec3(0, 10, 9), vec3(0,0,0), vec3(0,1,0));
        this.previous_view = this.current_view;
        this.current_view = "Left";
        this.ticks = 0;
    }

    RightPerspective(){
        // this.camera_matrix = Mat4.look_at(vec3(0, 10, -9), vec3(0,0,0), vec3(0,1,0));
        this.previous_view = this.current_view;
        this.current_view = "Right";
        this.ticks = 0;
    }
}
