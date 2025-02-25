cmake_minimum_required(VERSION 3.15)
project(OpenSampler VERSION 1.0.0)

# Specify the C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Define build options to match the Projucer configuration
option(BUILD_VST3 "Build VST3 plugin" ON)
option(BUILD_AU "Build Audio Unit plugin" ON)
option(BUILD_STANDALONE "Build standalone application" ON)
option(JUCE_STRICT_REFCOUNTEDPOINTER "Enable strict reference counted pointers" ON)
option(JUCE_VST3_CAN_REPLACE_VST2 "VST3 plug-in can replace VST2" OFF)
option(JUCE_USE_WIN_WEBVIEW2 "Use Windows WebView2" ON)
option(JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING "Use Windows WebView2 with static linking" ON)
option(JUCE_ENABLE_LIVE_CONSTANT_EDITOR "Enable live constant editor" ON)

# Include JUCE CMake modules
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/external/JUCE/CMakeLists.txt")
    add_subdirectory(external/JUCE EXCLUDE_FROM_ALL)
else()
    message(FATAL_ERROR "JUCE not found at external/JUCE. Please clone JUCE to this location.")
endif()

# Setup jsoncpp
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/external/jsoncpp/CMakeLists.txt")
    add_subdirectory(external/jsoncpp EXCLUDE_FROM_ALL)
elseif(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/external/jsoncpp/include/json/json.h")
    # Manual setup if jsoncpp is not a CMake project
    add_library(jsoncpp INTERFACE)
    target_include_directories(jsoncpp INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}/external/jsoncpp/include
    )
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/external/jsoncpp/lib")
        target_link_directories(jsoncpp INTERFACE
            ${CMAKE_CURRENT_SOURCE_DIR}/external/jsoncpp/lib
        )
        target_link_libraries(jsoncpp INTERFACE jsoncpp)
    endif()
else()
    message(FATAL_ERROR "jsoncpp not found at external/jsoncpp.")
endif()

# Set plugin formats based on platform
set(PLUGIN_FORMATS)
if(BUILD_VST3)
    list(APPEND PLUGIN_FORMATS VST3)
endif()
if(BUILD_AU AND (APPLE OR IOS))
    list(APPEND PLUGIN_FORMATS AU)
endif()
if(BUILD_STANDALONE)
    list(APPEND PLUGIN_FORMATS Standalone)
endif()

# Define the plugin
juce_add_plugin(OpenSampler
    VERSION 1.0.0
    COMPANY_NAME "Aika"
    COMPANY_COPYRIGHT "Aika"
    COMPANY_WEBSITE ""
    COMPANY_EMAIL ""
    FORMATS ${PLUGIN_FORMATS}
    PLUGIN_MANUFACTURER_CODE "aika"
    PLUGIN_CODE "OSMP"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    VST3_CATEGORIES "Instrument"
    AU_MAIN_TYPE "kAudioUnitType_MusicDevice"
    BUNDLE_ID "com.aika.OpenSampler"
    PRODUCT_NAME "OpenSampler"
)

# Process binary resources
juce_add_binary_data(OpenSamplerResources
    SOURCES
        tmp/app.zip
)

# Add source files
target_sources(OpenSampler PRIVATE
    src/main/pluginprocessor.cpp
    src/main/plugineditor.cpp
    src/core/dsp/reverb.cpp
    src/core/sampler/parser.cpp
)

# Set header files
target_sources(OpenSampler PRIVATE
    src/main/pluginprocessor.hpp
    src/main/plugineditor.hpp
    src/core/dsp/reverb.hpp
    src/core/sampler/parser.hpp
)

