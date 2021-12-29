import * as THREE from "three";
import { Block } from "./Block";
import { flattenDeep } from "lodash";
import TWEEN, { Tween } from "@tweenjs/tween.js";

export class RubiksCube extends THREE.Mesh {
  private _blockSize = 0.1;
  private _blocks = flattenDeep<Block>(
    [
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    ].map((x, xIndex) =>
      x.map((y, yIndex) =>
        y.map(
          (z, zIndex) =>
            new Block({
              blockSize: this._blockSize,
              initialPosition: {
                x: xIndex,
                y: yIndex,
                z: zIndex,
              },
            })
        )
      )
    )
  );
  private tweens: Tween<any>[] = [];

  constructor() {
    super();
    this.snapToPlace();
  }

  private snapToPlace() {
    this._blocks.forEach((block) => {
      const {
        currentCoordinate: { x, y, z },
      } = block;
      this.add(block);
      const tween = new Tween(block.position)
        .to(
          {
            x: (x - 1) * this._blockSize,
            y: (y - 1) * this._blockSize,
            z: (z - 1) * this._blockSize,
          },
          1000
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          this.tweens = this.tweens.filter((t) => t !== tween);
        })
        .start();
      this.tweens.push(tween);
    });
  }

  public get solved() {
    return this._blocks.every((block) => block.inRightPlace);
  }

  public update(time: number) {
    this.tweens.forEach((tween) => tween.update(time));
  }
}
