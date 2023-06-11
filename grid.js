import {
	Color,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
	Vector2,
	Vector3,
} from 'three'

export default class Grid {
	uniforms = {
		uTime: { value: 0 },
		uCandyPos: { value: new Vector3() },
		uAnimate: { value: 1 },
		uRes: { value: new Vector2() },
	}

	constructor(scene, resolution = new Vector2(10, 10)) {
		this.scene = scene
		this.resolution = resolution
		this.uniforms.uRes.value = resolution.clone().multiplyScalar(0.5)

		this.createGeometry()
		this.createMaterial()

		this.mesh = new Mesh(this.geometry, this.material)
		this.mesh.position.y = -0.5
		this.scene.add(this.mesh)
	}

	setTime(time) {
		this.uniforms.uTime.value = time
	}

	createGeometry() {
		const r = this.resolution.clone().multiplyScalar(5)
		this.geometry = new PlaneGeometry(...r, ...r)
		this.geometry.rotateX(-Math.PI * 0.5)
	}

	createMaterial() {
		this.material = new MeshStandardMaterial({
			color: new Color(0x451245),
			wireframe: true,
			transparent: true,
		})

		this.material.onBeforeCompile = (shader) => {
			shader.uniforms = {
				...shader.uniforms,
				...this.uniforms,
			}

			shader.vertexShader = shader.vertexShader.replace(
				'#include <common>',
				`
      #include <common>
      uniform float uTime;
      uniform float uAnimate;
      uniform vec3 uCandyPos;
      uniform vec2 uRes;

      varying float distance;
      varying vec2 vPos;

       
    `
			)

			shader.vertexShader = shader.vertexShader.replace(
				'#include <project_vertex>',
				`
        vec4 mvPosition = vec4( transformed, 1.0 );

        #ifdef USE_INSTANCING
        
          mvPosition = instanceMatrix * mvPosition;
        
        #endif
        
        vec4 wPosition = modelMatrix * mvPosition;

        
        distance = length(uCandyPos - wPosition.xyz);
        vPos = vec2(wPosition.xz);

        wPosition.y += sin( ( distance * 0.3 - uTime * 15.) ) *  0.1 * sin(uAnimate * 3.14 ) * smoothstep(20., 0., distance);
        mvPosition = viewMatrix * wPosition;
        
        gl_Position = projectionMatrix * mvPosition;

    `
			)

			shader.fragmentShader = shader.fragmentShader.replace(
				'uniform float opacity;',
				`
uniform float opacity;
uniform float uTime;
uniform float uAnimate;
uniform vec2 uRes;

varying float distance;
varying vec2 vPos;
    `
			)

			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <output_fragment>',
				`
        #include <output_fragment>
        float pct = ( sin( ( distance * 0.3 - uTime * 15.) ) * 0.5 + 0.5 ) * sin(uAnimate * 3.14 ) * smoothstep(20., 0., distance);
        
        float ox = 1.;
        float oz = 1.;
        float o = 1.;

        ox *= 1.0 - step(abs(uRes.x) + 0.05, abs(vPos.x) );
        oz *= 1.0 - step(abs(uRes.y) + 0.05, abs(vPos.y) );
        ox -= 1.0 - step(abs(uRes.x) - 0.05, abs(vPos.x) );
        oz -= 1.0 - step(abs(uRes.y) - 0.05, abs(vPos.y) );

        o = (1.- oz) * (1. - ox);
        
        
        gl_FragColor = mix( gl_FragColor,vec4( vec3(.2,0.1,0.9), opacity), pct * pct * pct  );
        gl_FragColor.a = mix(1.,0.15,o);

    `
			)

			console.log(shader.fragmentShader)
		}
	}
}
