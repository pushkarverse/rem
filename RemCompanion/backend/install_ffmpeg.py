import urllib.request
import zipfile
import os
url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip"
zip_path = "ffmpeg_shared.zip"
extract_path = "ffmpeg_shared_folder"
print("Downloading FFmpeg Shared Build (this may take a minute)...")
urllib.request.urlretrieve(url, zip_path)
print("Extracting FFmpeg...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)
print("Done! You now have the FFmpeg DLLs required for PyTorch TorchCodec!")