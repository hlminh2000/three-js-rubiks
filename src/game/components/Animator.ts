import { Tween } from "@tweenjs/tween.js";
import { Signal } from "typed-signals";

export default class Animator {
  private animations: Tween<any>[] = [];
  public animating = false;

  constructor({
    renderFrameSignal,
  }: {
    renderFrameSignal: Signal<(time: number) => void>;
  }) {
    renderFrameSignal.connect((time) => {
      this.animations.forEach((animation) => animation.update(time));
    });
  }

  public clear(){
    this.animations = [];
    this.animating = false;
  }

  public animate(tween: Tween<any>) {
    this.animating = true;
    return new Promise((resolve, reject) => {
      this.animations = [
        ...this.animations,
        tween
          .onComplete((...args) => {
            this.animations = this.animations.filter((t) => t !== tween);
            this.animating = false;
            resolve(tween);
          })
          .start(),
      ];
    });
  }
}
