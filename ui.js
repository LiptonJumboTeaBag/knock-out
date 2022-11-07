import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;


/**
 * UI is the base class for all 2D UI elements.
 */
export class UI {
    static camera_transform = Mat4.identity();
    static camera_inverse = Mat4.identity();

    constructor(cv_dim) {
        this.projection_inverse = Mat4.identity();

        this.scratchpads = [];
        this.scratchpad_contexts = [];
        this.scratchpad_textures = [];
        this.scratchpads_materials = [];

        for (let i = 0; i < cv_dim.length; i++) {
            const [width, height] = cv_dim[i];

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            this.scratchpads.push(canvas);
            this.scratchpad_contexts.push(canvas.getContext("2d"));
            this.scratchpad_textures.push(new Texture("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"));
            this.scratchpads_materials.push(new Material(new defs.Fake_Bump_Map(1), {
                ambient: 1,
                texture: this.scratchpad_textures[i]
            }));
        }
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
     * @param x_offset The x offset of the UI.
     * @param y_offset The y offset of the UI.
     * @param width The width of the UI.
     * @param height The height of the UI.
     */
    get_transform(x_offset, y_offset, width, height) {
        // First, get the transform of the UI in camera space.
        const transform = Mat4.identity();
        transform.post_multiply(UI.camera_inverse);
        transform.post_multiply(this.projection_inverse);

        // Then, properly scale and translate the UI.
        transform.post_multiply(Mat4.translation(x_offset, y_offset, 0));
        transform.post_multiply(Mat4.scale(width, height, 1));

        return transform;
    }

    display(context, program_state) {
        this.projection_inverse = Mat4.inverse(program_state.projection_transform);
    }
}

export class Scoreboard extends UI {
    constructor() {
        super([[256, 256], [256, 256]]);

        this.turn = 0;

        this.shapes = {
            square: new defs.Square(),
            circle: new defs.Regular_2D_Polygon(25, 25),
            text: new Text_Line(20),
            cylinder: new defs.Capped_Cylinder(25, 25),
        };

        this.materials = {
            background: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: color(.5, .5, .5, .5)
            }),
            p1_obj: new Material(new defs.Phong_Shader(), {
                ambient: .8,
                diffusivity: 0,
                specularity: 0,
                color: color(1, .1, .1, 1)
            }),
            p2_obj: new Material(new defs.Phong_Shader(), {
                ambient: .8,
                diffusivity: 0,
                specularity: 0,
                color: color(25 / 256, 109 / 256, 227 / 256, 1)
            }),
        }

