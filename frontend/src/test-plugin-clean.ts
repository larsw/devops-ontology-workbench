/**
 * YASR Plugin Test - Clean Implementation
 * Following the official Yasr plugin registration pattern
 */

import Yasgui from '@zazuko/yasgui'
import Yasr from '@zazuko/yasr'
import type { DownloadInfo, Plugin } from '@zazuko/yasr'
import '@zazuko/yasgui/build/yasgui.min.css'

// Debug logging function
const log = (message: string): void => {
  const debugInfo = document.getElementById('debug-info')
  const timestamp = new Date().toLocaleTimeString()
  if (debugInfo) {
    debugInfo.textContent += `[${timestamp}] ${message}\n`
  }
  console.log(`[${timestamp}] ${message}`)
}

const clearLog = (): void => {
  const debugInfo = document.getElementById('debug-info')
  if (debugInfo) {
    debugInfo.textContent = ''
  }
}

interface CustomPluginOpts {}

class CustomPlugin implements Plugin<CustomPluginOpts> {
  yasr: Yasr
  container: HTMLDivElement
  constructor(yasr: Yasr) {
    this.yasr = yasr
    this.container = document.createElement('div')
    this.container.innerHTML = `
          <h3>🎯 Custom Plugin Results</h3>
          <pre class="custom-results"></pre>`
    yasr.resultsEl.appendChild(this.container)
  }
    priority: number = 3
    hideFromSelection?: boolean = false
    label?: string = "Custom Plugin"
    options?: CustomPluginOpts = {}
    async initialize(): Promise<void> {
        log('Custom Plugin initialized')
    }
    
    download?(filename?: string): DownloadInfo | undefined {
        log('Download not implemented for Custom Plugin')
        return undefined
    }
    helpReference?: string = 'help reference goes here'

  draw() {
    const bindings = this.yasr.results.getBindings()
    this.container.querySelector('.custom-results').textContent =
      JSON.stringify(bindings, null, 2)
  }

  canHandleResults() {
    return true
  }
  getIcon() {
    const iconElement = document.createElement('span')
    iconElement.innerHTML = '🎯'
    iconElement.style.fontSize = '16px'
    return iconElement
  }
  getLabel() {
    return 'Custom'
  }
  destroy() {
    this.container.remove()
  }
}

export default CustomPlugin

// Global variables
let yasgui: Yasgui = null

/**
 * Initialize Yasgui
 */
function initializeYasgui(): void {
  if (yasgui) {
    log('⚠️ Yasgui already initialized, skipping...')
    return
  }

  Yasr.registerPlugin('customPlugin', CustomPlugin as any, true)

  yasgui = new Yasgui(document.getElementById('yasgui'), {
    yasr: Yasr.defaults
  })

  console.log(yasgui.config.yasr.plugins)

  // Optional: automatically select custom plugin after query execution
  yasgui.on('queryResponse', (_instance, _response, tabId) => {
    const tab = _instance.getTab(tabId)
    tab.yasr.selectPlugin('customPlugin')
  })

  // Set example query for testing convenience
  yasgui
    .getTab()
    .getYasqe()
    .setValue(
      `SELECT ?type (COUNT(?s) AS ?count)
WHERE { ?s a ?type }
GROUP BY ?type
ORDER BY DESC(?count)
LIMIT 10`,
    )
}

// Expose functions to window for button onclick handlers
;(window as any).clearLog = clearLog

// Initialize everything when the DOM loads
document.addEventListener('DOMContentLoaded', function () {
  log('📄 DOM Content Loaded')

  // Small delay to ensure all scripts are loaded
  setTimeout(() => {
    if (!yasgui) {
      initializeYasgui()
    }
  }, 100)
})
