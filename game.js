/* ==========================================================================
   GAME ENGINE — CORE CONTROLLER & STATE MANAGER FOR PHYSICS QUIZ
   ========================================================================== */

class MisionEspacialGame {
    constructor() {
        this.audio = window.audioManager;
        this.puzzles = new PhysicsSimulations(this);
        
        this.currentModule = 1;
        this.maxModules = 5;
        this.transitioning = false;
        
        // Modules texts and definitions using clean HTML instead of LaTeX
        this.modules = {
            1: {
                title: "Desafío 1: Gravedad y Órbitas",
                theory: "La Fuerza Gravitacional (<i>F</i>) entre dos masas es proporcional al producto de sus masas y disminuye cuadráticamente con la distancia (<i>r</i>) que las separa según Newton:<br><br><span class=\"highlight\"><i>F = G · (m<sub>1</sub>·m<sub>2</sub>) / r<sup>2</sup></i></span><br><br>En esta simulación, las constantes están normalizadas para simplificar.",
                question: "El satélite de comunicaciones Astraea-1 se está desviando. Ajusta los controles de Masa y Radio de órbita en la simulación hasta que alcances exactamente una <strong>Fuerza Gravitacional de 2.00x</strong> para anclarlo en una órbita estable.",
                simId: "sim-gravity"
            },
            2: {
                title: "Desafío 2: Segunda Ley de Newton",
                theory: "La Segunda Ley de Newton establece que la aceleración (<i>a</i>) de un objeto es directamente proporcional a la fuerza neta (<i>F</i>) aplicada e inversamente proporcional a su masa (<i>m</i>):<br><br><span class=\"highlight\"><i>F = m · a</i> &nbsp;➔&nbsp; <i>a = F / m</i></span>",
                question: "Nuestra nave Astraea (2000 kg) se encuentra en rumbo de colisión con un asteroide. Los propulsores laterales deben aplicar la fuerza exacta para lograr una aceleración de desvío de exactamente <strong>5.00 m/s²</strong>. Ajusta el empuje y presiona 'SIMULAR IMPULSO' para comprobar la trayectoria.",
                simId: "sim-newton"
            },
            3: {
                title: "Desafío 3: Física de Ondas",
                theory: "La relación fundamental de las ondas electromagnéticas nos dice que la velocidad de propagación (<i>c</i>, la velocidad de la luz en el vacío) es igual al producto de su longitud de onda (<i>λ</i>) y su frecuencia (<i>ν</i>):<br><br><span class=\"highlight\"><i>c = λ · ν</i> &nbsp;➔&nbsp; <i>ν = c / λ</i></span>",
                question: "Para sintonizar la radio estelar, necesitamos sintonizar una señal con longitud de onda <i>λ</i> = 2.0 m. Sabiendo que <i>c</i> ≈ 300,000 km/s (300,000,000 m/s), ajusta la frecuencia en Megahertz (1 MHz = 1,000,000 Hz).",
                simId: "sim-waves"
            },
            4: {
                title: "Desafío 4: Segunda Ley de Kepler",
                theory: "La Segunda Ley de Kepler (Ley de las Áreas) establece que el radio vector que une un planeta y el Sol barre áreas iguales en tiempos iguales. Esto significa que la velocidad lineal de un objeto en órbita elíptica no es constante: es <strong>máxima</strong> en el <strong>perihelio</strong> (punto más cercano al Sol) y <strong>mínima</strong> en el <strong>afelio</strong> (punto más lejano).",
                question: "Observa la nave científica en su órbita elíptica alrededor del Sol. Haz clic en 'REPRODUCIR ÓRBITA' para ver cómo varía el vector de velocidad (flecha morada) y la rapidez de vuelo. Selecciona el punto de la trayectoria donde la velocidad de la nave es <strong>máxima</strong>.",
                simId: "sim-kepler"
            },
            5: {
                title: "Desafío 5: Dilatación del Tiempo (Relatividad Especial)",
                theory: "La Teoría de la Relatividad Especial de Einstein demuestra que el tiempo transcurre más lento en un cuerpo en movimiento (dilatación temporal) desde la perspectiva de un observador en reposo. Esto se gobierna por el Factor de Lorentz (<i>γ</i>):<br><br><span class=\"highlight\"><i>t' = t · γ</i> &nbsp;&nbsp;donde&nbsp;&nbsp; <i>γ = 1 / √(1 - v<sup>2</sup>/c<sup>2</sup>)</i></span>",
                question: "Para realizar el salto interestelar seguro, los motores warp de la Astraea deben lograr una dilatación del tiempo exacta de <strong>2.00x</strong> (donde 1.0s en la nave equivale a 2.0s en la Tierra). Calibra la velocidad de crucero (<i>v</i>) en porcentaje de la velocidad de la luz (<i>c</i>).",
                simId: "sim-relativity"
            }
        };
    }

