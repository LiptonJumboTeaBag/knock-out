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
        return this.get_transform_custom_cam_projection(x_offset, y_offset, width, height, UI.camera_inverse, this.projection_inverse);
    }

    get_transform_custom_cam_projection(x_offset, y_offset, width, height, camera_inverse, projection_inverse) {
        // First, get the transform of the UI in camera space.
        const transform = Mat4.identity();
        transform.post_multiply(camera_inverse);
        transform.post_multiply(projection_inverse);

        // Then, properly scale and translate the UI.
        transform.post_multiply(Mat4.translation(x_offset, y_offset, 0));
        transform.post_multiply(Mat4.scale(width, height, 1));

        return transform;
    }

    display(context, program_state) {
        this.projection_inverse = Mat4.inverse(program_state.projection_transform);
    }
}


/**
 * Displays top banner of game name.
 */
export class TopBanner extends UI {
    constructor() {
        super();

        // const background_color = hex_color("#f6f7dc", 0.65);
        // const background_fade_color = hex_color("#2e4354", 0.7);
        // const text_color = hex_color("#ffffff");
        // const text_border_color = hex_color("#2e4354", 1);

        const background_color = hex_color("#273848", 0.8);
        const background_fade_color = hex_color("#46464d", 0.6);
        const text_color = hex_color("#ffffff");
        const text_border_color = hex_color("#2e4354", 1);

        this.shapes = {
            square: new defs.Square(),
        };

        this.materials = {
            background_fade: new Material(new FadeShader(background_fade_color, 0.5, 0.8), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: background_color,
            }),
            background: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: background_color,
            }),
            lives_p1: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: hex_color("#ff2000"),
            }),
            lives_p2: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: hex_color("#0059ff"),
            }),
        };

        this.text = new TextLine('Knock-out!', "blomberg", text_color, text_border_color);
        this.text.set_position(0, .985, 0.002);
        this.text.set_extra_space(2.5);

        this._enabled = true;

        this.player1_remain = 3;
        this.player2_remain = 3;
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
    }

    set_player_remain(player, remain) {
        if (player === 0) {
            this.player1_remain = remain;
        } else {
            this.player2_remain = remain;
        }
    }

    display(context, program_state) {
        super.display(context, program_state);

        if (!this._enabled) return;

        // Draw background.
        const bg_transform = super.get_transform(0, 1.13, 1, 0.3);
        bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        this.shapes.square.draw(context, program_state, bg_transform, this.materials.background_fade);

        // Draw text.
        this.text.text = `Knock-out!`;
        this.text.display(context, program_state);

        // Draw player 1's remaining lives.
        let x = -0.945
        for (let i = 0; i < this.player1_remain; i++) {
            let tr = super.get_transform(x, 0.92, 0.008, 0.05);
            this.shapes.square.draw(context, program_state, tr, this.materials.lives_p1);
            x += 0.035;
        }

        // Draw player 2's remaining lives.
        x = 0.945
        for (let i = 0; i < this.player2_remain; i++) {
            let tr = super.get_transform(x, 0.92, 0.008, 0.05);
            this.shapes.square.draw(context, program_state, tr, this.materials.lives_p2);
            x -= 0.035;
        }
    }
}


/**
 * Displays player avatars on top corners of the screen.
 */
