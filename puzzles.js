/* ==========================================================================
   PUZZLES — Physics Simulation Engines for each module
   ========================================================================== */

class PhysicsSimulations {
    constructor(game) {
        this.game = game;
        this.animFrameId = null;

        // Module 1: Gravity
        this.gravMass = 1.0;
        this.gravRadius = 1.0;
        this.gravTargetForce = 2.0;
        this.satelliteAngle = 0;

        // Module 2: F=ma
        this.thrustForce = 0;
        this.shipMass = 2000;
        this.targetAccel = 5.0;
        this.rocketX = 60;
        this.rocketAnimating = false;

        // Module 3: Waves
        this.waveFreq = 50;
        this.waveTarget = 150;   // MHz
        this.waveT = 0;

        // Module 4: Kepler
        this.keplerAngle = 0;
        this.keplerPlaying = false;
        this.keplerSelection = null;

        // Module 5: Special Relativity
        this.relativitySpeed = 0.0;
        this.earthTime = 0;
        this.shipTime = 0;
        this.shipFlightX = 250;
    }

    /* ------------------------------------------------------------------
       MODULE 1: Newton Gravity  F = G * m1*m2 / r^2
       We normalize so F_base = 1.0 when mass=1, r=1
       ------------------------------------------------------------------ */
    startGravityLoop() {
        this.stopLoop();
        const planet = document.getElementById('sim1-planet');
        const orbitLine = document.getElementById('sim1-orbit-line');
        const satellite = document.getElementById('sim1-satellite');
        const vecLine = document.getElementById('sim1-vector-line');
        const vecArrow = document.getElementById('sim1-vector-arrow');
        const forceText = document.getElementById('sim1-force-readout');

        const draw = () => {
            // Animate satellite on circular orbit
            this.satelliteAngle += 0.012;
            const cx = 250, cy = 200;
            const baseR = 100;
            const orbR = baseR * this.gravRadius;

            // Update orbit circle size
            orbitLine.setAttribute('r', orbR);

            // Planet size indicates mass
            planet.setAttribute('r', 30 + this.gravMass * 12);

            // Satellite position
            const sx = cx + Math.cos(this.satelliteAngle) * orbR;
            const sy = cy + Math.sin(this.satelliteAngle) * orbR;
            satellite.setAttribute('cx', sx);
            satellite.setAttribute('cy', sy);

            // Compute force (normalized)
            const force = this.gravMass / (this.gravRadius * this.gravRadius);

            // Force vector — from satellite pointing toward planet
            const dx = cx - sx;
            const dy = cy - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ndx = dx / dist;
            const ndy = dy / dist;

            // Length of arrow proportional to force (clamped)
            const vecLen = Math.min(force * 50, orbR - 20);
            const ex = sx + ndx * vecLen;
            const ey = sy + ndy * vecLen;

            vecLine.setAttribute('x1', sx);
            vecLine.setAttribute('y1', sy);
            vecLine.setAttribute('x2', ex);
            vecLine.setAttribute('y2', ey);

            // Arrow tip
            const tipSize = 6;
            const perpX = -ndy * tipSize;
            const perpY = ndx * tipSize;
            vecArrow.setAttribute('points',
                `${ex},${ey} ${ex - ndx * 10 + perpX},${ey - ndy * 10 + perpY} ${ex - ndx * 10 - perpX},${ey - ndy * 10 - perpY}`);

            forceText.textContent = `Fuerza = ${force.toFixed(2)}x`;

            // Color feedback
            const diff = Math.abs(force - this.gravTargetForce);
            if (diff < 0.1) {
                forceText.setAttribute('fill', '#39ff14');
            } else if (diff < 0.4) {
                forceText.setAttribute('fill', '#ffcc00');
            } else {
                forceText.setAttribute('fill', '#00ffff');
            }

            this.animFrameId = requestAnimationFrame(draw);
        };
        draw();
    }

    getGravityForce() {
        return this.gravMass / (this.gravRadius * this.gravRadius);
    }

    checkGravitySolved() {
        return Math.abs(this.getGravityForce() - this.gravTargetForce) < 0.12;
    }

    /* ------------------------------------------------------------------
       MODULE 2: F = m * a
       ------------------------------------------------------------------ */
    startNewtonLoop() {
        this.stopLoop();
        this.rocketX = 60;
        this.rocketAnimating = false;
        this.updateRocketVisuals();
    }

    updateRocketVisuals() {
        const rocket = document.getElementById('sim2-rocket');
        if (rocket) rocket.setAttribute('transform', `translate(${this.rocketX}, 200)`);

        const thrustText = document.getElementById('sim2-thrust-readout');
        const accelText = document.getElementById('sim2-accel-readout');
        if (thrustText) thrustText.textContent = `${Math.round(this.thrustForce)} N`;
        const accel = this.thrustForce / this.shipMass;
        if (accelText) accelText.textContent = `${accel.toFixed(2)} m/s²`;

        // Flame visibility
        const flame = document.getElementById('sim2-fire-flame');
        if (flame) flame.setAttribute('opacity', this.rocketAnimating ? '1' : '0');
    }

