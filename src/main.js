/**
 * 3D Viewer - Three.js Application
 * Features: Model loading, customization, animation, and interactive controls
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { UIManager } from "./ui/uiManager.js"; // Import UIManager
import { ModelHandler } from "./model/modelHandler.js"; // Import ModelHandler
import { SceneInitializer } from "./core/sceneInitializer.js"; // Import SceneInitializer
import { PostprocessingManager } from "./postprocessing/postprocessingManager.js"; // Import PostprocessingManager
import { InteractionManager } from "./core/interactionManager.js"; // Import InteractionManager
import { RendererManager } from "./core/rendererManager.js"; // Import RendererManager
import { UtilityManager } from "./core/utilityManager.js"; // Import UtilityManager

class ModelViewer {
  constructor() {
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Model and animation
    this.currentModel = null;
    this.mixer = null;
    this.modelCenter = new THREE.Vector3(0, 0, 0);

    // Lighting
    this.ambientLight = null;
    this.directionalLight = null;

    // Animation state
    this.isAutoRotating = false;
    this.clock = new THREE.Clock();

    // Default settings
    this.settings = {
      cameraDistance: 11, // Default initial distance
      ambientLightIntensity: 0.7,
      keyLightIntensity: 6.0, // Default for the key light
      autoRotateSpeed: 2.5, // Increased auto-rotate speed
      // Default Shadow Settings
      shadowMapSize: 4096,
      shadowBias: -0.001,
      shadowRadius: 1.0, // Initial value for shadow softness/radius
      // Post-Processing - Bloom defaults
      bloomEnabled: false, // Disabled by default
      bloomThreshold: 0.85,
      bloomStrength: 0.4,
      bloomRadius: 0.2,
      // Post-Processing - SSAO defaults
      ssaoEnabled: false, // Disabled by default
      ssaoKernelRadius: 0.5,
      ssaoMinDistance: 0.001,
      ssaoMaxDistance: 0.1, // Default SSAO max distance // Adjusted for more subtle SSAO, can be sensitive
      // Post-Processing - SMAA defaults
      smaaEnabled: true,
    };

    // Get references to UI elements for colors early
    // MOVED to UIManager

    this.defaultEnvironmentMap = null; // To store our generated env map
    this.currentHdriTexture = null; // To store loaded custom HDRI for disposal

    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.outputPass = null;
    this.ssaoPass = null;
    this.smaaPass = null; // SMAA Pass

    this.uiManager = new UIManager(this);
    this.modelHandler = new ModelHandler(this);
    this.sceneInitializer = new SceneInitializer(this);
    this.postprocessingManager = new PostprocessingManager(this);
    this.rendererManager = new RendererManager(this);
    this.utilityManager = new UtilityManager(this);

    this.initCoreComponents(); // Sets up scene, camera, renderer, lights, sceneInitializer's controls

    // InteractionManager needs camera and renderer.domElement from initCoreComponents
    this.interactionManager = new InteractionManager(
      this.camera,
      this.renderer.domElement,
      this.modelHandler,
      this.postprocessingManager
    );

    this.finalizeSetup(); // Sets up UI event listeners, accordion, starts animation, and shows landing page
  }

  /**
   * Initialize core Three.js scene, camera, renderer, lights, and basic controls.
   */
  initCoreComponents() {
    this.sceneInitializer.createScene();
    this.sceneInitializer.createCamera();
    this.sceneInitializer.createRenderer();
    this.sceneInitializer.createLights();
    this.sceneInitializer.createControls(); // SceneInitializer OrbitControls
    this.postprocessingManager.setupPostProcessing();
  }

  /**
   * Finalize setup by initializing UI event listeners, accordion, starting animation loop,
   * and showing the initial UI (landing page).
   */
  finalizeSetup() {
    this.uiManager.setupEventListeners(); // Depends on interactionManager
    this.uiManager.setupAccordion();
    this.rendererManager.animate();

    if (this.uiManager) {
      this.uiManager.showLandingPage();
    }
  }

  /**
   * Handle window resize events
   */
  // MOVED to RendererManager.js

  /**
   * Main animation loop
   */
  // MOVED to RendererManager.js

  /**
   * Handles the file upload process.
   * @param {File} file - The file to upload.
   */
  handleFileUpload(file) {
    // This method is now delegated to ModelHandler
    if (this.modelHandler) {
      this.modelHandler.handleFileUpload(file);
    } else {
      console.warn(
        "ModelHandler not initialized when handleFileUpload was called from ModelViewer"
      );
    }
  }

  handleHdriUpload(file) {
    // This method is now delegated to ModelHandler
    if (this.modelHandler) {
      this.modelHandler.handleHdriUpload(file);
    } else {
      console.warn(
        "ModelHandler not initialized when handleHdriUpload was called from ModelViewer"
      );
    }
  }

  /**
   * Sets up the accordion functionality for the control panel sections.
   */
  // MOVED to UIManager.js

  returnToLandingPage() {
    if (this.uiManager) {
      this.uiManager.showLandingPage();
    }
    // console.log("ModelViewer: Returning to landing page.");
  }

  clearHdriEnvironmentAndSettings() {
    // console.log(
    //   "ModelViewer: Clearing HDRI environment and resetting related settings..."
    // );

    // 1. Clear current HDRI texture via ModelHandler
    if (this.modelHandler) {
      this.modelHandler.clearCurrentHdriTexture();
    } else {
      console.warn(
        "ModelViewer: ModelHandler not available for clearing HDRI texture."
      );
    }

    // 2. Reset scene environment and key light shadows via SceneInitializer
    if (this.sceneInitializer) {
      this.sceneInitializer.resetToDefaultEnvironmentAndShadows();
    } else {
      console.warn(
        "ModelViewer: SceneInitializer not available for resetting environment/shadows."
      );
    }

    // 3. Reset post-processing effects via PostprocessingManager
    if (this.postprocessingManager) {
      this.postprocessingManager.resetEffectsToDefaults();
    } else {
      console.warn(
        "ModelViewer: PostprocessingManager not available for resetting effects."
      );
    }

    // 4. Reset UI input controls via UIManager
    if (this.uiManager) {
      this.uiManager.resetEnvironmentRelatedControlsToDefaults();
    } else {
      console.warn(
        "ModelViewer: UIManager not available for resetting UI controls."
      );
    }

    // console.log(
    //   "ModelViewer: HDRI environment and related settings reset complete."
    // );
  }
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // console.log("🚀 Starting 3D Model Hub..."); // Updated name

  // Check if THREE.js is loaded
  if (typeof THREE === "undefined") {
    console.error("❌ THREE.js is not loaded! Please check the script tags.");
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML = `
      <div style="color: white; text-align: center; padding: 50px; font-family: Arial;">
        <h2>Three.js Not Loaded</h2>
        <p>Three.js library failed to load. Please check your internet connection and try refreshing the page.</p>
      </div>
    `;
    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) canvasContainer.appendChild(errorDiv);
    return;
  }

  // Check for WebGL support
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable()) {
    const warning = document.createElement("div");
    warning.innerHTML = `
      <div style="color: white; text-align: center; padding: 50px; font-family: Arial;">
        <h2>WebGL Not Available</h2>
        <p>Your browser does not support WebGL, which is required for this application.</p>
        <p>Please try using a modern browser like Chrome, Firefox, Safari, or Edge.</p>
      </div>
    `;
    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) canvasContainer.appendChild(warning);
    return;
  }

  // Create the viewer instance
  window.modelViewer = new ModelViewer(); // Changed global var name to modelViewer

  // console.log("✅ THREE.js loaded successfully!", THREE.REVISION);
});
