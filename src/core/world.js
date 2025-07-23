class World {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.helpers3D = new THREE.Group();
        this.helpers2D = new THREE.Group();
         this.labelRenderer = null; // Properti baru
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111118);
        this.scene.fog = new THREE.Fog(0x111118, 50, 150);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(10, 20, 15);
        this.scene.add(dirLight);

        this.createWorldHelpers();
        this.scene.add(this.helpers3D, this.helpers2D);

        // PENTING: BUAT KAMERA & KONTROL DEFAULT DI SINI SAAT INISIALISASI
        // Ini memastikan world.camera tidak akan pernah null setelah init()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 20, 20);
        this.updateControls();
         // PENAMBAHAN: Inisialisasi CSS2DRenderer
        this.labelRenderer = new THREE.CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none'; // Agar tidak menghalangi klik mouse
        document.body.appendChild(this.labelRenderer.domElement);


        window.addEventListener('resize', () => this.onWindowResize());
    }

    createWorldHelpers() {
        // ... (seluruh isi fungsi ini tidak berubah dari versi stabil terakhir) ...
        const worldSize = 100;
        const gridColor = 0x444444;
        const centerLineColor = 0x777777;
        const colors = { x: 0xff4136, y: 0x2ecc40, z: 0x0074d9 };
        const gridXZ = new THREE.GridHelper(worldSize, worldSize, centerLineColor, gridColor);
        this.helpers3D.add(gridXZ);
        const gridXY = new THREE.GridHelper(worldSize, worldSize, centerLineColor, gridColor);
        gridXY.rotation.x = Math.PI / 2;
        this.helpers3D.add(gridXY);
        const radius = 0.05, arrowRadius = 0.3, arrowHeight = 0.8;
        Object.keys(colors).forEach(axis => {
            const mat = new THREE.MeshBasicMaterial({ color: colors[axis] });
            const lineGeom = new THREE.CylinderGeometry(radius, radius, worldSize, 8);
            const lineMesh = new THREE.Mesh(lineGeom, mat);
            const arrowGeom = new THREE.ConeGeometry(arrowRadius, arrowHeight, 8);
            const arrowMesh = new THREE.Mesh(arrowGeom, mat);
            const group = new THREE.Group();
            group.add(lineMesh, arrowMesh);
            if (axis === 'x') { group.rotation.z = -Math.PI / 2; arrowMesh.position.y = worldSize / 2; }
            else if (axis === 'z') { group.rotation.x = Math.PI / 2; arrowMesh.position.y = worldSize / 2; }
            else { arrowMesh.position.y = worldSize / 2; }
            this.helpers3D.add(group);
        });
        const loader = new THREE.FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const labelGroup = new THREE.Group();
            const labelMaterial = new THREE.MeshBasicMaterial({ color: 0x9CA3AF });
            const labelSize = 0.5;
            for (let i = 10; i <= worldSize / 2; i += 10) {
                this.addLabel(i.toString(), font, {x:i, y:0, z:0}, labelSize, labelMaterial, labelGroup);
                this.addLabel(i.toString(), font, {x:0, y:i, z:0}, labelSize, labelMaterial, labelGroup);
                this.addLabel(i.toString(), font, {x:0, y:0, z:i}, labelSize, labelMaterial, labelGroup);
                this.addLabel((-i).toString(), font, {x:-i, y:0, z:0}, labelSize, labelMaterial, labelGroup);
                this.addLabel((-i).toString(), font, {x:0, y:-i, z:0}, labelSize, labelMaterial, labelGroup);
                this.addLabel((-i).toString(), font, {x:0, y:0, z:-i}, labelSize, labelMaterial, labelGroup);
            }
            this.helpers3D.add(labelGroup);
        });
        const grid2D = new THREE.GridHelper(worldSize, worldSize, centerLineColor, gridColor);
        grid2D.rotation.x = Math.PI / 2;
        this.helpers2D.add(grid2D);
        const axisGeomX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-worldSize/2, 0, 0), new THREE.Vector3(worldSize/2, 0, 0)]);
        const axisGeomY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -worldSize/2, 0), new THREE.Vector3(0, worldSize/2, 0)]);
        const axis2D_X = new THREE.Line(axisGeomX, new THREE.LineBasicMaterial({ color: colors.x, linewidth: 2 }));
        const axis2D_Y = new THREE.Line(axisGeomY, new THREE.LineBasicMaterial({ color: colors.y, linewidth: 2 }));
        this.helpers2D.add(axis2D_X, axis2D_Y);
    }
    
    addLabel(text, font, position, size, material, group) {
        const geometry = new THREE.TextGeometry(text, { font, size, height: 0.02 });
        geometry.center();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z + 0.5);
        mesh.rotation.x = -Math.PI / 2;
        group.add(mesh);
    }
    
    switchTo3D() {
        this.helpers2D.visible = false;
        this.helpers3D.visible = true;
        // Hanya ganti jika bukan tipe yang sama untuk efisiensi
        if (!this.camera.isPerspectiveCamera) {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
            this.camera.position.set(20, 20, 20);
            this.updateControls();
        }
    }

    switchTo2D() {
        this.helpers3D.visible = false;
        this.helpers2D.visible = true;
        // Hanya ganti jika bukan tipe yang sama
        if (!this.camera.isOrthographicCamera) {
            const aspect = window.innerWidth / window.innerHeight;
            const viewHeight = 50;
            this.camera = new THREE.OrthographicCamera(-viewHeight * aspect / 2, viewHeight * aspect / 2, viewHeight / 2, -viewHeight / 2, 0.1, 1000);
            this.camera.position.set(0, 0, 10);
            this.updateControls(false);
        }
    }
    updateControls(enableRotate = true) {
        if (this.controls) this.controls.dispose();
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableRotate = enableRotate;
        this.controls.target.set(0, 0, 0);
    }
    update() {
 if (this.controls) this.controls.update();
        if(this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            // PENAMBAHAN: Render label di setiap frame
            this.labelRenderer.render(this.scene, this.camera);
        }
    }
    onWindowResize() {
        if (!this.camera) return;
        const aspect = window.innerWidth / window.innerHeight;
        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = aspect;
        } else {
            const viewHeight = 50;
            this.camera.left = -viewHeight * aspect / 2;
            this.camera.right = viewHeight * aspect / 2;
            this.camera.top = viewHeight / 2;
            this.camera.bottom = -viewHeight / 2;
        }
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // PENAMBAHAN: Resize label renderer juga
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }
}
export const world = new World();