# Set include directories
target_include_directories(OpenSampler PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Define JUCE dependencies and compile definitions
target_link_libraries(OpenSampler
    PRIVATE
        OpenSamplerResources
        jsoncpp
        juce::juce_audio_basics
        juce::juce_audio_devices
        juce::juce_audio_formats
        juce::juce_audio_plugin_client
        juce::juce_audio_processors
        juce::juce_audio_utils
        juce::juce_core
        juce::juce_data_structures
        juce::juce_events
        juce::juce_graphics
        juce::juce_gui_basics
        juce::juce_gui_extra
        juce::juce_midi_ci
)

# Set JUCE-specific compile definitions
target_compile_definitions(OpenSampler
    PUBLIC
        JUCE_STRICT_REFCOUNTEDPOINTER=$<BOOL:${JUCE_STRICT_REFCOUNTEDPOINTER}>
        JUCE_VST3_CAN_REPLACE_VST2=$<BOOL:${JUCE_VST3_CAN_REPLACE_VST2}>
        JUCE_USE_WIN_WEBVIEW2=$<BOOL:${JUCE_USE_WIN_WEBVIEW2}>
        JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=$<BOOL:${JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING}>
        JUCE_ENABLE_LIVE_CONSTANT_EDITOR=$<BOOL:${JUCE_ENABLE_LIVE_CONSTANT_EDITOR}>
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:OpenSampler,JUCE_PRODUCT_NAME>"
        JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:OpenSampler,JUCE_VERSION>"
)

# Configure debug/release settings
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_definitions(OpenSampler PRIVATE
        DEBUG=1
        _DEBUG=1
    )
else()
    target_compile_definitions(OpenSampler PRIVATE
        NDEBUG=1
        _NDEBUG=1
    )
    
    if(MSVC)
        # Optimize for speed in Release builds on MSVC
        target_compile_options(OpenSampler PRIVATE /O2)
    else()
        # Optimize for speed on other compilers
        target_compile_options(OpenSampler PRIVATE -O3)
    endif()
endif()

# Platform-specific settings
if(MSVC)
    # Windows-specific compiler settings
    target_compile_options(OpenSampler PRIVATE 
        /MP     # Multi-processor compilation
        /W4     # Warning level 4
    )
    
    # Set Windows subsystem for standalone app
    if(BUILD_STANDALONE)
        set_target_properties(OpenSampler_Standalone PROPERTIES WIN32_EXECUTABLE TRUE)
    endif()
elseif(APPLE)
    # macOS-specific compiler settings
    target_compile_options(OpenSampler PRIVATE
        -Wall 
        -Wno-missing-field-initializers
    )
    
    # Set macOS deployment target for better compatibility
    set_target_properties(OpenSampler PROPERTIES
        XCODE_ATTRIBUTE_MACOSX_DEPLOYMENT_TARGET "10.13"
    )
    
    # Enable Automatic Reference Counting on macOS
    set_target_properties(OpenSampler PROPERTIES 
        XCODE_ATTRIBUTE_CLANG_ENABLE_OBJC_ARC YES
    )
else()
    # Linux-specific compiler settings
    target_compile_options(OpenSampler PRIVATE
        -Wall 
        -Wno-missing-field-initializers
    )
endif()

# Installation configuration
include(GNUInstallDirs)

install(TARGETS OpenSampler
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}/vst3
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

if(APPLE AND BUILD_AU)
    install(TARGETS OpenSampler_AU
        LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}/Components
    )
endif()

if(BUILD_STANDALONE)
    install(TARGETS OpenSampler_Standalone
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
        BUNDLE DESTINATION ${CMAKE_INSTALL_BINDIR}
    )
endif()

# Add a summary message at the end of configuration
message(STATUS "")
message(STATUS "=== OpenSampler Configuration Summary ===")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Plugin formats: ${PLUGIN_FORMATS}")
message(STATUS "JUCE path: ${CMAKE_CURRENT_SOURCE_DIR}/external/JUCE")
message(STATUS "jsoncpp path: ${CMAKE_CURRENT_SOURCE_DIR}/external/jsoncpp")
message(STATUS "=======================================")
message(STATUS "")