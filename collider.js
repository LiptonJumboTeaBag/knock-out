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
        this.type = 0;
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
    constructor() {
        super();
        this.type = 0;
    }
    check_collision(other) {
        if (other.type == 0) {
            // Sphere-sphere collision
        }
        else if (other.type == 1) {
            // Sphere-box collision
        }
        
    }


}

export class BoxCollider extends Collider {
    constructor() {
        super();
        this.type = 1;
    }
    check_collision(other) {
        if (other.type == 0) {
            // Box-sphere collision
        }
        else if (other.type == 1) {
            // Box-box collision
        }
    }

}

// sphere-sphere collision
SphereSphereCollision(sphere1, sphere2) {
    let distance = Math.sqrt(Math.pow(sphere1.x - sphere2.x, 2) + Math.pow(sphere1.y - sphere2.y, 2) + Math.pow(sphere1.z - sphere2.z, 2));
    return distance < sphere1.radius + sphere2.radius;
}

// sphere-box collision
SphereBoxCollision(sphere, box) {
    let x = Math.max(box.x - box.width, Math.min(sphere.x, box.x + box.width));
}

BoxBoxCollision(box1, box2) {
    let box1_minx;
    let box1_maxx;
    let box1_miny;
    let box1_maxy;
    let box1_minz;
    let box1_maxz;
    let box2_minx;
    let box2_maxx;
    let box2_miny;
    let box2_maxy;
    let box2_minz;
    let box2_maxz;
    return (box1_minx <= box2_maxx &&
        box1_maxx >= box2_minx &&
        box1_miny <= box2_maxy &&
        box1_maxy >= box2_miny &&
        box1_minz <= box2_maxz &&
        box1_maxz >= box2_minz);

}