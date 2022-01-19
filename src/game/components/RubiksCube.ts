import * as THREE from "three";
import { Block } from "./Block";
import { flattenDeep } from "lodash";
import TWEEN, { Tween } from "@tweenjs/tween.js";
import { Signal } from "typed-signals";
import { raycaster } from "./singletons";
import max from "lodash/max";
import min from "lodash/min";
import { MathUtils, Vector2, Vector3 } from "three";
import Animator from "./Animator";

enum RubiksCubeInteractions {
  ROTATE_START = "ROTATE_START",
  ROTATE = "ROTATE",
  ROTATE_END = "ROTATE_END",
}

type Dimention = "x" | "y" | "z";

const { radToDeg, degToRad } = MathUtils;

const vector2MultMatrix = (vector: Vector2, matrix: number[][]) =>
  new Vector2(
    Math.round(vector.x * matrix[0][0] + vector.y * matrix[0][1]),
    Math.round(vector.x * matrix[1][0] + vector.y * matrix[1][1])
  );

const rotateVector3 = (vector: Vector3, radian: number, axis: Dimention) => {
  const adjustedRadian = {
    x: radian,
    y: -radian, // adjustment for the fact that y axis is flipped
    z: radian,
  }[axis];
  const vector2 = {
    x: new Vector2(vector.y, vector.z),
    y: new Vector2(vector.x, vector.z),
    z: new Vector2(vector.x, vector.y),
  }[axis];
  const rotatedVector2 = vector2MultMatrix(vector2, [
    [Math.cos(adjustedRadian), -Math.sin(adjustedRadian)],
    [Math.sin(adjustedRadian), Math.cos(adjustedRadian)],
  ]);
  return {
    x: new Vector3(vector.x, rotatedVector2.x, rotatedVector2.y),
    y: new Vector3(rotatedVector2.x, vector.y, rotatedVector2.y),
    z: new Vector3(rotatedVector2.x, rotatedVector2.y, vector.z),
  }[axis];
};

export class RubiksCube extends THREE.Mesh {
  private static rotationOffsetAnimationRatio = 1.3;
  public static Interactions = RubiksCubeInteractions;

