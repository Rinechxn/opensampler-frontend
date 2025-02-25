/*
  ==============================================================================

    This file contains the basic framework code for a JUCE plugin processor.

  ==============================================================================
*/

#include "pluginprocessor.hpp"
#include "plugineditor.hpp"

//==============================================================================
OpenSamplerAudioProcessor::OpenSamplerAudioProcessor()
#ifndef JucePlugin_PreferredChannelConfigurations
     : AudioProcessor (BusesProperties()
                     #if ! JucePlugin_IsMidiEffect
                      #if ! JucePlugin_IsSynth
                       .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                      #endif
                       .withOutput ("Output", juce::AudioChannelSet::stereo(), true)
                     #endif
                       )
#endif
{
    // Start the timer that checks for pending MIDI messages
    startTimer(10); // Check every 10ms
}

OpenSamplerAudioProcessor::~OpenSamplerAudioProcessor()
{
    stopTimer();
    
    // Clean up MIDI input
    if (midiInput != nullptr)
        midiInput->stop();
}

//==============================================================================
const juce::String OpenSamplerAudioProcessor::getName() const
{
    return JucePlugin_Name;
}

bool OpenSamplerAudioProcessor::acceptsMidi() const
{
   #if JucePlugin_WantsMidiInput
    return true;
   #else
    return false;
   #endif
}

bool OpenSamplerAudioProcessor::producesMidi() const
{
   #if JucePlugin_ProducesMidiOutput
    return true;
   #else
    return false;
   #endif
}

bool OpenSamplerAudioProcessor::isMidiEffect() const
{
   #if JucePlugin_IsMidiEffect
    return true;
   #else
    return false;
   #endif
}

double OpenSamplerAudioProcessor::getTailLengthSeconds() const
{
    return 0.0;
}

int OpenSamplerAudioProcessor::getNumPrograms()
{
    return 1;   // NB: some hosts don't cope very well if you tell them there are 0 programs,
                // so this should be at least 1, even if you're not really implementing programs.
}

int OpenSamplerAudioProcessor::getCurrentProgram()
{
    return 0;
}

void OpenSamplerAudioProcessor::setCurrentProgram (int index)
{
}

const juce::String OpenSamplerAudioProcessor::getProgramName (int index)
{
    return {};
}

void OpenSamplerAudioProcessor::changeProgramName (int index, const juce::String& newName)
{
}

//==============================================================================
void OpenSamplerAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    // Use this method as the place to do any pre-playback
    // initialisation that you need..
    
    // Clear any pending MIDI messages
    juce::ScopedLock lock(midiMessageLock);
    pendingMidiMessages.clear();
}

void OpenSamplerAudioProcessor::releaseResources()
{
    // When playback stops, you can use this as an opportunity to free up any
    // spare memory, etc.
    juce::ScopedLock lock(midiMessageLock);
    pendingMidiMessages.clear();
}

#ifndef JucePlugin_PreferredChannelConfigurations
bool OpenSamplerAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
  #if JucePlugin_IsMidiEffect
    juce::ignoreUnused (layouts);
    return true;
  #else
    // This is the place where you check if the layout is supported.
    // In this template code we only support mono or stereo.
    // Some plugin hosts, such as certain GarageBand versions, will only
    // load plugins that support stereo bus layouts.
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
     && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    // This checks if the input layout matches the output layout
   #if ! JucePlugin_IsSynth
    if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
        return false;
   #endif

    return true;
  #endif
}
#endif

void OpenSamplerAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    // In case we have more outputs than inputs, this code clears any output
    // channels that didn't contain input data
    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    // Add any pending MIDI messages from external sources to the buffer
    {
        juce::ScopedLock lock(midiMessageLock);
        midiMessages.addEvents(pendingMidiMessages, 0, buffer.getNumSamples(), 0);
        pendingMidiMessages.clear();
    }

    // Process incoming MIDI messages to notify listeners
    if (!midiMessages.isEmpty())
    {
        juce::ScopedLock listenersLock(midiListenersLock);
        
        if (midiMessageListeners.size() > 0)
        {
            juce::MidiBuffer::Iterator it(midiMessages);
            juce::MidiMessage message;
            int samplePosition;

            while (it.getNextEvent(message, samplePosition))
            {
                for (auto& listener : midiMessageListeners)
                {
                    if (listener != nullptr)
                        listener(message);
                }
            }
        }
    }

    // Audio processing code here (left unchanged)
    for (int channel = 0; channel < totalNumInputChannels; ++channel)
    {
        auto* channelData = buffer.getWritePointer (channel);
        // ..process audio data..
    }
}

