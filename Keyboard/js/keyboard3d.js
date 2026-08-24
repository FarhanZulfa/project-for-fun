/* ==========================================================================
   KeyLab - Real 3D WebGL Mechanical Keyboard Engine (Three.js + Anime.js)
   Authentic ANSI Layouts (100% Full-Size, TKL, 75%, 65%, 60%)
   Real High-Res Keycap Legends, CNC Aluminum Chassis & Switch Physics
   ========================================================================== */

class Keyboard3DEngine {
  constructor(canvasContainerId, synth) {
    this.container = document.getElementById(canvasContainerId);
    this.synth = synth;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.keyMeshes = {}; // maps keycode -> 3D Mesh
    this.keyboardGroup = null;
    this.currentLayout = 'ansi_100';
    this.isInitialized = false;

    // Base Materials
    this.materials = {};
    this.textureCache = {};

    this.init();
  }

  init() {
    if (!this.container || typeof THREE === 'undefined') return;

    const width = this.container.clientWidth || 960;
    const height = 480;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    this.camera.position.set(0, 19, 27);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with antialiasing & tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.15;
      this.controls.minDistance = 8;
      this.controls.maxDistance = 45;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Studio Lighting Rig
    this.setupLighting();

    // 6. Materials
    this.initMaterials();

    // 7. Desk Shadow Plane
    this.buildDeskShadow();

    // 8. Build Initial Keyboard Model
    this.buildKeyboardModel(this.currentLayout);

    // 9. Render Loop
    this.animate = this.animate.bind(this);
    this.isInitialized = true;
    requestAnimationFrame(this.animate);

    // Window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setupLighting() {
    // Ambient soft warm studio fill
    const ambientLight = new THREE.AmbientLight(0xFFF7EE, 0.75);
    this.scene.add(ambientLight);

    // Main Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xFFF1E4, 1.4);
    keyLight.position.set(16, 24, 18);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.camera.left = -22;
    keyLight.shadow.camera.right = 22;
    keyLight.shadow.camera.top = 22;
    keyLight.shadow.camera.bottom = -22;
    keyLight.shadow.bias = -0.0004;
    this.scene.add(keyLight);

    // Cool Metallic Rim Light
    const rimLight = new THREE.DirectionalLight(0x8AB4F8, 0.65);
    rimLight.position.set(-18, 12, -15);
    this.scene.add(rimLight);

    // Subtle Overhead Point Fill
    const topLight = new THREE.PointLight(0xFFFFFF, 0.45, 35);
    topLight.position.set(0, 12, 0);
    this.scene.add(topLight);
  }

  initMaterials() {
    // CNC Anodized Aluminum Case
    this.materials.case = new THREE.MeshStandardMaterial({
      color: 0x1A1715,
      roughness: 0.32,
      metalness: 0.88
    });

    // Brushed Brass Switch Plate
    this.materials.plate = new THREE.MeshStandardMaterial({
      color: 0xBFA054,
      roughness: 0.28,
      metalness: 0.92
    });

    // Base Alpha Sides (Vintage Cream)
    this.materials.alphaSide = new THREE.MeshStandardMaterial({
      color: 0xDDD8CF,
      roughness: 0.65,
      metalness: 0.04
    });

    // Base Modifier Sides (Industrial Slate)
    this.materials.modSide = new THREE.MeshStandardMaterial({
      color: 0x2A2522,
      roughness: 0.65,
      metalness: 0.04
    });

    // Base Accent Sides (Terracotta)
    this.materials.accentSide = new THREE.MeshStandardMaterial({
      color: 0xB85235,
      roughness: 0.6,
      metalness: 0.04
    });

    // Active Pressed Material
    this.materials.pressed = new THREE.MeshStandardMaterial({
      color: 0xF79342,
      roughness: 0.35,
      metalness: 0.1,
      emissive: 0x662500,
      emissiveIntensity: 0.45
    });
  }

