import * as THREE from "three";
import { Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry";

export type Coordinate = {
  x: number;
  y: number;
  z: number;
};

export class Block extends THREE.Mesh {
  private cubeMaterials = [
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
  ].map(
    (color) =>
      new THREE.MeshPhysicalMaterial({
        color,
        transparent: false,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
  );
  private block: THREE.Mesh;
  private highlightLines: THREE.LineSegments;
  private readonly _initialCoordinate: Vector3;
  public currentCoordinate: Vector3;

  constructor({
    blockSize,
    initialPosition,
  }: {
    blockSize: number;
    initialPosition: Vector3;
  }) {
    super();

    const geometry = new RoundedBoxGeometry(
      blockSize,
      blockSize,
      blockSize,
      6,
      0.01
    );
    const edges = new THREE.EdgesGeometry(geometry);
    this.highlightLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1000 })
    );
    this.block = new THREE.Mesh(geometry, this.cubeMaterials);
    this._initialCoordinate = initialPosition;
    this.currentCoordinate = this.initialCoordinate;
    this.add(this.block);
    console.log(this.block.position);
  }

  public get inRightPlace() {
    const { _initialCoordinate, currentCoordinate } = this;
    return (
      currentCoordinate.x === _initialCoordinate.x &&
      currentCoordinate.y === _initialCoordinate.y &&
      currentCoordinate.z === _initialCoordinate.z
    );
  }

  public highlight() {
    this.block.add(this.highlightLines);
  }

  public unhighlight() {
    this.block.remove(this.highlightLines);
  }

  public get initialCoordinate() {
    return new Vector3(
      this._initialCoordinate.x,
      this._initialCoordinate.y,
      this._initialCoordinate.z
    );
  }
  public reset() {
    this.currentCoordinate = this.initialCoordinate;
  }
}
