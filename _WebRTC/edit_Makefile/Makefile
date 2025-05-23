SRC_PATH=$(word 1, $(dir $(MAKEFILE_LIST)))
vpath %.c $(SRC_PATH)
vpath %.cc $(SRC_PATH)
vpath %.cpp $(SRC_PATH)
vpath %.asm $(SRC_PATH)
vpath %.S $(SRC_PATH)
vpath %.rc $(SRC_PATH)
vpath %.pc.in $(SRC_PATH)

OS=$(shell uname | tr A-Z a-z | tr -d \\-0-9. | sed -E 's/^(net|open|free)bsd/bsd/')
ARCH=$(shell uname -m)
LIBPREFIX=lib
LIBSUFFIX=a
CCAS=$(CC)
CXX_O=-o $@
CXX_LINK_O=-o $@
AR_OPTS=cr $@
LINK_LOCAL_DIR=-L.
LINK_LIB=-l$(1)
CFLAGS_OPT=-O3
CFLAGS_DEBUG=-g
BUILDTYPE=Release
V=Yes
PREFIX=/usr/local
SHARED=-shared
OBJ=o
DESTDIR=
LIBDIR_NAME=lib
SHAREDLIB_DIR=$(PREFIX)/lib
PROJECT_NAME=openh264
MODULE_NAME=gmpopenh264
GMP_API_BRANCH=Firefox135
GTEST_VER=release-1.8.1
CCASFLAGS=$(CFLAGS)
STATIC_LDFLAGS=-lstdc++
STRIP ?= strip
USE_STACK_PROTECTOR=Yes
USE_LOW_VERSION_NDK=No
USE_ANT=No

SHAREDLIB_MAJORVERSION=8
FULL_VERSION := 2.6.0

# Добавлено: Убедимся, что -fPIC включён для всех компиляций
CFLAGS += -fPIC
LDFLAGS += -fPIC

ifeq (,$(wildcard $(SRC_PATH)gmp-api))
HAVE_GMP_API=No
else
HAVE_GMP_API=Yes
endif

ifeq (,$(wildcard $(SRC_PATH)gtest))
HAVE_GTEST=No
else
HAVE_GTEST=Yes
endif

# Configurations
ifeq ($(BUILDTYPE), Release)
CFLAGS += $(CFLAGS_OPT)
CFLAGS += -DNDEBUG
USE_ASM=Yes
ifeq ($(DEBUGSYMBOLS), True)
CFLAGS += -g
CXXFLAGS += -g
DEBUGSYMBOLS_TAG := _debug_symbols
PROCESS_FILES := True
endif
else
CFLAGS += $(CFLAGS_DEBUG)
USE_ASM=No
endif

ifeq ($(USE_ASAN), Yes)
CFLAGS += -fsanitize=address
LDFLAGS += -fsanitize=address
endif

STRIP_FLAGS := -S
ifeq (linux, $(OS))
STRIP_FLAGS := -g
endif

# Make sure the all target is the first one
all: libraries binaries

ifeq (android, $(OS))
USE_LOW_VERSION_NDK = $(shell $(SRC_PATH)build/ndk-version-check.sh $(NDKROOT))
ifeq (Yes, $(USE_LOW_VERSION_NDK))
USE_ANT = Yes
include $(SRC_PATH)build/platform-android-r18b.mk
else
include $(SRC_PATH)build/platform-android.mk
endif
else
include $(SRC_PATH)build/platform-$(OS).mk
endif

MODULE := $(LIBPREFIX)$(MODULE_NAME).$(SHAREDLIBSUFFIX)

CFLAGS += -DGENERATED_VERSION_HEADER

ifeq (Yes, $(GCOV))
CFLAGS += -fprofile-arcs -ftest-coverage
LDFLAGS += -lgcov
endif

#### No user-serviceable parts below this line
ifneq ($(V),Yes)
    QUIET_CXX  = @printf "CXX\t$@\n";
    QUIET_CC   = @printf "CC\t$@\n";
    QUIET_CCAS = @printf "CCAS\t$@\n";
    QUIET_ASM  = @printf "ASM\t$@\n";
    QUIET_AR   = @printf "AR\t$@\n";
    QUIET_RC   = @printf "RC\t$@\n";
    QUIET      = @
endif

INCLUDES += -I$(SRC_PATH)codec/api/wels -I$(SRC_PATH)codec/common/inc -Icodec/common/inc

DECODER_INCLUDES += \
    -I$(SRC_PATH)codec/decoder/core/inc \
    -I$(SRC_PATH)codec/decoder/plus/inc