  // Create sharp, authentic Canvas texture for keycap top face
  createKeycapTexture(label, sub, type, keyUnitsWidth = 1) {
    const cacheKey = `${label}_${sub}_${type}_${keyUnitsWidth}`;
    if (this.textureCache[cacheKey]) {
      return this.textureCache[cacheKey];
    }

    const canvas = document.createElement('canvas');
    const width = Math.round(256 * Math.max(1, keyUnitsWidth));
    const height = 256;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // 1. Keycap Top Background
    let bgColor = '#E8E3DA';
    let textColor = '#2C2723';
    let subColor = 'rgba(44, 39, 35, 0.65)';

    if (type === 'mod') {
      bgColor = '#2E2925';
      textColor = '#E8E3DA';
      subColor = 'rgba(232, 227, 218, 0.65)';
    } else if (type === 'accent') {
      bgColor = '#C25B3E';
      textColor = '#FFFFFF';
      subColor = 'rgba(255, 255, 255, 0.75)';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle keycap top inner rim bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // 2. Legend Typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cleanLabel = (label || '').trim();
    const cleanSub = (sub || '').trim();

    if (cleanSub) {
      // Dual Legend (e.g. ~ and ` or ! and 1 or { and [)
      ctx.fillStyle = textColor;
      ctx.font = 'bold 64px "JetBrains Mono", monospace';
      ctx.fillText(cleanLabel, width / 2, 85);

      ctx.fillStyle = subColor;
      ctx.font = '500 56px "JetBrains Mono", monospace';
      ctx.fillText(cleanSub, width / 2, 175);
    } else {
      // Single Legend
      ctx.fillStyle = textColor;

      if (cleanLabel.length === 1) {
        // Alphanumeric standard character
        ctx.font = 'bold 88px "JetBrains Mono", monospace';
        ctx.fillText(cleanLabel, width / 2, height / 2 + 4);
      } else if (cleanLabel.length <= 4) {
        // Short modifier (ESC, TAB, DEL, ALT, F1..F12, WIN)
        ctx.font = 'bold 54px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(cleanLabel, width / 2, height / 2 + 4);
      } else {
        // Longer modifier (ENTER, SHIFT, CAPS, SPACE, BACKSPACE)
        ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(cleanLabel, width / 2, height / 2 + 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.generateMipmaps = true;

    this.textureCache[cacheKey] = texture;
    return texture;
  }

  // Build keycap materials array: [Right, Left, Top (textured), Bottom, Front, Back]
  getKeycapMaterials(label, sub, type, keyUnitsWidth) {
    const topTexture = this.createKeycapTexture(label, sub, type, keyUnitsWidth);
    const sideMat = type === 'accent'
      ? this.materials.accentSide
      : (type === 'mod' ? this.materials.modSide : this.materials.alphaSide);

    const topMat = new THREE.MeshStandardMaterial({
      map: topTexture,
      roughness: 0.58,
      metalness: 0.04
    });

    return [
      sideMat, // +X
      sideMat, // -X
      topMat,  // +Y (Top with crisp text)
      sideMat, // -Y
      sideMat, // +Z
      sideMat  // -Z
    ];
  }

  // Parse Key Width in units from CSS class (e.g. 'k-1', 'k-125', 'k-225', 'k-625')
  parseKeyWidth(cls) {
    if (!cls) return 1.0;
    if (cls.includes('k-625')) return 6.25;
    if (cls.includes('k-275')) return 2.75;
    if (cls.includes('k-225')) return 2.25;
    if (cls.includes('k-2')) return 2.0;
    if (cls.includes('k-175')) return 1.75;
    if (cls.includes('k-15')) return 1.5;
    if (cls.includes('k-125')) return 1.25;
    return 1.0;
  }

  // Parse Key Type from CSS class
  parseKeyType(cls) {
    if (!cls) return 'alpha';
    if (cls.includes('accent-esc') || cls.includes('accent-enter') || cls.includes('accent-alt')) return 'accent';
    if (cls.includes('mod')) return 'mod';
    return 'alpha';
  }

  // Dynamically build 3D Keyboard according to layout key
  buildKeyboardModel(layoutKey = 'ansi_100') {
    this.currentLayout = layoutKey;

    if (this.keyboardGroup) {
      this.scene.remove(this.keyboardGroup);
      this.keyboardGroup.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
        }
      });
    }

    this.keyMeshes = {};
    this.keyboardGroup = new THREE.Group();

    const layout = (window.KEYBOARD_LAYOUTS && window.KEYBOARD_LAYOUTS[layoutKey])
      ? window.KEYBOARD_LAYOUTS[layoutKey]
      : (window.KEYBOARD_LAYOUTS ? window.KEYBOARD_LAYOUTS.ansi_100 : []);

    const uSize = 1.15; // 1 key unit in 3D world units

    // Compute layout dimensional bounds
    let maxRowUnits = 15;
    let totalRows = layout.length || 6;

    layout.forEach(row => {
      let rowUnits = 0;
      row.forEach(k => {
        if (k.spacer) rowUnits += k.w;
        else rowUnits += this.parseKeyWidth(k.cls);
      });
      if (rowUnits > maxRowUnits) maxRowUnits = rowUnits;
    });

    const caseWidth = (maxRowUnits * uSize) + 0.85;
    const caseDepth = (totalRows * 1.18) + 0.85;
    const caseHeight = 1.15;

    // 1. CNC Anodized Aluminum Chassis Base
    const caseGeo = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);
    const caseMesh = new THREE.Mesh(caseGeo, this.materials.case);
    caseMesh.position.set(0, -caseHeight / 2, 0);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    this.keyboardGroup.add(caseMesh);

    // 2. Brass Switch Plate Insert
    const plateGeo = new THREE.BoxGeometry(caseWidth - 0.5, 0.16, caseDepth - 0.5);
    const plateMesh = new THREE.Mesh(plateGeo, this.materials.plate);
    plateMesh.position.set(0, 0.05, 0);
    plateMesh.receiveShadow = true;
    this.keyboardGroup.add(plateMesh);

    // 3. Populate 3D Keycaps with Real Legends
    const startZ = -((totalRows - 1) * 1.18) / 2;
    const globalStartX = -(maxRowUnits * uSize) / 2;

    layout.forEach((row, rIdx) => {
      let currentX = globalStartX;
      const zPos = startZ + (rIdx * 1.18);

      row.forEach(k => {
        if (k.spacer) {
          currentX += (k.w * uSize);
          return;
        }

        const keyUnitsWidth = this.parseKeyWidth(k.cls);
        const keyType = this.parseKeyType(k.cls);

        const keyWidth = (keyUnitsWidth * uSize) - 0.08;
        const keyDepth = uSize - 0.08;
        const keyHeight = 0.54;

        const geo = new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth);
        const mats = this.getKeycapMaterials(k.label, k.sub, keyType, keyUnitsWidth);

        const mesh = new THREE.Mesh(geo, mats);
        mesh.position.set(currentX + keyWidth / 2, 0.42, zPos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
          code: k.code,
          originalY: 0.42,
          originalMats: mats,
          type: keyType
        };

        this.keyMeshes[k.code] = mesh;
        this.keyboardGroup.add(mesh);

        currentX += (keyUnitsWidth * uSize);
      });
    });