export class PlayerAvatar extends UI {
    constructor() {
        super();

        // Color definitions
        this.text_bg_color = hex_color("#898787", 0.6);
        this.text_border_color = hex_color("#000000", 0.6);
        this.text_border_color_select = hex_color("#000000", 0.3);
        this.text_unselect_color = hex_color("#ffffff");
        this.p1_text_color = hex_color("#fc264a");
        this.p2_text_color = hex_color("#5aa6ff");
        this.avatar_highlght_color = hex_color("#ffb300", 0.8);
        this.skybox_color = hex_color("#fefcff");

        // Player labels
        this.p1_label = new TextLine("Player 1", "roboto-black", this.text_unselect_color, this.text_border_color);
        this.p1_label_select = new TextLine("Player 1", "roboto-black", this.p1_text_color, this.text_border_color_select);
        this.p2_label = new TextLine("Player 2", "roboto-black", this.text_unselect_color, this.text_border_color);
        this.p2_label_select = new TextLine("Player 2", "roboto-black", this.p2_text_color, this.text_border_color_select);

        this.shapes = {
            cylinder: new defs.Capped_Cylinder(20, 20),  // Player's chip
            square: new defs.Square(),
            circle: new defs.Regular_2D_Polygon(25, 25),
            box: new defs.Cube(),
        }

        this.materials = {
            // Textures of player's chips
            p1_obj: new Material(new defs.Phong_Shader(), {
                ambient: 0.5,
                diffusivity: 0.8,
                specularity: 0.15,
                color: color(1, .1, .1, 1)
            }),
            p2_obj: new Material(new defs.Phong_Shader(), {
                ambient: 0.5,
                diffusivity: 0.8,
                specularity: 0.15,
                color: color(25 / 256, 109 / 256, 227 / 256, 1)
            }),
            // Background of label texts
            background: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: this.text_bg_color
            }),
            // Skybox for avatar
            skybox: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: this.skybox_color
            }),
            // Highlight border of avatar
            highlight: new Material(new defs.Phong_Shader(), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                color: this.avatar_highlght_color
            }),
        }

        // Register sub-scene drawers
        this.drawer_p1 = new SceneDrawer(256, 256, ((c, p) => this.display_player(c, p, 0)).bind(this));
        Scene2Texture.register(this.drawer_p1);
        this.materials.p1_avatar = new Material(new defs.Textured_Phong(1), {
            ambient: 1,
            texture: this.drawer_p1.texture,
        });

        this.drawer_p2 = new SceneDrawer(256, 256, ((c, p) => this.display_player(c, p, 1)).bind(this));
        Scene2Texture.register(this.drawer_p2);
        this.materials.p2_avatar = new Material(new defs.Textured_Phong(1), {
            ambient: 1,
            texture: this.drawer_p2.texture,
        });

        // Avatar drawer helper variables
        this._drawer_t1 = 0;
        this._drawer_t2 = 0;

        // Animation variables
        this._last_highlight_scale = 0;
        this._enable_highlight = true;
    }

    enable_highlight() {
        this._enable_highlight = true;
    }

    disable_highlight() {
        this._enable_highlight = false;
    }

    display_player(context, program_state, player) {
        // const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 10000);

        // Get t value for avatar animation
        const t = player === 0 ? this._drawer_t1 : this._drawer_t2;

        // Camera and lighting rotation.
        const rotate_r = 3.8;
        let cam_x = (this._enable_highlight && UI.player === player) ? rotate_r * -Math.sin(t * 2) : 0;
        let cam_y = (this._enable_highlight && UI.player === player) ? rotate_r * Math.cos(t * 2) : rotate_r;
        let light_x = (this._enable_highlight && UI.player === player) ? 6 * -Math.sin(t * 2) : 0;
        let light_y = (this._enable_highlight && UI.player === player) ? 6 * Math.cos(t * 2) : 6;
        program_state.set_camera(Mat4.look_at(vec3(cam_x, 1, cam_y), vec3(0, 0, 0), vec3(0, 1, 0)));
        program_state.lights = [new Light(vec4(light_x, 1, light_y, 1), color(1, 1, 1, 1), 1000)];

        // Display object
        let obj_tr = Mat4.identity();
        obj_tr.post_multiply(Mat4.rotation(Math.PI * 6 / 10, 1, 0, 0));
        this.shapes.cylinder.draw(context, program_state, obj_tr, player === 0 ? this.materials.p1_obj : this.materials.p2_obj);

        // Draw sky box
        let sky_tr = Mat4.identity();
        sky_tr.post_multiply(Mat4.scale(1000, 1000, 1000));
        this.shapes.box.draw(context, program_state, sky_tr, this.materials.skybox);
    }

    draw_highlight(context, program_state, tr) {
        if (!this._enable_highlight) return;

        let t = program_state.animation_time / 1000;
        const animation_time = [
            // First blink
            0, 0.3, 0.3, 0.55, 0.6,
            // Second blink
            0.8, 0.8, 1., 1.9
        ];
        const period = animation_time[animation_time.length - 1];
        t %= period;

        const ease_out = (x) => 1 - Math.pow(1 - x, 4);
        const ease_in = (x) => Math.pow(x, 4);

        let factor;
        if (t >= animation_time[0] && t < animation_time[1]) {
            // Expand
            let x = (t - animation_time[0]) / (animation_time[1] - animation_time[0])
            factor = ease_out(x);
            this._last_highlight_scale = factor;
        } else if (t >= animation_time[1] && t < animation_time[2]) {
            // Stay
            factor = this._last_highlight_scale;
        } else if (t >= animation_time[2] && t < animation_time[3]) {
            // Shrink
            let x = (t - animation_time[2]) / (animation_time[3] - animation_time[2])
            factor = 1 - ease_out(x);
            this._last_highlight_scale = factor;
        } else if (t >= animation_time[3] && t < animation_time[4]) {
            // Stay
            factor = this._last_highlight_scale;
        } else if (t >= animation_time[4] && t < animation_time[5]) {
            // Expand
            let x = (t - animation_time[4]) / (animation_time[5] - animation_time[4])
            factor = ease_out(x);
            this._last_highlight_scale = factor;
        } else if (t >= animation_time[5] && t < animation_time[6]) {
            // Stay
            factor = this._last_highlight_scale;
        } else if (t >= animation_time[6] && t < animation_time[7]) {
            // Shrink
            let x = (t - animation_time[6]) / (animation_time[7] - animation_time[6])
            factor = 1 - ease_out(x);
            this._last_highlight_scale = factor;
        } else if (t >= animation_time[7] && t < animation_time[8]) {
            // Stay
            factor = this._last_highlight_scale;
        }

        const scale_min = 1, scale_max = 1.1;
        const scale = scale_min + (scale_max - scale_min) * factor;

        tr.post_multiply(Mat4.scale(scale, scale, 1));
        this.shapes.circle.draw(context, program_state, tr, this.materials.highlight);
    }

    display(context, program_state) {
        super.display(context, program_state);
        const aspect_ratio = context.width / context.height;

        // Update drawer t value
        const dt = program_state.animation_delta_time / 1000;
        if (UI.player === 0) {
            this._drawer_t1 += dt;
            this._drawer_t1 %= 2 * Math.PI;
            this._drawer_t2 = 0;
        } else {
            this._drawer_t2 += dt;
            this._drawer_t2 %= 2 * Math.PI;
            this._drawer_t1 = 0;
        }

        // Draw player avatars
        const avatar_scale = 0.77;
        const avatar_width = 0.1 * avatar_scale;
        const avatar_height = avatar_width * aspect_ratio;
        const p1_avt_transform = super.get_transform(
            -0.99 + avatar_width,
            0.84 - avatar_height,
            avatar_width, avatar_height
        );
        p1_avt_transform.post_multiply(Mat4.scale(avatar_scale, avatar_scale, 1));
        this.shapes.circle.draw(context, program_state, p1_avt_transform, this.materials.p1_avatar);
        if (UI.player === 0) {
            this.draw_highlight(context, program_state, p1_avt_transform);
        }

        const p2_avt_transform = super.get_transform(
            0.99 - avatar_width,
            0.84 - avatar_height,
            avatar_width, avatar_height
        );
        p2_avt_transform.post_multiply(Mat4.scale(avatar_scale, avatar_scale, 1));
        this.shapes.circle.draw(context, program_state, p2_avt_transform, this.materials.p2_avatar);
        if (UI.player === 1) {
            this.draw_highlight(context, program_state, p2_avt_transform);
        }

        // Abandon drawing player labels
        // Draw player label background
        // const label_text_size = 0.017;
        // const p1_label_bg_transform = super.get_transform(
        //     -.90,
        //     .69,
        //     label_text_size * 0.7 * 7,
        //     label_text_size * aspect_ratio * 1.5
        // );
        // p1_label_bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        // this.shapes.square.draw(context, program_state, p1_label_bg_transform, this.materials.background);
        // const p2_label_bg_transform = super.get_transform(
        //     .90,
        //     .69,
        //     label_text_size * 0.7 * 7,
        //     label_text_size * aspect_ratio * 1.5
        // );
        // p2_label_bg_transform.post_multiply(Mat4.translation(0, 0, 0.01));
        // this.shapes.square.draw(context, program_state, p2_label_bg_transform, this.materials.background);
        //
        // Draw player labels
        // this.p1_label.set_position(-0.90, 0.72, 0.0008);
        // this.p1_label_select.set_position(-0.90, 0.72, 0.0008);
        // this.p2_label.set_position(0.90, 0.72, 0.0008);
        // this.p2_label_select.set_position(0.90, 0.72, 0.0008);
        //
        // if (UI.player === 0) {
        //     this.p1_label_select.display(context, program_state);
        //     this.p2_label.display(context, program_state);
        // } else {
        //     this.p1_label.display(context, program_state);
        //     this.p2_label_select.display(context, program_state);
        // }
    }
}


