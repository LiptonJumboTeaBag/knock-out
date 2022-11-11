import {defs, tiny} from './tiny-graphics/common.js';
import {Scene2Texture, SceneDrawer} from "./scene2texture.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;


/**
 * UI is the base class for all 2D UI elements.
 */
export class UI {
    static camera_transform = Mat4.identity();
    static camera_inverse = Mat4.identity();
    static turn = 0;

    constructor() {
        this.projection_inverse = Mat4.identity();
    }

    /**
     * Get the current player's turn.
     * @returns {number} 0 for player 1, 1 for player 2.
     */
    static get player() {
        return UI.turn;
    }

    /**
     * Set the current player's turn.
     * @param p 0 for player 1, 1 for player 2.
     */
    static set player(p) {
        UI.turn = p;
    }

    /**
     * Switch to the next player's turn.
     */
    static switch_player() {
        UI.turn = 1 - UI.turn;
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

export class TopBanner extends UI {
    constructor() {
        super();

        this.shapes = {
            square: new defs.Square(),
            circle: new defs.Regular_2D_Polygon(25, 25),
        };

        this.materials = {
            background: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: color(.5, .5, .5, .5)
            }),
        };

        // orange color
        this.text = new TextLine('Drop-out!', "nasalization", hex_color("#FFA500"));
        this.text.set_position(0, .96, 0.0016);
    }

    display(context, program_state) {
        super.display(context, program_state);

        /* Draw main scene */
        const bg_transform = super.get_transform(0, 0.9, 0.25, 0.1);
        bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        this.shapes.square.draw(context, program_state, bg_transform, this.materials.background);

        // this.text.text = `Player ${UI.player === 0 ? '1' : '2'}'s Turn`;
        this.text.display(context, program_state);
    }
}

/**
 * Displays player avatars on top corners of the screen.
 */
export class PlayerAvatar extends UI {
    constructor() {
        super();

        // Player labels
        this.p1_label = new TextLine("Player 1", "roboto-bold");
        this.p2_label = new TextLine("Player 2", "roboto-bold");
        this.p1_color = hex_color("#ff4965");
        this.p2_color = hex_color("#4a90e2");

        this.shapes = {
            cylinder: new defs.Capped_Cylinder(20, 20),  // Player's chip
            square: new defs.Square(),
            circle: new defs.Regular_2D_Polygon(25, 25),
        }

        this.materials = {
            // Textures of player's chips
            p1_obj: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0.6,
                specularity: 0.5,
                color: color(1, .1, .1, 1)
            }),
            p2_obj: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0.6,
                specularity: 0.5,
                color: color(25 / 256, 109 / 256, 227 / 256, 1)
            }),
            // Background of label texts
            background: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: color(.5, .5, .5, .5)
            }),
        }

        // Register sub-scene drawers
        this.drawer_p1 = new SceneDrawer(256, 256, ((c, p) => this.display_player(c, p, 0)).bind(this));
        Scene2Texture.register(this.drawer_p1);
        this.p1_avatar_material = new Material(new defs.Fake_Bump_Map(1), {
            ambient: 1,
            texture: this.drawer_p1.texture,
        });

        this.drawer_p2 = new SceneDrawer(256, 256, ((c, p) => this.display_player(c, p, 1)).bind(this));
        Scene2Texture.register(this.drawer_p2);
        this.p2_avatar_material = new Material(new defs.Fake_Bump_Map(1), {
            ambient: 1,
            texture: this.drawer_p2.texture,
        });
    }

    display_player(context, program_state, player) {
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 10000);

        let cam_x = UI.player === player ? 3 * Math.cos(t * 2) : 0;
        let cam_y = UI.player === player ? 3 * Math.sin(t * 2) : 3;
        let light_x = UI.player === player ? 6 * Math.cos(t * 2) : 0;
        let light_y = UI.player === player ? 6 * Math.sin(t * 2) : 6;
        program_state.set_camera(Mat4.look_at(vec3(cam_x, 1, cam_y), vec3(0, 0, 0), vec3(0, 1, 0)));
        program_state.lights = [new Light(vec4(light_x, 1, light_y, 1), color(1, 1, 1, 1), 1000)];

        let obj_tr = Mat4.identity();
        obj_tr.post_multiply(Mat4.rotation(Math.PI * 6 / 10, 1, 0, 0));
        this.shapes.cylinder.draw(context, program_state, obj_tr, player === 0 ? this.materials.p1_obj : this.materials.p2_obj);
    }

    display(context, program_state) {
        super.display(context, program_state);
        const aspect_ratio = context.width / context.height;

        // Draw player avatars
        const avatar_width = 0.1;
        const avatar_height = avatar_width * aspect_ratio;
        const p1_avt_transform = super.get_transform(
            -1 + avatar_width,
            .95 - avatar_height,
            avatar_width, avatar_height
        );
        this.shapes.circle.draw(context, program_state, p1_avt_transform, this.p1_avatar_material);
        const p2_avt_transform = super.get_transform(
            1 - avatar_width,
            .95 - avatar_height,
            avatar_width, avatar_height
        );
        this.shapes.circle.draw(context, program_state, p2_avt_transform, this.p2_avatar_material);

        // Draw player label background
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

        // Draw player labels
        if (UI.player === 0) {
            this.p1_label.set_color(this.p1_color);
            this.p2_label.set_color(color(1, 1, 1, 1));
        } else {
            this.p2_label.set_color(this.p2_color);
            this.p1_label.set_color(color(1, 1, 1, 1));
        }
        this.p1_label.set_position(-0.90, 0.73, 0.001);
        this.p2_label.set_position(0.90, 0.73, 0.001);
        this.p1_label.display(context, program_state);
        this.p2_label.display(context, program_state);
    }
}

