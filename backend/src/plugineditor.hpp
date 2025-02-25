/*
  ==============================================================================

    This file contains the basic framework code for a JUCE plugin editor.

  ==============================================================================
*/

#pragma once

#include <JuceHeader.h>
#include "pluginprocessor.hpp"
#include <functional>
#include <vector>
#include <memory>
#include <json/json.h>

//==============================================================================
// Custom WebBrowserComponent
struct SinglePageBrowser : juce::WebBrowserComponent {
    using WebBrowserComponent::WebBrowserComponent;

    // Prevent page loads from navigating away from our single page web app
    bool pageAboutToLoad(const juce::String& newURL) override {
        return newURL == juce::String("http://localhost:5173/") ||
            newURL == getResourceProviderRoot();
    }
};

// MIDI Bridge to handle communication between JUCE and the web interface
class MIDIBridge
{
public:
    MIDIBridge(OpenSamplerAudioProcessor& processor);
    ~MIDIBridge();
    
    // Handle messages from the web interface
    void handleWebMessage(const juce::var& message);
    
private:
    // Convert MIDI message to JSON
    Json::Value midiMessageToJson(const juce::MidiMessage& message);
    
    // Send message to web interface
    void sendToWeb(const Json::Value& data);
    
    // MIDI message callback
    std::function<void(const juce::MidiMessage&)> midiCallback;
    
    // Reference to the processor
    OpenSamplerAudioProcessor& audioProcessor;
    
    // Flag to avoid recursive calls
    bool isProcessingMessage = false;
    
    friend class OpenSamplerAudioProcessorEditor;
};

//==============================================================================
/**
*/
class OpenSamplerAudioProcessorEditor  : public juce::AudioProcessorEditor
{
public:
    OpenSamplerAudioProcessorEditor (OpenSamplerAudioProcessor&);
    ~OpenSamplerAudioProcessorEditor() override;

    //==============================================================================
    void paint (juce::Graphics&) override;
    void resized() override;

    std::optional<juce::WebBrowserComponent::Resource> getResource(const juce::String& url);
    const char* getMimeForExtension(const juce::String& extension);

    int getControlParameterIndex(juce::Component&) override {
        return controlParameterIndexReceiver.getControlParameterIndex();
    }
    
    // Handle messages from the web interface
    void handleWebMessage(const juce::var& message);
    
    // Send message to the web interface
    void sendMessageToWebView(const juce::String& jsonMessage);

private:
    // This reference is provided as a quick way for your editor to
    // access the processor object that created it.
    OpenSamplerAudioProcessor& audioProcessor;

    //==============================================================================
    juce::WebControlParameterIndexReceiver controlParameterIndexReceiver;

    juce::WebSliderRelay gainRelay{"gain"};
    juce::WebSliderRelay panRelay{"panAngle"};
    juce::WebComboBoxRelay panRuleRelay{"panRule"};
    juce::WebToggleButtonRelay bypassRelay{"bypass"};

    //==============================================================================
    SinglePageBrowser webComponent{
        juce::WebBrowserComponent::Options{}
            .withBackend(juce::WebBrowserComponent::Options::Backend::webview2)
            .withWinWebView2Options(
                juce::WebBrowserComponent::Options::WinWebView2{}
                    .withUserDataFolder(juce::File::getSpecialLocation(
                        juce::File::SpecialLocationType::tempDirectory)))
            .withOptionsFrom(gainRelay)
            .withOptionsFrom(panRelay)
            .withOptionsFrom(panRuleRelay)
            .withOptionsFrom(bypassRelay)
            .withOptionsFrom(controlParameterIndexReceiver)
            .withResourceProvider(
                [this](const auto& url) { return getResource(url); },
                juce::URL{"http://localhost:5173/"}.getOrigin())
            .withScriptMessageCallback(
                [this](const juce::String& message) { this->handleWebMessage(juce::JSON::parse(message)); },
                "juceBridge")};

    // MIDI Bridge
    std::unique_ptr<MIDIBridge> midiBridge;
    
    //==============================================================================
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (OpenSamplerAudioProcessorEditor)
};
