import { CylinderCollider, BoxCollider, SphereCollider } from './collider.js';
import {defs, tiny} from './tiny-graphics/common.js';

const {Textured_Phong} = defs
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture, Canvas_Widget, Code_Widget, Text_Widget, Runtime_Widget
} = tiny;

const phong = new defs.Phong_Shader();

const materials = {
    plastic: new Material(phong,
        {ambient: .2, diffusivity: .8, specularity: .5, color:hex_color("#ffaf15") }), // hex_color("#6f432a")
    metal: new Material(phong,
        {ambient: 1, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1)}),
    table: new Material(phong,
        {ambient: 0.5, diffusivity: 0.8, specularity: .6, color: color(0.9, .9, .9, 1)}),
    chip: new Material(phong,
        {ambient: 0.6, diffusivity: 0.6, specularity: 0.5, color: color(1, 1, 1, 1)}),
    skybox: new Material(phong,
        {ambient: 0.7, diffusivity: 0, specularity: 0, color: hex_color("#436cc1")}),
    thonk: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        texture: new Texture("assets/thonk.jpg", "LINEAR_MIPMAP_LINEAR")
    }),
    cloud: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // picture from https://opengameart.org/node/11731
        texture: new Texture("assets/bluecloud_up.jpg", "LINEAR_MIPMAP_LINEAR"),color: color(0,0,0,1)
    }),
    wood: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://opengameart.org/node/8721
        texture: new Texture("assets/wood4.png", "LINEAR_MIPMAP_LINEAR"), color: color(0,0,0,1)
    }),
    woodtiles: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://opengameart.org/content/handpainted-wood
        texture: new Texture("assets/woodtiles.png", "LINEAR_MIPMAP_LINEAR"), color: color(0,0,0,1)
    }),
    woodfloor: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://www.pinterest.com/pin/331788697538463479/
        texture: new Texture("assets/woodfloor.jpg", "LINEAR_MIPMAP_LINEAR"), color: color(0.1,0.05,0,1)
    }),
    pooltable: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://www.reddit.com/r/blender/comments/4kqybq/my_latest_render_pool_table_scene_thoughts/
        texture: new Texture("assets/pooltable.jpg", "LINEAR_MIPMAP_LINEAR"), color: color(0.1,0.05,0,1)
    }),
    water: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://depositphotos.com/24216433/stock-photo-seamless-water-texture.html
        texture: new Texture("assets/water.jpg", "LINEAR_MIPMAP_LINEAR"), color: color(0.1,0.05,0,1)
    }),
    ice: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://www.pixelstalk.net/free-download-ice-backgrounds/
        texture: new Texture("assets/ice.jpg", "LINEAR_MIPMAP_LINEAR"), color: color(0.1,0.05,0,1)
    }),
    galaxy: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://photographylife.com/landscapes/how-to-photograph-the-milky-way
        texture: new Texture("assets/galaxy.jpg", "LINEAR_MIPMAP_LINEAR"), color: color(0.1,0.05,0,1)
    }),
    whiteice: new Material(new Textured_Phong(), {
        ambient: 1, diffusivity: 0.1, specularity: 0.1,
        // https://pxhere.com/en/photo/1279940
        texture: new Texture("assets/whiteice.jpg", "LINEAR_MIPMAP_LINEAR"), color: color(0.1,0.05,0,1)
    }),
};

class TriangularPrism extends Shape {
    constructor() {
        super("position", "normal","texture_coord");
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [0, -1, 1], [1, -1, -1],
            [-1, -1, -1], [-1, 1, -1], [0, 1, 1], [0, -1, 1],
            [0, -1, 1], [1, -1, -1], [1, 1, -1], [0, 1, 1],
            [-1, 1, -1], [1, 1, -1], [1, -1, -1], [-1, -1, -1],
            [-1, 1, -1], [0, 1, 1], [1, 1, -1],
        );
        this.arrays.normal = Vector3.cast(
            [0,-5, 0], [0,-5, 0], [0,-5, 0],
            [-2, 0, 1],[-2, 0, 1],[-2, 0, 1],[-2, 0, 1],
            [2, 0, 1],[2, 0, 1],[2, 0, 1],[2, 0, 1],
            [0, 0, -5],[0, 0, -5],[0, 0, -5],[0, 0, -5],
            [0, 5, 0],[0, 5, 0],[0, 5, 0],
            );
        this.arrays.texture_coord = Vector.cast(
            [0, 0], [0, 1], [1, 0],
            [0, 0], [0, 1], [1, 1], [1, 0],
            [0, 0], [0, 1], [1, 1], [1, 0],
            [0, 0], [0, 1], [1, 1], [1, 0],
            [0, 0], [0, 1], [1, 0],
        );



        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(
            0, 2, 1,
            3, 5, 4, 3, 6, 5,
            7, 8, 9, 7, 9, 10,
            11, 12, 13, 11, 13, 14,
            15, 16, 17,
        );
    }
}

