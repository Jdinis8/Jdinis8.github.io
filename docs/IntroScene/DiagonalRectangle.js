export class DiagonalRectangle {
    constructor(circle, height = 10, speed = 1, rotatespeed = 0.001) {
        this.circle = circle;     // reference to the center circle
        this.height = height;     // rectangle thickness
        this.speed = speed;       // pixels per frame
        this.currentLength = 0;   // animated length
        this.completed = false;

        this.angle = Math.PI / 4; // 45 degrees in radians
        this.rotatespeed = rotatespeed; // rotation speed in radians/frame
        this.rotating = false; // flag to start rotation after full length is reached

        this.splitting = false; // flag to start splitting after rotation is complete
        this.circleAttached = false; // flag to check if rectangle is attached to circle
        this.splitSpeed = 2; // speed of splitting in pixels/frame
        this.splitOffset = 0; // how much the rectangle has split apart
    }

    update(dt) {
        if (!this.circle.completed  || !this.circle.clicked || this.completed) return; // wait until circle is done and clicked

        if(!this.rotating) {
            // increase length until it covers the canvas diagonally
            let maxLength = Math.min(canvas.width, canvas.height) * Math.sqrt(2); // diagonal length of canvas
            if (this.currentLength < maxLength) {
                this.currentLength += this.speed * dt;
            } else if (this.currentLength > 0.8*maxLength){ // start rotation a bit before reaching full diagonal to sync with circle animation
                this.currentLength = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
                this.rotating = true;
            }
        } else {
            if (!this.splitting && this.rotating){
                // smooth interpolation
                this.angle -= this.rotatespeed * dt;

                if (Math.abs(this.angle) < this.rotatespeed * dt) {
                    this.angle = 0;
                    this.splitting = true;
                    this.circleAttached = true;             
                }
            }
        }

        if (this.splitting) {
            this.splitOffset += this.splitSpeed;

            // push off screen
            if (this.splitOffset > canvas.height/2 + this.circle.radius + 1) {
                this.splitting = false;
                this.completed = true;
            }
        }
    }

    draw(ctx) {
        if (!this.circle.completed || !this.circle.clicked) return; // wait until circle is done and clicked

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(this.angle); // Initially 45 degrees

        const halfHeight = this.height / 2;

        ctx.fillStyle = "#ffffff";
        // draw rectangle from circle center along rotated x-axis
        ctx.fillRect(- this.currentLength/Math.sqrt(2), -halfHeight - this.splitOffset, this.currentLength*Math.sqrt(2), halfHeight);
        ctx.fillRect(- this.currentLength/Math.sqrt(2), this.splitOffset, this.currentLength*Math.sqrt(2), halfHeight);
        
        this.circle.y = canvas.height/2 + this.splitOffset; // update lower rectangle y position for circle attachment

        ctx.restore();
    }
}
