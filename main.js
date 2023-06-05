import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Snake from './snake'
import Candy from './candy'

let speed = 160
let score = 0

const resolution = new THREE.Vector2(25, 15)

const planeGeometry = new THREE.PlaneGeometry(...resolution, ...resolution)
planeGeometry.rotateX(Math.PI * 0.5)
const planeMaterial = new THREE.MeshBasicMaterial({
	color: 0x451245,
	wireframe: true,
	side: THREE.DoubleSide,
	opacity: 0.5,
	transparent: true,
})

const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.position.y = -0.5

/**
 * Scene
 */
const scene = new THREE.Scene()

scene.add(plane)

/**
 * Cube
 */
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshNormalMaterial()

// const mesh = new THREE.Mesh(geometry, material)
// scene.add(mesh)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}
/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
	60,
	sizes.width / sizes.height,
	0.1,
	30
)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer()
renderer.setSize(sizes.width, sizes.height)
document.body.appendChild(renderer.domElement)

/**
 * muovo indietro la camera
 */
camera.position.set(0, resolution.x / 2, resolution.x / 2)
// camera.lookAt(new THREE.Vector3())

const controls = new OrbitControls(camera, renderer.domElement)
controls.target = new THREE.Vector3(0, 0, 2)

/**
 * velocità di rotazione radianti al secondo
 */
const vel = 0.5

/**
 * Three js Clock
 */
const clock = new THREE.Clock()

const snake = new Snake(scene, resolution)
// scene.add(el)

console.log(snake)

let candies = []

/**
 * frame loop
 */
function animate() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	// const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dallínizio
	 */
	const time = clock.getElapsedTime()

	controls.update()

	renderer.render(scene, camera)

	requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

/**
 * animazione in ingresso del cubo
 */
function pop() {
	mesh.scale.set(0, 0)
	gsap.to(mesh.scale, { duration: 1, x: 1, y: 1 })
	gsap.to(mesh.rotation, { duration: 1, x: 3.14, y: 3.14 })
}

// pop()

/**
 * invoca la funzione pop al click sulla viewport
 */
// window.addEventListener('click', pop)

window.addEventListener('resize', () => {
	// update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// update camera
	camera.aspect = sizes.width / sizes.height
	// update projection matrix
	camera.updateProjectionMatrix()

	// update renderer
	renderer.setSize(sizes.width, sizes.height)
})

const pixelRatio = Math.min(window.devicePixelRatio, 2)
renderer.setPixelRatio(pixelRatio)

let start = false

window.addEventListener('keydown', function (e) {
	console.log(e.code)
	e.code === 'Space' ? (start = !start) : null

	snake.setDirection(e.code)
})

function tic() {
	start && snake.move()
	let index = null

	const head = snake.elements[0]

	candies.forEach((candy, i) => {
		const distance = new THREE.Vector3()
			.copy(head.position)
			.sub(candy.position)
			.length()

		if (distance === 0) {
			index = i
			snake.eat(candy)
			speed -= 1

			gsap
				.timeline({
					ease: 'power3.out',
					duration: 1.5,
					onComplete: () => {
						scene.remove(candy)
					},
				})
				.to(
					candy.position,
					{
						y: 5,
					},
					0
				)
				.to(candy.material, { opacity: 0 }, 0)
				.to(candy.scale, { x: 0.5, y: 0.5, z: 0.5 }, 0)
			addCandy()
		}
	})

	if (index) {
		candies.splice(index, 1)
		console.log(index, candies)
	}

	setTimeout(() => {
		tic()
	}, speed)
}

setTimeout(() => {
	tic()
}, speed)

// setInterval(() => {
// 	if (candies.length < 5) {
// 		addCandy()
// 	}
// }, 3000)

function addCandy() {
	let pos = new THREE.Vector3()
	let x, y, z

	do {
		x = Math.floor((Math.random() - 0.5) * (resolution.x - 1))
		y = 0
		z = Math.floor((Math.random() - 0.5) * (resolution.y - 1))

		pos.set(x, y, z)
	} while (
		snake.elements.find((el) => {
			const [a, b, c] = el.position
			return a === x && b === y && c === z
		}) ||
		candies.find((el) => {
			const [a, b, c] = el.position
			return a === x && b === y && c === z
		})
	)

	const candy = new Candy(pos)
	scene.add(candy)

	candies.push(candy)
}

addCandy()

window.addEventListener('die', reset)

// snake.move()
// console.log(snake.elements.map((el) => el.position))
// snake.move()

function reset() {
	start = false
	score = 0
	speed = 160

	candies.forEach((c) => {
		scene.remove(c)
	})

	candies = []

	addCandy()
}
