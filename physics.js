import {tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
const friction = 0.015;

export function move (entity, t) {
    if (entity.velocity !== null ) {
        let x = entity.velocity[0];
        let z = entity.velocity[1];
        let fx = friction / Math.sqrt(x * x + z * z) * x;
        let fz = friction / Math.sqrt(x * x + z * z) * z;
        
        if(x < 0) {
            x = Math.min(0, x * (1 + fx));
        }
        else if(x > 0) {
            x = Math.max(0, x * (1 - fx));
        }
        if(z < 0) {
            z = Math.min(0, z * (1 + fz));
        }
        else if(z > 0) {
            z = Math.max(0, z * (1 - fz));
        }
        entity.position = entity.position.times(Mat4.translation(x * t, 0, z * t));
        if (Math.abs(x) < friction && Math.abs(z) < friction) {
            entity.velocity = vec(0, 0);
        }
        else {
            entity.velocity = vec(x, z);
        }
        
    }
}

export function collide(entity, other) {
    // if(entity.shape)
    // assuming both are chips for now
    let v1 = entity.velocity;
    let v2 = other.velocity;
    let relativeVelocity = vec(v1[0] - v2[0], v1[1] - v2[1]);
    let collisionVector = vec(entity.get_info().x - other.get_info().x, entity.get_info().z - other.get_info().z);
    let distance = Math.sqrt(collisionVector[0] * collisionVector[0] + collisionVector[1] * collisionVector[1]);
    let collisionNorm = vec(collisionVector[0] / distance, collisionVector[1] / distance);
    let speed = relativeVelocity[0] * collisionNorm[0] + relativeVelocity[1] * collisionNorm[1];
    console.log(entity.position);

    if (speed < 0) {
        entity.velocity[0] -= speed * collisionNorm[0];
        entity.velocity[1] -= speed * collisionNorm[1];
        other.velocity[0] += speed * collisionNorm[0];
        other.velocity[1] += speed * collisionNorm[1];
    }
}