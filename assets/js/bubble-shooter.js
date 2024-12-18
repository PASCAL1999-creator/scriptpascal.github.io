class BubbleShooter {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bubbles = [];
        
        // Bereken optimale bubbelgrootte gebaseerd op canvas breedte
        this.bubbleRadius = Math.floor(this.canvas.width / 32);
        this.bubbleSpacing = this.bubbleRadius * 2;
        
        this.shooter = {
            x: canvas.width / 2,
            y: canvas.height - this.bubbleRadius * 2,
            angle: 0
        };
        this.projectile = null;
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#F7D794'];
        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.nextBubbleColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.currentBubbleColor = this.colors[Math.floor(Math.random() * this.colors.length)];

        // Start scherm elementen
        this.startScreen = document.getElementById('bubbleShooterStartScreen');
        this.startButton = document.getElementById('startBubbleShooter');
        
        this.startButton.addEventListener('click', () => this.startGame());
        this.init();
    }

    init() {
        this.canvas.style.opacity = '0';
        this.startScreen.style.display = 'flex';

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isGameStarted || this.isGameOver) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const dx = mouseX - this.shooter.x;
            const dy = mouseY - this.shooter.y;
            this.shooter.angle = Math.atan2(dy, dx);

            // Beperk de hoek tot -170 tot 170 graden (bijna volledige cirkel)
            const maxAngle = Math.PI * 0.95; // ongeveer 170 graden
            if (this.shooter.angle > maxAngle) this.shooter.angle = maxAngle;
            if (this.shooter.angle < -maxAngle) this.shooter.angle = -maxAngle;
        });

        this.canvas.addEventListener('click', () => {
            if (!this.isGameStarted || this.isGameOver) return;
            if (!this.projectile) this.shoot();
        });

        this.gameLoop();
    }

    startGame() {
        const cols = Math.floor((this.canvas.width - this.bubbleRadius) / this.bubbleSpacing);
        const rows = 5; // Begin met 5 rijen

        this.bubbles = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const offset = row % 2 === 0 ? 0 : this.bubbleSpacing / 2;
                this.bubbles.push({
                    x: col * this.bubbleSpacing + offset + this.bubbleRadius,
                    y: row * this.bubbleSpacing + this.bubbleRadius,
                    radius: this.bubbleRadius,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    row: row,
                    col: col
                });
            }
        }

        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = true;
        this.projectile = null;

        this.startScreen.style.display = 'none';
        this.canvas.style.opacity = '1';
        this.canvas.style.transition = 'opacity 0.5s ease';
    }

    shoot() {
        const speed = 15; // Verhoogde snelheid voor betere gameplay
        this.projectile = {
            x: this.shooter.x,
            y: this.shooter.y,
            radius: this.bubbleRadius,
            color: this.currentBubbleColor,
            dx: Math.cos(this.shooter.angle) * speed,
            dy: Math.sin(this.shooter.angle) * speed
        };
        this.currentBubbleColor = this.nextBubbleColor;
        this.nextBubbleColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    findNearestGridPosition(x, y) {
        const row = Math.round((y - this.bubbleRadius) / this.bubbleSpacing);
        const offset = row % 2 === 0 ? 0 : this.bubbleSpacing / 2;
        const col = Math.round((x - offset - this.bubbleRadius) / this.bubbleSpacing);
        
        return {
            x: col * this.bubbleSpacing + offset + this.bubbleRadius,
            y: row * this.bubbleSpacing + this.bubbleRadius,
            row: row,
            col: col
        };
    }

    findMatchingBubbles(bubble) {
        const matches = new Set();
        const toCheck = [bubble];
        const checked = new Set();

        while (toCheck.length > 0) {
            const current = toCheck.pop();
            const key = `${current.row},${current.col}`;
            
            if (checked.has(key)) continue;
            checked.add(key);

            if (current.color === bubble.color) {
                matches.add(key);
                
                // Vind alle buren
                const neighbors = this.getNeighbors(current);
                for (const neighbor of neighbors) {
                    if (!checked.has(`${neighbor.row},${neighbor.col}`)) {
                        toCheck.push(neighbor);
                    }
                }
            }
        }

        return matches;
    }

    getNeighbors(bubble) {
        const directions = bubble.row % 2 === 0 ? [
            [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
        ] : [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
        ];

        return directions
            .map(([rowDiff, colDiff]) => ({
                row: bubble.row + rowDiff,
                col: bubble.col + colDiff
            }))
            .map(pos => this.bubbles.find(b => b.row === pos.row && b.col === pos.col))
            .filter(b => b !== undefined);
    }

    checkFloatingBubbles() {
        // Markeer alle bubbels als niet-bezocht
        const visited = new Set();
        
        // Begin met alle bubbels in de bovenste rij
        const topRowBubbles = this.bubbles.filter(b => b.row === 0);
        const connected = new Set();
        
        // DFS vanaf elke bubbel in de bovenste rij
        for (const bubble of topRowBubbles) {
            this.markConnectedBubbles(bubble, visited, connected);
        }
        
        // Verwijder alle bubbels die niet verbonden zijn met de top
        this.bubbles = this.bubbles.filter(bubble => 
            connected.has(`${bubble.row},${bubble.col}`)
        );
    }

    markConnectedBubbles(bubble, visited, connected) {
        const key = `${bubble.row},${bubble.col}`;
        if (visited.has(key)) return;
        
        visited.add(key);
        connected.add(key);
        
        const neighbors = this.getNeighbors(bubble);
        for (const neighbor of neighbors) {
            this.markConnectedBubbles(neighbor, visited, connected);
        }
    }

    update() {
        if (!this.isGameStarted || this.isGameOver) return;

        if (this.projectile) {
            this.projectile.x += this.projectile.dx;
            this.projectile.y += this.projectile.dy;

            // Muur collisions
            if (this.projectile.x < this.bubbleRadius || this.projectile.x > this.canvas.width - this.bubbleRadius) {
                this.projectile.dx *= -1;
            }

            // Plafond of bubbel collision
            if (this.projectile.y < this.bubbleRadius) {
                this.snapBubble(this.projectile);
                return;
            }

            // Check bubbel collisions
            for (const bubble of this.bubbles) {
                const dx = this.projectile.x - bubble.x;
                const dy = this.projectile.y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.projectile.radius + bubble.radius) {
                    this.snapBubble(this.projectile);
                    return;
                }
            }
        }
    }

    snapBubble(projectile) {
        const gridPos = this.findNearestGridPosition(projectile.x, projectile.y);
        
        // Check of de positie al bezet is
        if (this.bubbles.some(b => b.row === gridPos.row && b.col === gridPos.col)) {
            // Vind een alternatieve positie
            const neighbors = [
                {row: gridPos.row-1, col: gridPos.col},
                {row: gridPos.row+1, col: gridPos.col},
                {row: gridPos.row, col: gridPos.col-1},
                {row: gridPos.row, col: gridPos.col+1}
            ];
            
            for (const pos of neighbors) {
                if (!this.bubbles.some(b => b.row === pos.row && b.col === pos.col)) {
                    gridPos.row = pos.row;
                    gridPos.col = pos.col;
                    gridPos.x = pos.col * this.bubbleSpacing + (pos.row % 2 === 0 ? 0 : this.bubbleSpacing/2) + this.bubbleRadius;
                    gridPos.y = pos.row * this.bubbleSpacing + this.bubbleRadius;
                    break;
                }
            }
        }

        const newBubble = {
            x: gridPos.x,
            y: gridPos.y,
            radius: this.bubbleRadius,
            color: projectile.color,
            row: gridPos.row,
            col: gridPos.col
        };

        this.bubbles.push(newBubble);
        
        // Check voor matches
        const matches = this.findMatchingBubbles(newBubble);
        if (matches.size >= 3) {
            // Verwijder matching bubbels
            this.bubbles = this.bubbles.filter(bubble => 
                !matches.has(`${bubble.row},${bubble.col}`)
            );
            this.score += matches.size * 10;
            
            // Check voor zwevende bubbels
            this.checkFloatingBubbles();
        }

        this.projectile = null;
        
        // Check voor game over
        if (this.bubbles.some(b => b.y > this.canvas.height - this.bubbleRadius * 3)) {
            this.isGameOver = true;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.isGameStarted) return;

        // Teken bestaande bubbels
        this.bubbles.forEach(bubble => {
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = bubble.color;
            this.ctx.fill();
            this.ctx.closePath();

            // Glans effect
            this.ctx.beginPath();
            this.ctx.arc(
                bubble.x - bubble.radius/3,
                bubble.y - bubble.radius/3,
                bubble.radius/3,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
            this.ctx.closePath();
        });

        // Teken richtlijn
        if (!this.projectile) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.shooter.x, this.shooter.y);
            this.ctx.lineTo(
                this.shooter.x + Math.cos(this.shooter.angle) * 800,
                this.shooter.y + Math.sin(this.shooter.angle) * 800
            );
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.closePath();
        }

        // Teken huidige schietbubbel
        if (!this.projectile) {
            this.ctx.beginPath();
            this.ctx.arc(this.shooter.x, this.shooter.y, this.bubbleRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.currentBubbleColor;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.closePath();

            // Glans effect
            this.ctx.beginPath();
            this.ctx.arc(
                this.shooter.x - this.bubbleRadius/3,
                this.shooter.y - this.bubbleRadius/3,
                this.bubbleRadius/3,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fill();
            this.ctx.closePath();
        }

        // Teken volgende bubbel preview
        const previewWidth = this.bubbleRadius * 6;
        const previewHeight = this.bubbleRadius * 3;
        this.ctx.fillStyle = 'rgba(46, 52, 64, 0.8)';
        this.ctx.fillRect(
            this.canvas.width - previewWidth - this.bubbleRadius,
            this.canvas.height - previewHeight - this.bubbleRadius,
            previewWidth,
            previewHeight
        );
        this.ctx.strokeStyle = '#4ECDC4';
        this.ctx.strokeRect(
            this.canvas.width - previewWidth - this.bubbleRadius,
            this.canvas.height - previewHeight - this.bubbleRadius,
            previewWidth,
            previewHeight
        );

        // Teken "Volgende:" tekst
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `bold ${this.bubbleRadius}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            'Volgende:',
            this.canvas.width - previewWidth - this.bubbleRadius/2,
            this.canvas.height - previewHeight/2
        );

        // Teken volgende bubbel
        this.ctx.beginPath();
        this.ctx.arc(
            this.canvas.width - previewWidth/3,
            this.canvas.height - previewHeight/2,
            this.bubbleRadius,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = this.nextBubbleColor;
        this.ctx.fill();
        this.ctx.closePath();

        // Glans effect op volgende bubbel
        this.ctx.beginPath();
        this.ctx.arc(
            this.canvas.width - previewWidth/3 - this.bubbleRadius/3,
            this.canvas.height - previewHeight/2 - this.bubbleRadius/3,
            this.bubbleRadius/3,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fill();
        this.ctx.closePath();

        // Teken actieve projectile
        if (this.projectile) {
            this.ctx.beginPath();
            this.ctx.arc(this.projectile.x, this.projectile.y, this.projectile.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.projectile.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.closePath();

            // Glans effect
            this.ctx.beginPath();
            this.ctx.arc(
                this.projectile.x - this.projectile.radius/3,
                this.projectile.y - this.projectile.radius/3,
                this.projectile.radius/3,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
            this.ctx.closePath();
        }

        // Score display
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, this.canvas.height - 20);

        const scoreDisplay = document.getElementById('bubble-score');
        if (scoreDisplay) {
            scoreDisplay.textContent = this.score;
        }

        // Game over scherm
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`Eindstand: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText('Klik om opnieuw te spelen', this.canvas.width / 2, this.canvas.height / 2 + 60);

            this.canvas.addEventListener('click', () => {
                if (this.isGameOver) {
                    this.resetGame();
                }
            }, { once: true });
        }
    }

    resetGame() {
        this.isGameStarted = false;
        this.isGameOver = false;
        this.startScreen.style.display = 'flex';
        this.canvas.style.opacity = '0';
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
} 