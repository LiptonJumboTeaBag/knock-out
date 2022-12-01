import {tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// Cylinder-Clyinder collision
export function CylinderCylinderCollision(cylinder1, cylinder2) {
    if (cylinder1.y == cylinder2.y) {
        let distance = Math.sqrt(Math.pow(cylinder1.x - cylinder2.x, 2)
                                + Math.pow(cylinder1.z - cylinder2.z, 2));
        return distance <= cylinder1.r + cylinder2.r;
    }
    else return false;
};

function SphereSphereCollision(sphere1, sphere2) {
    let distance = Math.sqrt(Math.pow(sphere1.x - sphere2.x, 2) 
                            + Math.pow(sphere1.y - sphere2.y, 2) 
                            + Math.pow(sphere1.z - sphere2.z, 2));
    return distance <= sphere1.r + sphere2.r;
}

// sphere-box collision
function SphereBoxCollision(sphere, box) {
    const x = Math.max(box.x - box.w/2, Math.min(sphere.x, box.x + box.w/2));
    const y = Math.max(box.y - box.h/2, Math.min(sphere.y, box.y + box.h/2));
    const z = Math.max(box.z - box.d/2, Math.min(sphere.z, box.z + box.d/2));
    const distance = Math.sqrt((x - sphere.x) * (x - sphere.x) + (y - sphere.y) * (y - sphere.y) + (z - sphere.z) * (z - sphere.z));
    return distance <= sphere.r;
}

function BoxBoxCollision(box1, box2) {
    let box1_minx = box1.x - box1.w/2;
    let box1_maxx = box1.x + box1.w/2;
    let box1_miny = box1.y - box1.h/2;
    let box1_maxy = box1.y + box1.h/2;
    let box1_minz = box1.z - box1.d/2;
    let box1_maxz = box1.z + box1.d/2;
    let box2_minx = box2.x - box2.w/2;
    let box2_maxx = box2.x + box2.w/2;
    let box2_miny = box2.y - box2.h/2;
    let box2_maxy = box2.y + box2.h/2;
    let box2_minz = box2.z - box2.d/2;
    let box2_maxz = box2.z + box2.d/2;

    return (box1_minx <= box2_maxx &&
        box1_maxx >= box2_minx &&
        box1_miny <= box2_maxy &&
        box1_maxy >= box2_miny &&
        box1_minz <= box2_maxz &&
        box1_maxz >= box2_minz);
}
/**
 * Collider detects collisions between two objects.
 */

/**
 * Note: depending on requirement, I can switch the usage of other
 * i.e. if other is preferred to be a entity, then I can switch the
 * function calls
 */
export class Collider {
    constructor(entity, type) {
        this.entity = entity;
        this.type = type;
    }
    print() {
        console.log("Collider");
    }
    check_collision(other) {
        
    }
}

export class SphereCollider extends Collider {
    constructor(entity) {
        super(entity, 0);
        this.x = entity.get_info().x;
        this.y = entity.get_info().y;
        this.z = entity.get_info().z;
        this.r = entity.get_info().scale_r;
    }
    check_collision(other) {
        if (other.type == 0) {
            // Sphere-sphere collision
            return SphereSphereCollision(this, other);
        }
        else if (other.type == 1) {
            // Sphere-box collision
            return SphereBoxCollision(this, other);
        }
        
    }


}

export class BoxCollider extends Collider {
    constructor(entity) {
        super(entity, 1);
        this.x = entity.get_info().x;
        this.y = entity.get_info().y;
        this.z = entity.get_info().z;
        this.w = entity.get_info().scale_x;
        this.h = entity.get_info().scale_y;
        this.d = entity.get_info().scale_z;
    }
    print() {
        console.log("BoxCollider");
    }
    check_collision(other) {
        if (other.type == 0) {
            // Box-sphere collision
            return SphereBoxCollision(other, this);
        }
        else if (other.type == 1) {
            // Box-box collision
            return BoxBoxCollision(this, other);
        }
    }

}

export class CylinderCollider extends Collider {
    constructor(entity) {
        super(entity, 2);
        let info = entity.get_info();
        this.x = info.x;
        this.y = info.y;
        this.z = info.z;
        this.r = info.scale_r;
        this.h = info.scale_y;

    }
    print() {
        console.log("CylinderCollider");
    }
    check_collision(other) {
        if (other.type == 0) {
            // Cylinder-sphere collision
        }
        else if (other.type == 1) {
            // Cylinder-box collision
            return SphereBoxCollision(this, other);
        }
        else if (other.type == 2) {
            // Cylinder-cylinder collision
            return CylinderCylinderCollision(this, other);
        }
    }
}