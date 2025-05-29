import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";

export class PostprocessingManager {
  constructor(viewer) {
    this.viewer = viewer;
  }

  setupPostProcessing() {
    const viewer = this.viewer;

    if (
      !viewer.renderer ||
      !viewer.scene ||
      !viewer.camera ||
      !viewer.settings
    ) {
      console.error(
        "PostprocessingManager: Renderer, Scene, Camera, or Settings not available. Cannot setup post-processing."
      );
      return;
    }

    viewer.composer = new EffectComposer(viewer.renderer);
    viewer.composer.setSize(window.innerWidth, window.innerHeight);

    viewer.renderPass = new RenderPass(viewer.scene, viewer.camera);
    viewer.composer.addPass(viewer.renderPass);

    viewer.ssaoPass = new SSAOPass(
      viewer.scene,
      viewer.camera,
      window.innerWidth,
      window.innerHeight
    );
    viewer.ssaoPass.kernelRadius = viewer.settings.ssaoKernelRadius;
    viewer.ssaoPass.minDistance = viewer.settings.ssaoMinDistance;
    viewer.ssaoPass.maxDistance = viewer.settings.ssaoMaxDistance;
    viewer.ssaoPass.enabled = viewer.settings.ssaoEnabled;
    viewer.composer.addPass(viewer.ssaoPass);

    viewer.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      viewer.settings.bloomStrength,
      viewer.settings.bloomRadius,
      viewer.settings.bloomThreshold
    );
    viewer.bloomPass.enabled = viewer.settings.bloomEnabled;
    viewer.composer.addPass(viewer.bloomPass);

    const pixelRatio = viewer.renderer.getPixelRatio();
    viewer.smaaPass = new SMAAPass(
      window.innerWidth * pixelRatio,
      window.innerHeight * pixelRatio
    );
    viewer.smaaPass.enabled = viewer.settings.smaaEnabled;
    viewer.composer.addPass(viewer.smaaPass);

    viewer.outputPass = new OutputPass();
    viewer.composer.addPass(viewer.outputPass);
  }

  resetEffectsToDefaults() {
    const viewer = this.viewer;
    if (!viewer.settings) {
      console.warn(
        "PostprocessingManager: Settings not available for resetting effects."
      );
      return;
    }

    // Reset Bloom settings (actual BloomPass object)
    if (viewer.bloomPass) {
      viewer.bloomPass.enabled = viewer.settings.bloomEnabled;
      viewer.bloomPass.threshold = viewer.settings.bloomThreshold;
      viewer.bloomPass.strength = viewer.settings.bloomStrength;
      viewer.bloomPass.radius = viewer.settings.bloomRadius;
    } else {
      console.warn("PostprocessingManager: BloomPass not available for reset.");
    }

    // Reset SSAO settings (actual SSAOPass object)
    if (viewer.ssaoPass) {
      viewer.ssaoPass.enabled = viewer.settings.ssaoEnabled;
      viewer.ssaoPass.kernelRadius = viewer.settings.ssaoKernelRadius;
      viewer.ssaoPass.minDistance = viewer.settings.ssaoMinDistance;
      viewer.ssaoPass.maxDistance = viewer.settings.ssaoMaxDistance;
    } else {
      console.warn("PostprocessingManager: SSAOPass not available for reset.");
    }

    // Reset SMAA settings (actual SMAAPass object)
    if (viewer.smaaPass) {
      viewer.smaaPass.enabled = viewer.settings.smaaEnabled;
    } else {
      console.warn("PostprocessingManager: SMAAPass not available for reset.");
    }
  }
}