/**
 * TextLine is a wrapper for TextShape object for displaying 2d text on the screen.
 */
export class TextLine extends UI {
    /**
     * @param text -- The text to display
     * @param font -- The name of the font. "font.json" and "font.png" must be in the assets/fonts folder.
     * @param text_color -- The color of the text
     */
    constructor(text, font, text_color = color(1, 1, 1, 1)) {
        super();
        this.text = text;
        this.color = text_color;

        // Load font description json
        fetch(`assets/fonts/${font}.json`)
            .then(res => res.json())
            .then(data => {
                this.text_shape = new TextShape(data);
                this.text_texture = new Material(new defs.Textured_Phong(1), {
                    ambient: 1, diffusivity: 0, specularity: 0,
                    texture: new Texture(`assets/fonts/${font}.png`),
                });
            });
    }

    /**
     * Set the position and scale of the text.
     * @param x -- The x position of the text
     * @param y -- The y position of the text
     * @param size -- The size of the text
     */
    set_position(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    /**
     * Set the color of the text.
     * @param color -- The color of the text
     */
    set_color(color) {
        this.color = color;
    }

    /**
     * Call this function per frame.
     */
    display(context, program_state) {
        super.display(context, program_state);

        // Skip if any of the required data is not loaded or given yet
        if (this.x === undefined || this.y === undefined || this.size === undefined || !this.text_shape) return;

        this.text_shape.set_string(this.text, context.context);

        const aspect_ratio = context.width / context.height;
        let left_shift = this.text_shape.text_width / 2 * this.size;
        const transform = super.get_transform(this.x - left_shift, this.y, this.size, this.size * aspect_ratio);

        this.text_shape.draw(context, program_state, transform, this.text_texture.override({color: this.color}));
    }
}

/**
 * TestShape is a 2d shape object that can display texts with various fonts.
 */
class TextShape extends Shape {
    /**
     * @param desc -- The font description object of the sdf texture.
     */
    constructor(desc) {
        super("position", "normal", "texture_coord");

        this.set_desc(desc);
    }

    set_desc(desc) {
        this.desc = desc;
        this.texture_width = desc.common.scaleW;
        this.texture_height = desc.common.scaleH;
        this.string = "";
    }

    /**
     * Set the string to be displayed.
     * @param string -- The string to be displayed.
     * @param context -- The canvas context.
     */
    set_string(string, context) {
        // Only update if the string is different.
        if (string === this.string) return;
        this.string = string;

        // Clear the old vertices and indices.
        this.arrays.position = [];
        this.arrays.normal = [];
        this.arrays.texture_coord = [];
        this.indices = [];

        let last_id = null; // The id of the last character.
        let last_x = 0;     // The x position of the end of last character.
        let count = 0;      // The number of characters so far.

        for (const ch of string) {
            const desc = this.get_char_desc(ch);

            // Record the length of the texture coord length for trimming later.
            const tc_length = this.arrays.texture_coord.length;

            // Fetch description values.
            let id = desc.id,
                x = desc.x,
                y = desc.y,
                width = desc.width,
                height = desc.height,
                xoffset = desc.xoffset,
                yoffset = desc.yoffset,
                xadvance = desc.xadvance;

            if (last_id !== null) {
                // Apply kerning
                xoffset += this.get_kerning(last_id, id);
            }
            last_id = id;

            // Construct transformation matrix of current character
            const transform = Mat4.identity();
            // Render later characters on top of earlier ones
            transform.post_multiply(Mat4.translation(0, 0, -0.001 * count++));
            // Scale to character size
            transform.post_multiply(Mat4.scale(width / 2, height / 2, 1));
            // Move top-left corner to origin
            transform.post_multiply(Mat4.translation(1, -1, 0));
            // Move to character position
            transform.post_multiply(Mat4.translation((last_x + xoffset) / width * 2, -yoffset / height * 2, 0));

            // Create square and insert into this
            // Note: this step inserts 4 extra vertices into texture array, so we need to trim it.
            defs.Square.insert_transformed_copy_into(this, [], transform);
            this.arrays.texture_coord = this.arrays.texture_coord.slice(0, tc_length)

            // Record x position of next character
            last_x += xadvance + xoffset;
            this.text_width = last_x;

            // Construct texture coordinates
            const left = x / this.texture_width, right = (x + width) / this.texture_width;
            const top = y / this.texture_height, bottom = (y + height) / this.texture_height;
            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }

        this.copy_onto_graphics_card(context);
        // if (!this.existing) {
        //     this.copy_onto_graphics_card(context);
        //     this.existing = true;
        // } else {
        //     this.copy_onto_graphics_card(context, ["texture_coord"], false);
        // }
    }

    /**
     * Get the character description object of a character.
     * @param ch -- The character. If not found, return the description of "?".
     * @returns {Object} -- The character description object.
     */
    get_char_desc(ch) {
        const res = this.desc.chars.find((c) => c.char === ch);
        if (res === undefined) {
            return this.get_char_desc('?');
        }
        return res;
    }

    /**
     * Get the kerning value of two characters. If not found, return 0.
     * @param id1 -- The id of the first character.
     * @param id2 -- The id of the second character.
     * @returns {number}
     */
    get_kerning(id1, id2) {
        const res = this.desc.kernings.find((k) => k.first === id1 && k.second === id2);
        if (res === undefined) {
            return 0;
        }
        return res.amount;
    }
}
