import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { Signal } from "typed-signals";

import { RubiksCube } from "./components/RubiksCube";
import { mouse, raycaster } from "./components/singletons";
import { BLOOM_ENABLED, ORBIT_CONTROL_ENABLED } from "../utils/configs";

export function init({ domContainer }: { domContainer: HTMLDivElement }) {
  const animationFrameSignal = new Signal<(time: number) => void>();

  const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10
    ),
    scene = new THREE.Scene(),
    renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
  camera.position.z = 0.5;
  camera.position.y = 0.5;
  camera.position.x = 0.25;

  const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
  scene.add(hemiLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(3, 6, 7);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  renderer.shadowMap.enabled = true;
  domContainer.appendChild(renderer.domElement);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = -0;
  bloomPass.strength = 0.5;
  bloomPass.radius = 0.5;
  const renderScene = new RenderPass(scene, camera);
  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  //   const gridHelper = new THREE.GridHelper(10, 100);
  //   scene.add(gridHelper);

  const controls = new OrbitControls(camera, renderer.domElement);

  const rubiksCube = new RubiksCube({ animationFrameSignal });
  scene.add(rubiksCube);
  rubiksCube.position.x = -rubiksCube.box.max.sub(rubiksCube.box.min).x / 3;
  rubiksCube.position.y = -rubiksCube.box.max.sub(rubiksCube.box.min).y / 3;
  rubiksCube.position.z = -rubiksCube.box.max.sub(rubiksCube.box.min).z / 3;
  console.log(rubiksCube.box.max.sub(rubiksCube.box.min));

  rubiksCube.subscribeToInteraction(({ type }) => {
    const handler = {
      [RubiksCube.Interactions.ROTATE_END]: () => {
        controls.enabled = true;
      },
      [RubiksCube.Interactions.ROTATE]: () => {},
      [RubiksCube.Interactions.ROTATE_START]: () => {
        controls.enabled = false;
      },
    }[type];
    handler();
  });

  function animation(time: number) {
    // rubiksCube.rotation.x = time / 2000;
    // rubiksCube.rotation.y = time / 1000;
    raycaster.setFromCamera(mouse, camera);
    animationFrameSignal.emit(time);
    if (ORBIT_CONTROL_ENABLED) {
      controls.update();
    }
    if (BLOOM_ENABLED) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function onMouseMove(event: MouseEvent) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener("mousemove", onMouseMove, false);

  const vrButton = VRButton.createButton(renderer);
  domContainer.appendChild(vrButton);
}
