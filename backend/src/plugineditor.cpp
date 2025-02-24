/*
  ==============================================================================

    This file contains the basic framework code for a JUCE plugin editor.

  ==============================================================================
*/

#include "pluginprocessor.hpp"
#include "plugineditor.hpp"
#include <unordered_map>

namespace {
    template <typename T>
    std::unique_ptr<T> rawToUniquePtr(juce::InputSource* ptr) {
        return std::unique_ptr<T>(static_cast<T*>(ptr));
    }
}

//==============================================================================
OpenSamplerAudioProcessorEditor::OpenSamplerAudioProcessorEditor (OpenSamplerAudioProcessor& p)
    : AudioProcessorEditor (&p), audioProcessor (p)
{
    // Make sure that before the constructor has finished, you've set the
    // editor's size to whatever you need it to be.
    addAndMakeVisible(webComponent);
    // webComponent.goToURL("http://localhost:5173/");
    webComponent.goToURL(juce::WebBrowserComponent::getResourceProviderRoot());
    setSize (1024, 768);
}

OpenSamplerAudioProcessorEditor::~OpenSamplerAudioProcessorEditor()
{
}

//==============================================================================
void OpenSamplerAudioProcessorEditor::paint (juce::Graphics& g)
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
