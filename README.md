# WikiPath - Wikipedia Journey Tracker

**Track and visualize your Wikipedia browsing journey as an interactive network graph!**

A fully client-side Chrome extension that creates beautiful visualizations of your Wikipedia exploration paths. No backend required, all data stays in your browser.

## Features

- **Automatic Tracking** - Seamlessly tracks your Wikipedia navigation
- **Interactive Visualization** - Beautiful D3.js force-directed graphs
- **Session Management** - Organizes visits into browsing sessions
- **History View** - Browse and visualize all your past sessions
- **Privacy First** - All data stored locally in your browser
- **No Backend Required** - Works completely offline after installation
- **Responsive Design** - Works on all screen sizes

## Installation

### From Chrome Web Store (Coming Soon!)
1. Visit the Chrome Web Store
2. Click "Add to Chrome"
3. Start browsing Wikipedia!

### Manual Installation (For Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder
6. The WikiPath icon will appear in your toolbar!

## How to Use

### 1. Browse Wikipedia
- Navigate to any Wikipedia article
- Click through links naturally
- The extension automatically tracks your journey

### 2. View Your Current Session
- Click the WikiPath icon in your toolbar
- See real-time stats (articles visited, duration)
- Click "🗺️ View My Journey" to visualize

### 3. Explore Past Sessions
- Click "📚 View All Sessions" to see your history
- View statistics across all sessions
- Click any session to visualize it
- Delete old sessions you don't want to keep

### 4. Interact with Visualizations
- **Drag** nodes to rearrange the graph
- **Scroll** to zoom in and out
- **Click** nodes to see article details
- **View on Wikipedia** opens the article in a new tab

## Understanding the Visualization

### Node Colors
- **Purple** (#667eea) - Visited once
- **Pink** (#764ba2) - Visited twice
- **Light Pink** (#f093fb) - Visited 3 times
- **Blue** (#4facfe) - Visited 4+ times

### Node Size
- Larger nodes = more visits to that article
- Helps identify your focal points

### Arrows
- Show the direction of navigation
- From one article to the next

## Technical Details

### Architecture
- **100% Client-Side** - No backend server needed
- **Data Storage** - Chrome's local storage API
- **Visualization** - D3.js v7 force-directed graph
- **Framework** - Vanilla JavaScript (lightweight!)

### Data Structure
```javascript
{
  id: "session_1234567890_abc",
  startedAt: 1234567890000,
  endedAt: 1234567890000,
  visits: [
    {
      article: "Pizza",
      url: "https://en.wikipedia.org/wiki/Pizza",
      timestamp: 1234567890000,
      referrer: "Italy",
      language: "en"
    }
  ]
}
```

### Session Management
- New session starts on first Wikipedia visit
- Session ends after 30 minutes of inactivity
- Or when all Wikipedia tabs are closed
- Past sessions saved automatically

## Privacy

- **Local Storage Only** - All data stays in your browser
- **No Analytics** - We don't track anything
- **No External Requests** - No data sent to any server
- **Open Source** - Review the code yourself
- **You Own Your Data** - Export/delete anytime

## Development

### Project Structure
```
wikipath-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (tracks navigation)
├── popup.html/css/js      # Extension popup interface
├── visualize.html         # D3.js visualization page
├── history.html           # Session history browser
└── icons/                 # Extension icons
```

### Building for Production
1. Ensure all files are in the extension folder
2. Test thoroughly in Chrome
3. Create a zip file of the extension folder
4. Upload to Chrome Web Store Developer Dashboard

### Testing
1. Load extension in developer mode
2. Visit https://en.wikipedia.org/wiki/Pizza
3. Click through 5-10 article links
4. Click extension icon
5. Click "View My Journey"
6. Verify graph displays correctly

## Chrome Web Store Checklist

- [x] Manifest V3 compliant
- [x] All required permissions documented
- [x] Privacy policy (all data local)
- [x] High-resolution icons (16, 48, 128px)
- [x] Detailed description
- [x] Screenshots for store listing
- [ ] Promotional images (1280x800, 440x280)
- [ ] Store listing copy

## Roadmap

### v1.1 (Next Release)
- [ ] Export sessions as JSON
- [ ] Import sessions from JSON
- [ ] Dark mode
- [ ] Keyboard shortcuts

### v1.2
- [ ] Timeline view (chronological)
- [ ] Search within sessions
- [ ] Filter by article category
- [ ] Statistics dashboard

### v2.0
- [ ] Optional cloud sync (with account)
- [ ] Share journeys with friends
- [ ] AI-powered insights
- [ ] Mobile companion app

## Contributing

Contributions welcome! This is an open-source project.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify!

## Acknowledgments

- **Wikipedia** - For being awesome


**Made with ❤️ for Wikipedia enthusiasts**

Start tracking your Wikipedia journey today!
