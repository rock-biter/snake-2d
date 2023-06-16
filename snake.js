import { gsap } from 'gsap'
import {
	BoxGeometry,
	Mesh,
	MeshNormalMaterial,
	MeshStandardMaterial,
	Vector3,
} from 'three'

const die = new CustomEvent('die')

const d = 'd'
const u = 'u'
const l = 'l'
const r = 'r'
const DIRECTIONS = [r, l, u, d]

const baseColor = 0x250345
const alterColor = 0xff9900

export default class Snake {
	elements = []
	candies = []

	direction = 'd'
	nextTicDirection = null

	material
	geometry = new BoxGeometry(1, 1, 1, 6, 6, 6)

	scene

	uniforms = {
		uTime: { value: 0 },
	}

	constructor(scene, resolution) {
		this.scene = scene
		this.resolution = resolution

		this.init()
	}

	init() {
		this.elements = []
		this.candies = []

		// this.initMaterial()

		this.direction = DIRECTIONS.at(
			Math.floor(Math.random() * DIRECTIONS.length)
		)

		const dir = this.direction === 'r' || this.direction === 'l' ? 'x' : 'z'
		const value = this.direction === 'r' || this.direction === 'd' ? -1 : 1

		this.addElem(new Vector3(), new Vector3(1, 1, 1))
		const vec = new Vector3()
		vec[dir] += value
		this.addElem(vec)
		this.addElem(vec.clone().multiplyScalar(2))
		this.addElem(vec.clone().multiplyScalar(3))

		// console.log(this.elements.map((el) => el.position))

		// this.head.scale.set(1.1, 1.1, 1.1)
	}

