https://docs.flutter.dev/get-started/install/linux/android?tab=download

1. Verify that you have the following tools installed: bash, file, mkdir, rm, which

which bash file mkdir rm which
/bin/bash
/usr/bin/file
/bin/mkdir
/bin/rm
which: shell built-in command

2. Install the following packages: curl, git, unzip, xz-utils, zip, libglu1-mesa

sudo apt-get update -y && sudo apt-get upgrade -y;
sudo apt-get install -y curl git unzip xz-utils zip libglu1-mesa

3. To develop Android apps:

    1. Install the following prequisite packages for Android Studio: libc6:i386, libncurses5:i386, libstdc++6:i386, lib32z1, libbz2-1.0:i386

$ sudo apt-get install \
libc6:i386 libncurses5:i386 \
libstdc++6:i386 lib32z1 \
libbz2-1.0:i386
content_copy

    2. Install Android Studio 2023.1 (Hedgehog) to debug and compile Java or Kotlin code for Android. Flutter requires the full version of Android Studio.

IntelliJ IDEA 2023.1 or later with the Flutter plugin for IntelliJ.