/**
 * Super class for UI Animations
 */
export class UIAnimation extends UI {
    constructor() {
        super();

        this.start_time = 0;
        this.started = false;
    }

    start() {
        this.start_time = this.time_now;
        this.started = true;
    }

    end() {
        this.started = false;
    }

    display(context, program_state) {
        super.display(context, program_state);
        this.time_now = program_state.animation_time / 1000;
    }
}


/**
 * Animates "Game!" text when game ends
 */
export class GameAnimation extends UIAnimation {
    constructor() {
        super();

        this.text_p1 = new TextLine('Game!', "gentleman", hex_color("#f82e4c"), hex_color("#ffffff"));
        this.text_p2 = new TextLine('Game!', "gentleman", hex_color("#2f8ff9"), hex_color("#ffffff"));
        this.text_p3 = new TextLine('DRAW', 'gentleman', hex_color("#808080"), hex_color("#ffffff"));
        this.text = this.text_p1;
    }

    set_winner(player) {
        if (player === 0) {
            this.text = this.text_p1;
        } else if (player === 1) {
            this.text = this.text_p2;
        } else if (player === 2) {
            this.text = this.text_p3;
        }
        // this.text = player === 0 ? this.text_p1 : this.text_p2;
    }

    display(context, program_state) {
        super.display(context, program_state);

        if (!this.started) return;

        const dt = this.time_now - this.start_time;

        const ease_func = (x) => 1.03 * (1 - Math.pow(2, -5 * x));

        const end_time = 1.5;

        let scale;
        if (dt < end_time) {
            scale = 0.1 + 0.9 * ease_func(dt / end_time);
        } else {
            scale = 1 + Math.sin((dt - end_time) * 3) * 0.02;
        }

        this.text.set_position(0, 0.25, 0.005 * scale);
        this.text.display(context, program_state);
    }
}


