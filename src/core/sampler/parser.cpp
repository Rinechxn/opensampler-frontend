
#include "parser.hpp"
#include <regex>
#include <array>

namespace Aika {

SampleParser::SampleParser() {
    formatManager = std::make_unique<juce::AudioFormatManager>();
    formatManager->registerBasicFormats();
}

SampleParser::~SampleParser() {
    // Cleanup is handled by smart pointers
}

Json::Value SampleParser::parseSampleFile(const std::string& filePath) {
    Json::Value result;
    
    juce::File file(filePath);
    
    if (!file.existsAsFile()) {
        result["error"] = "File not found";
        return result;
    }
    
    std::unique_ptr<juce::AudioFormatReader> reader(formatManager->createReaderFor(file));
    
    if (reader == nullptr) {
        result["error"] = "Unable to read audio file format";
        return result;
    }
    
    // Extract basic information
    result["sampleRate"] = static_cast<Json::UInt64>(reader->sampleRate);
    result["channels"] = static_cast<Json::UInt>(reader->numChannels);
    result["lengthInSamples"] = static_cast<Json::UInt64>(reader->lengthInSamples);
    result["bitsPerSample"] = static_cast<Json::UInt>(reader->bitsPerSample);
    
    // Extract file metadata if available
    if (reader->metadataValues.size() > 0) {
        Json::Value metadata;
        for (const auto& pair : reader->metadataValues) {
            metadata[pair.first.toStdString()] = pair.second.toStdString();
        }
        result["metadata"] = metadata;
    }
    
    // Parse potential root note from filename
    juce::String filename = file.getFileNameWithoutExtension();
    int rootNote = parseRootNoteFromFilename(filename.toStdString());
    if (rootNote >= 0) {
        result["rootNote"] = rootNote;
    } else {
        result["rootNote"] = 60; // Default to middle C if not found
    }

    // Analyze audio content for loop points, etc.
    Json::Value audioContent = analyzeAudioContent(reader);
    result["buffer"] = audioContent["buffer"];
    
    // Add loop information if available
    detectLoopPoints(reader, result);
    
    return result;
}

Json::Value SampleParser::analyzeAudioContent(std::unique_ptr<juce::AudioFormatReader>& audioFile) {
    Json::Value result;
    
    // Read a reasonable amount of audio (limit to prevent excessive memory usage)
    const int maxSamplesToRead = static_cast<int>(std::min(audioFile->lengthInSamples, static_cast<juce::int64>(44100 * 10))); // Max 10 seconds @ 44.1kHz
    
    juce::AudioBuffer<float> buffer(static_cast<int>(audioFile->numChannels), maxSamplesToRead);
    
    audioFile->read(&buffer, 0, maxSamplesToRead, 0, true, true);
    
    result["buffer"] = audioBufferToJson(buffer);
    
    return result;
}

void SampleParser::detectLoopPoints(std::unique_ptr<juce::AudioFormatReader>& audioFile, Json::Value& result) {
    result["hasLoop"] = false;
    
    // Check for loop point metadata
    if (audioFile->metadataValues.contains("Loop0Start") && audioFile->metadataValues.contains("Loop0End")) {
        juce::String startStr = audioFile->metadataValues["Loop0Start"];
        juce::String endStr = audioFile->metadataValues["Loop0End"];
        
        juce::int64 loopStart = startStr.getLargeIntValue();
        juce::int64 loopEnd = endStr.getLargeIntValue();
        
        if (loopStart >= 0 && loopEnd > loopStart && loopEnd <= audioFile->lengthInSamples) {
            result["hasLoop"] = true;
            result["loopStart"] = static_cast<Json::UInt64>(loopStart);
            result["loopEnd"] = static_cast<Json::UInt64>(loopEnd);
        }
    }
}

Json::Value SampleParser::audioBufferToJson(const juce::AudioBuffer<float>& buffer) {
    Json::Value result;
    
    int numChannels = buffer.getNumChannels();
    int numSamples = buffer.getNumSamples();
    
    for (int channel = 0; channel < numChannels; ++channel) {
        Json::Value channelArray;
        const float* channelData = buffer.getReadPointer(channel);
        
        for (int i = 0; i < numSamples; ++i) {
            channelArray.append(channelData[i]);
        }
        
        result.append(channelArray);
    }
    
    return result;
}

int SampleParser::parseRootNoteFromFilename(const std::string& filename) {
    static std::array<std::string, 12> noteNames = {
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    };
    
    // Try to match patterns like "C3", "A#4", etc.
    std::regex notePattern("([A-G]#?)(-?[0-9])");
    std::smatch match;
    
    if (std::regex_search(filename, match, notePattern) && match.size() > 2) {
        std::string noteName = match[1].str();
        int octave = std::stoi(match[2].str());
        
        // Find the note index (0-11)
        auto noteIt = std::find(noteNames.begin(), noteNames.end(), noteName);
        if (noteIt != noteNames.end()) {
            int noteIndex = static_cast<int>(std::distance(noteNames.begin(), noteIt));
            
            // Calculate the MIDI note number (C4 = 60, middle C)
            return (octave + 1) * 12 + noteIndex;
        }
    }
    
    return -1; // Not found
}

Json::Value SampleParser::parseFilenameMetadata(const std::string& filename) {
    Json::Value result;
    
    // Extract potential root note
    int rootNote = parseRootNoteFromFilename(filename);
    if (rootNote >= 0) {
        result["rootNote"] = rootNote;
    }
    
    // Try to extract velocity from patterns like "v100", "vel127", etc.
    std::regex velocityPattern("v(?:el)?([0-9]{1,3})");
    std::smatch velMatch;
    
    if (std::regex_search(filename, velMatch, velocityPattern) && velMatch.size() > 1) {
        int velocity = std::stoi(velMatch[1].str());
        if (velocity >= 0 && velocity <= 127) {
            result["velocity"] = velocity;
        }
    }
    
    return result;
}

} // namespace Aika
