
// Aquí va el contenido js
// Se crea una escena que contendrá los elementos: cámara, objetos...
var scene = new THREE.Scene();

// Se creaa una camara que definde desde donde se mira
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

// Se crea un render y se configura el tamaño
var renderer = new THREE.WebGLRenderer();

function createMountain(plane, x, y, z) {
    let h = plane.parameters.widthSegments + 1;
    plane.vertices[x*h+y].z = z;
}

function init(id, l, nDiv, vel, spect) {

    renderer.setClearColor(new THREE.Color(0x5d005c));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Para que se rendericen las sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    var axes = new THREE.AxisHelper(20);
    scene.add(axes);

    // Se crea el plano del suelo
    var planeGeometry = new THREE.PlaneGeometry(l, 20, nDiv, 100); // width, height, widthSegments, heightSegments

    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x4700bc, 
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1, 
        polygonOffsetUnits: 1
    }); // Para los puntos de luz
    
    // j es x, i es y
    for(let i = 0; i < nDiv+1; i ++) {
        for(let j = 0; j < 101; j ++) {
            let z = (255 - spect.data[(j * ((nDiv + 1) * 4)) + (i * 4)]) / 50; // Aqui la x y la y se intercambian porque el espectrograma esta rotado 90 grados
            createMountain(planeGeometry, j, i, z);
        }
    }

    planeGeometry.computeFaceNormals();
    planeGeometry.computeVertexNormals();
    
    var plane = new THREE.Mesh(planeGeometry,planeMaterial);
    
    let wireframeGeometry = new THREE.WireframeGeometry(planeGeometry);
    let wireframeMaterial = new THREE.LineBasicMaterial({color: 0x55c9ff});
    let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    plane.add(wireframe);
    scene.fog = new THREE.FogExp2(new THREE.Color(0x5d005c), 0.05)
    //THREE.Fog(new THREE.Color(0xffffff), 0.0025, 20);

    plane.receiveShadow = true; // El plano recive sombras

    // Se rota y se posiciona el plano
    plane.rotation.x = -0.5*Math.PI;
    plane.position.x = l/2;
    plane.position.y = 0;

    // Se añade el plano a la escena
    scene.add(plane);

    // Se posiciona y apunta la cámara al centro de la escena
    camera.position.x = -11;
    camera.position.y = 4;
    camera.position.z = 0;
    camera.lookAt(l,0,0);

    // Añadimos spotlights para las sombras
    var spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(-40,60,-10);
    spotLight.castShadow = true;

    spotLight.angle = Math.PI / 8.0;

    spotLight.shadow.mapSize.width = 8000;
    spotLight.shadow.mapSize.height = 8000;

    scene.add(spotLight);

    // Se renderiza la escena
    function render() {
        plane.position.x -= vel;

        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    // Añadir la salida de la renderización al elemento html
    $("#" + id).append(renderer.domElement);
    render();
}