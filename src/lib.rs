// lots of inspiration taken from https://www.hellorust.com/demos/canvas/index.html
use std::mem;
use std::slice;
use std::os::raw::c_void;

const ESCAPE: f32 = 4.0;

// In order to work with the memory we expose (de)allocation methods
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut c_void {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    return ptr as *mut c_void;
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut c_void, cap: usize) {
    unsafe {
        let _buf = Vec::from_raw_parts(ptr, 0, cap);
    }
}

#[no_mangle]
pub fn calculate(pointer: *mut u8,
                 width: i32,
                 height: i32,
                 max_iterations: i32,
                 pos_x: f32,
                 pos_y: f32,
                 zoom: f32) {
    let byte_size = (width * height * 4) as usize;
    let slice = unsafe { slice::from_raw_parts_mut(pointer, byte_size) };
    let f_width = width as f32;
    let f_height = height as f32;
    let half_zoom = zoom / 2.0;
    let zoomed_height = half_zoom * f_height;
    let zoomed_width = half_zoom * f_width;
    let half_width = width / 2;
    let half_height = height / 2;
    let mut slice_index = 0;

    for y in -half_height..half_height {
        let y0 = (y as f32) / zoomed_height + pos_y;

        for x in -half_width..half_width {
            let x0 = 1.5 * (x as f32) / zoomed_width + pos_x;
            let mut re = 0.0;
            let mut im = 0.0;
            let mut iteration = 0;

            while iteration < max_iterations {
                let re_temp = re * re - im * im + x0;
                im = 2.0 * re * im + y0;
                re = re_temp;

                if re * re + im * im > ESCAPE {
                    break;
                }

                iteration += 1;
            }

            let rgb = iteration_to_rgb(iteration, max_iterations);
            slice[slice_index + 0] = rgb[0];
            slice[slice_index + 1] = rgb[1];
            slice[slice_index + 2] = rgb[2];
            slice[slice_index + 3] = 255;
            slice_index += 4;
        }
    }
}

fn divide(a: i32, b: i32) -> f32 {
    (a as f32) / (b as f32)
}

fn iteration_to_rgb(iteration: i32, max_iterations: i32) -> [u8; 3] {
    [(divide(iteration, max_iterations) * 255.0) as u8,
     (divide(iteration, max_iterations) * 255.0) as u8,
     (divide(iteration, max_iterations) * 255.0) as u8]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_name() {
        let width: i32 = 80;
        let height: i32 = 40;
        let mut data: Vec<u8> = Vec::with_capacity((width * height * 4) as usize);

        calculate(data.as_mut_ptr(), width, height, 100, -0.5, 0.0, 1.0);
    }
}
