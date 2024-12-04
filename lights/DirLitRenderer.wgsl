struct VertexInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
};

struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,  // Prenos normal
};

struct FragmentInput {
    @location(0) position: vec3f,
    @location(1) texcoords: vec2f,
    @location(2) normal: vec3f,
};

struct FragmentOutput {
    @location(0) color: vec4f,
};

struct CameraUniforms {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
    position: vec3f,
};

struct LightUniforms {
    color: vec3f,
    direction: vec3f,
};

struct ModelUniforms {
    modelMatrix: mat4x4f,
    normalMatrix: mat3x3f,
};

struct MaterialUniforms {
    baseFactor: vec4f,
    uvScale: vec2f, // Add scaling for UV coordinates
    diffuse: f32,
    specular: f32,
    shininess: f32,
    unlit: f32,
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;

@group(1) @binding(0) var<uniform> model: ModelUniforms;

@group(2) @binding(0) var<uniform> material: MaterialUniforms;
@group(2) @binding(1) var baseTexture: texture_2d<f32>;
@group(2) @binding(2) var baseSampler: sampler;

@group(3) @binding(0) var<uniform> light: LightUniforms;

@vertex
fn vertex_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1);
    output.position = (model.modelMatrix * vec4(input.position, 1)).xyz;
    
    // Apply UV adjustments
    output.texcoords = vec2(input.texcoords.x, 1.0 - input.texcoords.y); // Flip Y-axis

    output.normal = model.normalMatrix * input.normal;

    return output;
}


@fragment
fn fragment_main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    
    if (material.unlit > 0.5) {
      output.color = textureSample(baseTexture, baseSampler, input.texcoords) * material.baseFactor;
      return output;  
    }
    let surfacePosition = input.position;
   
    // normalize vectors
    let N = normalize(input.normal);
    let L = normalize(-light.direction);
    let V = normalize(camera.position - surfacePosition);
    let R = normalize(reflect(-L, N));

    // diffuze component
    let lambert = max(dot(N, L), 0.0) * material.diffuse;
    // specular component
    let phong = pow(max(dot(V, R), 0.0), material.shininess) * material.specular;

    // light combination
    let diffuseLight = lambert * light.color;
    let specularLight = phong * light.color;

    // texture color and lighting
    let baseColor = textureSample(baseTexture, baseSampler, input.texcoords) * material.baseFactor;
    var finalColor = baseColor.rgb * diffuseLight + specularLight;

    // ambient light
    let amb = vec3(0.2, 0.2, 0.2);
    let ambientLight = amb * baseColor.rgb;
    finalColor += ambientLight; 

    output.color = pow(vec4(finalColor, 1), vec4(1 / 2.2));

    return output;
}
