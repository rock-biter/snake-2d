import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import fontSrc from 'three/examples/fonts/helvetiker_bold.typeface.json?url'
import Snake from './snake'
import Candy from './candy'
import Grid from './grid'

let start = false
let speed = 160
let score = 0

let font
let textMesh
let bestScoreMesh

// const planeGeometry = new THREE.PlaneGeometry(...resolution, ...resolution)
// planeGeometry.rotateX(Math.PI * 0.5)
// const planeMaterial = new THREE.MeshBasicMaterial({
// 	color: 0x451245,
// 	wireframe: true,
// 	side: THREE.DoubleSide,
// 	opacity: 0.5,
// 	transparent: true,
// })

// const plane = new THREE.Mesh(planeGeometry, planeMaterial)
// plane.position.y = -0.5

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Grid
 */

const resolution = new THREE.Vector2(11, 11)
const grid = new Grid(scene, resolution)

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
	40,
	sizes.width / sizes.height,
	0.1,
	500
)

// camera.zoom = 0.9
// camera.updateProjectionMatrix()

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer()
renderer.setSize(sizes.width, sizes.height)
document.body.appendChild(renderer.domElement)

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const params = {
	threshold: 0,
	strength: 1,
	radius: 1.5,
	exposure: 1,
}

const bloomPass = new UnrealBloomPass(
	new THREE.Vector2(window.innerWidth, window.innerHeight),
	1.5,
	0.4,
	0.85
)
bloomPass.threshold = params.threshold
bloomPass.strength = params.strength
bloomPass.radius = params.radius
composer.addPass(bloomPass)

/**
 * muovo indietro la camera
 */
camera.position.set(0, resolution.y * 1.5, 10)
// camera.lookAt(new THREE.Vector3())

const controls = new MapControls(camera, renderer.domElement)
controls.enablePan = false
controls.enableRotate = false
controls.target = new THREE.Vector3(0, 0, 2)

controls.maxDistance = 50
controls.minDistance = 15

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
 * Point light
 */
const pointLight = new THREE.PointLight(0xffffff, 5)
pointLight.position.y = 10
scene.add(pointLight)

setResolution()

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
	grid.setTime(time)

	candies.forEach((c) => {
		c.uniforms.uTime.value = time
	})

	snake.candies.forEach((c) => {
		c.uniforms.uTime.value = time
	})
	snake.uniforms.uTime.value = time

	pointLight.position.x = snake.head.position.x
	pointLight.position.z = snake.head.position.z + 4

	let scale = new THREE.Vector3(1, 1, 1)

	if (textMesh) {
		textMesh.scale.lerp(scale, 0.1)
	}

	if (bestScoreMesh) {
		bestScoreMesh.scale.lerp(scale, 0.1)
	}

	controls.update()

	// renderer.render(scene, camera)
	composer.render()

	requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

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
	composer.setSize(sizes.width, sizes.height)

	setResolution()
})

const pixelRatio = Math.min(window.devicePixelRatio, 3)
renderer.setPixelRatio(pixelRatio)
composer.setPixelRatio(pixelRatio)

window.addEventListener('keydown', function (e) {
	// console.log(e.code)
	// e.code === 'Space' ? (start = !start) : null
	startGame()

	snake.setDirection(e.code)
})