const shapes = {
    rectangle: new defs.Cube(),
    triangular_prism: new TriangularPrism(),
    cylinder: new defs.Capped_Cylinder(20, 20),
    box: new defs.Cube(),
};
/**
 * Entity is the base class for all 3D objects in the game.
 */
export class Entity {
    constructor() {
        this.position = Mat4.identity();
        this.rotation = Mat4.identity();
        this.scale = Mat4.identity();
        this.velocity = null;
        this.collider = null;
        this.material = null;
        this.textureNum = 0;

        this.is_static = false; // If true, the entity will not move.
    }

    /**
     * Callback when the entity collides with another entity.
     * Triggered by the assigned collider.
     * @param other The other entity that collided with this entity.
     */
    onCollision(other) {

    }

    /**
     * Update the entity's position and velocity.
     * @param delta_time The time since the last update.
     */
    update(delta_time) {

    }

    /**
     * Draw the entity as 3D objects.
     */
    draw(context, program_state) {
        const model_transform = this.position.times(this.rotation).times(this.scale);
        this.shape.draw(context, program_state, model_transform, this.material);
    }

    /*
        * Return the entity's position.
    */
    get_position() {
        let pos = this.position.times(vec4(0, 0, 0, 1));
        return {x: pos[0], y: pos[1], z: pos[2]};
    }


    // returns positional information of the entity
    get_info() {
        return this.get_position();
    }

}

export class Chip extends Entity {
    constructor(player = null, default_pos = null, material = materials.chip, shape = shapes.cylinder, scale_r = 0.5, scale_y = 1/4) {
        super();
        this.collider = new CylinderCollider(this);
        this.velocity = vec(0, 0);
        this.rotation = Mat4.identity();
        this.scale = Mat4.scale(scale_r, scale_y, scale_r);
        this.position = this.position.times(Mat4.translation(0,
            scale_y, 0));
        this.material = material;
        this.shape = shape;
        this.player = player;
        this.selected = false;
        this.scale_y = scale_y;
        switch (player) {
            case "player1":
                this.material = this.material.override({color: color(1, .1, .1, 1)});
                break;
            case "player2":
                this.material = this.material.override({color: color(25 / 256, 109 / 256, 227 / 256, 1)});
                break;
        };
        switch (default_pos) {
            case 1:
                this.place(0, 4);
                break;
            case 2:
                this.place(2, 4);
                break;
            case 3:
                this.place(-2, 4);
                break;
            case 4:
                this.place(0, -4);
                break;
            case 5:
                this.place(2, -4);
                break;
            case 6:
                this.place(-2, -4);
                break;
        }
    }

    place(x, z) {
        this.position = Mat4.identity().times(Mat4.translation(x, this.scale_y, z));
    }

    update(delta_time) {
        this.position = this.position.times(Mat4.translation(this.velocity.times(delta_time)));
        this.rotation = this.rotation.times(Mat4.rotation(delta_time, vec3(0, 1, 0)));
    }

    draw(context, program_state) {
        const model_transform = this.position
            .times(Mat4.scale(1, 2, 1))
            .times(this.rotation)
            .times(this.scale)
            .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
        this.shape.draw(context, program_state, model_transform, this.material.override({color: this.selected ? hex_color("#e5f200") : this.material.color}));
    }

    get_info() {
        let output = this.get_position();
        let scale = this.scale.times(vec4(1, 1, 1, 1));
        output.scale_r = scale[0];
        output.scale_y = scale[1];
        return output;
    }
    set_color() {
        if (this.player === "player1") {
            this.material = this.material.override({color: color(1, .1, .1, 1)});
        }
        else if (this.player === "player2") {
            this.material = this.material.override({color: color(25 / 256, 109 / 256, 227 / 256, 1)});
        }
    }
    change_texture() {
        this.textureNum = (this.textureNum + 1) % 3;
        switch (this.textureNum) {
            case 0:
                this.material = materials.chip;
                this.set_color();

                break;
            case 1:
                this.material = materials.galaxy;
                break;
            case 2:
                this.material = materials.thonk;
                this.set_color();
                break;
        }
    }
    texture_reset() {
        this.textureNum = 0;
        this.material = materials.chip;
        this.set_color();
    }

}

