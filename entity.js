import {defs, tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


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
    // place table at origin with scale_x, scale_y, scale_z with the specified materal
    constructor(material, scale_x= 2.5, scale_y = 0.5, scale_z=5){
        super();
        this.position = this.position
            .times(Mat4.scale(scale_x,scale_y,scale_z));
        this.material = material;
    }

    draw(context, program_state){
        new defs.Cube().draw(context, program_state, this.position, this.material);
    }
}

export class Obstacle extends Entity {

}

export class AimLine extends Entity {

}
