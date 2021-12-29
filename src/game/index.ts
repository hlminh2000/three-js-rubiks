import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

import { RubiksCube } from "./RubiksCube";

export function init({ domContainer }: { domContainer: HTMLDivElement }) {
  const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10
    ),
    scene = new THREE.Scene(),
    renderer = new THREE.WebGLRenderer({ antialias: true });

  const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
  scene.add(hemiLight);

  const rubiksCube = new RubiksCube();
  camera.position.z = 1;
  scene.add(rubiksCube);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  domContainer.appendChild(renderer.domElement);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = 0;
  bloomPass.strength = 0.75;
  bloomPass.radius = 0.5;
  const renderScene = new RenderPass(scene, camera);
  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  const gridHelper = new THREE.GridHelper(10, 100);
  scene.add(gridHelper);

  const controls = new OrbitControls(camera, renderer.domElement);

  function animation(time: number) {
    rubiksCube.rotation.x = time / 2000;
    rubiksCube.rotation.y = time / 1000;
    controls.update();
    composer.render();
  }

  const vrButton = VRButton.createButton(renderer);
  domContainer.appendChild(vrButton);
}
