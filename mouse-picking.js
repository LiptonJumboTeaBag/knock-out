import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;


export class MousePicking {
    constructor(canvas, watchObjects = []) {
        this.watchObjects = watchObjects;

        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.canvas = canvas;
        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));

        // Ray for debugging
        this.sphere = new defs.Subdivision_Sphere(4);
        this.ray_material = new Material(new defs.Phong_Shader(), {
            ambient: 1,
            diffusivity: 0,
            specularity: 0,
            color: color(1, 0, 0, 1)
        });
    }

    mouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        this.isMouseDown = true;
    }

    mouseUp() {
        this.isMouseDown = false;
    }

    display_ray(context, program_state, from, dir, length = 20) {
        for (let i = 0; i < length * 10; i++) {
            const pos = from.plus(dir.times(i * 0.1));
            const tr = Mat4.identity();
            tr.post_multiply(Mat4.translation(pos[0], pos[1], pos[2]));
            tr.post_multiply(Mat4.scale(0.1, 0.1, 0.1));
            this.sphere.draw(context, program_state, tr, this.ray_material);
        }
    }

    check_collision(ray_origin, ray_dir, distance = 100, step = 0.3) {
        for (let i = 0; i < distance; i += step) {
            const pos = ray_origin.plus(ray_dir.times(i));
            for (const obj of this.watchObjects) {
                const info = obj.get_info();
                let {scale_r, scale_y, x, y, z} = info;

                // Check if pos lies within the cylindrical area
                let bot_y = y - scale_y / 2;
                let top_y = y + scale_y / 2;
                let dist = Math.sqrt((pos[0] - x) ** 2 + (pos[2] - z) ** 2);
                if (pos[1] >= bot_y && pos[1] <= top_y && dist <= scale_r) {
                    return obj;
                }
            }
        }
        return null;
    }

    update(context, program_state, debug = false) {
        // this.sphere.draw(context, program_state, Mat4.identity().times(Mat4.translation(0, 10, 9)), this.ray_material);

        if (debug && this.ray_origin && this.ray_dir) {
            this.display_ray(context, program_state, this.ray_origin, this.ray_dir);
        }

        if (!this.isMouseDown) return;

        // Calculate ray from camera to mouse in world space
        const lookat_matrix = program_state.camera_inverse;
        const cam_matrix = program_state.camera_transform
        const proj_matrix = program_state.projection_transform;
        const mouse_x = this.mouseX / context.width * 2 - 1;
        const mouse_y = -(this.mouseY / context.height * 2 - 1);
        let ray_origin = cam_matrix.times(vec4(0, 0, 0, 1)).to3();
        let ray = Mat4.inverse(proj_matrix.times(lookat_matrix)).times(vec4(mouse_x, mouse_y, 1, 1)).to3();
        let ray_dir = ray.normalized();

        this.ray_origin = ray_origin;
        this.ray_dir = ray_dir;
        const collision_obj = this.check_collision(ray_origin, ray_dir);
        if (collision_obj) {
            console.log("Selected object:");
            console.log(collision_obj);
        }

        if (debug) {
            this.display_ray(context, program_state, ray_origin, ray_dir);
        }
    }
}