    /**
     * Entry Point: Hooks up buttons and prepares the initial states.
     */
    init() {
        this.setupEventListeners();
        this.updateStepper();
        console.log("Misión Espacial Game Controller Initialized.");
    }

    /**
     * Set up all DOM event listeners for buttons, sliders, and interactive nodes.
     */
    setupEventListeners() {
        // Main Menu Start Button
        const btnStart = document.getElementById('btn-start');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                this.startGame();
            });
        }

        // HUD Restart Button
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                this.audio.playClick();
                this.resetGame();
            });
        }

        // Victory Restart Button
        const btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestartWin) {
            btnRestartWin.addEventListener('click', () => {
                this.audio.playClick();
                this.resetGame();
            });
        }

        // Sound Toggle Button
        const btnAudio = document.getElementById('btn-audio-toggle');
        if (btnAudio) {
            btnAudio.addEventListener('click', (e) => {
                const isMuted = this.audio.toggleMute();
                e.target.innerText = isMuted ? "🔇 MUDO" : "🔊 SONIDO";
                e.target.style.boxShadow = isMuted ? "none" : "0 0 8px rgba(0, 210, 255, 0.4)";
                this.audio.playClick();
            });
        }

        // Submit Theory Button
        const btnSubmit = document.getElementById('btn-submit-answer');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', () => {
                this.submitAnswer();
            });
        }

        // Slider Parameter Changes
        const param1 = document.getElementById('param-1');
        const param2 = document.getElementById('param-2');

        if (param1) {
            param1.addEventListener('input', (e) => {
                this.handleSliderInput('param-1', e.target.value);
            });
        }

        if (param2) {
            param2.addEventListener('input', (e) => {
                this.handleSliderInput('param-2', e.target.value);
            });
        }

        // Kepler point-selector buttons
        document.querySelectorAll('.point-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const point = e.currentTarget.getAttribute('data-point');
                this.selectKeplerPoint(point);
            });
        });

        // Kepler SVG graphic nodes
        const nodePerihelio = document.getElementById('node-perihelio');
        const nodeAfelio = document.getElementById('node-afelio');
        const nodeMedio = document.getElementById('node-medio');

        if (nodePerihelio) {
            nodePerihelio.addEventListener('click', () => this.selectKeplerPoint('perihelio'));
        }
        if (nodeAfelio) {
            nodeAfelio.addEventListener('click', () => this.selectKeplerPoint('afelio'));
        }
        if (nodeMedio) {
            nodeMedio.addEventListener('click', () => this.selectKeplerPoint('medio'));
        }

        // Special simulation buttons
        const btnSim2Launch = document.getElementById('btn-sim2-launch');
        if (btnSim2Launch) {
            btnSim2Launch.addEventListener('click', () => {
                this.audio.playClick();
                this.puzzles.simulateLaunch();
            });
        }

        const btnSim4Play = document.getElementById('btn-sim4-play');
        if (btnSim4Play) {
            btnSim4Play.addEventListener('click', () => {
                this.audio.playClick();
                this.puzzles.playKeplerOrbit();
            });
        }
    }

    /**
     * Start the game from the main menu.
     */
    startGame() {
        this.audio.init();
        this.audio.playClick();
        
        // Reset state
        this.currentModule = 1;
        this.transitioning = false;
        
        // Go to first module
        this.loadModule(1);
        
        // Toggle screen
        this.switchScreen('game-screen');
    }

    /**
     * Reset the game completely, taking the player back to the main menu.
     */
    resetGame() {
        this.puzzles.stopLoop();
        this.currentModule = 1;
        this.updateStepper();
        this.switchScreen('main-menu');
    }

    /**
     * Set up the interface and starts loops for a specific physics module.
     */
    loadModule(moduleIdx) {
        this.currentModule = moduleIdx;
        this.updateStepper();
        
        const data = this.modules[moduleIdx];
        if (!data) return;

        // Set Texts
        document.getElementById('module-title').textContent = data.title;
        document.getElementById('theory-text').innerHTML = data.theory;
        document.getElementById('question-text').innerHTML = data.question;
        document.getElementById('module-step-text').textContent = `${moduleIdx} / ${this.maxModules}`;

        // Reset Feedback Box
        const feedback = document.getElementById('simulation-feedback');
        feedback.textContent = "CONSOLA EN ESPERA DE DATOS...";
        feedback.className = "feedback-text";

        // Show corresponding SVG/Canvas wrapper, hide others
        document.querySelectorAll('.sim-wrapper').forEach(wrap => {
            wrap.classList.add('hidden');
        });
        const activeWrap = document.getElementById(data.simId);
        if (activeWrap) activeWrap.classList.remove('hidden');

        // Stop any running animations
        this.puzzles.stopLoop();

        // Configure input elements
        const slidersContainer = document.getElementById('sliders-container');
        const keplerSelector = document.getElementById('kepler-points-selector');
        const groupParam1 = document.getElementById('group-param-1');
        const groupParam2 = document.getElementById('group-param-2');
        const param1 = document.getElementById('param-1');
        const param2 = document.getElementById('param-2');

        if (moduleIdx === 1) {
            // Module 1: Gravity
            slidersContainer.classList.remove('hidden');
            keplerSelector.classList.add('hidden');
            groupParam1.classList.remove('hidden');
            groupParam2.classList.remove('hidden');

            param1.min = "0.5";
            param1.max = "3.0";
            param1.step = "0.1";
            param1.value = "1.0";

            param2.min = "0.5";
            param2.max = "2.0";
            param2.step = "0.1";
            param2.value = "1.0";

            this.puzzles.gravMass = 1.0;
            this.puzzles.gravRadius = 1.0;

            document.getElementById('label-param-1').textContent = "Masa del Planeta (M): 1.0x";
            document.getElementById('label-param-2').textContent = "Radio de Órbita (r): 1.0x";

            this.puzzles.startGravityLoop();
        } 
        else if (moduleIdx === 2) {
            // Module 2: F = ma
            slidersContainer.classList.remove('hidden');
            keplerSelector.classList.add('hidden');
            groupParam1.classList.remove('hidden');
            groupParam2.classList.add('hidden');

            param1.min = "0";
            param1.max = "20000";
            param1.step = "100";
            param1.value = "0";

            this.puzzles.thrustForce = 0;
            this.puzzles.rocketX = 60;
            this.puzzles.rocketAnimating = false;

            document.getElementById('label-param-1').textContent = "Fuerza de Empuje (F): 0 N";

            this.puzzles.startNewtonLoop();
        } 
        else if (moduleIdx === 3) {
            // Module 3: Waves
            slidersContainer.classList.remove('hidden');
            keplerSelector.classList.add('hidden');
            groupParam1.classList.remove('hidden');
            groupParam2.classList.add('hidden');

            param1.min = "10";
            param1.max = "300";
            param1.step = "1";
            param1.value = "50";

            this.puzzles.waveFreq = 50;

            document.getElementById('label-param-1').textContent = "Frecuencia de Señal (ν): 50 MHz";

            this.puzzles.startWavesLoop();
        } 
        else if (moduleIdx === 4) {
            // Module 4: Kepler
            slidersContainer.classList.add('hidden');
            keplerSelector.classList.remove('hidden');

            this.puzzles.keplerSelection = null;

            // Reset selection highlights
            document.querySelectorAll('.point-btn').forEach(btn => btn.classList.remove('selected'));
            document.querySelectorAll('.kepler-interactive-node').forEach(node => node.classList.remove('clicked'));

            this.puzzles.startKeplerLoop();
        }
        else if (moduleIdx === 5) {
            // Module 5: Special Relativity
            slidersContainer.classList.remove('hidden');
            keplerSelector.classList.add('hidden');
            groupParam1.classList.remove('hidden');
            groupParam2.classList.add('hidden');

            param1.min = "0.0";
            param1.max = "99.0";
            param1.step = "0.1";
            param1.value = "0.0";

            this.puzzles.relativitySpeed = 0.0;

            document.getElementById('label-param-1').textContent = "Velocidad de Crucero (v): 0.0% c";

            this.puzzles.startRelativityLoop();
        }
    }

    /**
     * Handle input/change events on range sliders.
     */
    handleSliderInput(id, value) {
        if (this.transitioning) return;
        const val = parseFloat(value);
        
        const feedback = document.getElementById('simulation-feedback');
        feedback.textContent = "CALIBRANDO SISTEMAS...";
        feedback.className = "feedback-text";

        if (this.currentModule === 1) {
            if (id === 'param-1') {
                this.puzzles.gravMass = val;
                document.getElementById('label-param-1').textContent = `Masa del Planeta (M): ${val.toFixed(1)}x`;
            } else if (id === 'param-2') {
                this.puzzles.gravRadius = val;
                document.getElementById('label-param-2').textContent = `Radio de Órbita (r): ${val.toFixed(1)}x`;
            }
        } 
        else if (this.currentModule === 2) {
            if (id === 'param-1') {
                this.puzzles.thrustForce = val;
                document.getElementById('label-param-1').textContent = `Fuerza de Empuje (F): ${Math.round(val)} N`;
                this.puzzles.updateRocketVisuals();
            }
        } 
        else if (this.currentModule === 3) {
            if (id === 'param-1') {
                this.puzzles.waveFreq = val;
                document.getElementById('label-param-1').textContent = `Frecuencia de Señal (ν): ${Math.round(val)} MHz`;
            }
        }
        else if (this.currentModule === 5) {
            if (id === 'param-1') {
                this.puzzles.relativitySpeed = val;
                document.getElementById('label-param-1').textContent = `Velocidad de Crucero (v): ${val.toFixed(1)}% c`;
            }
        }
    }

    /**
     * Handle select action for Kepler points.
     */
    selectKeplerPoint(pointName) {
        if (this.transitioning || this.currentModule !== 4) return;
        
        this.audio.playClick();
        this.puzzles.keplerSelection = pointName;

        // Highlight selected button
        document.querySelectorAll('.point-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.getAttribute('data-point') === pointName) {
                btn.classList.add('selected');
            }
        });

        // Highlight corresponding SVG node
        document.querySelectorAll('.kepler-interactive-node').forEach(node => {
            node.classList.remove('clicked');
            if (node.id === `node-${pointName}`) {
                node.classList.add('clicked');
            }
        });

        // Update feedback
        const feedback = document.getElementById('simulation-feedback');
        feedback.textContent = `PUNTO SELECCIONADO: ${pointName.toUpperCase()}. COMPILAR SISTEMA.`;
        feedback.className = "feedback-text text-success-neon";
    }

    /**
     * Submit answer for the active module and evaluate it.
     */
    submitAnswer() {
        if (this.transitioning) return;
        this.audio.playClick();

        const feedback = document.getElementById('simulation-feedback');
        let solved = false;
        let msg = "";

        if (this.currentModule === 1) {
            solved = this.puzzles.checkGravitySolved();
            const currentForce = this.puzzles.getGravityForce();
            if (solved) {
                msg = "¡SISTEMA CALIBRADO! Gravedad balanceada a 2.0x. Cargando Módulo 2...";
            } else {
                msg = `¡ERROR! Fuerza gravitatoria calculada: ${currentForce.toFixed(2)}x. Recuerda: mayor masa (M) aumenta la gravedad, pero mayor distancia (r) la reduce drásticamente (1/r²). Debes lograr 2.00x.`;
            }
        } 
        else if (this.currentModule === 2) {
            solved = this.puzzles.checkNewtonSolved();
            const currentAccel = this.puzzles.getNewtonAccel();
            if (solved) {
                msg = "¡EMPUJE EXITOSO! Aceleración exacta de 5.0 m/s². Trayectoria de desvío corregida. Cargando Módulo 3...";
            } else {
                msg = `¡ERROR! Aceleración actual: ${currentAccel.toFixed(2)} m/s². Recuerda la fórmula F = m·a. Si la masa es de 2000 kg y la aceleración es de 5.00 m/s², ¿qué fuerza en Newtons debes aplicar? Calibra y simula de nuevo.`;
            }
        } 
        else if (this.currentModule === 3) {
            solved = this.puzzles.checkWavesSolved();
            if (solved) {
                msg = "¡ONDA SINCRONIZADA! Transmisor calibrado a la frecuencia óptima de 150 MHz (λ = 2.0m). Cargando Módulo 4...";
            } else {
                msg = `¡ERROR! Frecuencia seleccionada: ${this.puzzles.waveFreq} MHz. Recuerda la fórmula c = λ·ν. Si la velocidad de la luz es 300,000 km/s (300,000,000 m/s) y λ = 2.0m, despeja frecuencia (ν = c / λ) en Megahertz.`;
            }
        } 
        else if (this.currentModule === 4) {
            solved = this.puzzles.checkKeplerSolved();
            if (solved) {
                msg = "¡CÁLCULO DE KEPLER EXITOSO! Perihelio seleccionado. La velocidad es máxima debido a la atracción solar. Cargando Módulo 5...";
            } else {
                if (!this.puzzles.keplerSelection) {
                    msg = "¡ERROR! Por favor, selecciona un punto de la órbita (Punto A, B o C) en el simulador o el menú lateral.";
                } else {
                    msg = `¡ERROR! Has seleccionado ${this.puzzles.keplerSelection.toUpperCase()}. Recuerda la Segunda Ley de Kepler: los objetos espaciales barren áreas iguales en tiempos iguales. Su velocidad lineal es máxima en el punto más cercano al Sol. Observa el vector en el simulador.`;
                }
            }
        }
        else if (this.currentModule === 5) {
            solved = this.puzzles.checkRelativitySolved();
            const speedFraction = this.puzzles.relativitySpeed / 100;
            const gamma = 1 / Math.sqrt(1 - speedFraction * speedFraction);
            if (solved) {
                msg = "¡CALIBRACIÓN COMPLETA! Factor de Lorentz exacto de 2.00x (Velocidad = 86.6% c). Los propulsores warp están alineados al 100%. Iniciando salto...";
            } else {
                msg = `¡ERROR! Dilatación temporal actual: ${gamma.toFixed(2)}x. Recuerda la fórmula del factor γ = 1 / √(1 - v²). Para que γ sea exactamente 2.00, debes resolver 1 - v² = 1/4 = 0.25, por lo que v = √0.75 ≈ 86.6% c. ¡Ajusta los motores warp!`;
            }
        }

        if (solved) {
            feedback.textContent = msg;
            feedback.className = "feedback-text text-success-neon";
            this.audio.playSuccess();
            
            // Advance with a slight delay for visual satisfaction
            this.transitioning = true;
            setTimeout(() => {
                this.transitioning = false;
                if (this.currentModule < this.maxModules) {
                    this.loadModule(this.currentModule + 1);
                } else {
                    this.showVictory();
                }
            }, 3000);
        } else {
            feedback.textContent = msg;
            feedback.className = "feedback-text text-danger-neon";
            this.audio.playFailure();
        }
    }

    /**
     * Update Stepper HUD showing active/completed states.
     */
    updateStepper() {
        for (let i = 1; i <= this.maxModules; i++) {
            const dot = document.getElementById(`step-${i}`);
            if (!dot) continue;
            
            dot.classList.remove('active', 'completed');
            if (i < this.currentModule) {
                dot.classList.add('completed');
            } else if (i === this.currentModule) {
                dot.classList.add('active');
            }
        }

        for (let i = 1; i < this.maxModules; i++) {
            const line = document.getElementById(`line-${i}`);
            if (!line) continue;
            
            line.classList.remove('active', 'completed');
            if (i < this.currentModule) {
                line.classList.add('completed');
            } else if (i === this.currentModule) {
                line.classList.add('active');
            }
        }
    }

    /**
     * Transition to the victory screen.
     */
    showVictory() {
        this.puzzles.stopLoop();
        this.audio.playWarp();
        this.switchScreen('win-screen');
    }

    /**
     * Helper to transition screens fluidly.
     */
    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(scr => {
            scr.classList.remove('active');
        });
        const activeScr = document.getElementById(screenId);
        if (activeScr) {
            activeScr.classList.add('active');
        }
    }
}

// Instantiate and start engine
window.addEventListener('DOMContentLoaded', () => {
    const game = new MisionEspacialGame();
    window.game = game;
    game.init();
});