ENCODER_INCLUDES += \
    -I$(SRC_PATH)codec/encoder/core/inc \
    -I$(SRC_PATH)codec/encoder/plus/inc \
    -I$(SRC_PATH)codec/processing/interface

PROCESSING_INCLUDES += \
    -I$(SRC_PATH)codec/processing/interface \
    -I$(SRC_PATH)codec/processing/src/common \
    -I$(SRC_PATH)codec/processing/src/adaptivequantization \
    -I$(SRC_PATH)codec/processing/src/downsample \
    -I$(SRC_PATH)codec/processing/src/scrolldetection \
    -I$(SRC_PATH)codec/processing/src/vaacalc

GTEST_INCLUDES += \
    -I$(SRC_PATH)gtest/googletest \
    -I$(SRC_PATH)gtest/googletest/include

CODEC_UNITTEST_INCLUDES += \
    -I$(SRC_PATH)gtest/googletest/include \
    -I$(SRC_PATH)codec/common/inc \
    -I$(SRC_PATH)test

CONSOLE_COMMON_INCLUDES += \
    -I$(SRC_PATH)codec/console/common/inc

H264DEC_INCLUDES += $(DECODER_INCLUDES) $(CONSOLE_COMMON_INCLUDES) -I$(SRC_PATH)codec/console/dec/inc
H264DEC_LDFLAGS = $(LINK_LOCAL_DIR) $(call LINK_LIB,decoder) $(call LINK_LIB,common) $(call LINK_LIB,console_common)
H264DEC_DEPS = $(LIBPREFIX)decoder.$(LIBSUFFIX) $(LIBPREFIX)common.$(LIBSUFFIX) $(LIBPREFIX)console_common.$(LIBSUFFIX)

H264ENC_INCLUDES += $(ENCODER_INCLUDES) $(CONSOLE_COMMON_INCLUDES) -I$(SRC_PATH)codec/console/enc/inc
H264ENC_LDFLAGS = $(LINK_LOCAL_DIR) $(call LINK_LIB,encoder) $(call LINK_LIB,processing) $(call LINK_LIB,common) $(call LINK_LIB,console_common)
H264ENC_DEPS = $(LIBPREFIX)encoder.$(LIBSUFFIX) $(LIBPREFIX)processing.$(LIBSUFFIX) $(LIBPREFIX)common.$(LIBSUFFIX) $(LIBPREFIX)console_common.$(LIBSUFFIX)

CODEC_UNITTEST_LDFLAGS = $(LINK_LOCAL_DIR) $(call LINK_LIB,gtest) $(call LINK_LIB,decoder) $(call LINK_LIB,encoder) $(call LINK_LIB,processing) $(call LINK_LIB,common) $(CODEC_UNITTEST_LDFLAGS_SUFFIX)
CODEC_UNITTEST_DEPS = $(LIBPREFIX)gtest.$(LIBSUFFIX) $(LIBPREFIX)decoder.$(LIBSUFFIX) $(LIBPREFIX)encoder.$(LIBSUFFIX) $(LIBPREFIX)processing.$(LIBSUFFIX) $(LIBPREFIX)common.$(LIBSUFFIX)
DECODER_UNITTEST_INCLUDES += $(CODEC_UNITTEST_INCLUDES) $(DECODER_INCLUDES)
ENCODER_UNITTEST_INCLUDES += $(CODEC_UNITTEST_INCLUDES) $(ENCODER_INCLUDES)
PROCESSING_UNITTEST_INCLUDES += $(CODEC_UNITTEST_INCLUDES) $(PROCESSING_INCLUDES)
API_TEST_INCLUDES += $(CODEC_UNITTEST_INCLUDES)
COMMON_UNITTEST_INCLUDES += $(CODEC_UNITTEST_INCLUDES)
MODULE_INCLUDES += -I$(SRC_PATH)gmp-api

DECODER_UNITTEST_CFLAGS += $(CODEC_UNITTEST_CFLAGS)
ENCODER_UNITTEST_CFLAGS += $(CODEC_UNITTEST_CFLAGS)
PROCESSING_UNITTEST_CFLAGS += $(CODEC_UNITTEST_CFLAGS)
API_TEST_CFLAGS += $(CODEC_UNITTEST_CFLAGS)
COMMON_UNITTEST_CFLAGS += $(CODEC_UNITTEST_CFLAGS)

.PHONY: test gtest-bootstrap clean $(PROJECT_NAME).pc $(PROJECT_NAME)-static.pc

generate-version:
	$(QUIET)sh $(SRC_PATH)codec/common/generate_version.sh $(SRC_PATH)

codec/decoder/plus/src/welsDecoderExt.$(OBJ): | generate-version
codec/encoder/plus/src/welsEncoderExt.$(OBJ): | generate-version

