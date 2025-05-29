import * as THREE from "three"; // Import THREE library

export class UIManager {
  constructor(viewer) {
    this.viewer = viewer; // Reference to the main ModelViewer instance
    this.initDOMElements();
  }

  initDOMElements() {
    const viewer = this.viewer;

    // Color Inputs from constructor
    viewer.floorColorInput = document.getElementById("floorColor");
    viewer.sceneBackgroundColorInput = document.getElementById(
      "sceneBackgroundColor"
    );
    viewer.hemisphereSkyColorInput =
      document.getElementById("hemisphereSkyColor");
    viewer.hemisphereGroundColorInput = document.getElementById(
      "hemisphereGroundColor"
    );
    viewer.hemisphereIntensityInput = document.getElementById(
      "hemisphereIntensity"
    );

    // HDRI Inputs from constructor
    viewer.hdriUploadInput = document.getElementById("hdriUpload");
    viewer.clearHdriButton = document.getElementById("clearHdriButton");
    viewer.currentHdriNameDisplay = document.getElementById("currentHdriName");

    // Shadow Inputs from constructor
    viewer.shadowMapSizeInput = document.getElementById("shadowMapSize");
    viewer.shadowBiasInput = document.getElementById("shadowBias");
    viewer.shadowRadiusInput = document.getElementById("shadowRadius");

    // Bloom Inputs from constructor
    viewer.bloomToggleInput = document.getElementById("bloomToggle");
    viewer.bloomThresholdInput = document.getElementById("bloomThreshold");
    viewer.bloomStrengthInput = document.getElementById("bloomStrength");
    viewer.bloomRadiusInput = document.getElementById("bloomRadius");

    // SSAO Inputs from constructor
    viewer.ssaoToggleInput = document.getElementById("ssaoToggle");
    viewer.ssaoKernelRadiusInput = document.getElementById("ssaoKernelRadius");
    viewer.ssaoMinDistanceInput = document.getElementById("ssaoMinDistance");
    viewer.ssaoMaxDistanceInput = document.getElementById("ssaoMaxDistance");

    // SMAA Input from constructor
    viewer.smaaToggleInput = document.getElementById("smaaToggle");

    // Inputs from init() that are primarily UI controls
    viewer.ambientLightInput = document.getElementById("ambientLight");
    viewer.ambientLightColorInput =
      document.getElementById("ambientLightColor");
    viewer.keyLightIntensityInput =
      document.getElementById("keyLightIntensity");
    viewer.keyLightColorInput = document.getElementById("keyLightColor");
    viewer.cameraDistanceInput = document.getElementById("cameraDistance");
    viewer.toggleRotationButton = document.getElementById("toggleRotation");
    viewer.resetViewButton = document.getElementById("resetView");
    viewer.exportPNGButton = document.getElementById("exportPNG");
    viewer.newUploadButton = document.getElementById("newUploadButton");

    // Mobile menu elements
    this.hamburgerMenu = document.getElementById("hamburger-menu");
    this.mobileMenuOverlay = document.getElementById("mobile-menu-overlay");

    // Info Panel elements for user preference
    viewer.infoPanel = document.getElementById("info"); // Already used by ModelHandler for content
    this.infoCloseButton = document.getElementById("info-close-button");
  }

