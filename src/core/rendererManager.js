import * as THREE from "three";

export class RendererManager {
  constructor(viewer) {
    this.viewer = viewer;
  }

  animate() {
    const viewer = this.viewer;
    if (!viewer.clock) {
      console.error("RendererManager: Clock not available for animation loop.");
      // Potentially stop the loop or handle more gracefully if critical
      return;
    }
    requestAnimationFrame(() => this.animate()); // Call own method

    const deltaTime = viewer.clock.getDelta();

    if (viewer.controls) viewer.controls.update();
    if (viewer.mixer) viewer.mixer.update(deltaTime);

    // Wheel animation logic removed as per user decision for generic viewer

    if (viewer.composer) {
      viewer.composer.render(deltaTime);
    } else if (viewer.renderer && viewer.scene && viewer.camera) {
      // Fallback if composer isn't set up
      viewer.renderer.render(viewer.scene, viewer.camera);
    }
  }

  onWindowResize() {
    const viewer = this.viewer;
    if (viewer.camera) {
      viewer.camera.aspect = window.innerWidth / window.innerHeight;
      viewer.camera.updateProjectionMatrix();
    }
    if (viewer.renderer) {
      viewer.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    if (viewer.composer) {
      viewer.composer.setSize(window.innerWidth, window.innerHeight);
      if (viewer.smaaPass && viewer.renderer) {
        // smaaPass needs renderer for pixelRatio
        const pixelRatio = viewer.renderer.getPixelRatio();
        viewer.smaaPass.setSize(
          window.innerWidth * pixelRatio,
          window.innerHeight * pixelRatio
        );
      }
    }
  }
}
