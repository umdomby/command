# Если ты ставил gn в систему через apt или копировал бинарник вручную — удали его:
which gn
sudo apt update
sudo apt install -y python-is-python3
cd ~/depot_tools
git clone https://gn.googlesource.com/gn
cd gn
python3 build/gen.py
ninja -C out

# После этого GN будет собран в 
~/depot_tools/gn/out/gn

# Проверка
~/depot_tools/gn/out/gn --version


```
~/depot_tools/gn/out/gn gen out/Debug-arm64-v8a --args='
rtc_system_openh264 = true
target_cpu = "arm64"
target_os = "android"
is_debug = true
target_sysroot = "/home/pi/android/sdk/ndk/25.1.8937393/toolchains/llvm/prebuilt/linux-x86_64/sysroot"
android_ndk_root = "/home/pi/android/sdk/ndk/25.1.8937393"
android_ndk_api_level = 24
android_sdk_platform_version = "36"
is_component_build = false
rtc_include_tests = false
treat_warnings_as_errors = false
'
```