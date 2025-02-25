
#include "reverb.hpp"
#include <algorithm>
#include <cmath>

namespace Aika {
namespace DSP {

//==============================================================================
// DelayLine implementation
//==============================================================================

Reverb::DelayLine::DelayLine(int maxLengthSamples) : 
    writeIndex(0), 
    readIndex(0.0f), 
    delay(0.0f), 
    bufferSize(maxLengthSamples) 
{
    buffer.resize(maxLengthSamples, 0.0f);
}

Reverb::DelayLine::~DelayLine() {
}

void Reverb::DelayLine::setDelay(float delayInSamples) {
    delay = delayInSamples;
}

float Reverb::DelayLine::read() const {
    int readPos = static_cast<int>(writeIndex - delay + bufferSize) % bufferSize;
    return buffer[readPos];
}

float Reverb::DelayLine::readInterpolated() const {
    float readPos = static_cast<float>(writeIndex) - delay;
    while (readPos < 0.0f)
        readPos += static_cast<float>(bufferSize);
        
    int pos1 = static_cast<int>(readPos);
    int pos2 = (pos1 + 1) % bufferSize;
    float frac = readPos - static_cast<float>(pos1);
    
    return buffer[pos1] * (1.0f - frac) + buffer[pos2] * frac;
}

void Reverb::DelayLine::write(float sample) {
    buffer[writeIndex] = sample;
    writeIndex = (writeIndex + 1) % bufferSize;
}

void Reverb::DelayLine::reset() {
    std::fill(buffer.begin(), buffer.end(), 0.0f);
    writeIndex = 0;
}

//==============================================================================
// AllpassFilter implementation
//==============================================================================

Reverb::AllpassFilter::AllpassFilter(int delayLength, float g) : 
    bufferSize(delayLength), 
    writeIndex(0), 
    gain(g) 
{
    buffer.resize(delayLength, 0.0f);
}

void Reverb::AllpassFilter::setParameters(int delay, float g) {
    bufferSize = delay;
    gain = g;
    buffer.resize(delay, 0.0f);
}

float Reverb::AllpassFilter::process(float input) {
    float bufferOut = buffer[writeIndex];
    float output = -input * gain + bufferOut;
    
    buffer[writeIndex] = input + bufferOut * gain;
    writeIndex = (writeIndex + 1) % bufferSize;
    
    return output;
}

void Reverb::AllpassFilter::reset() {
    std::fill(buffer.begin(), buffer.end(), 0.0f);
    writeIndex = 0;
}

//==============================================================================
// LowPassFilter implementation
//==============================================================================

Reverb::LowPassFilter::LowPassFilter() : z1(0.0f), cutoff(0.5f) {
}

void Reverb::LowPassFilter::setCutoff(float cutoffNormalized) {
    cutoff = std::min(std::max(cutoffNormalized, 0.01f), 0.99f);
}

float Reverb::LowPassFilter::process(float input) {
    z1 = input * (1.0f - cutoff) + z1 * cutoff;
    return z1;
}

void Reverb::LowPassFilter::reset() {
    z1 = 0.0f;
}

//==============================================================================
// Main Reverb implementation
//==============================================================================

Reverb::Reverb(double sr, float maxDelaySeconds) : 
    sampleRate(sr), 
    isFrozen(false),
    feedbackGain(0.5f)
{
    // Initialize default parameters
    params.roomSize = 0.5f;
    params.dampening = 0.5f;
    params.width = 1.0f;
    params.wetLevel = 0.33f;
    params.dryLevel = 0.4f;
    params.freezeMode = false;
    
    // Initialize delay lines with different prime-number lengths for better diffusion
    const int delaySamples = static_cast<int>(maxDelaySeconds * sampleRate);
    
    // Set up comb filters
    const float delays[8] = { 1116.0f, 1188.0f, 1277.0f, 1356.0f, 1422.0f, 1491.0f, 1557.0f, 1617.0f };
    for (int i = 0; i < numCombs; ++i) {
        delayLines.emplace_back(delaySamples);
        delayLines.back().setDelay(delays[i] * sampleRate / 44100.0f);
        lowpassFilters.emplace_back();
    }
    
    // Set up allpass filters
    const float apfDelays[4] = { 556.0f, 441.0f, 341.0f, 225.0f };
    const float apfGains[4] = { 0.5f, 0.5f, 0.5f, 0.5f };
    
    for (int i = 0; i < numAllpasses; ++i) {
        int delay = static_cast<int>(apfDelays[i] * sampleRate / 44100.0f);
        allpassFilters.emplace_back(delay, apfGains[i]);
    }
    
    updateInternalParameters();
}

Reverb::~Reverb() {
}

void Reverb::setParameters(const Json::Value& params) {
    if (params.isMember("roomSize") && params["roomSize"].isNumeric()) {
        this->params.roomSize = std::min(std::max(params["roomSize"].asFloat(), 0.0f), 1.0f);
    }
    
    if (params.isMember("dampening") && params["dampening"].isNumeric()) {
        this->params.dampening = std::min(std::max(params["dampening"].asFloat(), 0.0f), 1.0f);
    }
    
    if (params.isMember("width") && params["width"].isNumeric()) {
        this->params.width = std::min(std::max(params["width"].asFloat(), 0.0f), 1.0f);
    }
    
    if (params.isMember("wetLevel") && params["wetLevel"].isNumeric()) {
        this->params.wetLevel = std::min(std::max(params["wetLevel"].asFloat(), 0.0f), 1.0f);
    }
    
    if (params.isMember("dryLevel") && params["dryLevel"].isNumeric()) {
        this->params.dryLevel = std::min(std::max(params["dryLevel"].asFloat(), 0.0f), 1.0f);
    }
    
    if (params.isMember("freezeMode") && params["freezeMode"].isBool()) {
        this->params.freezeMode = params["freezeMode"].asBool();
    }
    
    updateInternalParameters();
}

Json::Value Reverb::getParameters() const {
    Json::Value result;
    
    result["roomSize"] = params.roomSize;
    result["dampening"] = params.dampening;
    result["width"] = params.width;
    result["wetLevel"] = params.wetLevel;
    result["dryLevel"] = params.dryLevel;
    result["freezeMode"] = params.freezeMode;
    
    return result;
}

void Reverb::processBlock(const float** inBuffer, float** outBuffer, int numSamples, int numChannels) {
    for (int i = 0; i < numSamples; ++i) {
        for (int channel = 0; channel < numChannels; ++channel) {
            outBuffer[channel][i] = processSample(inBuffer[channel][i], channel % 2);
        }
    }
}

float Reverb::processSample(float input, int channel) {
    float output = 0.0f;
    float dryOut = input * params.dryLevel;
    
    // Apply all-pass filters to input
    float allpassOut = input;
    for (auto& allpass : allpassFilters) {
        allpassOut = allpass.process(allpassOut);
    }
    
    // Apply comb filters in parallel
    float combOut = 0.0f;
    for (size_t i = 0; i < delayLines.size(); ++i) {
        // Read from delay
        float delaySample = delayLines[i].readInterpolated();
        
        // Apply low-pass filter
        float dampedSample = lowpassFilters[i].process(delaySample);
        
        // Apply feedback with room size control
        float feedbackSample = isFrozen ? delaySample : dampedSample * feedbackGain;
        
        // Write back to delay line
        delayLines[i].write(allpassOut + feedbackSample);
        
        combOut += dampedSample;
    }
    
    // Mix comb outputs
    combOut /= static_cast<float>(delayLines.size());
    
    // Apply stereo width (for stereo processing)
    float wetOut;
    if (channel == 0) {
        wetOut = combOut * (1.0f + params.width) / 2.0f;
    } else {
        wetOut = combOut * (1.0f - params.width) / 2.0f;
    }
    
    // Apply wet level
    wetOut *= params.wetLevel;
    
    // Mix with dry signal
    output = wetOut + dryOut;
    
    return output;
}

void Reverb::reset() {
    // Reset all delays, filters, etc.
    for (auto& delay : delayLines) {
        delay.reset();
    }
    
    for (auto& allpass : allpassFilters) {
        allpass.reset();
    }
    
    for (auto& lowpass : lowpassFilters) {
        lowpass.reset();
    }
}

void Reverb::setSampleRate(double newSampleRate) {
    // Update delay lengths based on sample rate change
    double ratio = newSampleRate / sampleRate;
    sampleRate = newSampleRate;
    
    // Update delay lines
    for (size_t i = 0; i < delayLines.size(); ++i) {
        float currentDelay = delayLines[i].read();
        delayLines[i].setDelay(currentDelay * ratio);
    }
    
    // Reset filters since they need to be retuned
    reset();
}

void Reverb::updateInternalParameters() {
    // Update reverb parameters based on the current settings
    
    // Room size affects the feedback gain
    feedbackGain = 0.28f + params.roomSize * 0.7f;
    
    // Dampening affects the low-pass filter cutoff
    float dampeningValue = 1.0f - params.dampening * 0.95f;
    for (auto& lowpass : lowpassFilters) {
        lowpass.setCutoff(dampeningValue);
    }
    
    // Freeze mode
    isFrozen = params.freezeMode;
}

} // namespace DSP
} // namespace Aika