	getMaterial() {
		this.material = new MeshStandardMaterial({
			color: baseColor,
			transparent: true,
			opacity: 1,
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

      varying vec4 wPosition;
      varying vec4 mPosition;
       
    `
			)

			shader.vertexShader = shader.vertexShader.replace(
				'#include <project_vertex>',
				`
        vec4 mvPosition = vec4( transformed, 1.0 );

        #ifdef USE_INSTANCING
        
          mvPosition = instanceMatrix * mvPosition;
        
        #endif
        
        wPosition = modelMatrix * mvPosition;
				mPosition = mvPosition;
        mvPosition = viewMatrix * wPosition;
        
        gl_Position = projectionMatrix * mvPosition;

    `
			)

			shader.fragmentShader = shader.fragmentShader.replace(
				'uniform float opacity;',
				`
uniform float opacity;
uniform float uTime;

varying vec4 wPosition;
varying vec4 mPosition;

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
    `
			)

			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <output_fragment>',
				`
        #include <output_fragment>

				float scale = 100.;
				float s = snoise(vec3(wPosition.xzy * 1.) + vec3(uTime * 1.5)) * 0.5 + 0.5;
				s *= 0.8;
				s -= 0.6;
        float pct = smoothstep(s - 0.2, s - 0.1, wPosition.y ) * smoothstep(s,s - 0.1, wPosition.y );
				// pct *= sin( mPosition.z * scale) * 0.5 + 0.5;
				// pct *= sin( mPosition.y * scale ) * 0.5 + 0.5;

        // gl_FragColor.a = pct * 5.;
				float r = sin(wPosition.x / 4.) * 0.5 + 0.5;
				float g = sin(-wPosition.z / 5.) * 0.5 + 0.5;
				vec3 color = vec3( 1. , 1. , 1.) ;

				gl_FragColor.rgb = mix(gl_FragColor.rgb, color, pct);

				// gl_FragColor.r = sin( wPosition.x / 5.) * 0.5 + 0.5;
				// gl_FragColor.b = sin( -wPosition.z / 5.) * 0.5 + 0.5;
				// gl_FragColor.g = cos( -wPosition.z / 5.) * 0.5 + 0.5;
				// gl_FragColor.b = sin( wPosition.y * 3.14 * 3.) * 0.5 + 0.5;

    `
			)
		}

		return this.material
	}

	addElem(position = new Vector3(0, 0, 0), scale = new Vector3(1, 1, 1)) {
		const mat = this.getMaterial()

		const mesh = new Mesh(this.geometry, mat)
		mesh.position.copy(position)

		this.elements.push(mesh)
		this.scene.add(mesh)
		mesh.scale.multiplyScalar(0.9)

		// for (let i = this.elements.length - 1; i >= 0; i--) {
		// 	const el = this.elements[i]
		// 	const scalar = 0.92 - (0.35 / this.elements.length) * i

		// 	console.log(scalar)
		// 	el.scale.copy(scale.clone().multiplyScalar(scalar))
		// }

		gsap.from(mesh.scale, { duration: 1, x: 0, y: 0, z: 0 })

		return mesh
	}

	get tail() {
		return this.elements.at(-1)
	}

	get head() {
		return this.elements.at(0)
	}

	move() {
		if (this.nextTicDirection) {
			this.direction = this.nextTicDirection
			this.nextTicDirection = null
		}

		let posToAdd = null

		this.candies.forEach((candy, i) => {
			const tailPos = this.tail.position.clone()

			if (tailPos.x === candy.position.x && tailPos.z === candy.position.z) {
				posToAdd = this.tail.position.clone()
				this.candies.splice(i, 1)
			}
		})

		// move the head
		const headNewPos = this.head.position.clone()

		switch (this.direction) {
			case r:
				if (headNewPos.x < Math.floor(this.resolution.x / 2)) {
					headNewPos.x += 1
				} else {
					headNewPos.x = -Math.floor(this.resolution.x / 2)
				}
				break
			case l:
				if (headNewPos.x > -Math.floor(this.resolution.x / 2)) {
					headNewPos.x -= 1
				} else {
					headNewPos.x = Math.floor(this.resolution.x / 2)
				}
				break
			case u:
				if (headNewPos.z > -Math.floor(this.resolution.y / 2)) {
					headNewPos.z -= 1
				} else {
					headNewPos.z = Math.floor(this.resolution.y / 2)
				}
				break
			case d:
				if (headNewPos.z < Math.floor(this.resolution.y / 2)) {
					headNewPos.z += 1
				} else {
					headNewPos.z = -Math.floor(this.resolution.y / 2)
				}
				break
		}

		for (let i = this.elements.length - 1; i > 0; i--) {
			const el = this.elements[i]

			if (el.position.distanceTo(this.head.position) === 0) {
				this.die()
				window.dispatchEvent(die)
				return
			}

			const prevEl = this.elements[i - 1]
			el.position.copy(prevEl.position)
		}

		this.head.position.copy(headNewPos)

		if (posToAdd) {
			this.addElem(posToAdd)
		}

		this.elements.forEach((el) => {
			const candy = this.candies.find(
				(candy) =>
					candy.position.x === el.position.x &&
					candy.position.z === el.position.z
			)
			if (candy) {
				el.material.color.set(alterColor)
			} else {
				el.material.color.set(baseColor)
			}
		})
	}

	eat(candy) {
		this.candies.push(candy)
		this.head.material.color.set(alterColor)
	}

	die() {
		this.elements.forEach((el) => {
			this.scene.remove(el)
			el.geometry.dispose()
		})

		this.init()
	}

	setDirection(code) {
		// console.log(code)
		switch (code) {
			case 'ArrowLeft':
			case 'KeyA':
				this.direction !== r ? (this.nextTicDirection = l) : null
				break
			case 'ArrowRight':
			case 'KeyD':
				this.direction !== l ? (this.nextTicDirection = r) : null
				break
			case 'KeyS':
			case 'ArrowDown':
				this.direction !== u ? (this.nextTicDirection = d) : null
				break
			case 'ArrowUp':
			case 'KeyW':
				this.direction !== d ? (this.nextTicDirection = u) : null
				break
		}
	}
}
