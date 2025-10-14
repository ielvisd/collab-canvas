# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "CollabCanvas" [ref=e8] [cursor=pointer]:
        - /url: /canvas
      - button [ref=e11]
  - main [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - button "Add Rectangle" [ref=e19]
          - button "Add Circle" [ref=e20]
          - button "Add Text" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: "Color:"
          - textbox "Select shape color" [ref=e24] [cursor=pointer]: "#ff6b6b"
        - generic [ref=e25]:
          - button "Delete Selected" [disabled] [ref=e26]: Delete Selected
          - button "Clear All" [ref=e28]
          - button "Reset View" [ref=e29]
          - button "Add 50 Shapes" [ref=e30]
      - generic [ref=e34]: Loading canvas...
      - generic [ref=e36]:
        - generic [ref=e37]: "Shapes: 0"
        - generic [ref=e38]: "Selected: None"
        - generic [ref=e39]: "Zoom: 100%"
        - generic [ref=e40]: "Position: (0, 0)"
        - generic [ref=e41]: "Bounds: X:[-2000,2000] Y:[-2000,2000]"
  - contentinfo [ref=e42]:
    - paragraph [ref=e45]: Built with Nuxt 4, Supabase, and Konva.js
```