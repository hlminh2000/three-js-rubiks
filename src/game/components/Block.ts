import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry";

export type Coordinate = {
  x: number;
  y: number;
  z: number;
};

export class Block extends THREE.Mesh {
  static cubeMaterials = [
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
  ].map(
    (color) =>
      new THREE.MeshMatcapMaterial({
        color,
        transparent: false,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
  );
  private block: THREE.Mesh;
  private readonly _initialCoordinate: Coordinate;
  public currentCoordinate: Coordinate;

  constructor({
    blockSize,
    initialPosition,
  }: {
    blockSize: number;
    initialPosition: Coordinate;
  }) {
    super();

    const geometry = new RoundedBoxGeometry(
      blockSize,
      blockSize,
      blockSize,
      6,
      0.004
    );
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1000 })
    );
    this.block = new THREE.Mesh(geometry, Block.cubeMaterials).add(line);
    this._initialCoordinate = initialPosition;
    this.currentCoordinate = initialPosition;
    this.add(this.block);
  }

  public get inRightPlace() {
    const { _initialCoordinate, currentCoordinate } = this;
    return (
      currentCoordinate.x === _initialCoordinate.x &&
      currentCoordinate.y === _initialCoordinate.y &&
      currentCoordinate.z === _initialCoordinate.z
    );
  }

  public get initialCoordinate() {
    return { ...this._initialCoordinate };
  }
}
