import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;


export class MousePicking {
    MAX_FORCE_LENGTH = 4;

    constructor(canvas, watching_chips = [], aim_line_color = hex_color("#000000")) {
        // Watching objects and forces
        this.watching_chips = watching_chips;
        this._forces = Array(watching_chips.length).fill(null);

        // Global enable/disable flag
        this._enable = true;

        // Mouse picking states
        this.mouseX = 0;
        this.mouseY = 0;
        this.selected_chip = null;
        this.isMouseDown = false;
        this.mouseDownPos = null;
        this.mouseDragged = false;

        // Setup mouse events
        this.canvas = canvas;
        this.canvas.addEventListener("mousedown", this._mouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this._mouseUp.bind(this));
        this.canvas.addEventListener("mouseleave", this._mouseUp.bind(this));
        this.canvas.addEventListener("mousemove", this._mouseMove.bind(this));
        this.canvas.addEventListener("click", this._mouseClick.bind(this));

        // Ray for debugging
        this.sphere = new defs.Subdivision_Sphere(4);
        this.ray_material = new Material(new defs.Phong_Shader(), {
            ambient: 1,
            diffusivity: 0,
            specularity: 0,
            color: color(1, 0, 0, 1)
        });

        // Arrow for aim line
        this.cube = new defs.Cube();
        this.arrow_head = new defs.Closed_Cone(10, 10);
        this.arrow_material = new Material(new defs.Phong_Shader(), {
            ambient: 1,
            diffusivity: 0,
            specularity: 0,
            color: aim_line_color
        });
    }

    // Return pairs of [chip, force], where force is a vec3 or null
    get forces() {
        let result = [];
        for (let i = 0; i < this._forces.length; i++) {
            result.push([this.watching_chips[i], this._forces[i]]);
        }
        return result;
    }

    // Reset forces applied to chips
    reset() {
        this._forces = Array(this.watching_chips.length).fill(null);
    }

    // Enable mouse picking for this player
    enable_mouse_picking() {
        this._enable = true;
    }

    // Disable mouse picking for this player
    disable_mouse_picking() {
        this._enable = false;
    }

    // Mouse down event: record start position for dragging
    _mouseDown(event) {
        // Get mouse position
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        this.ray = this._get_click_ray(this.mouseX, this.mouseY);

        if (!this._enable) return;
        if (!this.selected_chip) return;

        // Check if we click a chip
        const selected = this._get_clicked_chip(this.mouseX, this.mouseY);
        if (selected !== this.selected_chip) return;

        if (!this.mouseDownPos)
            this.mouseDownPos = vec(this.mouseX, this.mouseY);
        this.isMouseDown = true;
        this.mouseDragged = false;
    }

    // Mouse move event: handles dragging
    _mouseMove(event) {
        if (!this._enable) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        if (!this.isMouseDown) return;

        // Intersect clicking position with y=0 plane
        let down_ray = this._get_click_ray(this.mouseDownPos[0], this.mouseDownPos[1]);
        let cur_ray = this._get_click_ray(this.mouseX, this.mouseY);
        let down_a = -down_ray.origin[1] / down_ray.dir[1];
        let down_pos = down_ray.origin.plus(down_ray.dir.times(down_a));
        let cur_a = -cur_ray.origin[1] / cur_ray.dir[1];
        let cur_pos = cur_ray.origin.plus(cur_ray.dir.times(cur_a));

        // Calculate force by dragged amount
        let force = down_pos.minus(cur_pos).times(5);
        force = vec(force[0], force[2]);
        if (force.norm() > this.MAX_FORCE_LENGTH)
            force = force.normalized().times(this.MAX_FORCE_LENGTH);
        this._forces[this.watching_chips.indexOf(this.selected_chip)] = force;

        this.mouseDragged = true;
    }

    // Mouse up event: stop dragging
    _mouseUp() {
        if (!this._enable) return;

        this.isMouseDown = false;
        this.mouseDownPos = null;
    }

    // Mouse click event: select a chip and disable/restore global mouse control
    _mouseClick(event) {
        if (!this._enable) {
            return;
        }

        if (this.mouseDragged) {
            this.mouseDragged = false;
            return;
        }

        // Get mouse position
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Get clicked chip
        const selected = this._get_clicked_chip(x, y);
        if (selected) {
            if (this.selected_chip === selected) {
                this.selected_chip = null;
                selected.selected = false;
            } else {
                if (this.selected_chip)
                    this.selected_chip.selected = false;
                this.selected_chip = selected;
                selected.selected = true;
            }

            // Temporarily disable mouse control
            this.context.scratchpad.controls.disable_mouse = true;
        } else {
            if (this.selected_chip) {
                this.selected_chip.selected = false;

                // Restore mouse control
                this.context.scratchpad.controls.disable_mouse = false;
            }
            this.selected_chip = null;
        }
    }