clean:
ifeq (android,$(OS))
clean: clean_Android
endif
	$(QUIET)rm -f $(OBJS) $(OBJS:.$(OBJ)=.d) $(OBJS:.$(OBJ)=.obj) $(LIBRARIES) $(BINARIES) *.lib *.a *.dylib *.dll *.so *.so.* *.exe *.pdb *.exp *.pc *.res *.map $(SRC_PATH)codec/common/inc/version_gen.h

gmp-bootstrap:
	if [ ! -d gmp-api ] ; then git clone https://github.com/mozilla/gmp-api gmp-api ; fi
	cd gmp-api && git fetch origin && git checkout $(GMP_API_BRANCH)

gtest-bootstrap:
	if [ ! -d gtest ] ; then git clone https://github.com/google/googletest.git gtest && \
       cd gtest && git checkout -b $(GTEST_VER) $(GTEST_VER) ; fi

ifeq ($(HAVE_GTEST),Yes)

ifneq (android,$(OS))
ifneq (ios,$(OS))
ifneq (msvc-wp,$(OS))
BUILD_UT_EXE=Yes
endif
endif
endif

test: codec_unittest$(EXEEXT)
ifeq ($(BUILD_UT_EXE), Yes)
	./codec_unittest
endif

else
test:
	@echo "./gtest: No such file or directory."
	@echo "You do not have gtest. Run make gtest-bootstrap to get gtest"
endif

include $(SRC_PATH)codec/common/targets.mk
include $(SRC_PATH)codec/decoder/targets.mk
include $(SRC_PATH)codec/encoder/targets.mk
include $(SRC_PATH)codec/processing/targets.mk

ifeq ($(HAVE_GMP_API),Yes)
include $(SRC_PATH)module/targets.mk
endif

ifneq (android, $(OS))
ifneq (ios, $(OS))
ifneq (msvc-wp, $(OS))
include $(SRC_PATH)codec/console/dec/targets.mk
include $(SRC_PATH)codec/console/enc/targets.mk
include $(SRC_PATH)codec/console/common/targets.mk
endif
endif
endif

libraries: $(LIBPREFIX)$(PROJECT_NAME).$(LIBSUFFIX)

# No point in building dylib for ios
ifneq (ios, $(OS))
libraries: $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIX)
endif

LIBRARIES += $(LIBPREFIX)$(PROJECT_NAME).$(LIBSUFFIX) $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXFULLVER)

$(LIBPREFIX)$(PROJECT_NAME).$(LIBSUFFIX): $(ENCODER_OBJS) $(DECODER_OBJS) $(PROCESSING_OBJS) $(COMMON_OBJS)
	$(QUIET)rm -f $@
	$(QUIET_AR)$(AR) $(AR_OPTS) $+
ifeq (True, $(PROCESS_FILES))
	cp $@ $(LIBPREFIX)$(PROJECT_NAME)$(DEBUGSYMBOLS_TAG).$(LIBSUFFIX)
	$(STRIP) $(STRIP_FLAGS) $@ -o $@
endif

$(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXFULLVER): $(ENCODER_OBJS) $(DECODER_OBJS) $(PROCESSING_OBJS) $(COMMON_OBJS)
	$(QUIET)rm -f $@
	$(QUIET_CXX)$(CXX) $(SHARED) $(CXX_LINK_O) $+ $(LDFLAGS) $(SHLDFLAGS)
ifeq (True, $(PROCESS_FILES))
	cp $@ $(LIBPREFIX)$(PROJECT_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXFULLVER)
	$(STRIP) $(STRIP_FLAGS) $@ -o $@
endif

ifneq ($(SHAREDLIBSUFFIXFULLVER),$(SHAREDLIBSUFFIX))
$(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIX): $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXFULLVER)
	$(QUIET)ln -sfn $+ $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXMAJORVER)
	$(QUIET)ln -sfn $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXMAJORVER) $@
ifeq (True, $(PROCESS_FILES))
	$(QUIET)ln -sfn $(LIBPREFIX)$(PROJECT_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXFULLVER) $(LIBPREFIX)$(PROJECT_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXMAJORVER)
	$(QUIET)ln -sfn $(LIBPREFIX)$(PROJECT_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXMAJORVER) $(LIBPREFIX)$(PROJECT_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIX)
endif
endif

ifeq ($(HAVE_GMP_API),Yes)
plugin: $(MODULE)
LIBRARIES += $(LIBPREFIX)$(MODULE_NAME).$(SHAREDLIBSUFFIXFULLVER)
else
plugin:
	@echo "./gmp-api: No such file or directory."
	@echo "You do not have gmp-api.  Run make gmp-bootstrap to get the gmp-api headers."
