# Script for running FLUX.2 [9b] & Flux.1 Fill [pro] via Black Forest Lab API
# Created by: Cody Jackson for AAU Project

import os
import sys
import time
import base64
import requests
from PIL import Image
from io import BytesIO
from pathlib import Path

# Config flags
RESIZE_IMAGE = False  # Set to False to disable automatic resizing
MAX_WIDTH = 1920
MAX_HEIGHT = 1920
CREDIT_TO_USD = 0.01  # 1 credit = $0.01

# Inpainting Params
STEPS = 50  # Number of inference steps (higher = more quality but slower)
GUIDANCE = 30  # Guidance scale (how closely to follow the prompt)
OUTPUT_FORMAT = "jpeg"  # Output format: "jpeg" or "png"

def testprint(input_string):
    return input_string + "apple"

def resize_image_if_needed(image_path, suffix="_resized"):
    # Resize image if it exceeds max dimensions while preserving aspect ratio
    try:
        with Image.open(image_path) as img:
            original_size = img.size
            original_format = img.format
            original_mode = img.mode
            
            # Check if resize is needed
            if img.width <= MAX_WIDTH and img.height <= MAX_HEIGHT:
                print(f"  Image within limits ({img.width}x{img.height}), no resize needed")
                return image_path  # Return original path
            
            # Calculate new dimensions while preserving aspect ratio
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
            
            # Preserve original mode for masks (important for binary masks)
            if original_mode in ('1', 'L', 'P'):
                # For mask images, ensure we keep them as single channel
                if original_mode == 'RGBA':
                    # Convert RGBA to RGB for mask? Usually masks are grayscale
                    img = img.convert('L')
            
            # Create temporary filename for resized image
            input_path = Path(image_path)
            resized_path = input_path.parent / f"{input_path.stem}{suffix}{input_path.suffix}"
            
            # Save resized image
            save_format = original_format or 'JPEG'
            if save_format == 'PNG' or original_mode in ('1', 'L', 'P', 'RGBA'):
                # Use PNG for masks and images with transparency
                resized_path = resized_path.with_suffix('.png')
                img.save(resized_path, format='PNG', optimize=True)
            else:
                img.save(resized_path, format=save_format, quality=95, optimize=True)
            
            print(f"  Resized image from {original_size[0]}x{original_size[1]} to {img.width}x{img.height}")
            print(f"  Saved resized image to: {resized_path}")
            
            return str(resized_path)
    except Exception as e:
        print(f"  Error resizing image: {e}")
        return image_path  # Return original path if resize fails

def encode_image_to_base64(image_path, is_mask=False):
    # Convert an image file to base64 string
    try:
        with Image.open(image_path) as img:
            # Handle mask images specially
            if is_mask:
                # Ensure mask is in the right format (grayscale, binary)
                if img.mode != 'L':
                    img = img.convert('L')
                
                # Optional: Ensure mask is binary (pure black and white)
                # This can help with mask interpretation
                threshold = 128
                img = img.point(lambda p: 255 if p > threshold else 0)
            else:
                # For input image, convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = rgb_img
            
            # Save to bytes buffer
            buffered = BytesIO()
            
            # Determine format
            if is_mask or image_path.lower().endswith('.png'):
                # Save masks as PNG to preserve exact values
                img.save(buffered, format="PNG")
            else:
                img.save(buffered, format="JPEG", quality=95)
            
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return img_str
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

def poll_for_result(polling_url, request_id, api_key):
    # Poll for the result until it's ready
    start_time = time.time()
    
    while True:
        time.sleep(0.5)  # Wait 0.5 seconds between polls
        
        try:
            result = requests.get(
                polling_url,
                headers={
                    'accept': 'application/json',
                    'x-key': api_key,
                },
                params={'id': request_id}
            ).json()
            
            if result['status'] == 'Ready':
                elapsed_time = time.time() - start_time
                print(f"\nImage ready after {elapsed_time:.2f} seconds")
                return result['result']['sample']
            elif result['status'] in ['Error', 'Failed', 'error', 'failed']:
                print(f"Generation failed: {result}")
                return None
            else:
                # Still processing
                elapsed = time.time() - start_time
                print(f"\rPolling... ({elapsed:.1f}s elapsed, status: {result['status']})", end='', flush=True)
                
        except Exception as e:
            print(f"\nError polling for result: {e}")
            return None

def validate_mask(mask_path):
    # Validate that the mask is appropriate for inpainting
    try:
        with Image.open(mask_path) as mask:
            # Check if mask is single channel or can be converted
            if mask.mode not in ['1', 'L', 'P']:
                print(f"Warning: Mask has mode {mask.mode}. Should ideally be grayscale or binary.")
            
            # Optional: Check if mask has both black and white areas
            import numpy as np
            mask_array = np.array(mask.convert('L'))
            unique_values = np.unique(mask_array)
            
            if len(unique_values) == 1:
                print("Warning: Mask appears to be uniform (all one color). Inpainting may not work as expected.")
            elif len(unique_values) > 2:
                print("Info: Mask has grayscale values. Will be thresholded to binary during encoding.")
            
            return True
    except Exception as e:
        print(f"Error validating mask: {e}")
        return False

