class Camera {
    constructor() {
        this.eye = new Vector3([0, 0, -3]);
        this.at = new Vector3([0, 0, 100]);
        this.up = new Vector3([0, 1, 0]);
    }

    forward() {
        let f = new Vector3(this.at.elements).sub(this.eye).normalize();
        this.at.add(f);
        this.eye.add(f);
    }

    back() {
        let f = new Vector3(this.eye.elements).sub(this.at).normalize();
        this.at.add(f);
        this.eye.add(f);
    }

    left() {
        let f = new Vector3(this.at.elements).sub(this.eye).normalize();
        let s = Vector3.cross(this.up, f).normalize();
        this.at.add(s);
        this.eye.add(s);
    }

    right() {
        let f = new Vector3(this.at.elements).sub(this.eye).normalize();
        let s = Vector3.cross(f, this.up).normalize();
        this.at.add(s);
        this.eye.add(s);
    }
}

