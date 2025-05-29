import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class SceneInitializer {
  constructor(viewer) {
    this.viewer = viewer;
  }

  createScene() {
    const viewer = this.viewer;
    viewer.scene = new THREE.Scene();

    // Ensure sceneBackgroundColorInput & floorColorInput are initialized by UIManager on viewer before this is called
    const initialSceneBgColorValue = viewer.sceneBackgroundColorInput.value;
    const initialSceneBgColor = new THREE.Color(initialSceneBgColorValue);

    viewer.scene.background = initialSceneBgColor;
    viewer.scene.fog = new THREE.Fog(initialSceneBgColor, 20, 150);

    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const initialFloorColorValue = viewer.floorColorInput.value;
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialFloorColorValue),
      metalness: 0.1,
      roughness: 0.6,
    });
    viewer.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    viewer.ground.rotation.x = -Math.PI / 2;
    viewer.ground.receiveShadow = true;
    viewer.scene.add(viewer.ground);
  }

  createCamera() {
    const viewer = this.viewer;
    viewer.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    viewer.camera.position.set(6, 2.5, 9);
    viewer.camera.lookAt(viewer.modelCenter); // modelCenter is on viewer
  }

  createRenderer() {
    const viewer = this.viewer;
    viewer.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true, // Required for toDataURL to work for PNG export
    });
    viewer.renderer.setClearColor(0x000000, 0); // transparent background
    viewer.renderer.setSize(window.innerWidth, window.innerHeight);
    viewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    viewer.renderer.shadowMap.enabled = true;
    viewer.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    viewer.renderer.toneMapping = THREE.ACESFilmicToneMapping; // For better color and lighting
    viewer.renderer.toneMappingExposure = 2.0; // Adjusted exposure
    viewer.renderer.outputColorSpace = THREE.SRGBColorSpace; // Updated from outputEncoding

    const container = document.getElementById("canvas-container");
    if (container) {
      container.appendChild(viewer.renderer.domElement);
    } else {
      console.error(
        "SceneInitializer: canvas-container DOM element not found! Cannot append renderer."
      );
    }

    this.createStudioEnvironmentMap(); // Call within SceneInitializer
  }

  createStudioEnvironmentMap() {
    const viewer = this.viewer;
    // Create a WebGLCubeRenderTarget
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
      // Increased resolution for better reflections
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      colorSpace: THREE.SRGBColorSpace, // Updated from encoding
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 200, cubeRenderTarget); // Adjusted near/far for typical scene sizes
    cubeCamera.position.set(0, 5, 0); // Positioned slightly above origin

    // Create a temporary scene for rendering the environment map
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x404040); // Neutral grey background for env map

    // Simple lights for the environment map scene
    const envLight1 = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 15), // Large area light
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    envLight1.position.set(0, 15, -25); // Front-top
    envLight1.lookAt(0, 0, 0);
    envScene.add(envLight1);

    const envLight2 = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffee, side: THREE.DoubleSide })
    );
    envLight2.position.set(-20, 10, 0); // Left-side
    envLight2.rotation.y = Math.PI / 2;
    envLight2.lookAt(0, 0, 0); // Look at origin after rotation
    envScene.add(envLight2);

    const envLight3 = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshBasicMaterial({ color: 0xffeeff, side: THREE.DoubleSide })
    );
    envLight3.position.set(20, 10, 0); // Right-side
    envLight3.rotation.y = -Math.PI / 2;
    envLight3.lookAt(0, 0, 0); // Look at origin after rotation
    envScene.add(envLight3);

    const envFloorLight = new THREE.Mesh(
      new THREE.CircleGeometry(15, 32), // Soft floor reflection
      new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide })
    );
    envFloorLight.position.set(0, -5, 0);
    envFloorLight.rotation.x = -Math.PI / 2;
    envScene.add(envFloorLight);

    viewer.scene.add(cubeCamera); // Add to main scene TEMPORARILY to render env map from its perspective
    cubeCamera.update(viewer.renderer, envScene); // Render the temporary scene into the CubeMap
    viewer.scene.remove(cubeCamera); // Remove after capture

    viewer.defaultEnvironmentMap = cubeRenderTarget.texture; // Store the texture
    viewer.scene.environment = viewer.defaultEnvironmentMap; // Apply as default environment
  }

  createLights() {
    const viewer = this.viewer;
    // Ensure UI elements on viewer are initialized by UIManager
    // Note: Light intensities adjusted for new Three.js lighting system (non-legacy)
    viewer.ambientLight = new THREE.AmbientLight(
      new THREE.Color(viewer.ambientLightColorInput?.value || "#FFFFF0"),
      parseFloat(viewer.ambientLightInput?.value || 0.7) * Math.PI // Multiply by PI for new lighting
    );
    viewer.scene.add(viewer.ambientLight);

    viewer.keyLight = new THREE.SpotLight(
      new THREE.Color(viewer.keyLightColorInput?.value || "#FFF5E1"),
      parseFloat(viewer.keyLightIntensityInput?.value || 6.0) * Math.PI // Multiply by PI for new lighting
    );
    viewer.keyLight.position.set(15, 25, 20); // Default position
    viewer.keyLight.target.position.set(0, 2, 0); // Target towards the center, slightly above ground
    viewer.keyLight.castShadow = true;
    viewer.keyLight.shadow.mapSize.width = parseInt(
      viewer.shadowMapSizeInput?.value || viewer.settings.shadowMapSize
    );
    viewer.keyLight.shadow.mapSize.height = parseInt(
      viewer.shadowMapSizeInput?.value || viewer.settings.shadowMapSize
    );
    viewer.keyLight.shadow.bias = parseFloat(
      viewer.shadowBiasInput?.value || viewer.settings.shadowBias
    );
    viewer.keyLight.shadow.radius = parseFloat(
      viewer.shadowRadiusInput?.value || viewer.settings.shadowRadius
    ); // For PCFSoftShadowMap
    viewer.keyLight.shadow.camera.near = 5; // Default, can be adjusted
    viewer.keyLight.shadow.camera.far = 60; // Default, can be adjusted
    viewer.scene.add(viewer.keyLight);
    viewer.scene.add(viewer.keyLight.target); // Target must be added to scene
    viewer.directionalLight = viewer.keyLight; // Keep directionalLight alias on viewer

    // Hemisphere light for soft ambient lighting, values from UI or defaults
    viewer.hemisphereLight = new THREE.HemisphereLight(
      new THREE.Color(viewer.hemisphereSkyColorInput?.value || "#FFFAF0"),
      new THREE.Color(viewer.hemisphereGroundColorInput?.value || "#B0C4DE"),
      parseFloat(viewer.hemisphereIntensityInput?.value || 0.9) * Math.PI // Multiply by PI for new lighting
    );
    viewer.hemisphereLight.position.set(0, 20, 0); // Position it above the scene
    viewer.scene.add(viewer.hemisphereLight);

    // Additional Fill and Rim lights for better model definition
    // Intensities adjusted for new lighting system
    const fillLight = new THREE.SpotLight(
      0xfff8e7,
      3.0 * Math.PI, // Adjusted for new lighting
      70,
      Math.PI / 3,
      0.5,
      1
    );
    fillLight.position.set(-20, 15, 15); // Opposite side of key light
    fillLight.target.position.set(0, 1, 0);
    viewer.scene.add(fillLight);
    viewer.scene.add(fillLight.target);

    const rimLight = new THREE.DirectionalLight(
      0xfff0db,
      3.5 * Math.PI // Adjusted for new lighting
    );
    rimLight.position.set(0, 10, -25); // From the back
    rimLight.target.position.set(0, 1, 0);
    viewer.scene.add(rimLight);
    viewer.scene.add(rimLight.target);

    // Example of adding point lights for specific accents if needed (like for car wheels)
    // These can be made conditional or part of model-specific setup if they are not general
    const wheelAccent1 = new THREE.PointLight(
      0xffddcc,
      2.0 * Math.PI, // Adjusted for new lighting
      20,
      1.5
    );
    wheelAccent1.position.set(5, 1, 8); // Example position
    viewer.scene.add(wheelAccent1);

    const wheelAccent2 = new THREE.PointLight(
      0xccddff,
      2.0 * Math.PI, // Adjusted for new lighting
      20,
      1.5
    );
    wheelAccent2.position.set(-5, 1, 8); // Example position
    viewer.scene.add(wheelAccent2);

    const rearAccent = new THREE.PointLight(
      0xfff5e1,
      1.5 * Math.PI, // Adjusted for new lighting
      25,
      1.8
    );
    rearAccent.position.set(0, 3, -10); // Example position
    viewer.scene.add(rearAccent);

    // Duplicate hemisphere light removed, primary one is managed by UI and initialized here.
  }

  createControls() {
    const viewer = this.viewer;
    viewer.controls = new OrbitControls(
      viewer.camera,
      viewer.renderer.domElement
    );
    viewer.controls.enableDamping = true;
    viewer.controls.dampingFactor = 0.05;
    viewer.controls.screenSpacePanning = false; // Usually true for better UX
    viewer.controls.minDistance = 3; // Sensible default min zoom
    viewer.controls.maxDistance = 30; // Sensible default max zoom

    // Store initial camera orientation to lock vertical rotation
    const cameraPos = viewer.camera.position.clone();
    const targetPos = viewer.modelCenter.clone(); // modelCenter is on viewer
    const direction = new THREE.Vector3().subVectors(cameraPos, targetPos);
    const radius = direction.length(); // Calculate radius from current camera position to target
    const polarAngle = Math.acos(direction.y / radius); // Calculate current polar angle

    // Lock vertical rotation by setting min and max polar angle to the initial angle
    viewer.controls.minPolarAngle = polarAngle;
    viewer.controls.maxPolarAngle = polarAngle;

    viewer.controls.enableRotate = true; // Allow rotation
    viewer.controls.target.copy(viewer.modelCenter); // Ensure controls target is model center
    viewer.controls.update(); // Apply changes
  }

  resetToDefaultEnvironmentAndShadows() {
    const viewer = this.viewer;
    if (!viewer.scene) {
      console.warn(
        "SceneInitializer: Scene not available for resetting environment."
      );
      return;
    }

    // Reset to default (generated) environment map
    if (viewer.defaultEnvironmentMap) {
      viewer.scene.environment = viewer.defaultEnvironmentMap;
    } else {
      // Fallback if default map wasn't created or is gone
      this.createStudioEnvironmentMap(); // Recreate it
      if (viewer.defaultEnvironmentMap) {
        // Check again
        viewer.scene.environment = viewer.defaultEnvironmentMap;
      }
    }

    // Reset shadows for keyLight to defaults
    if (viewer.keyLight && viewer.keyLight.shadow) {
      viewer.keyLight.castShadow = true; // Ensure it's on
      viewer.keyLight.shadow.mapSize.width = viewer.settings.shadowMapSize;
      viewer.keyLight.shadow.mapSize.height = viewer.settings.shadowMapSize;
      viewer.keyLight.shadow.bias = viewer.settings.shadowBias;
      viewer.keyLight.shadow.radius = viewer.settings.shadowRadius;
      // If the shadow map needs to be re-rendered or updated:
      if (viewer.keyLight.shadow.map) {
        viewer.keyLight.shadow.map.dispose();
        viewer.keyLight.shadow.map = null; // Force re-creation if necessary
      }
    }
  }
}