  setupEventListeners() {
    const viewer = this.viewer;

    // Window resize
    window.addEventListener(
      "resize",
      viewer.rendererManager.onWindowResize.bind(viewer.rendererManager),
      false
    );

    // Camera distance control
    if (viewer.cameraDistanceInput) {
      viewer.cameraDistanceInput.addEventListener("input", (event) => {
        viewer.interactionManager.setCameraDistance(
          parseFloat(event.target.value)
        );
      });
    }

    // Auto-rotation toggle
    if (viewer.toggleRotationButton) {
      viewer.toggleRotationButton.addEventListener(
        "click",
        viewer.interactionManager.toggleModelAutoRotation.bind(
          viewer.interactionManager
        )
      );
    }

    // Ambient light intensity control
    if (viewer.ambientLightInput) {
      viewer.ambientLightInput.addEventListener("input", (event) => {
        if (viewer.ambientLight)
          viewer.ambientLight.intensity =
            parseFloat(event.target.value) * Math.PI;
      });
    }
    // Ambient light color control
    if (viewer.ambientLightColorInput) {
      viewer.ambientLightColorInput.addEventListener("input", (event) => {
        if (viewer.ambientLight)
          viewer.ambientLight.color.set(event.target.value);
      });
    }

    // Key light intensity control
    if (viewer.keyLightIntensityInput) {
      viewer.keyLightIntensityInput.addEventListener("input", (event) => {
        if (viewer.keyLight)
          viewer.keyLight.intensity = parseFloat(event.target.value) * Math.PI;
      });
    }
    // Key light color control
    if (viewer.keyLightColorInput) {
      viewer.keyLightColorInput.addEventListener("input", (event) => {
        if (viewer.keyLight) viewer.keyLight.color.set(event.target.value);
      });
    }

    // Floor color control
    if (viewer.floorColorInput) {
      viewer.floorColorInput.addEventListener("input", (event) => {
        if (viewer.ground && viewer.ground.material) {
          viewer.ground.material.color.set(event.target.value);
        }
      });
    }

    // Scene Background Color Control
    if (viewer.sceneBackgroundColorInput) {
      viewer.sceneBackgroundColorInput.addEventListener("input", (event) => {
        const newBgColor = new THREE.Color(event.target.value);
        viewer.scene.background = newBgColor;
        if (viewer.scene.fog) {
          viewer.scene.fog.color.copy(newBgColor);
        } else {
          viewer.scene.fog = new THREE.Fog(newBgColor, 20, 150);
        }
      });
    }

    // Reset view button
    if (viewer.resetViewButton) {
      viewer.resetViewButton.addEventListener(
        "click",
        viewer.interactionManager.resetControls.bind(viewer.interactionManager)
      );
    }

    // Export PNG button
    if (viewer.exportPNGButton) {
      viewer.exportPNGButton.addEventListener("click", () => {
        viewer.utilityManager.exportSceneAsPNG();
      });
    }

    // New Upload Button
    if (viewer.newUploadButton) {
      viewer.newUploadButton.addEventListener("click", () => {
        viewer.returnToLandingPage();
      });
    }

    // Add event listener for file input
    const modelUpload = document.getElementById("modelUpload");
    if (modelUpload) {
      modelUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          viewer.handleFileUpload(file); // Call viewer's method
        }
      });
    }

    // Add event listeners for CTA button and upload zone
    const ctaButton = document.getElementById("cta-button");
    const uploadZone = document.getElementById("upload-zone");

    if (ctaButton) {
      ctaButton.addEventListener("click", () => {
        if (modelUpload) {
          modelUpload.click();
        }
      });
    }

    if (uploadZone && modelUpload) {
      // Click handler for upload zone
      uploadZone.addEventListener("click", (event) => {
        // Prevent triggering if clicking on the file input itself
        if (event.target !== modelUpload) {
          modelUpload.click();
        }
      });

      // Drag and drop functionality
      uploadZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadZone.classList.add("drag-over");
      });

      uploadZone.addEventListener("dragleave", (event) => {
        event.preventDefault();
        uploadZone.classList.remove("drag-over");
      });

      uploadZone.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadZone.classList.remove("drag-over");

        const files = event.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          if (
            file.name.toLowerCase().endsWith(".glb") ||
            file.name.toLowerCase().endsWith(".gltf")
          ) {
            viewer.handleFileUpload(file);
          } else {
            alert("Please upload a GLB or GLTF file.");
          }
        }
      });
    }

    // Hemisphere Light Controls
    viewer.hemisphereSkyColorInput.addEventListener("input", (event) => {
      if (viewer.hemisphereLight) {
        viewer.hemisphereLight.color.set(event.target.value);
      }
    });
    viewer.hemisphereGroundColorInput.addEventListener("input", (event) => {
      if (viewer.hemisphereLight) {
        viewer.hemisphereLight.groundColor.set(event.target.value);
      }
    });
    viewer.hemisphereIntensityInput.addEventListener("input", (event) => {
      if (viewer.hemisphereLight) {
        viewer.hemisphereLight.intensity =
          parseFloat(event.target.value) * Math.PI;
      }
    });

    // Shadow Configuration Listeners
    if (viewer.shadowMapSizeInput) {
      viewer.shadowMapSizeInput.addEventListener("change", (event) => {
        if (viewer.keyLight && viewer.keyLight.shadow) {
          const newSize = parseInt(event.target.value);
          viewer.keyLight.shadow.mapSize.width = newSize;
          viewer.keyLight.shadow.mapSize.height = newSize;
          if (viewer.keyLight.shadow.map) {
            viewer.keyLight.shadow.map.dispose();
            viewer.keyLight.shadow.map = null;
          }
        }
      });
    }
    if (viewer.shadowBiasInput) {
      viewer.shadowBiasInput.addEventListener("input", (event) => {
        if (viewer.keyLight && viewer.keyLight.shadow) {
          viewer.keyLight.shadow.bias = parseFloat(event.target.value);
        }
      });
    }
    if (viewer.shadowRadiusInput) {
      viewer.shadowRadiusInput.addEventListener("input", (event) => {
        if (viewer.keyLight && viewer.keyLight.shadow) {
          viewer.keyLight.shadow.radius = parseFloat(event.target.value);
        }
      });
    }

    // Post-Processing Bloom Listeners
    if (viewer.bloomToggleInput) {
      viewer.bloomToggleInput.addEventListener("change", (event) => {
        if (viewer.bloomPass) {
          viewer.bloomPass.enabled = event.target.checked;
        }
      });
    }
    if (viewer.bloomThresholdInput) {
      viewer.bloomThresholdInput.addEventListener("input", (event) => {
        if (viewer.bloomPass) {
          viewer.bloomPass.threshold = parseFloat(event.target.value);
        }
      });
    }
    if (viewer.bloomStrengthInput) {
      viewer.bloomStrengthInput.addEventListener("input", (event) => {
        if (viewer.bloomPass) {
          viewer.bloomPass.strength = parseFloat(event.target.value);
        }
      });
    }
    if (viewer.bloomRadiusInput) {
      viewer.bloomRadiusInput.addEventListener("input", (event) => {
        if (viewer.bloomPass) {
          viewer.bloomPass.radius = parseFloat(event.target.value);
        }
      });
    }

    // SSAO Listeners
    if (viewer.ssaoToggleInput) {
      viewer.ssaoToggleInput.addEventListener("change", (event) => {
        if (viewer.ssaoPass) {
          viewer.ssaoPass.enabled = event.target.checked;
        }
      });
    }
    if (viewer.ssaoKernelRadiusInput) {
      viewer.ssaoKernelRadiusInput.addEventListener("input", (event) => {
        if (viewer.ssaoPass) {
          viewer.ssaoPass.kernelRadius = parseFloat(event.target.value);
        }
      });
    }
    if (viewer.ssaoMinDistanceInput) {
      viewer.ssaoMinDistanceInput.addEventListener("input", (event) => {
        if (viewer.ssaoPass) {
          viewer.ssaoPass.minDistance = parseFloat(event.target.value);
        }
      });
    }
    if (viewer.ssaoMaxDistanceInput) {
      viewer.ssaoMaxDistanceInput.addEventListener("input", (event) => {
        if (viewer.ssaoPass) {
          viewer.ssaoPass.maxDistance = parseFloat(event.target.value);
        }
      });
    }

    // SMAA Listener
    if (viewer.smaaToggleInput) {
      viewer.smaaToggleInput.addEventListener("change", (event) => {
        if (viewer.smaaPass) {
          viewer.smaaPass.enabled = event.target.checked;
        }
      });
    }

    // HDRI Upload and Clear
    if (viewer.hdriUploadInput) {
      viewer.hdriUploadInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          viewer.handleHdriUpload(file); // Call viewer's method
        }
      });
    }

    if (viewer.clearHdriButton) {
      viewer.clearHdriButton.addEventListener("click", () => {
        // Call viewer method, it has access to viewer.currentHdriTexture, etc.
        viewer.clearHdriEnvironmentAndSettings();
      });
    }

    // Hamburger menu toggle
    if (this.hamburgerMenu) {
      this.hamburgerMenu.addEventListener("click", () => {
        document.body.classList.toggle("mobile-menu-open");
        const isMenuOpen = document.body.classList.contains("mobile-menu-open");
        this.hamburgerMenu.setAttribute("aria-expanded", isMenuOpen.toString());
        if (isMenuOpen) {
          // Optional: Focus the first element in the menu for accessibility
          const controlsPanel = document.getElementById("controls");
          const firstFocusableElement = controlsPanel?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusableElement?.focus();
        } else {
          // Optional: Return focus to hamburger button when menu closes
          this.hamburgerMenu.focus();
        }
      });
    }

    // Mobile menu overlay click to close
    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.addEventListener("click", () => {
        if (document.body.classList.contains("mobile-menu-open")) {
          document.body.classList.remove("mobile-menu-open");
          this.hamburgerMenu.setAttribute("aria-expanded", "false");
          this.hamburgerMenu.focus(); // Return focus to hamburger
        }
      });
    }

    // Info Panel Close Button
    if (this.infoCloseButton && this.viewer.infoPanel) {
      this.infoCloseButton.addEventListener("click", () => {
        this.viewer.infoPanel.classList.add("info-hidden-by-user");
        try {
          localStorage.setItem("infoPanelClosedByUser", "true");
        } catch (e) {
          console.warn(
            "UIManager: Could not save info panel preference to localStorage.",
            e
          );
        }
      });
    }
  }

  setupAccordion() {
    const accordionHeaders = document.querySelectorAll(".accordion-header");
    accordionHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;

        header.classList.toggle("active");
        content.classList.toggle("active");

        if (content.classList.contains("active")) {
          // Use a more reliable method to calculate height
          content.style.maxHeight = "none"; // Temporarily remove max-height
          const height = content.scrollHeight;
          content.style.maxHeight = "0"; // Reset to 0 for animation

          // Use requestAnimationFrame to ensure proper calculation
          requestAnimationFrame(() => {
            content.style.maxHeight = Math.max(height, 500) + "px"; // Ensure minimum height
          });
        } else {
          content.style.maxHeight = "0";
        }
      });

      // Initialize all sections to be closed
      const content = header.nextElementSibling;
      if (content && content.classList.contains("accordion-content")) {
        content.style.maxHeight = "0";
      }
    });

    // Add a resize observer to recalculate heights when content changes
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        // Recalculate heights for active accordion sections
        document
          .querySelectorAll(".accordion-content.active")
          .forEach((content) => {
            content.style.maxHeight = "none";
            const height = content.scrollHeight;
            content.style.maxHeight = Math.max(height, 500) + "px";
          });
      });

      // Observe the controls panel for size changes
      const controlsPanel = document.getElementById("controls");
      if (controlsPanel) {
        resizeObserver.observe(controlsPanel);
      }
    }
  }

  showLandingPage() {
    const loadingElement = document.getElementById("loading");
    const uploadMessage = document.getElementById("upload-message");
    const loaderSpinner = document.querySelector(".upload-zone .loader");
    const uploadZone = document.querySelector(".upload-zone");
    const controlsPanel = document.getElementById("controls");
    const infoPanel = document.getElementById("info");

    if (loadingElement) {
      loadingElement.style.display = "flex";
      loadingElement.classList.remove("hidden");
    }
    if (uploadMessage)
      uploadMessage.textContent = "Drag & Drop or Click to Upload (GLB/GLTF)";
    if (loaderSpinner) loaderSpinner.classList.add("hidden");
    if (uploadZone) uploadZone.classList.remove("loading");

    if (controlsPanel) {
      controlsPanel.classList.remove("visible");
      setTimeout(() => {
        if (!controlsPanel.classList.contains("visible")) {
          controlsPanel.style.display = "none";
        }
      }, 500);
    }
    if (infoPanel) {
      infoPanel.classList.remove("visible");
      setTimeout(() => {
        if (!infoPanel.classList.contains("visible")) {
          infoPanel.style.display = "none";
        }
      }, 500);
    }

    document.body.classList.remove("viewer-active");
    document.body.classList.remove("mobile-menu-open"); // Close mobile menu if open
    if (this.hamburgerMenu) {
      this.hamburgerMenu.setAttribute("aria-expanded", "false");
    }
  }

  showViewerInterface() {
    const loadingElement = document.getElementById("loading");
    const controlsPanel = document.getElementById("controls");
    const infoPanel = document.getElementById("info");
    // Upload zone elements are handled by ModelHandler during load process

    if (loadingElement) {
      loadingElement.classList.add("hidden");
      setTimeout(() => {
        if (loadingElement.classList.contains("hidden")) {
          loadingElement.style.display = "none";
        }
      }, 500);
    }

    if (controlsPanel) {
      controlsPanel.style.display = "block";
      requestAnimationFrame(() => controlsPanel.classList.add("visible"));
    }
    if (infoPanel) {
      infoPanel.style.display = "block";
      requestAnimationFrame(() => infoPanel.classList.add("visible"));
    }

    // Check and apply user preference for info panel visibility
    if (this.viewer.infoPanel) {
      try {
        if (localStorage.getItem("infoPanelClosedByUser") === "true") {
          this.viewer.infoPanel.classList.add("info-hidden-by-user");
        } else {
          // Ensure it's not hidden by user preference if localStorage item is not true
          this.viewer.infoPanel.classList.remove("info-hidden-by-user");
        }
      } catch (e) {
        console.warn(
          "UIManager: Could not read info panel preference from localStorage.",
          e
        );
      }
    }

    document.body.classList.add("viewer-active");
  }

  // Helper method to be called from ModelViewer after HDRI is cleared by viewer logic
  // This part only resets the UI elements to default values
  resetEnvironmentRelatedControlsToDefaults() {
    const viewer = this.viewer;
    if (viewer.currentHdriNameDisplay) {
      viewer.currentHdriNameDisplay.textContent = "Default studio";
    }

    // Reset Shadow Configuration UI to defaults
    viewer.shadowMapSizeInput.value = viewer.settings.shadowMapSize;
    viewer.shadowBiasInput.value = viewer.settings.shadowBias;
    viewer.shadowRadiusInput.value = viewer.settings.shadowRadius;

    // Reset Bloom settings UI
    viewer.bloomToggleInput.checked = viewer.settings.bloomEnabled;
    viewer.bloomThresholdInput.value = viewer.settings.bloomThreshold;
    viewer.bloomStrengthInput.value = viewer.settings.bloomStrength;
    viewer.bloomRadiusInput.value = viewer.settings.bloomRadius;

    // Reset SSAO settings UI
    viewer.ssaoToggleInput.checked = viewer.settings.ssaoEnabled;
    viewer.ssaoKernelRadiusInput.value = viewer.settings.ssaoKernelRadius;
    viewer.ssaoMinDistanceInput.value = viewer.settings.ssaoMinDistance;
    viewer.ssaoMaxDistanceInput.value = viewer.settings.ssaoMaxDistance;

    // Reset SMAA settings UI
    viewer.smaaToggleInput.checked = viewer.settings.smaaEnabled;
  }
}
