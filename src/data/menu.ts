// import { FileIcon, LibraryIcon, PencilIcon, EyeIcon } from "lucide-react"

export const menuItems = [
  {
    title: "File",
    items: [
      {
        title: "New Project",
        shortcut: "⌘N",
        action: "newProject"
      },
      {
        title: "Open Project",
        shortcut: "⌘O",
        submenu: [
          { title: "OSMP Project", shortcut: "Ctrl+O", action: "openOSMP" },
          { title: "SoundFont (SF2)", shortcut: "Ctrl+Shift+S", action: "openSF2" },
          { title: "Project XML", shortcut: "Ctrl+Shift+X", action: "openXML" },
          { title: "Kontakt (NKI)", shortcut: "Ctrl+Shift+N", action: "openNKI" },
        ],
      },
      {
        title: "Save As",
        shortcut: "⌘⇧S",
        submenu: [
          { title: "OSMP Project", shortcut: "Ctrl+S", action: "saveOSMP" },
          { title: "SoundFont (SF2)", action: "saveSF2" },
          { title: "Project XML", action: "saveXML" },
          { title: "Kontakt (NKI)", action: "saveNKI" },
        ],
      },
      { type: "separator" },
      {
        title: "New Instrument",
        shortcut: "⌘N",
        submenu: [
          { title: "Synthesizer", shortcut: "⌘1" },
          { title: "Sampler", shortcut: "⌘2" },
          { title: "Drum Machine", shortcut: "⌘3" },
          { title: "Effect Chain", shortcut: "⌘4" }
        ]
      },
      { title: "Save", shortcut: "⌘S" },
      { type: "separator" },
      { title: "Export Audio", shortcut: "⌘E" },
      { title: "Export MIDI", shortcut: "⌘⇧E" },
      { type: "separator" },
      { title: "Settings", shortcut: "⌘," },
      { title: "Exit" }
    ]
  },
  {
    title: "Library",
    items: [
      { title: "Import", shortcut: "⌘I" },
      { title: "Export", shortcut: "⌘E" },
      { type: "separator" },
      { title: "Browse Presets" },
      { title: "Browse Samples" },
      { title: "Manage Libraries" }
    ]
  },
  {
    title: "Edit",
    items: [
      { title: "Undo", shortcut: "⌘Z" },
      { title: "Redo", shortcut: "⌘Y" },
      { type: "separator" },
      { title: "Cut", shortcut: "⌘X" },
      { title: "Copy", shortcut: "⌘C" },
      { title: "Paste", shortcut: "⌘V" },
      { type: "separator" },
      { title: "Delete", shortcut: "Delete" },
      { title: "Select All", shortcut: "⌘A" }
    ]
  },
  {
    title: "View",
    items: [
      { title: "Zoom In", shortcut: "⌘+" },
      { title: "Zoom Out", shortcut: "⌘-" },
      { title: "Reset Zoom", shortcut: "⌘0" },
      { type: "separator" },
      { title: "Show Grid", shortcut: "⌘G" },
      { title: "Show Timeline", shortcut: "⌘T" },
      { title: "Show Console", shortcut: "⌘L" }
    ]
  }
]
