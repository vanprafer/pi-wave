import * as THREE from './lib/three.module.js';
import songProgress from './audio.js';

// Aquí va el contenido js
// Se crea una escena que contendrá los elementos: cámara, objetos...
var scene = new THREE.Scene();

// Se creaa una camara que definde desde donde se mira
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

// Se crea un render y se configura el tamaño
var renderer = new THREE.WebGLRenderer();

// Variable astronauta
var astronaut;
var movement;
var clock = new THREE.Clock();

function createMountain(plane, x, y, z) {
    let h = plane.parameters.widthSegments + 1;
    plane.attributes.position.array[3 * (x * h + y) + 2] = z;
}

// Media ponderada
function ponderatedMean(spect, x, nDiv) {
    let pondSum = 0;
    let denominator = 0;
    for(let y=0; y < 51; y++) {
        let value = 255 - spect.data[(y * ((nDiv + 1) * 4)) + (x * 4)];
        pondSum += y*value;
        denominator += value;
    }
    if(!denominator) {
        return 0;
    } 
    return pondSum/denominator;
}

// Array de las medias ponderadas
function arrayOfPonderatedMeans(spect, nDiv) {
    let arrayOfPondMeans = [];
    for(let x=0; x < nDiv+1; x++) {
        arrayOfPondMeans.push(ponderatedMean(spect, x, nDiv));
    }
    return arrayOfPondMeans;
}

// Calculador de una ventana
function windowPonderatedMean(arrayOfPondMeans, width, position) {
    let window = 0;
    for(let i=0; i<width; i++) {
        if(i+position >= arrayOfPondMeans.length) {
            window += arrayOfPondMeans[arrayOfPondMeans.length-1];
        } else {
            window += arrayOfPondMeans[i+position];
        }
    }
    return window/width;
}

// Array de ventanas 
function astronautPath(arrayOfPondMeans, width) {
    let path = [];
    for(let j=0; j<arrayOfPondMeans.length; j++) {
        path.push(windowPonderatedMean(arrayOfPondMeans, width, j));
    }
    return path;
}

function randomBetween(min, max) {
    return (max-min)*Math.random()+min;
}

function distance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2) + Math.pow(z1-z2, 2))
}

