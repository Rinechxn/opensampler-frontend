/*
  ==============================================================================

    This file contains the basic framework code for a JUCE plugin editor.

  ==============================================================================
*/

#include "pluginprocessor.hpp"
#include "plugineditor.hpp"
#include <unordered_map>
#include <json/json.h>

namespace {
    template <typename T>
    std::unique_ptr<T> rawToUniquePtr(juce::InputSource* ptr) {
        return std::unique_ptr<T>(static_cast<T*>(ptr));
    }
}

//==============================================================================
// MIDIBridge implementation

MIDIBridge::MIDIBridge(OpenSamplerAudioProcessor& p)
    : audioProcessor(p)
{
    // Set up MIDI message callback
    midiCallback = [this](const juce::MidiMessage& message) {
        if (!isProcessingMessage)
        {
            Json::Value jsonMessage = midiMessageToJson(message);
            sendToWeb(jsonMessage);
        }
    };
    
    // Register callback with processor
    audioProcessor.addMidiMessageListener(midiCallback);
}

MIDIBridge::~MIDIBridge()
{
    // Unregister callback
    audioProcessor.removeMidiMessageListener(midiCallback);
}

void MIDIBridge::handleWebMessage(const juce::var& message)
{
    // Set flag to avoid recursive calls
    isProcessingMessage = true;
    
    // Parse the message type
    if (message.hasProperty("type") && message.hasProperty("action") && message.hasProperty("data"))
    {
        juce::String type = message["type"];
        juce::String action = message["action"];
        juce::var data = message["data"];
        
        if (type == "midi")
        {
            if (action == "noteOn" && data.hasProperty("note") && data.hasProperty("velocity") && data.hasProperty("channel"))
            {
                int note = static_cast<int>(data["note"]);
                float velocity = static_cast<float>(static_cast<double>(data["velocity"]) / 127.0);
                int channel = static_cast<int>(data["channel"]);
                audioProcessor.sendMidiNoteOn(channel, note, velocity);
            }
            else if (action == "noteOff" && data.hasProperty("note") && data.hasProperty("channel"))
            {
                int note = static_cast<int>(data["note"]);
                int channel = static_cast<int>(data["channel"]);
                audioProcessor.sendMidiNoteOff(channel, note);
            }
            else if (action == "controlChange" && data.hasProperty("controller") && data.hasProperty("value") && data.hasProperty("channel"))
            {
                int controller = static_cast<int>(data["controller"]);
                int value = static_cast<int>(data["value"]);
                int channel = static_cast<int>(data["channel"]);
                audioProcessor.sendMidiControlChange(channel, controller, value);
            }
            else if (action == "getInputs")
            {
                // Get available MIDI input devices
                juce::StringArray devices = audioProcessor.getMidiInputDevices();
                
                Json::Value response;
                response["type"] = "midiDeviceList";
                response["data"]["inputs"] = Json::Value(Json::arrayValue);
                
                for (auto& device : devices)
                {
                    response["data"]["inputs"].append(device.toStdString());
                }
                
                sendToWeb(response);
            }
            else if (action == "selectInput" && data.hasProperty("deviceName"))
            {
                // Select MIDI input device
                juce::String deviceName = data["deviceName"].toString();
                audioProcessor.setMidiInput(deviceName);
                
                Json::Value response;
                response["type"] = "midiInputSelected";
                response["data"]["deviceName"] = deviceName.toStdString();
                sendToWeb(response);
            }
        }
    }
    
    // Reset flag
    isProcessingMessage = false;
}

Json::Value MIDIBridge::midiMessageToJson(const juce::MidiMessage& message)
{
    Json::Value jsonMessage;
    jsonMessage["type"] = "midi";
    
    if (message.isNoteOn())
    {
        jsonMessage["data"]["type"] = "noteOn";
        jsonMessage["data"]["note"] = message.getNoteNumber();
        jsonMessage["data"]["velocity"] = message.getVelocity();
        jsonMessage["data"]["channel"] = message.getChannel() - 1; // Convert 1-based to 0-based
    }
    else if (message.isNoteOff())
    {
        jsonMessage["data"]["type"] = "noteOff";
        jsonMessage["data"]["note"] = message.getNoteNumber();
        jsonMessage["data"]["channel"] = message.getChannel() - 1;
    }
    else if (message.isController())
    {
        jsonMessage["data"]["type"] = "controlChange";
        jsonMessage["data"]["controller"] = message.getControllerNumber();
        jsonMessage["data"]["value"] = message.getControllerValue();
        jsonMessage["data"]["channel"] = message.getChannel() - 1;
    }
    
    return jsonMessage;
}

