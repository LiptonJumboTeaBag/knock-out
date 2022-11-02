import {tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


/**
 * Collider detects collisions between two objects.
 */
export class Collider {
    constructor() {
        this.entity = null;
        this.scale = null; // Relative to the entity's scale
        this.offset = null; // Relative to the entity's position
        this.rotation = null; // Relative to the entity's rotation

        this.colliding = false;
    }

    /**
     * Returns true if the collider is colliding with another collider.
     * Upon collision, the onCollision() methods of this and other entities are called.
     * @param other The other collider to check.
     */
    check_collision(other) {
    }
}

export class SphereCollider extends Collider {

}

export class BoxCollider extends Collider {

}
