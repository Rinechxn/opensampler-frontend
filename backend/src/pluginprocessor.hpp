/*
  ==============================================================================

    This file contains the basic framework code for a JUCE plugin processor.

  ==============================================================================
*/

#pragma once

#include <JuceHeader.h>

//==============================================================================
/**
*/
class OpenSamplerAudioProcessor : public juce::AudioProcessor,
                                 private juce::MidiInputCallback,
                                 private juce::Timer
{
public:
    //==============================================================================
    OpenSamplerAudioProcessor();
    ~OpenSamplerAudioProcessor() override;

    //==============================================================================
    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

   #ifndef JucePlugin_PreferredChannelConfigurations
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
   #endif

    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    //==============================================================================
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override;

    //==============================================================================
    const juce::String getName() const override;

    bool acceptsMidi() const override;
    bool producesMidi() const override;
    bool isMidiEffect() const override;
    double getTailLengthSeconds() const override;

    //==============================================================================
    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram (int index) override;
    const juce::String getProgramName (int index) override;
    void changeProgramName (int index, const juce::String& newName) override;

    //==============================================================================
    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    //==============================================================================
    // MIDI device management
    void setMidiInput(const juce::String& identifier);
    juce::StringArray getMidiInputDevices();
    void handleIncomingMidiMessage(juce::MidiInput* source, const juce::MidiMessage& message) override;
    
    // Handle MIDI events from the web interface
    void sendMidiNoteOn(int channel, int noteNumber, float velocity);
    void sendMidiNoteOff(int channel, int noteNumber);
    void sendMidiControlChange(int channel, int controllerNumber, int value);
    
    // Message passing to the web interface
    void addMidiMessageListener(std::function<void(const juce::MidiMessage&)> callback);
    void removeMidiMessageListener(std::function<void(const juce::MidiMessage&)> callback);

private:
    // Timer callback
    void timerCallback() override;
    
    //==============================================================================
    // MIDI device management
    juce::MidiInput* midiInput = nullptr;
    juce::String lastMidiInputId;
    juce::MidiBuffer pendingMidiMessages;
    juce::CriticalSection midiMessageLock;
    
    juce::Array<std::function<void(const juce::MidiMessage&)>> midiMessageListeners;
    juce::CriticalSection midiListenersLock;
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (OpenSamplerAudioProcessor)
};
