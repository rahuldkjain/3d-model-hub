import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export class ModelHandler {
  constructor(viewer) {
    this.viewer = viewer; // Reference to the main ModelViewer instance
    this.gltfLoader = new GLTFLoader();
    this.rgbeLoader = new RGBELoader();
  }

  /**
   * Handles the file upload process for models.
   * @param {File} file - The file to upload.
   */
  handleFileUpload(file) {
    // DOM element access is direct as they are global or retrieved by ID here
    const uploadMessage = document.getElementById("upload-message");
    const loaderSpinner = document.querySelector(".upload-zone .loader");
    const uploadZone = document.querySelector(".upload-zone");

    if (uploadMessage) uploadMessage.textContent = `Loading ${file.name}...`;
    if (loaderSpinner) loaderSpinner.classList.remove("hidden");
    if (uploadZone) uploadZone.classList.add("loading");

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      const fileName = file.name;
      const fileExtension = fileName.split(".").pop().toLowerCase();

      if (fileExtension === "glb") {
        this.loadModelFromArrayBuffer(contents, fileName, "GLB");
      } else if (fileExtension === "gltf") {
        this.loadModelFromArrayBuffer(contents, fileName, "GLTF");
      } else {
        console.error("Unsupported file type. Please upload GLB or GLTF.");
        alert("Unsupported file type. Please upload GLB or GLTF.");
        if (uploadMessage)
          uploadMessage.textContent = "Upload failed. Try GLB/GLTF.";
        if (loaderSpinner) loaderSpinner.classList.add("hidden");
        if (uploadZone) uploadZone.classList.remove("loading");
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error reading file. Check console for details.");
      if (uploadMessage)
        uploadMessage.textContent = "Error reading file. Please try again.";
      if (loaderSpinner) loaderSpinner.classList.add("hidden");
      if (uploadZone) uploadZone.classList.remove("loading");
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Load a model from a URL (GLB or GLTF).
   * @param {string} modelURL - URL of the model file.
   * @param {string} modelName - Name of the model for display purposes.
   */
  loadModelByURL(modelURL, modelName) {
    // const viewer = this.viewer; // viewer instance is not directly needed here for its properties
    const uploadMessage = document.getElementById("upload-message");
    const loaderSpinner = document.querySelector(".upload-zone .loader");
    const uploadZone = document.querySelector(".upload-zone");
    const loadingElement = document.getElementById("loading");

    if (loadingElement && loadingElement.classList.contains("hidden")) {
      loadingElement.style.display = "flex";
      setTimeout(() => loadingElement.classList.remove("hidden"), 10);
    }

    if (uploadMessage) uploadMessage.textContent = `Loading ${modelName}...`;
    if (loaderSpinner) loaderSpinner.classList.remove("hidden");
    if (uploadZone) uploadZone.classList.add("loading");

    this.gltfLoader.load(
      modelURL,
      (gltf) => {
        this.setupNewModel(gltf.scene, modelName); // Calls method within ModelHandler
      },
      undefined,
      (error) => {
        console.error(`Error loading ${modelName} from URL:`, error);
        alert(`Error loading ${modelName}. Check console for details.`);
        if (uploadMessage)
          uploadMessage.textContent = `Error loading ${modelName}. Try another file.`;
        if (loaderSpinner) loaderSpinner.classList.add("hidden");
        if (uploadZone) uploadZone.classList.remove("loading");
      }
    );
  }

  /**
   * Load a model from an ArrayBuffer (GLB or GLTF).
   * @param {ArrayBuffer} modelData - ArrayBuffer content of the model file.
   * @param {string} modelName - Name of the model for display purposes.
   * @param {string} modelType - "GLB" or "GLTF".
   */
  loadModelFromArrayBuffer(modelData, modelName, modelType) {
    // const viewer = this.viewer; // viewer instance is not directly needed here for its properties
    const uploadMessage = document.getElementById("upload-message");
    const loaderSpinner = document.querySelector(".upload-zone .loader");
    const uploadZone = document.querySelector(".upload-zone");

    if (uploadMessage) {
      uploadMessage.textContent = `Processing ${modelName}...`;
    }

    try {
      this.gltfLoader.parse(
        modelData,
        "",
        (gltf) => {
          this.setupNewModel(gltf.scene, modelName); // Calls method within ModelHandler
        },
        (error) => {
          console.error(`Error parsing ${modelName} (${modelType}):`, error);
          alert(
            `Error parsing ${modelName}. Ensure it's a valid ${modelType} file. Check console.`
          );
          if (uploadMessage)
            uploadMessage.textContent = `Error processing ${modelName}. Try another file.`;
          if (loaderSpinner) loaderSpinner.classList.add("hidden");
          if (uploadZone) uploadZone.classList.remove("loading");
        }
      );
    } catch (error) {
      console.error(
        `Critical error during ${modelType} parsing for ${modelName}:`,
        error
      );
      alert(
        `Critical error parsing ${modelName}. Ensure it's a valid ${modelType} file and check console.`
      );
      if (uploadMessage)
        uploadMessage.textContent = `Critical error with ${modelName}. Try another file.`;
      if (loaderSpinner) loaderSpinner.classList.add("hidden");
      if (uploadZone) uploadZone.classList.remove("loading");
    }
  }

  /**
   * Setup the loaded model in the scene (generic version)
   * @param {THREE.Object3D} model - The loaded model (scene)
   * @param {string} modelName - The name of the model
   */
  setupNewModel(model, modelName) {
    const viewer = this.viewer;

    if (viewer.currentModel) {
      this._disposeModelResources(viewer.currentModel);
      viewer.scene.remove(viewer.currentModel);
    }
    viewer.currentModel = model;

    const originalBox = new THREE.Box3().setFromObject(viewer.currentModel); // For original size display
    const originalSize = originalBox.getSize(new THREE.Vector3());

    const center = originalBox.getCenter(new THREE.Vector3());
    viewer.currentModel.position.sub(center); // Center the model object itself at its local origin

    const sizeAfterCentering = new THREE.Box3()
      .setFromObject(viewer.currentModel)
      .getSize(new THREE.Vector3());
    const maxSize = Math.max(
      sizeAfterCentering.x,
      sizeAfterCentering.y,
      sizeAfterCentering.z
    );
    const desiredSize = 5; // Desired size for the largest dimension
    let scale = 1;
    if (maxSize > 0) {
      scale = desiredSize / maxSize;
    }
    viewer.currentModel.scale.set(scale, scale, scale);

    // Recalculate bounding box AFTER scaling to get accurate minY for ground placement
    // The model is already centered at its own origin (0,0,0) locally.
    const scaledBox = new THREE.Box3().setFromObject(viewer.currentModel);
    // To place its bottom on the ground plane (y=viewer.ground.position.y),
    // its world position.y should be viewer.ground.position.y - its local scaledBox.min.y
    viewer.currentModel.position.y =
      (viewer.ground ? viewer.ground.position.y : 0) - scaledBox.min.y;

    viewer.currentModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    viewer.scene.add(viewer.currentModel);

    const finalWorldPos = new THREE.Vector3();
    viewer.currentModel.getWorldPosition(finalWorldPos); // Get final world position

    const finalBoundingBox = new THREE.Box3().setFromObject(
      viewer.currentModel
    );
    finalBoundingBox.getCenter(viewer.modelCenter);

    if (
      viewer.interactionManager &&
      viewer.controls &&
      viewer.cameraDistanceInput
    ) {
      // Set the control's target to the new model's center
      viewer.controls.target.copy(viewer.modelCenter);

      // Make sure the camera is looking at the new center before adjusting distance
      viewer.camera.lookAt(viewer.modelCenter);

      // Apply the current camera distance from the UI (or default settings)
      const desiredDistance = parseFloat(
        viewer.cameraDistanceInput.value || viewer.settings.cameraDistance
      );
      viewer.interactionManager.setCameraDistance(desiredDistance);

      viewer.controls.update(); // Update controls after changing target and camera position
    } else {
      console.warn(
        "InteractionManager, OrbitControls, or cameraDistanceInput not available on viewer instance when trying to frame model from ModelHandler."
      );
    }

    if (viewer.isAutoRotating) {
      viewer.toggleAutoRotation();
      viewer.toggleAutoRotation();
    }

    // Show viewer interface and hide landing/loading elements
    if (this.viewer.uiManager) {
      this.viewer.uiManager.showViewerInterface();
    }

    // Reset upload zone text and spinner (still makes sense here after processing)
    const uploadMessage = document.getElementById("upload-message");
    const loaderSpinner = document.querySelector(".upload-zone .loader");
    const uploadZone = document.querySelector(".upload-zone");
    if (uploadMessage)
      uploadMessage.textContent = "Drag & Drop or Click to Upload (GLB/GLTF)";
    if (loaderSpinner) loaderSpinner.classList.add("hidden");
    if (uploadZone) uploadZone.classList.remove("loading");

    const averageModelColor = this.getAverageModelColor(viewer.currentModel);
    if (averageModelColor) {
      try {
        const intelligentSceneBgColor = averageModelColor
          .clone()
          .lerp(new THREE.Color(0xffffff), 0.85);
        if (viewer.sceneBackgroundColorInput) {
          viewer.sceneBackgroundColorInput.value = `#${intelligentSceneBgColor.getHexString()}`;
          viewer.sceneBackgroundColorInput.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }

        const intelligentFloorColor = averageModelColor
          .clone()
          .lerp(new THREE.Color(0x000000), 0.1)
          .multiplyScalar(0.6);
        if (viewer.floorColorInput) {
          viewer.floorColorInput.value = `#${intelligentFloorColor.getHexString()}`;
          viewer.floorColorInput.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      } catch (e) {
        console.error("Error applying intelligent colors:", e);
      }
    }

    if (viewer.infoPanel) {
      // Preserve the close button by only updating the content, not the entire innerHTML
      const closeButton = viewer.infoPanel.querySelector("#info-close-button");

      viewer.infoPanel.innerHTML = `
        <strong>Controls:</strong><br />
        • Mouse: Orbit camera<br />
        • Scroll: Zoom in/out<br />
        • Right-click + drag: Pan<br />
        • Use panel controls for customization<br/>
        <br/>
        <strong>Loaded Model:</strong> ${modelName}<br/>
        Scaled Size: ${(originalSize.x * scale).toFixed(2)} x ${(
        originalSize.y * scale
      ).toFixed(2)} x ${(originalSize.z * scale).toFixed(2)} units
      `;

      // Re-add the close button if it existed
      if (closeButton) {
        viewer.infoPanel.appendChild(closeButton);
      } else {
        // Create the close button if it doesn't exist
        const newCloseButton = document.createElement("button");
        newCloseButton.id = "info-close-button";
        newCloseButton.setAttribute("aria-label", "Close info panel");
        newCloseButton.style.cssText =
          "position: absolute !important; top: 8px !important; right: 8px !important; width: 28px !important; height: 28px !important; background: #7c3aed !important; border: 2px solid #ffffff !important; border-radius: 50% !important; color: white !important; font-size: 18px !important; font-weight: bold !important; cursor: pointer !important; z-index: 9999 !important; display: flex !important; align-items: center !important; justify-content: center !important;";
        newCloseButton.innerHTML = "×";
        viewer.infoPanel.appendChild(newCloseButton);

        // Re-attach the event listener
        if (viewer.uiManager && viewer.uiManager.infoCloseButton) {
          viewer.uiManager.infoCloseButton = newCloseButton;
          newCloseButton.addEventListener("click", () => {
            viewer.infoPanel.classList.add("info-hidden-by-user");
            try {
              localStorage.setItem("infoPanelClosedByUser", "true");
            } catch (e) {
              console.warn(
                "Could not save info panel preference to localStorage.",
                e
              );
            }
          });
        }
      }
    }

    if (viewer.hdriUploadInput) viewer.hdriUploadInput.value = "";
  }

  _disposeModelResources(object) {
    if (!object) return;

    object.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) =>
              this._disposeMaterialResources(material)
            );
          } else {
            this._disposeMaterialResources(child.material);
          }
        }
      }
    });
  }

  _disposeMaterialResources(material) {
    material.dispose(); // Base material dispose

    // Dispose of known texture properties
    const textureProps = [
      "map",
      "lightMap",
      "aoMap",
      "emissiveMap",
      "bumpMap",
      "normalMap",
      "displacementMap",
      "roughnessMap",
      "metalnessMap",
      "alphaMap",
      "envMap",
      "specularMap",
      "gradientMap",
      "transmissionMap",
      "thicknessMap",
      "sheenColorMap",
      "sheenRoughnessMap",
      "clearcoatMap",
      "clearcoatNormalMap",
      "clearcoatRoughnessMap",
      "iridescenceMap",
      "iridescenceThicknessMap",
      "anisotropyMap",
      // Add any other texture properties your materials might use
    ];

    textureProps.forEach((prop) => {
      if (material[prop] && typeof material[prop].dispose === "function") {
        material[prop].dispose();
      }
    });
  }

  /**
   * Calculates the average color from all MeshStandardMaterial instances in a model.
   * @param {THREE.Object3D} model - The model to analyze.
   * @returns {THREE.Color | null} The average color, or null if no suitable materials found.
   */
  getAverageModelColor(model) {
    let totalR = 0,
      totalG = 0,
      totalB = 0;
    let materialCount = 0;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => {
          if (
            material.isMeshStandardMaterial ||
            (material.color && material.color.isColor)
          ) {
            totalR += material.color.r;
            totalG += material.color.g;
            totalB += material.color.b;
            materialCount++;
          }
        });
      }
    });

    if (materialCount === 0) {
      console.warn("No materials found to calculate average color.");
      return null;
    }
    const averageColor = new THREE.Color(
      totalR / materialCount,
      totalG / materialCount,
      totalB / materialCount
    );
    return averageColor;
  }

  /**
   * Handles HDRI file upload.
   * @param {File} file - The .hdr file.
   */
  handleHdriUpload(file) {
    const viewer = this.viewer;
    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      try {
        const texture = this.rgbeLoader.parse(contents); // Use this.rgbeLoader
        if (!texture)
          throw new Error("RGBELoader.parse returned null or undefined.");
        texture.mapping = THREE.EquirectangularReflectionMapping;

        if (
          viewer.currentHdriTexture &&
          typeof viewer.currentHdriTexture.dispose === "function"
        ) {
          viewer.currentHdriTexture.dispose();
        }
        viewer.currentHdriTexture = texture;

        viewer.scene.environment = texture;
        viewer.scene.background = texture;
        if (viewer.scene.fog) {
          viewer.scene.fog.near = 10000;
          viewer.scene.fog.far = 11000;
        }

        if (viewer.currentHdriNameDisplay)
          viewer.currentHdriNameDisplay.textContent = file.name;
        if (viewer.renderer) viewer.renderer.initTexture(texture);
      } catch (error) {
        console.error("Error processing HDRI file:", error);
        alert(
          "Failed to load HDRI. Ensure it is a valid .hdr file. Check console."
        );
        if (viewer.currentHdriNameDisplay)
          viewer.currentHdriNameDisplay.textContent =
            "Default studio (load failed)";
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading HDRI file:", error);
      alert("Error reading HDRI file. Check console.");
    };
    reader.readAsArrayBuffer(file);
    // Access hdriUploadInput via viewer instance, as it's initialized by UIManager on viewer
    if (viewer.hdriUploadInput) viewer.hdriUploadInput.value = "";
  }

  clearCurrentHdriTexture() {
    const viewer = this.viewer;
    if (viewer.currentHdriTexture) {
      if (typeof viewer.currentHdriTexture.dispose === "function") {
        viewer.currentHdriTexture.dispose();
      } else {
        console.warn(
          "ModelHandler: currentHdriTexture existed but had no dispose method."
        );
      }
      viewer.currentHdriTexture = null;
    }
  }
}