    // Draw 3d aim line
    _draw_arrow(from, to) {
        const dir = to.minus(from);
        const length = dir.norm();
        const dir_norm = dir.normalized();
        const angle = Math.acos(dir_norm[1]);
        const axis = vec3(dir_norm[2], 0, -dir_norm[0]).normalized();

        // Arrow body
        const body_pos = (from.plus(to)).times(0.5);
        let tr = Mat4.identity();
        tr.post_multiply(Mat4.translation(body_pos[0], body_pos[1], body_pos[2]));
        tr.post_multiply(Mat4.rotation(angle, axis[0], axis[1], axis[2]));
        tr.post_multiply(Mat4.scale(0.1, length / 2, 0.05));
        this.cube.draw(this.context, this.program_state, tr, this.arrow_material);

        // Arrow head
        const head_pos = to.plus(dir_norm.times(length * 0.1));
        tr = Mat4.identity();
        tr.post_multiply(Mat4.translation(head_pos[0], head_pos[1], head_pos[2]));
        tr.post_multiply(Mat4.rotation(angle, axis[0], axis[1], axis[2]));
        tr.post_multiply(Mat4.scale(0.3, 0.12 * length, 0.05));
        tr.post_multiply(Mat4.rotation(Math.PI / 2, -1, 0, 0));
        this.arrow_head.draw(this.context, this.program_state, tr, this.arrow_material);
    }

    // Draw 2d arrow on x-z plane given y height
    _draw_arrow_2d(from, to, y = 0.4) {
        const dir = to.minus(from);
        const length = dir.norm();
        const dir_norm = dir.normalized();
        const angle = -Math.atan2(dir_norm[1], dir_norm[0]);

        // Arrow body
        const body_pos = (from.plus(to)).times(0.5);
        let tr = Mat4.identity();
        tr.post_multiply(Mat4.translation(body_pos[0], y, body_pos[1]));
        tr.post_multiply(Mat4.rotation(angle, 0, 1, 0));
        tr.post_multiply(Mat4.scale(length / 2, 0.05, 0.1));
        this.cube.draw(this.context, this.program_state, tr, this.arrow_material);

        // Arrow head
        const head_pos = to.plus(dir_norm.times(length * 0.1));
        tr = Mat4.identity();
        tr.post_multiply(Mat4.translation(head_pos[0], y, head_pos[1]));
        tr.post_multiply(Mat4.rotation(angle, 0, 1, 0));
        tr.post_multiply(Mat4.scale(0.12 * length, 0.05, 0.3));
        tr.post_multiply(Mat4.rotation(Math.PI / 2, 0, 1, 0));
        this.arrow_head.draw(this.context, this.program_state, tr, this.arrow_material);
    }

    // Draw ray trace line for debugging
    _draw_ray(from, dir, length = 20) {
        for (let i = 0; i < length * 10; i++) {
            const pos = from.plus(dir.times(i * 0.1));
            const tr = Mat4.identity();
            tr.post_multiply(Mat4.translation(pos[0], pos[1], pos[2]));
            tr.post_multiply(Mat4.scale(0.1, 0.1, 0.1));
            this.sphere.draw(this.context, this.program_state, tr, this.ray_material);
        }
    }

    // Calculate ray based on click position
    _get_click_ray(x = this.mouseX, y = this.mouseY) {
        const mouse_x = x / this.context.width * 2 - 1;
        const mouse_y = -(y / this.context.height * 2 - 1);

        // const lookat_matrix = this.program_state.camera_inverse;
        // const cam_matrix = this.program_state.camera_transform;
        // const proj_matrix = this.program_state.projection_transform;
        // let ray_origin = cam_matrix.times(vec4(0, 0, 0, 1)).to3();
        // let ray = Mat4.inverse(proj_matrix.times(lookat_matrix)).times(vec4(mouse_x, mouse_y, 1, 1)).to3();
        // let ray_dir = ray.normalized();

        let pos_ndc_near = vec4(mouse_x, mouse_y, -1.0, 1.0);
        let pos_ndc_far = vec4(mouse_x, mouse_y, 1.0, 1.0);
        let P = this.program_state.projection_transform;
        let V = this.program_state.camera_inverse;
        let pos_world_near = Mat4.inverse(P.times(V)).times(pos_ndc_near);
        let pos_world_far = Mat4.inverse(P.times(V)).times(pos_ndc_far);
        pos_world_near.scale_by(1 / pos_world_near[3]);
        pos_world_far.scale_by(1 / pos_world_far[3]);

        // return {origin: ray_origin, dir: ray_dir};
        return {origin: pos_world_near.to3(), dir: pos_world_far.minus(pos_world_near).to3().normalized()};
    }

    // Return the chip in watchObjects that is clicked. If no chip is clicked, return null.
    _get_clicked_chip(x = this.mouseX, y = this.mouseY) {
        const ray = this._get_click_ray(x, y);
        return this._check_collision(ray.origin, ray.dir);
    }

    // Check if ray intersects with any chip in watchObjects
    _check_collision(ray_origin, ray_dir, distance = 100, step = 0.3) {
        for (let i = 0; i < distance; i += step) {
            const pos = ray_origin.plus(ray_dir.times(i));
            for (const obj of this.watching_chips) {
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

    // Call this function every frame
    update(context, program_state) {
        this.context = context;
        this.program_state = program_state;

        if (!this._enable) return;

        // DEBUG
        // if (this.ray)
        //     this._draw_ray(this.ray.origin, this.ray.dir);

        // Draw forces arrows
        for (let i = 0; i < this.watching_chips.length; i++) {
            if (this._forces[i]) {
                let {x, z} = this.watching_chips[i].get_info();
                this._draw_arrow_2d(vec(x, z), vec(x + this._forces[i][0], z + this._forces[i][1]));
            }
        }
    }
}
