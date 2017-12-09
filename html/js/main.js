fetch("wasm/mandelbrot.wasm").then(response =>
    response.arrayBuffer()
  ).then(bytes =>
    WebAssembly.instantiate(bytes, {})
  ).then(results => {
    // Init wasm bindings
    const module = {};
    const mod = results.instance;
    module.alloc = mod.exports.alloc;
    module.dealloc = mod.exports.dealloc;
    module.calculate = mod.exports.calculate;

    // Init canvas
    const canvas = document.getElementById('canvas');
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const byteSize = width * height * 4;
    const pointer = module.alloc(byteSize);
    const usub = new Uint8ClampedArray(mod.exports.memory.buffer, pointer, byteSize);
    const img = new ImageData(usub, width, height);

    // Init key state + helpers
    const keyState = {};
    isKeyPressed = key => !!keyState[key];
    document.addEventListener('keydown', e => {
      // console.log(e.key);
      keyState[e.key] = true;
    });
    document.addEventListener('keyup', e => {
      keyState[e.key] = false;
    });

    // Init mandelbrot local variables
    const fps = 1.0 / 60;
    let maxIterations;
    let position;
    let zoom;

    reset = () => {
      maxIterations = 50;
      position = [-0.5, 0.0];
      zoom = 1.0;
    }
    reset();

    const averageSize = 20;
    let arr = new Array(averageSize);
    let i = 0;
    printAverage = () => {
      console.log(arr.reduce(function (p, c) {
        return p + c;
      }) / arr.length);
    }
    pushAverage = val => {
        arr.push(val);
        arr.shift();
    }

    // Rendering
    draw = () => {
      const t0 = performance.now();

      module.calculate(pointer, width, height, maxIterations, position[0], position[1], zoom);

      pushAverage(performance.now() - t0);
      //printAverage(); // uncomment to view timings
      
      ctx.putImageData(img, 0, 0);
      requestAnimationFrame(draw);
    }

    // Key press updates
    update = () => {
        const inverseZoom = 1.0 / zoom;
        let multiplier = 1.0;
        if (isKeyPressed("Shift")) {
            multiplier = 5.0;
        }
        
        if (isKeyPressed("ArrowLeft")) {
            position[0] -= (0.1 * inverseZoom * multiplier);
        }
        if (isKeyPressed("ArrowRight")) {
            position[0] += (0.1 * inverseZoom * multiplier);
        }
        if (isKeyPressed("ArrowUp")) {
            position[1] -= (0.1 * inverseZoom * multiplier);
        }
        if (isKeyPressed("ArrowDown")) {
            position[1] += (0.1 * inverseZoom * multiplier);
        }
        if (isKeyPressed("a") || isKeyPressed("A")) {
            zoom += (0.1 * zoom * multiplier);
        }
        if (isKeyPressed("s") || isKeyPressed("S")) {
            zoom -= (0.1 * zoom * multiplier);
        }
        if (isKeyPressed(" ")) {
            reset();
        }
        if (isKeyPressed("z") || isKeyPressed("Z")) {
            maxIterations += (1 * multiplier);
        }
        if (isKeyPressed("x") || isKeyPressed("X")) {
            maxIterations -= (1 * multiplier);
        }
        if (isKeyPressed("Enter")) {
            console.log(position, maxIterations, zoom);
        }
        setTimeout(() => requestAnimationFrame(update), fps);
    }

    // Gogogo
    requestAnimationFrame(draw);
    requestAnimationFrame(update);

    // Cleanup...
    module.dealloc(pointer);
  });
