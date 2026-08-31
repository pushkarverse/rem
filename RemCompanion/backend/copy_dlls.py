import os
import shutil
import glob
src_bin = r"C:\Users\pushk\OneDrive\Desktop\Rem\RemCompanion\backend\ffmpeg_shared_folder\ffmpeg-master-latest-win64-gpl-shared\bin"
target_scripts = r"C:\Users\pushk\OneDrive\Desktop\Rem\RemCompanion\backend\venv\Scripts"
target_torchcodec = r"C:\Users\pushk\OneDrive\Desktop\Rem\RemCompanion\backend\venv\Lib\site-packages\torchcodec"
dlls = glob.glob(os.path.join(src_bin, "*.dll"))
for dll in dlls:
    print(f"Copying {os.path.basename(dll)} to {target_scripts}")
    shutil.copy(dll, target_scripts)
    print(f"Copying {os.path.basename(dll)} to {target_torchcodec}")
    shutil.copy(dll, target_torchcodec)
print("DLLs copied successfully! PyTorch will absolutely find them now.")