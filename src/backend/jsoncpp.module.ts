/*
  ==============================================================================

   This file is for the JUCE project to use JsonCPP library
   https://github.com/open-source-parsers/jsoncpp

  ==============================================================================
*/

module.exports = {
  ID: 'jsoncpp',
  description: 'JsonCPP library for JSON parsing',
  
  OSXFrameworks: [],
  iOSFrameworks: [],
  
  includePaths: [
    // Where JsonCPP headers are located
    '../external/jsoncpp/include'
  ],
  
  defines: [
    'JSON_USE_EXCEPTION=0',  // Disable exceptions for embedded use
    'JSON_HAS_INT64',        // Enable 64-bit integer support
  ],
  
  // Add the actual source files
  files: [
    { path: '../external/jsoncpp/src/lib_json/json_reader.cpp', tags: ['!ios', '!tvos'] },
    { path: '../external/jsoncpp/src/lib_json/json_value.cpp', tags: ['!ios', '!tvos'] },
    { path: '../external/jsoncpp/src/lib_json/json_writer.cpp', tags: ['!ios', '!tvos'] },
  ]
};