def run_image_to_image(image_file, prompt, api_key):
    # Failsafe
    if (image_file is None) or (prompt is None) or (api_key is None):
        print(f"Error running Image-to-Image: {image_file}, {prompt}, {api_key}")
        return None

    # Actually run it
    print(f">>> Starting FLUX.2 Klien [9b] Image-to-Image editing")
    print(f"Image File: {image_file}")
    print(f"Prompt: {prompt}")

    # Start timing the whole process
    total_start_time = time.time()

    # Encode the images
    print(f"Encoding images...")
    print("Encoding input image...")
    encoded_image = encode_image_to_base64(image_file, is_mask=False)

    # API Request
    print(f"Sending request to Black Forest Labs API...")
    #
    try:
        response = requests.post(
            'https://api.bfl.ai/v1/flux-2-klein-9b',
            headers={
                'accept': 'application/json',
                'x-key': api_key,
                'Content-Type': 'application/json',
            },
            json={
                'prompt': prompt,
                'input_image': encoded_image,
            },
        ).json()
        
        # Check for errors in the response
        if 'id' not in response:
            print(f"API Error: {response}")
            sys.exit(1)
        
        request_id = response["id"]
        polling_url = response.get("polling_url", f"https://api.bfl.ai/v1/get_result?id={request_id}")
        cost = response.get("cost")
        input_mp = response.get("input_mp")
        output_mp = response.get("output_mp")
        
        print(f"\nRequest ID: {request_id}")
        if cost:
            # Round cost to 2 decimal places and calculate USD
            cost_rounded = round(cost, 2)
            usd_cost = cost_rounded * CREDIT_TO_USD
            print(f"Cost: {cost_rounded} credits (${usd_cost:.2f} USD)")
        if input_mp:
            print(f"Input MP: {input_mp}")
        if output_mp:
            print(f"Output MP: {output_mp}")
        
        # Poll for the result
        print("\nWaiting for image generation...")
        image_url = poll_for_result(polling_url, request_id, api_key)
        
        if image_url:
            # Download and save the image
            print(f"\nDownloading result from: {image_url}")
            img_response = requests.get(image_url)
            
            if img_response.status_code == 200:
                # Generate output filename
                input_path = Path(image_file)  # Use original filename for output
                output_file = f"{input_path.stem}_edited{input_path.suffix}"
                
                # Save the image
                with open(output_file, 'wb') as f:
                    f.write(img_response.content)
                
                total_elapsed = time.time() - total_start_time
                print(f"\n✓ Success! Image saved as: {output_file}")
                print(f"Total time: {total_elapsed:.2f} seconds")

                return output_file
            else:
                print(f"\nError downloading image: {img_response.status_code}")
        else:
            print("\nFailed to get result from API")
    except Exception as e:
        print(f"Error: {e}")

    print(f"IMAGE GENERATION FAILED")
    return None

def run_inpainting(image_file, mask_file, prompt, api_key):
    # Failsafe
    if (image_file is None) or (prompt is None) or (api_key is None) or (mask_file is None):
        print(f"Error running Image-to-Image: {image_file}, {prompt}, {api_key}, {mask_file}")
        return None

    print(f">>> Starting FLUX.1 Fill [pro] Image Inpainting")
    print(f"Image File: {image_file}")
    print(f"Prompt: {prompt}")
    print(f"Mask File: {mask_file}")
    print(f"Parameters: Steps={STEPS}, Guidance={GUIDANCE}, Output={OUTPUT_FORMAT}")

    # Validate mask
    print(f"Validating mask...")
    validate_mask(mask_file)

    # Start timing the whole process
    total_start_time = time.time()

    # Encode the images
    print(f"Encoding images...")
    print("Encoding input image...")
    encoded_image = encode_image_to_base64(image_file, is_mask=False)
    print("Encoding mask...")
    encoded_mask = encode_image_to_base64(mask_file, is_mask=True)
    
    # API Request
    print(f"Sending request to Black Forest Labs API...")
    try:
        response = requests.post(
            "https://api.bfl.ai/v1/flux-pro-1.0-fill",
            headers={
                "x-key": api_key,
                "Content-Type": "application/json"
            },
            json={
                "prompt": prompt,
                "image": encoded_image,
                "mask": encoded_mask,
                "steps": STEPS,
                "guidance": GUIDANCE,
                "output_format": OUTPUT_FORMAT
            }
        ).json()
        
        # Check for errors in the response
        if 'id' not in response:
            print(f"API Error") #{response}
            sys.exit(1)
        
        request_id = response["id"]
        polling_url = response.get("polling_url", f"https://api.bfl.ai/v1/get_result?id={request_id}")
        
        print(f"\nRequest ID: {request_id}")
        print(f"Polling URL: {polling_url}")
        
        # Poll for the result
        print("\nWaiting for inpainting generation...")
        image_url = poll_for_result(polling_url, request_id, api_key)
        
        if image_url:
            # Download and save the image
            print(f"\nDownloading result from: {image_url}")
            img_response = requests.get(image_url)
            
            if img_response.status_code == 200:
                # Generate output filename
                input_path = Path(image_file)
                output_ext = f".{OUTPUT_FORMAT}" if OUTPUT_FORMAT else input_path.suffix
                output_file = f"{input_path.stem}_inpainted{output_ext}"
                
                # Save the image
                with open(output_file, 'wb') as f:
                    f.write(img_response.content)
                
                total_elapsed = time.time() - total_start_time
                print(f"\n✓ Success! Inpainted image saved as: {output_file}")
                print(f"Total time: {total_elapsed:.2f} seconds")

                return output_file

            else:
                print(f"\nError downloading image: {img_response.status_code}")
        else:
            print("\nFailed to get result from API")
    except Exception as e:
        print(f"Error: {e}")

    print(f"IMAGE GENERATION FAILED")
    return None
