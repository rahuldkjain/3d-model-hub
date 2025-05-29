import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class InteractionManager {
  constructor(camera, domElement, modelHandler, postprocessingManager) {
    this.camera = camera;
    this.domElement = domElement;
    this.modelHandler = modelHandler;
    this.postprocessingManager = postprocessingManager; // Store reference
    this.controls = new OrbitControls(this.camera, this.domElement);
    this.setupControls();
    this.rotationSpeed = 0.005; // Default rotation speed
    this.isAutoRotating = false;

    // For SSAO Pass, if it exists and needs camera info
    if (this.postprocessingManager && this.postprocessingManager.ssaoPass) {
      this.postprocessingManager.ssaoPass.camera = this.camera;
    }
  }

  setupControls() {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 500;
    this.controls.enablePan = true;
    this.controls.autoRotate = false; // Initial auto-rotate state
    this.controls.autoRotateSpeed = 0.5; // Default speed, can be adjusted

    // Add event listener for controls changes to update UI or other components
    this.controls.addEventListener("change", () => {
      // Example: Update camera distance display if you have one
      // const distance = this.camera.position.distanceTo(this.controls.target);
      // document.getElementById('cameraDistanceDisplay').textContent = distance.toFixed(2);

      // If SSAO needs an update on camera change (though usually handled by render loop)
      if (this.postprocessingManager && this.postprocessingManager.ssaoPass) {
        // this.postprocessingManager.ssaoPass.update(); // May not be necessary if done in render loop
      }
    });
  }

  update() {
    this.controls.update(); // Required if enableDamping or autoRotate is set to true
    if (this.isAutoRotating && this.modelHandler.currentModel) {
      this.modelHandler.currentModel.rotation.y += this.rotationSpeed;
    }
  }

  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
    this.controls.update();
  }

  setCameraTarget(x, y, z) {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  getCamera() {
    return this.camera;
  }

  getControls() {
    return this.controls;
  }

  // Method to toggle auto-rotation of the model itself, not OrbitControls' autoRotate
  toggleModelAutoRotation(speed = 0.005) {
    this.isAutoRotating = !this.isAutoRotating;
    this.rotationSpeed = speed;
    return this.isAutoRotating; // Return current state
  }

  // Method to control OrbitControls' autoRotate feature
  toggleOrbitControlsAutoRotation(enable) {
    this.controls.autoRotate = enable;
    if (enable) {
      // If you want to ensure the model's manual auto-rotation stops when OrbitControls auto-rotation starts
      this.isAutoRotating = false;
    }
  }

  setOrbitControlsAutoRotateSpeed(speed) {
    this.controls.autoRotateSpeed = speed;
  }

  setCameraDistance(distance) {
    // This is a simplified approach. It moves the camera along its current direction vector.
    // A more robust solution might involve spherical coordinates or other calculations
    // if you want to maintain the view angle precisely.
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // Get current distance from target
    const currentDistance = this.camera.position.distanceTo(
      this.controls.target
    );
    const factor = distance / currentDistance;

    this.camera.position
      .copy(this.controls.target)
      .addScaledVector(direction.multiplyScalar(-1), distance);
    this.controls.update();
  }

  resetControls() {
    this.controls.reset();
    // Reapply initial settings if OrbitControls.reset() clears them and you want to maintain them
    this.camera.position.set(0, 1.5, 10); // Default camera position
    this.controls.target.set(0, 0, 0); // Default target
    this.isAutoRotating = false; // Stop manual model rotation
    this.controls.autoRotate = false; // Stop OrbitControls auto-rotation
    this.controls.update();
  }

  dispose() {
    this.controls.dispose();
    // Remove event listeners if any were added directly here
  }
}