//==============================================================================
bool OpenSamplerAudioProcessor::hasEditor() const
{
    return true;
}

juce::AudioProcessorEditor* OpenSamplerAudioProcessor::createEditor()
{
    return new OpenSamplerAudioProcessorEditor (*this);
}

//==============================================================================
void OpenSamplerAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    // Store plugin state including MIDI settings
    juce::ValueTree state("OPENSAMPLERPLUGINSTATE");
    
    // Store the last MIDI input device ID
    if (lastMidiInputId.isNotEmpty())
        state.setProperty("lastMidiInputId", lastMidiInputId, nullptr);
    
    juce::MemoryOutputStream stream(destData, true);
    state.writeToStream(stream);
}

void OpenSamplerAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    // Restore plugin state including MIDI settings
    juce::ValueTree state = juce::ValueTree::readFromData(data, sizeInBytes);
    
    if (state.isValid())
    {
        // Restore MIDI device
        if (state.hasProperty("lastMidiInputId"))
        {
            juce::String savedInputId = state.getProperty("lastMidiInputId");
            setMidiInput(savedInputId);
        }
    }
}

//==============================================================================
// MIDI device management

void OpenSamplerAudioProcessor::setMidiInput(const juce::String& identifier)
{
    if (midiInput != nullptr)
    {
        midiInput->stop();
        midiInput = nullptr;
    }

    if (identifier.isEmpty())
        return;

    auto devices = juce::MidiInput::getDevices();
    int deviceIndex = devices.indexOf(identifier);
    
    if (deviceIndex >= 0)
    {
        midiInput = juce::MidiInput::openDevice(deviceIndex, this).release();
        
        if (midiInput != nullptr)
        {
            midiInput->start();
            lastMidiInputId = identifier;
        }
    }
}

juce::StringArray OpenSamplerAudioProcessor::getMidiInputDevices()
{
    return juce::MidiInput::getDevices();
}

void OpenSamplerAudioProcessor::handleIncomingMidiMessage(juce::MidiInput* source, const juce::MidiMessage& message)
{
    // Add message to the buffer to be processed in the audio thread
    juce::ScopedLock lock(midiMessageLock);
    pendingMidiMessages.addEvent(message, 0);
}

// Handle MIDI events from the web interface
void OpenSamplerAudioProcessor::sendMidiNoteOn(int channel, int noteNumber, float velocity)
{
    auto message = juce::MidiMessage::noteOn(channel + 1, noteNumber, velocity);
    juce::ScopedLock lock(midiMessageLock);
    pendingMidiMessages.addEvent(message, 0);
}

void OpenSamplerAudioProcessor::sendMidiNoteOff(int channel, int noteNumber)
{
    auto message = juce::MidiMessage::noteOff(channel + 1, noteNumber);
    juce::ScopedLock lock(midiMessageLock);
    pendingMidiMessages.addEvent(message, 0);
}

void OpenSamplerAudioProcessor::sendMidiControlChange(int channel, int controllerNumber, int value)
{
    auto message = juce::MidiMessage::controllerEvent(channel + 1, controllerNumber, value);
    juce::ScopedLock lock(midiMessageLock);
    pendingMidiMessages.addEvent(message, 0);
}

// Listener management for passing MIDI events to the web interface
void OpenSamplerAudioProcessor::addMidiMessageListener(std::function<void(const juce::MidiMessage&)> callback)
{
    juce::ScopedLock lock(midiListenersLock);
    midiMessageListeners.add(callback);
}

void OpenSamplerAudioProcessor::removeMidiMessageListener(std::function<void(const juce::MidiMessage&)> callback)
{
    juce::ScopedLock lock(midiListenersLock);
    // Note: This might not work perfectly as it compares function objects.
    // For a more robust solution, consider using a registration ID system.
    for (int i = midiMessageListeners.size() - 1; i >= 0; i--)
    {
        // This is approximate as comparing function objects is implementation-dependent
        if (midiMessageListeners.getReference(i) == callback)
            midiMessageListeners.remove(i);
    }
}

void OpenSamplerAudioProcessor::timerCallback()
{
    // This is called periodically to check for any pending tasks
    // For example, updating UI with MIDI activity
}

//==============================================================================
// This creates new instances of the plugin..
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new OpenSamplerAudioProcessor();
}
