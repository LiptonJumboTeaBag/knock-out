import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const phong = new defs.Phong_Shader();

const materials = {

    plastic: new Material(phong,
        {ambient: .2, diffusivity: .8, specularity: .5, color: color(.9, .5, .9, 1)}),
    metal: new Material(phong,
        {ambient: 1, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1)}),
    table: new Material(phong,
        {ambient: 0.5, diffusivity: 0.8, specularity: .6, color: color(0.9, .9, .9, 1)}),
    chip: new Material(phong,
        {ambient: 0.8, diffusivity: 0.4, specularity: 0.1, color: color(1, 1, 1, 1)}),
};

class TriangularPrism extends Shape {
    constructor() {
        super("position", "normal",);
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
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(
            0, 2 ,1, 
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
        // this.collider = new SphereCollider(this, 1);
        this.velocity = vec3(0, 0, 0);
        this.rotation = Mat4.identity();
        this.scale = Mat4.scale(scale_r,scale_y, scale_r)
        this.position = this.position.times(Mat4.translation(0, 
            scale_y, 0));
        this.material = material;
        this.shape = shape;
        this.player = player;
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
        this.position = this.position.times(Mat4.translation(x, 0, z));
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
        this.shape.draw(context, program_state, model_transform, this.material);
    }

    get_info() {
        let output = this.get_position();
        let scale = this.scale.times(vec4(1, 1, 1, 1));
        output.scale_r = scale[0];
        output.scale_y = scale[1];
        return output;
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

}

export class AimLine extends Entity {

}