        const texture = new defs.Textured_Phong(1);
        this.text_image = new Material(texture, {
            ambient: 1, diffusivity: 0, specularity: 0,
            texture: new Texture("assets/text.png")
        });
    }

    /**
     * Set the current player's turn.
     * @param p 0 for player 1, 1 for player 2.
     */
    set player(p) {
        this.turn = p;
    }

    display(context, program_state) {
        super.display(context, program_state);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const aspect_ratio = context.width / context.height;

        /* Draw sub-scenes */
        const cam_matrix_backup = program_state.camera_inverse;

        let cam_x = !this.turn ? 3 * Math.cos(t) : 0;
        let cam_y = !this.turn ? 3 * Math.sin(t) : 3;
        program_state.set_camera(Mat4.look_at(vec3(cam_x, 0, cam_y), vec3(0, 0, 0), vec3(0, 1, 0)));

        // Player 1 object
        let obj_tr = Mat4.identity();
        obj_tr.post_multiply(Mat4.rotation(Math.PI * 6 / 10, 1, 0, 0));
        // let angle = t * Math.PI / 2.5;
        // obj_tr.post_multiply(Mat4.translation(0, 0, 0));
        // obj_tr.post_multiply(Mat4.rotation(angle, 0, 7/5, -7/5));
        this.shapes.cylinder.draw(context, program_state, obj_tr, this.materials.p1_obj);
        this.scratchpad_contexts[0].drawImage(context.canvas, 0, 0, 256, 256 / aspect_ratio);
        this.scratchpad_textures[0].image.src = this.scratchpads[0].toDataURL("image/png");
        context.context.clear(context.context.COLOR_BUFFER_BIT | context.context.DEPTH_BUFFER_BIT);

        // Player 2 object
        cam_x = this.turn ? 3 * Math.cos(t) : 0;
        cam_y = this.turn ? 3 * Math.sin(t) : 3;
        program_state.set_camera(Mat4.look_at(vec3(cam_x, 0, cam_y), vec3(0, 0, 0), vec3(0, 1, 0)));

        obj_tr = Mat4.identity();
        obj_tr.post_multiply(Mat4.rotation(Math.PI * 6 / 10, 1, 0, 0));
        this.shapes.cylinder.draw(context, program_state, obj_tr, this.materials.p2_obj);
        this.scratchpad_contexts[1].drawImage(context.canvas, 0, 0, 256, 256 / aspect_ratio);
        this.scratchpad_textures[1].image.src = this.scratchpads[1].toDataURL("image/png");

        // Cleanup
        if (this.skip) {
            this.scratchpad_textures[0].copy_onto_graphics_card(context.context, false);
            this.scratchpad_textures[1].copy_onto_graphics_card(context.context, false);
        }
        this.skip = true;
        context.context.clear(context.context.COLOR_BUFFER_BIT | context.context.DEPTH_BUFFER_BIT);
        program_state.set_camera(cam_matrix_backup);

        /* Draw main scene */
        const bg_transform = super.get_transform(0, 0.9, 0.25, 0.1);
        bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        this.shapes.square.draw(context, program_state, bg_transform, this.materials.background);

        let l = `Player ${this.turn ? '0' : '1'}'s Turn`
        const text_transform = super.get_transform(l.length / 2 * -0.028, 0.89, 0.02, 0.05);
        this.shapes.text.set_string(l, context.context);
        this.shapes.text.draw(context, program_state, text_transform, this.text_image);

        // Draw player avatars
        const avatar_width = 0.1;
        const avatar_height = avatar_width * aspect_ratio;
        const p1_avt_transform = super.get_transform(
            -1 + avatar_width,
            .95 - avatar_height,
            avatar_width, avatar_height
        );
        this.shapes.square.draw(context, program_state, p1_avt_transform, this.scratchpads_materials[0]);
        const p2_avt_transform = super.get_transform(
            1 - avatar_width,
            .95 - avatar_height,
            avatar_width, avatar_height
        );
        this.shapes.square.draw(context, program_state, p2_avt_transform, this.scratchpads_materials[1]);

        // Draw background for player texts
        const label_text_size = 0.017;
        const p1_label_bg_transform = super.get_transform(
            -.90,
            .7,
            label_text_size * 0.7 * 7,
            label_text_size * aspect_ratio * 1.5
        );
        p1_label_bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        this.shapes.square.draw(context, program_state, p1_label_bg_transform, this.materials.background);
        const p2_label_bg_transform = super.get_transform(
            .90,
            .7,
            label_text_size * 0.7 * 7,
            label_text_size * aspect_ratio * 1.5
        );
        p2_label_bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        this.shapes.square.draw(context, program_state, p2_label_bg_transform, this.materials.background);

        // Draw player labels texts ("Player 1" and "Player 2")
        const p1_label_transform = super.get_transform(
            -.96, .7, label_text_size * 0.7, label_text_size * aspect_ratio
        );
        this.shapes.text.set_string("Player 1", context.context);
        this.shapes.text.draw(context, program_state, p1_label_transform, this.text_image);
        const p2_label_transform = super.get_transform(
            .84,
            .7,
            label_text_size * 0.7,
            label_text_size * aspect_ratio
        );
        this.shapes.text.set_string("Player 2", context.context);
        this.shapes.text.draw(context, program_state, p2_label_transform, this.text_image);
    }
}

// noinspection DuplicatedCode
export class Text_Line extends Shape {
    // **Text_Line** embeds text in the 3D world, using a crude texture
    // method.  This Shape is made of a horizontal arrangement of quads.
    // Each is textured over with images of ASCII characters, spelling
    // out a string.  Usage:  Instantiate the Shape with the desired
    // character line width.  Then assign it a single-line string by calling
    // set_string("your string") on it. Draw the shape on a material
    // with full ambient weight, and text.png assigned as its texture
    // file.  For multi-line strings, repeat this process and draw with
    // a different matrix.
    constructor(max_size) {
        super("position", "normal", "texture_coord");
        this.max_size = max_size;
        const object_transform = Mat4.identity();
        for (let i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
            defs.Square.insert_transformed_copy_into(this, [], object_transform);
            object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
        }
    }

    set_string(line, context) {           // set_string():  Call this to overwrite the texture coordinates buffer with new
        // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (let i = 0; i < this.max_size; i++) {
            const row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
                col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

            const skip = 3, size = 32, sizefloor = size - skip;
            const dim = size * 16,
                left = (col * size + skip) / dim, top = (row * size + skip) / dim,
                right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copy_onto_graphics_card(context);
            this.existing = true;
        } else
            this.copy_onto_graphics_card(context, ["texture_coord"], false);
    }
}
