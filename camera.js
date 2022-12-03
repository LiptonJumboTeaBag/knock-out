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

    // resets the camera matrix based on the current view
    reset(){
        console.log(this.current_view)
        if (this.current_view === "Left"){
            this.camera_matrix = Mat4.look_at(vec3(0, 10, 9), vec3(0,0,0), vec3(0,1,0));
            this.current_view = "Left";
            this.previous_view = "Left";
            this.ticks = 0;
        }
        else if (this.current_view === "Right"){
            this.camera_matrix = Mat4.look_at(vec3(0, 10, -9), vec3(0,0,0), vec3(0,1,0));
            this.current_view = "Right";
            this.previous_view = "Right";
            this.ticks = 0;
        }
        else if (this.current_view === "birdEye"){
            this.camera_matrix = Mat4.look_at(vec3(0, Math.sqrt(181), 0), vec3(0,0,0), vec3(-1,0,0));
            this.current_view = "birdEye";
            this.previous_view = "birdEye";
            this.ticks = 0;
        }
    }

    // transition to the current view from previous view in this.pace ticks using rotations
    update() {
        if (this.previous_view === "Left"){
            if (this.current_view === "Right"){
                if (this.ticks < this.pace)
                {
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0,1,0));
                }
                else
                    this.previous_view = "Right";
            }
            else if (this.current_view === "birdEye"){
                if (this.ticks < this.pace/2){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0, 1, 0));
                }
                else if (this.ticks < this.pace){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(-Math.atan(9/10)/this.pace*2, 0, 0, 1));
                }
                else
                    this.previous_view = "birdEye";
            }
        }
        else if (this.previous_view === "Right"){
            if (this.current_view === "birdEye"){
                if (this.ticks < this.pace/2){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.PI/this.pace, 0, 1, 0));

                }
                else if (this.ticks < this.pace){
                    this.camera_matrix = this.camera_matrix.times(Mat4.rotation(Math.atan(9/10)/this.pace*2, 0, 0, 1));
                }
                else
                    this.previous_view = "birdEye";
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
                    this.previous_view = "Left";
            }
        }
        this.ticks ++;
        // console.log(this.previous_view, this.current_view)
    }

    setPace(pace){
        this.pace = pace;
    }

    // sets the goal view to birdEye
    birdEye(){
        //this.camera_matrix = Mat4.look_at(vec3(0, Math.sqrt(181), 0), vec3(0,0,0), vec3(-1,0,0))
        this.previous_view = this.current_view;
        this.current_view = "birdEye";
        this.ticks = 0;
    }

    // sets the goal view to Left (P1)
    LeftPerspective(){
        // this.camera_matrix = Mat4.look_at(vec3(0, 10, 9), vec3(0,0,0), vec3(0,1,0));
        this.previous_view = this.current_view;
        this.current_view = "Left";
        this.ticks = 0;
    }

    // sets the goal view to Right (P2)
    RightPerspective(){
        // this.camera_matrix = Mat4.look_at(vec3(0, 10, -9), vec3(0,0,0), vec3(0,1,0));
        this.previous_view = this.current_view;
        this.current_view = "Right";
        this.ticks = 0;
    }
}