/**
 * Animate "Red/Blue's Turn" text in each turn
 */
export class TurnAnimation extends UIAnimation {
    constructor() {
        super();

        const font = "roboto-blackItalic";

        this.text_p1 = new TextLine("Red's Turn", font, hex_color("#ff556f"), hex_color("#ffffff"));
        this.text_p1.set_extra_space(0.5);
        this.text_p2 = new TextLine("Blue's Turn", font, hex_color("#5aa6ff"), hex_color("#ffffff"));
        this.text_p2.set_extra_space(0.5);

        this.parallelogram = new defs.Parallelogram(0.01);
        this.bg_material = new Material(new defs.Phong_Shader(), {
            ambient: 1,
            color: hex_color("#ffffff")
        });
    }

    display(context, program_state) {
        super.display(context, program_state);
        if (!this.started) return;

        const t = this.time_now - this.start_time;

        // Helper functions
        const prefix_sum = (arr, i) => arr.slice(0, i + 1).reduce((a, b) => a + b, 0);
        const ease_in = (x) => 1.07 * (1 - Math.pow(1 - 0.6 * x, 3));
        const ease_out = (x) => Math.pow(0.6 * x + 0.4, 3);

        // Configure animation
        const timeline_pos = [
            0.5,  // Move in
            1,    // Slides to right
            0.5,  // Move out
        ];
        const timeline_alpha = [
            0.3,  // Fade in
            1.4,  // Keep
            0.3,  // Fade out
        ];
        const low_alpha = 0;
        const factor = 0.3;
        const factor_banner = 1

        let left_text = -0.4 * factor;
        let slide_left_text = -0.1 * factor;
        let left_banner = -2.2 * factor_banner;
        let slide_left_banner = -0 * factor_banner;

        // Calculate pos
        let text_pos, upper_banners_pos, lower_banners_pos;
        if (t < prefix_sum(timeline_pos, 0)) {
            text_pos = left_text + (slide_left_text - left_text) * ease_in(t / prefix_sum(timeline_pos, 0));
            upper_banners_pos = left_banner + (slide_left_banner - left_banner) * ease_in(t / prefix_sum(timeline_pos, 0));
            lower_banners_pos = -upper_banners_pos;
        } else if (t < prefix_sum(timeline_pos, 1)) {
            let dist = -2 * slide_left_text + 0.02 * factor;
            text_pos = slide_left_text + dist * (t - prefix_sum(timeline_pos, 0)) / timeline_pos[1];
            let dist2 = -2 * slide_left_banner + 0.02 * factor_banner;
            upper_banners_pos = slide_left_banner + dist2 * (t - prefix_sum(timeline_pos, 0)) / timeline_pos[1];
            lower_banners_pos = -upper_banners_pos;
        } else if (t < prefix_sum(timeline_pos, 2)) {
            text_pos = -slide_left_text + (-left_text + slide_left_text) * (ease_out((t - prefix_sum(timeline_pos, 1)) / timeline_pos[2]));
            upper_banners_pos = -slide_left_banner + (-left_banner + slide_left_banner) * (ease_out((t - prefix_sum(timeline_pos, 1)) / timeline_pos[2]));
            lower_banners_pos = -upper_banners_pos;
        } else {
            return;
        }

        // Calculate alpha
        let alpha;
        if (t < prefix_sum(timeline_alpha, 0)) {
            alpha = low_alpha + (1 - low_alpha) * ease_in(t / prefix_sum(timeline_alpha, 0));
        } else if (t < prefix_sum(timeline_alpha, 1)) {
            alpha = 1;
        } else if (t < prefix_sum(timeline_alpha, 2)) {
            alpha = 1 - (1 - low_alpha) * ease_out((t - prefix_sum(timeline_alpha, 1)) / timeline_alpha[2]);
        } else {
            return;
        }

        const text = UI.player === 0 ? this.text_p1 : this.text_p2;
        text.set_alpha(alpha);
        text.set_position(text_pos, 0.08, 0.002);
        text.display(context, program_state);

        let tr = super.get_transform(upper_banners_pos, 0.18, 1.2, .06);
        this.parallelogram.draw(context, program_state, tr, this.bg_material.override({color: UI.player === 0 ? hex_color("#ff2000") : hex_color("#0059ff")}));
        tr = super.get_transform(lower_banners_pos, -0.18, 1.2, .06);
        this.parallelogram.draw(context, program_state, tr, this.bg_material.override({color: UI.player === 0 ? hex_color("#ff2000") : hex_color("#0059ff")}));
        tr = super.get_transform(0, 0, 1.2, .12);
        this.parallelogram.draw(context, program_state, tr, this.bg_material.override({color: hex_color("#ffffff", alpha)}));
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
     * @param background_color -- The color of the background
     */
    constructor(text, font, text_color = color(1, 1, 1, 1), background_color = color(0, 0, 0, 0)) {
        super();
        this.text = text;
        this.color = text_color;
        this.extra_space = 0;

        this.shader = new SdfFontShader(background_color);

        // Load font description json
        fetch(`assets/fonts/${font}.json`)
            .then(res => res.json())
            .then(data => {
                this.text_shape = new TextShape(data);
                this.text_texture = new Material(this.shader, {
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
     * Set background color of the text.
     * @param color -- The color of the background
     */
    set_bg_color(color) {
        this.shader.bg_color = color;
    }

    /**
     * Set alpha of the text.
     * @param alpha -- The alpha of the text
     */
    set_alpha(alpha) {
        this.color[3] = alpha;
        this.shader.bg_color[3] = alpha;
    }

    /**
     * Set extra spacing between characters.
     * @param extra_space -- The extra spacing between characters
     */
    set_extra_space(extra_space) {
        this.extra_space = extra_space;
    }

    /**
     * Call this function per frame.
     */
    display(context, program_state) {
        super.display(context, program_state);

        // Skip if any of the required data is not loaded or given yet
        if (this.x === undefined || this.y === undefined || this.size === undefined || !this.text_shape) return;

        this.text_shape.set_string(this.text, context.context, this.extra_space);

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
     * @param extra_space -- The extra space between characters.
     */
    set_string(string, context, extra_space = 0) {
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
                xoffset += extra_space;
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


/**
 * Customized Phong shader for SDF text rendering. Supports overwriting the color of the text.
 */
class SdfFontShader extends defs.Textured_Phong {
    constructor(bg_color = color(0, 0, 0, 0)) {
        super();

        this.bg_color = bg_color;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
                varying vec2 f_tex_coord;
                uniform sampler2D texture;
                uniform vec4 bg_color;
        
                void main() {
                    // Sample the texture image in the correct place:
                    vec4 tex_color = texture2D( texture, f_tex_coord );
                    if (tex_color.a < 0.01) discard;
                    
                    // Calculate the correct color of SDF text.
                    float alpha = smoothstep(0., 1., tex_color.a);
                    if (tex_color.a < 0.45) 
                        alpha = 0.0;
                    
//                    gl_FragColor = mix(bg_color, vec4(shape_color.rgb, 1.), alpha);
                    if (tex_color.a < .5)
                        gl_FragColor = mix(bg_color, vec4(shape_color.rgb, 1.), alpha);
                    else
                        gl_FragColor = shape_color;
                  } `;
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        super.update_GPU(context, gpu_addresses, gpu_state, model_transform, material);

        // Send bg_color to GPU
        context.uniform4fv(gpu_addresses.bg_color, this.bg_color);
    }
}


class FadeShader extends Shader {
    constructor(mix_color, pos_percent = 0.4, max_percent = 0.8) {
        super();

        this.pos_percent = pos_percent;
        this.mix_color = mix_color;
        this.max_percent = max_percent;
    }

    shared_glsl_code() {
        return `
            precision mediump float;
            varying vec4 point_position;
            varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            attribute vec3 position;
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
            
            void main(){
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                point_position = model_transform * vec4(position, 1.0);
                center = model_transform * vec4(0, 0, 0, 1); 
            }`;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            uniform vec4 shape_color;
            uniform vec4 mix_color;
            uniform float pos_percent;
            uniform float max_percent;
    
            void main(){
                float dist = distance(point_position, center);
                vec4 color = shape_color;
                if (dist > pos_percent) {
                    color = mix(shape_color, mix_color, (dist - pos_percent) / (max_percent - pos_percent));
                }
                gl_FragColor = color;
            }`;
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        super.update_GPU(context, gpu_addresses, gpu_state, model_transform, material);

        // Send info to GPU
        context.uniform1f(gpu_addresses.pos_percent, this.pos_percent);
        context.uniform1f(gpu_addresses.max_percent, this.max_percent);

        // Send proj_cam matrix
        const [P, C, M] = [gpu_state.projection_transform, gpu_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Send color
        context.uniform4fv(gpu_addresses.shape_color, material.color);
        context.uniform4fv(gpu_addresses.mix_color, this.mix_color);
    }
}
