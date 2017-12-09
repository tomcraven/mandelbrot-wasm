cargo build --target=wasm32-unknown-unknown --verbose --release && mkdir -p html/wasm && wasm-gc target/wasm32-unknown-unknown/release/mandelbrot.wasm html/wasm/mandelbrot.wasm
