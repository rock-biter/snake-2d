import { Mesh, MeshNormalMaterial, SphereGeometry, Vector3 } from 'three'

const MATERIAL = new MeshNormalMaterial({ transparent: true })
const GEOMETRY = new SphereGeometry(0.4, 10, 10)

export default class Candy extends Mesh {
	constructor(position = new Vector3()) {
		super(GEOMETRY, MATERIAL.clone())

		this.position.copy(position)
	}
}
