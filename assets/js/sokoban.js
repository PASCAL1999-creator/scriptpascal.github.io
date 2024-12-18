class Sokoban {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 60;
        this.level = 0;
        this.moves = 0;
        
        // Game kleuren en stijlen
        this.colors = {
            wall: {
                main: '#3B4252',
                highlight: '#4C566A',
                shadow: '#2E3440'
            },
            floor: {
                main: '#2E3440',
                pattern: '#353C4A'
            },
            box: {
                main: '#D08770',
                highlight: '#EBCB8B',
                shadow: '#BF616A'
            },
            target: {
                main: '#A3BE8C',
                glow: 'rgba(163, 190, 140, 0.3)'
            },
            player: {
                main: '#88C0D0',
                highlight: '#8FBCBB',
                shadow: '#5E81AC'
            }
        };

        // Animatie eigenschappen
        this.animations = {
            player: {
                scale: 1,
                rotation: 0
            },
            boxes: new Map(),
            targets: []
        };

        // Particles systeem
        this.particles = [];
        
        // Level ontwerpen
        this.levels = [
            // Level 1 - Tutorial
            [
                "WWWWWWWW",
                "W  P  TW",
                "W  B   W",
                "W      W",
                "WWWWWWWW"
            ],
            // Level 2 - Basis
            [
                "WWWWWWWWW",
                "W   W   W",
                "W B P B W",
                "W T W T W",
                "WWWWWWWWW"
            ],
            // Level 3 - Hoeken
            [
                "WWWWWWWWW",
                "W  T T  W",
                "W BWP B W",
                "W       W",
                "WWWWWWWWW"
            ],
            // Level 4 - Doolhof
            [
                "WWWWWWWWWWW",
                "WT  W    W",
                "WB  W B  W",
                "WW  WPW  W",
                "W   W    W",
                "W B    B W",
                "W   W  T W",
                "WWWWWWWWWW"
            ],
            // Level 5 - Zigzag
            [
                "WWWWWWWWW",
                "W     T W",
                "W WWW B W",
                "W W P   W",
                "W W B WWW",
                "W W T   W",
                "W       W",
                "WWWWWWWWW"
            ],
            // Level 6 - Dubbel Pad
            [
                "WWWWWWWWWW",
                "W        W",
                "W WWWWB  W",
                "W W    WWW",
                "WPB T T  W",
                "W W    W W",
                "W WWWWWW W",
                "W        W",
                "WWWWWWWWWW"
            ],
            // Level 7 - Kruispunt
            [
                "WWWWWWWWWWW",
                "W    B    W",
                "W  T W T  W",
                "WWW WWW WWW",
                "W    P    W",
                "W  B W B  W",
                "WWW WWW WWW",
                "W  T W T  W",
                "W         W",
                "WWWWWWWWWWW"
            ],
            // Level 8 - Doolhof Plus
            [
                "WWWWWWWWWWWW",
                "W          W",
                "W WWW  WWW W",
                "W W T  T W W",
                "W W B  B W W",
                "WWW  P  WWW",
                "W W B  B W W",
                "W W T  T W W",
                "W WWW  WWW W",
                "W          W",
                "WWWWWWWWWWWW"
            ],
            // Level 9 - Spiraal
            [
                "WWWWWWWWWWW",
                "WTTTW     W",
                "W WWW BBB W",
                "W W       W",
                "W W WWWWWWW",
                "W W   P   W",
                "W WWWWWW WW",
                "W         W",
                "WWWWWWWWWWW"
            ],
            // Level 10 - Finale
            [
                "WWWWWWWWWWWW",
                "W    T  T  W",
                "W  B WWW B W",
                "WW WWWWWW WW",
                "W     P    W",
                "W B WWWW B W",
                "WW WWWWWW WW",
                "W  B WWW B W",
                "W    T  T  W",
                "WWWWWWWWWWWW"
            ]
        ];

        this.init();
    }

    init() {
        this.loadLevel(this.level);
        
        // Toetsenbord besturing
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.key === 'Enter') {
                    this.nextLevel();
                }
                return;
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePlayer(1, 0);
                    break;
                case 'r':
                    this.loadLevel(this.level);
                    break;
            }
        });

        this.gameLoop();
    }

    createParticles(x, y, color, type = 'move') {
        const count = type === 'move' ? 5 : 10;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x * this.tileSize + this.tileSize / 2,
                y: y * this.tileSize + this.tileSize / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1,
                type: type
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.95;

            if (particle.type === 'target') {
                particle.vy -= 0.1; // Zweef effect voor target particles
            }

            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }

    loadLevel(levelNum) {
        if (levelNum >= this.levels.length) {
            this.gameComplete = true;
            return;
        }

        this.moves = 0;
        this.gameOver = false;
        this.map = [];
        this.boxes = [];
        this.targets = [];
        this.animations.boxes.clear();
        this.particles = [];
        
        const level = this.levels[levelNum];
        
        for (let y = 0; y < level.length; y++) {
            this.map[y] = [];
            for (let x = 0; x < level[y].length; x++) {
                const char = level[y][x];
                this.map[y][x] = char === 'W' ? 'wall' : 'floor';
                
                if (char === 'B') {
                    this.boxes.push({x, y});
                    this.animations.boxes.set(`${x},${y}`, {
                        scale: 1,
                        rotation: 0
                    });
                }
                if (char === 'T') this.targets.push({x, y});
                if (char === 'P') {
                    this.player = {x, y};
                    this.animations.player = {
                        scale: 1,
                        rotation: 0
                    };
                }
            }
        }

        this.canvas.width = level[0].length * this.tileSize;
        this.canvas.height = level.length * this.tileSize;
    }

    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (this.map[newY][newX] === 'wall') return;
        
        const boxIndex = this.boxes.findIndex(box => box.x === newX && box.y === newY);
        
        if (boxIndex !== -1) {
            const newBoxX = newX + dx;
            const newBoxY = newY + dy;
            
            if (this.map[newBoxY][newBoxX] === 'wall') return;
            if (this.boxes.some(box => box.x === newBoxX && box.y === newBoxY)) return;
            
            // Animatie voor doos beweging
            const box = this.boxes[boxIndex];
            this.animations.boxes.set(`${box.x},${box.y}`, {
                scale: 1.1,
                rotation: dx !== 0 ? Math.PI / 24 : 0
            });
            
            this.createParticles(box.x, box.y, this.colors.box.main);
            
            this.boxes[boxIndex].x = newBoxX;
            this.boxes[boxIndex].y = newBoxY;

            // Check of doos op target komt
            if (this.targets.some(target => target.x === newBoxX && target.y === newBoxY)) {
                this.createParticles(newBoxX, newBoxY, this.colors.target.main, 'target');
            }
        }
        
        // Animatie voor speler beweging
        this.animations.player = {
            scale: 1.1,
            rotation: dx !== 0 ? Math.PI / 24 : 0
        };
        
        this.createParticles(this.player.x, this.player.y, this.colors.player.main);
        
        this.player.x = newX;
        this.player.y = newY;
        this.moves++;
        
        this.checkWin();
    }

    checkWin() {
        const allOnTarget = this.targets.every(target =>
            this.boxes.some(box => box.x === target.x && box.y === target.y)
        );
        
        if (allOnTarget) {
            this.gameOver = true;
            // Vier effect
            this.targets.forEach(target => {
                this.createParticles(target.x, target.y, this.colors.target.main, 'win');
            });
        }
    }

    drawWall(x, y) {
        const { main, highlight, shadow } = this.colors.wall;
        
        // Hoofdvlak
        this.ctx.fillStyle = main;
        this.ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
        
        // Highlight
        this.ctx.fillStyle = highlight;
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo(x * this.tileSize + this.tileSize - 5, y * this.tileSize + 5);
        this.ctx.lineTo(x * this.tileSize + 5, y * this.tileSize + 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Schaduw
        this.ctx.fillStyle = shadow;
        this.ctx.beginPath();
        this.ctx.moveTo((x + 1) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo(x * this.tileSize + this.tileSize - 5, y * this.tileSize + this.tileSize - 5);
        this.ctx.lineTo(x * this.tileSize + this.tileSize - 5, y * this.tileSize + 5);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawBox(box) {
        const animation = this.animations.boxes.get(`${box.x},${box.y}`) || { scale: 1, rotation: 0 };
        const { main, highlight, shadow } = this.colors.box;
        
        this.ctx.save();
        this.ctx.translate(
            box.x * this.tileSize + this.tileSize / 2,
            box.y * this.tileSize + this.tileSize / 2
        );
        this.ctx.rotate(animation.rotation);
        this.ctx.scale(animation.scale, animation.scale);
        
        // Schaduw
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            -this.tileSize * 0.4,
            -this.tileSize * 0.4 + 4,
            this.tileSize * 0.8,
            this.tileSize * 0.8,
            8
        );
        this.ctx.fill();
        
        // Hoofdvorm
        this.ctx.fillStyle = main;
        this.ctx.beginPath();
        this.ctx.roundRect(
            -this.tileSize * 0.4,
            -this.tileSize * 0.4,
            this.tileSize * 0.8,
            this.tileSize * 0.8,
            8
        );
        this.ctx.fill();
        
        // Highlight
        this.ctx.fillStyle = highlight;
        this.ctx.beginPath();
        this.ctx.roundRect(
            -this.tileSize * 0.35,
            -this.tileSize * 0.35,
            this.tileSize * 0.7,
            this.tileSize * 0.2,
            4
        );
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Update animatie
        if (animation.scale > 1) {
            animation.scale *= 0.95;
        }
        if (Math.abs(animation.rotation) > 0.01) {
            animation.rotation *= 0.9;
        }
    }

    drawTarget(target) {
        const { main, glow } = this.colors.target;
        
        // Glow effect
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(
            target.x * this.tileSize + this.tileSize/2,
            target.y * this.tileSize + this.tileSize/2,
            this.tileSize/2.5 + Math.sin(Date.now() / 500) * 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Doel cirkel
        this.ctx.fillStyle = main;
        this.ctx.beginPath();
        this.ctx.arc(
            target.x * this.tileSize + this.tileSize/2,
            target.y * this.tileSize + this.tileSize/2,
            this.tileSize/3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    drawPlayer() {
        const { main, highlight, shadow } = this.colors.player;
        
        this.ctx.save();
        this.ctx.translate(
            this.player.x * this.tileSize + this.tileSize/2,
            this.player.y * this.tileSize + this.tileSize/2
        );
        this.ctx.rotate(this.animations.player.rotation);
        this.ctx.scale(this.animations.player.scale, this.animations.player.scale);
        
        // Schaduw
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(0, 4, this.tileSize/2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hoofdvorm
        this.ctx.fillStyle = main;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.tileSize/2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Highlight
        this.ctx.fillStyle = highlight;
        this.ctx.beginPath();
        this.ctx.arc(-this.tileSize/6, -this.tileSize/6, this.tileSize/6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Update animatie
        if (this.animations.player.scale > 1) {
            this.animations.player.scale *= 0.95;
        }
        if (Math.abs(this.animations.player.rotation) > 0.01) {
            this.animations.player.rotation *= 0.9;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Teken vloer en muren
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 'wall') {
                    this.drawWall(x, y);
                } else {
                    // Vloer patroon
                    this.ctx.fillStyle = this.colors.floor.main;
                    this.ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    
                    // Subtiel raster patroon
                    this.ctx.fillStyle = this.colors.floor.pattern;
                    this.ctx.fillRect(
                        x * this.tileSize + 1,
                        y * this.tileSize + 1,
                        2,
                        2
                    );
                }
            }
        }
        
        // Teken doelen
        this.targets.forEach(target => this.drawTarget(target));
        
        // Teken dozen
        this.boxes.forEach(box => this.drawBox(box));
        
        // Teken speler
        this.drawPlayer();
        
        // Teken particles
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Update particles
        this.updateParticles();
        
        // Teken score en level info
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level: ${this.level + 1}`, 10, 30);
        this.ctx.fillText(`Zetten: ${this.moves}`, 10, 60);
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            
            if (this.gameComplete) {
                this.ctx.fillText(
                    'Gefeliciteerd! Alle levels voltooid!',
                    this.canvas.width/2,
                    this.canvas.height/2
                );
            } else {
                this.ctx.fillText(
                    'Level Voltooid!',
                    this.canvas.width/2,
                    this.canvas.height/2 - 40
                );
                this.ctx.font = '24px Arial';
                this.ctx.fillText(
                    `Voltooid in ${this.moves} zetten`,
                    this.canvas.width/2,
                    this.canvas.height/2 + 10
                );
                this.ctx.fillText(
                    'Druk op Enter voor het volgende level',
                    this.canvas.width/2,
                    this.canvas.height/2 + 50
                );
            }
        }
    }

    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    nextLevel() {
        this.level++;
        this.loadLevel(this.level);
    }
} 