    // Ergonomic 5.5-degree incline
    this.keyboardGroup.rotation.x = THREE.MathUtils.degToRad(5.5);
    this.scene.add(this.keyboardGroup);

    // Adjust camera distance to fit layout width perfectly
    this.adjustCameraForLayout(maxRowUnits, totalRows);
  }

  adjustCameraForLayout(maxUnits, totalRows) {
    if (!this.camera) return;

    let targetZ = 22;
    let targetY = 16;

    if (maxUnits > 20) {
      // 100% Full-size
      targetZ = 28;
      targetY = 20;
    } else if (maxUnits > 17) {
      // TKL 80%
      targetZ = 23;
      targetY = 17;
    } else if (totalRows > 5) {
      // 75%
      targetZ = 20;
      targetY = 15;
    } else {
      // 65% or 60%
      targetZ = 18;
      targetY = 13.5;
    }

    if (typeof anime !== 'undefined' && this.controls) {
      anime({
        targets: this.camera.position,
        x: 0,
        y: targetY,
        z: targetZ,
        duration: 700,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
        update: () => this.controls.update()
      });
    } else {
      this.camera.position.set(0, targetY, targetZ);
      if (this.controls) this.controls.update();
    }
  }

  setLayout(layoutKey) {
    if (window.KEYBOARD_LAYOUTS && window.KEYBOARD_LAYOUTS[layoutKey]) {
      this.buildKeyboardModel(layoutKey);
    }
  }

  buildDeskShadow() {
    const shadowGeo = new THREE.PlaneGeometry(42, 28);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.38 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.18;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  // Animate 3D Keycap Press with Anime.js
  pressKey3D(code) {
    const mesh = this.keyMeshes[code];
    if (!mesh) return;

    // Active pressed highlight
    mesh.material = this.materials.pressed;

    if (typeof anime !== 'undefined') {
      anime.remove(mesh.position);
      anime({
        targets: mesh.position,
        y: mesh.userData.originalY - 0.22,
        duration: 40,
        easing: 'easeOutQuad'
      });
    } else {
      mesh.position.y = mesh.userData.originalY - 0.22;
    }

    // Ripple wave for Space or Enter
    if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') {
      this.triggerRippleEffect(mesh.position);
    }
  }

  // Animate 3D Keycap Release with Anime.js
  releaseKey3D(code) {
    const mesh = this.keyMeshes[code];
    if (!mesh) return;

    if (typeof anime !== 'undefined') {
      anime.remove(mesh.position);
      anime({
        targets: mesh.position,
        y: mesh.userData.originalY,
        duration: 220,
        easing: 'easeOutElastic(1, .55)',
        complete: () => {
          mesh.material = mesh.userData.originalMats;
        }
      });
    } else {
      mesh.position.y = mesh.userData.originalY;
      mesh.material = mesh.userData.originalMats;
    }
  }

  triggerRippleEffect(centerPos) {
    if (typeof anime === 'undefined') return;

    Object.values(this.keyMeshes).forEach(mesh => {
      const dist = mesh.position.distanceTo(centerPos);
      if (dist > 0.5 && dist < 6.0) {
        anime({
          targets: mesh.position,
          y: [mesh.userData.originalY, mesh.userData.originalY - (0.07 / (dist * 0.7)), mesh.userData.originalY],
          delay: dist * 22,
          duration: 260,
          easing: 'easeInOutSine'
        });
      }
    });
  }

  resetCameraAngle() {
    this.adjustCameraForLayout(
      this.currentLayout === 'ansi_100' ? 22 : (this.currentLayout === 'ansi_tkl' ? 18 : 16),
      6
    );
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = Math.max(380, Math.min(520, window.innerHeight * 0.5));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.controls) {
      this.controls.update();
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.Keyboard3DEngine = Keyboard3DEngine;

