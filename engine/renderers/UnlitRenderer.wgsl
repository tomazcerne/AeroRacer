struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(1) texcoords: vec2f,
};

struct FragmentInput {
    @location(1) texcoords: vec2f,
};

struct FragmentOutput {
    @location(0) color: vec4f,
};

struct CameraUniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
};

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat3x3f,
};

struct MaterialUniforms {
    baseFactor: vec4f,
    uvScale: vec2f, // Add scaling for UV coordinates
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;

@group(1) @binding(0) var<uniform> model: ModelUniforms;

@group(2) @binding(0) var<uniform> material: MaterialUniforms;
@group(2) @binding(1) var baseTexture: texture_2d<f32>;
@group(2) @binding(2) var baseSampler: sampler;

@vertex
fn vertex_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.position = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1);

    // Apply UV adjustments
    output.texcoords = vec2(input.texcoords.x, 1.0 - input.texcoords.y); // Flip Y-axis

    return output;
}


@fragment
fn fragment_main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // Sample the texture using the scaled UV coordinates
    output.color = textureSample(baseTexture, baseSampler, input.texcoords) * material.baseFactor;

    return output;
}
