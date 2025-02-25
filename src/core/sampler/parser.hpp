
#pragma once

#include <JuceHeader.h>
#include <json/json.h>
#include <memory>
#include <string>
#include <vector>
#include <unordered_map>

namespace Aika {

/**
 * Class for parsing and extracting data from audio sample files
 */
class SampleParser {
public:
    SampleParser();
    ~SampleParser();

    /**
     * Parse a single audio file into a sample data object
     * 
     * @param filePath Path to the audio file
     * @return JSON object with sample data or error
     */
    Json::Value parseSampleFile(const std::string& filePath);

    /**
     * Parse metadata from a filename (e.g., key number, velocity from naming pattern)
     * 
     * @param filename The filename to analyze
     * @return JSON object with extracted metadata
     */
    Json::Value parseFilenameMetadata(const std::string& filename);

private:
    /**
     * Helper function to analyze the content of an audio file
     * 
     * @param audioFile The JUCE audio format reader
     * @return SampleData structure with audio properties
     */
    Json::Value analyzeAudioContent(std::unique_ptr<juce::AudioFormatReader>& audioFile);

    /**
     * Detect loop points in the audio if they exist
     * 
     * @param audioFile The audio format reader
     * @param result The JSON result to update with loop info
     */
    void detectLoopPoints(std::unique_ptr<juce::AudioFormatReader>& audioFile, Json::Value& result);

    /**
     * Convert audio buffer to JSON-compatible format
     * 
     * @param buffer The audio buffer
     * @return JSON representation of the buffer data
     */
    Json::Value audioBufferToJson(const juce::AudioBuffer<float>& buffer);

    /**
     * Parse root note from filename patterns like "C3", "A#4", etc.
     * 
     * @param filename The filename to analyze
     * @return MIDI note number or -1 if not detected
     */
    int parseRootNoteFromFilename(const std::string& filename);

    std::unique_ptr<juce::AudioFormatManager> formatManager;
};

} // namespace Aika
