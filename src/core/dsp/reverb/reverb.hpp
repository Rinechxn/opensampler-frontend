
#pragma once

#include <JuceHeader.h>
#include <json/json.h>

namespace Aika {
namespace DSP {

/**
 * Advanced reverb processor based on a feedback delay network
 */
class Reverb {
public:
    /**
     * Constructor
     * @param sampleRate The sample rate at which the reverb will operate
     * @param maxDelaySeconds Maximum delay time in seconds
     */
    Reverb(double sampleRate = 44100.0, float maxDelaySeconds = 5.0f);
    
    /**
     * Destructor
     */
    ~Reverb();

    /**
     * Configure parameters from a JSON object
     * @param params JSON parameters for the reverb
     */
    void setParameters(const Json::Value& params);

    /**
     * Get the current parameter settings
     * @return JSON object with current parameter values
     */
    Json::Value getParameters() const;

    /**
     * Process a block of audio
     * @param inBuffer Input audio buffer with multiple channels
     * @param outBuffer Output audio buffer where processed audio will be written
     * @param numSamples Number of samples to process
     */
    void processBlock(const float** inBuffer, float** outBuffer, int numSamples, int numChannels);

    /**
     * Process a single sample
     * @param input Input sample (per channel)
     * @param channel Channel index
     * @return Processed output sample
     */
    float processSample(float input, int channel);

    /**
     * Reset the reverb's internal state
     */
    void reset();

    /**
     * Update sample rate (will reset internal state)
     * @param newSampleRate The new sample rate in Hz
     */
    void setSampleRate(double newSampleRate);

private:
    // Delay line implementation
    class DelayLine {
    public:
        DelayLine(int maxLengthSamples = 44100);
        ~DelayLine();
        
        void setDelay(float delayInSamples);
        float read() const;
        float readInterpolated() const;
        void write(float sample);
        void reset();
        
    private:
        std::vector<float> buffer;
        int writeIndex;
        float readIndex;
        float delay;
        int bufferSize;
    };

    // Allpass filter implementation for diffusion
    class AllpassFilter {
    public:
        AllpassFilter(int delayLength = 1000, float gain = 0.5f);
        void setParameters(int delay, float gain);
        float process(float input);
        void reset();
        
    private:
        std::vector<float> buffer;
        int bufferSize;
        int writeIndex;
        float gain;
    };

    // Low-pass filter implementation for dampening
    class LowPassFilter {
    public:
        LowPassFilter();
        void setCutoff(float cutoffNormalized);
        float process(float input);
        void reset();
        
    private:
        float z1;
        float cutoff;
    };

    // Parameter storage
    struct Parameters {
        float roomSize;    // 0.0 - 1.0
        float dampening;   // 0.0 - 1.0
        float width;       // 0.0 - 1.0
        float wetLevel;    // 0.0 - 1.0
        float dryLevel;    // 0.0 - 1.0
        bool freezeMode;   // true/false
    };

    void updateInternalParameters();

    double sampleRate;
    Parameters params;
    bool isFrozen;

    // Reverb components
    std::vector<DelayLine> delayLines;
    std::vector<AllpassFilter> allpassFilters;
    std::vector<LowPassFilter> lowpassFilters;

    float feedbackGain;
    const int numCombs = 8;
    const int numAllpasses = 4;
};

} // namespace DSP
} // namespace Aika
