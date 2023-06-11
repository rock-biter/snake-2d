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

export default class Snake {
	elements = []
	candies = []

	direction = 'd'
	nextTicDirection = null

	material = new MeshStandardMaterial({
		color: 0x2234ff,
	})
	geometry = new BoxGeometry(1, 1, 1)

	scene

	constructor(scene, resolution) {
		this.scene = scene
		this.resolution = resolution

		this.init()
	}

	init() {
		this.elements = []
		this.candies = []

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

		console.log(this.elements.map((el) => el.position))

		this.head.scale.set(1.1, 1.1, 1.1)
	}

	addElem(
		position = new Vector3(0, 0, 0),
		scale = new Vector3(0.92, 0.92, 0.92)
	) {
		const mesh = new Mesh(this.geometry, this.material)
		mesh.position.copy(position)

		this.elements.push(mesh)
		this.scene.add(mesh)
		mesh.scale.multiplyScalar(0.95)

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
	}

	eat(candy) {
		this.candies.push(candy)
	}

	die() {
		this.elements.forEach((el) => {
			this.scene.remove(el)
			el.geometry.dispose()
		})

		this.init()
	}

	setDirection(code) {
		switch (code) {
			case 'ArrowLeft':
				this.direction !== r ? (this.nextTicDirection = l) : null
				break
			case 'ArrowRight':
				this.direction !== l ? (this.nextTicDirection = r) : null
				break
			case 'ArrowDown':
				this.direction !== u ? (this.nextTicDirection = d) : null
				break
			case 'ArrowUp':
				this.direction !== d ? (this.nextTicDirection = u) : null
				break
		}
	}
}