void MIDIBridge::sendToWeb(const Json::Value& data)
{
    Json::FastWriter writer;
    juce::String jsonString = writer.write(data);
    
    // Get reference to editor for sending the message
    if (auto* editor = dynamic_cast<OpenSamplerAudioProcessorEditor*>(audioProcessor.getActiveEditor()))
    {
        editor->sendMessageToWebView(jsonString);
    }
}

//==============================================================================
OpenSamplerAudioProcessorEditor::OpenSamplerAudioProcessorEditor(OpenSamplerAudioProcessor& p)
    : AudioProcessorEditor(&p), audioProcessor(p)
{
    // Create MIDI bridge
    midiBridge = std::make_unique<MIDIBridge>(p);
    
    // Add web component
    addAndMakeVisible(webComponent);
    webComponent.goToURL(juce::WebBrowserComponent::getResourceProviderRoot());
    
    // Set initial size
    setSize(1024, 768);
}

OpenSamplerAudioProcessorEditor::~OpenSamplerAudioProcessorEditor()
{
    // Clean up
    midiBridge = nullptr;
}

void OpenSamplerAudioProcessorEditor::paint(juce::Graphics& g)
{
    g.fillAll(
        getLookAndFeel().findColour(juce::ResizableWindow::backgroundColourId));
}

void OpenSamplerAudioProcessorEditor::resized()
{
    webComponent.setBounds(getLocalBounds());
}

std::optional<juce::WebBrowserComponent::Resource>
OpenSamplerAudioProcessorEditor::getResource(const juce::String& url) {
    const auto urlToRetrive = url == "/"
                                ? juce::String{"index.html"}
                                : url.fromFirstOccurrenceOf("/", false, false);

    static auto streamZip = juce::MemoryInputStream(
        juce::MemoryBlock(BinaryData::app_zip, BinaryData::app_zipSize),
        true);

    static juce::ZipFile archive{streamZip};

    if (auto* entry = archive.getEntry(urlToRetrive)) {
        auto entryStream = rawToUniquePtr(archive.createStreamForEntry(*entry));
        std::vector<std::byte> result((size_t)entryStream->getTotalLength());
        entryStream->setPosition(0);
        entryStream->read(result.data(), result.size());

        auto mime = getMimeForExtension(
            entry->filename.fromLastOccurrenceOf(".", false, false).toLowerCase());
        return juce::WebBrowserComponent::Resource{std::move(result),
                                                 std::move(mime)};
    }
    return std::nullopt;
}

const char* OpenSamplerAudioProcessorEditor::getMimeForExtension(
    const juce::String& extension) {
    static const std::unordered_map<juce::String, const char*> mimeMap = {
        {{"htm"}, "text/html"},
        {{"html"}, "text/html"},
        {{"txt"}, "text/plain"},
        {{"jpg"}, "image/jpeg"},
        {{"jpeg"}, "image/jpeg"},
        {{"svg"}, "image/svg+xml"},
        {{"ico"}, "image/vnd.microsoft.icon"},
        {{"json"}, "application/json"},
        {{"png"}, "image/png"},
        {{"css"}, "text/css"},
        {{"map"}, "application/json"},
        {{"js"}, "text/javascript"},
        {{"ttf"}, "font/ttf"}};

    if (const auto it = mimeMap.find(extension.toLowerCase());
        it != mimeMap.end())
        return it->second;

    jassertfalse;
    return "";
}

void OpenSamplerAudioProcessorEditor::handleWebMessage(const juce::var& message)
{
    if (midiBridge)
    {
        midiBridge->handleWebMessage(message);
    }
}

void OpenSamplerAudioProcessorEditor::sendMessageToWebView(const juce::String& jsonMessage)
{
    // Send message to the web view
    webComponent.evaluateJavaScript("window.juceBridge.onmessage('" + jsonMessage.replace("'", "\\'") + "');");
}
