export class UtilityManager {
  // Example utility function: Debounce
  debounce(func, delay) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Example utility function: Throttle
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Add more utility functions as needed, for example:
  // - Unique ID generator
  // - String manipulation functions
  // - Data formatting functions
  // - etc.

  exportSceneAsPNG() {
    const viewer = this.viewer;
    try {
      // Ensure scene is rendered once before capture for latest view
      if (viewer.renderer && viewer.scene && viewer.camera) {
        viewer.renderer.render(viewer.scene, viewer.camera);
      } else {
        console.error(
          "Renderer, scene, or camera not available for PNG export."
        );
        alert("Cannot export image: rendering components missing.");
        return;
      }

      const dataURL = viewer.renderer.domElement.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "3d_model_scene.png";
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("UtilityManager: Error exporting scene as PNG:", e);
      alert("Error exporting image. See console for details.");
    }
  }
}
