import * as THREE from "three";
import { raycaster } from "./singletons";

const globalClicked: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];

export class InteractiveMesh extends THREE.Mesh {
  constructor(...args: any[]) {
    super(...args);
    window.addEventListener(
      "click",
      (e) => {
        if (this.isMouseOver()) {
          this.onClick();
        }
      },
      true
    );
    window.addEventListener("mousemove", (e) => {
      if (this.isMouseOver()) {
        this.onMouseOver();
      }
    });
  }

  private isMouseOver(): boolean {
    const intersects = raycaster.intersectObjects([this]);
    const interctingObjects = intersects.map(({ object }) => object);
    return this.children.some((child) => interctingObjects.includes(child));
  }

  /** override me */
  protected onClick() {}

  /** override me */
  protected onMouseOver() {}
}