    simulateLaunch() {
        if (this.rocketAnimating) return;
        this.rocketAnimating = true;
        this.rocketX = 60;

        const accel = this.thrustForce / this.shipMass;
        let velocity = 0;
        let x = 60;

        this.stopLoop();
        const step = () => {
            velocity += accel * 0.3;
            x += velocity * 0.6;
            this.rocketX = x;
            this.updateRocketVisuals();

            if (x > 480) {
                // Flew past — stop
                this.rocketAnimating = false;
                this.updateRocketVisuals();
                return;
            }

            this.animFrameId = requestAnimationFrame(step);
        };
        step();
    }

    getNewtonAccel() {
        return this.thrustForce / this.shipMass;
    }

    checkNewtonSolved() {
        return Math.abs(this.getNewtonAccel() - this.targetAccel) < 0.3;
    }

    /* ------------------------------------------------------------------
       MODULE 3: EM Waves  c = λν   →  ν = c/λ
       Speed of light c = 3e8 m/s, target λ = 2m  →  ν = 150 MHz
       ------------------------------------------------------------------ */
    startWavesLoop() {
        this.stopLoop();
        const canvas = document.getElementById('sim3-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            // Resize canvas context size to avoid blur and stretching
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // Draw grid
            ctx.strokeStyle = '#0a1520';
            ctx.lineWidth = 0.5;
            for (let gx = 0; gx < W; gx += 40) {
                ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
            }
            for (let gy = 0; gy < H; gy += 40) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
            }

            // Center line
            ctx.strokeStyle = '#152030';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

            // Target wave (faint green)
            ctx.strokeStyle = 'rgba(57, 255, 20, 0.35)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const targetK = this.waveTarget * 0.04;
            for (let x = 0; x < W; x++) {
                const y = H / 2 + Math.sin(x * 0.01 * targetK) * 60;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Player wave (cyan, animated)
            this.waveT += 0.12;
            const playerK = this.waveFreq * 0.04;
            const diff = Math.abs(this.waveFreq - this.waveTarget);
            const matched = diff < 8;
            ctx.strokeStyle = matched ? '#39ff14' : '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < W; x++) {
                const y = H / 2 + Math.sin(x * 0.01 * playerK - this.waveT) * 60;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Labels overlay
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px Orbitron';
            ctx.fillText('OSCILOSCOPIO DE TELECOMUNICACIONES', 15, 25);

            ctx.font = '14px Orbitron';
            ctx.fillStyle = matched ? '#39ff14' : '#00ffff';
            ctx.fillText(`Tu Frecuencia: ${this.waveFreq.toFixed(0)} MHz`, 15, 50);

            ctx.fillStyle = 'rgba(57,255,20,0.5)';
            ctx.font = '10px Outfit';
            ctx.fillText(`Frecuencia Target: ${this.waveTarget} MHz  (λ = 2m, c = 3×10⁸ m/s)`, 15, 70);

            if (matched) {
                ctx.fillStyle = '#39ff14';
                ctx.font = '16px Orbitron';
                ctx.fillText('✓ ONDAS SINCRONIZADAS', 15, H - 20);
            }

            this.animFrameId = requestAnimationFrame(draw);
        };
        draw();
    }

    checkWavesSolved() {
        return Math.abs(this.waveFreq - this.waveTarget) < 8;
    }

    /* ------------------------------------------------------------------
       MODULE 4: Kepler's 2nd Law  — elliptical orbit animation
       ------------------------------------------------------------------ */
    startKeplerLoop() {
        this.stopLoop();
        this.keplerAngle = 0;
        this.keplerPlaying = false;
        this.keplerSelection = null;
    }

