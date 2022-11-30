import {tiny} from './tiny-graphics/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const acceleration = -4;

export function move(entity, t) {
    if (entity.velocity !== null) {
        let velocity = entity.velocity;
        let position = entity.get_position();
        position = vec(position.x, position.z);

        // New position
        let new_position = vec(position[0] + velocity[0] * t, position[1] + velocity[1] * t);
        entity.place(new_position[0], new_position[1]);

        // New velocity
        if (velocity.norm() === 0) {
            entity.velocity = vec(0, 0);
        } else {
            let velocity_normalised = vec(velocity[0] / velocity.norm(), velocity[1] / velocity.norm());
            let new_velocity = velocity.plus(velocity_normalised.times(acceleration * t));
            entity.velocity = new_velocity;
            if (velocity.dot(new_velocity) < 0) {
                entity.velocity = vec(0, 0);
            }
        }
    }
}

export function collide(entity, other) {
    // if(entity.shape)
    // assuming both are chips for now

    let v1 = entity.velocity;
    let v2 = other.velocity;
    if (v1 == null) v1 = vec(0, 0);
    if (v2 == null) v2 = vec(0, 0);
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
