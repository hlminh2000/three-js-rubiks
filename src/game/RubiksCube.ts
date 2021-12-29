import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry";

export class RubiksCube extends THREE.Mesh {
  constructor() {
    super();

    this.cubes.forEach((layer, xIndex) =>
      layer.forEach((row, yIndex) =>
        row.forEach((col, zIndex) => {
          const positionFactor = this.cubeSize * 1.0;
          const offsetFactor = this.cubes.length - 1;
          col.position.x =
            xIndex * positionFactor - (positionFactor * offsetFactor) / 2;
          col.position.y =
            yIndex * positionFactor - (positionFactor * offsetFactor) / 2;
          col.position.z =
            zIndex * positionFactor - (positionFactor * offsetFactor) / 2;
          this.add(col);
        })
      )
    );
  }
  private cubeSize = 0.1;
  private cubeMaterials = [
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
  private cubePositions = [
    [
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2],
    ],
    [
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2],
    ],
    [
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2],
    ],
  ];
  private cubes = this.cubePositions.map((layer) =>
    layer.map((row) =>
      row.map((cube) => {
        const geometry = new RoundedBoxGeometry(
          this.cubeSize,
          this.cubeSize,
          this.cubeSize,
          6,
          0.004
        );
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0xffffff })
        );

        return new THREE.Mesh(geometry, this.cubeMaterials).add(line);
      })
    )
  );
}