export class Table extends Entity {
    // place table at origin with scale_x, scale_y, scale_z with the specified materal\
    // the default shape is a cube
    constructor(material = materials.table, shape = shapes.rectangle, scale_x = 3, scale_y = 0.5, scale_z = 5){
        super();
        this.scale = Mat4.scale(scale_x, scale_y, scale_z)
        this.material = material;
        this.position = this.position.times(Mat4.translation(0, -scale_y, 0));
        this.shape = shape;
    }

    get_info() {
        let output = this.get_position();
        let scale = this.scale.times(vec4(1, 1, 1, 1));
        output.scale_x = scale[0];
        output.scale_y = scale[1];
        output.scale_z = scale[2];
        return output;
    }

    draw(context, program_state) {
        this.shape.arrays.texture_coord.forEach(
            // (v, i, l) => l[i] = vec(5*v[1], 3*v[0])
            // (v, i, l) => l[i] = vec(v[0], 2*v[1])
            // (v, i, l) => l[i] = vec(v[1], v[0])
             (v, i, l) => l[i] = vec(v[0], v[1])
            // (v, i, l) => l[i] = vec(3/2*v[0], 3/2*v[1])
        )
        const model_transform = this.position.times(this.rotation).times(this.scale);
        this.shape.draw(context, program_state, model_transform, this.material);
    }
    change_texture() {
        this.textureNum ++;
        this.textureNum %= 3;
        switch (this.textureNum) {
            case 2:
                this.material = materials.ice;
                break;
            case 1:
                this.material = materials.water;
                break;
            case 0:
                this.material = materials.table;
                break;
        }
    }
    texture_reset() {
        this.textureNum = 0;
        this.material = materials.table;
    }
}

export class Obstacle extends Entity {
    constructor(config=null, material = materials.plastic, shape = shapes.triangular_prism, scale_x = 2, scale_z = 1/2, scale_y = 1/4){
        super();
        this.material = material;
        this.shape = shape;
        this.scale = Mat4.scale(scale_x, scale_y, scale_z)
        this.position = this.position.times(Mat4.translation(0, scale_y, 0));
        if (config == 'left'){
            this.left();
        }
        else if (config == 'right'){
            this.right();
        }
    
    }

    place_obstacle(x, z, angle, ){
        this.position = this.position.times(Mat4.translation(x, 0, z))
        this.rotation = Mat4.rotation(angle, 0, 1, 0);
    }

    left(){
        this.place_obstacle(-2.5, 0, Math.PI/2);
    }

    right(){
        this.place_obstacle(2.5, 0, Math.PI*3/2);
    }

    get_info() {
        let output = this.get_position();
        let scale = this.scale.times(vec4(1, 1, 1, 1));
        output.scale_x = scale[0];
        output.scale_y = scale[1];
        output.scale_z = scale[2];
        return output;
    }

    change_texture() {
        this.textureNum ++;
        this.textureNum %= 2;
        switch (this.textureNum) {
            case 1:
                this.material = materials.woodfloor;
                break;
            case 0:
                this.material = materials.plastic;
                break;
        }
    }
    texture_reset() {
        this.textureNum = 0;
        this.material = materials.plastic;
    }

}

export class SkyBox extends Entity {
    constructor(material = materials.skybox, shape = shapes.box, scale_x = 100, scale_y = 100, scale_z = 100) {
        super();
        this.scale = Mat4.scale(scale_x, scale_y, scale_z)
        this.material = material;
        this.shape = shape;
    }

    draw(context, program_state) {
        const model_transform = Mat4.identity()
            .times(this.scale)
            .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
        this.shape.draw(context, program_state, model_transform, this.material);
    }

    change_texture() {
        this.textureNum ++;
        this.textureNum %= 2;
        switch (this.textureNum) {
            case 1:
                this.material = materials.whiteice;
                break;
            case 0:
                this.material = materials.skybox;
                break;
        }
    }
    texture_reset() {
        this.textureNum = 0;
        this.material = materials.skybox;
    }
}