    playKeplerOrbit() {
        if (this.keplerPlaying) return;
        this.keplerPlaying = true;
        this.keplerAngle = 0;

        const ship = document.getElementById('sim4-spaceship');
        const speedText = document.getElementById('sim4-speed-readout');
        const velVec = document.getElementById('sim4-velocity-vector');

        // Ellipse params matching SVG: cx=250, cy=200, rx=180, ry=100
        const cx = 250, cy = 200, a = 180, b = 100;
        // Sun at focus: focusX = cx - c where c = sqrt(a²-b²) ≈ 134.16
        // That puts Sun at ~115.8, matching our SVG sun at x=200 roughly.
        // We'll keep the animation consistent with the SVG ellipse.

        const step = () => {
            // Kepler-like speed: faster near perihelio (left side, smallest x)
            // We approximate using area-velocity: dθ/dt ∝ 1/r²
            const x = cx + a * Math.cos(this.keplerAngle);
            const y = cy + b * Math.sin(this.keplerAngle);

            // Distance from sun at (200, 200)
            const sunX = 200, sunY = 200;
            const dx = x - sunX, dy = y - sunY;
            const r = Math.sqrt(dx * dx + dy * dy);

            // Speed inversely proportional to distance (Kepler's 2nd law approximation)
            const baseSpeed = 0.008;
            const angularSpeed = baseSpeed * (200 / r);
            this.keplerAngle += angularSpeed;
            if (this.keplerAngle > Math.PI * 2) this.keplerAngle -= Math.PI * 2;

            // Position ship
            ship.setAttribute('transform', `translate(${x}, ${y})`);

            // Velocity magnitude display (arbitrary scale)
            const speed = (angularSpeed * 2800).toFixed(1);
            speedText.textContent = `${speed} km/s`;

            // Velocity vector length
            const vecLen = angularSpeed * 1800;
            // Tangent direction (perpendicular to radius from ellipse center)
            const tx = -a * Math.sin(this.keplerAngle);
            const ty = b * Math.cos(this.keplerAngle);
            const tlen = Math.sqrt(tx * tx + ty * ty);
            const nvx = (tx / tlen) * vecLen;
            const nvy = (ty / tlen) * vecLen;
            velVec.setAttribute('x2', -nvx);
            velVec.setAttribute('y2', -nvy);

            // Color speed gauge
            if (r < 120) {
                speedText.setAttribute('fill', '#39ff14');
            } else if (r < 200) {
                speedText.setAttribute('fill', '#bd93f9');
            } else {
                speedText.setAttribute('fill', '#ff3b30');
            }

            this.animFrameId = requestAnimationFrame(step);
        };
        step();
    }

        checkKeplerSolved() {
        return this.keplerSelection === 'perihelio';
    }

    /* ------------------------------------------------------------------
       MODULE 5: Special Relativity (Time Dilation)
       ------------------------------------------------------------------ */
    startRelativityLoop() {
        this.stopLoop();
        this.earthTime = 0;
        this.shipTime = 0;
        this.shipFlightX = 250;

        const earthHand = document.getElementById('sim5-earth-hand');
        const shipHand = document.getElementById('sim5-ship-hand');
        const shipGroup = document.getElementById('sim5-ship-group');
        const speedText = document.getElementById('sim5-speed-readout');
        const lorentzText = document.getElementById('sim5-lorentz-readout');
        const timeText = document.getElementById('sim5-time-readout');

        const draw = () => {
            const speedFraction = this.relativitySpeed / 100; // v/c in decimal [0, 0.99]
            
            // Calculate Lorentz factor γ = 1 / sqrt(1 - v^2)
            const gamma = 1 / Math.sqrt(1 - speedFraction * speedFraction);

            // Clock hands rotate
            // Earth clock ticks at a constant reference rate
            this.earthTime += 0.045;
            // Ship clock ticks slower by factor of Lorentz
            this.shipTime += 0.045 / gamma;

            // Space flight progress
            this.shipFlightX = (this.shipFlightX + 1.0 * (1 + speedFraction * 2.5)) % 520;

            // Update clock hands SVG (0,0 center translation inside group)
            if (earthHand) {
                earthHand.setAttribute('x2', 32 * Math.sin(this.earthTime));
                earthHand.setAttribute('y2', -32 * Math.cos(this.earthTime));
            }
            if (shipHand) {
                shipHand.setAttribute('x2', 32 * Math.sin(this.shipTime));
                shipHand.setAttribute('y2', -32 * Math.cos(this.shipTime));
            }

            // Apply time dilation length contraction to the ship
            if (shipGroup) {
                const drawX = this.shipFlightX - 35; // centered offset
                // Scale factor for length contraction along direction of motion is 1/gamma
                shipGroup.setAttribute('transform', `translate(${drawX}, 285) scale(${1 / gamma}, 1)`);
            }

            // Update gauges
            if (speedText) speedText.textContent = `${this.relativitySpeed.toFixed(1)}% c`;
            if (lorentzText) lorentzText.textContent = `${gamma.toFixed(2)}x`;
            if (timeText) {
                if (this.relativitySpeed === 0) {
                    timeText.textContent = "Dilatación temporal inactiva (1s nave = 1.00s Tierra)";
                    timeText.setAttribute('fill', 'rgba(255,255,255,0.4)');
                } else {
                    timeText.textContent = `Dilatación activa: 1.0s en nave = ${gamma.toFixed(2)}s en Tierra`;
                    timeText.setAttribute('fill', '#39ff14');
                }
            }

            this.animFrameId = requestAnimationFrame(draw);
        };
        draw();
    }

    checkRelativitySolved() {
        const speedFraction = this.relativitySpeed / 100;
        const gamma = 1 / Math.sqrt(1 - speedFraction * speedFraction);
        // We want gamma to be exactly 2.0x.
        // For gamma = 2.0, speedFraction = sqrt(1 - 1/4) = sqrt(0.75) ≈ 0.866 (86.6% c)
        // Let's accept a safe tolerance range [1.96, 2.04]
        return Math.abs(gamma - 2.0) < 0.04;
    }

    /* ------------------------------------------------------------------
       SHARED
       ------------------------------------------------------------------ */
    stopLoop() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }
}

window.PhysicsSimulations = PhysicsSimulations;
