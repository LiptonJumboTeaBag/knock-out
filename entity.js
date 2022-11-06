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
        {ambient: 1, diffusivity: 0, specularity: 0, color: color(0.2, .5, 1, 1)})

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
};
/**
 * Entity is the base class for all 3D objects in the game.
 */
export class Entity {
    constructor() {
        this.position = Mat4.identity();
        this.rotation = null;
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

    }

}

export class Ball extends Entity {

}

export class Table extends Entity {
    // place table at origin with scale_x, scale_y, scale_z with the specified materal\
    // the default shape is a cube
    constructor(material = materials.table, shape = shapes.rectangle, scale_x = 2.5, scale_y = 0.5, scale_z = 5){
        super();
        this.position = this.position
            .times(Mat4.scale(scale_x,scale_y,scale_z));
        this.material = material;
        this.shape = shape;
    }

    draw(context, program_state){
        this.shape.draw(context, program_state, this.position, this.material);
    }
}

export class Obstacle extends Entity {
    constructor(material = materials.plastic, shape = shapes.triangular_prism, scale_x = 1, scale_y = 1, scale_z = 1){
        super();
        this.position = this.position
            .times(Mat4.scale(scale_x,scale_y,scale_z))
            .times(Mat4.translation(0, 2, 0));
        this.material = material;
        this.shape = shape;
    }

    draw(context, program_state){
        this.shape.draw(context, program_state, this.position, this.material);
    }
}

export class AimLine extends Entity {

}
