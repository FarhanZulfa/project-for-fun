/* ==========================================================================
   KeyLab - Real 3D WebGL Mechanical Keyboard Engine (Three.js + Anime.js)
   Realistic CNC Aluminum Chassis, Dual-Tone Keycaps, 3D Physics & Lighting
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
    this.isInitialized = false;

    // Materials
    this.materials = {};

    this.init();
  }

  init() {
    if (!this.container || typeof THREE === 'undefined') return;

    const width = this.container.clientWidth || 960;
    const height = 480;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = null; // transparent to blend with studio theme

    // 2. Camera setup (Warm isometric perspective)
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    this.camera.position.set(0, 14, 18);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with antialiasing & soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Smooth damping)
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.15; // Don't flip below desk
      this.controls.minDistance = 8;
      this.controls.maxDistance = 32;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Studio Lighting Rig
    this.setupLighting();

    // 6. Materials
    this.initMaterials();

    // 7. Build 3D Keyboard Model (Case, Plate, Keycaps)
    this.buildKeyboardModel();

    // 8. Contact Shadow Ground Plane
    this.buildDeskShadow();

    // 9. Render Loop
    this.animate = this.animate.bind(this);
    this.isInitialized = true;
    requestAnimationFrame(this.animate);

    // Window resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  setupLighting() {
    // Ambient soft fill
    const ambientLight = new THREE.AmbientLight(0xFFF6EC, 0.7);
    this.scene.add(ambientLight);

    // Main Studio Key Light (Warm directional with soft shadow)
    const keyLight = new THREE.DirectionalLight(0xFFEEDD, 1.3);
    keyLight.position.set(12, 20, 14);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 16;
    keyLight.shadow.camera.bottom = -16;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Cool Rim Light for metallic edges
    const rimLight = new THREE.DirectionalLight(0x8AB4F8, 0.6);
    rimLight.position.set(-14, 10, -12);
    this.scene.add(rimLight);

    // Top subtle overhead light
    const topLight = new THREE.PointLight(0xFFFFFF, 0.4, 25);
    topLight.position.set(0, 10, 0);
    this.scene.add(topLight);
  }

  initMaterials() {
    // Anodized Aluminum Case
    this.materials.case = new THREE.MeshStandardMaterial({
      color: 0x1E1B18,
      roughness: 0.35,
      metalness: 0.85
    });

    // Brass Plate
    this.materials.plate = new THREE.MeshStandardMaterial({
      color: 0xC49A45,
      roughness: 0.3,
      metalness: 0.9
    });

    // Alpha Keycaps (Matte Vintage Cream)
    this.materials.alpha = new THREE.MeshStandardMaterial({
      color: 0xE8E3DA,
      roughness: 0.65,
      metalness: 0.05
    });

    // Modifier Keycaps (Industrial Slate)
    this.materials.mod = new THREE.MeshStandardMaterial({
      color: 0x2C2723,
      roughness: 0.65,
      metalness: 0.05
    });

    // Accent Esc & Enter (Terracotta)
    this.materials.accent = new THREE.MeshStandardMaterial({
      color: 0xC25B3E,
      roughness: 0.6,
      metalness: 0.05
    });

    // Pressed Active Highlight Material
    this.materials.pressed = new THREE.MeshStandardMaterial({
      color: 0xF79342,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x552200,
      emissiveIntensity: 0.3
    });
  }

  buildKeyboardModel() {
    this.keyboardGroup = new THREE.Group();

    // 1. CNC Aluminum Keyboard Case Base (Beveled block)
    const caseWidth = 19.4;
    const caseDepth = 7.8;
    const caseHeight = 1.1;

    const caseGeo = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);
    const caseMesh = new THREE.Mesh(caseGeo, this.materials.case);
    caseMesh.position.y = -caseHeight / 2;
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    this.keyboardGroup.add(caseMesh);

    // 2. Brass Switch Plate Insert
    const plateGeo = new THREE.BoxGeometry(caseWidth - 0.7, 0.15, caseDepth - 0.7);
    const plateMesh = new THREE.Mesh(plateGeo, this.materials.plate);
    plateMesh.position.y = 0.05;
    plateMesh.receiveShadow = true;
    this.keyboardGroup.add(plateMesh);

    // 3. 75% Layout 3D Keycap Matrix
    const layout = [
      // Row 0: Function Row (Esc, F1-F12, Del)
      [
        { code: 'Escape', w: 1, type: 'accent' },
        { code: 'F1', w: 1, type: 'mod' }, { code: 'F2', w: 1, type: 'mod' }, { code: 'F3', w: 1, type: 'mod' }, { code: 'F4', w: 1, type: 'mod' },
        { code: 'F5', w: 1, type: 'mod' }, { code: 'F6', w: 1, type: 'mod' }, { code: 'F7', w: 1, type: 'mod' }, { code: 'F8', w: 1, type: 'mod' },
        { code: 'F9', w: 1, type: 'mod' }, { code: 'F10', w: 1, type: 'mod' }, { code: 'F11', w: 1, type: 'mod' }, { code: 'F12', w: 1, type: 'mod' },
        { code: 'PrintScreen', w: 1, type: 'mod' }, { code: 'Delete', w: 1, type: 'mod' }
      ],
      // Row 1: Numbers + Backspace + Home
      [
        { code: 'Backquote', w: 1, type: 'alpha' },
        { code: 'Digit1', w: 1, type: 'alpha' }, { code: 'Digit2', w: 1, type: 'alpha' }, { code: 'Digit3', w: 1, type: 'alpha' },
        { code: 'Digit4', w: 1, type: 'alpha' }, { code: 'Digit5', w: 1, type: 'alpha' }, { code: 'Digit6', w: 1, type: 'alpha' },
        { code: 'Digit7', w: 1, type: 'alpha' }, { code: 'Digit8', w: 1, type: 'alpha' }, { code: 'Digit9', w: 1, type: 'alpha' },
        { code: 'Digit0', w: 1, type: 'alpha' }, { code: 'Minus', w: 1, type: 'alpha' }, { code: 'Equal', w: 1, type: 'alpha' },
        { code: 'Backspace', w: 2, type: 'mod' }, { code: 'Home', w: 1, type: 'mod' }
      ],
      // Row 2: Tab + QWERTY + PgUp
      [
        { code: 'Tab', w: 1.5, type: 'mod' },
        { code: 'KeyQ', w: 1, type: 'alpha' }, { code: 'KeyW', w: 1, type: 'alpha' }, { code: 'KeyE', w: 1, type: 'alpha' },
        { code: 'KeyR', w: 1, type: 'alpha' }, { code: 'KeyT', w: 1, type: 'alpha' }, { code: 'KeyY', w: 1, type: 'alpha' },
        { code: 'KeyU', w: 1, type: 'alpha' }, { code: 'KeyI', w: 1, type: 'alpha' }, { code: 'KeyO', w: 1, type: 'alpha' },
        { code: 'KeyP', w: 1, type: 'alpha' }, { code: 'BracketLeft', w: 1, type: 'alpha' }, { code: 'BracketRight', w: 1, type: 'alpha' },
        { code: 'Backslash', w: 1.5, type: 'mod' }, { code: 'PageUp', w: 1, type: 'mod' }
      ],
      // Row 3: Caps + ASDF + Enter + PgDn
      [
        { code: 'CapsLock', w: 1.75, type: 'mod' },
        { code: 'KeyA', w: 1, type: 'alpha' }, { code: 'KeyS', w: 1, type: 'alpha' }, { code: 'KeyD', w: 1, type: 'alpha' },
        { code: 'KeyF', w: 1, type: 'alpha' }, { code: 'KeyG', w: 1, type: 'alpha' }, { code: 'KeyH', w: 1, type: 'alpha' },
        { code: 'KeyJ', w: 1, type: 'alpha' }, { code: 'KeyK', w: 1, type: 'alpha' }, { code: 'KeyL', w: 1, type: 'alpha' },
        { code: 'Semicolon', w: 1, type: 'alpha' }, { code: 'Quote', w: 1, type: 'alpha' },
        { code: 'Enter', w: 2.25, type: 'accent' }, { code: 'PageDown', w: 1, type: 'mod' }
      ],
      // Row 4: LShift + ZXCV + RShift + Up + End
      [
        { code: 'ShiftLeft', w: 2.25, type: 'mod' },
        { code: 'KeyZ', w: 1, type: 'alpha' }, { code: 'KeyX', w: 1, type: 'alpha' }, { code: 'KeyC', w: 1, type: 'alpha' },
        { code: 'KeyV', w: 1, type: 'alpha' }, { code: 'KeyB', w: 1, type: 'alpha' }, { code: 'KeyN', w: 1, type: 'alpha' },
        { code: 'KeyM', w: 1, type: 'alpha' }, { code: 'Comma', w: 1, type: 'alpha' }, { code: 'Period', w: 1, type: 'alpha' },
        { code: 'Slash', w: 1, type: 'alpha' }, { code: 'ShiftRight', w: 1.75, type: 'mod' },
        { code: 'ArrowUp', w: 1, type: 'mod' }, { code: 'End', w: 1, type: 'mod' }
      ],
      // Row 5: Bottom Modifiers + Spacebar + Arrows
      [
        { code: 'ControlLeft', w: 1.25, type: 'mod' }, { code: 'MetaLeft', w: 1.25, type: 'mod' }, { code: 'AltLeft', w: 1.25, type: 'mod' },
        { code: 'Space', w: 6.25, type: 'alpha' },
        { code: 'AltRight', w: 1, type: 'mod' }, { code: 'MetaRight', w: 1, type: 'mod' }, { code: 'ControlRight', w: 1, type: 'mod' },
        { code: 'ArrowLeft', w: 1, type: 'mod' }, { code: 'ArrowDown', w: 1, type: 'mod' }, { code: 'ArrowRight', w: 1, type: 'mod' }
      ]
    ];

    const uSize = 1.15; // 1 Unit in 3D world units
    const startZ = -2.9;

    layout.forEach((row, rIdx) => {
      let startX = -8.7;
      const zPos = startZ + (rIdx * 1.18);

      row.forEach(k => {
        const keyWidth = (k.w * uSize) - 0.08;
        const keyDepth = uSize - 0.08;
        const keyHeight = 0.55;

        // Create tapered keycap geometry (cherry profile slope)
        const geo = new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth);
        const mat = k.type === 'accent'
          ? this.materials.accent
          : (k.type === 'mod' ? this.materials.mod : this.materials.alpha);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(startX + keyWidth / 2, 0.42, zPos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
          code: k.code,
          originalY: 0.42,
          originalMat: mat,
          type: k.type
        };

        this.keyMeshes[k.code] = mesh;
        this.keyboardGroup.add(mesh);

        startX += (k.w * uSize);
      });
    });

    // Slight 6-degree ergonomic typing incline
    this.keyboardGroup.rotation.x = THREE.MathUtils.degToRad(5);
    this.scene.add(this.keyboardGroup);
  }

  buildDeskShadow() {
    const shadowGeo = new THREE.PlaneGeometry(36, 24);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.15;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  // Animate 3D Keycap Press with Anime.js
  pressKey3D(code) {
    const mesh = this.keyMeshes[code];
    if (!mesh) return;

    // Change material to active glowing orange
    mesh.material = this.materials.pressed;

    if (typeof anime !== 'undefined') {
      // Elastic 3D key depression
      anime.remove(mesh.position);
      anime({
        targets: mesh.position,
        y: mesh.userData.originalY - 0.22,
        duration: 45,
        easing: 'easeOutQuad'
      });
    } else {
      mesh.position.y = mesh.userData.originalY - 0.22;
    }

    // Ripple shockwave if Space or Enter is pressed
    if (code === 'Space' || code === 'Enter') {
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
        easing: 'easeOutElastic(1, .5)',
        complete: () => {
          mesh.material = mesh.userData.originalMat;
        }
      });
    } else {
      mesh.position.y = mesh.userData.originalY;
      mesh.material = mesh.userData.originalMat;
    }
  }

  // Wave ripple across nearby 3D keycaps
  triggerRippleEffect(centerPos) {
    if (typeof anime === 'undefined') return;

    Object.values(this.keyMeshes).forEach(mesh => {
      const dist = mesh.position.distanceTo(centerPos);
      if (dist > 0.5 && dist < 5.0) {
        anime({
          targets: mesh.position,
          y: [mesh.userData.originalY, mesh.userData.originalY - (0.08 / (dist * 0.8)), mesh.userData.originalY],
          delay: dist * 25,
          duration: 280,
          easing: 'easeInOutSine'
        });
      }
    });
  }

  // Camera Orbit Reset Preset
  resetCameraAngle() {
    if (typeof anime !== 'undefined' && this.camera && this.controls) {
      anime({
        targets: this.camera.position,
        x: 0,
        y: 14,
        z: 18,
        duration: 800,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
        update: () => {
          this.controls.update();
        }
      });
    }
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