export default function init(id, l, nDiv, vel, spect) {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
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

    var path;
    
    // Si hay espectrograma, crea relieve
    if(spect) { // array en js es true si lleva elementos dentro (truthy)
        // j es x, i es y
        for(let i = 0; i < nDiv+1; i ++) {
            for(let j = 0; j < 51; j ++) {
                let z = (255 - spect.data[(j * ((nDiv + 1) * 4)) + (i * 4)]) / 50; // Aqui la x y la y se intercambian porque el espectrograma esta rotado 90 grados
                createMountain(planeGeometry, j, i, z);
            }
        }
        planeGeometry.computeFaceNormals();
        planeGeometry.computeVertexNormals();

        // Movimiento de izq a der del astronauta
        let arrayOfPondMeans = arrayOfPonderatedMeans(spect, nDiv);
        path = astronautPath(arrayOfPondMeans, 5);
        console.log(arrayOfPondMeans);
    }
    
    var plane = new THREE.Mesh(planeGeometry,planeMaterial);
    
    let wireframeGeometry = new THREE.WireframeGeometry(planeGeometry);
    let wireframeMaterial = new THREE.LineBasicMaterial({color: 0x55c9ff});
    let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    plane.add(wireframe);
    scene.fog = new THREE.FogExp2(new THREE.Color(0x1f1f1f), 0.05)

    plane.receiveShadow = true; // El plano recibe sombras

    // Se rota y se posiciona el plano
    plane.rotation.x = -0.5*Math.PI;
    plane.position.x = l/2;
    plane.position.y = 0;

    // Se añade el plano a la escena
    scene.add(plane);

    // Luna
    let moonGeometry = new THREE.SphereGeometry(20, 100, 100);
    let moonMaterial = new THREE.MeshBasicMaterial({
        color: 0x29180e, 
        vertexColors: true,
        fog: false,
        polygonOffset: true,
        polygonOffsetFactor: 1, 
        polygonOffsetUnits: 1
    });
    
    let colors = [];

    for (let i = 0, n = moonGeometry.attributes.position.count; i < n; ++ i) {
        colors.push(1,1,1);
    }       
    moonGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));


    //// Como el centro de la esfera es (0,0,0), no hace falta calcular los vectores, porque se corresponden con los puntos finales
    for(let i=0; i<moonGeometry.attributes.position.array.length; i+=3) {
        let xMoon = moonGeometry.attributes.position.array[i]/10;
        let yMoon = moonGeometry.attributes.position.array[i+1]/10;
        let zMoon = moonGeometry.attributes.position.array[i+2]/10;
        moonGeometry.attributes.position.array[i] *= 1 + noise.simplex3(xMoon, yMoon, zMoon)/10;
        moonGeometry.attributes.position.array[i+1] *= 1 + noise.simplex3(xMoon, yMoon, zMoon)/10;
        moonGeometry.attributes.position.array[i+2] *= 1 + noise.simplex3(xMoon, yMoon, zMoon)/10;
    }

    //// Crea cráteres
    for(let crater=0; crater<30; crater++) {
        let multiple3 = Math.floor(randomBetween(0, moonGeometry.attributes.position.array.length-1));
        multiple3 -= multiple3%3; 

        let radius = randomBetween(2, 5);
        let centerX = moonGeometry.attributes.position.array[multiple3];
        let centerY = moonGeometry.attributes.position.array[multiple3+1];
        let centerZ = moonGeometry.attributes.position.array[multiple3+2];

        // Busca los puntos a los que le ha afectado el cráter y los baja 0.9
        for(let i=0; i<moonGeometry.attributes.position.array.length; i+=3) {
            let xMoon = moonGeometry.attributes.position.array[i];
            let yMoon = moonGeometry.attributes.position.array[i+1];
            let zMoon = moonGeometry.attributes.position.array[i+2];
            
            if(distance(xMoon, yMoon, zMoon, centerX, centerY, centerZ) <= radius) {
                // Hundimiento
                moonGeometry.attributes.position.array[i] *= 0.9;
                moonGeometry.attributes.position.array[i+1] *= 0.9;
                moonGeometry.attributes.position.array[i+2] *= 0.9;
                // Color
                moonGeometry.attributes.color.array[i] *= 0.7;
                moonGeometry.attributes.color.array[i+1] *= 0.7;
                moonGeometry.attributes.color.array[i+2] *= 0.7;
            }
        }
    }


    let moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    moon.position.x = 55;
    moon.position.y = 4;

    console.log(moon.geometry.attributes);

    scene.add(moon);

    let wireframeMoonGeometry = new THREE.WireframeGeometry(moonGeometry);
    let wireframeMoonMaterial = new THREE.LineBasicMaterial({color: 0x422616, fog:false});
    let wireframeMoon = new THREE.LineSegments(wireframeMoonGeometry, wireframeMoonMaterial);

    moon.add(wireframeMoon);

    // Stars

    let xStarMin = 170-(150/2);
    let xStarMax = 170+(150/2);
    let yStarMin = 4-(100/2);
    let yStarMax = 4+(100/2);    
    let zStarMin = -200/2;
    let zStarMax = 200/2;

    let colorStars = [0xffffff, 0xfeffc4, 0xffd1c4, 0xc4deff, 0xe5c4ff];

    for(let i=0; i<2000; i++) {

        let starGeometry = new THREE.SphereGeometry(randomBetween(0.05, 0.3), 3, 3);
        let starMaterial = new THREE.MeshBasicMaterial( {color: colorStars[Math.floor(randomBetween(0, 4))], fog: false} );
        let star = new THREE.Mesh(starGeometry, starMaterial);

        star.position.x = randomBetween(xStarMin, xStarMax);
        star.position.y = randomBetween(yStarMin, yStarMax);
        star.position.z = randomBetween(zStarMin, zStarMax);

        scene.add(star);
    }


    // Se añade el astronauta a la escena
    if(astronaut) {
        astronaut.scene.scale.set(0.01,0.01,0.01);
        astronaut.scene.position.set(0,6,0);
        scene.add(astronaut.scene);
    
        movement = new THREE.AnimationMixer(astronaut.scene);
        
        astronaut.animations.forEach(function(frame) {
            movement.clipAction(frame).play();
        }); 
    }

    // Se posiciona y apunta la cámara al centro de la escena
    camera.position.x = -12;
    camera.position.y = 4;
    camera.position.z = 0;
    camera.lookAt(l,0,0);

    // Añadimos spotlights para las sombras
    let spotLight = new THREE.SpotLight(0xffffff, 0.8);
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

    // Necesitamos que la línea roja salga cuando exista espectrograma
    if(spect) {
        imgArea.style.display = "inherit";
    }
    
    //Espera a que el espectrograma se cargue y luego lo mide
    setTimeout(function() {
        x = imgArea.getBoundingClientRect().width;
        y = imgSpect.getBoundingClientRect().width;  
    }, 0); 

    // Se renderiza la escena
    function render() {
        let delta = clock.getDelta();

        plane.position.x = l/2 - songProgress()*l;
        moon.rotation.y += delta/10;

        astronaut.scene.position.y = Math.cos(clock.elapsedTime)/2 + 5;

        if(path) {
            let currentPosition = (path.length-1)*songProgress();
            let prevPoint = (path[Math.floor(currentPosition)] - 25.5)*0.4;
            let nextPoint = (path[Math.ceil(currentPosition)] - 25.5)*0.4;
            let prc = currentPosition - Math.floor(currentPosition);
            let progressAstronaut = Math.min(prevPoint, nextPoint) + prc * Math.abs(prevPoint - nextPoint);
            astronaut.scene.position.z = astronaut.scene.position.z * 4 / 5 + progressAstronaut/5;
        }

        if(!x || !y) {
            //Espera a que el espectrograma se cargue y luego lo mide
            setTimeout(function() {
                x = imgArea.getBoundingClientRect().width;
                y = imgSpect.getBoundingClientRect().width;  
            }, 0); 
        }

        imgSpect.style.marginLeft = (x/2 - y*songProgress()) + "px";

        requestAnimationFrame(render);
  
        movement.update(delta);
        renderer.render(scene, camera);
    }

    // Añadir la salida de la renderización al elemento html
    $("#" + id).append(renderer.domElement);
    render();
}

import * as GLTF from "./lib/GLTFLoader.js";

let loader = new GLTF.GLTFLoader();
loader.load("./models/scene.gltf", function(model) {
    astronaut = model;

    let duration = 300;
    init("scene", Math.floor(0.4 * duration * 10), Math.floor(duration * 10), 0.05, false);
}, function() {

}, function(error) {
    console.log(error);
});