function startGame() {
	if (!start) {
		start = true
	}
}

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

			grid.uniforms.uCandyPos.value = candy.position.clone()

			gsap.fromTo(
				grid.uniforms.uAnimate,
				{ value: 0.5 },
				{ duration: 1, value: 1 }
			)
			score += candy.value
			createScore()
			speed -= 1

			candy.animate()

			gsap.timeline({
				ease: 'power3.out',
				duration: 1.5,
				onComplete: () => {
					scene.remove(candy)
				},
			})
			addCandy()
		}
	})

	if (index != null) {
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
		x = Math.floor((Math.random() - 0.5) * Math.floor(resolution.x - 1))
		y = 0
		z = Math.floor((Math.random() - 0.5) * Math.floor(resolution.y - 1))

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

// addCandy()

window.addEventListener('die', reset)

// snake.move()
// console.log(snake.elements.map((el) => el.position))
// snake.move()

function reset() {
	start = false
	speed = 160

	candies.forEach((c) => {
		scene.remove(c)
	})

	candies = []

	addCandy()

	const bestScore = window.localStorage.getItem('bestScore') || 0

	console.log('best score', window.localStorage.getItem('bestScore'), score)

	if (score > bestScore) {
		window.localStorage.setItem('bestScore', score)
		createBestScore()
	}

	score = 0
	createScore()
}

const loader = new FontLoader()
loader.load(fontSrc, function (res) {
	font = res

	createScore()
	createBestScore()
})

function createScore() {
	const text = `Score:
${score} pt`

	if (textMesh) {
		scene.remove(textMesh)
	}

	textMesh = createTextGeometry(text)
	textMesh.position.z = -resolution.y / 2
	textMesh.position.x = -resolution.x / 2 + 2
	textMesh.position.y = 2
	textMesh.rotation.x = -Math.PI * 0.5

	textMesh.material.color.set(0xffffff)
	scene.add(textMesh)
}

function createBestScore() {
	let bestScore = window.localStorage.getItem('bestScore') || 0

	const text = `Best score:
${bestScore} pt`

	if (bestScoreMesh) {
		scene.remove(bestScoreMesh)
	}

	bestScoreMesh = createTextGeometry(text)
	bestScoreMesh.position.z = resolution.y / 2 + 3
	bestScoreMesh.position.x = -resolution.x / 2 + 2
	bestScoreMesh.position.y = 2
	bestScoreMesh.rotation.x = -Math.PI * 0.5
	scene.add(bestScoreMesh)
}

function createTextGeometry(text, options = {}) {
	const geometry = new TextGeometry(text, {
		font,
		size: 0.7,
		height: 0.05,
		...options,
	})

	// geometry.center()

	let mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshStandardMaterial({
			color: 0x995500,
			transparent: true,
			opacity: 0.7,
		})
	)

	mesh.scale.set(1.5, 1.5, 1.5)

	return mesh
}

function setResolution() {
	let col = Math.round(23 * (window.innerWidth / window.innerHeight))
	if (col % 2 === 0) {
		col++
	}
	col = THREE.MathUtils.clamp(col, 11, 65)

	let row = Math.round((col * window.innerHeight) / window.innerWidth)

	if (row % 2 == 0) {
		row++
	}
	row = THREE.MathUtils.clamp(row, 11, 65)

	resolution.x = col
	resolution.y = row

	grid.setResolution(resolution)

	createScore()
	createBestScore()

	const maxDim = Math.max(resolution.x, resolution.y)

	camera.position.set(0, 5 + maxDim * 1.5, 5 + maxDim * 0.5)

	snake.die()
	reset()
	// controls.target.set(0, 0, -2)
}

const prevTouch = new THREE.Vector2()
let middle = 1.55
let scale = 1

window.addEventListener('touchstart', (event) => {
	const touch = event.targetTouches[0]

	middle = THREE.MathUtils.clamp(middle, 1.45, 1.65)

	console.log(event)
	let x, y
	x = (2 * touch.clientX) / window.innerWidth - 1
	y = (2 * touch.clientY) / window.innerHeight - middle

	// if (Math.abs(x) < 0.15 && Math.abs(y) < 0.15) {
	// 	return
	// }

	startGame()

	console.log('click', x, y)

	if (x * scale > y) {
		if (x * scale < -y) {
			snake.setDirection('ArrowUp')
			scale = 3
		} else {
			snake.setDirection('ArrowRight')
			middle += y
			scale = 0.33
		}
	} else {
		if (-x * scale > y) {
			snake.setDirection('ArrowLeft')
			middle += y
			scale = 0.33
		} else {
			snake.setDirection('ArrowDown')
			scale = 3
		}
	}

	prevTouch.x = x
	prevTouch.y = y
})
