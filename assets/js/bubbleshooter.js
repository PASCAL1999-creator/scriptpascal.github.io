class BubbleShooter {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bubbleRadius = 20;
        this.rows = 15;
        this.cols = 15;
        this.shooterAngle = 0;
        this.gameStarted = false;
        
        // Moderne kleurenpalet
        this.colors = {
            background: '#1a1a2e',
            shooter: {
                base: '#e94560',
                accent: '#ff647f',
                glow: 'rgba(233, 69, 96, 0.3)'
            },
            bubbles: [
                { main: '#00b8a9', glow: 'rgba(0, 184, 169, 0.3)', highlight: '#33c9bd' },
                { main: '#f8d210', glow: 'rgba(248, 210, 16, 0.3)', highlight: '#fade4b' },
                { main: '#f94144', glow: 'rgba(249, 65, 68, 0.3)', highlight: '#fa6e70' },
                { main: '#9b5de5', glow: 'rgba(155, 93, 229, 0.3)', highlight: '#b37deb' },
                { main: '#00f5d4', glow: 'rgba(0, 245, 212, 0.3)', highlight: '#33f7dd' }
            ],
            ui: {
                text: '#ffffff',
                score: '#f8d210',
                button: '#e94560',
                buttonHover: '#ff647f'
            }
        };

        // Animatie eigenschappen
        this.animations = {
            bubbles: new Map(),
            shooter: {
                recoil: 0,
                rotation: 0
            },
            particles: []
        };

        // Game status
        this.score = 0;
        this.gameOver = false;
        this.currentBubble = this.getRandomBubbleColor();
        this.nextBubble = this.getRandomBubbleColor();
        
        // Initialisatie
        this.init();
        this.setupEventListeners();
        this.startScreen();
    }

    init() {
        this.canvas.width = window.innerWidth * 0.8;
        this.canvas.height = window.innerHeight * 0.8;
        this.bubbleRadius = Math.min(this.canvas.width / (this.cols * 2.2), 25);
        
        // Grid initialisatie
        this.grid = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                color: Math.random() < 0.7 ? this.getRandomBubbleColor() : null,
                scale: 1,
                rotation: 0,
                alpha: 1
            }))
        );

        // Vul alleen de bovenste helft
        for (let i = Math.floor(this.rows / 2); i < this.rows; i++) {
            this.grid[i].fill(null);
        }
    }

    startScreen() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Titel
        this.ctx.fillStyle = this.colors.ui.text;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Bubble Shooter', this.canvas.width/2, this.canvas.height/3);

        // Start knop
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = this.canvas.width/2 - buttonWidth/2;
        const buttonY = this.canvas.height/2 - buttonHeight/2;

        this.ctx.fillStyle = this.colors.ui.button;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
        this.ctx.fill();

        this.ctx.fillStyle = this.colors.ui.text;
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Start Spel', this.canvas.width/2, this.canvas.height/2 + 10);

        // Instructies
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Gebruik de muis om te richten', this.canvas.width/2, this.canvas.height * 0.7);
        this.ctx.fillText('Klik om te schieten', this.canvas.width/2, this.canvas.height * 0.7 + 30);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameStarted) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.updateShooterAngle(x, y);
        });

        this.canvas.addEventListener('click', (e) => {
            if (!this.gameStarted) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Check if click is on start button
                const buttonWidth = 200;
                const buttonHeight = 60;
                const buttonX = this.canvas.width/2 - buttonWidth/2;
                const buttonY = this.canvas.height/2 - buttonHeight/2;
                
                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    this.gameStarted = true;
                    this.gameLoop();
                }
                return;
            }
            this.shootBubble();
        });
    }

    createParticles(x, y, color, type = 'pop') {
        const count = type === 'pop' ? 10 : 5;
        for (let i = 0; i < count; i++) {
            this.animations.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color,
                life: 1,
                type
            });
        }
    }

    updateParticles() {
        for (let i = this.animations.particles.length - 1; i >= 0; i--) {
            const particle = this.animations.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.95;

            if (particle.type === 'trail') {
                particle.vy += 0.1;
            }

            if (particle.life <= 0 || particle.size < 0.5) {
                this.animations.particles.splice(i, 1);
            }
        }
    }

    drawBubble(x, y, color, scale = 1, rotation = 0, alpha = 1) {
        if (!color) return;

        const colorObj = this.colors.bubbles[color];
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.scale(scale, scale);
        this.ctx.globalAlpha = alpha;

        // Glow effect
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.bubbleRadius);
        gradient.addColorStop(0, colorObj.glow);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bubbleRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Main bubble
        this.ctx.fillStyle = colorObj.main;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bubbleRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Highlight
        this.ctx.fillStyle = colorObj.highlight;
        this.ctx.beginPath();
        this.ctx.arc(-this.bubbleRadius/3, -this.bubbleRadius/3, this.bubbleRadius/3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawShooter() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height - 60;
        const length = 60;

        // Shooter base
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Glow effect
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
        gradient.addColorStop(0, this.colors.shooter.glow);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // Shooter barrel
        this.ctx.rotate(this.shooterAngle);
        this.ctx.translate(0, -this.animations.shooter.recoil);
        
        this.ctx.fillStyle = this.colors.shooter.base;
        this.ctx.beginPath();
        this.ctx.roundRect(-10, -length, 20, length, 5);
        this.ctx.fill();

        // Accent lines
        this.ctx.strokeStyle = this.colors.shooter.accent;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-7, -length + 10);
        this.ctx.lineTo(-7, -10);
        this.ctx.moveTo(7, -length + 10);
        this.ctx.lineTo(7, -10);
        this.ctx.stroke();

        this.ctx.restore();

        // Update recoil animation
        if (this.animations.shooter.recoil > 0) {
            this.animations.shooter.recoil *= 0.9;
        }
    }

    drawTrajectory() {
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 60;
        const length = 1000;
        const endX = startX + Math.sin(this.shooterAngle) * length;
        const endY = startY - Math.cos(this.shooterAngle) * length;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawUI() {
        // Score
        this.ctx.fillStyle = this.colors.ui.score;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);

        // Next bubble preview
        this.ctx.fillStyle = this.colors.ui.text;
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Volgende:', 20, 80);
        this.drawBubble(100, 80, this.nextBubble);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const bubble = this.grid[i][j];
                if (bubble && bubble.color !== null) {
                    const x = j * this.bubbleRadius * 2 + (i % 2 ? this.bubbleRadius : 0) + this.bubbleRadius;
                    const y = i * this.bubbleRadius * 1.8 + this.bubbleRadius;
                    this.drawBubble(x, y, bubble.color, bubble.scale, bubble.rotation, bubble.alpha);
                }
            }
        }

        // Draw particles
        this.animations.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        this.drawTrajectory();
        this.drawShooter();
        this.drawUI();

        // Draw current bubble in shooter
        const shooterX = this.canvas.width / 2;
        const shooterY = this.canvas.height - 60;
        this.drawBubble(shooterX, shooterY - 30, this.currentBubble);

        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.colors.ui.text;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Eindscore: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 10);
        
        // Restart button
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = this.canvas.width/2 - buttonWidth/2;
        const buttonY = this.canvas.height/2 + 50;

        this.ctx.fillStyle = this.colors.ui.button;
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
        this.ctx.fill();

        this.ctx.fillStyle = this.colors.ui.text;
        this.ctx.fillText('Opnieuw Spelen', this.canvas.width/2, this.canvas.height/2 + 85);
    }

    updateShooterAngle(mouseX, mouseY) {
        const shooterX = this.canvas.width / 2;
        const shooterY = this.canvas.height - 60;
        this.shooterAngle = Math.atan2(mouseX - shooterX, shooterY - mouseY);
    }

    shootBubble() {
        if (this.gameOver) return;
        
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 90;
        const speed = 15;
        const angle = this.shooterAngle;
        
        const bubble = {
            x: startX,
            y: startY,
            color: this.currentBubble,
            dx: Math.sin(angle) * speed,
            dy: -Math.cos(angle) * speed
        };
        
        this.animations.shooter.recoil = 10;
        this.moveBubble(bubble);
    }

    moveBubble(bubble) {
        const animate = () => {
            // Create trail effect
            this.createParticles(bubble.x, bubble.y, this.colors.bubbles[bubble.color].main, 'trail');

            bubble.x += bubble.dx;
            bubble.y += bubble.dy;

            // Check wall collisions
            if (bubble.x < this.bubbleRadius || bubble.x > this.canvas.width - this.bubbleRadius) {
                bubble.dx *= -1;
                bubble.x = Math.max(this.bubbleRadius, Math.min(this.canvas.width - this.bubbleRadius, bubble.x));
            }

            // Check ceiling collision
            if (bubble.y < this.bubbleRadius) {
                this.snapBubbleToGrid(bubble);
                return;
            }

            // Check collision with other bubbles
            const collision = this.checkBubbleCollision(bubble);
            if (collision) {
                this.snapBubbleToGrid(bubble);
                return;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    checkBubbleCollision(bubble) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] && this.grid[i][j].color !== null) {
                    const gridX = j * this.bubbleRadius * 2 + (i % 2 ? this.bubbleRadius : 0) + this.bubbleRadius;
                    const gridY = i * this.bubbleRadius * 1.8 + this.bubbleRadius;
                    
                    const dx = bubble.x - gridX;
                    const dy = bubble.y - gridY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.bubbleRadius * 2) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    snapBubbleToGrid(bubble) {
        let minDistance = Infinity;
        let snapRow = 0;
        let snapCol = 0;

        // Find closest grid position
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.grid[i][j] || this.grid[i][j].color === null) {
                    const gridX = j * this.bubbleRadius * 2 + (i % 2 ? this.bubbleRadius : 0) + this.bubbleRadius;
                    const gridY = i * this.bubbleRadius * 1.8 + this.bubbleRadius;
                    
                    const dx = bubble.x - gridX;
                    const dy = bubble.y - gridY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        snapRow = i;
                        snapCol = j;
                    }
                }
            }
        }

        // Snap bubble to grid
        this.grid[snapRow][snapCol] = {
            color: bubble.color,
            scale: 1.2, // Start with larger scale for pop-in animation
            rotation: Math.random() * 0.2 - 0.1,
            alpha: 1
        };

        // Create pop effect
        const gridX = snapCol * this.bubbleRadius * 2 + (snapRow % 2 ? this.bubbleRadius : 0) + this.bubbleRadius;
        const gridY = snapRow * this.bubbleRadius * 1.8 + this.bubbleRadius;
        this.createParticles(gridX, gridY, this.colors.bubbles[bubble.color].main, 'pop');

        // Check for matches
        const matches = this.findMatches(snapRow, snapCol);
        if (matches.length >= 3) {
            this.removeMatches(matches);
            this.score += matches.length * 100;
        }

        // Check for floating bubbles
        this.removeFloatingBubbles();

        // Check for game over
        if (this.checkGameOver()) {
            this.gameOver = true;
        } else {
            // Prepare next bubble
            this.currentBubble = this.nextBubble;
            this.nextBubble = this.getRandomBubbleColor();
        }
    }

    findMatches(row, col, matches = new Set(), visited = new Set()) {
        const key = `${row},${col}`;
        if (visited.has(key)) return matches;
        visited.add(key);

        const color = this.grid[row][col].color;
        matches.add(key);

        const neighbors = this.getNeighbors(row, col);
        for (const [r, c] of neighbors) {
            if (this.grid[r][c] && this.grid[r][c].color === color) {
                this.findMatches(r, c, matches, visited);
            }
        }

        return matches;
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = row % 2 === 0 ? [
            [-1, -1], [-1, 0], [0, 1], [1, 0], [1, -1], [0, -1]
        ] : [
            [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [0, -1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                neighbors.push([newRow, newCol]);
            }
        }

        return neighbors;
    }

    removeMatches(matches) {
        for (const key of matches) {
            const [row, col] = key.split(',').map(Number);
            const bubble = this.grid[row][col];
            if (bubble && bubble.color !== null) {
                // Create pop animation
                const x = col * this.bubbleRadius * 2 + (row % 2 ? this.bubbleRadius : 0) + this.bubbleRadius;
                const y = row * this.bubbleRadius * 1.8 + this.bubbleRadius;
                this.createParticles(x, y, this.colors.bubbles[bubble.color].main, 'pop');
                
                // Fade out animation
                bubble.scale = 1.2;
                bubble.alpha = 0;
                setTimeout(() => {
                    this.grid[row][col] = null;
                }, 200);
            }
        }
    }

    removeFloatingBubbles() {
        const connected = new Set();
        
        // Find all bubbles connected to the top row
        for (let j = 0; j < this.cols; j++) {
            if (this.grid[0][j] && this.grid[0][j].color !== null) {
                this.findConnectedBubbles(0, j, connected);
            }
        }

        // Remove bubbles that aren't connected
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const key = `${i},${j}`;
                if (this.grid[i][j] && this.grid[i][j].color !== null && !connected.has(key)) {
                    const bubble = this.grid[i][j];
                    const x = j * this.bubbleRadius * 2 + (i % 2 ? this.bubbleRadius : 0) + this.bubbleRadius;
                    const y = i * this.bubbleRadius * 1.8 + this.bubbleRadius;
                    
                    // Create fall animation
                    this.createParticles(x, y, this.colors.bubbles[bubble.color].main, 'fall');
                    this.score += 50;
                    
                    // Remove bubble
                    this.grid[i][j] = null;
                }
            }
        }
    }

    findConnectedBubbles(row, col, connected) {
        const key = `${row},${col}`;
        if (connected.has(key)) return;
        connected.add(key);

        const neighbors = this.getNeighbors(row, col);
        for (const [r, c] of neighbors) {
            if (this.grid[r][c] && this.grid[r][c].color !== null) {
                this.findConnectedBubbles(r, c, connected);
            }
        }
    }

    checkGameOver() {
        return this.grid[this.rows - 1].some(bubble => bubble && bubble.color !== null);
    }

    getRandomBubbleColor() {
        return Math.floor(Math.random() * this.colors.bubbles.length);
    }

    gameLoop() {
        if (!this.gameStarted) return;
        this.draw();
        this.updateParticles();
        requestAnimationFrame(() => this.gameLoop());
    }
} 