  private _blockSize = 0.1;
  private static blockPositionFactor = 1.1;
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
              initialPosition: new Vector3(xIndex - 1, yIndex - 1, zIndex - 1),
            })
        )
      )
    )
  );
  private rotatingBlocks: Block[] = [];
  private mouseDownPoint: Vector2 | null = null;
  private interactionSignal = new Signal<
    (payload: { type: RubiksCubeInteractions }) => void
  >();
  private rotatingAxis: Dimention | null = null;
  private rotationMesh: THREE.Mesh = new THREE.Mesh();
  private animator: Animator;

  constructor({
    renderFrameSignal,
  }: {
    renderFrameSignal: Signal<(time: number) => void>;
  }) {
    super();

    //@ts-ignore
    window.cube = this;

    renderFrameSignal.connect((time) => {
      this.renderUpdate(time);
    });
    this.animator = new Animator({ renderFrameSignal });

    this.positionBlocks({ animate: true });

    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mouseup", () => this.onMouseUp());
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isRotating && this.mouseDownPoint && this.rotatingAxis) {
      const currentMouseCoordinate = new Vector2(e.offsetX, e.offsetY);

      const angleDelta =
        this.mouseDownPoint.angle() - currentMouseCoordinate.angle();
      this.rotationMesh.rotation[this.rotatingAxis] = angleDelta * 3;

      this.interactionSignal.emit({
        type: RubiksCubeInteractions.ROTATE,
      });
    }
  }

  private async onMouseDown(e: MouseEvent) {
    if (!this.animator.animating) {
      const mouseTarget = this.getMouseTarget();
      if (mouseTarget) {
        const { blocks: targetBlocks, dimention } =
          this.getTargetBlocks(mouseTarget);

        this.rotatingAxis = dimention.dimention;
        const targetBlockPositionOnRotatingDimention =
          targetBlocks[0].position[dimention.dimention];

        this.rotationMesh.position[dimention.dimention] =
          targetBlockPositionOnRotatingDimention;
        targetBlocks.forEach((block) => {
          block.position[dimention.dimention] = 0;
          this.rotationMesh.add(block);
        });
        this.add(this.rotationMesh);

        this.mouseDownPoint = new Vector2(e.offsetX, e.offsetY);
        this.rotatingBlocks = targetBlocks;
        this.interactionSignal.emit({
          type: RubiksCubeInteractions.ROTATE_START,
        });

        await this.animator.animate(
          new Tween(this.rotationMesh.position)
            .to(
              {
                ...this.rotationMesh.position,
                [dimention.dimention]:
                  targetBlockPositionOnRotatingDimention *
                  RubiksCube.rotationOffsetAnimationRatio,
              },
              250
            )
            .easing(TWEEN.Easing.Quadratic.Out)
        );
      }
    }
  }

  static getSnapToAngle(angle: number) {
    const currentRotationAngleDegree = radToDeg(angle);
    const round =
      currentRotationAngleDegree > 0
        ? Math.abs(currentRotationAngleDegree) % 90 > 45
          ? Math.ceil
          : Math.floor
        : Math.abs(currentRotationAngleDegree) % 90 > 45
        ? Math.floor
        : Math.ceil;
    return degToRad(round(currentRotationAngleDegree / 90) * 90);
  }

  private async onMouseUp() {
    if (this.isRotating && this.rotatingAxis) {
      const rotatingBlocks = this.rotatingBlocks;
      const rotatingAxis = this.rotatingAxis;
      const targetDeltaAngle = RubiksCube.getSnapToAngle(
        this.rotationMesh.rotation[rotatingAxis]
      );

      this.rotatingBlocks = [];
      this.mouseDownPoint = null;
      this.interactionSignal.emit({
        type: RubiksCubeInteractions.ROTATE_END,
      });

      this.animator.clear();

      await Promise.all([
        this.animator.animate(
          new Tween(this.rotationMesh.position)
            .to(
              {
                ...this.rotationMesh.position,
                [rotatingAxis]:  this._blockSize * (
                  this.rotationMesh.position[rotatingAxis] > 0 ? RubiksCube.blockPositionFactor : - RubiksCube.blockPositionFactor
                ),
              },
              250
            )
            .easing(TWEEN.Easing.Quadratic.Out)
        ),
        this.animator.animate(
          new Tween(this.rotationMesh.rotation)
            .to(
              {
                x: 0,
                y: 0,
                z: 0,
                [rotatingAxis]: targetDeltaAngle,
              },
              250
            )
            .easing(TWEEN.Easing.Quadratic.Out)
        ),
      ]);

      rotatingBlocks.forEach((block) => {
        const newLocation = rotateVector3(
          block.currentCoordinate,
          targetDeltaAngle,
          rotatingAxis
        );
        block.currentCoordinate = newLocation;
        block.position[rotatingAxis] = this.rotationMesh.position[rotatingAxis];
        block.rotateOnWorldAxis(
          {
            x: new Vector3(1, 0, 0),
            y: new Vector3(0, 1, 0),
            z: new Vector3(0, 0, 1),
          }[rotatingAxis],
          targetDeltaAngle
        );
        this.add(block);
      });
      this.positionBlocks();
      this.resetRotationMesh();
      this.remove(this.rotationMesh);
    }
  }

  private resetRotationMesh() {
    this.rotationMesh.rotation.x = 0;
    this.rotationMesh.rotation.y = 0;
    this.rotationMesh.rotation.z = 0;

    this.rotationMesh.position.x = 0;
    this.rotationMesh.position.y = 0;
    this.rotationMesh.position.z = 0;
  }

  private getTargetBlocks(
    mouseTarget: ReturnType<typeof this.getMouseTarget>
  ): {
    blocks: Block[];
    dimention: { dimention: Dimention; value: number };
  } {
    if (!mouseTarget)
      return {
        blocks: [],
        dimention: {
          dimention: "x",
          value: 0,
        },
      };
    const {
      intersect: { point },
    } = mouseTarget;

    const targetDimention = Object.entries(point).reduce(
      (acc, [key, value]) =>
        Math.abs(value) > Math.abs(acc.value)
          ? { dimention: key as Dimention, value: value as number }
          : acc,
      {
        dimention: "x" as Dimention,
        value: point.x,
      }
    );

    const positionsOnTargetDimention = (targetDimention.value > 0 ? max : min)(
      this._blocks.map((b) => Number(b.position[targetDimention.dimention]))
    );

    const targetBlocks = this._blocks.filter(
      (block) =>
        Number(block.position[targetDimention.dimention]) ===
        positionsOnTargetDimention
    );
    return { blocks: targetBlocks, dimention: targetDimention };
  }

  private get isRotating() {
    return !!this.rotatingBlocks.length;
  }

  private getMouseTarget():
    | {
        block: Block;
        intersect: THREE.Intersection<THREE.Object3D<THREE.Event>>;
      }
    | undefined {
    const closestIntersect = raycaster
      .intersectObjects(this.children)
      .find((i) =>
        this._blocks.some((block) => block.children.includes(i.object))
      );
    return closestIntersect
      ? {
          block: this._blocks.find((block) =>
            block.children.includes(closestIntersect.object)
          ) as Block,
          intersect: closestIntersect,
        }
      : undefined;
  }

  public get solved() {
    return this._blocks.every((block) => block.inRightPlace);
  }

  public get blockSize() {
    return this._blockSize;
  }

  public subscribeToInteraction(
    cb: (payload: { type: RubiksCubeInteractions }) => void
  ) {
    this.interactionSignal.connect(cb);
  }

  public get box() {
    return new THREE.Box3().setFromObject(this);
  }

  private async resetBlocks() {
    this._blocks.forEach(async (block) => {
      block.reset();
    });
    await this.positionBlocks({ animate: true });
    await Promise.all(
      this._blocks.map(async (block) => {
        await this.animator.animate(
          new Tween(block.rotation)
            .to(
              {
                x: 0,
                y: 0,
                z: 0,
              },
              1000
            )
            .easing(TWEEN.Easing.Quadratic.Out)
        );
      })
    );
  }

  private positionBlocks({ animate = false } = { animate: false as boolean }) {
    if (animate) {
      return Promise.all(
        this._blocks.map(async (block) => {
          this.add(block);
          const {
            currentCoordinate: { x, y, z },
          } = block;

          await this.animator.animate(
            new Tween(block.position)
              .to(
                {
                  x: x * this._blockSize * RubiksCube.blockPositionFactor,
                  y: y * this._blockSize * RubiksCube.blockPositionFactor,
                  z: z * this._blockSize * RubiksCube.blockPositionFactor,
                },
                1000
              )
              .easing(TWEEN.Easing.Quadratic.Out)
          );
        })
      );
    } else {
      this._blocks.map(async (block) => {
        this.add(block);
        const {
          currentCoordinate: { x, y, z },
        } = block;

        block.position.x = x * this._blockSize * RubiksCube.blockPositionFactor;
        block.position.y = y * this._blockSize * RubiksCube.blockPositionFactor;
        block.position.z = z * this._blockSize * RubiksCube.blockPositionFactor;
      });
    }
  }

  public async reset() {
    this.resetRotationMesh();
    await this.resetBlocks();
  }

  private renderUpdate(time: number) {
    if (this.isRotating) {
      this.rotatingBlocks.forEach((block) => {
        block.highlight();
      });
    } else {
      const mouseTarget = this.getMouseTarget();
      if (mouseTarget) {
        const { blocks } = this.getTargetBlocks(mouseTarget);
        this._blocks.forEach((block) => {
          block.unhighlight();
        });
        blocks.forEach((block) => {
          block.highlight();
        });
      } else {
        this._blocks.forEach((block) => {
          block.unhighlight();
        });
      }
    }
  }
}
