import * as THREE from "three";
import { Block } from "./Block";
import { flattenDeep } from "lodash";
import TWEEN, { Tween } from "@tweenjs/tween.js";
import { Signal } from "typed-signals";
import { raycaster } from "./singletons";
import max from "lodash/max";
import min from "lodash/min";
import { Vector2 } from "three";

enum RubiksCubeInteractions {
  ROTATE_START = "ROTATE_START",
  ROTATE = "ROTATE",
  ROTATE_END = "ROTATE_END",
}

type Dimention = "x" | "y" | "z";
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

  private rotatingBlocks: Block[] = [];

  private mouseDownPoint: Vector2 | null = null;

  static Interactions = RubiksCubeInteractions;
  private interactionSignal = new Signal<
    (payload: { type: RubiksCubeInteractions }) => void
  >();

  private rotatingDimention: Dimention | null = null;

  constructor({
    animationFrameSignal,
  }: {
    animationFrameSignal: Signal<(time: number) => void>;
  }) {
    super();

    //@ts-ignore
    window.cube = this;

    animationFrameSignal.connect((time) => {
      this.renderUpdate(time);
    });
    this.snapToPlace();

    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mouseup", () => this.onMouseUp());
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isRotating && this.mouseDownPoint) {
      const currentMouseCoordinate = new Vector2(e.offsetX, e.offsetY);

      const angleDelta =
        this.mouseDownPoint.angle() - currentMouseCoordinate.angle();
      // this._blocks.forEach((block) => {
      //   block.rotation[this.rotatingDimention || "x"] = angleDelta;
      // });
      this.interactionSignal.emit({
        type: RubiksCubeInteractions.ROTATE,
      });
    }
  }

  private onMouseDown(e: MouseEvent) {
    const mouseTarget = this.getMouseTarget();
    console.log(new Vector2(e.offsetX, e.offsetY).angle());
    if (mouseTarget) {
      const { blocks: targetBlocks, dimention: targetDimention } =
        this.getTargetBlocks(mouseTarget);

      this.rotatingDimention = targetDimention;

      this.mouseDownPoint = new Vector2(e.offsetX, e.offsetY);
      this.rotatingBlocks = targetBlocks;
      this.interactionSignal.emit({
        type: RubiksCubeInteractions.ROTATE_START,
      });
      console.log(this.rotatingBlocks);
    }
  }

  private onMouseUp() {
    if (this.isRotating) {
      this.rotatingBlocks = [];
      this.mouseDownPoint = null;
      this.interactionSignal.emit({
        type: RubiksCubeInteractions.ROTATE_END,
      });
    }
  }

  private getTargetBlocks(mouseTarget: ReturnType<typeof this.getMouseTarget>) {
    if (!mouseTarget)
      return {
        blocks: [],
        dimention: null,
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
    return { blocks: targetBlocks, dimention: targetDimention.dimention };
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

  private snapToPlace() {
    this._blocks.forEach((block) => {
      this.add(block);
      const {
        currentCoordinate: { x, y, z },
      } = block;
      block.position.x = x * this._blockSize * 1.1;
      block.position.y = y * this._blockSize * 1.1;
      block.position.z = z * this._blockSize * 1.1;
    });
    // this._blocks.forEach((block) => {
    //   const {
    //     currentCoordinate: { x, y, z },
    //   } = block;
    //   const tween = new Tween(block.position)
    //     .to(
    //       {
    //         x: x * this._blockSize * 1.05,
    //         y: y * this._blockSize * 1.05,
    //         z: z * this._blockSize * 1.05,
    //       },
    //       1000
    //     )
    //     .easing(TWEEN.Easing.Quadratic.Out)
    //     .onComplete(() => {
    //       this.tweens = this.tweens.filter((t) => t !== tween);
    //     })
    //     .start();
    //   this.tweens.push(tween);
    // });
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

  private renderUpdate(time: number) {
    this.tweens.forEach((tween) => tween.update(time));
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
