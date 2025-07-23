let world, scene;
const visuals = {
    mainCurve: null,
    tangentLine: null,
    cart: null,
    verticalLine: null,
};

const functions = {
    x_squared: { 
        func:    x => x*x, 
        deriv:   x => 2*x, 
        deriv2:  x => 2, 
        eq_deriv: "2x", 
        eq_deriv2: "2", 
        range: 5 
    },
    sin_x: { 
        func:    x => Math.sin(x) * 4, 
        deriv:   x => Math.cos(x) * 4, 
        deriv2:  x => -Math.sin(x) * 4, 
        eq_deriv: "4cos(x)", 
        eq_deriv2: "-4sin(x)", 
        range: 10 
    },
    x_cubed: { 
        func:    x => x*x*x - 3*x, 
        deriv:   x => 3*x*x - 3, 
        deriv2:  x => 6*x, 
        eq_deriv: "3x² - 3", 
        eq_deriv2: "6x", 
        range: 4 
    }
};
let currentFunction = functions.x_squared;
let simState = { time: 0, isPlaying: false, speed: 0.5 };

export const DerivativePlayground = {
    isActive: false,

    init(worldContext) {
        world = worldContext;
        scene = world.scene;

        visuals.mainCurve = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 }));
        visuals.tangentLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff }));
        visuals.verticalLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 }));
        visuals.cart = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        
        scene.add(...Object.values(visuals));
        this._setupUIListeners();
        this.deactivate();
    },

    activate() {
        this.isActive = true;
        world.switchTo2D();
        Object.values(visuals).forEach(v => v.visible = true);
        this.resetSimulation();
    },

    deactivate() {
        this.isActive = false;
        Object.values(visuals).forEach(v => v.visible = false);
        simState.isPlaying = false;
    },

    update(delta) {
        if (!this.isActive || !simState.isPlaying) return;
        simState.time += delta * simState.speed;
        const range = currentFunction.range;
        if (simState.time > range || simState.time < -range) {
            simState.time = Math.sign(simState.time) * range;
            simState.isPlaying = false;
            document.getElementById('play-pause-btn').textContent = 'Play';
        }
        this._updateCart(simState.time);
    },
    
    resetSimulation() {
        simState.isPlaying = false;
        simState.time = -currentFunction.range;
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) playPauseBtn.textContent = 'Play';
        this._updateFunction();
        this._updateCart(simState.time);
    },

    _updateFunction() {
        const range = currentFunction.range;
        const mainPoints = [];
        for (let x = -range; x <= range; x += 0.1) {
            mainPoints.push(new THREE.Vector3(x, currentFunction.func(x), 0));
        }
        visuals.mainCurve.geometry.setFromPoints(mainPoints);
        
        document.getElementById('first-derivative-eq').textContent = currentFunction.eq_deriv;
        document.getElementById('second-derivative-eq').textContent = currentFunction.eq_deriv2;
    },

    _updateCart(x) {
        const y = currentFunction.func(x);
        visuals.cart.position.set(x, y, 0);

        const derivative = currentFunction.deriv(x);
        const secondDerivative = currentFunction.deriv2(x);
        
        const tangentLength = 2;
        const p1 = new THREE.Vector3(x - tangentLength, y - tangentLength * derivative, 0);
        const p2 = new THREE.Vector3(x + tangentLength, y + tangentLength * derivative, 0);
        visuals.tangentLine.geometry.setFromPoints([p1, p2]);

        visuals.verticalLine.geometry.setFromPoints([new THREE.Vector3(x, -100, 0), new THREE.Vector3(x, 100, 0)]);
        
        document.getElementById('current-x-value').textContent = x.toFixed(1);
        document.getElementById('current-y-value').textContent = y.toFixed(1);
        document.getElementById('gradient-value').textContent = derivative.toFixed(1);
        document.getElementById('acceleration-value').textContent = secondDerivative.toFixed(1);
    },

    _setupUIListeners() {
        const functionSelect = document.getElementById('function-select');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const resetBtn = document.getElementById('reset-btn');

        if (functionSelect) {
            functionSelect.addEventListener('change', (e) => {
                currentFunction = functions[e.target.value];
                this.resetSimulation();
            });
        }
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', (e) => {
                if (simState.time >= currentFunction.range || simState.time <= -currentFunction.range) {
                    this.resetSimulation();
                }
                simState.isPlaying = !simState.isPlaying;
                e.target.textContent = simState.isPlaying ? 'Pause' : 'Play';
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSimulation();
            });
        }
    }
};