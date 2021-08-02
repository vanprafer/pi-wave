
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

    renderer.setClearColor(new THREE.Color(0x1f1f1f));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Para que se rendericen las sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    // Se crea el plano del suelo
    var planeGeometry = new THREE.PlaneGeometry(l, 20, nDiv, 50); // width, height, widthSegments, heightSegments
    
    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x4700bc, 
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1, 
        polygonOffsetUnits: 1
    }); // Para los puntos de luz
    
    // j es x, i es y
    for(let i = 0; i < nDiv+1; i ++) {
        for(let j = 0; j < 51; j ++) {
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
    scene.fog = new THREE.FogExp2(new THREE.Color(0x1f1f1f), 0.03)

    plane.receiveShadow = true; // El plano recibe sombras

    // Se rota y se posiciona el plano
    plane.rotation.x = -0.5*Math.PI;
    plane.position.x = l/2;
    plane.position.y = 0;

    // Se añade el plano a la escena
    scene.add(plane);

    // Luna
    let moonGeometry = new THREE.SphereGeometry(20, 30, 30);
    let moonMaterial = new THREE.MeshBasicMaterial({color: 0x5d005c, wireframe: true, fog: false});
    let moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    moon.position.x = 50;
    moon.position.y = 4;

    scene.add(moon);

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

    let imgArea = $(".spect")[0];
    let imgSpect = $("#imgSpect")[0];

    let x; 
    let y; 
    imgArea.style.display = "inherit";
    
    setTimeout(function() {
        x = imgArea.getBoundingClientRect().width;
        y = imgSpect.getBoundingClientRect().width;  
    }, 0); 

    // Se renderiza la escena
    function render() {
        plane.position.x = l/2 - songProgress()*l;
        moon.rotation.y += 0.0005;

        imgSpect.style.marginLeft = (x/2 - y*songProgress()) + "px";

        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    // Añadir la salida de la renderización al elemento html
    $("#" + id).append(renderer.domElement);
    render();
}