endif

echo-plugin-name:
	@echo $(MODULE)

$(LIBPREFIX)$(MODULE_NAME).$(SHAREDLIBSUFFIXFULLVER): $(MODULE_OBJS) $(ENCODER_OBJS) $(DECODER_OBJS) $(PROCESSING_OBJS) $(COMMON_OBJS)
	$(QUIET)rm -f $@
	$(QUIET_CXX)$(CXX) $(SHARED) $(CXX_LINK_O) $+ $(LDFLAGS) $(SHLDFLAGS) $(MODULE_LDFLAGS)
ifeq (True, $(PROCESS_FILES))
	cp $@ $(LIBPREFIX)$(MODULE_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXFULLVER)
	$(STRIP) $(STRIP_FLAGS) $@ -o $@
endif

ifneq ($(SHAREDLIBSUFFIXFULLVER),$(SHAREDLIBSUFFIX))
$(MODULE): $(LIBPREFIX)$(MODULE_NAME).$(SHAREDLIBSUFFIXFULLVER)
	$(QUIET)ln -sfn $+ $(LIBPREFIX)$(MODULE_NAME).$(SHAREDLIBSUFFIXMAJORVER)
	$(QUIET)ln -sfn $(LIBPREFIX)$(MODULE_NAME).$(SHAREDLIBSUFFIXMAJORVER) $@
ifeq (True, $(PROCESS_FILES))
	$(QUIET)ln -sfn $(LIBPREFIX)$(MODULE_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXFULLVER) $(LIBPREFIX)$(MODULE_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXMAJORVER)
	$(QUIET)ln -sfn $(LIBPREFIX)$(MODULE_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIXMAJORVER) $(LIBPREFIX)$(MODULE_NAME)$(DEBUGSYMBOLS_TAG).$(SHAREDLIBSUFFIX)
endif
endif

$(PROJECT_NAME).pc: $(PROJECT_NAME).pc.in
	@sed -e 's;@prefix@;$(PREFIX);' -e 's;@libdir@;$(PREFIX)/lib;' -e 's;@VERSION@;$(FULL_VERSION);' -e 's;@LIBS@;;' -e 's;@LIBS_PRIVATE@;$(STATIC_LDFLAGS);' < $< > $@

$(PROJECT_NAME)-static.pc: $(PROJECT_NAME).pc.in
	@sed -e 's;@prefix@;$(PREFIX);' -e 's;@libdir@;$(PREFIX)/lib;' -e 's;@VERSION@;$(FULL_VERSION);' -e 's;@LIBS@;$(STATIC_LDFLAGS);' -e 's;@LIBS_PRIVATE@;;' < $< > $@

install-headers:
	mkdir -p $(DESTDIR)$(PREFIX)/include/wels
	install -m 644 $(SRC_PATH)/codec/api/wels/codec*.h $(DESTDIR)$(PREFIX)/include/wels

install-static-lib: $(LIBPREFIX)$(PROJECT_NAME).$(LIBSUFFIX) install-headers
	mkdir -p $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)
	install -m 644 $(LIBPREFIX)$(PROJECT_NAME).$(LIBSUFFIX) $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)

install-static: install-static-lib $(PROJECT_NAME)-static.pc
	mkdir -p $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)/pkgconfig
	install -m 644 $(PROJECT_NAME)-static.pc $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)/pkgconfig/$(PROJECT_NAME).pc

install-shared: $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIX) install-headers $(PROJECT_NAME).pc
	mkdir -p $(DESTDIR)$(SHAREDLIB_DIR)
	install -m 755 $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXFULLVER) $(DESTDIR)$(SHAREDLIB_DIR)
	if [ "$(SHAREDLIBSUFFIXFULLVER)" != "$(SHAREDLIBSUFFIX)" ]; then \
	  cp -a $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIXMAJORVER) $(DESTDIR)$(SHAREDLIB_DIR) ; \
	  cp -a $(LIBPREFIX)$(PROJECT_NAME).$(SHAREDLIBSUFFIX) $(DESTDIR)$(SHAREDLIB_DIR) ; \
	fi
	mkdir -p $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)/pkgconfig
	install -m 644 $(PROJECT_NAME).pc $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)/pkgconfig
ifneq ($(EXTRA_LIBRARY),)
	install -m 644 $(EXTRA_LIBRARY) $(DESTDIR)$(PREFIX)/$(LIBDIR_NAME)
endif

install: install-static-lib install-shared
	@:

ifneq ($(HAVE_GTEST),Yes)
binaries:
	@:
else
include $(SRC_PATH)build/gtest-targets.mk
include $(SRC_PATH)test/api/targets.mk
include $(SRC_PATH)test/decoder/targets.mk
include $(SRC_PATH)test/encoder/targets.mk
include $(SRC_PATH)test/processing/targets.mk
include $(SRC_PATH)test/common/targets.mk

LIBRARIES += $(LIBPREFIX)ut.$(LIBSUFFIX)
$(LIBPREFIX)ut.$(LIBSUFFIX): $(DECODER_UNITTEST_OBJS) $(ENCODER_UNITTEST_OBJS) $(PROCESSING_UNITTEST_OBJS) $(COMMON_UNITTEST_OBJS) $(API_TEST_OBJS)
	$(QUIET)rm -f $@
	$(QUIET_AR)$(AR) $(AR_OPTS) $+

LIBRARIES +=$(LIBPREFIX)ut.$(SHAREDLIBSUFFIX)
$(LIBPREFIX)ut.$(SHAREDLIBSUFFIX): $(DECODER_UNITTEST_OBJS) $(ENCODER_UNITTEST_OBJS) $(PROCESSING_UNITTEST_OBJS) $(API_TEST_OBJS) $(COMMON_UNITTEST_OBJS) $(CODEC_UNITTEST_DEPS)
	$(QUIET)rm -f $@
	$(QUIET_CXX)$(CXX) $(SHARED) $(CXX_LINK_O) $+ $(LDFLAGS) $(UTSHLDFLAGS) $(CODEC_UNITTEST_LDFLAGS)

binaries: codec_unittest$(EXEEXT)
BINARIES += codec_unittest$(EXEEXT)

ifeq ($(BUILD_UT_EXE), Yes)
# Build a normal command line executable
codec_unittest$(EXEEXT): $(DECODER_UNITTEST_OBJS) $(ENCODER_UNITTEST_OBJS) $(PROCESSING_UNITTEST_OBJS) $(API_TEST_OBJS) $(COMMON_UNITTEST_OBJS) $(CODEC_UNITTEST_DEPS) | res
	$(QUIET)rm -f $@
	$(QUIET_CXX)$(CXX) $(CXX_LINK_O) $+ $(CODEC_UNITTEST_LDFLAGS) $(LDFLAGS)

res:
	$(QUIET)if [ ! -e res ]; then ln -s $(SRC_PATH)res .; fi
else

# Build the unit test suite into a library that is included in a project file
ifeq (ios,$(OS))
codec_unittest$(EXEEXT): $(LIBPREFIX)ut.$(LIBSUFFIX) $(LIBPREFIX)gtest.$(LIBSUFFIX) $(LIBPREFIX)$(PROJECT_NAME).$(LIBSUFFIX)
else
codec_unittest$(EXEEXT): $(LIBPREFIX)ut.$(SHAREDLIBSUFFIX)
endif

ifeq (android,$(OS))
ifeq (./,$(SRC_PATH))
codec_unittest$(EXEEXT):
ifeq ($(USE_ANT), Yes)
	cd ./test/build/android && $(NDKROOT)/ndk-build -B APP_ABI=$(APP_ABI) && android update project -t $(TARGET) -p . && ant debug
else
	$(NDK_BUILD) -C test/build/android -B
	./gradlew unittest:assembleDebug
endif

clean_Android: clean_Android_ut
clean_Android_ut:
ifeq ($(USE_ANT), Yes)
	-cd ./test/build/android && $(NDKROOT)/ndk-build APP_ABI=$(APP_ABI) clean && ant clean
else
	-$(NDK_BUILD) -C test/build/android -B clean
	-./gradlew unittest:clean
endif

endif
endif

endif
endif

# Добавлено: Правило для компиляции .asm файлов (если не определено в platform-android.mk)
%.o: %.asm
	$(QUIET_ASM)$(YASM) $(ASMFLAGS) -DPIC -o $@ $<

# Добавлено: Убедимся, что ASMFLAGS определены для x86
ifeq ($(ARCH),x86)
ASMFLAGS += -f elf32 -DPIC
else ifeq ($(ARCH),x86_64)
ASMFLAGS += -f elf64
else
ASMFLAGS += -f elf32
endif

# Добавлено: Явное указание YASM
YASM=/home/pi/android/sdk/ndk/25.2.9519653/toolchains/llvm/prebuilt/linux-x86_64/bin/yasm

-include $(OBJS:.$(OBJ)=.d)

OBJDIRS = $(sort $(dir $(OBJS)))

$(OBJDIRS):
	$(QUIET)mkdir -p $@

$(OBJS): | $(OBJDIRS)